import type { History } from "history";

type PushNavigatePayload = {
  type?: string;
  topicId?: string;
  link?: string;
};

export function extractTopicIdFromPush(payload: PushNavigatePayload): string {
  const topicIdFromPayload = String(payload.topicId ?? "").trim();
  const link = String(payload.link ?? "");
  const topicIdFromLink = link.match(/\/t\/(\d+)/)?.[1] ?? "";
  return topicIdFromPayload || topicIdFromLink;
}

export function handlePushNavigationPayload(
  payload: PushNavigatePayload,
  history: History,
): boolean {
  if (payload.type !== "pushNavigate") {
    return false;
  }

  const topicId = extractTopicIdFromPush(payload);
  if (!topicId) {
    return false;
  }

  history.push(`/topic/${topicId}`);
  return true;
}

export function dispatchPushNavigationMessage(
  event: Event,
  history: History,
): void {
  const customEvent = event as CustomEvent;
  const raw = customEvent?.detail?.message;
  if (!raw) {
    return;
  }

  const payload = typeof raw === "string" ? JSON.parse(raw) : raw;
  handlePushNavigationPayload(payload, history);
}
