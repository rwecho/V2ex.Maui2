import React from "react";
import { IonText, IonBadge } from "@ionic/react";
import { TopicInfoType } from "../../../schemas/topicSchema";

interface TopicHeaderProps {
  topicInfo: TopicInfoType;
}

const TopicHeader: React.FC<TopicHeaderProps> = ({ topicInfo }) => {
  return (
    <div className="topicHeader">
      <h1 className="topicTitle">{topicInfo.title}</h1>

      <div className="topicMeta">
        {topicInfo.userName && (
          <IonText color="medium">@{topicInfo.userName}</IonText>
        )}
        {topicInfo.nodeName && (
          <IonBadge color="light">{topicInfo.nodeName}</IonBadge>
        )}
        {topicInfo.createdText && (
          <IonText color="medium">{topicInfo.createdText}</IonText>
        )}
        
        {topicInfo.tags && topicInfo.tags.length > 0 && (
          <div className="topicTags">
            {topicInfo.tags.map((tag) => (
              <IonBadge key={tag} color="light" mode="ios" className="topicTag">
                #{tag}
              </IonBadge>
            ))}
          </div>
        )}
      </div>

      {topicInfo.content && (
        <div
          className="topicContent prose"
          dangerouslySetInnerHTML={{
            __html: topicInfo.content ?? "",
          }}
        />
      )}
    </div>
  );
};

export default TopicHeader;
