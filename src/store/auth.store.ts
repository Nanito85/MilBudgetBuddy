import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { create } from 'zustand';

import { auth } from '@/services/firebase';
import { deleteCloudData } from '@/services/firestore-sync';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  init: () => () => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  clearError: () => void;
  // Returns the current Firebase user, silently creating an anonymous one
  // (no UI, no personal info collected) if nobody is signed in yet. Exists
  // so purchase verification (which needs an ID token — see
  // services/iap.ts) never has to force a real sign-up/sign-in screen in
  // front of the user first — Apple Guideline 5.1.1(v) explicitly prohibits
  // requiring registration before an IAP purchase that isn't itself
  // account-based content. An anonymous session can be upgraded to a real
  // account later (Settings > Sign In) without losing the same uid, which
  // is what actually keeps the purchase's entitlement record intact.
  ensureSignedIn: () => Promise<User>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  initialized: false,

  init: () => {
    const unsub = onAuthStateChanged(auth, (user) => {
      set({ user, initialized: true });
    });
    return unsub;
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    try {
      // If the current session is an anonymous one (created silently by the
      // paywall for a no-registration-required purchase — see
      // ensureSignedIn), LINK the new email/password credential to it
      // instead of creating an unrelated account. Linking keeps the same
      // uid, which is what the purchase's entitlement record (see
      // milbudgetbuddy-api's /api/iap/verify) is actually keyed to — a
      // plain createUserWithEmailAndPassword here would silently orphan
      // that purchase on the old anonymous uid, exactly the "lost my
      // purchase after signing up" failure this whole flow exists to avoid.
      if (auth.currentUser?.isAnonymous) {
        await linkWithCredential(auth.currentUser, EmailAuthProvider.credential(email, password));
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) {
      set({ error: friendlyError(e.code) });
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      set({ error: friendlyError(e.code) });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await signOut(auth);
    set({ user: null });
  },

  deleteAccount: async () => {
    const current = auth.currentUser;
    if (!current) return;
    // Delete synced Firestore data first — once the auth user is gone,
    // security rules would no longer allow this client to touch it.
    await deleteCloudData(current.uid);
    await deleteUser(current);
    set({ user: null });
  },

  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email);
      set({ loading: false });
      return true;
    } catch (e: any) {
      set({ error: friendlyResetError(e.code), loading: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),

  ensureSignedIn: async () => {
    if (auth.currentUser) return auth.currentUser;
    const cred = await signInAnonymously(auth);
    // onAuthStateChanged (init(), above) will also fire and set this, but
    // that's async on its own timer — set it here too so a caller awaiting
    // ensureSignedIn() can immediately trust useAuthStore.getState().user.
    set({ user: cred.user });
    return cred.user;
  },
}));

function friendlyError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':   return 'That email is already registered. Try signing in.';
    case 'auth/invalid-email':          return 'Enter a valid email address.';
    case 'auth/weak-password':          return 'Password must be at least 8 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':     return 'Incorrect email or password.';
    case 'auth/too-many-requests':      return 'Too many attempts. Try again in a few minutes.';
    case 'auth/network-request-failed': return 'No internet connection. Check your network.';
    default:                            return 'Something went wrong. Try again.';
  }
}

function friendlyResetError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':          return 'Enter a valid email address.';
    case 'auth/user-not-found':         return 'No account found with that email.';
    case 'auth/too-many-requests':      return 'Too many attempts. Try again in a few minutes.';
    case 'auth/network-request-failed': return 'No internet connection. Check your network.';
    default:                            return 'Something went wrong. Try again.';
  }
}
