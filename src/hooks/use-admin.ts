import { useEffect, useState } from 'react';
import { auth } from '@/services/firebase';
import { useAuthStore } from '@/store/auth.store';

const ADMIN_EMAIL       = 'alonebum@protonmail.com';
const DEVELOPER_UID     = process.env.EXPO_PUBLIC_DEVELOPER_UID ?? '';

export function useIsAdmin(): { isAdmin: boolean; resolving: boolean } {
  const { user } = useAuthStore();
  const [isAdmin,   setIsAdmin]   = useState(false);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    if (!user || !auth.currentUser) {
      setIsAdmin(false);
      setResolving(false);
      return;
    }

    // Primary check: exact admin email
    if (user.email?.toLowerCase() === ADMIN_EMAIL) {
      setIsAdmin(true);
      setResolving(false);
      return;
    }

    // Secondary: UID env var (fallback for dev account)
    if (DEVELOPER_UID && user.uid === DEVELOPER_UID) {
      setIsAdmin(true);
      setResolving(false);
      return;
    }

    // Tertiary: Firebase custom claim — force-refresh so we get the latest token
    auth.currentUser
      .getIdTokenResult(true)
      .then((result) => setIsAdmin(result.claims['admin'] === true))
      .catch(() => setIsAdmin(false))
      .finally(() => setResolving(false));
  }, [user]);

  return { isAdmin, resolving };
}
