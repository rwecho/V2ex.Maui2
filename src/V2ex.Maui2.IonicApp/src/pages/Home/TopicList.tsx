import { useState, useCallback } from "react";
import {
  IonButton,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonText,
  IonActionSheet,
} from "@ionic/react";
import {
  bookmarkOutline,
  bookmark,
  documentTextOutline,
  closeOutline,
  banOutline,
} from "ionicons/icons";
import { useHistory } from "react-router";
import type { TopicType } from "../../schemas/topicSchema";
import "./TopicList.css";
import { Haptics } from "../../utils/haptics";
import { useReadLaterStore } from "../../store/readLaterStore";
import { useUserBlockStore } from "../../store/userBlockStore";
import { TopicPreviewModal } from "../../components/TopicPreviewModal";
import TopicListItem from "./TopicListItem";
import TopicListSkeleton from "./TopicListSkeleton";
import { apiService } from "../../services/apiService";

type TopicListProps = {
  topics: TopicType[];
  loading: boolean;
  error: string | null;
  isActive: boolean;
  onRetry?: () => void | Promise<void>;
  emptyText?: string;
};

const TopicList = (props: TopicListProps) => {
  const { topics, loading, error, isActive, onRetry, emptyText } = props;
  const { add, remove, has } = useReadLaterStore();
  const { blockUser } = useUserBlockStore();
  const blockedUsers = useUserBlockStore((state) => state.blockedUsers);
  const [previewTopic, setPreviewTopic] = useState<TopicType | null>(null);
  const [actionSheetTopic, setActionSheetTopic] = useState<TopicType | null>(
    null,
  );

  const history = useHistory();

  const handleRetry = useCallback(() => {
    if (!isActive || !onRetry) return;
    void onRetry();
  }, [isActive, onRetry]);

  const handleItemClick = useCallback(
    (t: TopicType) => {
      Haptics.click();
      const search = t.title
        ? `?title=${encodeURIComponent(t.title)}`
        : undefined;
      history.push({
        pathname: `/topic/${t.id}`,
        search,
        state: { title: t.title },
      });
    },
    [history],
  );

  const handlePress = useCallback((topic: TopicType) => {
    setActionSheetTopic(topic);
  }, []);

  const handleBlockUser = (username: string) => {
     blockUser(username);
     Haptics.success();
     apiService.showToast(`已屏蔽用户 @${username}，其内容将不再显示`);
     setActionSheetTopic(null);
  };

  const filteredTopics = topics.filter(t => !blockedUsers.includes(t.member?.username ?? ""));

  if (loading && filteredTopics.length === 0) {
    return <TopicListSkeleton />;
  }

  if (error && filteredTopics.length === 0) {
    return (
      <div className="topicListSection">
        <IonText color="danger">
          <p className="topicListErrorText">加载失败：{error}</p>
        </IonText>
        <div className="topicListErrorActions">
          <IonButton
            expand="block"
            onClick={handleRetry}
            disabled={!isActive || !onRetry}
          >
            重试
          </IonButton>
        </div>
      </div>
    );
  }

  if (!loading && filteredTopics.length === 0) {
    return (
      <div className="topicListSection">
        <IonText>{emptyText ?? "暂无话题"}</IonText>
      </div>
    );
  }

  return (
    <>
      <IonList inset={false} lines="full">
        {error && (
          <IonItem lines="none" color="warning">
            <IonLabel className="ion-text-wrap">
              <IonText color="dark">加载失败：{error}</IonText>
              <div className="topicListErrorBannerActions">
                <IonButton
                  size="small"
                  onClick={handleRetry}
                  disabled={!isActive || !onRetry}
                >
                  重试
                </IonButton>
              </div>
            </IonLabel>
          </IonItem>
        )}
        {filteredTopics.map((t) => (
          <TopicListItem
            key={t.id}
            topic={t}
            isReadLater={has(t.id)}
            onPress={handlePress}
            onClick={handleItemClick}
          />
        ))}
        {loading && (
          <div className="topicListBottomLoading">
            <IonSpinner name="crescent" />
          </div>
        )}
      </IonList>
      <div className="topicListBottomSpacer" aria-hidden="true" />

      <TopicPreviewModal
        isOpen={!!previewTopic}
        onClose={() => setPreviewTopic(null)}
        topic={previewTopic}
      />

      {actionSheetTopic && (
        <IonActionSheet
          isOpen={!!actionSheetTopic}
          onDidDismiss={() => setActionSheetTopic(null)}
          header={`${actionSheetTopic.title} (@${actionSheetTopic.member?.username})`}
          buttons={[
            {
              text: has(actionSheetTopic.id) ? "移除稍后阅读" : "稍后阅读",
              icon: has(actionSheetTopic.id) ? bookmarkOutline : bookmark,
              handler: () => {
                if (has(actionSheetTopic.id)) {
                  remove(actionSheetTopic.id);
                } else {
                  add(actionSheetTopic);
                }
              },
            },
            {
              text: "预览帖子",
              icon: documentTextOutline,
              handler: () => {
                setPreviewTopic(actionSheetTopic);
              },
            },
            {
              text: "屏蔽用户 (Block User)",
              icon: banOutline,
              role: "destructive",
              handler: () => {
                if (actionSheetTopic.member?.username) {
                  handleBlockUser(actionSheetTopic.member.username);
                }
              }
            },
            {
              text: "取消",
              icon: closeOutline,
              role: "cancel",
            },
          ]}
        />
      )}
    </>
  );
};

export default TopicList;
