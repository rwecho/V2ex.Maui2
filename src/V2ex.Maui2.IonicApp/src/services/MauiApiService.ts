import type {
  GetNodeParams,
  GetNodeTopicsParams,
  GetTabTopicsParams,
  GetTopicParams,
  GetUserParams,
  MemberType,
  NodeInfoType,
  TopicType,
  NotificationType,
  DailyInfoType,
  SearchResultType,
  NodesNavInfoType,
  TagInfoType,
  CurrentUserType,
} from "../schemas/topicSchema";
import {
  TopicListSchema,
  NodeInfoListSchema,
  NodeInfoSchema,
  MemberSchema,
  NotificationSchema,
  DailyInfoSchema,
  SearchResultSchema,
  NodesNavInfoSchema,
  TagInfoSchema,
  NewsInfoSchema,
  NewsInfoType,
  TopicInfoSchema,
  TopicInfoType,
} from "../schemas/topicSchema";
import { z } from "zod";
import { err, ok, toErrorMessage, type Result } from "./result";
import { createFirebaseAnalytics, type AnalyticsParams } from "./firebase";
import { IV2exApiService, SystemInfo, HistoryItem } from "./IV2exApiService";
import {
  SignInFormInfoSchema,
  SignInFormInfoType,
} from "../schemas/accountSchema";

export class MauiApiService implements IV2exApiService {
  private async callMauiBridge(
    method: string,
    args?: unknown[] | Record<string, unknown>,
  ): Promise<Result<string>> {
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

  /**
   * Correctly types the bridge call and handles parsing + error checking
   */
  private async invoke<T>(
    methodName: string,
    args: unknown[] = [],
    schema: z.ZodType<T>,
  ): Promise<Result<T>> {
    const res = await this.callMauiBridge(methodName, args);
    if (res.error !== null) return err(res.error);

    let data: unknown;
    try {
      data = JSON.parse(res.data);
    } catch (e) {
      return err(`Bridge returned invalid JSON: ${toErrorMessage(e)}`);
    }

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
      return err(`Data parsing failed (${methodName}): ${toErrorMessage(e)}`);
    }
  }

  /**
   * For methods that just return success (or error)
   */
  private async invokeVoid(
    methodName: string,
    args: unknown[] = [],
  ): Promise<Result<void>> {
    const res = await this.callMauiBridge(methodName, args);
    if (res.error !== null) return err(res.error);

    let data: unknown;
    try {
      data = JSON.parse(res.data);
    } catch (e) {
      return err(`Bridge returned invalid JSON: ${toErrorMessage(e)}`);
    }

    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as any).error === "string"
    ) {
      return err((data as any).error);
    }

    return ok(undefined);
  }

  private firebaseAnalytics = createFirebaseAnalytics(async (method, args) => {
    const res = await this.callMauiBridge(method, args);
    if (res.error !== null) throw new Error(res.error);
    return res.data;
  });

  // --- Read Methods ---

  async getLatestTopics(): Promise<Result<TopicType[]>> {
    return this.invoke("GetLatestTopicsAsync", [], TopicListSchema);
  }

  async getHotTopics(): Promise<Result<TopicType[]>> {
    return this.invoke("GetHotTopicsAsync", [], TopicListSchema);
  }

  async getTabTopics(
    params: GetTabTopicsParams,
  ): Promise<Result<NewsInfoType>> {
    return this.invoke("GetTabTopicsAsync", [params.tab], NewsInfoSchema);
  }

  async getNodeTopics(
    params: GetNodeTopicsParams,
  ): Promise<Result<TopicType[]>> {
    return this.invoke(
      "GetNodeTopicsAsync",
      [params.nodeName, params.page ?? 1],
      TopicListSchema,
    );
  }

  async getTopicDetail(
    params: GetTopicParams,
  ): Promise<Result<TopicInfoType | null>> {
    const res = await this.invoke(
      "GetTopicDetailAsync",
      [params.topicId, params.page ?? 1],
      TopicInfoSchema.nullable(),
    );
    if (res.error === null && res.data && (!params.page || params.page === 1)) {
      this.recordHistory({
        id: params.topicId,
        title: res.data.title,
        userName: res.data.userName,
        userAvatar: res.data.avatar,
        viewedAt: new Date().toISOString(),
      });
    }
    return res;
  }

  async getUserProfile(
    params: GetUserParams,
  ): Promise<Result<MemberType | null>> {
    return this.invoke(
      "GetUserProfileAsync",
      [params.username],
      MemberSchema.nullable(),
    );
  }

  async getNodes(): Promise<Result<NodeInfoType[]>> {
    return this.invoke("GetNodesAsync", [], NodeInfoListSchema);
  }

  async getNodesNavInfo(): Promise<Result<NodesNavInfoType>> {
    return this.invoke("GetNodesNavInfoAsync", [], NodesNavInfoSchema);
  }

  async getTagTopics(tagName: string): Promise<Result<TagInfoType>> {
    return this.invoke("GetTagInfoAsync", [tagName], TagInfoSchema);
  }

  async getNodeDetail(
    params: GetNodeParams,
  ): Promise<Result<NodeInfoType | null>> {
    return this.invoke(
      "GetNodeDetailAsync",
      [params.nodeName],
      NodeInfoSchema.nullable(),
    );
  }

  // --- Auth Methods ---

  async getLoginParameters(): Promise<Result<SignInFormInfoType>> {
    return this.invoke("GetLoginParametersAsync", [], SignInFormInfoSchema);
  }

  async getCaptchaImage(
    once: string,
  ): Promise<Result<{ image: string; mimeType: string }>> {
    // Custom parsing logic kept or refactor? The generic invoke might be strict about checks.
    // The C# side returns { success: true, image: ..., mimeType: ... } or { error: ... }
    // Let's use a specific schema for this.
    const CaptchaSchema = z.object({
      image: z.string(),
      mimeType: z.string().optional().default("image/gif"),
      success: z.boolean().optional(),
    });

    const res = await this.invoke(
      "GetCaptchaImageAsync",
      [once],
      CaptchaSchema,
    );
    if (res.error !== null) return err(res.error);
    return ok({
      image: res.data.image,
      mimeType: res.data.mimeType,
    });
  }

  async signIn(
    username: string,
    password: string,
    formInfo: SignInFormInfoType,
    captchaCode: string,
  ): Promise<Result<{ username: string }>> {
    return this.invoke(
      "SignInAsync",
      [
        username,
        password,
        formInfo.usernameFieldName,
        formInfo.passwordFieldName,
        formInfo.captchaFieldName,
        formInfo.once,
        captchaCode,
      ],
      z.object({ username: z.string() }),
    );
  }

  async signOut(): Promise<Result<void>> {
    return this.invokeVoid("SignOutAsync");
  }

  async isLoggedIn(): Promise<Result<boolean>> {
    // IsLoggedInAsync returns { isLoggedIn: true } or just false on parsing failure in old code
    // Let's assume standard format now via ExecuteSafeAsync (if refactored)
    // Actually IsLoggedInAsync in MauiBridge.Account.cs might not be refactored yet?
    // We only refactored Topics, we should be careful.
    // The helper "ExecuteSafeAsync" was added to MauiBridge.cs (partial).
    // We should assume other parts might use it or not.
    // Safe to use invoke if the return structure is compatible.
    // Legacy bridge methods often return raw JSON.
    // Let's stick safe for now, manual implementation for specific ones if unsure.
    const res = await this.callMauiBridge("IsLoggedInAsync");
    if (res.error !== null) return err(res.error);
    try {
      const data = JSON.parse(res.data);
      return ok(data?.isLoggedIn === true);
    } catch {
      return ok(false);
    }
  }

  async getCurrentUser(): Promise<Result<MemberType>> {
    return this.invoke("GetCurrentUserAsync", [], MemberSchema);
  }

  async signInTwoStep(code: string, once: string): Promise<Result<void>> {
    return this.invokeVoid("SignInTwoStepAsync", [code, once]);
  }

  async getDailyInfo(): Promise<Result<DailyInfoType>> {
    return this.invoke("GetDailyInfoAsync", [], DailyInfoSchema);
  }

  async checkIn(once: string): Promise<Result<void>> {
    return this.invokeVoid("CheckInAsync", [once]);
  }

  async getNotifications(
    page: number = 1,
  ): Promise<Result<NotificationType[]>> {
    return this.invoke(
      "GetNotificationsAsync",
      [page],
      z.array(NotificationSchema),
    );
  }

  async getFollowing(page: number = 1): Promise<Result<TopicType[]>> {
    return this.invoke("GetFollowingAsync", [page], TopicListSchema);
  }

  async getFavoriteTopics(page: number = 1): Promise<Result<TopicType[]>> {
    return this.invoke("GetFavoriteTopicsAsync", [page], TopicListSchema);
  }

  async getFavoriteNodes(): Promise<Result<NodeInfoType[]>> {
    return this.invoke("GetFavoriteNodesAsync", [], NodeInfoListSchema);
  }

  async search(
    q: string,
    from: number = 0,
    sort: string = "created",
  ): Promise<Result<SearchResultType[]>> {
    return this.invoke(
      "SearchAsync",
      [q, from, sort],
      z.array(SearchResultSchema),
    );
  }

  // --- Topic Interactions ---

  async createTopic(
    title: string,
    content: string,
    nodeId: string,
    once: string,
  ): Promise<Result<{ topicId?: number; url?: string }>> {
    return this.invoke(
      "CreateTopicAsync",
      [title, content, nodeId, once],
      z
        .object({ topicId: z.number().optional(), url: z.string().optional() })
        .passthrough(),
    );
  }

  async thankTopic(topicId: number, once: string): Promise<Result<void>> {
    return this.invokeVoid("ThankTopicAsync", [topicId, once]);
  }

  async ignoreTopic(topicId: number, once: string): Promise<Result<void>> {
    return this.invokeVoid("IgnoreTopicAsync", [topicId, once]);
  }

  async unignoreTopic(topicId: number, once: string): Promise<Result<void>> {
    return this.invokeVoid("UnignoreTopicAsync", [topicId, once]);
  }

  async favoriteTopic(topicId: number, once: string): Promise<Result<void>> {
    return this.invokeVoid("FavoriteTopicAsync", [topicId, once]);
  }

  async unfavoriteTopic(topicId: number, once: string): Promise<Result<void>> {
    return this.invokeVoid("UnfavoriteTopicAsync", [topicId, once]);
  }

  async upTopic(topicId: number, once: string): Promise<Result<void>> {
    return this.invokeVoid("UpTopicAsync", [topicId, once]);
  }

  async downTopic(topicId: number, once: string): Promise<Result<void>> {
    return this.invokeVoid("DownTopicAsync", [topicId, once]);
  }

  async appendTopic(
    topicId: number,
    content: string,
    once: string,
  ): Promise<Result<void>> {
    return this.invokeVoid("AppendTopicAsync", [topicId, once, content]);
  }

  async reportTopic(topicId: number, title: string): Promise<Result<void>> {
    return this.invokeVoid("ReportTopicAsync", [topicId, title]);
  }

  // --- Node Interactions ---

  async ignoreNode(nodeId: string, once: string): Promise<Result<void>> {
    return this.invokeVoid("IgnoreNodeAsync", [nodeId, once]);
  }

  async unignoreNode(nodeId: string, once: string): Promise<Result<void>> {
    return this.invokeVoid("UnignoreNodeAsync", [nodeId, once]);
  }

  // --- User Interactions ---
  async followUser(url: string): Promise<Result<void>> {
    return this.invokeVoid("FollowUserAsync", [url]);
  }

  async blockUser(url: string): Promise<Result<void>> {
    return this.invokeVoid("BlockUserAsync", [url]);
  }

  // --- Reply Methods ---

  async getReplyOnceToken(topicId: number): Promise<Result<string>> {
    return this.invoke(
      "GetReplyOnceTokenAsync",
      [topicId],
      z.object({ once: z.string() }).transform((d) => d.once),
    );
  }

  async postReply(
    topicId: number,
    content: string,
    once: string,
  ): Promise<Result<TopicInfoType | null>> {
    const res = await this.invoke(
      "PostReplyAsync",
      [topicId, encodeURIComponent(content), once],
      TopicInfoSchema.nullable(),
    );
    return res;
  }

  async thankReply(replyId: string, once: string): Promise<Result<void>> {
    return this.invokeVoid("ThankReplyAsync", [replyId, once]);
  }

  async ignoreReply(replyId: string, once: string): Promise<Result<void>> {
    return this.invokeVoid("IgnoreReplyAsync", [replyId, once]);
  }
async getUserPage(username: string): Promise<Result<MemberType>> {
    return this.invoke("GetUserPageAsync", [username], MemberSchema);
  }

  // --- Helper / Native Methods ---

  async getStringValue(key: string): Promise<Result<string | null>> {
    const res = await this.invoke(
      "GetStringValue",
      [key],
      z.string().nullable(),
    );
    // If empty string, it returns "" which is string.
    // If C# returns null? JsonSerializer.Serialize(null) -> "null".
    // JSON.parse("null") -> null.
    return res;
  }

  async setStringValue(key: string, value: string): Promise<Result<void>> {
    return this.invokeVoid("SetStringValue", [key, value]);
  }

  async showSnackbar(message: string): Promise<Result<void>> {
    return this.invokeVoid("ShowSnackbar", [message]);
  }

  async showToast(message: string): Promise<Result<void>> {
    return this.invokeVoid("ShowToast", [message]);
  }

  async getSystemInfo(): Promise<Result<SystemInfo>> {
    // SystemInfo object is serialized directly.
    const schema = z.object({
      platform: z.string(),
      appVersion: z.string(),
      deviceModel: z.string(),
      manufacturer: z.string(),
      deviceName: z.string(),
      operatingSystem: z.string(),
    });
    return this.invoke("GetSystemInfo", [], schema);
  }

  async trackAnalyticsEvent(
    eventName: string,
    parameters?: AnalyticsParams,
  ): Promise<Result<void>> {
    return this.invokeVoid("TrackAnalyticsEventAsync", [eventName, parameters]);
  }

  // --- Logs ---

  async getLogFiles(): Promise<Result<{ files: any[]; error?: string }>> {
    // C# returns { files: [...] }
    const schema = z.object({
      files: z.array(z.any()),
      error: z.string().optional(),
    });
    return this.invoke("GetLogFilesAsync", [], schema);
  }

  async getLogFileContent(fileName: string): Promise<Result<any | null>> {
    // C# returns { fileName, content, size, lastModified }
    const schema = z.object({
      fileName: z.string(),
      content: z.string(),
      size: z.number(),
      lastModified: z.string(), // or date? C# DateTime serializes to string usually
    });
    return this.invoke("GetLogFileContentAsync", [fileName], schema);
  }

  async deleteLogFile(fileName: string): Promise<Result<boolean>> {
    // C# returns { success: true, message: ... }
    const res = await this.invokeVoid("DeleteLogFileAsync", [fileName]);
    if (res.error !== null) return err(res.error);
    return ok(true);
  }

  async clearAllLogs(): Promise<Result<boolean>> {
    const res = await this.invokeVoid("ClearAllLogsAsync");
    if (res.error !== null) return err(res.error);
    return ok(true);
  }

  async openExternalLink(url: string): Promise<Result<void>> {
    return this.invokeVoid("OpenExternalLinkAsync", [url]);
  }

  /**
   * 从相册选择图片
   * @returns 包含 Base64 编码图片数据的结果
   */
  async pickImage(): Promise<Result<PickImageResult>> {
    // C# returns { success: true, base64:..., contentType:..., fileName:..., size:... }
    // OR { cancelled: true }
    const schema = z.object({
      success: z.boolean().optional(),
      cancelled: z.boolean().optional(),
      base64: z.string().optional(),
      contentType: z.string().optional(),
      fileName: z.string().optional(),
      size: z.number().optional(),
      error: z.string().optional(),
      message: z.string().optional(),
    });
    return this.invoke("PickImageAsync", [], schema);
  }

  // --- History Management ---

  async getHistory(): Promise<Result<HistoryItem[]>> {
    return this.invoke("GetHistoryAsync", [], z.array(z.any()) as any);
  }

  async recordHistory(item: HistoryItem): Promise<Result<void>> {
    return this.invokeVoid("RecordHistoryAsync", [JSON.stringify(item)]);
  }

  async removeHistory(topicId: number): Promise<Result<void>> {
    return this.invokeVoid("RemoveHistoryAsync", [topicId]);
  }

  async clearHistory(): Promise<Result<void>> {
    return this.invokeVoid("ClearHistoryAsync", []);
  }

  async haptics(type: string): Promise<Result<void>> {
    return this.invokeVoid("HapticsAsync", [type]);
  }
}

/**
 * 图片选择结果类型
 */
export interface PickImageResult {
  success?: boolean;
  cancelled?: boolean;
  base64?: string;
  contentType?: string;
  fileName?: string;
  size?: number;
  error?: string;
  message?: string;
}
