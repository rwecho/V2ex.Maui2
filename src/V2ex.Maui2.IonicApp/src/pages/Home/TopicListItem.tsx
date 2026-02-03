import React, { useRef, useEffect, memo } from "react";
import {
  IonAvatar,
  IonImg,
  IonItem,
  IonLabel,
  IonBadge,
  IonText,
  IonIcon,
} from "@ionic/react";
import { bookmark } from "ionicons/icons";
import Hammer from "hammerjs";
import type { TopicType } from "../../schemas/topicSchema";
import { Haptics } from "../../utils/haptics";
import { getMemberAvatarUrl } from "../../utils/v2ex";

interface TopicListItemProps {
  topic: TopicType;
  isReadLater: boolean;
  onPress: (t: TopicType) => void;
  onClick: (t: TopicType) => void;
}

const TopicListItem = memo(
  ({ topic, isReadLater, onPress, onClick }: TopicListItemProps) => {
    const elRef = useRef<HTMLIonItemElement>(null);

    useEffect(() => {
      if (!elRef.current) return;

      const mc = new Hammer(elRef.current, {
        touchAction: "auto",
      });
      mc.get("press").set({ time: 500 });

      mc.on("press", () => {
        Haptics.medium();
        onPress(topic);
      });

      return () => {
        mc.destroy();
      };
    }, [topic, onPress]);

    const avatarUrl = getMemberAvatarUrl(topic);

    return (
      <IonItem
        ref={elRef}
        button
        detail={false}
        className={isReadLater ? "topic-read-later" : ""}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => onClick(topic)}
      >
        <IonAvatar className="topicListAvatar" slot="start">
          {avatarUrl ? (
            <IonImg src={avatarUrl} alt={topic.member?.username || "avatar"} />
          ) : (
            <div className="topicListAvatarFallback">
              <span>
                {topic.member?.username?.slice(0, 1)?.toUpperCase() || "?"}
              </span>
            </div>
          )}
        </IonAvatar>
        <IonLabel className="ion-text-wrap">
          <div className="topicListTitle">
            {String(topic.title)}
            {isReadLater && (
              <IonIcon
                icon={bookmark}
                color="warning"
                style={{
                  verticalAlign: "middle",
                  marginLeft: "6px",
                  fontSize: "0.9em",
                }}
              />
            )}
          </div>
          <div className="topicListMeta">
            {topic.member?.username && (
              <IonText color="medium">@{topic.member.username}</IonText>
            )}
            {(topic.node?.title || topic.node?.name) && (
              <IonBadge color="light">
                {String(topic.node?.title ?? topic.node?.name ?? "")}
              </IonBadge>
            )}
            {typeof topic.replies === "number" && (
              <IonText color="medium">💬 {topic.replies}</IonText>
            )}
          </div>
        </IonLabel>
      </IonItem>
    );
  },
);

TopicListItem.displayName = "TopicListItem";

export default TopicListItem;
