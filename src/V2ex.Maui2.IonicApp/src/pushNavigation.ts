import type { History } from "history";

type PushNavigatePayload = {
  type?: string;
  topicId?: string;
  link?: string;
};

declare global {
  interface Window {
    checkWebViewHealth?: () => string;
  }
}

let pendingPushNavigation: PushNavigatePayload | null = null;

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

export function queuePushNavigationPayload(payload: PushNavigatePayload): boolean {
  if (payload.type !== "pushNavigate") {
    return false;
  }

  const topicId = extractTopicIdFromPush(payload);
  if (!topicId) {
    return false;
  }

  pendingPushNavigation = {
    type: "pushNavigate",
    topicId,
    link: String(payload.link ?? ""),
  };
  return true;
}

export function queuePushNavigationMessage(event: Event): boolean {
  const customEvent = event as CustomEvent;
  const raw = customEvent?.detail?.message;
  if (!raw) {
    return false;
  }

  const payload = typeof raw === "string" ? JSON.parse(raw) : raw;
  return queuePushNavigationPayload(payload);
}

export function consumePendingPushNavigation(history: History): boolean {
  if (!pendingPushNavigation) {
    return false;
  }

  const payload = pendingPushNavigation;
  pendingPushNavigation = null;
  return handlePushNavigationPayload(payload, history);
}

export function primeWebViewHealthCheck(): void {
  window.checkWebViewHealth = () => "HEALTHY";
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
  if (handlePushNavigationPayload(payload, history)) {
    pendingPushNavigation = null;
  }
}
