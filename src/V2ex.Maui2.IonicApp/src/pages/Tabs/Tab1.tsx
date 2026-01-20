import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/react";
import ExploreContainer from "../../components/ExploreContainer";
import { useEffect } from "react";
import { usePageAnalytics } from "../../hooks/usePageAnalytics";

export const Tab1: React.FC = () => {
  const logAnalytics = usePageAnalytics();

  useEffect(() => {
    void logAnalytics("page_view", { page: "tabs_tab1" });
  }, [logAnalytics]);

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Tab 1</IonTitle>
          </IonToolbar>
        </IonHeader>
        <ExploreContainer />
      </IonContent>
    </IonPage>
  );
};
