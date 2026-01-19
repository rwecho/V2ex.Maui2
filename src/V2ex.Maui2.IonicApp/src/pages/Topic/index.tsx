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
} from "@ionic/react";
import { useEffect, useMemo, useState } from "react";
import { RouteComponentProps } from "react-router";
import { useTopicStore } from "../../store/topicStore";
import "./Topic.css";
import { useShallow } from "zustand/shallow";
import {
  ColorMode,
  getStoredMode,
  getSystemPreferredMode,
} from "../../theme/colorMode";

interface TopicPageProps extends RouteComponentProps<{
  id: string;
}> {}

interface RefresherEventDetail {
  complete(): void;
}

const TopicPage: React.FC<TopicPageProps> = ({ match, location }) => {
  const id = match.params.id;
  const [visibleCount, setVisibleCount] = useState(30);
  const [nowSeconds, setNowSeconds] = useState<number | null>(null);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getMemberAvatarUrl = (member: any): string | null => {
    if (!member) return null;
    const raw =
      member.avatarMini ??
      member.avatar_mini ??
      member.avatarMini ??
      member.avatar_normal ??
      member.avatarNormal ??
      member.avatarLarge ??
      member.avatar_large ??
      member.avatarLarge ??
      null;
    return normalizeAvatarUrl(raw);
  };

  const fetchTopicDetail = useTopicStore(useShallow((s) => s.fetchTopicDetail));
  const topicDetailById = useTopicStore(useShallow((s) => s.topicDetailById));
  const topicDetailLoadingById = useTopicStore(
    useShallow((s) => s.topicDetailLoadingById),
  );
  const topicDetailErrorById = useTopicStore(
    useShallow((s) => s.topicDetailErrorById),
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

  const topicDetail = useMemo(() => {
    if (parsedTopicId == null) return null;
    return topicDetailById[String(parsedTopicId)] ?? null;
  }, [parsedTopicId, topicDetailById]);

  const loading = useMemo(() => {
    if (parsedTopicId == null) return false;
    return Boolean(topicDetailLoadingById[String(parsedTopicId)]);
  }, [parsedTopicId, topicDetailLoadingById]);

  const error = useMemo(() => {
    if (parsedTopicId == null) return null;
    return topicDetailErrorById[String(parsedTopicId)] ?? null;
  }, [parsedTopicId, topicDetailErrorById]);

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
    if (topicDetail) return;

    fetchTopicDetail(parsedTopicId);
  }, [parsedTopicId, error, loading, topicDetail, fetchTopicDetail]);

  const headerTitle = useMemo(() => {
    return topicDetail?.topic?.title ?? initialTitle ?? `加载中…`;
  }, [topicDetail?.topic?.title, initialTitle, id]);
  const [colorMode] = useState<ColorMode>(
    () => getStoredMode() ?? getSystemPreferredMode(),
  );
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  useEffect(() => {
    // When navigating between topics, start with the first page of replies again.
    setVisibleCount(30);
  }, [parsedTopicId]);

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
      await fetchTopicDetail(parsedTopicId, { force: true });
    }
    event.detail.complete();
    const toastMessage = error ? `刷新失败：${error}` : "刷新成功";
    setToastMessage(toastMessage);
    setToastOpen(true);
  };

  const replyCount = topicDetail?.replies?.length ?? 0;
  const visibleReplies = (topicDetail?.replies ?? []).slice(0, visibleCount);

  const handleInfinite = async (event: CustomEvent<void>) => {
    setVisibleCount((c) => Math.min(c + 30, replyCount));
    // Ionic expects calling complete() to unblock the infinite scroll.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (event.target as any).complete();
  };

  return (
    <IonPage className="topicPage">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton color={colorMode === "dark" ? "light" : "medium"} />
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
          ) : loading || (!error && !topicDetail) ? (
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
                  onClick={() =>
                    fetchTopicDetail(parsedTopicId, { force: true })
                  }
                >
                  Retry
                </IonButton>
              </div>
            </div>
          ) : !topicDetail?.topic ? (
            <div className="topicPageSection">
              <IonText>
                <p>Topic not found</p>
              </IonText>
            </div>
          ) : (
            <>
              <div className="topicHeader">
                <h1 className="topicTitle">{topicDetail.topic.title}</h1>

                <div className="topicMeta">
                  {topicDetail.topic.member?.username ? (
                    <IonText color="medium">
                      @{topicDetail.topic.member.username}
                    </IonText>
                  ) : null}
                  {topicDetail.topic.node?.title ||
                  topicDetail.topic.node?.name ? (
                    <IonBadge color="light">
                      {topicDetail.topic.node?.title ??
                        topicDetail.topic.node?.name}
                    </IonBadge>
                  ) : null}
                  {topicDetail.topic.created ? (
                    <IonText color="medium">
                      {formatTime(topicDetail.topic.created)}
                    </IonText>
                  ) : null}
                </div>

                {topicDetail.topic.contentRendered ? (
                  <div
                    className="topicContent prose"
                    dangerouslySetInnerHTML={{
                      __html: topicDetail.topic.contentRendered ?? "",
                    }}
                  />
                ) : topicDetail.topic.content ? (
                  <IonText>
                    <p className="topicPlain">{topicDetail.topic.content}</p>
                  </IonText>
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
                      <IonItem key={reply.id} lines="full">
                        <IonLabel className="ion-text-wrap">
                          <div className="replyMeta">
                            {(() => {
                              const username =
                                reply.member?.username || "unknown";
                              const avatarUrl = getMemberAvatarUrl(
                                reply.member,
                              );
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
                              @{reply.member?.username || "unknown"}
                            </span>
                            {reply.isOp ? (
                              <IonBadge color="warning">OP</IonBadge>
                            ) : null}
                            <span className="replyRight">
                              #{index + 1}
                              {reply.created
                                ? ` · ${formatTime(reply.created)}`
                                : ""}
                            </span>
                          </div>

                          {reply.contentRendered ? (
                            <div
                              className="topicContent prose"
                              dangerouslySetInnerHTML={{
                                __html: reply.contentRendered ?? "",
                              }}
                            />
                          ) : reply.content ? (
                            <IonText>
                              <p className="topicPlain">{reply.content}</p>
                            </IonText>
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
      </IonContent>
    </IonPage>
  );
};

export default TopicPage;
