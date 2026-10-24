import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

// Records each screen change as a breadcrumb (and navigation span), so an
// error report shows the path the member took to reach it. Registered with
// the router's navigation container in app/_layout.tsx.
export const navigationIntegration = Sentry.reactNavigationIntegration();

export function initSentry() {
  if (!DSN) return; // Sentry disabled until DSN is set in .env

  Sentry.init({
    dsn: DSN,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    release: `milbudgetbuddy@${Constants.expoConfig?.version ?? '1.0.0'}`,
    tracesSampleRate: 0.1,   // 10% of transactions traced
    enableAutoSessionTracking: true,
    debug: false,
    integrations: [navigationIntegration],
  });
  // Every OTA update shares one `release` (the native app version), so tag
  // which update is actually running — lets a regression be traced to the
  // specific `eas update` that introduced it. 'embedded' = the code that
  // shipped inside the store build, no OTA applied yet.
  Sentry.setTag('update_id', Updates.updateId ?? 'embedded');
  Sentry.setTag('update_channel', Updates.channel ?? 'none');
  if (Updates.createdAt) Sentry.setTag('update_created', Updates.createdAt.toISOString());
}

// Simple djb2 hash — anonymizes the UID so Sentry never receives the raw Firebase UID
function hashUid(uid: string): string {
  let h = 5381;
  for (let i = 0; i < uid.length; i++) {
    h = ((h << 5) + h) ^ uid.charCodeAt(i);
    h = h >>> 0; // keep unsigned 32-bit
  }
  return h.toString(16);
}

export function setUserContext(uid: string | null) {
  if (!DSN) return;
  if (uid) {
    Sentry.setUser({ id: hashUid(uid) });
  } else {
    Sentry.setUser(null);
  }
}

export function captureError(err: unknown, context?: Record<string, string>) {
  if (!DSN) return;
  if (context) Sentry.setContext('extra', context);
  Sentry.captureException(err);
}

export { Sentry };
