import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonText,
} from "@ionic/react";
import { copy, download } from "ionicons/icons";
import { LogFileContent } from "./logsService";

interface LogViewerProps {
  logContent: LogFileContent | null;
  onClose: () => void;
  onDownload: (fileName: string) => void;
}

export const LogViewer = ({
  logContent,
  onClose,
  onDownload,
}: LogViewerProps) => {
  if (!logContent) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(logContent.content);
    alert("Log content copied to clipboard!");
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>{logContent.fileName}</IonCardTitle>
        <IonText color="medium" style={{ fontSize: "0.9em" }}>
          <p>
            Modified: {formatDate(logContent.lastModified)} | Size:{" "}
            {formatFileSize(logContent.size)}
          </p>
        </IonText>
      </IonCardHeader>
      <IonCardContent>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <IonButton
            size="small"
            onClick={() => onDownload(logContent.fileName)}
            color="primary"
          >
            <IonIcon icon={download} slot="start" />
            Download
          </IonButton>
          <IonButton size="small" onClick={handleCopy} color="primary">
            <IonIcon icon={copy} slot="start" />
            Copy
          </IonButton>
          <IonButton size="small" onClick={onClose} color="medium">
            Close
          </IonButton>
        </div>
        <div
          style={{
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            maxHeight: "400px",
            overflowY: "auto",
            fontFamily: "monospace",
            fontSize: "12px",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
        >
          {logContent.content}
        </div>
      </IonCardContent>
    </IonCard>
  );
};
