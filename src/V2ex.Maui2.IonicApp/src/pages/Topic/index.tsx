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
  IonBadge,
  IonAvatar,
  IonImg,
  IonRefresher,
  IonRefresherContent,
  IonItem,
  IonLabel,
  IonList,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonToast,
  IonTextarea,
  IonFooter,
  IonIcon,
} from "@ionic/react";
import { trash, download, eye, sendOutline } from "ionicons/icons";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RouteComponentProps } from "react-router";
import { useHistory } from "react-router-dom";
import { useTopicStore } from "../../store/topicStore";
import "./Topic.css";
import { useLinkInterceptor } from "../../hooks/useLinkInterceptor";
import { useShallow } from "zustand/shallow";
import {
  ColorMode,
  getStoredMode,
  getSystemPreferredMode,
} from "../../theme/colorMode";
import { usePageAnalytics } from "../../hooks/usePageAnalytics";
import { useAuthStore } from "../../store/authStore";
import { apiService } from "../../services/apiService";

interface TopicPageProps extends RouteComponentProps<{
  id: string;
}> {}

interface RefresherEventDetail {
  complete(): void;
}

const TopicPage: React.FC<TopicPageProps> = ({ match, location }) => {
  const id = match.params.id;
  const history = useHistory();
  const [visibleCount, setVisibleCount] = useState(30);
  const [nowSeconds, setNowSeconds] = useState<number | null>(null);
  const logAnalytics = usePageAnalytics();

  // 回复相关状态
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // 认证状态
  const { isAuthenticated } = useAuthStore(
    useShallow((s) => ({ isAuthenticated: s.isAuthenticated })),
  );

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

  const fetchTopicInfo = useTopicStore(useShallow((s) => s.fetchTopicInfo));
  const updateTopicInfo = useTopicStore(useShallow((s) => s.updateTopicInfo));
  const topicInfoById = useTopicStore(useShallow((s) => s.topicInfoById));
  const topicInfoLoadingById = useTopicStore(
    useShallow((s) => s.topicInfoLoadingById),
  );
  const topicInfoErrorById = useTopicStore(
    useShallow((s) => s.topicInfoErrorById),
  );

  // 从路由状态 / URL query 获取初始 title，用于在加载前显示。
  // 说明：history state 在刷新/深链/新开页面时会丢失，query 则更稳。
  const initialTitle = useMemo(() => {
    const stateTitle = (location.state as { title?: string } | null)?.title;
    if (stateTitle) return stateTitle;

    const qs = new URLSearchParams(location.search);
    const qTitle = qs.get("title");
    return qTitle || undefined;
  }, [location.state, location.search]);

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

  // Keep relative times stable & lint-friendly (no Date.now() during render).
  useEffect(() => {
    const update = () => setNowSeconds(Math.floor(Date.now() / 1000));
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (parsedTopicId == null) return;

    // Avoid auto-retry loops (e.g. 429). Retry should be user-triggered.
    if (error) return;
    if (loading) return;
    if (topicInfo) return;

    fetchTopicInfo(parsedTopicId);
  }, [parsedTopicId, error, loading, topicInfo, fetchTopicInfo]);

  const headerTitle = useMemo(() => {
    return topicInfo?.title ?? initialTitle ?? `加载中…`;
  }, [topicInfo?.title, initialTitle, id]);
  const [colorMode] = useState<ColorMode>(
    () => getStoredMode() ?? getSystemPreferredMode(),
  );
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  useLinkInterceptor({
    onExternalLink: (url) => {
      return true;
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
    // When navigating between topics, start with the first page of replies again.
    setVisibleCount(30);
  }, [parsedTopicId]);

  useEffect(() => {
    if (parsedTopicId == null) return;
    void logAnalytics("page_view", {
      page: "topic",
      topic_id: parsedTopicId,
      title: headerTitle,
    });
  }, [parsedTopicId, headerTitle, logAnalytics]);

  const formatTime = (timestamp?: number): string => {
    if (!timestamp || nowSeconds == null) return "";
    const diff = nowSeconds - timestamp;
    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    if (parsedTopicId != null) {
      await fetchTopicInfo(parsedTopicId, { force: true });
    }
    event.detail.complete();
    const latestError =
      parsedTopicId == null
        ? error
        : useTopicStore.getState().topicInfoErrorById[String(parsedTopicId)];
    const toastMessage = latestError ? `刷新失败：${latestError}` : "刷新成功";
    void logAnalytics("refresh_topic", {
      topic_id: parsedTopicId ?? undefined,
      success: !latestError,
    });
    setToastMessage(toastMessage);
    setToastOpen(true);
  };

  const replyCount = topicInfo?.replies?.length ?? 0;
  const visibleReplies = (topicInfo?.replies ?? []).slice(0, visibleCount);

  const handleInfinite = async (event: CustomEvent<void>) => {
    const nextCount = Math.min(visibleCount + 30, replyCount);
    setVisibleCount(nextCount);
    void logAnalytics("load_more_replies", {
      topic_id: parsedTopicId ?? undefined,
      visible_count: nextCount,
    });
    // Ionic expects calling complete() to unblock the infinite scroll.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (event.target as any).complete();
  };

  // 显示登录提示
  const showLoginPrompt = useCallback(async () => {
    setToastMessage("发表回复需要先登录 V2EX 账号");
    setToastOpen(true);
    // 延迟跳转，让用户看到提示
    setTimeout(() => {
      history.push("/login");
    }, 1500);
  }, [history]);

  // 提交回复
  const handleSubmitReply = useCallback(async () => {
    if (!isAuthenticated) {
      await showLoginPrompt();
      return;
    }

    if (parsedTopicId == null) {
      setToastMessage("话题 ID 无效");
      setToastOpen(true);
      return;
    }

    const trimmedContent = replyContent.trim();
    if (!trimmedContent) {
      setToastMessage("请输入回复内容");
      setToastOpen(true);
      return;
    }
    const replyOnce = topicInfo?.once;
    if (!replyOnce) {
      setToastMessage("无法获取回复权限，请稍后重试");
      setToastOpen(true);
      return;
    }

    setIsSubmittingReply(true);

    try {
      const res = await apiService.postReply(
        parsedTopicId,
        trimmedContent,
        replyOnce,
      );

      if (res.error !== null) {
        setToastMessage(`回复失败：${res.error}`);
        void logAnalytics("post_reply", {
          topic_id: parsedTopicId,
          success: false,
          reason: res.error,
        });
      } else {
        setToastMessage("回复成功！");
        setReplyContent("");
        void logAnalytics("post_reply", {
          topic_id: parsedTopicId,
          success: true,
        });

        // 从返回的数据中更新 topic info
        const topicInfo = res.data;
        if (topicInfo) {
          // 更新 store 中的 topic info（包含最新的回复列表和 once token）
          updateTopicInfo(parsedTopicId, topicInfo);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "回复失败";
      setToastMessage(`回复失败：${errorMsg}`);
      void logAnalytics("post_reply", {
        topic_id: parsedTopicId,
        success: false,
        reason: "exception",
      });
    } finally {
      setIsSubmittingReply(false);
      setToastOpen(true);
    }
  }, [
    isAuthenticated,
    parsedTopicId,
    replyContent,
    showLoginPrompt,
    updateTopicInfo,
    logAnalytics,
  ]);

  return (
    <IonPage className="topicPage">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton color={"medium"} text="" />
          </IonButtons>
          <IonTitle>{headerTitle}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
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
          ) : loading || (!error && !topicInfo) ? (
            <div className="topicPageLoading">
              <IonSpinner name="crescent" />
              <IonText color="medium">加载中…</IonText>
            </div>
          ) : error ? (
            <div className="topicPageSection">
              <IonText color="danger">
                <p>{error}</p>
              </IonText>
              <div className="topicPageActions">
                <IonButton
                  expand="block"
                  onClick={() => fetchTopicInfo(parsedTopicId, { force: true })}
                >
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
              <div className="topicHeader">
                <h1 className="topicTitle">{topicInfo.title}</h1>

                <div className="topicMeta">
                  {topicInfo.userName ? (
                    <IonText color="medium">@{topicInfo.userName}</IonText>
                  ) : null}
                  {topicInfo.nodeName ? (
                    <IonBadge color="light">{topicInfo.nodeName}</IonBadge>
                  ) : null}
                  {topicInfo.createdText ? (
                    <IonText color="medium">{topicInfo.createdText}</IonText>
                  ) : null}
                </div>

                {topicInfo.content ? (
                  <div
                    className="topicContent prose"
                    dangerouslySetInnerHTML={{
                      __html: topicInfo.content ?? "",
                    }}
                  />
                ) : null}
              </div>

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
                    {visibleReplies.map((reply, index) => (
                      <IonItem
                        key={reply.id}
                        data-reply-id={reply.id}
                        lines="full"
                        className="replyItem"
                      >
                        <IonLabel className="ion-text-wrap">
                          <div className="replyMeta">
                            {(() => {
                              const username = reply.userName || "unknown";
                              const avatarUrl = reply.avatar
                                ? normalizeAvatarUrl(reply.avatar)
                                : null;
                              const initial = username
                                .trim()
                                .slice(0, 1)
                                .toUpperCase();

                              return avatarUrl ? (
                                <IonAvatar
                                  className="replyAvatar"
                                  aria-hidden="true"
                                >
                                  <IonImg
                                    src={avatarUrl}
                                    alt={`${username} avatar`}
                                  />
                                </IonAvatar>
                              ) : (
                                <div
                                  className="replyAvatarFallback"
                                  aria-hidden="true"
                                  title={username}
                                >
                                  {initial || "?"}
                                </div>
                              );
                            })()}
                            <span className="replyUser">
                              @{reply.userName || "unknown"}
                            </span>

                            {reply.userName === topicInfo?.userName ? (
                              <IonBadge color="medium" className="opBadge">
                                OP
                              </IonBadge>
                            ) : null}
                            <span className="replyRight">
                              #{reply.floor}
                              {reply.replyTimeText
                                ? ` · ${reply.replyTimeText}`
                                : ""}
                            </span>
                          </div>

                          {reply.content ? (
                            <div
                              className="topicContent prose"
                              dangerouslySetInnerHTML={{
                                __html: reply.content,
                              }}
                            />
                          ) : null}
                        </IonLabel>
                      </IonItem>
                    ))}
                  </IonList>

                  <IonInfiniteScroll
                    threshold="160px"
                    onIonInfinite={handleInfinite}
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

        {/* 回复输入框 */}
        {isAuthenticated && (
          <IonFooter className="topicReplyFooter">
            <IonToolbar>
              <div className="replyInputContainer">
                <IonTextarea
                  placeholder="写回复..."
                  value={replyContent}
                  onIonInput={(e) => setReplyContent(e.detail.value ?? "")}
                  rows={1}
                  autoGrow={true}
                  disabled={isSubmittingReply || !topicInfo?.once}
                  counter={true}
                  maxlength={20000}
                />
                <IonButton
                  onClick={handleSubmitReply}
                  className="replySubmitButton"
                  disabled={
                    !replyContent.trim() ||
                    isSubmittingReply ||
                    !topicInfo?.once
                  }
                >
                  {isSubmittingReply ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <IonIcon slot="icon-only" icon={sendOutline} />
                  )}
                </IonButton>
              </div>
            </IonToolbar>
          </IonFooter>
        )}
      </IonContent>
    </IonPage>
  );
};

export default TopicPage;
