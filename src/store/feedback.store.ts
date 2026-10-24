import { create } from 'zustand';
import { auth } from '@/services/firebase';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

async function getIdToken(forceRefresh = false): Promise<string | null> {
  try { return await auth.currentUser?.getIdToken(forceRefresh) ?? null; } catch { return null; }
}

// Admin endpoints require the `admin: true` custom claim on the ID token. A
// cached token minted before the claim was granted lacks it and gets a 403, so
// on 401/403 retry once with a force-refreshed token. Returns null when there
// is no signed-in user.
async function adminFetch(path: string, init: RequestInit = {}): Promise<Response | null> {
  const token = await getIdToken();
  if (!token) return null;
  const send = (t: string) => fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...(init.headers as Record<string, string> | undefined), Authorization: `Bearer ${t}` },
  });
  let res = await send(token);
  if (res.status === 401 || res.status === 403) {
    const fresh = await getIdToken(true);
    if (fresh && fresh !== token) res = await send(fresh);
  }
  return res;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeedbackRow {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  category: string;
  message: string;
  screen_name: string | null;
  app_version: string | null;
  device_type: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  resolved_at: string | null;
}

export interface ReportRow {
  id: string;
  report_type: string;
  start_date: string;
  end_date: string;
  feedback_count: number;
  summary: string | null;
  urgent_items: string[];
  top_categories: Record<string, number>;
  full_report?: Record<string, unknown>;
  created_at: string;
}

export interface SubmitFeedbackParams {
  category: string;
  message: string;
  screenName?: string;
  appVersion?: string;
  deviceType?: string;
  userRole?: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface FeedbackState {
  // User submission
  submitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;

  // Admin — feedback list
  adminFeedback: FeedbackRow[];
  adminTotal: number;
  // False once a page came back empty/failed or everything is loaded — the
  // screen's onEndReached checks this so a short list (always "at the end")
  // can't keep re-triggering fetches in a loop.
  adminHasMore: boolean;
  adminLoading: boolean;
  adminError: string | null;

  // Admin — reports
  reports: ReportRow[];
  reportsLoading: boolean;
  reportGenerating: boolean;
  lastGeneratedReport: ReportRow | null;

  // Actions
  submitFeedback: (params: SubmitFeedbackParams) => Promise<boolean>;
  resetSubmit: () => void;
  fetchFeedback: (filters?: { category?: string; status?: string; search?: string; offset?: number; append?: boolean }) => Promise<void>;
  updateFeedback: (id: string, updates: { status?: string; admin_notes?: string }) => Promise<boolean>;
  fetchReports: () => Promise<void>;
  generateReport: (type: 'daily' | 'weekly') => Promise<ReportRow | null>;
  fetchReportDetail: (id: string) => Promise<ReportRow | null>;
  exportFeedbackCsv: (filters?: { category?: string; status?: string; search?: string }) => Promise<string | null>;
}

// Monotonic id of the latest fetchFeedback call — a response from an older
// call (e.g. a load-more still in flight when a filter changed) is dropped
// instead of being appended onto the new filter's list.
let feedbackFetchSeq = 0;

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  submitting: false,
  submitError: null,
  submitSuccess: false,
  adminFeedback: [],
  adminTotal: 0,
  adminHasMore: false,
  adminLoading: false,
  adminError: null,
  reports: [],
  reportsLoading: false,
  reportGenerating: false,
  lastGeneratedReport: null,

  // ── Submit feedback ──────────────────────────────────────────────
  submitFeedback: async ({ category, message, screenName, appVersion, deviceType, userRole }) => {
    set({ submitting: true, submitError: null, submitSuccess: false });
    try {
      const token = await getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category,
          message,
          screen_name: screenName ?? null,
          app_version: appVersion ?? null,
          device_type: deviceType ?? null,
          user_role:   userRole ?? null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        set({ submitError: (err as { error?: string }).error ?? 'Submission failed', submitting: false });
        return false;
      }

      set({ submitSuccess: true, submitting: false });
      return true;
    } catch {
      set({ submitError: 'Network error — please try again.', submitting: false });
      return false;
    }
  },

  resetSubmit: () => set({ submitting: false, submitError: null, submitSuccess: false }),

  // ── Fetch feedback list (admin) ──────────────────────────────────
  fetchFeedback: async (filters = {}) => {
    const seq = ++feedbackFetchSeq;
    set({ adminLoading: true, adminError: null });
    try {
      const params = new URLSearchParams({ limit: '50', offset: String(filters.offset ?? 0) });
      if (filters.category) params.set('category', filters.category);
      if (filters.status)   params.set('status', filters.status);
      if (filters.search)   params.set('search', filters.search);

      const res = await adminFetch(`/api/feedback?${params}`);
      if (seq !== feedbackFetchSeq) return;
      if (!res) { set({ adminError: 'Not authorized', adminLoading: false }); return; }

      if (!res.ok) {
        // A failed load-more shouldn't wipe the already-loaded list behind an
        // error screen — only surface the error when there's nothing to show.
        set((s) => ({
          adminError: filters.append && s.adminFeedback.length > 0 ? null : (res.status === 403 ? 'Admin access required' : 'Failed to load feedback'),
          adminLoading: false,
          adminHasMore: false,
        }));
        return;
      }
      const { count, rows } = await res.json();
      if (seq !== feedbackFetchSeq) return;
      // "Load more" (onEndReached, admin/feedback.tsx) calls this with
      // append:true and offset:adminFeedback.length to fetch the next page —
      // this used to always overwrite adminFeedback with just that page, so
      // scrolling to the bottom made the list visibly jump to show only the
      // newly-fetched batch instead of growing to include it.
      set((s) => {
        const incoming = (rows ?? []) as FeedbackRow[];
        const added = filters.append
          ? incoming.filter((r) => !s.adminFeedback.some((e) => e.id === r.id))
          : incoming;
        const next = filters.append ? [...s.adminFeedback, ...added] : added;
        return {
          adminFeedback: next,
          adminTotal: count ?? 0,
          adminLoading: false,
          adminHasMore: added.length > 0 && next.length < (count ?? 0),
        };
      });
    } catch {
      if (seq !== feedbackFetchSeq) return;
      set((s) => ({
        adminError: filters.append && s.adminFeedback.length > 0 ? null : 'Network error',
        adminLoading: false,
        adminHasMore: false,
      }));
    }
  },

  // ── Update feedback (admin) ──────────────────────────────────────
  updateFeedback: async (id, updates) => {
    try {
      const res = await adminFetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res?.ok) return false;

      // Update local state
      set((s) => ({
        adminFeedback: s.adminFeedback.map((f) =>
          f.id === id ? { ...f, ...updates } : f
        ),
      }));
      return true;
    } catch { return false; }
  },

  // ── Fetch reports (admin) ────────────────────────────────────────
  fetchReports: async () => {
    set({ reportsLoading: true });
    try {
      const res = await adminFetch('/api/feedback/reports');
      if (!res?.ok) { set({ reportsLoading: false }); return; }
      const { rows } = await res.json();
      set({ reports: rows ?? [], reportsLoading: false });
    } catch {
      set({ reportsLoading: false });
    }
  },

  // ── Generate report (admin) ──────────────────────────────────────
  generateReport: async (type) => {
    set({ reportGenerating: true });
    try {
      const res = await adminFetch('/api/feedback/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_type: type }),
      });

      if (!res?.ok) { set({ reportGenerating: false }); return null; }
      const data = await res.json();

      const newReport: ReportRow = {
        id:             data.report_id ?? '',
        report_type:    data.report_type,
        start_date:     new Date(Date.now() - (type === 'daily' ? 86400000 : 604800000)).toISOString(),
        end_date:       new Date().toISOString(),
        feedback_count: data.feedback_count,
        summary:        data.summary,
        urgent_items:   data.urgent_items ?? [],
        top_categories: data.top_categories ?? {},
        created_at:     new Date().toISOString(),
      };

      set((s) => ({
        reports: [newReport, ...s.reports],
        lastGeneratedReport: newReport,
        reportGenerating: false,
      }));
      return newReport;
    } catch {
      set({ reportGenerating: false });
      return null;
    }
  },

  // ── Fetch full report detail ─────────────────────────────────────
  fetchReportDetail: async (id) => {
    try {
      const res = await adminFetch(`/api/feedback/reports/${id}`);
      if (!res?.ok) return null;
      return await res.json();
    } catch { return null; }
  },

  // ── Export feedback as CSV (admin) ────────────────────────────────
  // Calls the backend's dedicated /export endpoint (properly quote-escaped,
  // filter-aware, up to 2000 rows server-side) instead of hand-building a
  // CSV client-side from whatever page happens to be loaded in adminFeedback
  // — the previous approach silently exported only the currently-paginated
  // subset (as few as 50 of possibly hundreds of rows) with no escaping at
  // all, so a message containing a comma would misalign every column after it.
  exportFeedbackCsv: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.status)   params.set('status', filters.status);
      if (filters.search)   params.set('search', filters.search);
      const res = await adminFetch(`/api/feedback/export?${params}`);
      if (!res?.ok) return null;
      return await res.text();
    } catch { return null; }
  },
}));
