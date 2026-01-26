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
  NotificationType,
  DailyInfoType,
  SearchResultType,
  NodesNavInfoType,
  TagInfoType,
  CurrentUserType,
} from "../schemas/topicSchema";
import type { SignInFormInfo } from "../store/authStore";
import {
  TopicListSchema,
  NodeInfoListSchema,
  NodeInfoSchema,
  TopicDetailSchema,
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
import { IV2exApiService, SystemInfo } from "./IV2exApiService";

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

  private parseJsonOrError<T>(
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

  private firebaseAnalytics = createFirebaseAnalytics(async (method, args) => {
    const res = await this.callMauiBridge(method, args);
    if (res.error !== null) throw new Error(res.error);
    return res.data;
  });

  // --- Read Methods ---

  async getLatestTopics(): Promise<Result<TopicType[]>> {
    const res = await this.callMauiBridge("GetLatestTopicsAsync");
    if (res.error !== null) return err(res.error);
    return this.parseJsonOrError("TopicList", TopicListSchema, res.data);
  }

  async getHotTopics(): Promise<Result<TopicType[]>> {
    const res = await this.callMauiBridge("GetHotTopicsAsync");
    if (res.error !== null) return err(res.error);
    return this.parseJsonOrError("TopicList", TopicListSchema, res.data);
  }

  async getTabTopics(
    params: GetTabTopicsParams,
  ): Promise<Result<NewsInfoType>> {
    const res = await this.callMauiBridge("GetTabTopicsAsync", [params.tab]);
    if (res.error !== null) return err(res.error);
    return this.parseJsonOrError("TabTopics", NewsInfoSchema, res.data);
  }

  async getNodeTopics(
    params: GetNodeTopicsParams,
  ): Promise<Result<TopicType[]>> {
    const res = await this.callMauiBridge("GetNodeTopicsAsync", [
      params.nodeName,
      params.page ?? 1,
    ]);
    if (res.error !== null) return err(res.error);
    return this.parseJsonOrError("TopicList", TopicListSchema, res.data);
  }

  async getTopicDetail(
    params: GetTopicParams,
  ): Promise<Result<TopicInfoType | null>> {
    const res = await this.callMauiBridge("GetTopicDetailAsync", [
      params.topicId,
    ]);
    if (res.error !== null) return err(res.error);

    // Custom parsing for null case
    let data: unknown;
    try {
      data = JSON.parse(res.data) as unknown;
    } catch (e) {
      return err(`返回内容解析失败（TopicDetail）：${toErrorMessage(e)}`);
    }
    if (data === null) return ok(null);
    try {
      return ok(TopicInfoSchema.parse(data));
    } catch (e) {
      return err(`数据解析失败（TopicDetail）：${toErrorMessage(e)}`);
    }
  }

  async getUserProfile(
    params: GetUserParams,
  ): Promise<Result<MemberType | null>> {
    const res = await this.callMauiBridge("GetUserProfileAsync", [
      params.username,
    ]);
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
  }

  async getNodes(): Promise<Result<NodeInfoType[]>> {
    const res = await this.callMauiBridge("GetNodesAsync");
    if (res.error !== null) return err(res.error);
    return this.parseJsonOrError("NodeInfoList", NodeInfoListSchema, res.data);
  }

  async getNodesNavInfo(): Promise<Result<NodesNavInfoType>> {
    const res = await this.callMauiBridge("GetNodesNavInfoAsync");
    if (res.error !== null) return err(res.error);
    return this.parseJsonOrError("NodesNavInfo", NodesNavInfoSchema, res.data);
  }

  async getTagTopics(tagName: string): Promise<Result<TagInfoType>> {
    const res = await this.callMauiBridge("GetTagInfoAsync", [tagName]);
    if (res.error !== null) return err(res.error);
    return this.parseJsonOrError("TagInfo", TagInfoSchema, res.data);
  }

  async getNodeDetail(
    params: GetNodeParams,
  ): Promise<Result<NodeInfoType | null>> {
    const res = await this.callMauiBridge("GetNodeDetailAsync", [
      params.nodeName,
    ]);
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
  }

  // --- Auth Methods ---

  async getLoginParameters(): Promise<Result<SignInFormInfo>> {
    const res = await this.callMauiBridge("GetLoginParametersAsync");
    if (res.error !== null) return err(res.error);

    let data: unknown;
    try {
      data = JSON.parse(res.data) as unknown;
    } catch (e) {
      return err(`返回内容解析失败（LoginParams）：${toErrorMessage(e)}`);
    }

    if (data && typeof data === "object") {
      const d = data as any;
      return ok({
        usernameFieldName: d.nameParameter || d.usernameFieldName,
        passwordFieldName: d.passwordParameter || d.passwordFieldName,
        captchaFieldName: d.captchaParameter || d.captchaFieldName,
        once: d.once,
        captchaImage: "",
      });
    }
    return err("解析登录参数失败");
  }

  async getSignInPageInfo(): Promise<Result<SignInFormInfo>> {
    return this.getLoginParameters(); // Delegate or remove if unused, but implementing interface
  }

  async getCaptchaImage(
    once: string,
  ): Promise<Result<{ image: string; mimeType: string }>> {
    const res = await this.callMauiBridge("GetCaptchaImageAsync", [once]);
    if (res.error !== null) return err(res.error);

    let data: unknown;
    try {
      data = JSON.parse(res.data) as unknown;
    } catch (e) {
      return err(`返回内容解析失败（CaptchaImage）：${toErrorMessage(e)}`);
    }

    if (
      data &&
      typeof data === "object" &&
      "success" in data &&
      (data as any).success === true &&
      "image" in data
    ) {
      return ok({
        image: (data as any).image,
        mimeType: (data as any).mimeType || "image/gif",
      });
    }

    return err("获取验证码失败");
  }

  async signIn(
    username: string,
    password: string,
    formInfo: SignInFormInfo,
    captchaCode: string,
  ): Promise<Result<{ username: string }>> {
    const res = await this.callMauiBridge("SignInAsync", [
      username,
      password,
      formInfo.usernameFieldName,
      formInfo.passwordFieldName,
      formInfo.captchaFieldName,
      formInfo.once,
      captchaCode,
    ]);

    if (res.error !== null) return err(res.error);

    let data: unknown;
    try {
      data = JSON.parse(res.data) as unknown;
    } catch (e) {
      return err(`返回内容解析失败（SignInResult）：${toErrorMessage(e)}`);
    }

    if (
      data &&
      typeof data === "object" &&
      "success" in data &&
      (data as any).success === true
    ) {
      return ok({ username: (data as any).username });
    }

    if (data && typeof data === "object" && "error" in data) {
      return err((data as any).error);
    }
    return err("登录失败");
  }

  async signOut(): Promise<Result<void>> {
    const res = await this.callMauiBridge("SignOutAsync");
    if (res.error !== null) return err(res.error);

    let data: unknown;
    try {
      data = JSON.parse(res.data) as unknown;
    } catch (e) {
      // tolerate empty response
    }
    return ok(undefined);
  }

  async isLoggedIn(): Promise<Result<boolean>> {
    const res = await this.callMauiBridge("IsLoggedInAsync");
    if (res.error !== null) return err(res.error);

    let data: unknown;
    try {
      data = JSON.parse(res.data) as unknown;
    } catch (e) {
      return ok(false);
    }
    if (data && typeof data === "object" && "isLoggedIn" in data) {
      return ok((data as any).isLoggedIn === true);
    }
    return ok(false);
  }

  async getCurrentUser(): Promise<Result<MemberType>> {
    const res = await this.callMauiBridge("GetCurrentUserAsync");
    if (res.error !== null) return err(res.error);

    let data: unknown;
    try {
      data = JSON.parse(res.data) as unknown;
    } catch (e) {
      return err(`返回内容解析失败（CurrentUser）：${toErrorMessage(e)}`);
    }

    if (
      data &&
      typeof data === "object" &&
      "success" in data &&
      (data as any).success === true &&
      "user" in data
    ) {
      try {
        return ok(MemberSchema.parse((data as any).user) as MemberType);
      } catch (e) {
        return err(`用户数据解析失败：${toErrorMessage(e)}`);
      }
    }
    return err("获取用户信息失败");
  }

  async signInTwoStep(code: string, once: string): Promise<Result<void>> {
    const res = await this.callMauiBridge("SignInTwoStepAsync", [code, once]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  }

  async getDailyInfo(): Promise<Result<DailyInfoType>> {
    const res = await this.callMauiBridge("GetDailyInfoAsync");
    if (res.error !== null) return err(res.error);
    return this.parseJsonOrError("DailyInfo", DailyInfoSchema, res.data);
  }

  async checkIn(once: string): Promise<Result<void>> {
    const res = await this.callMauiBridge("CheckInAsync", [once]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  }

  async getNotifications(
    page: number = 1,
  ): Promise<Result<NotificationType[]>> {
    const res = await this.callMauiBridge("GetNotificationsAsync", [page]);
    if (res.error !== null) return err(res.error);
    return this.parseJsonOrError(
      "NotificationList",
      z.array(NotificationSchema),
      res.data,
    );
  }

  async getFollowing(page: number = 1): Promise<Result<TopicType[]>> {
    const res = await this.callMauiBridge("GetFollowingAsync", [page]);
    if (res.error !== null) return err(res.error);
    return this.parseJsonOrError("TopicList", TopicListSchema, res.data);
  }

  async getFavoriteTopics(page: number = 1): Promise<Result<TopicType[]>> {
    const res = await this.callMauiBridge("GetFavoriteTopicsAsync", [page]);
    if (res.error !== null) return err(res.error);
    return this.parseJsonOrError("TopicList", TopicListSchema, res.data);
  }

  async getFavoriteNodes(): Promise<Result<NodeInfoType[]>> {
    const res = await this.callMauiBridge("GetFavoriteNodesAsync");
    if (res.error !== null) return err(res.error);
    return this.parseJsonOrError("NodeInfoList", NodeInfoListSchema, res.data);
  }

  async search(
    q: string,
    from: number = 0,
    sort: string = "created",
  ): Promise<Result<SearchResultType[]>> {
    const res = await this.callMauiBridge("SearchAsync", [q, from, sort]);
    if (res.error !== null) return err(res.error);
    return this.parseJsonOrError(
      "SearchResultList",
      z.array(SearchResultSchema),
      res.data,
    );
  }

  // --- Topic Interactions ---

  async createTopic(
    title: string,
    content: string,
    nodeId: string,
    once: string,
  ): Promise<Result<{ topicId?: number; url?: string }>> {
    const res = await this.callMauiBridge("CreateTopicAsync", [
      title,
      content,
      nodeId,
      once,
    ]);
    if (res.error !== null) return err(res.error);
    return this.parseJsonOrError(
      "CreateTopicResult",
      z
        .object({ topicId: z.number().optional(), url: z.string().optional() })
        .passthrough(),
      res.data,
    );
  }

  async thankTopic(topicId: string, once: string): Promise<Result<void>> {
    const res = await this.callMauiBridge("ThankTopicAsync", [topicId, once]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  }

  async ignoreTopic(topicId: string, once: string): Promise<Result<void>> {
    const res = await this.callMauiBridge("IgnoreTopicAsync", [topicId, once]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  }

  async unignoreTopic(topicId: string, once: string): Promise<Result<void>> {
    const res = await this.callMauiBridge("UnignoreTopicAsync", [
      topicId,
      once,
    ]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  }

  async favoriteTopic(topicId: string, once: string): Promise<Result<void>> {
    const res = await this.callMauiBridge("FavoriteTopicAsync", [
      topicId,
      once,
    ]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  }

  async unfavoriteTopic(topicId: string, once: string): Promise<Result<void>> {
    const res = await this.callMauiBridge("UnfavoriteTopicAsync", [
      topicId,
      once,
    ]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  }

  async upTopic(topicId: string, once: string): Promise<Result<void>> {
    const res = await this.callMauiBridge("UpTopicAsync", [topicId, once]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  }

  async downTopic(topicId: string, once: string): Promise<Result<void>> {
    const res = await this.callMauiBridge("DownTopicAsync", [topicId, once]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  }

  async appendTopic(
    topicId: string,
    content: string,
    once: string,
  ): Promise<Result<void>> {
    const res = await this.callMauiBridge("AppendTopicAsync", [
      topicId,
      once,
      content,
    ]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  }

  // --- Node Interactions ---

  async ignoreNode(nodeId: string, once: string): Promise<Result<void>> {
    const res = await this.callMauiBridge("IgnoreNodeAsync", [nodeId, once]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  }

  async unignoreNode(nodeId: string, once: string): Promise<Result<void>> {
    const res = await this.callMauiBridge("UnignoreNodeAsync", [nodeId, once]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  }

  // --- User Interactions ---
  async followUser(url: string): Promise<Result<void>> {
    const res = await this.callMauiBridge("FollowUserAsync", [url]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  }

  async blockUser(url: string): Promise<Result<void>> {
    const res = await this.callMauiBridge("BlockUserAsync", [url]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  }

  // --- Reply Methods ---

  async getReplyOnceToken(topicId: number): Promise<Result<string>> {
    const res = await this.callMauiBridge("GetReplyOnceTokenAsync", [topicId]);
    if (res.error !== null) return err(res.error);

    let data: unknown;
    try {
      data = JSON.parse(res.data) as unknown;
    } catch (e) {
      return err(`返回内容解析失败（ReplyOnceToken）：${toErrorMessage(e)}`);
    }

    if (
      data &&
      typeof data === "object" &&
      "success" in data &&
      (data as any).success === true &&
      "once" in data
    ) {
      return ok((data as any).once);
    }
    return err("获取回复 token 失败");
  }

  async postReply(
    topicId: number,
    content: string,
    once: string,
  ): Promise<Result<{ replyId?: number }>> {
    const res = await this.callMauiBridge("PostReplyAsync", [
      topicId,
      content,
      once,
    ]);
    if (res.error !== null) return err(res.error);

    let data: unknown;
    try {
      data = JSON.parse(res.data) as unknown;
    } catch (e) {
      return err(`返回内容解析失败（PostReplyResult）：${toErrorMessage(e)}`);
    }

    if (data && typeof data === "object" && "success" in data) {
      if ((data as any).success === true) {
        return ok({
          replyId: (data as any).replyId,
        });
      } else {
        return err((data as any).message || "回复失败");
      }
    }
    return err("发表回复失败");
  }

  async requiresLogin(topicId: number): Promise<Result<boolean>> {
    const res = await this.callMauiBridge("RequiresLoginAsync", [topicId]);
    if (res.error !== null) return err(res.error);

    let data: unknown;
    try {
      data = JSON.parse(res.data) as unknown;
    } catch (e) {
      return err(
        `返回内容解析失败（RequiresLoginResult）：${toErrorMessage(e)}`,
      );
    }

    if (data && typeof data === "object" && "requiresLogin" in data) {
      return ok((data as any).requiresLogin === true);
    }
    return ok(true);
  }

  async getUserPage(username: string): Promise<Result<MemberType>> {
    const res = await this.callMauiBridge("GetUserPageAsync", [username]);
    if (res.error !== null) return err(res.error);
    return this.parseJsonOrError("Member", MemberSchema, res.data);
  }

  // --- Helper / Native Methods ---

  async getStringValue(key: string): Promise<Result<string | null>> {
    const res = await this.callMauiBridge("GetStringValue", [key]);
    if (res.error !== null) return err(res.error);
    return ok(res.data.length ? res.data : null);
  }

  async setStringValue(key: string, value: string): Promise<Result<void>> {
    const res = await this.callMauiBridge("SetStringValue", [key, value]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  }

  async showSnackbar(message: string): Promise<Result<void>> {
    const res = await this.callMauiBridge("ShowSnackbar", [message]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  }

  async showToast(message: string): Promise<Result<void>> {
    const res = await this.callMauiBridge("ShowToast", [message]);
    if (res.error !== null) return err(res.error);
    return ok(undefined);
  }

  async getSystemInfo(): Promise<Result<SystemInfo>> {
    const res = await this.callMauiBridge("GetSystemInfo");
    if (res.error !== null) return err(res.error);
    try {
      const parsed = JSON.parse(res.data) as Partial<SystemInfo>;
      return ok({
        platform: parsed.platform ?? "",
        appVersion: parsed.appVersion ?? "",
        deviceModel: parsed.deviceModel ?? "",
        manufacturer: parsed.manufacturer ?? "",
        deviceName: parsed.deviceName ?? "",
        operatingSystem: parsed.operatingSystem ?? "",
      });
    } catch (e) {
      return err(`返回内容解析失败（SystemInfo）：${toErrorMessage(e)}`);
    }
  }

  async trackAnalyticsEvent(
    eventName: string,
    parameters?: AnalyticsParams,
  ): Promise<Result<void>> {
    try {
      await this.firebaseAnalytics.logEvent(eventName, parameters);
      return ok(undefined);
    } catch (e) {
      return err(toErrorMessage(e, "bridge analytics failed"));
    }
  }

  // --- Logs ---

  async getLogFiles(): Promise<Result<{ files: any[]; error?: string }>> {
    const res = await this.callMauiBridge("GetLogFilesAsync");
    if (res.error !== null) return err(res.error);
    try {
      const data = JSON.parse(res.data);
      return ok(data);
    } catch (e) {
      return err(`Log files parse error: ${toErrorMessage(e)}`);
    }
  }

  async getLogFileContent(fileName: string): Promise<Result<any | null>> {
    const res = await this.callMauiBridge("GetLogFileContentAsync", [fileName]);
    if (res.error !== null) return err(res.error);
    try {
      return ok(JSON.parse(res.data));
    } catch (e) {
      return err(`Log content parse error: ${toErrorMessage(e)}`);
    }
  }

  async deleteLogFile(fileName: string): Promise<Result<boolean>> {
    const res = await this.callMauiBridge("DeleteLogFileAsync", [fileName]);
    if (res.error !== null) return err(res.error);
    try {
      const data = JSON.parse(res.data);
      return ok(data.success === true);
    } catch {
      return ok(false);
    }
  }

  async clearAllLogs(): Promise<Result<boolean>> {
    const res = await this.callMauiBridge("ClearAllLogsAsync");
    if (res.error !== null) return err(res.error);
    try {
      const data = JSON.parse(res.data);
      return ok(data.success === true);
    } catch {
      return ok(false);
    }
  }
}
