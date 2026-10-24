import { useEffect, useState } from 'react';
import { auth } from '@/services/firebase';
import { useAuthStore } from '@/store/auth.store';

// Admin is decided ONLY by the `admin: true` Firebase custom claim, the same
// check the backend enforces (require-admin.ts). This used to also match a
// hard-coded email list and an EXPO_PUBLIC_DEVELOPER_UID, both shipped inside
// the public app bundle; grant the claim with milbudgetbuddy-api's
// scripts/set-admin.ts instead.
//
// One token refresh per signed-in uid, shared by every caller —
// ProGateOverlay, Settings and the admin layout each used to force a fresh
// ID-token fetch on every user change.
let cached: { uid: string; promise: Promise<boolean> } | null = null;

function fetchIsAdmin(uid: string): Promise<boolean> {
  if (cached?.uid === uid) return cached.promise;
  const current = auth.currentUser;
  const promise = current
    ? current.getIdTokenResult(true).then((r) => r.claims['admin'] === true).catch(() => false)
    : Promise.resolve(false);
  cached = { uid, promise };
  return promise;
}

export function useIsAdmin(): { isAdmin: boolean; resolving: boolean } {
  const user = useAuthStore((s) => s.user);
  const [isAdmin,   setIsAdmin]   = useState(false);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    if (!user || !auth.currentUser || user.isAnonymous) {
      setIsAdmin(false);
      setResolving(false);
      return;
    }
    let active = true;
    setResolving(true);
    fetchIsAdmin(user.uid).then((admin) => {
      if (!active) return;
      setIsAdmin(admin);
      setResolving(false);
    });
    return () => { active = false; };
  }, [user]);

  return { isAdmin, resolving };
}
