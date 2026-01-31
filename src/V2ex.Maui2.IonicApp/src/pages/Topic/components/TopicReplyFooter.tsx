import React, { useRef, useEffect } from "react";
import { IonIcon, IonSpinner, IonTextarea, IonModal, IonContent, IonButton, IonButtons, IonHeader, IonToolbar, IonTitle } from "@ionic/react";
import { imageOutline, atOutline, happyOutline, closeOutline, sendOutline } from "ionicons/icons";
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
      <div className="douyin-reply-footer collapsed">
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
      </div>

      <IonModal
        isOpen={isReplyExpanded}
        onDidDismiss={() => setIsReplyExpanded(false)}
        onDidPresent={() => {
          // Auto-focus textarea when modal opens
          setTimeout(() => {
            textareaRef.current?.setFocus();
          }, 100);
        }}
        initialBreakpoint={0.75}
        breakpoints={[0, 0.5, 0.75, 1]}
        handle={true}
        keyboardClose={false}
      >
        <IonHeader className="ion-no-border">
          <IonToolbar>
            <IonTitle>回复</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setIsReplyExpanded(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="douyin-reply-container">
            <div className="douyin-textarea-wrapper">
              <IonTextarea
                ref={textareaRef}
                className="douyin-textarea"
                placeholder="有什么想法，展开说说"
                value={replyContent}
                onIonInput={(e) => setReplyContent(e.detail.value ?? "")}
                rows={4}
                autoGrow={true}
                disabled={isSubmittingReply || !canReply}
                maxlength={20000}
              />
            </div>
            
            <div className="douyin-bottom-bar" style={{ marginTop: "16px" }}>
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
                    setShowEmojiPicker(false);
                  }}
                >
                  <IonIcon icon={atOutline} />
                </button>
                <button
                  className={`douyin-icon-btn ${showEmojiPicker ? "active" : ""}`}
                  type="button"
                  onClick={() => {
                    setShowEmojiPicker(!showEmojiPicker);
                    setShowMentionPicker(false);
                  }}
                >
                  <IonIcon icon={happyOutline} />
                </button>
              </div>
              <IonButton
                className="douyin-send-btn-ionic"
                onClick={handleSubmitReply}
                disabled={!replyContent.trim() || isSubmittingReply || !canReply}
                shape="round"
                size="small"
              >
                {isSubmittingReply ? <IonSpinner name="crescent" /> : "发送"}
                <IonIcon slot="end" icon={sendOutline} />
              </IonButton>
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="emoji-picker-container">
                <EmojiPicker
                  onSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </div>
            )}

            {/* Mention Picker */}
            {showMentionPicker && (
              <div className="mention-picker-container">
                <MentionPicker
                  replies={replyItems}
                  onSelect={handleMentionSelect}
                  onClose={() => setShowMentionPicker(false)}
                />
              </div>
            )}
            
            {/* 底部留白，防止内容被圆角遮挡 */}
            <div style={{ height: "40px" }}></div>
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};

export default TopicReplyFooter;
