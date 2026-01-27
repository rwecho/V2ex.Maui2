import { create } from "zustand";
import { TopicType, TopicInfoType } from "../schemas/topicSchema";
import { apiService } from "../services/apiService";

interface TopicState {
  topicsByKey: Record<string, TopicType[]>;
  loadingByKey: Record<string, boolean>;
  errorByKey: Record<string, string | null>;

  topicInfoById: Record<string, TopicInfoType | null>;
  topicInfoLoadingById: Record<string, boolean>;
  topicInfoErrorById: Record<string, string | null>;
}

interface TopicActions {
  fetchLatestTopics: (key: string) => Promise<void>;
  fetchHotTopics: (key: string) => Promise<void>;
  fetchTabTopics: (key: string, tab?: string) => Promise<void>;

  fetchTopicInfo: (
    topicId: number,
    options?: { force?: boolean },
  ) => Promise<void>;
  clearTopicInfo: (topicId: number) => void;
  updateTopicInfo: (topicId: number, topicInfo: TopicInfoType) => void;
}

export const useTopicStore = create<TopicState & TopicActions>((set, get) => ({
  topicsByKey: {},
  loadingByKey: {},
  errorByKey: {},

  topicInfoById: {},
  topicInfoLoadingById: {},
  topicInfoErrorById: {},

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

    // Sync current user info if available
    const { useAuthStore } = await import("./authStore");
    const authIsAuthenticated = useAuthStore.getState().isAuthenticated;

    if (newsInfo.currentUser && newsInfo.currentUser.name) {
      // We assume that if currentUser is returned, we have valid user info.
      useAuthStore.getState().setAuthenticated({
        username: newsInfo.currentUser.name,
        ...newsInfo.currentUser,
      });
    } else if (authIsAuthenticated) {
      // We think we are logged in, but the server returned no user info.
      // This means our session has expired or is invalid.
      console.warn("Session expired or invalid, signing out.");
      useAuthStore.getState().signOut();
    }

    const topics: TopicType[] = newsInfo.items.map((item) => {
      // Parse ID from link, e.g. /t/123456...
      // Fallback to 0 if parsing fails
      let id = 0;
      if (item.id) {
        const parsed = parseInt(item.id);
        if (!isNaN(parsed)) id = parsed;
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
          followers: undefined,
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
          lastModified: undefined,
        },
        deleted: false,
      };
    });

    set({
      topicsByKey: { ...get().topicsByKey, [key]: topics },
      loadingByKey: { ...get().loadingByKey, [key]: false },
    });
  },

  fetchTopicInfo: async (topicId: number, options?: { force?: boolean }) => {
    const idKey = String(topicId);
    const force = options?.force === true;

    if (get().topicInfoLoadingById[idKey]) return;

    // If we already have data and this isn't an explicit refresh, don't refetch.
    if (!force && get().topicInfoById[idKey]) return;

    set({
      topicInfoLoadingById: {
        ...get().topicInfoLoadingById,
        [idKey]: true,
      },
      topicInfoErrorById: {
        ...get().topicInfoErrorById,
        [idKey]: null,
      },
    });

    const res = await apiService.getTopicDetail({ topicId, page: 1 });

    if (res.error !== null) {
      console.error(
        `Error fetching topic detail for ID ${topicId}:`,
        res.error,
      );
      set({
        topicInfoLoadingById: {
          ...get().topicInfoLoadingById,
          [idKey]: false,
        },
        topicInfoErrorById: {
          ...get().topicInfoErrorById,
          [idKey]: res.error,
        },
      });
      return;
    }

    const topicInfo = res.data;
    if (!topicInfo) {
      set({
        topicInfoLoadingById: {
          ...get().topicInfoLoadingById,
          [idKey]: false,
        },
        topicInfoErrorById: {
          ...get().topicInfoErrorById,
          [idKey]: "Topic not found",
        },
      });
      return;
    }

    set({
      topicInfoById: { ...get().topicInfoById, [idKey]: topicInfo },
      topicInfoLoadingById: {
        ...get().topicInfoLoadingById,
        [idKey]: false,
      },
    });
  },

  clearTopicInfo: (topicId: number) => {
    const idKey = String(topicId);
    const { [idKey]: _, ...restDetail } = get().topicInfoById;
    const { [idKey]: __, ...restLoading } = get().topicInfoLoadingById;
    const { [idKey]: ___, ...restError } = get().topicInfoErrorById;
    set({
      topicInfoById: restDetail,
      topicInfoLoadingById: restLoading,
      topicInfoErrorById: restError,
    });
  },

  updateTopicInfo: (topicId: number, topicInfo: TopicInfoType) => {
    const idKey = String(topicId);
    set({
      topicInfoById: {
        ...get().topicInfoById,
        [idKey]: topicInfo,
      },
    });
  },
}));
