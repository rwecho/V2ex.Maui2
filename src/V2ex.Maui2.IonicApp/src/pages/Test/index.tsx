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
import { useHistory } from "react-router-dom";
import { usePageAnalytics } from "../../hooks/usePageAnalytics";

const TEST_TOPIC_ID = "1185845";

const TestPage = () => {
  const logAnalytics = usePageAnalytics();
  const history = useHistory();
  const topicIdRef = useRef<HTMLIonInputElement>(null);

  useEffect(() => {
    void logAnalytics("page_view", { page: "test" });
  }, [logAnalytics]);

  // 模拟冷启动：用 bridge SetStringValue 写入 Preferences，然后调 GetPendingPushNavigationAsync pull
  const simulateColdStartPush = async () => {
    const topicId = String(topicIdRef.current?.value || TEST_TOPIC_ID).trim();
    const link = `https://www.v2ex.com/t/${topicId}`;
    const hwv = (window as any).HybridWebView;
    if (!hwv?.InvokeDotNet) {
      alert("HybridWebView bridge 不可用（请在原生 App 内运行）");
      return;
    }
    try {
      // 写入 Preferences，模拟 Android CapturePushIntent 的效果
      await hwv.InvokeDotNet("SetStringValue", [
        "push_pending_topic_id",
        topicId,
      ]);
      await hwv.InvokeDotNet("SetStringValue", ["push_pending_link", link]);
      console.log("[Test] Preferences set, now pulling...");

      // 模拟前端 mount 后的 pull（与 App.tsx 里的 pullPendingPushNavigation 逻辑相同）
      const resultJson = await hwv.InvokeDotNet(
        "GetPendingPushNavigationAsync",
        [],
      );
      const result =
        typeof resultJson === "string" ? JSON.parse(resultJson) : resultJson;
      console.log("[Test] GetPendingPushNavigationAsync result:", result);

      if (result?.hasPending && result?.topicId) {
        history.push(`/topic/${result.topicId}`);
      } else {
        alert("Pull 结果为空，检查 bridge 方法是否正常");
      }
    } catch (e) {
      console.error("[Test] simulateColdStartPush failed", e);
      alert("失败: " + e);
    }
  };

  // 模拟 Resume push：直接发一条 HybridWebViewMessageReceived 事件，模拟原生 SendRawMessage
  const simulateResumePush = () => {
    const topicId = String(topicIdRef.current?.value || TEST_TOPIC_ID).trim();
    const link = `https://www.v2ex.com/t/${topicId}`;
    const payload = JSON.stringify({ type: "pushNavigate", topicId, link });
    console.log("[Test] Simulating resume push with payload:", payload);
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
              onClick={simulateColdStartPush}
            >
              模拟冷启动推送（Pull）
            </IonButton>
          </IonItem>
          <IonItem>
            <IonButton
              expand="block"
              color="secondary"
              onClick={simulateResumePush}
            >
              模拟 Resume 推送（Push Event）
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
