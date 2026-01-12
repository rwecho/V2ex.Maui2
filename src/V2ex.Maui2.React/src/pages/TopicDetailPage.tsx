/**
 * Topic Detail Page - 显示话题详情和评论
 */

import { useEffect, useMemo, useState } from "react";
import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  Preloader,
  Button,
  NavbarBackLink,
} from "konsta/react";
import { useNavigate, useParams } from "react-router-dom";
import { useTopicStore } from "../stores/topicStore";

export function TopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { currentTopicDetail, loading, error, fetchTopicDetail } =
    useTopicStore();
  const [visibleCount, setVisibleCount] = useState(30);
  const [nowSeconds, setNowSeconds] = useState<number | null>(null);

  const parsedTopicId = useMemo(() => {
    if (!topicId) return null;
    const id = parseInt(topicId, 10);
    return Number.isNaN(id) ? null : id;
  }, [topicId]);

  const goBack = () => {
    // In HybridWebView the history stack can be empty. Fall back to home.
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  // Keep relative times stable & lint-friendly (no Date.now() during render).
  useEffect(() => {
    const update = () => setNowSeconds(Math.floor(Date.now() / 1000));
    update();

    // Update every minute; good enough for "x minutes ago".
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (parsedTopicId != null) {
      fetchTopicDetail(parsedTopicId);
    }
  }, [parsedTopicId, fetchTopicDetail]);

  const replies = currentTopicDetail?.replies;
  const replyCount = replies?.length ?? 0;
  const visibleReplies = useMemo(
    () => (replies ?? []).slice(0, visibleCount),
    [replies, visibleCount]
  );

  if (parsedTopicId == null) {
    return (
      <Page>
        <Navbar
          title="Not Found"
          left={<NavbarBackLink text="Back" onClick={goBack} />}
        />
        <Block>Invalid topic id</Block>
      </Page>
    );
  }

  // Avoid flashing "Not Found" before the first request has a chance to start.
  // If the request fails, the store should set `error`; until then we treat missing data as pending.
  const hasTopic = Boolean(currentTopicDetail?.topic);
  const isPending = loading || (!error && !hasTopic);

  if (isPending || nowSeconds == null) {
    return (
      <Page>
        <Navbar
          title="Loading..."
          left={<NavbarBackLink text="Back" onClick={goBack} />}
        />
        <div className="flex justify-center p-4">
          <Preloader />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <Navbar
          title="Error"
          left={<NavbarBackLink text="Back" onClick={goBack} />}
        />
        <Block>
          <div className="text-red-600 wrap-break-word">{error}</div>
          <div className="mt-3">
            <Button
              onClick={() => {
                fetchTopicDetail(parsedTopicId);
              }}
            >
              Retry
            </Button>
          </div>
        </Block>
      </Page>
    );
  }

  if (!currentTopicDetail?.topic) {
    return (
      <Page>
        <Navbar
          title="Not Found"
          left={<NavbarBackLink text="Back" onClick={goBack} />}
        />
        <Block>Topic not found</Block>
      </Page>
    );
  }

  const { topic } = currentTopicDetail;

  // 格式化时间戳为相对时间
  const formatTime = (timestamp: number): string => {
    const diff = nowSeconds - timestamp;

    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  };

  return (
    <Page>
      <Navbar
        title={topic.node?.title || "V2EX"}
        left={<NavbarBackLink text="Back" onClick={goBack} />}
      />

      <Block>
        <h1 className="text-xl font-bold mb-2">{topic.title}</h1>
        <div className="text-sm text-gray-600 mb-4">
          <span className="font-semibold">
            @{topic.member?.username || "unknown"}
          </span>
          {" · "}
          <span>{topic.node?.title || "unknown"}</span>
          {" · "}
          <span>{formatTime(topic.created)}</span>
        </div>

        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: topic.contentRendered }}
        />
      </Block>

      <BlockTitle>Replies ({replyCount})</BlockTitle>

      <Block>
        {replyCount === 0 ? (
          <div className="text-center text-gray-500 p-4">No replies yet</div>
        ) : (
          <>
            {visibleReplies.map((reply, index) => (
              <div
                key={reply.id}
                className="mb-4 pb-4 border-b last:border-b-0"
              >
                <div className="flex items-center mb-2">
                  <div className="font-semibold">
                    @{reply.member?.username || "unknown"}
                  </div>
                  {reply.isOp && (
                    <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded">
                      OP
                    </span>
                  )}
                  <div className="text-sm text-gray-500 ml-2">#{index + 1}</div>
                  <div className="text-sm text-gray-400 ml-2">
                    {formatTime(reply.created)}
                  </div>
                </div>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: reply.contentRendered }}
                />
              </div>
            ))}

            {replyCount > visibleCount && (
              <div className="flex justify-center pt-2">
                <Button
                  onClick={() =>
                    setVisibleCount((c) => Math.min(c + 30, replyCount))
                  }
                >
                  Load more ({visibleCount}/{replyCount})
                </Button>
              </div>
            )}
          </>
        )}
      </Block>
    </Page>
  );
}
