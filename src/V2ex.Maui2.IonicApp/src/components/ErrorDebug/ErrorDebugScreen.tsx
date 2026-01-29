import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { copyOutline, refreshOutline } from "ionicons/icons";
import { useMemo, useState } from "react";
import { apiService } from "../../services/apiService";
import "./ErrorDebugScreen.css";

export type CapturedError = {
  name?: string;
  message: string;
  stack?: string;
  componentStack?: string;
  source?: string;
  url?: string;
  timestamp: number;
  userAgent?: string;
};

const formatTs = (ts: number) => {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
};

const buildCopyText = (e: CapturedError) => {
  const lines: string[] = [];
  lines.push("V2ex.Maui2 - Error Report");
  lines.push(`Time: ${formatTs(e.timestamp)} (${e.timestamp})`);
  if (e.url) lines.push(`URL: ${e.url}`);
  if (e.source) lines.push(`Source: ${e.source}`);
  if (e.userAgent) lines.push(`UA: ${e.userAgent}`);
  lines.push("");
  lines.push(`Name: ${e.name ?? "Error"}`);
  lines.push(`Message: ${e.message}`);
  lines.push("");

  if (e.stack) {
    lines.push("Stack:");
    lines.push(e.stack);
    lines.push("");
  }

  if (e.componentStack) {
    lines.push("ComponentStack:");
    lines.push(e.componentStack);
    lines.push("");
  }

  return lines.join("\n");
};

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallthrough
  }

  // Fallback for older WebViews
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

type ErrorDebugScreenProps = {
  error: CapturedError;
  onReload?: () => void;
};

const ErrorDebugScreen = (props: ErrorDebugScreenProps) => {
  const { error, onReload } = props;

  const [showDetails, setShowDetails] = useState(false);
  // Toast 状态已移除 (迁移至原生)

  const basicTitle = useMemo(() => {
    const name = error.name ? `${error.name}: ` : "";
    return `${name}${error.message || "Unknown error"}`;
  }, [error.name, error.message]);

  const copyText = useMemo(() => buildCopyText(error), [error]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(copyText);
    apiService.showToast(ok ? "已复制完整堆栈" : "复制失败（系统限制）");
  };

  const handleReload = () => {
    if (onReload) {
      onReload();
      return;
    }
    window.location.reload();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" color={"medium"} text="" />
          </IonButtons>
          <IonTitle>发生异常</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleCopy}>
              <IonIcon slot="start" icon={copyOutline} />
            </IonButton>
            <IonButton onClick={handleReload}>
              <IonIcon slot="start" icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="errorDebugBody">
          <IonText color="danger">
            <h2 className="errorDebugTitle">{basicTitle}</h2>
          </IonText>

          <IonText color="medium">
            <div className="errorDebugMeta">
              <p>时间：{formatTs(error.timestamp)}</p>
              {error.source ? <p>来源：{error.source}</p> : null}
              {error.url ? <p>页面：{error.url}</p> : null}
            </div>
          </IonText>

          <div className="errorDebugActions">
            <IonButton
              fill={showDetails ? "solid" : "outline"}
              onClick={() => setShowDetails((v) => !v)}
            >
              {showDetails ? "隐藏详细信息" : "查看详细信息"}
            </IonButton>
            <IonButton fill="outline" onClick={handleCopy}>
              <IonIcon slot="start" icon={copyOutline} />
              复制完整堆栈
            </IonButton>
          </div>
        </div>

        {showDetails ? (
          <IonList inset>
            <IonItem>
              <IonLabel className="ion-text-wrap">
                <strong>Message</strong>
                <div className="errorDebugPre">
                  {error.message || "(empty)"}
                </div>
              </IonLabel>
            </IonItem>
            {error.stack ? (
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <strong>Stack</strong>
                  <div className="errorDebugPre">{error.stack}</div>
                </IonLabel>
              </IonItem>
            ) : null}
            {error.componentStack ? (
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <strong>Component Stack</strong>
                  <div className="errorDebugPre">{error.componentStack}</div>
                </IonLabel>
              </IonItem>
            ) : null}
            {error.userAgent ? (
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <strong>User Agent</strong>
                  <div className="errorDebugPre">{error.userAgent}</div>
                </IonLabel>
              </IonItem>
            ) : null}
          </IonList>
        ) : null}


        {/* Toast 移除 */}
      </IonContent>
    </IonPage>
  );
};

export default ErrorDebugScreen;
