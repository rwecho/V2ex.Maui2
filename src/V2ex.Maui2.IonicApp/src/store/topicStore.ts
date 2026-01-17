import { create } from "zustand";
import { TopicDetailType, TopicType } from "../schemas/topicSchema";
import { apiFactory } from "../services/apiService";

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

    const res = await (await apiFactory()).getLatestTopics();
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

    const res = await (await apiFactory()).getHotTopics();
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

    const res = await (await apiFactory()).getTabTopics({ tab });
    if (res.error !== null) {
      console.error(`Error fetching topics for tab "${tab}":`, res.error);
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

    const res = await (await apiFactory()).getTopicDetail({ topicId });

    if (res.error !== null) {
      console.error(
        `Error fetching topic detail for ID ${topicId}:`,
        res.error
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

    set({
      topicDetailById: { ...get().topicDetailById, [idKey]: res.data },
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
