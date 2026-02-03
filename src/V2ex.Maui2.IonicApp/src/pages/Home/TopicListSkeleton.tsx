import {
  IonItem,
  IonAvatar,
  IonLabel,
  IonList,
  IonSkeletonText,
} from "@ionic/react";

// Skeleton 加载占位组件
const TopicListSkeleton = () => {
  return (
    <IonList inset={false} lines="full">
      {[...Array(20)].map((_, index) => (
        <IonItem key={index}>
          <IonAvatar className="topicListAvatar" slot="start">
            <IonSkeletonText
              animated
              style={{ width: "100%", height: "100%", borderRadius: "50%" }}
            />
          </IonAvatar>
          <IonLabel>
            <div className="topicListTitle">
              <IonSkeletonText
                animated
                style={{ width: "90%", height: "16px" }}
              />
            </div>
            <div className="topicListMeta" style={{ marginTop: "8px" }}>
              <IonSkeletonText
                animated
                style={{
                  width: "60px",
                  height: "12px",
                  display: "inline-block",
                }}
              />
              <IonSkeletonText
                animated
                style={{
                  width: "40px",
                  height: "18px",
                  display: "inline-block",
                  marginLeft: "8px",
                  borderRadius: "4px",
                }}
              />
              <IonSkeletonText
                animated
                style={{
                  width: "30px",
                  height: "12px",
                  display: "inline-block",
                  marginLeft: "8px",
                }}
              />
            </div>
          </IonLabel>
        </IonItem>
      ))}
    </IonList>
  );
};

export default TopicListSkeleton;
