import React from "react";
import { IonIcon, IonSpinner, IonTextarea } from "@ionic/react";
import { imageOutline, atOutline, happyOutline } from "ionicons/icons";
import EmojiPicker from "../../../components/EmojiPicker";
import MentionPicker, { ReplyItem as MentionReplyItem } from "../../../components/MentionPicker";

interface TopicReplyFooterProps {
  isAuthenticated: boolean;
  isReplyExpanded: boolean;
  setIsReplyExpanded: (expanded: boolean) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  isSubmittingReply: boolean;
  isUploadingImage: boolean;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  showMentionPicker: boolean;
  setShowMentionPicker: (show: boolean) => void;
  textareaRef: React.RefObject<HTMLIonTextareaElement | null>;
  handleImageUpload: () => Promise<void>;
  handleEmojiSelect: (emoji: string) => void;
  handleMentionSelect: (username: string, floor: number) => void;
  handleSubmitReply: () => Promise<void>;
  replyItems: MentionReplyItem[];
  canReply: boolean;
}

const TopicReplyFooter: React.FC<TopicReplyFooterProps> = ({
  isAuthenticated,
  isReplyExpanded,
  setIsReplyExpanded,
  replyContent,
  setReplyContent,
  isSubmittingReply,
  isUploadingImage,
  showEmojiPicker,
  setShowEmojiPicker,
  showMentionPicker,
  setShowMentionPicker,
  textareaRef,
  handleImageUpload,
  handleEmojiSelect,
  handleMentionSelect,
  handleSubmitReply,
  replyItems,
  canReply,
}) => {
  if (!isAuthenticated) return null;

  return (
    <>
      {/* 展开时的背景遮罩 */}
      {isReplyExpanded && (
        <div className="douyin-backdrop" onClick={() => setIsReplyExpanded(false)} />
      )}
      <div className={`douyin-reply-footer ${isReplyExpanded ? "expanded" : "collapsed"}`}>
        {/* 收起状态: 一行式输入框 */}
        {!isReplyExpanded ? (
          <div className="douyin-collapsed-bar" onClick={() => setIsReplyExpanded(true)}>
            <div className="douyin-collapsed-input">
              <span className="douyin-placeholder">有什么想法，展开说说</span>
            </div>
            <div className="douyin-collapsed-icons">
              <IonIcon
                icon={imageOutline}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsReplyExpanded(true);
                  handleImageUpload();
                }}
              />
              <IonIcon
                icon={happyOutline}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsReplyExpanded(true);
                  setShowEmojiPicker(true);
                }}
              />
            </div>
          </div>
        ) : (
          /* 展开状态: 完整编辑器 */
          <div className="douyin-reply-container">
            <div className="douyin-textarea-wrapper">
              <IonTextarea
                ref={textareaRef}
                className="douyin-textarea"
                placeholder="有什么想法，展开说说"
                value={replyContent}
                onIonInput={(e) => setReplyContent(e.detail.value ?? "")}
                rows={3}
                autoGrow={true}
                disabled={isSubmittingReply || !canReply}
                maxlength={20000}
              />
            </div>
            <div className="douyin-bottom-bar">
              <div className="douyin-action-icons">
                <button
                  className="douyin-icon-btn"
                  type="button"
                  onClick={handleImageUpload}
                  disabled={isUploadingImage || isSubmittingReply}
                >
                  {isUploadingImage ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <IonIcon icon={imageOutline} />
                  )}
                </button>
                <button
                  className={`douyin-icon-btn ${showMentionPicker ? "active" : ""}`}
                  type="button"
                  onClick={() => {
                    setShowMentionPicker(!showMentionPicker);
                    setShowEmojiPicker(false); // 互斥
                  }}
                >
                  <IonIcon icon={atOutline} />
                </button>
                <button
                  className={`douyin-icon-btn ${showEmojiPicker ? "active" : ""}`}
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <IonIcon icon={happyOutline} />
                </button>
              </div>
              <button
                className={`douyin-send-btn ${replyContent.trim() ? "active" : ""}`}
                type="button"
                onClick={handleSubmitReply}
                disabled={!replyContent.trim() || isSubmittingReply || !canReply}
              >
                {isSubmittingReply ? <IonSpinner name="crescent" /> : "发送"}
              </button>
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}

            {/* Mention Picker */}
            {showMentionPicker && (
              <MentionPicker
                replies={replyItems}
                onSelect={handleMentionSelect}
                onClose={() => setShowMentionPicker(false)}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default TopicReplyFooter;
