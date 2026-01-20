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

export const Tab2: React.FC = () => {
  const logAnalytics = usePageAnalytics();

  useEffect(() => {
    void logAnalytics("page_view", { page: "tabs_tab2" });
  }, [logAnalytics]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tab 2</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Tab 2</IonTitle>
          </IonToolbar>
        </IonHeader>
        <ExploreContainer />
      </IonContent>
    </IonPage>
  );
};
