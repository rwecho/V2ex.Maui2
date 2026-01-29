import {
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonImg,
  IonSearchbar,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  IonAlert,
  IonButton,
  IonText,
  IonNote,
  useIonViewWillEnter,
  IonBackButton,
} from "@ionic/react";
import { trashOutline, timeOutline } from "ionicons/icons";
import { useState } from "react";
import { apiService } from "../../services/apiService";
import { HistoryItem } from "../../services/IV2exApiService";
import { useHistory } from "react-router";
import "./index.css";

const HistoryPage: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useHistory();

  const loadHistory = async () => {
    setLoading(true);
    const res = await apiService.getHistory();
    if (res.error === null) {
      setHistoryItems(res.data);
    }
    setLoading(false);
  };

  useIonViewWillEnter(() => {
    void loadHistory();
  });

  const handleClearAll = async () => {
    const res = await apiService.clearHistory();
    if (res.error === null) {
      setHistoryItems([]);
    }
  };

  const handleDeleteItem = async (topicId: number) => {
    const res = await apiService.removeHistory(topicId);
    if (res.error === null) {
      setHistoryItems(historyItems.filter((item) => item.id !== topicId));
    }
  };

  const filteredItems = historyItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchText.toLowerCase()) ||
      item.userName.toLowerCase().includes(searchText.toLowerCase()),
  );

  const normalizeAvatarUrl = (url?: string | null): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    if (trimmed.startsWith("/")) return `https://www.v2ex.com${trimmed}`;
    return trimmed;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" color={"medium"} text="" />
          </IonButtons>
          <IonTitle>浏览历史</IonTitle>
          <IonButtons slot="end">
            {historyItems.length > 0 && (
              <IonButton color="danger" onClick={() => setShowAlert(true)}>
                <IonIcon icon={trashOutline} slot="icon-only" />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
        <IonSearchbar
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value!)}
          placeholder="搜索标题或用户"
        />
      </IonHeader>

      <IonContent>
        {loading && historyItems.length === 0 ? (
          <div className="historyEmptyState">
            <IonText color="medium">加载中...</IonText>
          </div>
        ) : filteredItems.length > 0 ? (
          <IonList inset={false} lines="full">
            {filteredItems.map((item) => (
              <IonItemSliding key={item.id}>
                <IonItem
                  button
                  detail={false}
                  onClick={() => router.push(`/topic/${item.id}`)}
                >
                  <IonAvatar slot="start" className="historyAvatar">
                    <IonImg
                      src={normalizeAvatarUrl(item.userAvatar) || ""}
                      alt={item.userName}
                    />
                  </IonAvatar>
                  <IonLabel className="ion-text-wrap">
                    <div className="historyTitle">{item.title}</div>
                    <div className="historyMeta">
                      <IonText color="medium">@{item.userName}</IonText>
                      <IonNote className="historyDate">
                        <IonIcon
                          icon={timeOutline}
                          style={{
                            verticalAlign: "middle",
                            marginRight: "4px",
                          }}
                        />
                        {formatDate(item.viewedAt)}
                      </IonNote>
                    </div>
                  </IonLabel>
                </IonItem>

                <IonItemOptions side="end">
                  <IonItemOption
                    color="danger"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <IonIcon icon={trashOutline} slot="icon-only" />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        ) : (
          <div className="historyEmptyState">
            <IonIcon icon={timeOutline} size="large" color="medium" />
            <IonText color="medium">
              <p>{searchText ? "未找到匹配的历史记录" : "暂无浏览历史"}</p>
            </IonText>
          </div>
        )}

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="清空历史"
          message="确定要清空所有浏览历史吗？"
          buttons={[
            {
              text: "取消",
              role: "cancel",
            },
            {
              text: "确认",
              role: "destructive",
              handler: handleClearAll,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default HistoryPage;
