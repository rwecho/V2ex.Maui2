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

async function callMauiBridge(
  method: string,
  args?: Record<string, unknown>
): Promise<Result<string>> {
  // 提取 args 的 values 并保持顺序（与 C# 方法参数顺序一致）
  const argValues = args ? Object.values(args) : [];

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
  jsonText: string
): Result<T> {
  let data: unknown;
  try {
    data = JSON.parse(jsonText) as unknown;
  } catch (e) {
    return err(`${schemaName} JSON parse error: ${toErrorMessage(e)}`);
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
    return err(`${schemaName} schema error: ${toErrorMessage(e)}`);
  }
}

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
    const res = await callMauiBridge("GetTabTopicsAsync", {
      tab: params.tab,
    });

    if (res.error !== null) return err(res.error);
    return parseJsonOrError("TopicList", TopicListSchema, res.data);
  },

  async getNodeTopics(
    params: GetNodeTopicsParams
  ): Promise<Result<TopicType[]>> {
    const res = await callMauiBridge("GetNodeTopicsAsync", {
      nodeName: params.nodeName,
      page: params.page ?? 1,
    });

    if (res.error !== null) return err(res.error);
    return parseJsonOrError("TopicList", TopicListSchema, res.data);
  },

  async getTopicDetail(
    params: GetTopicParams
  ): Promise<Result<TopicDetailType | null>> {
    const res = await callMauiBridge("GetTopicDetailAsync", {
      topicId: params.topicId,
    });

    if (res.error !== null) return err(res.error);
    let data: unknown;
    try {
      data = JSON.parse(res.data) as unknown;
    } catch (e) {
      return err(`TopicDetail JSON parse error: ${toErrorMessage(e)}`);
    }
    // backend may return null if not found
    if (data === null) return ok(null);
    try {
      return ok(TopicDetailSchema.parse(data));
    } catch (e) {
      return err(`TopicDetail schema error: ${toErrorMessage(e)}`);
    }
  },

  async getUserProfile(
    params: GetUserParams
  ): Promise<Result<MemberType | null>> {
    const res = await callMauiBridge("GetUserProfileAsync", {
      username: params.username,
    });

    if (res.error !== null) return err(res.error);
    let data: unknown;
    try {
      data = JSON.parse(res.data) as unknown;
    } catch (e) {
      return err(`Member JSON parse error: ${toErrorMessage(e)}`);
    }
    if (data === null) return ok(null);
    try {
      return ok(MemberSchema.parse(data) as MemberType);
    } catch (e) {
      return err(`Member schema error: ${toErrorMessage(e)}`);
    }
  },

  async getNodes(): Promise<Result<NodeInfoType[]>> {
    const res = await callMauiBridge("GetNodesAsync");
    if (res.error !== null) return err(res.error);
    return parseJsonOrError("NodeInfoList", NodeInfoListSchema, res.data);
  },

  async getNodeDetail(
    params: GetNodeParams
  ): Promise<Result<NodeInfoType | null>> {
    const res = await callMauiBridge("GetNodeDetailAsync", {
      nodeName: params.nodeName,
    });

    if (res.error !== null) return err(res.error);
    let data: unknown;
    try {
      data = JSON.parse(res.data) as unknown;
    } catch (e) {
      return err(`NodeInfo JSON parse error: ${toErrorMessage(e)}`);
    }
    if (data === null) return ok(null);
    try {
      return ok(NodeInfoSchema.parse(data));
    } catch (e) {
      return err(`NodeInfo schema error: ${toErrorMessage(e)}`);
    }
  },
};
