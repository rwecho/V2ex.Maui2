import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MemberType } from "../schemas/topicSchema";

export interface SignInFormInfo {
  usernameFieldName: string;
  passwordFieldName: string;
  captchaFieldName: string;
  once: string;
  captchaImage: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: MemberType | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAuthenticated: (user: MemberType) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,

      setAuthenticated: (user) =>
        set({
          isAuthenticated: true,
          user,
          error: null,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error, isLoading: false }),

      clearError: () => set({ error: null }),

      signOut: () =>
        set({
          isAuthenticated: false,
          user: null,
          error: null,
        }),
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    },
  ),
);
