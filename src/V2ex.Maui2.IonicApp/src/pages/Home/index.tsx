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
  IonSelect,
  IonSelectOption,
  IonToolbar,
  IonAvatar,
  IonImg,
  IonButton,
  IonFooter,
  IonAlert,
} from "@ionic/react";
import { menuController } from "@ionic/core/components";

import { useRef, useEffect, useState } from "react";
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
  const menuRef = useRef<HTMLIonMenuElement>(null);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

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
    () => getStoredMode() ?? "system",
  );

  const [activeKey, setActiveKey] = useState<string>(() => {
    // 1. Try to load from localStorage
    const saved = localStorage.getItem("v2ex_home_active_tab");
    // 2. Validate validity
    if (saved && tabs.some((t) => t.key === saved)) {
      return saved;
    }
    // 3. Fallback to default
    return tabs[0]?.key ?? "latest";
  });

  // Persist activeKey on change
  useEffect(() => {
    if (activeKey) {
      localStorage.setItem("v2ex_home_active_tab", activeKey);
    }
  }, [activeKey]);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [appVersion, setAppVersion] = useState<string>("");
  const devMode = useDevModeStore((state) => state.devMode);
  const logAnalytics = usePageAnalytics();

  // 处理登出
  const handleSignOut = async () => {
    void menuController.close();
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
          {isAuthenticated && user && (
            <div style={{ padding: "20px 16px 10px 16px" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <IonAvatar
                  style={{
                    width: "80px",
                    height: "80px",
                    marginBottom: "12px",
                    border: "2px solid var(--ion-color-light)",
                  }}
                >
                  {normalizeAvatarUrl(
                    user.avatar || user.avatarMini || user.avatarLarge,
                  ) ? (
                    <IonImg
                      src={
                        normalizeAvatarUrl(
                          user.avatar || user.avatarMini || user.avatarLarge,
                        ) || undefined
                      }
                      alt={user.name || user.username}
                      style={{ borderRadius: "50%" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "var(--ion-color-step-100, #f0f0f0)",
                        color: "var(--ion-color-step-600, #666)",
                        fontSize: "32px",
                        fontWeight: "bold",
                        borderRadius: "50%",
                      }}
                    >
                      {(user.name || user.username)
                        ?.slice(0, 1)
                        .toUpperCase() || "?"}
                    </div>
                  )}
                </IonAvatar>

                <h2
                  style={{
                    margin: "0",
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "var(--ion-text-color)",
                  }}
                >
                  {user.name || user.username}
                </h2>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "13px",
                    color: "var(--ion-color-medium)",
                  }}
                >
                  {user.tagline || "V2EX 用户"}
                </p>

                {(user.moneyGold || user.moneySilver || user.moneyBronze) && (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "12px",
                      fontSize: "13px",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {user.moneyGold && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: "var(--ion-color-warning-tint)",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          color: "var(--ion-color-warning-shade)",
                        }}
                      >
                        <span style={{ marginRight: "4px" }}>🪙</span>{" "}
                        {user.moneyGold}
                      </div>
                    )}
                    {user.moneySilver && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: "var(--ion-color-medium-tint)",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          color: "var(--ion-color-medium-shade)",
                        }}
                      >
                        <span style={{ marginRight: "4px" }}>🥈</span>{" "}
                        {user.moneySilver}
                      </div>
                    )}
                    {user.moneyBronze && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: "#efebe9",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          color: "#8d6e63",
                        }}
                      >
                        <span style={{ marginRight: "4px" }}>🥉</span>{" "}
                        {user.moneyBronze}
                      </div>
                    )}
                  </div>
                )}

                {user.notifications && user.notifications !== "0" && (
                  <div style={{ marginTop: "16px", width: "100%" }}>
                    <IonButton
                      expand="block"
                      size="small"
                      color="danger"
                      // routerLink="/notifications"
                      style={{ "--border-radius": "16px" }}
                    >
                      {user.notifications}
                    </IonButton>
                  </div>
                )}
              </div>
            </div>
          )}

          <IonList inset>
            <IonItem
              lines="full"
              onClick={() => {
                menuController.close();
                history.push("/history");
              }}
            >
              <IonLabel>浏览历史</IonLabel>
            </IonItem>

            <IonItem lines="full">
              <IonLabel>外观</IonLabel>
              <IonSelect
                value={colorMode}
                onIonChange={(e) => setColorMode(e.detail.value as ColorMode)}
                interface="action-sheet"
                interfaceOptions={{ header: "选择外观" }}
              >
                <IonSelectOption value="light">浅色</IonSelectOption>
                <IonSelectOption value="dark">深色</IonSelectOption>
                <IonSelectOption value="system">跟随系统</IonSelectOption>
              </IonSelect>
            </IonItem>

            {devMode && (
              <>
                <IonItem lines="full" routerLink="/logs">
                  <IonLabel>Logs</IonLabel>
                </IonItem>

                <IonItem lines="full" routerLink="/test">
                  <IonLabel>Test Page</IonLabel>
                </IonItem>

                <IonItem lines="full" routerLink="/topic/997543">
                  <IonLabel>沙盒</IonLabel>
                </IonItem>
              </>
            )}
          </IonList>
        </IonContent>
        <IonFooter>
          <IonToolbar>
            {!isAuthenticated && (
              <IonItem
                lines="none"
                onClick={() => {
                  void menuController.close();
                  history.push("/login");
                }}
                button
                detail={false}
              >
                <IonLabel>登录</IonLabel>
              </IonItem>
            )}
            {isAuthenticated && (
              <IonItem
                lines="none"
                onClick={() => setShowLogoutAlert(true)}
                button
                detail={false}
              >
                <IonLabel color="danger">退出登录</IonLabel>
              </IonItem>
            )}
            <VersionFooter appVersion={appVersion} />
          </IonToolbar>
        </IonFooter>
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
                      emptyText={``}
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

          <IonAlert
            isOpen={showLogoutAlert}
            onDidDismiss={() => setShowLogoutAlert(false)}
            header="退出登录"
            message="确定要退出登录吗？"
            buttons={[
              {
                text: "取消",
                role: "cancel",
              },
              {
                text: "确认",
                role: "destructive",
                handler: handleSignOut,
              },
            ]}
          />
        </IonContent>
      </IonPage>
    </>
  );
};

export default HomePage;
