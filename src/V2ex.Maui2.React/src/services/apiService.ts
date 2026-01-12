/**
 * V2EX API 服务抽象接口
 * 根据运行环境自动选择使用 Bridge（移动端）或 HTTP（Web端）
 */

import type {
  Topic,
  TopicDetail,
  Member,
  NodeInfo,
  GetNodeTopicsParams,
  GetTopicParams,
  GetUserParams,
  GetNodeParams,
} from "../types/v2ex";
import { getPlatformInfoSync } from "./platform";

/**
 * API 服务接口
 */
interface IV2exApiService {
  getLatestTopics(): Promise<Topic[]>;
  getHotTopics(): Promise<Topic[]>;
  getNodeTopics(params: GetNodeTopicsParams): Promise<Topic[]>;
  getTopicDetail(params: GetTopicParams): Promise<TopicDetail | null>;
  getUserProfile(params: GetUserParams): Promise<Member | null>;
  getNodes(): Promise<NodeInfo[]>;
  getNodeDetail(params: GetNodeParams): Promise<NodeInfo | null>;
}

/**
 * 检测是否在 MAUI 移动端环境
 * 使用 platform.ts 的同步检测方法
 */
function isMauiEnvironment(): boolean {
  return getPlatformInfoSync().isMaui;
}

/**
 * MAUI Bridge API 服务实现（移动端）
 */
import { mauiBridgeApi } from "./mauiBridgeApi";

/**
 * HTTP API 服务实现（Web 端调试）
 */
class HttpApiService implements IV2exApiService {
  private readonly baseUrl = "https://localhost:5199/api/v2ex";

  private async fetchApi<T>(
    endpoint: string,
    queryParams?: Record<string, string | number> | undefined
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  async getLatestTopics(): Promise<Topic[]> {
    return this.fetchApi<Topic[]>("/topics/latest");
  }

  async getHotTopics(): Promise<Topic[]> {
    return this.fetchApi<Topic[]>("/topics/hot");
  }

  async getNodeTopics(params: GetNodeTopicsParams): Promise<Topic[]> {
    return this.fetchApi<Topic[]>(`/nodes/${params.nodeName}/topics`, {
      page: params.page || 1,
    } as Record<string, string | number>);
  }

  async getTopicDetail(params: GetTopicParams): Promise<TopicDetail | null> {
    try {
      return await this.fetchApi<TopicDetail>(`/topics/${params.topicId}`);
    } catch (error) {
      console.error("Failed to fetch topic detail:", error);
      return null;
    }
  }

  async getUserProfile(params: GetUserParams): Promise<Member | null> {
    try {
      return await this.fetchApi<Member>(`/members/${params.username}`);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      return null;
    }
  }

  async getNodes(): Promise<NodeInfo[]> {
    return this.fetchApi<NodeInfo[]>("/nodes");
  }

  async getNodeDetail(params: GetNodeParams): Promise<NodeInfo | null> {
    try {
      return await this.fetchApi<NodeInfo>(`/nodes/${params.nodeName}`);
    } catch (error) {
      console.error("Failed to fetch node detail:", error);
      return null;
    }
  }
}

/**
 * HTTP API 服务实例
 */
const httpApiService = new HttpApiService();

/**
 * V2EX API 服务 - 根据环境自动选择实现
 *
 * - 移动端（MAUI）：使用 Bridge 调用 C# 方法
 * - Web 端（浏览器）：使用 HTTP 请求到 localhost:5199
 */
export const v2exApi: IV2exApiService = isMauiEnvironment()
  ? mauiBridgeApi
  : httpApiService;

// 导出类型供其他模块使用
export type { IV2exApiService };
