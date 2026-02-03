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
  IonIcon,
  IonActionSheet,
} from "@ionic/react";
import {
  bookmarkOutline,
  bookmark,
  documentTextOutline,
  closeOutline,
} from "ionicons/icons";
import { useHistory } from "react-router";
import type { TopicType } from "../../schemas/topicSchema";
import "./TopicList.css";
import { Haptics } from "../../utils/haptics";
import { useReadLaterStore } from "../../store/readLaterStore";
import { TopicPreviewModal } from "../../components/TopicPreviewModal";
import { useState } from "react";
import TopicListSkeleton from "./TopicListSkeleton";

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
  const { add, remove, has } = useReadLaterStore();
  const [previewTopic, setPreviewTopic] = useState<TopicType | null>(null);
  const [actionSheetTopic, setActionSheetTopic] = useState<TopicType | null>(
    null,
  );

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
            className={has(t.id) ? "topic-read-later" : ""}
            onContextMenu={(e) => {
              e.preventDefault();
              Haptics.medium();
              setActionSheetTopic(t);
            }}
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
              <div className="topicListTitle">
                {String(t.title)}
                {/* Temporarily remove icon to debug React Error 310 */}
                {has(t.id) && (
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "0.8em",
                      color: "orange",
                    }}
                  >
                    ★
                  </span>
                )}
              </div>
              <div className="topicListMeta">
                {t.member?.username ? (
                  <IonText color="medium">@{t.member.username}</IonText>
                ) : null}
                {t.node?.title || t.node?.name ? (
                  <IonBadge color="light">
                    {String(t.node?.title ?? t.node?.name ?? "")}
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

      <TopicPreviewModal
        isOpen={!!previewTopic}
        onClose={() => setPreviewTopic(null)}
        topic={previewTopic}
      />

      {actionSheetTopic && (
        <IonActionSheet
          isOpen={!!actionSheetTopic}
          onDidDismiss={() => setActionSheetTopic(null)}
          header={String(actionSheetTopic.title)}
          buttons={[
            {
              text: has(actionSheetTopic.id) ? "移除稍后阅读" : "稍后阅读",
              icon: has(actionSheetTopic.id) ? bookmarkOutline : bookmark,
              handler: () => {
                if (has(actionSheetTopic.id)) {
                  remove(actionSheetTopic.id);
                } else {
                  add(actionSheetTopic);
                }
              },
            },
            {
              text: "预览帖子",
              icon: documentTextOutline,
              handler: () => {
                setPreviewTopic(actionSheetTopic);
              },
            },
            {
              text: "取消",
              icon: closeOutline,
              role: "cancel",
            },
          ]}
        />
      )}
    </>
  );
};

export default TopicList;
