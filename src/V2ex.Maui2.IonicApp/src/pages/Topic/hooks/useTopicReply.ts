import { useCallback, useEffect, useState } from "react";
import { apiService } from "../../../services/apiService";
import { uploadImageToImgur, toMarkdownImage } from "../../../services/ImgurService";
import { useTopicStore } from "../../../store/topicStore";
import { usePageAnalytics } from "../../../hooks/usePageAnalytics";
import { TopicInfoType } from "../../../schemas/topicSchema";

interface UseTopicReplyProps {
  parsedTopicId: number | null;
  topicInfo: TopicInfoType | null;
  isAuthenticated: boolean;
  showLoginPrompt: () => Promise<void>;
  textareaRef: React.RefObject<HTMLIonTextareaElement | null>;
}

export const useTopicReply = ({
  parsedTopicId,
  topicInfo,
  isAuthenticated,
  showLoginPrompt,
  textareaRef,
}: UseTopicReplyProps) => {
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isReplyExpanded, setIsReplyExpanded] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const logAnalytics = usePageAnalytics();
  const updateTopicInfo = useTopicStore((s) => s.updateTopicInfo);

  // 展开回复框时自动聚焦
  useEffect(() => {
    if (isReplyExpanded) {
      // 延迟确保 DOM 已渲染且动画完成
      const timer = setTimeout(() => {
        textareaRef.current?.setFocus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isReplyExpanded, textareaRef]);

  const handleImageUpload = async () => {
    if (isUploadingImage) return;
    try {
      setIsUploadingImage(true);
      const pickResult = await apiService.pickImage();
      if (pickResult.error) {
        apiService.showToast(`选择图片失败: ${pickResult.error}`);
        return;
      }
      if (pickResult.data?.cancelled) return;
      const base64 = pickResult.data?.base64;
      if (!base64) {
        apiService.showToast("无法读取图片数据");
        return;
      }
      apiService.showToast("正在上传图片...");
      const uploadResult = await uploadImageToImgur(base64);
      if (!uploadResult.success || !uploadResult.url) {
        apiService.showToast(`上传失败: ${uploadResult.error || "未知错误"}`);
        return;
      }
      const markdownImage = toMarkdownImage(uploadResult.url);
      setReplyContent((prev) => (prev ? `${prev}\n${markdownImage}` : markdownImage));
      apiService.showToast("图片上传成功");
    } catch (error) {
      console.error("Image upload error:", error);
      apiService.showToast("图片上传出错");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setReplyContent((prev) => prev + emoji);
  };

  const handleMentionSelect = (username: string, floor: number) => {
    setReplyContent((prev) => {
      const mentionText = ` @${username} #${floor} `;
      return prev + mentionText;
    });
    setShowMentionPicker(false);
    setTimeout(() => {
      textareaRef.current?.setFocus();
    }, 100);
  };

  const handleSubmitReply = async () => {
    if (!isAuthenticated) {
      await showLoginPrompt();
      return;
    }
    if (parsedTopicId == null) {
      apiService.showToast("话题 ID 无效");
      return;
    }
    const trimmedContent = replyContent.trim();
    if (!trimmedContent) {
      apiService.showToast("请输入回复内容");
      return;
    }
    const replyOnce = topicInfo?.once;
    if (!replyOnce) {
      apiService.showToast("无法获取回复权限，请稍后重试");
      return;
    }

    setIsSubmittingReply(true);
    try {
      const res = await apiService.postReply(parsedTopicId, trimmedContent, replyOnce);
      if (res.error !== null) {
        apiService.showToast(`回复失败：${res.error}`);
        void logAnalytics("post_reply", { topic_id: parsedTopicId, success: false, reason: res.error });
      } else {
        apiService.showToast("回复成功！");
        setReplyContent("");
        setIsReplyExpanded(false);
        void logAnalytics("post_reply", { topic_id: parsedTopicId, success: true });
        if (res.data) {
          updateTopicInfo(parsedTopicId, res.data);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "回复失败";
      apiService.showToast(`回复失败：${errorMsg}`);
      void logAnalytics("post_reply", { topic_id: parsedTopicId, success: false, reason: "exception" });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return {
    replyContent,
    setReplyContent,
    isSubmittingReply,
    isReplyExpanded,
    setIsReplyExpanded,
    isUploadingImage,
    showEmojiPicker,
    setShowEmojiPicker,
    showMentionPicker,
    setShowMentionPicker,
    handleImageUpload,
    handleEmojiSelect,
    handleMentionSelect,
    handleSubmitReply,
  };
};
