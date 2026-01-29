import { z } from "zod";
import {
  DailyInfoSchema,
  MemberSchema,
  NodeInfoListSchema,
  NodeInfoSchema,
  NotificationSchema,
  SearchResultSchema,
  TopicListSchema,
  type DailyInfoType,
  type MemberType,
  type NodeInfoType,
  type NotificationType,
  type SearchResultType,
  type TopicType,
  type CurrentUserType,
  type GetNodeParams,
  type GetNodeTopicsParams,
  type GetTabTopicsParams,
  type GetTopicParams,
  type GetUserParams,
  type NodesNavInfoType,
  type TagInfoType,
  type NewsInfoType,
  NewsInfoSchema,
  TopicInfoSchema,
  TopicInfoType,
} from "../schemas/topicSchema";
import { IV2exApiService } from "./IV2exApiService";
import { err, ok, toErrorMessage, type Result } from "./result";
import { SignInFormInfoType } from "../schemas/accountSchema";

/**
 * Implementation that runs in the Browser (for development/debugging).
 * Uses local proxy or direct API calls.
 */
export class HttpApiService implements IV2exApiService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl =
      (import.meta as any).env?.VITE_V2EX_API_BASE_URL ??
      "https://localhost:5199/api/v2ex";
  }

  private async fetchApi(
    endpoint: string,
    options?: RequestInit,
  ): Promise<Result<unknown>> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return err(
          `HTTP ${response.status}: ${errorText || response.statusText}`,
        );
      }

      const text = await response.text();
      try {
        return ok(JSON.parse(text));
      } catch {
        return ok(text); // Return raw text if not json
      }
    } catch (e) {
      return err(toErrorMessage(e, "Network error"));
    }
  }

  private parseOrError<T>(
    schemaName: string,
    schema: { parse: (data: unknown) => T },
    data: unknown,
  ): Result<T> {
    try {
      return ok(schema.parse(data));
    } catch (e) {
      return err(`[Http] 数据解析失败（${schemaName}）：${toErrorMessage(e)}`);
    }
  }

  // --- Read Methods (Real implementations for Web Dev) ---

  async getLatestTopics(): Promise<Result<TopicType[]>> {
    const res = await this.fetchApi("/topics/recent");
    if (res.error) return err(res.error);
    return this.parseOrError("LatestTopics", TopicListSchema, res.data);
  }

  async getHotTopics(): Promise<Result<TopicType[]>> {
    const res = await this.fetchApi("/topics/hot");
    if (res.error) return err(res.error);
    return this.parseOrError("HotTopics", TopicListSchema, res.data);
  }

  async getTabTopics(
    params: GetTabTopicsParams,
  ): Promise<Result<NewsInfoType>> {
    const res = await this.fetchApi(`/tabs/${params.tab}`);
    if (res.error) return err(res.error);
    return this.parseOrError("TabTopics", NewsInfoSchema, res.data);
  }

  async getNodeTopics(
    params: GetNodeTopicsParams,
  ): Promise<Result<TopicType[]>> {
    const page = params.page || 1;
    const res = await this.fetchApi(
      `/nodes/${params.nodeName}/topics?page=${page}`,
    );
    if (res.error) return err(res.error);
    return this.parseOrError("NodeTopics", TopicListSchema, res.data);
  }

  async getTopicDetail(
    params: GetTopicParams,
  ): Promise<Result<TopicInfoType | null>> {
    const res = await this.fetchApi(
      `/topics/${params.topicId}?page=${params.page || 1}`,
    );
    if (res.error) return err(res.error);
    return this.parseOrError("TopicDetail", TopicInfoSchema, res.data);
  }

  async getUserProfile(
    params: GetUserParams,
  ): Promise<Result<MemberType | null>> {
    const res = await this.fetchApi(`/members/${params.username}`);
    if (res.error) return err(res.error);
    return this.parseOrError("UserProfile", MemberSchema.nullable(), res.data);
  }

  async getNodes(): Promise<Result<NodeInfoType[]>> {
    const res = await this.fetchApi("/nodes");
    if (res.error) return err(res.error);
    return this.parseOrError("AllNodes", NodeInfoListSchema, res.data);
  }

  async getNodesNavInfo(): Promise<Result<NodesNavInfoType>> {
    return err("[Http] getNodesNavInfo not implemented");
  }

  async getTagTopics(tagName: string): Promise<Result<TagInfoType>> {
    return err("[Http] getTagTopics not implemented");
  }

  async getNodeDetail(
    params: GetNodeParams,
  ): Promise<Result<NodeInfoType | null>> {
    const res = await this.fetchApi(`/nodes/${params.nodeName}`);
    if (res.error) return err(res.error);
    return this.parseOrError("NodeDetail", NodeInfoSchema.nullable(), res.data);
  }

  // --- Auth Methods (Real implementations for Web Dev) ---

  async getLoginParameters(): Promise<Result<SignInFormInfoType>> {
    const res = await this.fetchApi("/account/login-parameters");
    if (res.error) return err(res.error);
    const data: any = res.data;
    if (data && data.captchaImage) {
      return ok(data as SignInFormInfoType);
    }
    return err("Get signin info failed");
  }

  async getCaptchaImage(
    once: string,
  ): Promise<Result<{ image: string; mimeType: string }>> {
    // Custom fetch for binary data
    const url = `${this.baseUrl}/account/captcha?once=${encodeURIComponent(once)}`;
    try {
      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) {
        return err(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Remove data:image/...;base64, prefix
          const base64Items = result.split(",");
          resolve(base64Items.length > 1 ? base64Items[1] : result);
        };
        reader.readAsDataURL(blob);
      });

      return ok({ image: base64, mimeType: "image/png" });
    } catch (e) {
      return err(toErrorMessage(e, "Failed to fetch captcha"));
    }
  }

  async signIn(
    username: string,
    password: string,
    formInfo: SignInFormInfoType,
    captchaCode: string,
  ): Promise<Result<{ username: string; currentUser?: CurrentUserType }>> {
    const res = await this.fetchApi("/account/login", {
      method: "POST",
      body: JSON.stringify({
        usernameFieldName: formInfo.usernameFieldName,
        passwordFieldName: formInfo.passwordFieldName,
        captchaFieldName: formInfo.captchaFieldName,
        once: formInfo.once,
        username,
        password,
        captcha: captchaCode,
      }),
    });
    if (res.error) return err(res.error);
    const data: any = res.data;
    if (data?.success) {
      return ok({
        username: data.username || username,
        currentUser: data.currentUser,
      });
    }
    return err(data?.error || "Login failed");
  }

  async signOut(): Promise<Result<void>> {
    await this.fetchApi("/account/logout", { method: "POST" });
    return ok(undefined);
  }

  async isLoggedIn(): Promise<Result<boolean>> {
    const res = await this.fetchApi("/account/logged-in");
    if (res.error) return ok(false);
    return ok((res.data as any)?.isLoggedIn === true);
  }

  async getCurrentUser(): Promise<Result<MemberType>> {
    const res = await this.fetchApi("/account/current-user");
    if (res.error) return err(res.error);
    const data: any = res.data;
    if (data?.success && data.user) {
      return ok({ ...data.user, id: data.user.id || 0 } as MemberType);
    }
    return err("Get current user failed");
  }

  // --- Fallbacks for other interactions ---

  async createTopic(
    title: string,
    content: string,
    nodeId: string,
    once: string,
  ): Promise<Result<{ topicId?: number; url?: string }>> {
    const res = await this.fetchApi("/topics", {
      method: "POST",
      body: JSON.stringify({ title, content, nodeId, once }),
    });
    if (res.error) return err(res.error);
    const data: any = res.data;
    if (data?.success) return ok({ topicId: data.topicId, url: data.url });
    return err(data?.error || "Create topic failed");
  }

  async thankTopic(topicId: number, once: string): Promise<Result<void>> {
    const res = await this.fetchApi(
      `/topics/${topicId}/thank?once=${encodeURIComponent(once)}`,
      { method: "POST" },
    );
    if (res.error) return err(res.error);
    return ok(undefined);
  }

  async ignoreTopic(topicId: number, once: string): Promise<Result<void>> {
    const res = await this.fetchApi(
      `/topics/${topicId}/ignore?once=${encodeURIComponent(once)}`,
      { method: "POST" },
    );
    if (res.error) return err(res.error);
    return ok(undefined);
  }

  async unignoreTopic(topicId: number, once: string): Promise<Result<void>> {
    const res = await this.fetchApi(
      `/topics/${topicId}/unignore?once=${encodeURIComponent(once)}`,
      { method: "POST" },
    );
    if (res.error) return err(res.error);
    return ok(undefined);
  }

  async favoriteTopic(topicId: number, once: string): Promise<Result<void>> {
    const res = await this.fetchApi(
      `/topics/${topicId}/favorite?once=${encodeURIComponent(once)}`,
      { method: "POST" },
    );
    if (res.error) return err(res.error);
    return ok(undefined);
  }

  async unfavoriteTopic(topicId: number, once: string): Promise<Result<void>> {
    const res = await this.fetchApi(
      `/topics/${topicId}/unfavorite?once=${encodeURIComponent(once)}`,
      { method: "POST" },
    );
    if (res.error) return err(res.error);
    return ok(undefined);
  }

  async upTopic(topicId: number, once: string): Promise<Result<void>> {
    const res = await this.fetchApi(
      `/topics/${topicId}/up?once=${encodeURIComponent(once)}`,
      { method: "POST" },
    );
    if (res.error) return err(res.error);
    return ok(undefined);
  }

  async downTopic(topicId: number, once: string): Promise<Result<void>> {
    const res = await this.fetchApi(
      `/topics/${topicId}/down?once=${encodeURIComponent(once)}`,
      { method: "POST" },
    );
    if (res.error) return err(res.error);
    return ok(undefined);
  }

  async appendTopic(
    topicId: number,
    content: string,
    once: string,
  ): Promise<Result<void>> {
    const res = await this.fetchApi(`/topics/${topicId}/append`, {
      method: "POST",
      body: JSON.stringify({ content, once }),
    });
    if (res.error) return err(res.error);
    return ok(undefined);
  }

  async reportTopic(topicId: number, title: string): Promise<Result<void>> {
    const subject = encodeURIComponent(`[Report] Topic #${topicId}: ${title}`);
    const body = encodeURIComponent(
      `I would like to report the following topic due to inappropriate content:\n\nTopic ID: ${topicId}\nTitle: ${title}\n\n(Please describe the issue below)\n`,
    );
    window.open(
      `mailto:report@v2ex.maui?subject=${subject}&body=${body}`,
      "_blank",
    );
    return ok(undefined);
  }

  async ignoreNode(nodeId: string, once: string): Promise<Result<void>> {
    const res = await this.fetchApi(
      `/nodes/${nodeId}/ignore?once=${encodeURIComponent(once)}`,
      { method: "POST" },
    );
    if (res.error) return err(res.error);
    return ok(undefined);
  }

  async unignoreNode(nodeId: string, once: string): Promise<Result<void>> {
    const res = await this.fetchApi(
      `/nodes/${nodeId}/unignore?once=${encodeURIComponent(once)}`,
      { method: "POST" },
    );
    if (res.error) return err(res.error);
    return ok(undefined);
  }

  async getUserPage(username: string): Promise<Result<MemberType>> {
    const res = await this.fetchApi(`/members/${username}/page`);
    if (res.error) return err(res.error);
    return this.parseOrError("Member", MemberSchema, res.data);
  }

  async followUser(url: string): Promise<Result<void>> {
    const res = await this.fetchApi(
      `/members/follow?url=${encodeURIComponent(url)}`,
      { method: "POST" },
    );
    if (res.error) return err(res.error);
    return ok(undefined);
  }

  async blockUser(url: string): Promise<Result<void>> {
    const res = await this.fetchApi(
      `/members/block?url=${encodeURIComponent(url)}`,
      { method: "POST" },
    );
    if (res.error) return err(res.error);
    return ok(undefined);
  }

  async signInTwoStep(code: string, once: string): Promise<Result<void>> {
    const res = await this.fetchApi("/account/2fa", {
      method: "POST",
      body: JSON.stringify({ code, once }),
    });
    if (res.error) return err(res.error);
    return ok(undefined);
  }

  async getDailyInfo(): Promise<Result<DailyInfoType>> {
    const res = await this.fetchApi("/account/daily");
    if (res.error) return err(res.error);
    return this.parseOrError("DailyInfo", DailyInfoSchema, res.data);
  }

  async checkIn(once: string): Promise<Result<void>> {
    const res = await this.fetchApi(
      `/account/daily/checkin?once=${encodeURIComponent(once)}`,
      { method: "POST" },
    );
    if (res.error) return err(res.error);
    return ok(undefined);
  }

  async getNotifications(
    page: number = 1,
  ): Promise<Result<NotificationType[]>> {
    const res = await this.fetchApi(`/account/notifications?page=${page}`);
    if (res.error) return err(res.error);
    return this.parseOrError(
      "NotificationList",
      z.array(NotificationSchema),
      res.data,
    );
  }

  async getFollowing(page: number = 1): Promise<Result<TopicType[]>> {
    const res = await this.fetchApi(`/account/following?page=${page}`);
    if (res.error) return err(res.error);
    return this.parseOrError("TopicList", TopicListSchema, res.data);
  }

  async getFavoriteTopics(page: number = 1): Promise<Result<TopicType[]>> {
    const res = await this.fetchApi(`/account/favorite/topics?page=${page}`);
    if (res.error) return err(res.error);
    return this.parseOrError("TopicList", TopicListSchema, res.data);
  }

  async getFavoriteNodes(): Promise<Result<NodeInfoType[]>> {
    const res = await this.fetchApi("/account/favorite/nodes");
    if (res.error) return err(res.error);
    return this.parseOrError("NodeInfoList", NodeInfoListSchema, res.data);
  }

  async search(
    q: string,
    from: number = 0,
    sort: string = "created",
  ): Promise<Result<SearchResultType[]>> {
    const res = await this.fetchApi(
      `/search?q=${encodeURIComponent(q)}&from=${from}&sort=${sort}`,
    );
    if (res.error) return err(res.error);
    return this.parseOrError(
      "SearchResultList",
      z.array(SearchResultSchema),
      res.data,
    );
  }

  // --- Reply Methods ---
  async getReplyOnceToken(topicId: number): Promise<Result<string>> {
    const res = await this.fetchApi(`/topics/${topicId}/replies/once`);
    if (res.error) return err(res.error);

    throw new Error("Not implemented");
  }

  async postReply(
    topicId: number,
    content: string,
    once: string,
  ): Promise<Result<TopicInfoType | null>> {
    const res = await this.fetchApi(`/topics/${topicId}/replies`, {
      method: "POST",
      body: JSON.stringify({ content, once }),
    });
    if (res.error) return err(res.error);

    return this.parseOrError("TopicDetail", TopicInfoSchema, res.data);
  }

  // --- Native / UI Methods ---
  async getSystemInfo(): Promise<
    Result<{
      platform: string;
      appVersion: string;
      deviceModel: string;
      manufacturer: string;
      deviceName: string;
      operatingSystem: string;
    }>
  > {
    return ok({
      platform: "Web",
      appVersion: "1.0.0",
      deviceModel: navigator.userAgent,
      manufacturer: "Browser",
      deviceName: "Browser",
      operatingSystem: "Web",
    });
  }

  async showToast(message: string): Promise<Result<void>> {
    console.log("[Toast]", message);
    return ok(undefined);
  }

  async showSnackbar(message: string): Promise<Result<void>> {
    console.log("[Snackbar]", message);
    return ok(undefined);
  }

  async getStringValue(key: string): Promise<Result<string | null>> {
    return ok(localStorage.getItem(key));
  }

  async setStringValue(key: string, value: string): Promise<Result<void>> {
    localStorage.setItem(key, value);
    return ok(undefined);
  }

  async trackAnalyticsEvent(
    eventName: string,
    parameters?: Record<string, any>,
  ): Promise<Result<void>> {
    console.log("[Analytics]", eventName, parameters);
    return ok(undefined);
  }

  // --- Logs ---
  async getLogFiles(): Promise<Result<{ files: any[]; error?: string }>> {
    return ok({ files: [] });
  }

  async getLogFileContent(fileName: string): Promise<Result<any | null>> {
    return ok(null);
  }

  async deleteLogFile(fileName: string): Promise<Result<boolean>> {
    return ok(true);
  }

  async clearAllLogs(): Promise<Result<boolean>> {
    return ok(true);
  }

  // --- Image Picker ---
  async pickImage(): Promise<Result<{ cancelled?: boolean }>> {
    return err("[Http] Image picker is only available in the native app");
  }
}
