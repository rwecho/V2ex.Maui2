import {
  IonBadge,
  IonButton,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonText,
} from "@ionic/react";
import { useHistory } from "react-router";
import type { TopicType } from "../../schemas/topicSchema";
import "./TopicList.css";

type TopicListProps = {
  topics: TopicType[];
  loading: boolean;
  error: string | null;
  isActive: boolean;
  onRetry?: () => void | Promise<void>;
  emptyText?: string;
};
const TopicList = (props: TopicListProps) => {
  const { topics, loading, error, isActive, onRetry, emptyText } = props;

  const history = useHistory();

  const handleRetry = () => {
    if (!isActive) return;
    if (!onRetry) return;
    void onRetry();
  };

  if (loading && topics.length === 0) {
    return (
      <div className="topicListLoadingRow">
        <IonSpinner name="crescent" />
        <IonText>加载中…</IonText>
      </div>
    );
  }

  // If we have no cached data, show a full error state.
  if (error && topics.length === 0) {
    return (
      <div className="topicListSection">
        <IonText color="danger">
          <p className="topicListErrorText">加载失败：{error}</p>
        </IonText>
        <div className="topicListErrorActions">
          <IonButton
            expand="block"
            onClick={handleRetry}
            disabled={!isActive || !onRetry}
          >
            重试
          </IonButton>
        </div>
      </div>
    );
  }

  if (!loading && topics.length === 0) {
    return (
      <div className="topicListSection">
        <IonText>{emptyText ?? "暂无话题"}</IonText>
      </div>
    );
  }

  return (
    <>
      <IonList>
        {error ? (
          <IonItem lines="none" color="warning">
            <IonLabel className="ion-text-wrap">
              <IonText color="dark">加载失败：{error}</IonText>
              <div className="topicListErrorBannerActions">
                <IonButton
                  size="small"
                  onClick={handleRetry}
                  disabled={!isActive || !onRetry}
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
