import React from "react";
import { IonText } from "@ionic/react";
import { SupplementInfoType } from "../../../schemas/topicSchema";
import { HtmlContent } from "../../../components/HtmlContent";

interface TopicSupplementsProps {
  supplements: SupplementInfoType[];
}

const TopicSupplements: React.FC<TopicSupplementsProps> = ({ supplements }) => {
  if (!supplements || supplements.length === 0) return null;

  return (
    <div className="topicSupplements">
      {supplements.map((sub, index) => {
        // CLEANUP: createdText often contains "&nbsp;" or other HTML entities.
        // We strip them for a cleaner UI.
        const cleanDate = sub.createdText
          ?.replace(/&nbsp;/g, " ")
          ?.replace(/·/g, "")
          ?.trim();

        return (
          <div key={index} className="supplementItem">
            <div className="supplementHeader">
              <span className="supplementBadge">附言 {index + 1}</span>
              {cleanDate && <span className="supplementDate">{cleanDate}</span>}
            </div>
            <HtmlContent
              className="topicContent prose"
              html={sub.content ?? ""}
            />
          </div>
        );
      })}
    </div>
  );
};

export default TopicSupplements;
