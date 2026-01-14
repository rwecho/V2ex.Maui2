import { z } from "zod";

const NullishString = z.string().nullable().optional();

/**
 * 这里的 schema 以“兼容后端返回”为目标：
 * - 必要字段严格
 * - 其余字段尽量 optional + passthrough，避免后端字段增减导致前端崩
 */

export const MemberSchema = z
  .object({
    id: z.number(),
    username: z.string(),
    tagline: NullishString,
    avatarLarge: NullishString,
    avatarMini: NullishString,
    status: NullishString,
    bio: NullishString,
    website: NullishString,
    github: NullishString,
    created: z.number().optional(),
    numTopics: z.number().optional(),
    numPosts: z.number().optional(),
    followers: z.number().optional(),
  })
  .passthrough();

export const NodeInfoSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    title: NullishString,
    titleAlternative: NullishString,
    icon: NullishString,
    header: NullishString,
    parentNodeName: NullishString,
    footer: NullishString,
    topics: z.number().optional(),
    created: z.number().optional(),
    lastModified: z.number().optional(),
  })
  .passthrough();

export const TopicSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    content: NullishString,
    contentRendered: NullishString,
    url: NullishString,
    created: z.number().optional(),
    lastModified: z.number().optional(),
    lastTouched: z.number().optional(),
    replies: z.number().optional(),
    deleted: z.union([z.boolean(), z.number()]).optional(),
    member: MemberSchema.optional(),
    node: NodeInfoSchema.optional(),
  })
  .passthrough();

export const ReplySchema = z
  .object({
    id: z.number(),
    content: NullishString,
    contentRendered: NullishString,
    created: z.number().optional(),
    member: MemberSchema.optional(),
    isOp: z.boolean().optional(),
    // 后端这里会返回 null（而不是缺省），需要兼容
    mentioned: z.array(z.string()).nullable().optional(),
  })
  .passthrough();

export const TopicDetailSchema = z
  .object({
    topic: TopicSchema.optional(),
    replies: z.array(ReplySchema).optional(),
    page: z.number().optional(),
    totalPages: z.number().optional(),
  })
  .passthrough();

export const TopicListSchema = z.array(TopicSchema);
export const NodeInfoListSchema = z.array(NodeInfoSchema);

export type MemberType = z.infer<typeof MemberSchema>;
export type NodeInfoType = z.infer<typeof NodeInfoSchema>;
export type TopicType = z.infer<typeof TopicSchema>;
export type ReplyType = z.infer<typeof ReplySchema>;
export type TopicDetailType = z.infer<typeof TopicDetailSchema>;

export interface GetNodeTopicsParams {
  nodeName: string;
  page?: number;
}

export interface GetTabTopicsParams {
  tab: string;
}

export interface GetTopicParams {
  topicId: number;
}

export interface GetUserParams {
  username: string;
}

export interface GetNodeParams {
  nodeName: string;
}
