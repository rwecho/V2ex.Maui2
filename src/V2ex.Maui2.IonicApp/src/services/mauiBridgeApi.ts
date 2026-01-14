/**
 * MAUI Bridge API
 *
 * 在 MAUI HybridWebView 环境下，通过 window.HybridWebView.InvokeDotNet 调用 C# Bridge 方法。
 */

import type {
  GetNodeParams,
  GetNodeTopicsParams,
  GetTabTopicsParams,
  GetTopicParams,
  GetUserParams,
  MemberType,
  NodeInfoType,
  TopicDetailType,
  TopicType,
} from "../schemas/topicSchema";

async function callMauiBridge(
  method: string,
  args?: Record<string, unknown>
): Promise<string> {
  // 提取 args 的 values 并保持顺序（与 C# 方法参数顺序一致）
  const argValues = args ? Object.values(args) : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hwv = (window as any).HybridWebView;
  if (!hwv || typeof hwv.InvokeDotNet !== "function") {
    throw new Error("HybridWebView bridge is not available");
  }

  const result = await hwv.InvokeDotNet(method, argValues);
  return typeof result === "string" ? result : JSON.stringify(result);
}

export const mauiBridgeApi = {
  async getLatestTopics(): Promise<TopicType[]> {
    const result = await callMauiBridge("GetLatestTopicsAsync");
    return JSON.parse(result) as TopicType[];
  },

  async getHotTopics(): Promise<TopicType[]> {
    const result = await callMauiBridge("GetHotTopicsAsync");
    return JSON.parse(result) as TopicType[];
  },

  async getTabTopics(params: GetTabTopicsParams): Promise<TopicType[]> {
    const result = await callMauiBridge("GetTabTopicsAsync", {
      tab: params.tab,
    });
    return JSON.parse(result) as TopicType[];
  },

  async getNodeTopics(params: GetNodeTopicsParams): Promise<TopicType[]> {
    const result = await callMauiBridge("GetNodeTopicsAsync", {
      nodeName: params.nodeName,
      page: params.page ?? 1,
    });
    return JSON.parse(result) as TopicType[];
  },

  async getTopicDetail(
    params: GetTopicParams
  ): Promise<TopicDetailType | null> {
    const result = await callMauiBridge("GetTopicDetailAsync", {
      topicId: params.topicId,
    });
    return JSON.parse(result) as TopicDetailType;
  },

  async getUserProfile(params: GetUserParams): Promise<MemberType | null> {
    const result = await callMauiBridge("GetUserProfileAsync", {
      username: params.username,
    });
    return JSON.parse(result) as MemberType;
  },

  async getNodes(): Promise<NodeInfoType[]> {
    const result = await callMauiBridge("GetNodesAsync");
    return JSON.parse(result) as NodeInfoType[];
  },

  async getNodeDetail(params: GetNodeParams): Promise<NodeInfoType | null> {
    const result = await callMauiBridge("GetNodeDetailAsync", {
      nodeName: params.nodeName,
    });
    return JSON.parse(result) as NodeInfoType;
  },
};
