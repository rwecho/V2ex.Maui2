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

interface RefresherEventDetail {
  complete(): void;
}

const HomePage = () => {
  const tabs = useTabStore((state) => state.tabs);

  const fetchLatestTopics = useTopicStore((s) => s.fetchLatestTopics);
  const fetchHotTopics = useTopicStore((s) => s.fetchHotTopics);
  const fetchTabTopics = useTopicStore((s) => s.fetchTabTopics);

  const [colorMode, setColorMode] = useState<ColorMode>(
    () => getStoredMode() ?? getSystemPreferredMode()
  );

  const [activeKey, setActiveKey] = useState<string>(
    () => tabs[0]?.key ?? "latest"
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

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      const activeTab = tabs.find((t) => t.key === activeKey);
      if (!activeTab) {
        setToastMessage("刷新失败：未找到当前 Tab");
        setToastOpen(true);
        return;
      }

      switch (activeTab.kind) {
        case "latest":
          await fetchLatestTopics(activeTab.key);
          break;
        case "hot":
          await fetchHotTopics(activeTab.key);
          break;
        case "tab":
          await fetchTabTopics(activeTab.key, activeTab.tab);
          break;
        default:
          setToastMessage("刷新失败：不支持的 Tab 类型");
          setToastOpen(true);
          return;
      }

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
                <TopicList
                  tabKey={tab.key}
                  tab={tab.tab}
                  kind={tab.kind}
                  isActive={tab.key === activeKey}
                />
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
