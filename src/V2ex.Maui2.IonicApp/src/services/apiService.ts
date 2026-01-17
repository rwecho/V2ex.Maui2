/**
 * V2EX API Service
 *
 * 保持 IonicApp 现有风格：zustand store + zod schema。
 * 此处只提供“获取数据”的能力（HTTP 或 MAUI Bridge），具体状态管理在 store 层完成。
 */

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
import { err, ok, toErrorMessage, type Result } from "./result";

export interface IV2exApiService {
  getLatestTopics(): Promise<Result<TopicType[]>>;
  getHotTopics(): Promise<Result<TopicType[]>>;
  getTabTopics(params: GetTabTopicsParams): Promise<Result<TopicType[]>>;
  getNodeTopics(params: GetNodeTopicsParams): Promise<Result<TopicType[]>>;
  getTopicDetail(
    params: GetTopicParams
  ): Promise<Result<TopicDetailType | null>>;
  getUserProfile(params: GetUserParams): Promise<Result<MemberType | null>>;
  getNodes(): Promise<Result<NodeInfoType[]>>;
  getNodeDetail(params: GetNodeParams): Promise<Result<NodeInfoType | null>>;
}

class HttpApiService implements IV2exApiService {
  private readonly baseUrl: string;
  private readonly inFlight = new Map<string, Promise<Result<unknown>>>();

  constructor() {
    // 允许通过 Vite env 覆盖，方便本地调试/真机调试
    // 例：VITE_V2EX_API_BASE_URL="http://127.0.0.1:5200/api/v2ex"
    this.baseUrl =
      (import.meta as any).env?.VITE_V2EX_API_BASE_URL ??
      "https://localhost:5199/api/v2ex";
  }

  private async fetchApi(
    endpoint: string,
    queryParams?: Record<string, string | number>
  ): Promise<Result<unknown>> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        url.searchParams.set(key, String(value));
      }
    }

    const requestKey = url.toString();

    const existing = this.inFlight.get(requestKey);
    if (existing) {
      return await existing;
    }

    const p = (async () => {
      try {
        const response = await fetch(requestKey, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        const tryParseProblemDetails = (payload: unknown): string | null => {
          if (!payload || typeof payload !== "object") return null;
          const obj = payload as Record<string, unknown>;

          // ASP.NET Core ProblemDetails: { type, title, status, detail, instance, traceId }
          const title = typeof obj.title === "string" ? obj.title : null;
          const detail = typeof obj.detail === "string" ? obj.detail : null;
          const status =
            typeof obj.status === "number" ? String(obj.status) : null;
          const traceId = typeof obj.traceId === "string" ? obj.traceId : null;

          // ValidationProblemDetails has `errors: Record<string, string[]>`
          const errors = obj.errors;
          if (errors && typeof errors === "object") {
            try {
              const pairs = Object.entries(errors as Record<string, unknown>)
                .map(([k, v]) => {
                  if (Array.isArray(v)) return `${k}: ${v.join(", ")}`;
                  if (typeof v === "string") return `${k}: ${v}`;
                  return null;
                })
                .filter(Boolean) as string[];
              if (pairs.length > 0) {
                return `${title ?? "Validation error"}: ${pairs.join("; ")}`;
              }
            } catch {
              // ignore
            }
          }

          if (title || detail) {
            const base = [title, detail].filter(Boolean).join(" - ");
            const extra = [
              status ? `status=${status}` : null,
              traceId ? `traceId=${traceId}` : null,
            ]
              .filter(Boolean)
              .join(", ");
            return extra ? `${base} (${extra})` : base;
          }

          return null;
        };

        if (!response.ok) {
          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            return err(
              `HTTP 429 Too Many Requests${
                retryAfter ? ` (Retry-After: ${retryAfter}s)` : ""
              }`
            );
          }

          // Try to surface ProblemDetails message from body (if any)
          try {
            const contentType = response.headers.get("Content-Type") ?? "";
            if (contentType.includes("application/json")) {
              const body = (await response.json()) as unknown;
              const msg = tryParseProblemDetails(body);
              if (msg) return err(msg);
            } else {
              const text = await response.text();
              if (text) return err(text);
            }
          } catch {
            // ignore parsing errors
          }

          return err(`HTTP error! status: ${response.status}`);
        }

        // 204 or empty body
        if (response.status === 204) return ok(null);

        const json = (await response.json()) as unknown;
        const problemMsg = tryParseProblemDetails(json);
        if (problemMsg) return err(problemMsg);
        return ok(json);
      } catch (e) {
        return err(toErrorMessage(e, "Network error"));
      }
    })();

    this.inFlight.set(requestKey, p);
    try {
      return await p;
    } finally {
      this.inFlight.delete(requestKey);
    }
  }

  private parseOrError<T>(
    schemaName: string,
    schema: { parse: (data: unknown) => T },
    input: unknown
  ): Result<T> {
    try {
      return ok(schema.parse(input));
    } catch (e) {
      return err(`数据解析失败（${schemaName}）：${toErrorMessage(e)}`);
    }
  }

  async getLatestTopics(): Promise<Result<TopicType[]>> {
    const res = await this.fetchApi("/topics/latest");
    if (res.error !== null) return err(res.error);
    return this.parseOrError("TopicList", TopicListSchema, res.data);
  }

  async getHotTopics(): Promise<Result<TopicType[]>> {
    const res = await this.fetchApi("/topics/hot");
    if (res.error !== null) return err(res.error);
    return this.parseOrError("TopicList", TopicListSchema, res.data);
  }

  async getTabTopics(params: GetTabTopicsParams): Promise<Result<TopicType[]>> {
    const res = await this.fetchApi(`/tabs/${params.tab}`);
    if (res.error !== null) return err(res.error);
    return this.parseOrError("TopicList", TopicListSchema, res.data);
  }

  async getNodeTopics(
    params: GetNodeTopicsParams
  ): Promise<Result<TopicType[]>> {
    const res = await this.fetchApi(`/nodes/${params.nodeName}/topics`, {
      page: params.page ?? 1,
    });
    if (res.error !== null) return err(res.error);
    return this.parseOrError("TopicList", TopicListSchema, res.data);
  }

  async getTopicDetail(
    params: GetTopicParams
  ): Promise<Result<TopicDetailType | null>> {
    const res = await this.fetchApi(`/topics/${params.topicId}`);
    if (res.error !== null) return err(res.error);
    return this.parseOrError("TopicDetail", TopicDetailSchema, res.data);
  }

  async getUserProfile(
    params: GetUserParams
  ): Promise<Result<MemberType | null>> {
    const res = await this.fetchApi(`/members/${params.username}`);
    if (res.error !== null) return err(res.error);
    return this.parseOrError("Member", MemberSchema, res.data);
  }

  async getNodes(): Promise<Result<NodeInfoType[]>> {
    const res = await this.fetchApi("/nodes");
    if (res.error !== null) return err(res.error);
    return this.parseOrError("NodeInfoList", NodeInfoListSchema, res.data);
  }

  async getNodeDetail(
    params: GetNodeParams
  ): Promise<Result<NodeInfoType | null>> {
    const res = await this.fetchApi(`/nodes/${params.nodeName}`);
    if (res.error !== null) return err(res.error);
    return this.parseOrError("NodeInfo", NodeInfoSchema, res.data);
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
