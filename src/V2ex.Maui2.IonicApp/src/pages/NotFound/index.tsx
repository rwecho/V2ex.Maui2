import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useLocation } from "react-router-dom";
import "./NotFound.css";

const NotFoundPage = () => {
  const location = useLocation();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
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
