/**
 * MAUI Bridge 服务
 * 用于与 C# 层通信
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

/**
 * 调用 MAUI Bridge 方法
 */
async function callMauiBridge(
  method: string,
  args?: Record<string, unknown>
): Promise<string> {
  try {
    // 提取args的values并转换数组
    const argsValues = args ? Object.values(args) : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (window as any).HybridWebView.InvokeDotNet(
      method,
      argsValues
    );
    return typeof result === "string" ? result : JSON.stringify(result);
  } catch (error) {
    console.error(`Error calling MAUI Bridge method ${method}:`, error);
    throw error;
  }
}

/**
 * MAUI Bridge API 服务实现（移动端）
 */
export const mauiBridgeApi = {
  /**
   * 获取最新话题列表
   */
  async getLatestTopics(): Promise<Topic[]> {
    const result = await callMauiBridge("GetLatestTopicsAsync");
    const data = JSON.parse(result);
    return data.error ? [] : data;
  },

  /**
   * 获取热门话题列表
   */
  async getHotTopics(): Promise<Topic[]> {
    const result = await callMauiBridge("GetHotTopicsAsync");
    const data = JSON.parse(result);
    return data.error ? [] : data;
  },

  /**
   * 获取节点话题列表
   */
  async getNodeTopics(params: GetNodeTopicsParams): Promise<Topic[]> {
    const result = await callMauiBridge(
      "GetNodeTopicsAsync",
      params as unknown as Record<string, unknown>
    );
    const data = JSON.parse(result);
    return data.error ? [] : data;
  },

  /**
   * 获取话题详情（包含回复）
   */
  async getTopicDetail(params: GetTopicParams): Promise<TopicDetail | null> {
    const result = await callMauiBridge(
      "GetTopicDetailAsync",
      params as unknown as Record<string, unknown>
    );
    const data = JSON.parse(result);
    return data.error ? null : data;
  },

  /**
   * 获取用户信息
   */
  async getUserProfile(params: GetUserParams): Promise<Member | null> {
    const result = await callMauiBridge(
      "GetUserProfileAsync",
      params as unknown as Record<string, unknown>
    );
    const data = JSON.parse(result);
    return data.error ? null : data;
  },

  /**
   * 获取节点列表
   */
  async getNodes(): Promise<NodeInfo[]> {
    const result = await callMauiBridge("GetNodesAsync");
    const data = JSON.parse(result);
    return data.error ? [] : data;
  },

  /**
   * 获取节点详情
   */
  async getNodeDetail(params: GetNodeParams): Promise<NodeInfo | null> {
    const result = await callMauiBridge(
      "GetNodeDetailAsync",
      params as unknown as Record<string, unknown>
    );
    const data = JSON.parse(result);
    return data.error ? null : data;
  },
};
