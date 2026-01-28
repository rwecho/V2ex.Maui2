import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./NotFound.css";
import { usePageAnalytics } from "../../hooks/usePageAnalytics";

const NotFoundPage = () => {
  const location = useLocation();
  const logAnalytics = usePageAnalytics();

  useEffect(() => {
    void logAnalytics("page_view", {
      page: "not_found",
      path: location.pathname,
    });
  }, [location.pathname, logAnalytics]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home"  color={"medium"} text="" />
          </IonButtons>
          <IonTitle>404</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="notFoundBody">
          <IonText>
            <h2 className="notFoundTitle">页面不存在</h2>
          </IonText>

          <IonText color="medium">
            <p className="notFoundDesc">你访问的路由不存在或已被移除。</p>
            <p className="notFoundPath">当前路径：{location.pathname}</p>
          </IonText>

          <div className="notFoundActions">
            <IonButton routerLink="/home">返回首页</IonButton>
            <IonButton fill="outline" onClick={() => window.location.reload()}>
              Reload
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NotFoundPage;
