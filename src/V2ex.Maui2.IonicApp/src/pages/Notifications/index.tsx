import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonImg,
  IonText,
  IonSpinner,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  useIonViewWillEnter,
} from "@ionic/react";
import { useState } from "react";
import { useHistory } from "react-router";
import { apiService } from "../../services/apiService";
import {
  NotificationInfoType,
  NotificationItemType,
} from "../../schemas/topicSchema";
import { useAuthStore } from "../../store/authStore";
import "./Notifications.css";

const NotificationsPage: React.FC = () => {
  const [items, setItems] = useState<NotificationItemType[]>([]);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const history = useHistory();

  const fetchNotifications = async (
    targetPage: number,
    append: boolean = false,
  ) => {
    if (!append) {
      setLoading(true);
      setError(null);
    }

    try {
      const res = await apiService.getNotifications(targetPage);
      if (res.error) {
        if (!append) setError(res.error);
        else {
          // Toast or silent fail for infinite scroll error
          console.error(res.error);
        }
      } else if (res.data) {
        const data = res.data;
        if (append) {
          setItems((prev) => [...prev, ...data.items]);
        } else {
          setItems(data.items);
        }
        setMaxPage(data.maximumPage);
        setPage(targetPage);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "加载失败";
      if (!append) setError(msg);
      else console.error(msg);
    } finally {
      if (!append) setLoading(false);
    }
  };


  useIonViewWillEnter(() => {
    if (!useAuthStore.getState().isAuthenticated) {
        history.replace("/login");
        return;
    }
    // Initial load, reset to page 1
    void fetchNotifications(1, false);
  });

  const handleRefresh = async (event: CustomEvent) => {
    await fetchNotifications(1, false);
    event.detail.complete();
  };

  const handleInfinite = async (ev: CustomEvent) => {
    if (page < maxPage) {
      await fetchNotifications(page + 1, true);
    }
    (ev.target as HTMLIonInfiniteScrollElement).complete();
  };

  const handleItemClick = (n: NotificationItemType) => {
    if (n.topicLink) {
      const match = n.topicLink.match(/\/t\/(\d+)/);
      if (match) {
        history.push(`/topic/${match[1]}`);
        return;
      }
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>消息通知</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading && items.length === 0 && (
          <div className="ion-text-center ion-padding">
            <IonSpinner />
          </div>
        )}

        {error && items.length === 0 && (
          <div className="ion-text-center ion-padding">
            <IonText color="danger">{error}</IonText>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="ion-text-center ion-padding">
            <IonText color="medium">暂无新消息</IonText>
          </div>
        )}

        <IonList lines="full">
          {items.map((n, index) => (
            <IonItem
              key={index}
              button
              detail={false}
              onClick={() => handleItemClick(n)}
            >
              <IonAvatar slot="start">
                <IonImg src={n.avatar} />
              </IonAvatar>
              <IonLabel className="ion-text-wrap">
                <h2>
                  <IonText color="primary">{n.userName}</IonText>{" "}
                  <IonText color="medium" style={{ fontSize: "0.9em" }}>
                    {n.preTitle && <span>{n.preTitle} </span>}
                    <IonText color="dark">{n.topicTitle}</IonText>
                    {n.postTitle && <span> {n.postTitle}</span>}
                  </IonText>
                </h2>
                {n.payload && (
                  <div
                    className="notification-content"
                    dangerouslySetInnerHTML={{ __html: n.payload || "" }}
                  />
                )}

                <p>
                  <IonText color="medium" style={{ fontSize: "0.8em" }}>
                    {n.created}
                  </IonText>
                </p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>

        <IonInfiniteScroll
          onIonInfinite={handleInfinite}
          threshold="100px"
          disabled={page >= maxPage}
        >
          <IonInfiniteScrollContent loadingText="正在加载更多..." />
        </IonInfiniteScroll>
      </IonContent>
    </IonPage>
  );
};

export default NotificationsPage;
