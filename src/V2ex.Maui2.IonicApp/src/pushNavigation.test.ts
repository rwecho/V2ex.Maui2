import { createMemoryHistory } from "history";
import { afterEach, describe, expect, it } from "vitest";
import {
  consumePendingPushNavigation,
  primeWebViewHealthCheck,
  queuePushNavigationMessage,
  dispatchPushNavigationMessage,
  handlePushNavigationPayload,
} from "./pushNavigation";

describe("pushNavigation", () => {
  afterEach(() => {
    delete (window as Window & { checkWebViewHealth?: () => string }).checkWebViewHealth;
  });

  it("routes to the topic page when a native push message contains topicId", () => {
    const history = createMemoryHistory();

    handlePushNavigationPayload(
      { type: "pushNavigate", topicId: "1185845", link: "" },
      history,
    );

    expect(history.location.pathname).toBe("/topic/1185845");
  });

  it("derives the topic id from a link when topicId is missing", () => {
    const history = createMemoryHistory();

    handlePushNavigationPayload(
      { type: "pushNavigate", link: "https://www.v2ex.com/t/42" },
      history,
    );

    expect(history.location.pathname).toBe("/topic/42");
  });

  it("dispatches a window event payload through the same routing path", () => {
    const history = createMemoryHistory();
    const event = new CustomEvent("HybridWebViewMessageReceived", {
      detail: { message: JSON.stringify({ type: "pushNavigate", topicId: "7" }) },
    });

    dispatchPushNavigationMessage(event, history);

    expect(history.location.pathname).toBe("/topic/7");
  });

  it("does not leave a stale pending push after a direct dispatch", () => {
    const history = createMemoryHistory();
    const event = new CustomEvent("HybridWebViewMessageReceived", {
      detail: { message: JSON.stringify({ type: "pushNavigate", topicId: "101" }) },
    });

    queuePushNavigationMessage(event);
    dispatchPushNavigationMessage(event, history);

    expect(history.location.pathname).toBe("/topic/101");
    expect(consumePendingPushNavigation(history)).toBe(false);
  });

  it("consumes a push message that arrived before the app listener was registered", () => {
    const history = createMemoryHistory();
    const earlyEvent = new CustomEvent("HybridWebViewMessageReceived", {
      detail: {
        message: JSON.stringify({ type: "pushNavigate", topicId: "99" }),
      },
    });

    queuePushNavigationMessage(earlyEvent);

    expect(consumePendingPushNavigation(history)).toBe(true);
    expect(history.location.pathname).toBe("/topic/99");
  });

  it("registers a global health probe for native resume checks", () => {
    primeWebViewHealthCheck();

    expect(window.checkWebViewHealth?.()).toBe("HEALTHY");
  });
});
