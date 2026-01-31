import { create } from "zustand";
import { apiService } from "../services/apiService";

interface CacheState {
  lastResponseFromCache: boolean;
}

interface CacheActions {
  checkCacheStatus: () => Promise<void>;
}

export const useNetworkStore = create<CacheState & CacheActions>(
  (set) => ({
    lastResponseFromCache: false,

    checkCacheStatus: async () => {
      const res = await apiService.getCacheStatus();
      if (res.error === null) {
        set({
          lastResponseFromCache: res.data.fromCache,
        });
      }
    },
  }),
);
