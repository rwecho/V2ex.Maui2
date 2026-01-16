import { Redirect, Route } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { createHashHistory } from "history";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import "@ionic/react/css/palettes/dark.system.css";

/* Theme variables */
import "./theme/variables.css";
import DashboardPage from "./pages/Dashboard";
import HomePage from "./pages/Home";
import TopicPage from "./pages/Topic";

setupIonicReact();

// Use hash history so the document URL remains at '/', which keeps WKWebView's
// Referer header to the origin (fragments are not included in Referer).
// This helps MAUI HybridWebView's InvokeDotNet request validation on iOS.
const history = createHashHistory();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter history={history}>
      <IonRouterOutlet>
        <Route
          path="/dashboard"
          render={(props) => <DashboardPage {...props} />}
        />
        <Route path="/home">
          <HomePage />
        </Route>
        <Route exact path="/topic/:id" component={TopicPage} />
        <Route exact path="/">
          <Redirect to="/home" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
