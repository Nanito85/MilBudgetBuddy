import { create } from 'zustand';
import { auth } from '@/services/firebase';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

async function getIdToken(): Promise<string | null> {
  try { return await auth.currentUser?.getIdToken() ?? null; } catch { return null; }
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
  fetchFeedback: (filters?: { category?: string; status?: string; search?: string; offset?: number }) => Promise<void>;
  updateFeedback: (id: string, updates: { status?: string; admin_notes?: string }) => Promise<boolean>;
  fetchReports: () => Promise<void>;
  generateReport: (type: 'daily' | 'weekly') => Promise<ReportRow | null>;
  fetchReportDetail: (id: string) => Promise<ReportRow | null>;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  submitting: false,
  submitError: null,
  submitSuccess: false,
  adminFeedback: [],
  adminTotal: 0,
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
    set({ adminLoading: true, adminError: null });
    try {
      const token = await getIdToken();
      if (!token) { set({ adminError: 'Not authorized', adminLoading: false }); return; }

      const params = new URLSearchParams({ limit: '50', offset: String(filters.offset ?? 0) });
      if (filters.category) params.set('category', filters.category);
      if (filters.status)   params.set('status', filters.status);
      if (filters.search)   params.set('search', filters.search);

      const res = await fetch(`${API_BASE}/api/feedback?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) { set({ adminError: 'Failed to load feedback', adminLoading: false }); return; }
      const { count, rows } = await res.json();
      set({ adminFeedback: rows ?? [], adminTotal: count ?? 0, adminLoading: false });
    } catch {
      set({ adminError: 'Network error', adminLoading: false });
    }
  },

  // ── Update feedback (admin) ──────────────────────────────────────
  updateFeedback: async (id, updates) => {
    try {
      const token = await getIdToken();
      if (!token) return false;

      const res = await fetch(`${API_BASE}/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) return false;

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
      const token = await getIdToken();
      if (!token) { set({ reportsLoading: false }); return; }

      const res = await fetch(`${API_BASE}/api/feedback/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) { set({ reportsLoading: false }); return; }
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
      const token = await getIdToken();
      if (!token) { set({ reportGenerating: false }); return null; }

      const res = await fetch(`${API_BASE}/api/feedback/reports/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_type: type }),
      });

      if (!res.ok) { set({ reportGenerating: false }); return null; }
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
      const token = await getIdToken();
      if (!token) return null;
      const res = await fetch(`${API_BASE}/api/feedback/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  },
}));
