/**
 * V2EX API Service
 *
 * 保持 IonicApp 现有风格：zustand store + zod schema。
 * 此处只提供“获取数据”的能力（HTTP 或 MAUI Bridge），具体状态管理在 store 层完成。
 */

import { z } from "zod";
import {
  MemberSchema,
  NodeInfoListSchema,
  NodeInfoSchema,
  TopicDetailSchema,
  TopicListSchema,
  type GetNodeParams,
  type GetNodeTopicsParams,
  type GetTabTopicsParams,
  type GetTopicParams,
  type GetUserParams,
  type MemberType,
  type NodeInfoType,
  type TopicDetailType,
  type TopicType,
} from "../schemas/topicSchema";
import { mauiBridgeApi } from "./mauiBridgeApi";

export interface IV2exApiService {
  getLatestTopics(): Promise<TopicType[]>;
  getHotTopics(): Promise<TopicType[]>;
  getTabTopics(params: GetTabTopicsParams): Promise<TopicType[]>;
  getNodeTopics(params: GetNodeTopicsParams): Promise<TopicType[]>;
  getTopicDetail(params: GetTopicParams): Promise<TopicDetailType | null>;
  getUserProfile(params: GetUserParams): Promise<MemberType | null>;
  getNodes(): Promise<NodeInfoType[]>;
  getNodeDetail(params: GetNodeParams): Promise<NodeInfoType | null>;
}

class HttpApiService implements IV2exApiService {
  private readonly baseUrl: string;
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor() {
    // 允许通过 Vite env 覆盖，方便本地调试/真机调试
    // 例：VITE_V2EX_API_BASE_URL="http://127.0.0.1:5200/api/v2ex"
    this.baseUrl =
      (import.meta as any).env?.VITE_V2EX_API_BASE_URL ??
      "https://localhost:5199/api/v2ex";
  }

  private async fetchApi<T>(
    endpoint: string,
    queryParams?: Record<string, string | number>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        url.searchParams.set(key, String(value));
      }
    }

    const requestKey = url.toString();

    const existing = this.inFlight.get(requestKey);
    if (existing) {
      return (await existing) as T;
    }

    const p = (async () => {
      const response = await fetch(requestKey, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          throw new Error(
            `HTTP 429 Too Many Requests${
              retryAfter ? ` (Retry-After: ${retryAfter}s)` : ""
            }`
          );
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as unknown;
    })();

    this.inFlight.set(requestKey, p);
    try {
      return (await p) as T;
    } finally {
      this.inFlight.delete(requestKey);
    }
  }

  async getLatestTopics(): Promise<TopicType[]> {
    const data = await this.fetchApi<unknown>("/topics/latest");
    return TopicListSchema.parse(data);
  }

  async getHotTopics(): Promise<TopicType[]> {
    const data = await this.fetchApi<unknown>("/topics/hot");
    return TopicListSchema.parse(data);
  }

  async getTabTopics(params: GetTabTopicsParams): Promise<TopicType[]> {
    const data = await this.fetchApi<unknown>(`/tabs/${params.tab}`);
    return TopicListSchema.parse(data);
  }

  async getNodeTopics(params: GetNodeTopicsParams): Promise<TopicType[]> {
    const data = await this.fetchApi<unknown>(
      `/nodes/${params.nodeName}/topics`,
      {
        page: params.page ?? 1,
      }
    );
    return TopicListSchema.parse(data);
  }

  async getTopicDetail(
    params: GetTopicParams
  ): Promise<TopicDetailType | null> {
    const data = await this.fetchApi<unknown>(`/topics/${params.topicId}`);
    return TopicDetailSchema.parse(data);
  }

  async getUserProfile(params: GetUserParams): Promise<MemberType | null> {
    const data = await this.fetchApi<unknown>(`/members/${params.username}`);
    return MemberSchema.parse(data) as MemberType;
  }

  async getNodes(): Promise<NodeInfoType[]> {
    const data = await this.fetchApi<unknown>("/nodes");
    return NodeInfoListSchema.parse(data);
  }

  async getNodeDetail(params: GetNodeParams): Promise<NodeInfoType | null> {
    const data = await this.fetchApi<unknown>(`/nodes/${params.nodeName}`);
    return NodeInfoSchema.parse(data);
  }
}

const httpApiService = new HttpApiService();

/**
 * 根据运行环境选择 API 实现：
 * - MAUI：Bridge
 * - Web：HTTP
 */
export const apiFactory = async (): Promise<IV2exApiService> => {
  try {
    // 如果能成功调用 GetSystemInfo，说明 bridge 可用
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const systemInfo = await (window as any).HybridWebView.InvokeDotNet(
      "GetSystemInfo",
      []
    );
    console.info("HybridWebView detected, using MAUI Bridge API", systemInfo);
    return mauiBridgeApi as unknown as IV2exApiService;
  } catch (e) {
    console.warn(
      "HybridWebView detected but bridge call failed, fallback to HTTP",
      e
    );
    return httpApiService;
  }
};

// 预留：如需对 schema 错误统一包装
export const isZodError = (err: unknown): err is z.ZodError => {
  return err instanceof z.ZodError;
};
