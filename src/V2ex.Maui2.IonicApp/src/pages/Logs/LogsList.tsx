import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonActionSheet,
  IonLoading,
} from "@ionic/react";
import { trash, download, eye } from "ionicons/icons";
import { useState } from "react";
import { deleteLogFile, downloadLogFile, LogFile } from "./logsService";

interface LogListProps {
  logs: LogFile[];
  onLogSelect: (fileName: string) => void;
  onLogDeleted: () => void;
  isLoading?: boolean;
}

export const LogsList = ({
  logs,
  onLogSelect,
  onLogDeleted,
  isLoading = false,
}: LogListProps) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!selectedFile) return;

    setDeleting(true);
    const success = await deleteLogFile(selectedFile);
    setDeleting(false);

    if (success) {
      setShowActions(false);
      setSelectedFile(null);
      onLogDeleted();
    }
  };

  const handleDownload = async () => {
    if (!selectedFile) return;
    await downloadLogFile(selectedFile);
    setShowActions(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <IonList>
        {logs && logs.length > 0 ? (
          logs.map((log) => (
            <IonItem key={log.name}>
              <IonLabel>
                <h2>{log.name}</h2>
                <IonNote>{formatDate(log.lastModified)}</IonNote>
                <IonNote>{formatFileSize(log.size)}</IonNote>
              </IonLabel>
              <IonButton
                slot="end"
                fill="clear"
                color="primary"
                onClick={() => onLogSelect(log.name)}
                title="View log content"
              >
                <IonIcon icon={eye} />
              </IonButton>
              <IonButton
                slot="end"
                fill="clear"
                color="primary"
                onClick={() => {
                  setSelectedFile(log.name);
                  setShowActions(true);
                }}
                title="More actions"
              >
                <IonIcon icon={download} />
              </IonButton>
            </IonItem>
          ))
        ) : (
          <IonItem>
            <IonLabel>No log files found</IonLabel>
          </IonItem>
        )}
      </IonList>

      <IonActionSheet
        isOpen={showActions}
        onDidDismiss={() => setShowActions(false)}
        buttons={[
          {
            text: "Download",
            icon: download,
            handler: handleDownload,
          },
          {
            text: "Delete",
            role: "destructive",
            icon: trash,
            handler: handleDelete,
          },
          {
            text: "Cancel",
            role: "cancel",
          },
        ]}
      />

      <IonLoading isOpen={deleting} message="Deleting..." />
    </>
  );
};
