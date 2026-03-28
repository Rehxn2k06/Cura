// lib/auth-store.ts

import { create } from "zustand";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

type User = {
  email: string | null;
  name?: string | null;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  logout: () => Promise<void>;
  clearError: () => void;
};

// ✅ Zustand store (RESTORED)
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);

      set({
        user: { 
          email: res.user.email,
          name: res.user.displayName 
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.message,
        isLoading: false,
      });
    }
  },

  signup: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);

      set({
        user: { 
          email: res.user.email,
          name: res.user.displayName 
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.message,
        isLoading: false,
      });
    }
  },

  logout: async () => {
    await signOut(auth);
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  updateUser: (data) => set((state) => ({
    user: state.user ? { ...state.user, ...data } : null
  })),

  clearError: () => set({ error: null }),
}));

// ✅ THIS WAS MISSING (VERY IMPORTANT)
export const initializeAuth = () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      useAuthStore.setState({
        user: { 
          email: user.email,
          name: user.displayName 
        },
        isAuthenticated: true,
      });
    } else {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
      });
    }
  });
};