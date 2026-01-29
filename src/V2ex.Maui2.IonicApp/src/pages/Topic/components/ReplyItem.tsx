import React from "react";
import { IonAvatar, IonImg, IonBadge, IonIcon } from "@ionic/react";
import { heartOutline } from "ionicons/icons";
import { ReplyInfoType } from "../../../schemas/topicSchema";

interface ReplyItemProps {
  reply: ReplyInfoType;
  isOP: boolean;
  normalizeAvatarUrl: (url?: string | null) => string | null;
  onClick?: (reply: ReplyInfoType) => void;
}

const ReplyItem: React.FC<ReplyItemProps> = ({
  reply,
  isOP,
  normalizeAvatarUrl,
  onClick,
}) => {
  const username = reply.userName || "unknown";
  const avatarUrl = reply.avatar ? normalizeAvatarUrl(reply.avatar) : null;
  const initial = username.trim().slice(0, 1).toUpperCase();

  return (
    <div
      className="replyItem"
      data-reply-id={reply.id}
      onClick={() => onClick?.(reply)}
    >
      <div className="replyMeta">
        <div className="replyMetaLeft">
          {avatarUrl ? (
            <IonAvatar className="replyAvatar" aria-hidden="true">
              <IonImg src={avatarUrl} alt={`${username} avatar`} />
            </IonAvatar>
          ) : (
            <div className="replyAvatarFallback" aria-hidden="true" title={username}>
              {initial || "?"}
            </div>
          )}
          <span className="replyUser">@{username}</span>
          {isOP && (
            <IonBadge color="medium" className="opBadge">
              OP
            </IonBadge>
          )}
        </div>
        <span className="replyRight">
          {reply.thanks && (
            <span className="replyThanks">
              <IonIcon
                icon={heartOutline}
                color={reply.thanked ? "danger" : "medium"}
              />
              {reply.thanks.trim()}
            </span>
          )}
          #{reply.floor}
          {reply.replyTimeText ? ` · ${reply.replyTimeText}` : ""}
        </span>
      </div>

      {reply.content ? (
        <div
          className="replyContent prose"
          dangerouslySetInnerHTML={{
            __html: reply.content,
          }}
        />
      ) : null}
    </div>
  );
};

export default ReplyItem;
