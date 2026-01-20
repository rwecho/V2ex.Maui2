import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
} from "@ionic/react";
import { useEffect } from "react";
import { usePageAnalytics } from "../../hooks/usePageAnalytics";

const TestPage = () => {
  const logAnalytics = usePageAnalytics();

  useEffect(() => {
    void logAnalytics("page_view", { page: "test" });
  }, [logAnalytics]);

  return (
    <IonPage id="testPage">
      <IonHeader>
        <IonToolbar>
          <IonTitle>测试页面</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <p>这是一个测试页面。</p>

        <IonButton
          onClick={() => {
            console.log("按钮被点击了！");
            void logAnalytics("test_button_click");
          }}
        >
          点击我
        </IonButton>

        <IonButton routerLink="/home">Home</IonButton>
        <IonButton routerLink="/settings">Settings</IonButton>
        <IonButton routerLink="/profile">Profile</IonButton>
        <IonButton routerLink="/about">About</IonButton>
        <IonButton routerLink="/help">Help</IonButton>
        <IonButton routerLink="/contact">Contact</IonButton>
        <IonButton routerLink="/contact">Contact</IonButton>
        <IonButton routerLink="/dashboard">Dashboard</IonButton>
        <IonButton routerLink="/topic/1185845">Topic 1185845</IonButton>
      </IonContent>
    </IonPage>
  );
};

export default TestPage;
