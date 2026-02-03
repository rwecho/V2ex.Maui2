import { TopicType } from "../schemas/topicSchema";

export const normalizeAvatarUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("https:")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  // If backend returns a relative path, treat it as v2ex static.
  if (trimmed.startsWith("/")) return `https://www.v2ex.com${trimmed}`;
  return trimmed;
};

// Helper to get avatar from a member object (compatible with TopicType.member or NotificationType.member)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getMemberAvatar = (member: any): string | null => {
  if (!member) return null;
  const m = member;
  const raw =
    m.avatarMini ??
    m.avatar_mini ??
    m.avatarMini ??
    m.avatar_normal ??
    m.avatarNormal ??
    m.avatarLarge ??
    m.avatar_large ??
    m.avatarLarge ??
    null;
  return normalizeAvatarUrl(raw);
};

export const getMemberAvatarUrl = (topic: TopicType): string | null => {
  return getMemberAvatar(topic.member);
};
