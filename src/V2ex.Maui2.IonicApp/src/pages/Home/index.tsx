import {
  IonContent,
  IonHeader,
  IonLabel,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSegmentContent,
  IonSegmentView,
  IonToolbar,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { useTabStore } from "../../store/tabStore";
import TopicList from "./TopicList";

const HomePage = () => {
  const tabs = useTabStore((state) => state.tabs);

  const [activeKey, setActiveKey] = useState<string>(
    () => tabs[0]?.key ?? "latest"
  );

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((t) => t.key === activeKey)) {
      setActiveKey(tabs[0].key);
    }
  }, [tabs, activeKey]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
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
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
