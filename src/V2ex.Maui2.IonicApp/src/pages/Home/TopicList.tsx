import {
  IonBadge,
  IonAvatar,
  IonButton,
  IonImg,
  IonItem,
  IonLabel,
  IonList,
  IonSkeletonText,
  IonSpinner,
  IonText,
} from "@ionic/react";
import { useHistory } from "react-router";
import type { TopicType } from "../../schemas/topicSchema";
import "./TopicList.css";
import { Haptics } from "../../utils/haptics";

type TopicListProps = {
  topics: TopicType[];
  loading: boolean;
  error: string | null;
  isActive: boolean;
  onRetry?: () => void | Promise<void>;
  emptyText?: string;
};

// Skeleton 加载占位组件
const TopicListSkeleton = () => {
  return (
    <IonList inset={false} lines="full">
      {[...Array(20)].map((_, index) => (
        <IonItem key={index}>
          <IonAvatar className="topicListAvatar" slot="start">
            <IonSkeletonText animated style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
          </IonAvatar>
          <IonLabel>
            <div className="topicListTitle">
              <IonSkeletonText animated style={{ width: '90%', height: '16px' }} />
            </div>
            <div className="topicListMeta" style={{ marginTop: '8px' }}>
              <IonSkeletonText animated style={{ width: '60px', height: '12px', display: 'inline-block' }} />
              <IonSkeletonText animated style={{ width: '40px', height: '18px', display: 'inline-block', marginLeft: '8px', borderRadius: '4px' }} />
              <IonSkeletonText animated style={{ width: '30px', height: '12px', display: 'inline-block', marginLeft: '8px' }} />
            </div>
          </IonLabel>
        </IonItem>
      ))}
    </IonList>
  );
};

const TopicList = (props: TopicListProps) => {
  const { topics, loading, error, isActive, onRetry, emptyText } = props;

  const history = useHistory();

  const normalizeAvatarUrl = (url?: string | null): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    if (trimmed.startsWith("https:")) return trimmed;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    // If backend returns a relative path, treat it as v2ex static.
    if (trimmed.startsWith("/")) return `https://www.v2ex.com${trimmed}`;
    return trimmed;
  };

  const getMemberAvatarUrl = (topic: TopicType): string | null => {
    const m: any = topic.member as any;
    const raw =
      topic.member?.avatarMini ??
      m?.avatar_mini ??
      m?.avatarMini ??
      m?.avatar_normal ??
      m?.avatarNormal ??
      topic.member?.avatarLarge ??
      m?.avatar_large ??
      m?.avatarLarge ??
      null;
    return normalizeAvatarUrl(raw);
  };

  const handleRetry = () => {
    if (!isActive) return;
    if (!onRetry) return;
    void onRetry();
  };

  // 使用 Skeleton 代替简单的 spinner
  if (loading && topics.length === 0) {
    return <TopicListSkeleton />;
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
      <IonList inset={false} lines="full">
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
            onClick={() => {
              Haptics.click();
              const search = t.title
                ? `?title=${encodeURIComponent(t.title)}`
                : undefined;

              history.push({
                pathname: `/topic/${t.id}`,
                search,
                state: {
                  title: t.title,
                },
              });
            }}
          >
            <IonAvatar className="topicListAvatar" slot="start">
              {(() => {
                const avatarUrl = getMemberAvatarUrl(t);
                if (avatarUrl) {
                  return (
                    <IonImg
                      src={avatarUrl}
                      alt={
                        t.member?.username
                          ? `${t.member.username} avatar`
                          : "avatar"
                      }
                    />
                  );
                }
                const initial = t.member?.username?.slice(0, 1)?.toUpperCase();
                return (
                  <div className="topicListAvatarFallback">
                    <span>{initial ?? "?"}</span>
                  </div>
                );
              })()}
            </IonAvatar>
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
      <div className="topicListBottomSpacer" aria-hidden="true" />
    </>
  );
};

export default TopicList;
