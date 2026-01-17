import {
  IonBadge,
  IonButton,
  IonItem,
  IonLabel,
  IonList,
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

  const topicsRaw = useTopicStore(
    useShallow((s) => s.topicsByKey[tabKey] ?? [])
  );
  const topics = Array.isArray(topicsRaw) ? topicsRaw : [];
  const topicsShapeError =
    topicsRaw != null && !Array.isArray(topicsRaw)
      ? "列表数据格式异常（非数组）"
      : null;
  const loading = useTopicStore(
    useShallow((s) => s.loadingByKey[tabKey] ?? false)
  );
  const error = useTopicStore(useShallow((s) => s.errorByKey[tabKey] ?? null));

  const combinedError = topicsShapeError ?? error;

  const fetchLatestTopics = useTopicStore(
    useShallow((s) => s.fetchLatestTopics)
  );
  const fetchHotTopics = useTopicStore(useShallow((s) => s.fetchHotTopics));
  const fetchTabTopics = useTopicStore(useShallow((s) => s.fetchTabTopics));

  const handleRetry = async () => {
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
  };

  useEffect(() => {
    // 只有当对应 Segment 激活时才加载数据
    if (!isActive) return;

    // 如果上一次请求已经失败，不要自动重试（避免 429/死循环）。
    // 需要重试请通过 UI 触发（后续可加“重试”按钮或下拉刷新）。
    if (combinedError) return;

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

  if (loading && topics.length === 0) {
    return (
      <div className="topicListLoadingRow">
        <IonSpinner name="crescent" />
        <IonText>加载中…</IonText>
      </div>
    );
  }

  // If we have no cached data, show a full error state.
  if (combinedError && topics.length === 0) {
    return (
      <div className="topicListSection">
        <IonText color="danger">
          <p className="topicListErrorText">加载失败：{combinedError}</p>
        </IonText>
        <div className="topicListErrorActions">
          <IonButton expand="block" onClick={handleRetry} disabled={!isActive}>
            重试
          </IonButton>
        </div>
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
      <IonList>
        {combinedError ? (
          <IonItem lines="none" color="warning">
            <IonLabel className="ion-text-wrap">
              <IonText color="dark">加载失败：{combinedError}</IonText>
              <div className="topicListErrorBannerActions">
                <IonButton
                  size="small"
                  onClick={handleRetry}
                  disabled={!isActive}
                >
                  重试
                </IonButton>
              </div>
            </IonLabel>
          </IonItem>
        ) : null}
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
