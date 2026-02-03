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
  IonActionSheet,
  IonIcon,
  IonAlert,
} from "@ionic/react";

import {
  TagInfoType,
  CurrentUserType,
  ReplyInfoType,
} from "../../schemas/topicSchema";

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

import { ellipsisHorizontal, flagOutline, heartOutline, chatbubbleOutline, eyeOffOutline, personOutline, personCircleOutline } from "ionicons/icons";
import { apiService } from "../../services/apiService";
import { Haptics } from "../../utils/haptics";

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
  const [onlyOP, setOnlyOP] = useState(false);

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
    hasMorePages,
    handleRefresh: handleRefreshLogic,
    handleInfinite: handleInfiniteLogic,
    removeReply,
    thankReply,
  } = useTopicDetail(id, initialTitle);

  // 2. 认证状态
  const { isAuthenticated } = useAuthStore(
    useShallow((s) => ({ isAuthenticated: s.isAuthenticated })),
  );

  // 5. Toast 状态 (迁移至原生)
  // 移除 setToastOpen, setToastMessage, toastOpen, toastMessage
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showReplyActionSheet, setShowReplyActionSheet] = useState(false);
  const [selectedReply, setSelectedReply] = useState<ReplyInfoType | null>(null);
  const [showThankAlert, setShowThankAlert] = useState(false);

  const handleReport = async () => {
    if (!parsedTopicId || !headerTitle) return;
    try {
      const result = await apiService.reportTopic(parsedTopicId, headerTitle);
      if (!result.error) {
        Haptics.success();
        apiService.showToast("举报成功");
      } else {
        Haptics.error();
        apiService.showToast(`操作失败：${result.error}`);
      }
    } catch (e) {
      Haptics.error();
      apiService.showToast("无法启动邮件客户端");
    } finally {
      setShowActionSheet(false);
    }
  };

  const handleThankReply = async () => {
    if (!selectedReply || !topicInfo?.once || !parsedTopicId) return;
    try {
      const result = await apiService.thankReply(selectedReply.id, topicInfo.once);
      if (!result.error) {
        Haptics.success();
        apiService.showToast("感谢成功");
        thankReply(parsedTopicId, selectedReply.id);
      } else {
        Haptics.error();
        apiService.showToast(`操作失败：${result.error}`);
      }
    } catch (e) {
      Haptics.error();
      apiService.showToast("操作异常");
    }
  };

  const handleIgnoreReply = async (reply: ReplyInfoType) => {
    if (!topicInfo?.once || !parsedTopicId) return;
    try {
      const result = await apiService.ignoreReply(reply.id, topicInfo.once);
      if (!result.error) {
        Haptics.success();
        apiService.showToast("已隐藏该回复");
        removeReply(parsedTopicId, reply.id);
      } else {
        Haptics.error();
        apiService.showToast(`操作失败：${result.error}`);
      }
    } catch (e) {
      Haptics.error();
      apiService.showToast("操作异常");
    }
  };

  const handleReplyToAction = (reply: ReplyInfoType) => {
    const mention = `@${reply.userName} #${reply.floor} `;
    setReplyContent((prev) => prev + mention);
    setIsReplyExpanded(true);
    setTimeout(() => {
      textareaRef.current?.setFocus();
    }, 300);
  };

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
      apiService.showToast("发表回复需要先登录 V2EX 账号");
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
    onInternalLink: (path, href, linkText, clickedElement) => {
      const usernameMatch = href.match(/\/member\/([a-zA-Z0-9_-]+)/);
      if (usernameMatch) {
        const username = usernameMatch[1];
        const replies = topicInfo?.replies ?? [];
        
        // Check if there's a floor number in the link text (e.g., "@username #33")
        // The link text might be just the username, so check the full text around it
        const parentText = clickedElement?.parentElement?.textContent || linkText || "";
        const floorMatch = parentText.match(/@[\w-]+\s*#(\d+)/);
        
        let targetReply = null;
        
        if (floorMatch) {
          // If floor number is specified, navigate to that floor
          const targetFloor = parseInt(floorMatch[1], 10);
          targetReply = replies.find((r) => r.floor === targetFloor);
        } else {
          // Otherwise, find the current floor we're viewing from
          const currentReplyElement = clickedElement?.closest("[data-reply-id]");
          const currentReplyId = currentReplyElement?.getAttribute("data-reply-id");
          const currentReply = replies.find((r) => String(r.id) === currentReplyId);
          const currentFloor = currentReply?.floor ?? Infinity;
          
          // Find the user's replies that appear BEFORE the current floor
          const userRepliesBefore = replies.filter(
            (reply) => reply.userName === username && reply.floor < currentFloor
          );
          
          // Get the most recent one (closest to current floor)
          if (userRepliesBefore.length > 0) {
            targetReply = userRepliesBefore[userRepliesBefore.length - 1];
          }
        }
        
        if (targetReply) {
          const replyElement = document.querySelector(
            `[data-reply-id="${targetReply.id}"]`,
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
    Haptics.light();
    event.detail.complete();
    apiService.showToast(refreshError ? `刷新失败：${refreshError}` : "刷新成功");
  };

  const onInfinite = async (event: CustomEvent<void>) => {
    await handleInfiniteLogic();
    Haptics.light();
    await (event.target as any).complete();
  };

  const replyCount = topicInfo?.replies?.length ?? 0;
  
  const filteredReplies = useMemo(() => {
    if (!topicInfo?.replies) return [];
    if (!onlyOP) return topicInfo.replies;
    return topicInfo.replies.filter(r => r.userName === topicInfo.userName);
  }, [topicInfo?.replies, onlyOP, topicInfo?.userName]);

  const visibleReplies = filteredReplies.slice(0, visibleCount);

  return (
    <IonPage className="topicPage">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" color={"medium"} text="" />
          </IonButtons>

          <IonTitle>{headerTitle}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => {
              Haptics.click();
              setShowActionSheet(true);
            }}>
              <IonIcon icon={ellipsisHorizontal} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonActionSheet
          isOpen={showReplyActionSheet}
          onDidDismiss={() => setShowReplyActionSheet(false)}
          header={`回复由 @${selectedReply?.userName} 发布`}
          buttons={[
            {
              text: "回复",
              icon: chatbubbleOutline,
              handler: () => {
                if (selectedReply) handleReplyToAction(selectedReply);
              },
            },
            {
              text: "感谢",
              icon: heartOutline,
              handler: () => {
                setShowThankAlert(true);
              },
            },
            {
              text: "隐藏",
              icon: eyeOffOutline,
              role: "destructive",
              handler: () => {
                if (selectedReply) handleIgnoreReply(selectedReply);
              },
            },
            {
              text: "取消",
              role: "cancel",
            },
          ]}
        />
        <IonAlert
          isOpen={showThankAlert}
          onDidDismiss={() => setShowThankAlert(false)}
          header="确认发送感谢？"
          message="发送感谢将消耗 10 个铜币。"
          buttons={[
            {
              text: "取消",
              role: "cancel",
            },
            {
              text: "确定",
              handler: () => {
                handleThankReply();
              },
            },
          ]}
        />
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header="操作"
          buttons={[
            {
              text: onlyOP ? "查看全部" : "只看楼主",
              icon: onlyOP ? personOutline : personCircleOutline,
              handler: () => {
                 setOnlyOP(!onlyOP);
                 // Reset visible count logic might be needed if infinite scroll is complex, 
                 // but for now simple filter is enough as infinite scroll handles the 'slice'.
                 // Actually infinite scroll logic in useTopicDetail might need adjustment if it relies on index,
                 // but here we are slicing the *filtered* array. 
                 // Wait, useTopicDetail handles data fetching. Rendering slicing is done here.
                 // So 'visibleCount' is just a number. If filter reduces count < visibleCount, it shows all filtered.
              }
            },
            {
              text: "举报此主题",
              icon: flagOutline,
              role: "destructive",
              handler: () => {
                handleReport();
              },
            },
            {
              text: "取消",
              role: "cancel",
            },
          ]}
        />
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
                        onClick={(r) => {
                          Haptics.click();
                          setSelectedReply(r);
                          setShowReplyActionSheet(true);
                        }}
                      />
                    ))}
                  </IonList>

                  <IonInfiniteScroll
                    threshold="160px"
                    onIonInfinite={onInfinite}
                    disabled={visibleCount >= filteredReplies.length && !hasMorePages}
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
