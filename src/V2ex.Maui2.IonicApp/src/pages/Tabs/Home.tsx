import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from "@ionic/react";
import "./Home.css";
import { Redirect, Route } from "react-router";
import { ellipse, square, triangle } from "ionicons/icons";
import { Tab3 } from "./Tab3";
import { Tab1 } from "./Tab1";
import { Tab2 } from "./Tab2";
import { useEffect } from "react";
import { usePageAnalytics } from "../../hooks/usePageAnalytics";

const TabsHome: React.FC = () => {
  const logAnalytics = usePageAnalytics();

  useEffect(() => {
    void logAnalytics("page_view", { page: "tabs_home" });
  }, [logAnalytics]);

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Redirect exact path="/tabs" to="/tabs/tab1" />
        <Route exact path="/tabs/tab1">
          <Tab1 />
        </Route>
        <Route exact path="/tabs/tab2">
          <Tab2 />
        </Route>
        <Route path="/tabs/tab3">
          <Tab3 />
        </Route>
        <Route exact path="/tabs">
          <Redirect to="/tabs/tab1" />
        </Route>
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton
          tab="tab1"
          href="/tabs/tab1"
          onClick={() => void logAnalytics("tab_switch", { tab: "tab1" })}
        >
          <IonIcon icon={triangle} />
          <IonLabel>Tab 1</IonLabel>
        </IonTabButton>
        <IonTabButton
          tab="tab2"
          href="/tabs/tab2"
          onClick={() => void logAnalytics("tab_switch", { tab: "tab2" })}
        >
          <IonIcon icon={ellipse} />
          <IonLabel>Tab 2</IonLabel>
        </IonTabButton>
        <IonTabButton
          tab="tab3"
          href="/tabs/tab3"
          onClick={() => void logAnalytics("tab_switch", { tab: "tab3" })}
        >
          <IonIcon icon={square} />
          <IonLabel>Tab 3</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default TabsHome;
