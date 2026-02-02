import { create } from "zustand";
import { TopicType } from "../schemas/topicSchema";
import { apiService } from "../services/apiService";

interface ReadLaterState {
  topics: TopicType[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (topic: TopicType) => Promise<void>;
  remove: (id: number) => Promise<void>;
  has: (id: number) => boolean;
}

export const useReadLaterStore = create<ReadLaterState>((set, get) => ({
  topics: [],
  loaded: false,
  load: async () => {
    // Only load if not already loaded? Or always refresh?
    // Always refresh for now to ensure sync.
    const res = await apiService.getReadLaterTopics();
    if (!res.error && Array.isArray(res.data)) {
      set({ topics: res.data, loaded: true });
    }
  },
  add: async (topic) => {
    // Optimistic update
    const alreadyExists = get().topics.some((t) => t.id === topic.id);
    if (!alreadyExists) {
      set((state) => ({ topics: [topic, ...state.topics] }));
    }
    
    // Call Native
    await apiService.saveReadLaterTopic(Number(topic.id));
  },
  remove: async (id) => {
    // Optimistic update
    set((state) => ({
      topics: state.topics.filter((t) => t.id !== id),
    }));
    
    // Call Native
    await apiService.removeReadLaterTopic(id);
  },
  has: (id) => {
    return get().topics.some((t) => t.id === id);
  },
}));
