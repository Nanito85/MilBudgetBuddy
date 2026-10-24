/**
 * Lightweight analytics service — batches events and sends to the backend.
 * All events are anonymous-safe; no PII is sent unless explicitly included.
 * Falls back gracefully when offline or unauthenticated.
 */
import { Platform } from 'react-native';

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

// Set once, right after a successful sign-up, and sent with the next flush so
// the backend can record which platform the account was CREATED on (the
// "platform" field below is just whatever platform flushed last, so it moves
// if the member later switches phones).
let pendingSignupPlatform: 'ios' | 'android' | null = null;

export function trackSignup() {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
  pendingSignupPlatform = Platform.OS;
  trackEvent('sign_up', { platform: Platform.OS });
  flush();
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
    // platform rides along on every flush (not per-event — cheap, and the
    // backend just upserts a single "lastKnownPlatform" record per account
    // from whichever flush arrives). This is currently the ONLY thing that
    // fills in the Admin > All Accounts screen's Platform column for a free
    // member who's never purchased or been granted Pro (previously the only
    // source, entitlements, only ever existed for paying/granted accounts).
    const signupPlatform = pendingSignupPlatform;
    const res = await fetch(`${API_BASE}/api/analytics/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ events: batch, platform: Platform.OS, ...(signupPlatform ? { signupPlatform } : {}) }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
    // Only clear once the backend accepted it (and the request was
    // authenticated -- the backend ignores signupPlatform without a uid), so
    // a failed/offline flush retries it on the next one.
    if (res.ok && token && pendingSignupPlatform === signupPlatform) pendingSignupPlatform = null;
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
