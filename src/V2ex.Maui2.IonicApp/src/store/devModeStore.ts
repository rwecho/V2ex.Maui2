import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DevModeState {
  devMode: boolean;
  setDevMode: (enabled: boolean) => void;
  toggleDevMode?: () => void;
}

export const useDevModeStore = create<DevModeState>()(
  persist(
    (set) => ({
      devMode: false,
      setDevMode: (enabled: boolean) => set({ devMode: enabled }),
      toggleDevMode: () => set((state) => ({ devMode: !state.devMode })),
    }),
    {
      name: "v2ex.devMode",
    },
  ),
);
