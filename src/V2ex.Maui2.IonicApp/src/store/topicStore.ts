import { create } from "zustand";
import { TopicDetailType, TopicType } from "../schemas/topicSchema";
import { apiService } from "../services/apiService";

interface TopicState {
  topicsByKey: Record<string, TopicType[]>;
  loadingByKey: Record<string, boolean>;
  errorByKey: Record<string, string | null>;

  topicDetailById: Record<string, TopicDetailType | null>;
  topicDetailLoadingById: Record<string, boolean>;
  topicDetailErrorById: Record<string, string | null>;
}

interface TopicActions {
  fetchLatestTopics: (key: string) => Promise<void>;
  fetchHotTopics: (key: string) => Promise<void>;
  fetchTabTopics: (key: string, tab?: string) => Promise<void>;

  fetchTopicDetail: (
    topicId: number,
    options?: { force?: boolean },
  ) => Promise<void>;
  clearTopicDetail: (topicId: number) => void;
}

export const useTopicStore = create<TopicState & TopicActions>((set, get) => ({
  topicsByKey: {},
  loadingByKey: {},
  errorByKey: {},

  topicDetailById: {},
  topicDetailLoadingById: {},
  topicDetailErrorById: {},

  fetchLatestTopics: async (key: string) => {
    if (get().loadingByKey[key]) return;
    set({
      loadingByKey: { ...get().loadingByKey, [key]: true },
      errorByKey: { ...get().errorByKey, [key]: null },
    });

    const res = await apiService.getLatestTopics();
    if (res.error !== null) {
      console.error("Error fetching latest topics:", res.error);
      set({
        loadingByKey: { ...get().loadingByKey, [key]: false },
        errorByKey: { ...get().errorByKey, [key]: res.error },
      });
      return;
    }

    set({
      topicsByKey: { ...get().topicsByKey, [key]: res.data },
      loadingByKey: { ...get().loadingByKey, [key]: false },
    });
  },

  fetchHotTopics: async (key: string) => {
    if (get().loadingByKey[key]) return;
    set({
      loadingByKey: { ...get().loadingByKey, [key]: true },
      errorByKey: { ...get().errorByKey, [key]: null },
    });

    const res = await apiService.getHotTopics();
    if (res.error !== null) {
      console.error("Error fetching hot topics:", res.error);
      set({
        loadingByKey: { ...get().loadingByKey, [key]: false },
        errorByKey: { ...get().errorByKey, [key]: res.error },
      });
      return;
    }

    set({
      topicsByKey: { ...get().topicsByKey, [key]: res.data },
      loadingByKey: { ...get().loadingByKey, [key]: false },
    });
  },

  fetchTabTopics: async (key: string, tab?: string) => {
    if (!tab) {
      set({
        topicsByKey: { ...get().topicsByKey, [key]: [] },
        errorByKey: { ...get().errorByKey, [key]: "Missing tab" },
      });
      return;
    }

    if (get().loadingByKey[key]) return;

    set({
      loadingByKey: { ...get().loadingByKey, [key]: true },
      errorByKey: { ...get().errorByKey, [key]: null },
    });

    const res = await apiService.getTabTopics({ tab });
    if (res.error !== null) {
      console.error(`Error fetching topics for tab "${tab}":`, res.error);
      set({
        loadingByKey: { ...get().loadingByKey, [key]: false },
        errorByKey: { ...get().errorByKey, [key]: res.error },
      });
      return;
    }

    const newsInfo = res.data;
    const topics: TopicType[] = newsInfo.items.map((item) => {
        // Parse ID from link, e.g. /t/123456...
        // Fallback to 0 if parsing fails
        let id = 0;
        if(item.id) {
           const parsed = parseInt(item.id);
           if(!isNaN(parsed)) id = parsed;
        } else if (item.link) {
           const match = item.link.match(/\/t\/(\d+)/);
           if (match) id = parseInt(match[1]);
        }

        return {
            id: id,
            title: item.title,
            content: null,
            contentRendered: null,
            url: item.link || null,
            replies: item.replies,
            created: undefined, // NewsItem doesn't strictly have created timestamp
            lastModified: undefined,
            lastTouched: undefined,
            member: {
                id: 0, // Unknown
                username: item.userName || "Unknown",
                avatarMini: item.avatar,
                avatarLarge: item.avatar, // Use same URL
                tagline: null,
                bio: null,
                website: null,
                github: null,
                status: null,
                created: undefined,
                numTopics: undefined,
                numPosts: undefined,
                followers: undefined
            },
            node: {
                id: 0, // Unknown
                name: item.nodeName,
                title: item.nodeName, // Use name as title fallback
                titleAlternative: null,
                header: null,
                footer: null,
                icon: null,
                parentNodeName: null,
                topics: undefined,
                created: undefined,
                lastModified: undefined
            },
            deleted: false
        };
    });

    set({
      topicsByKey: { ...get().topicsByKey, [key]: topics },
      loadingByKey: { ...get().loadingByKey, [key]: false },
    });
  },

  fetchTopicDetail: async (topicId: number, options?: { force?: boolean }) => {
    const idKey = String(topicId);
    const force = options?.force === true;

    if (get().topicDetailLoadingById[idKey]) return;

    // If we already have data and this isn't an explicit refresh, don't refetch.
    if (!force && get().topicDetailById[idKey]) return;

    set({
      topicDetailLoadingById: {
        ...get().topicDetailLoadingById,
        [idKey]: true,
      },
      topicDetailErrorById: {
        ...get().topicDetailErrorById,
        [idKey]: null,
      },
    });

    const res = await apiService.getTopicDetail({ topicId });

    if (res.error !== null) {
      console.error(
        `Error fetching topic detail for ID ${topicId}:`,
        res.error,
      );
      set({
        topicDetailLoadingById: {
          ...get().topicDetailLoadingById,
          [idKey]: false,
        },
        topicDetailErrorById: {
          ...get().topicDetailErrorById,
          [idKey]: res.error,
        },
      });
      return;
    }

    const topicInfo = res.data;
    if (!topicInfo) {
         set({
            topicDetailLoadingById: { ...get().topicDetailLoadingById, [idKey]: false },
            topicDetailErrorById: { ...get().topicDetailErrorById, [idKey]: "Topic not found" },
         });
         return;
    }

    const topicDetail: TopicDetailType = {
        page: topicInfo.currentPage || 1,
        totalPages: topicInfo.maximumPage || 1,
        topic: {
            id: topicId,
            title: topicInfo.title,
            content: topicInfo.content,
            contentRendered: topicInfo.content,
            url: null,
            replies: topicInfo.replies ? topicInfo.replies.length : 0,
            created: undefined, 
            lastModified: undefined,
            lastTouched: undefined,
            member: {
                id: 0,
                username: topicInfo.userName,
                avatarMini: topicInfo.avatar,
                avatarLarge: topicInfo.avatar,
                tagline: null,
                bio: null,
                website: null,
                github: null,
                status: null,
            },
            node: {
                id: 0,
                name: topicInfo.nodeName,
                title: topicInfo.nodeName,
                titleAlternative: null,
                header: null,
                footer: null,
                icon: null,
                parentNodeName: null,
            },
            deleted: false
        },
        replies: topicInfo.replies ? topicInfo.replies.map(r => ({
            id: parseInt(r.id) || 0,
            content: r.content,
            contentRendered: r.content,
            created: undefined, 
            member: {
                id: 0,
                username: r.userName,
                avatarMini: r.avatar,
                avatarLarge: r.avatar,
                tagline: null,
                bio: null,
                website: null,
                github: null,
                status: null,
            },
            isOp: r.userName === topicInfo.userName,
            mentioned: null,
            floor: r.floor
        })) : []
    };

    set({
      topicDetailById: { ...get().topicDetailById, [idKey]: topicDetail },
      topicDetailLoadingById: {
        ...get().topicDetailLoadingById,
        [idKey]: false,
      },
    });
  },

  clearTopicDetail: (topicId: number) => {
    const idKey = String(topicId);
    const { [idKey]: _, ...restDetail } = get().topicDetailById;
    const { [idKey]: __, ...restLoading } = get().topicDetailLoadingById;
    const { [idKey]: ___, ...restError } = get().topicDetailErrorById;
    set({
      topicDetailById: restDetail,
      topicDetailLoadingById: restLoading,
      topicDetailErrorById: restError,
    });
  },
}));
