/**
 * Lightweight analytics service — batches events and sends to the backend.
 * All events are anonymous-safe; no PII is sent unless explicitly included.
 * Falls back gracefully when offline or unauthenticated.
 */
import { auth } from '@/services/firebase';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const FLUSH_INTERVAL_MS = 30_000;
const FLUSH_BATCH_SIZE = 10;

export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean>;
  ts?: number;
};

const queue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

export function trackEvent(name: string, properties?: AnalyticsEvent['properties']) {
  queue.push({ name, properties, ts: Date.now() });
  if (queue.length >= FLUSH_BATCH_SIZE) flush();
}

export function trackScreen(screenName: string) {
  trackEvent('screen_view', { screen: screenName });
}

export function trackFeatureUsed(featureId: string) {
  trackEvent('feature_used', { feature: featureId });
}

export function trackError(label: string, details?: string) {
  trackEvent('app_error', { label, ...(details ? { details } : {}) });
}

async function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, FLUSH_BATCH_SIZE);

  try {
    const token = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // AbortSignal.timeout() isn't guaranteed to exist on every Hermes/React
    // Native build — built manually instead (see src/services/iap.ts).
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    await fetch(`${API_BASE}/api/analytics/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ events: batch }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
  } catch {
    // Silent — don't push back to queue; analytics loss is acceptable
  }
}

export function startAnalytics() {
  if (flushTimer) return;
  flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);
}

export function stopAnalytics() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  flush(); // final flush on teardown
}
