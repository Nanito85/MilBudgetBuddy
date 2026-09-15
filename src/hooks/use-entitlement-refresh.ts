import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { fetchEntitlement } from '@/services/iap';
import { useAuthStore } from '@/store/auth.store';
import { useUserStore } from '@/store/user.store';

// Refreshes proExpiresAt from the server on app launch and whenever the app
// returns to the foreground — see fetchEntitlement()'s doc comment for why
// this exists (renewals were never reflected client-side until now).
//
// Mostly one-directional: a LATER proExpiresAt than what's cached (a renewal,
// or a first grant) is always adopted. A 'free'/earlier response is trusted
// to DOWNGRADE access only when the locally cached grant's own proSource is
// 'purchase' — i.e. it's the same kind of real-IAP entitlement the backend's
// entitlements/{uid} doc (which this endpoint reads) actually tracks, so a
// genuine revocation reported for it is real. Never for proSource values
// this endpoint has no knowledge of at all: 'admin_code' (see
// server/routes/codes.ts, which writes straight to the profile doc and never
// touches entitlements/{uid}) or the local-only 'grandfather' grant (see
// user.store.ts's hydrate()) — downgrading either of those off a 'free'
// response would just be this endpoint reporting "I don't know about that
// grant" as if it meant "that grant is gone".
//
// The downgrade case exists for one specific gap: a member who gets a
// refund/chargeback keeps Play/App Store access at the platform level for
// however long is left in the period they were refunded for, and nothing
// previously re-checked that before the client's cached proExpiresAt (set at
// original purchase time) naturally passed on its own. The backend now
// actively revokes on a confirmed Android refund/expiry (see
// SubscriptionInactiveError in the backend's iap.ts) — this is what actually
// applies that cutoff client-side once it happens. iOS has no equivalent
// live re-check yet (needs Apple App Store Server API credentials that don't
// exist — see that route's comment), so this only ever fires for Android members whose entitlements/{uid} doc
// exists there.
export function useEntitlementRefresh() {
  const authUser = useAuthStore((s) => s.user);
  const proExpiresAt = useUserStore((s) => s.proExpiresAt);
  const proSource = useUserStore((s) => s.proSource);
  const setProEntitlement = useUserStore((s) => s.setProEntitlement);
  // Avoid a stale closure inside the AppState listener, which is registered
  // once and never re-subscribed.
  const proExpiresAtRef = useRef(proExpiresAt);
  proExpiresAtRef.current = proExpiresAt;
  const proSourceRef = useRef(proSource);
  proSourceRef.current = proSource;

  useEffect(() => {
    if (!authUser) return;

    const refresh = async () => {
      const result = await fetchEntitlement();
      if (!result) return;
      const current = proExpiresAtRef.current;

      if (result.status === 'pro' && result.proExpiresAt) {
        if (!current || new Date(result.proExpiresAt) > new Date(current)) {
          setProEntitlement(result.proExpiresAt, 'purchase');
        }
        return;
      }

      // A 'free' (or otherwise non-pro) response — only act on it as a
      // downgrade if the cached grant is the kind this endpoint actually
      // knows about. See the doc comment above.
      if (proSourceRef.current === 'purchase' && result.proExpiresAt) {
        if (!current || new Date(result.proExpiresAt) < new Date(current)) {
          setProEntitlement(result.proExpiresAt, 'purchase');
        }
      }
    };

    refresh();

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [authUser, setProEntitlement]);
}
