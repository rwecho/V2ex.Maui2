/**
 * Topic Store - 管理话题相关状态
 */

import { create } from "zustand";
import type { Topic, TopicDetail } from "../types/v2ex";
import { v2exApi } from "../services/apiService";

interface TopicState {
  topics: Topic[];
  currentTopicDetail: TopicDetail | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchTopics: (page?: number) => Promise<void>;
  fetchHotTopics: () => Promise<void>;
  fetchNodeTopics: (nodeName: string, page?: number) => Promise<void>;
  fetchTopicDetail: (topicId: number) => Promise<void>;
  clearCurrentTopic: () => void;
}

export const useTopicStore = create<TopicState>((set) => ({
  topics: [],
  currentTopicDetail: null,
  loading: false,
  error: null,

  fetchTopics: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const topics = await v2exApi.getTopics({ page });
      set({ topics, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch topics",
        loading: false,
      });
    }
  },

  fetchHotTopics: async () => {
    set({ loading: true, error: null });
    try {
      const topics = await v2exApi.getHotTopics();
      set({ topics, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch hot topics",
        loading: false,
      });
    }
  },

  fetchNodeTopics: async (nodeName: string, page = 1) => {
    set({ loading: true, error: null });
    try {
      const topics = await v2exApi.getNodeTopics({ nodeName, page });
      set({ topics, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch node topics",
        loading: false,
      });
    }
  },

  fetchTopicDetail: async (topicId: number) => {
    set({ loading: true, error: null });
    try {
      const topicDetail = await v2exApi.getTopicDetail({ topicId });
      if (!topicDetail || !topicDetail.topic) {
        set({
          currentTopicDetail: null,
          loading: false,
          error: "Topic not found",
        });
        return;
      }
      set({ currentTopicDetail: topicDetail, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch topic detail",
        loading: false,
      });
    }
  },

  clearCurrentTopic: () => set({ currentTopicDetail: null }),
}));
