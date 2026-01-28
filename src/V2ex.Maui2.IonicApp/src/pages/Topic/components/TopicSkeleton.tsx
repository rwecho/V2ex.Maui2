import React from "react";
import { IonSkeletonText, IonList, IonItem, IonAvatar } from "@ionic/react";

const TopicSkeleton: React.FC = () => {
  return (
    <div className="topicSkeleton">
      {/* 话题 Header 骨架 */}
      <div className="topicHeader">
        <h1 className="topicTitle">
          <IonSkeletonText animated style={{ width: "90%", height: "24px" }} />
        </h1>
        <div className="topicMeta">
          <IonSkeletonText
            animated
            style={{ width: "60px", height: "16px", display: "inline-block" }}
          />
          <IonSkeletonText
            animated
            style={{
              width: "40px",
              height: "18px",
              display: "inline-block",
              marginLeft: "8px",
            }}
          />
          <IonSkeletonText
            animated
            style={{
              width: "80px",
              height: "16px",
              display: "inline-block",
              marginLeft: "8px",
            }}
          />
        </div>
        <div className="topicContent" style={{ marginTop: "20px" }}>
          <IonSkeletonText animated style={{ width: "100%", height: "16px" }} />
          <IonSkeletonText animated style={{ width: "95%", height: "16px" }} />
          <IonSkeletonText animated style={{ width: "80%", height: "16px" }} />
        </div>
      </div>

      <div className="replyHeader">
        <div className="replyTitle">
          <IonSkeletonText animated style={{ width: "100px", height: "18px" }} />
        </div>
      </div>

      {/* 回复列表骨架 */}
      <IonList lines="none">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="replyItem">
            <div className="replyMeta">
              <div className="replyMetaLeft">
                <IonAvatar className="replyAvatar">
                  <IonSkeletonText
                    animated
                    style={{ width: "100%", height: "100%" }}
                  />
                </IonAvatar>
                <IonSkeletonText
                  animated
                  style={{ width: "60px", height: "16px", marginLeft: "8px" }}
                />
              </div>
              <IonSkeletonText animated style={{ width: "40px", height: "16px" }} />
            </div>
            <div className="replyContent" style={{ marginTop: "8px" }}>
              <IonSkeletonText animated style={{ width: "90%", height: "14px" }} />
              <IonSkeletonText animated style={{ width: "70%", height: "14px" }} />
            </div>
          </div>
        ))}
      </IonList>
    </div>
  );
};

export default TopicSkeleton;
