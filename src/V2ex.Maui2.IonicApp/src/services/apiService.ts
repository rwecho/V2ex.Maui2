import { IV2exApiService } from "./IV2exApiService";
import { HttpApiService } from "./HttpApiService";
import { MauiApiService } from "./MauiApiService";

// Export the interface for consumers
export type { IV2exApiService } from "./IV2exApiService";

let activeService: IV2exApiService | null = null;
const mauiService = new MauiApiService();

async function getService(): Promise<IV2exApiService> {
  if (activeService) return activeService;

  try {
    // Check if Bridge is available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (
      (window as any).HybridWebView &&
      (window as any).HybridWebView.InvokeDotNet
    ) {
      // Try a ping/system info
      const result = await mauiService.getSystemInfo();

      if (result?.error) {
        throw new Error("Bridge ping failed: " + result.error);
      }

      console.info("Bridge detected, using MauiApiService");
      activeService = mauiService;
      return activeService!;
    }
  } catch (e) {
    console.warn("Bridge check failed", e);
  }

  console.info("Using HttpApiService (Web Mode)");
  activeService = new HttpApiService();
  return activeService!;
}

/**
 * Proxy that auto-initializes the correct service implementation.
 * Allows synchronous usage after first async call or lazy loading.
 * Note: For React components, using a hook or async init in useEffect is recommended to ensure implementation is ready.
 * But we expose this Proxy to minimize refactoring pain of "apiService.getLatestTopics()" calls.
 */
export const apiService = new Proxy({} as IV2exApiService, {
  get: (target, prop) => {
    return async (...args: any[]) => {
      const service = await getService();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (service as any)[prop](...args);
    };
  },
});
