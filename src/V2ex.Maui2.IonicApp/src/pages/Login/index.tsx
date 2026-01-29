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
  IonToolbar,
  IonImg,
  IonButton,
  IonText,
} from "@ionic/react";
import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { apiService } from "../../services/apiService";
import { usePageAnalytics } from "../../hooks/usePageAnalytics";
import { SignInFormInfoType } from "../../schemas/accountSchema";

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
  // Toast 状态已移除 (迁移至原生)
  const [formInfo, setFormInfo] = useState<SignInFormInfoType | null>(null);

  useEffect(() => {
    void logAnalytics("page_view", { page: "login" });
  }, [logAnalytics]);

  useEffect(() => {
    // 如果已经登录，直接跳转回首页
    if (isAuthenticated) {
      history.replace("/home");
    }
  }, [isAuthenticated, history]);

  const showToast = useCallback((message: string) => {
    apiService.showToast(message);
  }, []);

  // 页面加载时获取登录表单信息和验证码
  useEffect(() => {
    const loadFormInfo = async () => {
      const formInfoRes = await apiService.getLoginParameters();
      if (formInfoRes.error !== null) {
        showToast(`获取登录信息失败：${formInfoRes.error}`);
        return;
      }
      setFormInfo(formInfoRes.data);
    };

    void loadFormInfo();
  }, [showToast]);

  const handleRefreshCaptcha = async () => {
    if (!formInfo?.once || isLoadingCaptcha) return;

    setIsLoadingCaptcha(true);
    // Use getCaptchaImage to refresh just the image
    const res = await apiService.getCaptchaImage(formInfo.once);
    setIsLoadingCaptcha(false);

    if (res.error) {
      showToast(`验证码刷新失败: ${res.error}`);
      return;
    }

    setFormInfo({
      ...formInfo,
      captchaImage: res.data!.image,
    });
    setCaptchaCode("");
  };

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
        // 登录失败后刷新验证码
        await handleRefreshCaptcha();
        return;
      }

      // Initial user setup with available data
      setAuthenticated({
        username: signInRes.data.username,
        ...signInRes.data.currentUser,
      });

      // 步骤 2：获取用户信息
      const userRes = await apiService.getCurrentUser();
      if (userRes.error !== null) {
        // 如果获取详细信息失败，我们仍然保持已登录状态（基于 signInRes）
        // 只是记录错误并提示用户
        showToast("登录成功，但获取详细信息失败");
        void logAnalytics("login_attempt", {
          success: true,
          user_info_loaded: false,
        });
      } else {
        // Merge full profile (MemberType) into the user state
        setAuthenticated(userRes.data);
      }

      // 登录成功
      showToast("登录成功");
      void logAnalytics("login_attempt", {
        success: true,
        user_info_loaded: userRes.error === null,
      });

      // 延迟跳转，让用户看到成功提示
      // 延迟跳转，让用户看到成功提示
      // 注意：useEffect 中也会监听 isAuthenticated 变化并跳转
      // 这里显式跳转是为了更快的响应（如果 useEffect 有延迟）
      // 使用 /home 避免根路径重定向
      setTimeout(() => {
        history.replace("/home");
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
      await handleRefreshCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" color={"medium"} text="" />
          </IonButtons>
          <IonTitle>登录</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <div style={{ maxWidth: "400px", margin: "0 auto", marginTop: "20px" }}>
          <div
            style={{
              textAlign: "center",
              marginBottom: "32px",
              marginTop: "16px",
            }}
          >
            <IonImg
              src="/logo.svg"
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto",
                borderRadius: "12px",
              }}
              // Fallback to text if icon missing
              onError={(e) => {
                (e.target as any).style.display = "none";
              }}
            />
            <h2
              style={{ marginTop: "16px", fontSize: "24px", fontWeight: "600" }}
            >
              欢迎回到 V2EX
            </h2>
          </div>

          <IonItem className="rounded-item" lines="full">
            <IonInput
              label="用户名"
              labelPlacement="floating"
              // placeholder="请输入 V2EX 用户名"
              placeholder={formInfo?.usernameFieldName}
              value={username}
              onIonInput={(e) => setUsername(e.detail.value ?? "")}
              autocomplete="username"
              disabled={isLoading}
              clearInput
            />
          </IonItem>

          <IonItem className="rounded-item" lines="full">
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
              clearInput
            />
          </IonItem>

          <IonItem
            className="rounded-item"
            lines="full"
            style={{ marginTop: "8px" }}
          >
            <IonInput
              label="验证码"
              labelPlacement="floating"
              placeholder={formInfo?.captchaFieldName}
              value={captchaCode}
              onIonInput={(e) => setCaptchaCode(e.detail.value ?? "")}
              disabled={isLoading || isLoadingCaptcha}
            />
          </IonItem>

          <div
            onClick={handleRefreshCaptcha}
            style={{
              marginTop: "12px",
              width: "100%",
            }}
          >
            {isLoadingCaptcha ? (
              <IonSpinner name="dots" color="medium" />
            ) : formInfo?.captchaImage ? (
              <img
                src={`data:image/png;base64,${formInfo.captchaImage}`}
                alt="captcha"
                style={{ width: "100%", objectFit: "contain" }}
              />
            ) : (
              <span
                style={{ fontSize: "12px", color: "var(--ion-color-medium)" }}
              >
                点击加载验证码
              </span>
            )}
          </div>

          <IonButton
            expand="block"
            onClick={handleLogin}
            disabled={
              isLoading ||
              !username.trim() ||
              !password.trim() ||
              !captchaCode.trim()
            }
            style={{ marginTop: "32px", "--border-radius": "8px" }}
            shape="round"
          >
            {isLoading ? <IonSpinner name="crescent" /> : "登录"}
          </IonButton>

          <IonText
            color="medium"
            className="ion-text-center"
            style={{ display: "block", marginTop: "24px", fontSize: "12px" }}
          >
            <p>
              登录即表示您同意 V2EX 的
              <IonText color="primary">
                <a
                  href="https://www.v2ex.com/about"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", margin: "0 4px" }}
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
                  style={{ textDecoration: "none", margin: "0 4px" }}
                >
                  隐私政策
                </a>
              </IonText>
            </p>
          </IonText>
        </div>


          {/* Toast 移除 */}
        
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
