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

export const getMemberAvatarUrl = (topic: TopicType): string | null => {
  const m: any = topic.member as any;
  const raw =
    topic.member?.avatarMini ??
    m?.avatar_mini ??
    m?.avatarMini ??
    m?.avatar_normal ??
    m?.avatarNormal ??
    topic.member?.avatarLarge ??
    m?.avatar_large ??
    m?.avatarLarge ??
    null;
  return normalizeAvatarUrl(raw);
};
