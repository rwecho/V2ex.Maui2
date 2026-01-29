import { MemoryRouter, Redirect, Route, Switch } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { createHashHistory } from "history";
import { useEffect, useState } from "react";

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
import "@ionic/react/css/palettes/dark.class.css";

/* Theme variables */
import "./theme/variables.css";
import DashboardPage from "./pages/Dashboard";
import HomePage from "./pages/Home";
import TopicPage from "./pages/Topic";
import NotFoundPage from "./pages/NotFound";
import LogsPage from "./pages/Logs";
import LoginPage from "./pages/Login";
import { initColorMode } from "./theme/colorMode";
import TestPage from "./pages/Test";
import FatalErrorBoundary from "./components/ErrorDebug/FatalErrorBoundary";
import ErrorDebugScreen, {
  CapturedError,
} from "./components/ErrorDebug/ErrorDebugScreen";

// 配置 Ionic 确保跨平台一致性
setupIonicReact({
  rippleEffect: true, // 禁用波纹效果，提升性能
  swipeBackEnabled: true, // 启用 iOS 风格的滑动返回
  hardwareBackButton: true, // 启用 Android 硬件返回键
  animated: true, // 启用动画过渡
});

// Use hash history so the document URL remains at '/', which keeps WKWebView's
// Referer header to the origin (fragments are not included in Referer).
// This helps MAUI HybridWebView's InvokeDotNet request validation on iOS.
const history = createHashHistory();

const isTestEnv =
  typeof import.meta !== "undefined" &&
  typeof import.meta.env !== "undefined" &&
  import.meta.env.MODE === "test";

const App: React.FC = () => {
  const [fatalError, setFatalError] = useState<CapturedError | null>(null);

  useEffect(() => {
    initColorMode();
  }, []);

  // 为原生 Android 返回键提供路由状态检查
  useEffect(() => {
    // 将路由状态暴露给原生代码调用
    (window as any).canGoBack = () => {
      const currentPath = window.location.pathname;
      // 首页路径列表
      const homePaths = ["/", "/#/home", "/home", "/tabs/home"];
      // 检查当前是否在首页
      const isHome = homePaths.some(
        (path) => currentPath === path || currentPath.endsWith(path),
      );
      return !isHome && history.length > 1;
    };

    return () => {
      delete (window as any).canGoBack;
    };
  }, []);

  useEffect(() => {
    // Capture async/runtime errors (Promise rejections, script errors) that
    // React error boundaries won't catch.
    const onError = (event: ErrorEvent) => {
      const err: any = event.error;
      setFatalError({
        name: err?.name,
        message: String(err?.message ?? event.message ?? "Unknown error"),
        stack: err?.stack,
        timestamp: Date.now(),
        source: "window.onerror",
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason: any = event.reason;
      setFatalError({
        name: reason?.name,
        message: String(reason?.message ?? reason ?? "Unhandled rejection"),
        stack: reason?.stack,
        timestamp: Date.now(),
        source: "unhandledrejection",
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  if (fatalError) {
    return (
      <IonApp>
        <ErrorDebugScreen
          error={fatalError}
          onReload={() => window.location.reload()}
        />
      </IonApp>
    );
  }

  return (
    <IonApp>
      <FatalErrorBoundary onFatal={setFatalError}>
        {isTestEnv ? (
          <MemoryRouter>
            <Switch>
              <Route
                path="/dashboard"
                render={(props) => <DashboardPage {...props} />}
              />
              <Route exact path="/home" component={HomePage} />
              <Route path="/test" render={() => <TestPage />} />
              <Route exact path="/topic/:id" component={TopicPage} />
              <Route exact path="/t/:id" component={TopicPage} />
              <Route exact path="/login" component={LoginPage} />
              <Route exact path="/" render={() => <Redirect to="/home" />} />
              <Route component={NotFoundPage} />
            </Switch>
          </MemoryRouter>
        ) : (
          <IonReactRouter history={history}>
            <IonRouterOutlet>
              <Redirect exact from="/" to="/home" />
              <Route
                path="/dashboard"
                render={(props) => <DashboardPage {...props} />}
              />
              <Route exact path="/home" component={HomePage} />
              <Route path="/logs" render={() => <LogsPage />} />
              <Route path="/test" render={() => <TestPage />} />
              <Route exact path="/topic/:id" component={TopicPage} />
              <Route exact path="/login" component={LoginPage} />
              <Route component={NotFoundPage} />
            </IonRouterOutlet>
          </IonReactRouter>
        )}
      </FatalErrorBoundary>
    </IonApp>
  );
};

export default App;
