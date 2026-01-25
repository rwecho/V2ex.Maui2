import { useCallback } from "react";
import { apiService } from "../services/apiService";

export const usePageAnalytics = () => {
  return useCallback(
    async (
      eventName: string,
      parameters?: Record<string, string | number | boolean | null | undefined>,
    ) => {
      const res = await apiService.trackAnalyticsEvent(
        eventName,
        parameters,
      );
      if (res.error) {
        // eslint-disable-next-line no-console
        console.warn("trackAnalyticsEvent failed", res.error);
      }
    },
    [],
  );
};
