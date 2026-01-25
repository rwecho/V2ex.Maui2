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
  IonAvatar,
  IonImg,
  IonButton,
  IonThumbnail,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useTabStore } from "../../store/tabStore";
import { useTopicStore } from "../../store/topicStore";
import { useDevModeStore } from "../../store/devModeStore";
import { useAuthStore } from "../../store/authStore";
import TopicList from "./TopicList";
import { apiService } from "../../services/apiService";
import VersionFooter from "../../components/VersionFooter";
import {
  applyColorMode,
  getStoredMode,
  getSystemPreferredMode,
  setStoredMode,
  type ColorMode,
} from "../../theme/colorMode";
import { useShallow } from "zustand/shallow";
import { usePageAnalytics } from "../../hooks/usePageAnalytics";

interface RefresherEventDetail {
  complete(): void;
}

const HomePage = () => {
  const history = useHistory();
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

  const { isAuthenticated, user, signOut } = useAuthStore(
    useShallow((s) => ({
      isAuthenticated: s.isAuthenticated,
      user: s.user,
      signOut: s.signOut,
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
  const [appVersion, setAppVersion] = useState<string>("");
  const devMode = useDevModeStore((state) => state.devMode);
  const logAnalytics = usePageAnalytics();

  // 处理登出
  const handleSignOut = async () => {
    try {
      const res = await apiService.signOut();
      if (res.error === null) {
        signOut();
        setToastMessage("已退出登录");
        setToastOpen(true);
        void logAnalytics("sign_out", { success: true });
      } else {
        setToastMessage(`退出失败：${res.error}`);
        setToastOpen(true);
        void logAnalytics("sign_out", { success: false, reason: res.error });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "退出失败";
      setToastMessage(errorMsg);
      setToastOpen(true);
      void logAnalytics("sign_out", { success: false, reason: "exception" });
    }
  };

  // 处理头像 URL 标准化
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

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((t) => t.key === activeKey)) {
      setActiveKey(tabs[0].key);
    }
  }, [tabs, activeKey]);

  useEffect(() => {
    void logAnalytics("page_view", { page: "home" });
  }, [logAnalytics]);

  useEffect(() => {
    const loadVersion = async () => {
      const res = await apiService.getSystemInfo();
      if (res.error === null && res.data.appVersion) {
        setAppVersion(res.data.appVersion);
      } else {
        setAppVersion("0.0.1");
      }
    };

    void loadVersion();
  }, []);

  useEffect(() => {
    applyColorMode(colorMode);
    setStoredMode(colorMode);
  }, [colorMode]);

  useEffect(() => {
    if (!activeKey) return;
    void logAnalytics("tab_view", { tab_key: activeKey });
  }, [activeKey, logAnalytics]);

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
        void logAnalytics("refresh_tab", {
          tab_key: activeKey,
          success: false,
          reason: "tab_not_found",
        });
        return;
      }
      await fetchTabTopics(activeTab.key, activeTab.tab);
      const err = useTopicStore.getState().errorByKey[activeTab.key];
      if (err) {
        setToastMessage(`刷新失败：${err}`);
        void logAnalytics("refresh_tab", {
          tab_key: activeTab.key,
          success: false,
          reason: "fetch_error",
        });
      } else {
        setToastMessage("刷新成功");
        void logAnalytics("refresh_tab", {
          tab_key: activeTab.key,
          success: true,
        });
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
          {/* 用户信息区域 */}
          {isAuthenticated && user ? (
            <div style={{ padding: "16px" }}>
              <IonItem lines="none" style={{ marginBottom: "12px" }}>
                <IonAvatar
                  slot="start"
                  style={{ width: "56px", height: "56px" }}
                >
                  {normalizeAvatarUrl(user.avatarMini || user.avatarLarge) ? (
                    <IonImg
                      src={
                        normalizeAvatarUrl(
                          user.avatarMini || user.avatarLarge,
                        ) || undefined
                      }
                      alt={user.username}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#4a90e2",
                        color: "white",
                        fontSize: "24px",
                        fontWeight: "bold",
                      }}
                    >
                      {user.username?.slice(0, 1).toUpperCase() || "?"}
                    </div>
                  )}
                </IonAvatar>
                <IonLabel>
                  <h2 style={{ margin: "0", fontSize: "18px" }}>
                    {user.username}
                  </h2>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "14px",
                      color: "#888",
                    }}
                  >
                    {user.tagline || "V2EX 用户"}
                  </p>
                </IonLabel>
              </IonItem>
              <IonButton
                expand="block"
                fill="outline"
                onClick={handleSignOut}
                style={{ marginBottom: "16px" }}
              >
                退出登录
              </IonButton>
            </div>
          ) : (
            <div style={{ padding: "16px" }}>
              <IonButton
                expand="block"
                onClick={() => history.push("/login")}
                style={{ marginBottom: "16px" }}
              >
                登录
              </IonButton>
            </div>
          )}

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

            {devMode && (
              <>
                <IonItem lines="full" routerLink="/logs">
                  <IonLabel>Logs</IonLabel>
                </IonItem>

                <IonItem lines="full" routerLink="/test">
                  <IonLabel>Test Page</IonLabel>
                </IonItem>
              </>
            )}
          </IonList>
        </IonContent>

        <VersionFooter appVersion={appVersion} />
      </IonMenu>

      <IonPage id="homePage">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton color={"medium"} />
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
          <IonRefresher
            slot="fixed"
            onIonRefresh={handleRefresh}
            pullFactor={0.85}
            pullMin={60}
          >
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
