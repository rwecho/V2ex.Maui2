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

export const TopicListSchema = z.array(TopicSchema);
export const NodeInfoListSchema = z.array(NodeInfoSchema);

export type MemberType = z.infer<typeof MemberSchema>;
export type NodeInfoType = z.infer<typeof NodeInfoSchema>;
export type TopicType = z.infer<typeof TopicSchema>;

export interface GetNodeTopicsParams {
  nodeName: string;
  page?: number;
}

export interface GetTabTopicsParams {
  tab: string;
}

export interface GetTopicParams {
  topicId: number;
  page?: number;
}

export interface GetUserParams {
  username: string;
}

export interface GetNodeParams {
  nodeName: string;
}

export const NotificationSchema = z
  .object({
    id: z.number(),
    member: MemberSchema.optional(),
    topic: TopicSchema.optional(),
    action: z.string().optional(), // reply, thank, etc.
    content: NullishString,
    contentRendered: NullishString,
    created: z.number().optional(),
  })
  .passthrough();

export const DailyInfoSchema = z
  .object({
    balance: z.string().optional(),
    silver: z.string().optional(),
    bronze: z.string().optional(),
    gold: z.string().optional(),
    checkInLink: NullishString,
  })
  .passthrough();

export const SearchResultSchema = z
  .object({
    topicId: z.number(),
    title: z.string(),
    content: NullishString,
    node: NodeInfoSchema.optional(),
    member: MemberSchema.optional(),
    created: z.number().optional(),
    replies: z.number().optional(),
  })
  .passthrough();

export type NotificationType = z.infer<typeof NotificationSchema>;
export type DailyInfoType = z.infer<typeof DailyInfoSchema>;
export type SearchResultType = z.infer<typeof SearchResultSchema>;

export const NewsItemSchema = z
  .object({
    title: z.string(),
    link: NullishString,
    avatar: z.string(),
    avatarLink: z.string().optional(),
    userName: NullishString,
    userLink: NullishString,
    lastRepliedText: NullishString,
    lastRepliedBy: NullishString,
    nodeName: z.string(),
    nodeLink: z.string(),
    replies: z.number(),
    // Derived or optional properties
    id: z.string().optional(),
  })
  .passthrough();

export const NewsInfoSchema = z
  .object({
    items: z.array(NewsItemSchema),
    currentUser: z.any().optional(), // We might refine this later if needed
  })
  .passthrough();

export type NewsItemType = z.infer<typeof NewsItemSchema>;
export type NewsInfoType = z.infer<typeof NewsInfoSchema>;

export const ReplyInfoSchema = z
  .object({
    id: z.string(),
    content: z.string(),
    userName: z.string(),
    userLink: z.string(),
    avatar: z.string(),
    replyTimeText: NullishString,
    badges: NullishString,
    floor: z.number(),
    thanks: NullishString,
    thanked: NullishString,
  })
  .passthrough();
  
export const SupplementInfoSchema = z
  .object({
    createdText: NullishString,
    content: NullishString,
  })
  .passthrough();

export const TopicInfoSchema = z
  .object({
    title: z.string(),
    userName: z.string(),
    userLink: z.string(),
    avatar: z.string(),
    createdText: z.string(),
    topicStats: NullishString,
    viaPhone: NullishString,
    liked: NullishString,
    thanked: NullishString,
    ignored: NullishString,
    content: NullishString,
    nodeName: z.string(),
    nodeLink: z.string(),
    replyStats: NullishString,
    replies: z.array(ReplyInfoSchema),
    once: NullishString,
    currentPage: z.number().optional(), // Computed in C#, typically serialized
    maximumPage: z.number().optional(), // Computed in C#, typically serialized
    supplements: z.array(SupplementInfoSchema).optional(),
    tags: z.array(z.string()).optional(),
  })
  .passthrough();

export type ReplyInfoType = z.infer<typeof ReplyInfoSchema>;
export type SupplementInfoType = z.infer<typeof SupplementInfoSchema>;
export type TopicInfoType = z.infer<typeof TopicInfoSchema>;

export const NodesNavInfoSchema = z
  .object({
    items: z.array(
      z
        .object({
          category: z.string(),
          nodes: z.array(
            z
              .object({
                name: z.string(),
                link: z.string().nullable().optional(),
              })
              .passthrough(),
          ),
        })
        .passthrough(),
    ),
    url: z.string().optional(),
  })
  .passthrough();

export const TagInfoSchema = z
  .object({
    currentPage: z.number(),
    maximumPage: z.number(),
    items: z.array(
      z
        .object({
          avatar: NullishString,
          userName: z.string(),
          userLink: z.string(),
          topicTitle: z.string(),
          topicLink: z.string(),
          replies: z.number(),
          nodeName: z.string(),
          nodeLink: z.string(),
          created: z.string().optional(), // DateTime in C# but serialized as string? Or object? Core: string CreatedText or DateTime Created. Check API.
          // Usually API returns JSON serialized DateTime if not formatted.
          // But Wait, TagInfo.cs has "Created" as DateTime and "CreatedText" as string.
          // Bridge uses JsonSerializer.Serialize(tagInfo).
          // So "Created" will be ISO string.
          createdText: z.string().optional(),
          lastReplyUserName: NullishString,
          lastReplyUserLink: NullishString,
        })
        .passthrough(),
    ),
  })
  .passthrough();

export const CurrentUserSchema = z
  .object({
    name: z.string().optional().nullable(),
    avatar: z.string().optional().nullable(),
    notifications: z.string().optional().nullable(),
    moneyGold: z.string().optional().nullable(),
    moneySilver: z.string().optional().nullable(),
    moneyBronze: z.string().optional().nullable(),
    dailyMission: z.string().optional().nullable(),
  })
  .passthrough();

export type CurrentUserType = z.infer<typeof CurrentUserSchema>;

export type NodesNavInfoType = z.infer<typeof NodesNavInfoSchema>;
export type TagInfoType = z.infer<typeof TagInfoSchema>;
