import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { fetchEntitlement } from '@/services/iap';
import { useAuthStore } from '@/store/auth.store';
import { useUserStore } from '@/store/user.store';

// Refreshes proExpiresAt from the server on app launch and whenever the app
// returns to the foreground — see fetchEntitlement()'s doc comment for why
// this exists (renewals were never reflected client-side until now).
//
// Deliberately one-directional: only ever ADOPTS a server value that grants
// MORE access than what's currently cached (a later proExpiresAt, or a first
// one where there was none). A 'free' response, a null proExpiresAt, or a
// server error is always ignored rather than clearing/shortening local
// access — this is what protects promo-code and legacy "grandfather" grants
// (see user.store.ts's hydrate()), neither of which the entitlements/{uid}
// doc this endpoint reads even knows about, from being wiped out by a
// well-meaning refresh. A genuinely expired real subscription still re-locks
// on its own via useIsPro()'s plain date comparison — this hook doesn't need
// to (and must not) do that job itself.
export function useEntitlementRefresh() {
  const authUser = useAuthStore((s) => s.user);
  const proExpiresAt = useUserStore((s) => s.proExpiresAt);
  const setProEntitlement = useUserStore((s) => s.setProEntitlement);
  // Avoid a stale closure over proExpiresAt inside the AppState listener,
  // which is registered once and never re-subscribed.
  const proExpiresAtRef = useRef(proExpiresAt);
  proExpiresAtRef.current = proExpiresAt;

  useEffect(() => {
    if (!authUser) return;

    const refresh = async () => {
      const result = await fetchEntitlement();
      if (!result || result.status !== 'pro' || !result.proExpiresAt) return;
      const current = proExpiresAtRef.current;
      if (!current || new Date(result.proExpiresAt) > new Date(current)) {
        setProEntitlement(result.proExpiresAt, 'purchase');
      }
    };

    refresh();

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [authUser, setProEntitlement]);
}
