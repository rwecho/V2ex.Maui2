import { createMemoryHistory } from "history";
import { describe, expect, it } from "vitest";
import {
  dispatchPushNavigationMessage,
  handlePushNavigationPayload,
} from "./pushNavigation";

describe("pushNavigation", () => {
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
});
