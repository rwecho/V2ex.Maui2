import {
  IonButtons,
  IonContent,
  IonHeader,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuButton,
  IonItem,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSegmentContent,
  IonSegmentView,
  IonTitle,
  IonToast,
  IonToggle,
  IonToolbar,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { useTabStore } from "../../store/tabStore";
import { useTopicStore } from "../../store/topicStore";
import TopicList from "./TopicList";
import {
  applyColorMode,
  getStoredMode,
  getSystemPreferredMode,
  setStoredMode,
  type ColorMode,
} from "../../theme/colorMode";
import { useShallow } from "zustand/shallow";

interface RefresherEventDetail {
  complete(): void;
}

const HomePage = () => {
  const tabs = useTabStore((state) => state.tabs);

  const { topicsByKey, loadingByKey, errorByKey, fetchTabTopics } =
    useTopicStore(
      useShallow((s) => ({
        topicsByKey: s.topicsByKey,
        loadingByKey: s.loadingByKey,
        errorByKey: s.errorByKey,
        fetchTabTopics: s.fetchTabTopics,
      })),
    );

  const [colorMode, setColorMode] = useState<ColorMode>(
    () => getStoredMode() ?? getSystemPreferredMode(),
  );

  const [activeKey, setActiveKey] = useState<string>(
    () => tabs[0]?.key ?? "latest",
  );

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((t) => t.key === activeKey)) {
      setActiveKey(tabs[0].key);
    }
  }, [tabs, activeKey]);

  useEffect(() => {
    applyColorMode(colorMode);
    setStoredMode(colorMode);
  }, [colorMode]);

  const getTabData = (key: string) => {
    const topicsRaw = (topicsByKey as any)?.[key] ?? [];
    const topics = Array.isArray(topicsRaw) ? topicsRaw : [];
    const topicsShapeError =
      topicsRaw != null && !Array.isArray(topicsRaw)
        ? "列表数据格式异常（非数组）"
        : null;
    const loading = loadingByKey[key] ?? false;
    const error = topicsShapeError ?? errorByKey[key] ?? null;
    return { topics, loading, error };
  };

  const fetchForTab = async (tab: (typeof tabs)[number]) => {
    await fetchTabTopics(tab.key, tab.tab);
  };

  // 首次进入/切换 Segment 时，按需加载当前 Tab。
  useEffect(() => {
    const activeTab = tabs.find((t) => t.key === activeKey);
    if (!activeTab) return;

    const { topics, loading, error } = getTabData(activeTab.key);

    // 如果上一次请求已经失败，不要自动重试（避免 429/死循环），交给用户点“重试”或下拉刷新。
    if (error) return;

    // 简单缓存：已加载过就不重复请求
    if (loading || topics.length > 0) return;

    void fetchForTab(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, tabs, topicsByKey, loadingByKey, errorByKey]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      const activeTab = tabs.find((t) => t.key === activeKey);
      if (!activeTab) {
        setToastMessage("刷新失败：未找到当前 Tab");
        setToastOpen(true);
        return;
      }
      await fetchTabTopics(activeTab.key, activeTab.tab);
      const err = useTopicStore.getState().errorByKey[activeTab.key];
      if (err) {
        setToastMessage(`刷新失败：${err}`);
      } else {
        setToastMessage("刷新成功");
      }
      setToastOpen(true);
    } finally {
      event.detail.complete();
    }
  };

  return (
    <>
      <IonMenu contentId="homePage" side="start" type="overlay">
        <IonHeader>
          <IonToolbar>
            <IonTitle>设置</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList inset>
            <IonItem lines="full">
              <IonLabel>深色模式</IonLabel>
              <IonToggle
                checked={colorMode === "dark"}
                onIonChange={(e) =>
                  setColorMode(e.detail.checked ? "dark" : "light")
                }
              />
            </IonItem>

            <IonItem lines="full" routerLink="/test">
              <IonLabel>Test Page</IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonMenu>

      <IonPage id="homePage">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton
                color={colorMode === "dark" ? "light" : "medium"}
              />
            </IonButtons>
            <IonSegment
              value={activeKey}
              scrollable
              onIonChange={(e) => setActiveKey(String(e.detail.value))}
            >
              {tabs.map((tab) => (
                <IonSegmentButton
                  key={tab.key}
                  value={tab.key}
                  contentId={tab.key}
                >
                  <IonLabel>{tab.label}</IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>
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

          <IonSegmentView>
            {tabs.map((tab) => (
              <IonSegmentContent key={tab.key} id={tab.key}>
                {(() => {
                  const { topics, loading, error } = getTabData(tab.key);
                  return (
                    <TopicList
                      topics={topics}
                      loading={loading}
                      error={error}
                      isActive={tab.key === activeKey}
                      onRetry={() => fetchForTab(tab)}
                      emptyText={`暂无话题：${tab.label}`}
                    />
                  );
                })()}
              </IonSegmentContent>
            ))}
          </IonSegmentView>

          <IonToast
            isOpen={toastOpen}
            message={toastMessage}
            duration={1200}
            position="top"
            onDidDismiss={() => setToastOpen(false)}
          />
        </IonContent>
      </IonPage>
    </>
  );
};

export default HomePage;
