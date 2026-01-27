import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MemberType, CurrentUserType } from "../schemas/topicSchema";

// Unified user type
export type AuthUser = Partial<MemberType> &
  Partial<CurrentUserType> & { username: string };

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  // Sets or updates the user. Merges with existing user if provided.
  setAuthenticated: (user: Partial<AuthUser>) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,

      setAuthenticated: (inputUser) => {
        const currentUser = get().user;
        // Merge existing user with new input
        const newUser = currentUser
          ? { ...currentUser, ...inputUser }
          : (inputUser as AuthUser);
        set({
          isAuthenticated: true,
          user: newUser,
          error: null,
        });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (!currentUser) return; // Cannot update if not logged in? Or valid to set?
        set({
          user: { ...currentUser, ...updates },
        });
      },

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
