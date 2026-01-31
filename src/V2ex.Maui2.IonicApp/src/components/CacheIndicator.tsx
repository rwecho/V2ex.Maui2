import { useNetworkStore } from "../store/networkStore";
import { useEffect } from "react";
import "./CacheIndicator.css";

export const CacheIndicator: React.FC = () => {
  const { lastResponseFromCache, checkCacheStatus } = useNetworkStore();

  useEffect(() => {
    checkCacheStatus();
  }, [checkCacheStatus]);

  if (!lastResponseFromCache) return null;

  return <div className="cache-indicator" title="来自缓存" />;
};
