import {
  DailyInfoType,
  MemberType,
  NodeInfoType,
  NotificationType,
  SearchResultType,
  TopicType,
  GetNodeParams,
  GetNodeTopicsParams,
  GetTabTopicsParams,
  GetTopicParams,
  GetUserParams,
  NodesNavInfoType,
  TagInfoType,
  NewsInfoType,
  TopicInfoType,
  CurrentUserType,
} from "../schemas/topicSchema";
import { Result } from "./result";

import { AnalyticsParams } from "./firebase";
import { SignInFormInfoType } from "../schemas/accountSchema";

export interface SystemInfo {
  platform: string;
  appVersion: string;
  deviceModel: string;
  manufacturer: string;
  deviceName: string;
  operatingSystem: string;
}

export interface IV2exApiService {
  getLatestTopics(): Promise<Result<TopicType[]>>;
  getHotTopics(): Promise<Result<TopicType[]>>;
  getTabTopics(params: GetTabTopicsParams): Promise<Result<NewsInfoType>>;
  getNodeTopics(params: GetNodeTopicsParams): Promise<Result<TopicType[]>>;
  getTopicDetail(params: GetTopicParams): Promise<Result<TopicInfoType | null>>;
  getUserProfile(params: GetUserParams): Promise<Result<MemberType | null>>;
  getNodes(): Promise<Result<NodeInfoType[]>>;
  getNodeDetail(params: GetNodeParams): Promise<Result<NodeInfoType | null>>;

  // New Methods
  getNodesNavInfo(): Promise<Result<NodesNavInfoType>>;
  getTagTopics(tagName: string): Promise<Result<TagInfoType>>;

  // Topic Interactions
  createTopic(
    title: string,
    content: string,
    nodeId: string,
    once: string,
  ): Promise<Result<{ topicId?: number; url?: string }>>;
  thankTopic(topicId: string, once: string): Promise<Result<void>>;
  ignoreTopic(topicId: string, once: string): Promise<Result<void>>;
  unignoreTopic(topicId: string, once: string): Promise<Result<void>>;
  favoriteTopic(topicId: string, once: string): Promise<Result<void>>;
  unfavoriteTopic(topicId: string, once: string): Promise<Result<void>>;
  upTopic(topicId: string, once: string): Promise<Result<void>>;
  downTopic(topicId: string, once: string): Promise<Result<void>>;
  appendTopic(
    topicId: string,
    content: string,
    once: string,
  ): Promise<Result<void>>;

  // Reply Interactions - ADDED
  getReplyOnceToken(topicId: number): Promise<Result<string>>;
  postReply(
    topicId: number,
    content: string,
    once: string,
  ): Promise<Result<TopicInfoType | null>>;
  requiresLogin(topicId: number): Promise<Result<boolean>>;

  // Node Interactions
  ignoreNode(nodeId: string, once: string): Promise<Result<void>>;
  unignoreNode(nodeId: string, once: string): Promise<Result<void>>;

  // User Interactions
  getUserPage(username: string): Promise<Result<MemberType>>;
  followUser(url: string): Promise<Result<void>>;
  blockUser(url: string): Promise<Result<void>>;

  // Account
  getLoginParameters(): Promise<Result<SignInFormInfoType>>;
  getCaptchaImage(
    once: string,
  ): Promise<Result<{ image: string; mimeType: string }>>;
  signIn(
    username: string,
    password: string,
    formInfo: SignInFormInfoType,
    captchaCode: string,
  ): Promise<Result<{ username: string; currentUser?: CurrentUserType }>>;
  signOut(): Promise<Result<void>>;
  isLoggedIn(): Promise<Result<boolean>>;
  getCurrentUser(): Promise<Result<MemberType>>;

  signInTwoStep(code: string, once: string): Promise<Result<void>>;
  getDailyInfo(): Promise<Result<DailyInfoType>>;
  checkIn(once: string): Promise<Result<void>>;
  getNotifications(page?: number): Promise<Result<NotificationType[]>>;
  getFollowing(page?: number): Promise<Result<TopicType[]>>;
  getFavoriteTopics(page?: number): Promise<Result<TopicType[]>>;
  getFavoriteNodes(): Promise<Result<NodeInfoType[]>>;

  // Search
  search(
    q: string,
    from?: number,
    sort?: string,
  ): Promise<Result<SearchResultType[]>>;

  // Native / UI / Storage - ADDED
  getSystemInfo(): Promise<Result<SystemInfo>>;
  showToast(message: string): Promise<Result<void>>;
  showSnackbar(message: string): Promise<Result<void>>;
  getStringValue(key: string): Promise<Result<string | null>>;
  setStringValue(key: string, value: string): Promise<Result<void>>;
  trackAnalyticsEvent(
    eventName: string,
    parameters?: AnalyticsParams,
  ): Promise<Result<void>>;

  // Logs Management
  getLogFiles(): Promise<Result<{ files: LogFile[]; error?: string }>>;
  getLogFileContent(fileName: string): Promise<Result<LogFileContent | null>>;
  deleteLogFile(fileName: string): Promise<Result<boolean>>;
  clearAllLogs(): Promise<Result<boolean>>;
}

export interface LogFile {
  name: string;
  path: string;
  size: number;
  lastModified: string;
}

export interface LogFileContent {
  fileName: string;
  content: string;
  size: number;
  lastModified: string;
}
