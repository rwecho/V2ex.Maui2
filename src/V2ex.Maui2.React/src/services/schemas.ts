/**
 * Zod schemas for data validation
 */

import { z } from 'zod';

/**
 * Topic Schema
 */
export const TopicSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  url: z.string(),
  author: z.string(),
  avatar: z.string(),
  nodeName: z.string(),
  nodeTitle: z.string(),
  lastReplyTime: z.string(),
  replyCount: z.number(),
  clickCount: z.number(),
  createdAt: z.string(),
});

export type Topic = z.infer<typeof TopicSchema>;

/**
 * Comment Schema
 */
export const CommentSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  content: z.string(),
  username: z.string(),
  avatar: z.string(),
  floor: z.number(),
  createdAt: z.string(),
  isAuthor: z.boolean(),
  replyToCommentId: z.string().optional(),
  thankCount: z.number(),
});

export type Comment = z.infer<typeof CommentSchema>;

/**
 * User Schema
 */
export const UserSchema = z.object({
  username: z.string(),
  displayName: z.string(),
  avatar: z.string(),
  bio: z.string(),
  location: z.string(),
  website: z.string(),
  github: z.string(),
  joinedAt: z.string(),
  topicCount: z.number(),
  commentCount: z.number(),
  followerCount: z.number(),
  followingCount: z.number(),
  favoriteCount: z.number(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Node Schema
 */
export const NodeSchema = z.object({
  name: z.string(),
  title: z.string(),
  icon: z.string(),
  description: z.string(),
  topicCount: z.number(),
  category: z.string(),
  header: z.string(),
});

export type Node = z.infer<typeof NodeSchema>;

/**
 * API Response Schemas
 */
export const TopicListResponseSchema = z.array(TopicSchema);
export const CommentListResponseSchema = z.array(CommentSchema);
export const NodeListResponseSchema = z.array(NodeSchema);
