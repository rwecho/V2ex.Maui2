import {
  IonBadge,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
} from "@ionic/react";
import { useEffect } from "react";
import { useTopicStore } from "../../store/topicStore";
import { useShallow } from "zustand/shallow";
import { useHistory } from "react-router";
import "./TopicList.css";

type TopicListProps = {
  tabKey: string;
  kind: string;
  tab?: string;
  isActive: boolean;
};
const TopicList = (props: TopicListProps) => {
  const { tabKey, kind, tab, isActive } = props;

  const history = useHistory();

  const topics = useTopicStore(useShallow((s) => s.topicsByKey[tabKey] ?? []));
  const loading = useTopicStore(
    useShallow((s) => s.loadingByKey[tabKey] ?? false)
  );
  const error = useTopicStore(useShallow((s) => s.errorByKey[tabKey] ?? null));

  const fetchLatestTopics = useTopicStore(
    useShallow((s) => s.fetchLatestTopics)
  );
  const fetchHotTopics = useTopicStore(useShallow((s) => s.fetchHotTopics));
  const fetchTabTopics = useTopicStore(useShallow((s) => s.fetchTabTopics));

  useEffect(() => {
    // 只有当对应 Segment 激活时才加载数据
    if (!isActive) return;

    // 如果上一次请求已经失败，不要自动重试（避免 429/死循环）。
    // 需要重试请通过 UI 触发（后续可加“重试”按钮或下拉刷新）。
    if (error) return;

    // 简单缓存：已加载过就不重复请求（后续可加下拉刷新/手动刷新来强制刷新）
    if (loading || topics.length > 0) return;

    switch (kind) {
      case "latest":
        fetchLatestTopics(tabKey);
        break;
      case "hot":
        fetchHotTopics(tabKey);
        break;
      case "tab":
        fetchTabTopics(tabKey, tab);
        break;
    }
  }, [isActive, tabKey, kind, tab]);

  const handleRefresh = async (event: CustomEvent) => {
    try {
      // 非当前 segment 时不触发刷新
      if (!isActive) return;

      switch (kind) {
        case "latest":
          await fetchLatestTopics(tabKey);
          break;
        case "hot":
          await fetchHotTopics(tabKey);
          break;
        case "tab":
          await fetchTabTopics(tabKey, tab);
          break;
      }
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event as any).detail?.complete?.();
    }
  };

  if (loading && topics.length === 0) {
    return (
      <div className="topicListLoadingRow">
        <IonSpinner name="crescent" />
        <IonText>加载中…</IonText>
      </div>
    );
  }

  if (error) {
    return (
      <div className="topicListSection">
        <IonText color="danger">加载失败：{error}</IonText>
      </div>
    );
  }

  if (!loading && topics.length === 0) {
    return (
      <div className="topicListSection">
        <IonText>
          暂无话题 {tabKey} {isActive.toString()}
        </IonText>
      </div>
    );
  }

  return (
    <>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent
          pullingIcon="chevron-down-circle-outline"
          pullingText="下拉刷新"
          refreshingSpinner="crescent"
          refreshingText="刷新中…"
        />
      </IonRefresher>
      <IonList>
        {topics.map((t) => (
          <IonItem
            key={t.id}
            button
            detail={false}
            onClick={() =>
              history.push(`/topic/${t.id}`, {
                title: t.title,
              })
            }
          >
            <IonLabel className="ion-text-wrap">
              <div className="topicListTitle">{t.title}</div>
              <div className="topicListMeta">
                {t.member?.username ? (
                  <IonText color="medium">@{t.member.username}</IonText>
                ) : null}
                {t.node?.title || t.node?.name ? (
                  <IonBadge color="light">
                    {t.node?.title ?? t.node?.name}
                  </IonBadge>
                ) : null}
                {typeof t.replies === "number" ? (
                  <IonText color="medium">💬 {t.replies}</IonText>
                ) : null}
              </div>
            </IonLabel>
          </IonItem>
        ))}
        {loading ? (
          <div className="topicListBottomLoading">
            <IonSpinner name="crescent" />
          </div>
        ) : null}
      </IonList>
    </>
  );
};

export default TopicList;
