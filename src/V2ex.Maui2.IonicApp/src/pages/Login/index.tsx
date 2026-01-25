import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToast,
  IonToolbar,
  IonImg,
  IonButton,
  IonText,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useAuthStore, type SignInFormInfo } from "../../store/authStore";
import { apiService } from "../../services/apiService";
import { usePageAnalytics } from "../../hooks/usePageAnalytics";

const LoginPage = () => {
  const history = useHistory();
  const logAnalytics = usePageAnalytics();

  const { isAuthenticated, setAuthenticated, setLoading, setError, signOut } =
    useAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCaptcha, setIsLoadingCaptcha] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [formInfo, setFormInfo] = useState<SignInFormInfo | null>(null);

  useEffect(() => {
    void logAnalytics("page_view", { page: "login" });
  }, [logAnalytics]);

  useEffect(() => {
    // 如果已经登录，直接跳转回首页
    if (isAuthenticated) {
      history.replace("/");
    }
  }, [isAuthenticated, history]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastOpen(true);
  }, []);

  // 页面加载时获取登录表单信息和验证码
  useEffect(() => {
    const loadFormInfo = async () => {
      const formInfoRes = await apiService.getLoginParameters();
      if (formInfoRes.error !== null) {
        showToast(`获取登录信息失败：${formInfoRes.error}`);
        return;
      }

      const info: SignInFormInfo = formInfoRes.data;
      setFormInfo(info);
    };

    void loadFormInfo();
  }, [showToast]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showToast("请输入用户名和密码");
      return;
    }

    if (!captchaCode.trim()) {
      showToast("请输入验证码");
      return;
    }

    if (!formInfo) {
      showToast("登录信息未加载完成，请稍候");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 步骤 1：执行登录
      const signInRes = await apiService.signIn(
        username.trim(),
        password,
        formInfo,
        captchaCode.trim(),
      );

      if (signInRes.error !== null) {
        showToast(signInRes.error);
        setError(signInRes.error);
        void logAnalytics("login_attempt", {
          success: false,
          reason: "sign_in_failed",
        });
        // 登录失败后重新加载验证码
        setCaptchaCode("");
        return;
      }

      // 步骤 2：获取用户信息
      const userRes = await apiService.getCurrentUser();
      if (userRes.error !== null) {
        showToast("登录成功，但获取用户信息失败");
        setError(userRes.error);
        void logAnalytics("login_attempt", {
          success: true,
          user_info_loaded: false,
        });
        // 即使获取用户信息失败，也认为登录成功
        setAuthenticated({
          id: 0,
          username: signInRes.data.username,
          tagline: "",
          avatarLarge: "",
          avatarMini: "",
          status: "",
          bio: null,
          website: null,
          github: null,
          created: 0,
          numTopics: 0,
          numPosts: 0,
          followers: 0,
        });
        return;
      }

      // 登录成功
      setAuthenticated(userRes.data);
      showToast("登录成功");
      void logAnalytics("login_attempt", {
        success: true,
        user_info_loaded: true,
      });

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        history.replace("/");
      }, 500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "登录失败";
      showToast(errorMsg);
      setError(errorMsg);
      void logAnalytics("login_attempt", {
        success: false,
        reason: "exception",
      });
      // 登录失败后重新加载验证码
      setCaptchaCode("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>登录</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div>
          <IonItem>
            <IonInput
              label="用户名"
              labelPlacement="floating"
              // placeholder="请输入 V2EX 用户名"
              placeholder={formInfo?.usernameFieldName}
              value={username}
              onIonInput={(e) => setUsername(e.detail.value ?? "")}
              autocomplete="username"
              disabled={isLoading}
            />
          </IonItem>

          <IonItem>
            <IonInput
              label="密码"
              labelPlacement="floating"
              type="password"
              // placeholder="请输入密码"
              placeholder={formInfo?.passwordFieldName}
              value={password}
              onIonInput={(e) => setPassword(e.detail.value ?? "")}
              autocomplete="current-password"
              disabled={isLoading}
            />
          </IonItem>

          {/* 验证码输入区域 */}
          <IonItem>
            <IonInput
              label="验证码"
              labelPlacement="floating"
              // placeholder="请输入验证码"
              placeholder={formInfo?.captchaFieldName}
              value={captchaCode}
              onIonInput={(e) => setCaptchaCode(e.detail.value ?? "")}
              disabled={isLoading || isLoadingCaptcha}
            />
          </IonItem>

          <IonCard style={{ margin: "16px" }}>
            <IonCardContent className="ion-text-center">
              {isLoadingCaptcha ? (
                <IonSpinner name="crescent" />
              ) : (
                <IonImg
                  src={
                    formInfo?.captchaImage
                      ? `data:image/png;base64,${formInfo.captchaImage}`
                      : ""
                  }
                  style={{ maxWidth: "100%", cursor: "pointer" }}
                />
              )}
              <IonLabel
                color="medium"
                style={{ display: "block", marginTop: "8px" }}
              >
                双击图片刷新验证码
              </IonLabel>
            </IonCardContent>
          </IonCard>

          <IonButton
            expand="block"
            onClick={handleLogin}
            disabled={
              isLoading ||
              !username.trim() ||
              !password.trim() ||
              !captchaCode.trim()
            }
          >
            {isLoading ? <IonSpinner name="crescent" /> : "登录"}
          </IonButton>

          <IonText color="medium">
            <p>
              登录即表示您同意 V2EX 的
              <IonText color="primary">
                <a
                  href="https://www.v2ex.com/about"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  服务条款
                </a>
              </IonText>
              和
              <IonText color="primary">
                <a
                  href="https://www.v2ex.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  隐私政策
                </a>
              </IonText>
            </p>
          </IonText>
        </div>

        <IonToast
          isOpen={toastOpen}
          message={toastMessage}
          duration={2000}
          position="top"
          onDidDismiss={() => setToastOpen(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
