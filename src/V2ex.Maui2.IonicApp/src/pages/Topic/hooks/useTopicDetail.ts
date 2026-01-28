import { useCallback, useEffect, useMemo, useState } from "react";
import { useTopicStore } from "../../../store/topicStore";
import { useShallow } from "zustand/shallow";
import { usePageAnalytics } from "../../../hooks/usePageAnalytics";

export const useTopicDetail = (id: string, initialTitle?: string) => {
  const [visibleCount, setVisibleCount] = useState(30);
  const logAnalytics = usePageAnalytics();

  const fetchTopicInfo = useTopicStore(useShallow((s) => s.fetchTopicInfo));
  const topicInfoById = useTopicStore(useShallow((s) => s.topicInfoById));
  const topicInfoLoadingById = useTopicStore(
    useShallow((s) => s.topicInfoLoadingById),
  );
  const topicInfoErrorById = useTopicStore(
    useShallow((s) => s.topicInfoErrorById),
  );

  const parsedTopicId = useMemo(() => {
    if (!id) return null;
    const n = Number.parseInt(id, 10);
    return Number.isNaN(n) ? null : n;
  }, [id]);

  const topicInfo = useMemo(() => {
    if (parsedTopicId == null) return null;
    return topicInfoById[String(parsedTopicId)] ?? null;
  }, [parsedTopicId, topicInfoById]);

  const loading = useMemo(() => {
    if (parsedTopicId == null) return false;
    return Boolean(topicInfoLoadingById[String(parsedTopicId)]);
  }, [parsedTopicId, topicInfoLoadingById]);

  const error = useMemo(() => {
    if (parsedTopicId == null) return null;
    return topicInfoErrorById[String(parsedTopicId)] ?? null;
  }, [parsedTopicId, topicInfoErrorById]);

  useEffect(() => {
    if (parsedTopicId == null) return;
    if (error || loading || topicInfo) return;
    fetchTopicInfo(parsedTopicId);
  }, [parsedTopicId, error, loading, topicInfo, fetchTopicInfo]);

  useEffect(() => {
    setVisibleCount(30);
  }, [parsedTopicId]);

  const headerTitle = useMemo(() => {
    return topicInfo?.title ?? initialTitle ?? `加载中…`;
  }, [topicInfo?.title, initialTitle]);

  const handleRefresh = useCallback(async () => {
    if (parsedTopicId != null) {
      await fetchTopicInfo(parsedTopicId, { force: true });
    }
    const latestError =
      parsedTopicId == null
        ? error
        : useTopicStore.getState().topicInfoErrorById[String(parsedTopicId)];
    
    void logAnalytics("refresh_topic", {
      topic_id: parsedTopicId ?? undefined,
      success: !latestError,
    });
    
    return latestError;
  }, [parsedTopicId, fetchTopicInfo, error, logAnalytics]);

  const handleInfinite = useCallback(async () => {
    const replyCount = topicInfo?.replies?.length ?? 0;
    const nextCount = Math.min(visibleCount + 30, replyCount);
    setVisibleCount(nextCount);
    void logAnalytics("load_more_replies", {
      topic_id: parsedTopicId ?? undefined,
      visible_count: nextCount,
    });
  }, [topicInfo?.replies?.length, visibleCount, parsedTopicId, logAnalytics]);

  return {
    parsedTopicId,
    topicInfo,
    loading,
    error,
    headerTitle,
    visibleCount,
    handleRefresh,
    handleInfinite,
  };
};
