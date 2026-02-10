import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonText,
  IonIcon,
} from "@ionic/react";
import { useUserBlockStore } from "../../store/userBlockStore";
import { trashOutline } from "ionicons/icons";
import { apiService } from "../../services/apiService";
import { Haptics } from "../../utils/haptics";

const BlockedUsersPage: React.FC = () => {
  const { blockedUsers, unblockUser } = useUserBlockStore();

  const handleUnblock = (username: string) => {
    unblockUser(username);
    Haptics.success();
    apiService.showToast(`已取消屏蔽 @${username}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/settings" />
          </IonButtons>
          <IonTitle>屏蔽用户管理</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {blockedUsers.length === 0 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              flexDirection: "column",
            }}
          >
            <IonText color="medium">
              <p>暂无屏蔽用户</p>
            </IonText>
          </div>
        ) : (
          <IonList inset>
            {blockedUsers.map((username) => (
              <IonItem key={username}>
                <IonLabel>
                  <h2>{username}</h2>
                </IonLabel>
                <IonButton
                  slot="end"
                  fill="clear"
                  color="danger"
                  onClick={() => handleUnblock(username)}
                >
                  <IonIcon slot="icon-only" icon={trashOutline} />
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default BlockedUsersPage;
