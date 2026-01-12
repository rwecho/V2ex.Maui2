/**
 * V2EX 数据类型定义（基于 JSON API）
 */

/**
 * V2EX 成员/用户信息
 */
export interface Member {
  id: number;
  username: string;
  tagline: string;
  avatarLarge: string;
  avatarMini: string;
  status: string;
  bio?: string;
  website?: string;
  github?: string;
  created: number; // Unix timestamp
  numTopics: number;
  numPosts: number;
  followers: number;
}

/**
 * V2EX 节点信息
 */
export interface NodeInfo {
  id: number;
  name: string;
  title: string;
  titleAlternative: string;
  icon?: string;
  header?: string;
  parentNodeName?: string;
  footer?: string;
  topics: number;
  created: number; // Unix timestamp
  lastModified: number; // Unix timestamp
}

/**
 * V2EX 话题
 */
export interface Topic {
  id: number;
  title: string;
  content: string;
  contentRendered: string;
  url: string;
  created: number; // Unix timestamp
  lastModified: number; // Unix timestamp
  lastTouched: number; // Unix timestamp
  replies: number;
  deleted: boolean;
  member?: Member;
  node?: NodeInfo;
}

/**
 * V2EX 回复/评论
 */
export interface Reply {
  id: number;
  content: string;
  contentRendered: string;
  created: number; // Unix timestamp
  member?: Member;
  isOp: boolean;
  mentioned?: string[];
}

/**
 * 话题详情（包含回复列表）
 */
export interface TopicDetail {
  topic?: Topic;
  replies?: Reply[];
  page: number;
  totalPages: number;
}

// 向后兼容的类型别名
export type User = Member;
export type Node = NodeInfo;
export type Comment = Reply;

// API 参数类型
export interface GetTopicsParams {
  page?: number;
}

export interface GetNodeTopicsParams {
  nodeName: string;
  page?: number;
}

export interface GetTopicParams {
  topicId: number; // 改为 number 类型
}

export interface GetUserParams {
  username: string;
}

export interface GetNodeParams {
  nodeName: string;
}
