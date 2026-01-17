import { create } from "zustand";
import { TopicDetailType, TopicType } from "../schemas/topicSchema";
import { apiFactory, isZodError } from "../services/apiService";

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
    options?: { force?: boolean }
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
    try {
      const topics = await (await apiFactory()).getLatestTopics();
      set({
        topicsByKey: { ...get().topicsByKey, [key]: topics },
        loadingByKey: { ...get().loadingByKey, [key]: false },
      });
    } catch (error) {
      console.error("Error fetching latest topics:", error);
      const message = isZodError(error)
        ? error.message
        : error instanceof Error
        ? error.message
        : "Failed to fetch latest topics";
      set({
        loadingByKey: { ...get().loadingByKey, [key]: false },
        errorByKey: { ...get().errorByKey, [key]: message },
      });
    }
  },

  fetchHotTopics: async (key: string) => {
    if (get().loadingByKey[key]) return;
    set({
      loadingByKey: { ...get().loadingByKey, [key]: true },
      errorByKey: { ...get().errorByKey, [key]: null },
    });
    try {
      const topics = await (await apiFactory()).getHotTopics();
      set({
        topicsByKey: { ...get().topicsByKey, [key]: topics },
        loadingByKey: { ...get().loadingByKey, [key]: false },
      });
    } catch (error) {
      console.error("Error fetching hot topics:", error);
      const message = isZodError(error)
        ? error.message
        : error instanceof Error
        ? error.message
        : "Failed to fetch hot topics";
      set({
        loadingByKey: { ...get().loadingByKey, [key]: false },
        errorByKey: { ...get().errorByKey, [key]: message },
      });
    }
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

    debugger;
    try {
      const topics = await (await apiFactory()).getTabTopics({ tab });
      set({
        topicsByKey: { ...get().topicsByKey, [key]: topics },
        loadingByKey: { ...get().loadingByKey, [key]: false },
      });
    } catch (error) {
      console.error(`Error fetching topics for tab "${tab}":`, error);
      const message = isZodError(error)
        ? error.message
        : error instanceof Error
        ? error.message
        : "Failed to fetch tab topics";
      set({
        loadingByKey: { ...get().loadingByKey, [key]: false },
        errorByKey: { ...get().errorByKey, [key]: message },
      });
    }
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

    try {
      const detail = await (await apiFactory()).getTopicDetail({ topicId });
      set({
        topicDetailById: { ...get().topicDetailById, [idKey]: detail },
        topicDetailLoadingById: {
          ...get().topicDetailLoadingById,
          [idKey]: false,
        },
      });
    } catch (error) {
      console.error(`Error fetching topic detail for ID ${topicId}:`, error);
      const message = isZodError(error)
        ? error.message
        : error instanceof Error
        ? error.message
        : "Failed to fetch topic detail";

      set({
        topicDetailLoadingById: {
          ...get().topicDetailLoadingById,
          [idKey]: false,
        },
        topicDetailErrorById: {
          ...get().topicDetailErrorById,
          [idKey]: message,
        },
      });
    }
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
