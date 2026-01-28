import React from "react";
import { IonText } from "@ionic/react";
import { SupplementInfoType } from "../../../schemas/topicSchema";

interface TopicSupplementsProps {
  supplements: SupplementInfoType[];
}

const TopicSupplements: React.FC<TopicSupplementsProps> = ({ supplements }) => {
  if (!supplements || supplements.length === 0) return null;

  return (
    <div className="topicSupplements">
      {supplements.map((sub, index) => (
        <div key={index} className="supplementItem">
          <div className="supplementHeader">
            <IonText color="medium">
              附言 {index + 1}
              {sub.createdText ? ` · ${sub.createdText}` : ""}
            </IonText>
          </div>
          <div
            className="topicContent prose"
            dangerouslySetInnerHTML={{
              __html: sub.content ?? "",
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default TopicSupplements;
