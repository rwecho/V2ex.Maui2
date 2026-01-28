import React, { useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
} from "@ionic/react";
import { RouteComponentProps } from "react-router";
import { usePageAnalytics } from "../../hooks/usePageAnalytics";

interface UserDetailPageProps extends RouteComponentProps<{
  id: string;
}> {}

const UserDetailPage: React.FC<UserDetailPageProps> = ({ match, history }) => {
  const logAnalytics = usePageAnalytics();

  useEffect(() => {
    void logAnalytics("page_view", {
      page: "dashboard_user_detail",
      user_id: match.params.id,
    });
  }, [logAnalytics, match.params.id]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home"  color={"medium"} text="" />
          </IonButtons>
          <IonTitle>User Detail</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <br />
        User {match.params.id}
      </IonContent>
    </IonPage>
  );
};

export default UserDetailPage;
