import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type FontSize = "small" | "medium" | "large";

interface FontSizeState {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

export const useFontSizeStore = create<FontSizeState>()(
  persist(
    (set) => ({
      fontSize: "medium",
      setFontSize: (fontSize) => set({ fontSize }),
    }),
    {
      name: "v2ex.fontSize",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
