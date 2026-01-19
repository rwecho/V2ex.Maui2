import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TabType } from "../schemas/tabSchema";
interface TabState {
  tabs: TabType[];
}

const defaultTabs: TabType[] = [
  { key: "tech", label: "技术", kind: "tab", tab: "tech" },
  { key: "creative", label: "创意", kind: "tab", tab: "creative" },
  { key: "play", label: "好玩", kind: "tab", tab: "play" },
  { key: "apple", label: "Apple", kind: "tab", tab: "apple" },
  { key: "jobs", label: "酷工作", kind: "tab", tab: "jobs" },
  { key: "deals", label: "交易", kind: "tab", tab: "deals" },
  { key: "city", label: "城市", kind: "tab", tab: "city" },
  { key: "qna", label: "问与答", kind: "tab", tab: "qna" },
  {
    key: "hot",
    label: "最热",
    kind: "tab",
    tab: "hot",
  },
  {
    key: "all",
    label: "全部",
    kind: "tab",
    tab: "all",
  },
  { key: "r2", label: "R2", kind: "tab", tab: "r2" },
];

export const useTabStore = create<TabState>()(
  persist(
    () => ({
      tabs: defaultTabs,
    }),
    {
      name: "tab-store",
    },
  ),
);
