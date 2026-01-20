export type AnalyticsParams = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Bridge-based Firebase Analytics helper (native side logs events via MAUI bridge)
 */
export interface FirebaseAnalyticsBridge {
  logEvent(eventName: string, parameters?: AnalyticsParams): Promise<void>;
}

// This function expects a bridge caller that matches HybridWebView.InvokeDotNet signature
export const createFirebaseAnalytics = (
  invokeBridge: (
    method: string,
    args?: unknown[] | Record<string, unknown>,
  ) => Promise<string>,
): FirebaseAnalyticsBridge => {
  return {
    async logEvent(
      eventName: string,
      parameters?: AnalyticsParams,
    ): Promise<void> {
      const result = await invokeBridge("TrackAnalyticsEventAsync", [
        eventName,
        parameters ?? null,
      ]);
      if (result && result.startsWith("error")) {
        throw new Error(result);
      }
    },
  };
};
