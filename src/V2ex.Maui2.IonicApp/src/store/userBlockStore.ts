import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserBlockState {
  blockedUsers: string[];
  blockUser: (username: string) => void;
  unblockUser: (username: string) => void;
  isBlocked: (username: string) => boolean;
}

export const useUserBlockStore = create<UserBlockState>()(
  persist(
    (set, get) => ({
      blockedUsers: [],
      blockUser: (username: string) => {
        const current = get().blockedUsers;
        if (!current.includes(username)) {
          set({ blockedUsers: [...current, username] });
        }
      },
      unblockUser: (username: string) => {
        const current = get().blockedUsers;
        set({ blockedUsers: current.filter((u) => u !== username) });
      },
      isBlocked: (username: string) => {
        return get().blockedUsers.includes(username);
      },
    }),
    {
      name: "user-block-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
