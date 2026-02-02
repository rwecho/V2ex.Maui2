import React, { useEffect } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
  IonText,
  IonSpinner,
  IonAvatar,
  IonImg,
} from "@ionic/react";
import { closeOutline, chatbubbleOutline } from "ionicons/icons";
import { TopicType } from "../schemas/topicSchema";
import { useTopicDetail } from "../pages/Topic/hooks/useTopicDetail";
import { HtmlContent } from "./HtmlContent";
import { useHistory } from "react-router";

interface TopicPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: TopicType | null;
}

export const TopicPreviewModal: React.FC<TopicPreviewModalProps> = ({
  isOpen,
  onClose,
  topic,
}) => {
  const history = useHistory();
  const { topicInfo, loading, error } = useTopicDetail(
    isOpen && topic ? String(topic.id) : "",
  );

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>帖子预览</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {topic && (
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 10px 0" }}>
              {topic.title}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--ion-color-medium)", fontSize: "0.9em" }}>
                 {topicInfo?.avatar && (
                     <IonAvatar style={{ width: 24, height: 24 }}>
                         <IonImg src={topicInfo.avatar} />
                     </IonAvatar>
                 )}
                 <span>{topic.member?.username}</span>
            </div>
          </div>
        )}

        {loading ? (
             <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                 <IonSpinner />
             </div>
        ) : error ? (
            <IonText color="danger">加载失败: {error}</IonText>
        ) : topicInfo ? (
            <HtmlContent html={topicInfo.content || ""} className="prose" />
        ) : null}

      </IonContent>
      <div style={{ padding: "16px", borderTop: "1px solid var(--ion-color-step-100)" }}>
          <IonButton expand="block" onClick={() => {
              onClose();
              if (topic) history.push(`/topic/${topic.id}`);
          }}>
              查看完整讨论
              <IonIcon slot="end" icon={chatbubbleOutline} />
          </IonButton>
      </div>
    </IonModal>
  );
};
