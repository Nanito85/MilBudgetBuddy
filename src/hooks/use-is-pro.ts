import { useUserStore } from '@/store/user.store';

/**
 * Pro access is gated on an expiration timestamp, not a boolean. Apple/Google
 * subscriptions stay active through the period already paid for even after a
 * user cancels (auto-renew just turns off) — so this check naturally re-locks
 * the moment that period ends, with no separate "revoke" step needed.
 */
export function useIsPro(): boolean {
  const proExpiresAt = useUserStore((s) => s.proExpiresAt);
  if (!proExpiresAt) return false;
  return new Date(proExpiresAt).getTime() > Date.now();
}
