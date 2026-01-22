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
import {
  TopicListSchema,
  NodeInfoListSchema,
  NodeInfoSchema,
  TopicDetailSchema,
  MemberSchema,
} from "../schemas/topicSchema";
import { err, ok, toErrorMessage, type Result } from "./result";
import { createFirebaseAnalytics, type AnalyticsParams } from "./firebase";

export async function callMauiBridge(
  method: string,
  args?: unknown[] | Record<string, unknown>,
): Promise<Result<string>> {
  // Prefer explicit ordered arrays to match the .NET method signature.
  // We still support object args for convenience, but Object.values() order can be fragile.
  const argValues = Array.isArray(args)
    ? args
    : args
      ? Object.values(args)
      : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hwv = (window as any).HybridWebView;
  if (!hwv || typeof hwv.InvokeDotNet !== "function") {
    return err("HybridWebView bridge is not available");
  }

  try {
    const result = await hwv.InvokeDotNet(method, argValues);
    return ok(typeof result === "string" ? result : JSON.stringify(result));
  } catch (e) {
    return err(toErrorMessage(e, `Bridge call failed: ${method}`));
  }
}

function parseJsonOrError<T>(
  schemaName: string,
  schema: { parse: (data: unknown) => T },
  jsonText: string,
): Result<T> {
  let data: unknown;
  try {
    data = JSON.parse(jsonText) as unknown;
  } catch (e) {
    return err(`返回内容解析失败（${schemaName}）：${toErrorMessage(e)}`);
  }

  // MAUI side may return `{ error: "..." }` on exception
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof (data as any).error === "string"
  ) {
    return err((data as any).error);
  }

  try {
    return ok(schema.parse(data));
  } catch (e) {
    return err(`数据解析失败（${schemaName}）：${toErrorMessage(e)}`);
  }
}

const firebaseAnalytics = createFirebaseAnalytics(async (method, args) => {
  const res = await callMauiBridge(method, args);
  if (res.error !== null) throw new Error(res.error);
  return res.data;
});

export const mauiBridgeApi = {
  async getLatestTopics(): Promise<Result<TopicType[]>> {
    const res = await callMauiBridge("GetLatestTopicsAsync");
    if (res.error !== null) return err(res.error);
    return parseJsonOrError("TopicList", TopicListSchema, res.data);
  },

  async getHotTopics(): Promise<Result<TopicType[]>> {
    const res = await callMauiBridge("GetHotTopicsAsync");
    if (res.error !== null) return err(res.error);
    return parseJsonOrError("TopicList", TopicListSchema, res.data);
  },

  async getTabTopics(params: GetTabTopicsParams): Promise<Result<TopicType[]>> {
    // Pass an ordered parameter list to match: GetTabTopicsAsync(string tab)
    const res = await callMauiBridge("GetTabTopicsAsync", [params.tab]);

    if (res.error !== null) return err(res.error);
    return parseJsonOrError("TopicList", TopicListSchema, res.data);
  },

  async getNodeTopics(
    params: GetNodeTopicsParams,
  ): Promise<Result<TopicType[]>> {
    // Match: GetNodeTopicsAsync(string nodeName, int page = 1)
    const res = await callMauiBridge("GetNodeTopicsAsync", [
      params.nodeName,
      params.page ?? 1,
    ]);

    if (res.error !== null) return err(res.error);
    return parseJsonOrError("TopicList", TopicListSchema, res.data);
  },

  async getTopicDetail(
    params: GetTopicParams,
  ): Promise<Result<TopicDetailType | null>> {
    // Match: GetTopicDetailAsync(int topicId)
    const res = await callMauiBridge("GetTopicDetailAsync", [params.topicId]);

    if (res.error !== null) return err(res.error);
    let data: unknown;
    try {
      data = JSON.parse(res.data) as unknown;
    } catch (e) {
      return err(`返回内容解析失败（TopicDetail）：${toErrorMessage(e)}`);
    }
    // backend may return null if not found
    if (data === null) return ok(null);
    try {
      return ok(TopicDetailSchema.parse(data));
    } catch (e) {
      return err(`数据解析失败（TopicDetail）：${toErrorMessage(e)}`);
    }
  },

  async getUserProfile(
    params: GetUserParams,
  ): Promise<Result<MemberType | null>> {
    // NOTE: .NET signature currently expects a JSON string, but passing a plain string still works
    // (it will return a structured error). If desired, switch to JSON.stringify({ username }).
    const res = await callMauiBridge("GetUserProfileAsync", [params.username]);

    if (res.error !== null) return err(res.error);
    let data: unknown;
    try {
      data = JSON.parse(res.data) as unknown;
    } catch (e) {
      return err(`返回内容解析失败（Member）：${toErrorMessage(e)}`);
    }
    if (data === null) return ok(null);
    try {
      return ok(MemberSchema.parse(data) as MemberType);
    } catch (e) {
      return err(`数据解析失败（Member）：${toErrorMessage(e)}`);
    }
  },

  async getNodes(): Promise<Result<NodeInfoType[]>> {
    const res = await callMauiBridge("GetNodesAsync");
    if (res.error !== null) return err(res.error);
    return parseJsonOrError("NodeInfoList", NodeInfoListSchema, res.data);
  },

  async getNodeDetail(
    params: GetNodeParams,
  ): Promise<Result<NodeInfoType | null>> {
    // NOTE: .NET signature currently expects a JSON string, but passing a plain string still works
    // (it will return a structured error). If desired, switch to JSON.stringify({ nodeName }).
    const res = await callMauiBridge("GetNodeDetailAsync", [params.nodeName]);

    if (res.error !== null) return err(res.error);
    let data: unknown;
    try {
      data = JSON.parse(res.data) as unknown;
    } catch (e) {
      return err(`返回内容解析失败（NodeInfo）：${toErrorMessage(e)}`);
    }
    if (data === null) return ok(null);
    try {
      return ok(NodeInfoSchema.parse(data));
    } catch (e) {
      return err(`数据解析失败（NodeInfo）：${toErrorMessage(e)}`);
    }
  },

  /** 获取原生持久化字符串 */
  async getStringValue(key: string): Promise<Result<string | null>> {
    const res = await callMauiBridge("GetStringValue", [key]);
    if (res.error !== null) return err(res.error);
    return ok(res.data.length ? res.data : null);
  },

  /** 设置原生持久化字符串 */
  async setStringValue(key: string, value: string): Promise<Result<void>> {
    const res = await callMauiBridge("SetStringValue", [key, value]);
    if (res.error !== null) return err(res.error);
    if (res.data && res.data.startsWith("error")) return err(res.data);
    return ok(undefined);
  },

  /** 原生 Snackbar 提示 */
  async showSnackbar(message: string): Promise<Result<void>> {
    const res = await callMauiBridge("ShowSnackbar", [message]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  },

  /** 原生 Toast 提示 */
  async showToast(message: string): Promise<Result<void>> {
    const res = await callMauiBridge("ShowToast", [message]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  },

  /**
   * 通过 MAUI Bridge 上报 Analytics 事件（由原生侧统一提交）
   * 对应 C# 签名: TrackAnalyticsEventAsync(string eventName, Dictionary<string, object?>? parameters = null)
   */
  async trackAnalyticsEvent(
    eventName: string,
    parameters?: AnalyticsParams,
  ): Promise<Result<void>> {
    try {
      await firebaseAnalytics.logEvent(eventName, parameters);
      return ok(undefined);
    } catch (e) {
      return err(toErrorMessage(e, "bridge analytics failed"));
    }
  },
};
