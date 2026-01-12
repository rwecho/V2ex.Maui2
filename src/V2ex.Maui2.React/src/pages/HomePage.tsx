/**
 * Home Page - 显示话题列表
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Page,
  List,
  ListItem,
  Preloader,
  Button,
  Segmented,
  SegmentedButton,
} from "konsta/react";
import { useTopicStore } from "../stores/topicStore";
import type { Topic } from "../types/v2ex";

const HOME_TABS = [
  { key: "latest", label: "最新", kind: "latest" },
  { key: "hot", label: "热门", kind: "hot" },
  { key: "tech", label: "技术", kind: "node", nodeName: "tech" },
  { key: "creative", label: "创意", kind: "node", nodeName: "creative" },
  { key: "play", label: "好玩", kind: "node", nodeName: "play" },
  { key: "apple", label: "Apple", kind: "node", nodeName: "apple" },
  { key: "jobs", label: "酷工作", kind: "node", nodeName: "jobs" },
  { key: "deals", label: "交易", kind: "node", nodeName: "deals" },
  { key: "city", label: "城市", kind: "node", nodeName: "city" },
  { key: "qna", label: "问与答", kind: "node", nodeName: "qna" },
  { key: "r2", label: "R2", kind: "node", nodeName: "r2" },
] as const;

type HomeTabKey = (typeof HOME_TABS)[number]["key"];

export function HomePage() {
  const {
    topics,
    loading,
    error,
    fetchTopics,
    fetchHotTopics,
    fetchNodeTopics,
  } = useTopicStore();
  const [activeTab, setActiveTab] = useState<HomeTabKey>("latest");
  const navigate = useNavigate();

  useEffect(() => {
    const tab = HOME_TABS.find((t) => t.key === activeTab);
    if (!tab) return;

    if (tab.kind === "latest") {
      fetchTopics();
      return;
    }

    if (tab.kind === "hot") {
      fetchHotTopics();
      return;
    }

    fetchNodeTopics(tab.nodeName, 1);
  }, [activeTab, fetchTopics, fetchHotTopics, fetchNodeTopics]);

  // 格式化时间戳为相对时间
  const formatTime = (timestamp: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const reloadActiveTab = () => {
    const tab = HOME_TABS.find((t) => t.key === activeTab);
    if (!tab) return;

    if (tab.kind === "latest") {
      fetchTopics();
      return;
    }

    if (tab.kind === "hot") {
      fetchHotTopics();
      return;
    }

    fetchNodeTopics(tab.nodeName, 1);
  };

  return (
    <Page>
      {/* Tab 切换：横向滚动 */}
      <div
        className="overflow-x-auto"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="min-w-max">
          <Segmented strong className="min-w-max">
            {HOME_TABS.map((tab) => (
              <SegmentedButton
                key={tab.key}
                className={`whitespace-nowrap ${
                  activeTab === tab.key ? "" : "opacity-50"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </SegmentedButton>
            ))}
          </Segmented>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          <div className="mb-2">{error}</div>
          <Button onClick={reloadActiveTab}>Retry</Button>
        </div>
      )}

      {loading && topics.length === 0 && (
        <div className="flex justify-center p-4">
          <Preloader />
        </div>
      )}

      {!loading && topics.length === 0 && !error && (
        <div className="text-center text-gray-500 p-4">No topics found</div>
      )}

      {topics.length > 0 && (
        <List strong inset>
          {topics.map((topic: Topic) => (
            <ListItem
              key={topic.id}
              link
              title={topic.title}
              after={`${topic.replies} 💬`}
              subtitle={
                <div className="flex flex-col">
                  <span>
                    @{topic.member?.username || "unknown"} ·{" "}
                    {topic.node?.title || "unknown"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(topic.lastTouched)}
                  </span>
                </div>
              }
              onClick={() => {
                navigate(`/topic/${topic.id}`);
              }}
            />
          ))}
        </List>
      )}

      {loading && topics.length > 0 && (
        <div className="flex justify-center p-4">
          <Preloader />
        </div>
      )}
    </Page>
  );
}
