import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DevModeState {
  devMode: boolean;
  setDevMode: (enabled: boolean) => void;
  unlockDevMode: () => void;
}

export const useDevModeStore = create<DevModeState>()(
  persist(
    (set) => ({
      devMode: false,
      setDevMode: (enabled: boolean) => set({ devMode: enabled }),
      unlockDevMode: () => set({ devMode: true }),
    }),
    {
      name: "v2ex.devMode",
    },
  ),
);
