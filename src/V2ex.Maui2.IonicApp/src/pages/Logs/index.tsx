import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonAlert,
} from "@ionic/react";
import { trash, refresh } from "ionicons/icons";
import { useEffect, useState } from "react";
import {
  clearAllLogs,
  getLogFiles,
  getLogFileContent,
  downloadLogFile,
  LogFile,
  LogFileContent,
} from "./logsService";
import { LogsList } from "./LogsList";
import { LogViewer } from "./LogViewer";
import "./LogsPage.css";

const LogsPage = () => {
  const [logs, setLogs] = useState<LogFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLogContent, setSelectedLogContent] =
    useState<LogFileContent | null>(null);
  const [present] = useIonAlert();

  const loadLogs = async () => {
    setLoading(true);
    const response = await getLogFiles();
    if (response.error) {
      present({
        header: "Error",
        message: response.error,
        buttons: ["OK"],
      });
    } else {
      setLogs(response.files);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleLogSelect = async (fileName: string) => {
    setLoading(true);
    const content = await getLogFileContent(fileName);
    setLoading(false);

    if (!content) {
      present({
        header: "Error",
        message: "Failed to load log content",
        buttons: ["OK"],
      });
    } else {
      setSelectedLogContent(content);
    }
  };

  const handleClearAll = async () => {
    present({
      header: "Clear All Logs",
      message: "Are you sure you want to delete all log files?",
      buttons: [
        {
          text: "Cancel",
          role: "cancel",
        },
        {
          text: "Delete",
          role: "destructive",
          handler: async () => {
            setLoading(true);
            const success = await clearAllLogs();
            setLoading(false);

            if (success) {
              await loadLogs();
              setSelectedLogContent(null);
              present({
                header: "Success",
                message: "All logs cleared",
                buttons: ["OK"],
              });
            } else {
              present({
                header: "Error",
                message: "Failed to clear logs",
                buttons: ["OK"],
              });
            }
          },
        },
      ],
    });
  };

  const handleDownload = async (fileName: string) => {
    await downloadLogFile(fileName);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Logs</IonTitle>
          <div slot="end" style={{ display: "flex", gap: "8px" }}>
            <IonButton onClick={loadLogs} fill="clear">
              <IonIcon icon={refresh} />
            </IonButton>
            {logs.length > 0 && (
              <IonButton onClick={handleClearAll} color="danger" fill="clear">
                <IonIcon icon={trash} />
              </IonButton>
            )}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="logs-container">
          {selectedLogContent ? (
            <>
              <LogViewer
                logContent={selectedLogContent}
                onClose={() => setSelectedLogContent(null)}
                onDownload={handleDownload}
              />
              <div style={{ marginTop: "16px" }}>
                <IonButton
                  expand="block"
                  onClick={() => setSelectedLogContent(null)}
                >
                  Back to List
                </IonButton>
              </div>
            </>
          ) : (
            <>
              {logs.length === 0 && !loading && (
                <div style={{ textAlign: "center", marginTop: "32px" }}>
                  <p>No log files available</p>
                </div>
              )}
              <LogsList
                logs={logs}
                onLogSelect={handleLogSelect}
                onLogDeleted={loadLogs}
                isLoading={loading}
              />
            </>
          )}
        </div>

        <IonLoading isOpen={loading} message="Loading..." />
      </IonContent>
    </IonPage>
  );
};

export default LogsPage;
