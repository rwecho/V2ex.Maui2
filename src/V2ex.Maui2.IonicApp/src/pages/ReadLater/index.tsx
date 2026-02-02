import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonText,
} from "@ionic/react";
import React from "react";
import TopicList from "../Home/TopicList";
import { useReadLaterStore } from "../../store/readLaterStore";

const ReadLaterPage: React.FC = () => {
  const { topics, load } = useReadLaterStore();

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>稍后阅读</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {topics.length === 0 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "50px",
            }}
          >
            <IonText color="medium">还没有添加稍后阅读的话题</IonText>
          </div>
        ) : (
          <TopicList
            topics={topics}
            loading={false}
            error={null}
            isActive={true}
            emptyText="列表为空"
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default ReadLaterPage;
