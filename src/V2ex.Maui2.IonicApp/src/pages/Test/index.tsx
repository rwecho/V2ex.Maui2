import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonInput,
} from "@ionic/react";
import { useEffect, useRef } from "react";
import { usePageAnalytics } from "../../hooks/usePageAnalytics";

const TEST_TOPIC_ID = "1185845";

const TestPage = () => {
  const logAnalytics = usePageAnalytics();
  const topicIdRef = useRef<HTMLIonInputElement>(null);

  useEffect(() => {
    void logAnalytics("page_view", { page: "test" });
  }, [logAnalytics]);

  const simulatePushDispatch = () => {
    const topicId = String(topicIdRef.current?.value || TEST_TOPIC_ID).trim();
    const link = `https://www.v2ex.com/t/${topicId}`;
    const payload = JSON.stringify({ type: "pushNavigate", topicId, link });
    console.log("[Test] Simulating native push dispatch with payload:", payload);
    window.dispatchEvent(
      new CustomEvent("HybridWebViewMessageReceived", {
        detail: { message: payload },
      }),
    );
  };

  return (
    <IonPage id="testPage">
      <IonHeader>
        <IonToolbar>
          <IonTitle>测试页面</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonListHeader>推送导航测试</IonListHeader>
          <IonItem>
            <IonLabel position="stacked">Topic ID</IonLabel>
            <IonInput
              ref={topicIdRef}
              value={TEST_TOPIC_ID}
              placeholder="输入话题 ID"
              type="number"
            />
          </IonItem>
          <IonItem>
            <IonButton
              expand="block"
              color="primary"
              onClick={simulatePushDispatch}
            >
              模拟原生推送派发
            </IonButton>
          </IonItem>
        </IonList>

        <IonList>
          <IonListHeader>页面导航</IonListHeader>
          <IonButton routerLink="/home">Home</IonButton>
          <IonButton routerLink="/settings">Settings</IonButton>
          <IonButton routerLink="/dashboard">Dashboard</IonButton>
          <IonButton routerLink={`/topic/${TEST_TOPIC_ID}`}>
            Topic {TEST_TOPIC_ID}
          </IonButton>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default TestPage;
