import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonButton,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonToast,
} from "@ionic/react";

import { useEffect, useMemo, useRef, useState } from "react";
import { RouteComponentProps } from "react-router";
import { useHistory } from "react-router-dom";
import "./Topic.css";
import { useLinkInterceptor } from "../../hooks/useLinkInterceptor";
import { useShallow } from "zustand/shallow";
import { usePageAnalytics } from "../../hooks/usePageAnalytics";
import { useAuthStore } from "../../store/authStore";
import { useTopicDetail } from "./hooks/useTopicDetail";
import { useTopicReply } from "./hooks/useTopicReply";

import TopicHeader from "./components/TopicHeader";
import TopicSupplements from "./components/TopicSupplements";
import ReplyItem from "./components/ReplyItem";
import TopicReplyFooter from "./components/TopicReplyFooter";
import TopicSkeleton from "./components/TopicSkeleton";
import { ReplyItem as MentionReplyItem } from "../../components/MentionPicker";

interface TopicPageProps extends RouteComponentProps<{
  id: string;
}> {}

interface RefresherEventDetail {
  complete(): void;
}

const TopicPage: React.FC<TopicPageProps> = ({ match, location }) => {
  const id = match.params.id;
  const history = useHistory();
  const [nowSeconds, setNowSeconds] = useState<number | null>(null);
  const logAnalytics = usePageAnalytics();
  const textareaRef = useRef<HTMLIonTextareaElement>(null);

  // 从路由状态 / URL query 获取初始 title
  const initialTitle = useMemo(() => {
    const stateTitle = (location.state as { title?: string } | null)?.title;
    if (stateTitle) return stateTitle;

    const qs = new URLSearchParams(location.search);
    const qTitle = qs.get("title");
    return qTitle || undefined;
  }, [location.state, location.search]);

  // 1. 数据获取 Hook
  const {
    parsedTopicId,
    topicInfo,
    loading,
    error,
    headerTitle,
    visibleCount,
    handleRefresh: handleRefreshLogic,
    handleInfinite: handleInfiniteLogic,
  } = useTopicDetail(id, initialTitle);

  // 2. 认证状态
  const { isAuthenticated } = useAuthStore(
    useShallow((s) => ({ isAuthenticated: s.isAuthenticated })),
  );

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  // 3. 回复功能 Hook
  const {
    replyContent,
    setReplyContent,
    isSubmittingReply,
    isReplyExpanded,
    setIsReplyExpanded,
    isUploadingImage,
    showEmojiPicker,
    setShowEmojiPicker,
    showMentionPicker,
    setShowMentionPicker,
    handleImageUpload,
    handleEmojiSelect,
    handleMentionSelect,
    handleSubmitReply,
  } = useTopicReply({
    parsedTopicId,
    topicInfo,
    isAuthenticated,
    textareaRef,
    showLoginPrompt: async () => {
      setToastMessage("发表回复需要先登录 V2EX 账号");
      setToastOpen(true);
      setTimeout(() => {
        history.push("/login");
      }, 1500);
    },
  });

  const normalizeAvatarUrl = (url?: string | null): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    if (trimmed.startsWith("https:")) return trimmed;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    if (trimmed.startsWith("/")) return `https://www.v2ex.com${trimmed}`;
    return trimmed;
  };

  // 准备回复列表数据 (用于 MentionPicker)
  const replyItems: MentionReplyItem[] = useMemo(() => {
    if (!topicInfo?.replies) return [];
    return topicInfo.replies.map((r) => ({
      floor: r.floor,
      username: r.userName,
      avatar: r.avatar,
      contentPreview: r.content
        ? r.content.replace(/<[^>]+>/g, "").slice(0, 50)
        : "",
    }));
  }, [topicInfo]);

  // Keep relative times stable
  useEffect(() => {
    const update = () => setNowSeconds(Math.floor(Date.now() / 1000));
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useLinkInterceptor({
    onExternalLink: (url) => {
      debugger;
      return false;
    },
    onInternalLink: (path, href) => {
      const usernameMatch = href.match(/\/member\/([a-zA-Z0-9_-]+)/);
      if (usernameMatch) {
        const username = usernameMatch[1];
        const replies = topicInfo?.replies ?? [];
        const userReplies = replies.filter(
          (reply) => reply.userName === username,
        );
        if (userReplies.length > 0) {
          const lastReply = userReplies[userReplies.length - 1];
          const replyElement = document.querySelector(
            `[data-reply-id="${lastReply.id}"]`,
          );
          if (replyElement) {
            replyElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            replyElement.classList.add("highlight");
            setTimeout(() => {
              replyElement.classList.remove("highlight");
            }, 2000);
          }
        }
        return true;
      }
      return false;
    },
  });

  useEffect(() => {
    if (parsedTopicId == null) return;
    void logAnalytics("page_view", {
      page: "topic",
      topic_id: parsedTopicId,
      title: headerTitle,
    });
  }, [parsedTopicId, headerTitle, logAnalytics]);

  const onRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    const refreshError = await handleRefreshLogic();
    event.detail.complete();
    setToastMessage(refreshError ? `刷新失败：${refreshError}` : "刷新成功");
    setToastOpen(true);
  };

  const onInfinite = async (event: CustomEvent<void>) => {
    await handleInfiniteLogic();
    await (event.target as any).complete();
  };

  const replyCount = topicInfo?.replies?.length ?? 0;
  const visibleReplies = (topicInfo?.replies ?? []).slice(0, visibleCount);

  return (
    <IonPage className="topicPage">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" color={"medium"} text="" />
          </IonButtons>
          <IonTitle>{headerTitle}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
          <IonRefresherContent
            pullingIcon="chevron-down-circle-outline"
            pullingText="下拉刷新"
            refreshingSpinner="crescent"
            refreshingText="刷新中…"
          />
        </IonRefresher>

        <div className="topicPageBody">
          {parsedTopicId == null ? (
            <div className="topicPageSection">
              <IonText color="danger">
                <p>Invalid topic id</p>
              </IonText>
            </div>
          ) : loading && !topicInfo ? (
            <TopicSkeleton />
          ) : error && !topicInfo ? (
            <div className="topicPageSection">
              <IonText color="danger">
                <p>{error}</p>
              </IonText>
              <div className="topicPageActions">
                <IonButton expand="block" onClick={() => handleRefreshLogic()}>
                  Retry
                </IonButton>
              </div>
            </div>
          ) : !topicInfo ? (
            <div className="topicPageSection">
              <IonText>
                <p>Topic not found</p>
              </IonText>
            </div>
          ) : (
            <>
              <TopicHeader topicInfo={topicInfo} />
              <TopicSupplements supplements={topicInfo.supplements ?? []} />

              <div className="replyHeader">
                <div className="replyTitle">Replies ({replyCount})</div>
              </div>

              {replyCount === 0 ? (
                <div className="topicPageSection">
                  <IonText color="medium">No replies yet</IonText>
                </div>
              ) : (
                <>
                  <IonList>
                    {visibleReplies.map((reply) => (
                      <ReplyItem
                        key={reply.id}
                        reply={reply}
                        isOP={reply.userName === topicInfo.userName}
                        normalizeAvatarUrl={normalizeAvatarUrl}
                      />
                    ))}
                  </IonList>

                  <IonInfiniteScroll
                    threshold="160px"
                    onIonInfinite={onInfinite}
                    disabled={visibleCount >= replyCount}
                  >
                    <IonInfiniteScrollContent
                      loadingSpinner="crescent"
                      loadingText="加载更多…"
                    />
                  </IonInfiniteScroll>
                </>
              )}
            </>
          )}
        </div>

        <div className="topicPageBottomSpacer" aria-hidden="true" />

        <IonToast
          isOpen={toastOpen}
          message={toastMessage}
          duration={1200}
          position="top"
          onDidDismiss={() => setToastOpen(false)}
        />

        <TopicReplyFooter
          isAuthenticated={isAuthenticated}
          isReplyExpanded={isReplyExpanded}
          setIsReplyExpanded={setIsReplyExpanded}
          replyContent={replyContent}
          setReplyContent={setReplyContent}
          isSubmittingReply={isSubmittingReply}
          isUploadingImage={isUploadingImage}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          showMentionPicker={showMentionPicker}
          setShowMentionPicker={setShowMentionPicker}
          textareaRef={textareaRef}
          handleImageUpload={handleImageUpload}
          handleEmojiSelect={handleEmojiSelect}
          handleMentionSelect={handleMentionSelect}
          handleSubmitReply={handleSubmitReply}
          replyItems={replyItems}
          canReply={!!topicInfo?.once}
        />
      </IonContent>
    </IonPage>
  );
};

export default TopicPage;
