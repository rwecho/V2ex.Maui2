import React, { useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
} from "@ionic/react";
import { Link, RouteComponentProps } from "react-router-dom";
import { usePageAnalytics } from "../../hooks/usePageAnalytics";

const UsersListPage: React.FC<RouteComponentProps> = ({ history }) => {
  const logAnalytics = usePageAnalytics();

  useEffect(() => {
    void logAnalytics("page_view", { page: "dashboard_users" });
  }, [logAnalytics]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Users</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonItem routerLink="/dashboard/users/1">
            <IonLabel>User 1</IonLabel>
          </IonItem>
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>{" "}
          <IonItem>
            <Link to="/dashboard/users/2">
              <IonLabel>User 2</IonLabel>
            </Link>
          </IonItem>
          <IonItem>
            <IonButton
              onClick={(e) => {
                e.preventDefault();
                void logAnalytics("navigate_user_detail", { user_id: "3" });
                history.push("/dashboard/users/3");
              }}
            >
              <IonLabel>User 3</IonLabel>
            </IonButton>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default UsersListPage;
