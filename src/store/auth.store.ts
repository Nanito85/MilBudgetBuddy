import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { create } from 'zustand';

import { auth } from '@/services/firebase';

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
  clearError: () => void;
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
      await createUserWithEmailAndPassword(auth, email, password);
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
    await deleteUser(current);
    set({ user: null });
  },

  clearError: () => set({ error: null }),
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
