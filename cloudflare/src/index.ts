export interface Env {
  V2EX_PUSH_KV: KVNamespace;
  FIREBASE_SERVICE_ACCOUNT_JSON: string;
  ADMIN_SECRET: string;
}

export const PUSHED_IDS_LIMIT = 200;
export const MAX_PUSH_PER_USER_PER_RUN = 5;
export const HOT_TOPIC_REPLIES_THRESHOLD = 100;

function extractTopicIdFromLink(link?: string): string | null {
  if (!link) return null;
  const match = link.match(/\/t\/(\d+)/);
  return match?.[1] ?? null;
}

function buildNotificationTitleBody(item: V2exNotification): {
  title: string;
  body: string;
} {
  const author = (item.authorName || "").trim();
  const content = (item.content || "").trim();
  const topicTitle = (item.title || "").trim();

  const title = author ? `@${author} 回复了你` : "你有新回复";
  const rawBody = content || topicTitle || "点击查看详情";
  const body = rawBody.length > 120 ? `${rawBody.slice(0, 120)}...` : rawBody;
  return { title, body };
}

function buildHotTopicTitleBody(topic: any): {
  title: string;
  body: string;
} {
  const nodeTitle = (topic?.node?.title || topic?.node?.name || "").trim();
  const titlePrefix = nodeTitle ? `[${nodeTitle}] ` : "";
  const rawTitle = (topic?.title || "有新热门话题").trim();
  const title = `🔥 ${titlePrefix}${rawTitle}`;

  const rawBody = (topic?.content || "点击查看详情").trim();
  const body = rawBody.length > 120 ? `${rawBody.slice(0, 120)}...` : rawBody;

  return { title, body };
}

async function getPushedIds(
  kv: KVNamespace,
  fcmToken: string,
): Promise<Set<string>> {
  const raw = await kv.get(`pushed:${fcmToken}`);
  if (!raw) return new Set();
  try {
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

async function setPushedIds(
  kv: KVNamespace,
  fcmToken: string,
  ids: Set<string>,
): Promise<void> {
  const arr = Array.from(ids);
  const capped =
    arr.length > PUSHED_IDS_LIMIT
      ? arr.slice(arr.length - PUSHED_IDS_LIMIT)
      : arr;
  await kv.put(`pushed:${fcmToken}`, JSON.stringify(capped));
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/register") {
      return handleRegister(request, env);
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response("OK");
    }

    if (url.pathname.startsWith("/admin")) {
      return handleAdmin(request, env);
    }

    return new Response("Not Found", { status: 404 });
  },

  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(handleScheduled(event, env));
  },
};

async function handleAdmin(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== env.ADMIN_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (url.pathname === "/admin/api/stats") {
    const keys = await getAllUserKeys(env);

    const historyStr = await env.V2EX_PUSH_KV.get("history:recent");
    const history = historyStr ? JSON.parse(historyStr) : [];

    return new Response(
      JSON.stringify({
        userCount: keys.length,
        users: keys,
        history: history,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>V2EX Push Admin</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { border-bottom: 1px solid #eee; padding-bottom: 10px; }
            .card { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .stat { font-size: 24px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
            .log-time { color: #666; font-size: 0.9em; }
        </style>
    </head>
    <body>
        <h1>V2EX Push Service Admin</h1>

        <div class="card">
            <h3>Registered Devices</h3>
            <div id="userCount" class="stat">Loading...</div>
        </div>

        <div class="card">
            <h3>Recent Push History</h3>
            <table id="historyTable">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Title</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colspan="4">Loading...</td></tr>
                </tbody>
            </table>
        </div>

        <script>
            const secret = new URLSearchParams(window.location.search).get("secret");

            async function loadData() {
                try {
                    const res = await fetch(\`/admin/api/stats?secret=\${secret}\`);
                    if (!res.ok) throw new Error("Failed to load");
                    const data = await res.json();

                    document.getElementById("userCount").innerText = data.userCount;

                    const tbody = document.querySelector("#historyTable tbody");
                    tbody.innerHTML = "";

                    data.history.reverse().forEach(item => {
                        const tr = document.createElement("tr");
                        tr.innerHTML = \`
                            <td class="log-time">\${new Date(item.timestamp).toLocaleString()}</td>
                            <td>\${item.type}</td>
                            <td>\${item.title || '-'}</td>
                            <td>\${item.details || '-'}</td>
                        \`;
                        tbody.appendChild(tr);
                    });
                } catch (e) {
                    alert("Error loading data: " + e.message);
                }
            }

            loadData();
        </script>
    </body>
    </html>
    `;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}

async function handleRegister(request: Request, env: Env): Promise<Response> {
  try {
    const data: any = await request.json();
    const { feedUrl, fcmToken, deviceType } = data;

    if (!feedUrl || !fcmToken) {
      return new Response("Missing feedUrl or fcmToken", { status: 400 });
    }

    if (!feedUrl.includes("v2ex.com/")) {
      return new Response("Invalid feedUrl: must be a v2ex.com URL", {
        status: 400,
      });
    }

    // Preserve existing lastPushed if the user is already registered, so
    // re-registration (e.g. token refresh, app reinstall) does not reset the
    // dedup cursor and cause a flood of catch-up notifications.
    let lastPushed = Date.now();
    const existingStr = await env.V2EX_PUSH_KV.get(`user:${fcmToken}`);
    if (existingStr) {
      try {
        const existing = JSON.parse(existingStr);
        if (typeof existing.lastPushed === "number") {
          lastPushed = existing.lastPushed;
        }
      } catch {
        // ignore parse errors, fall back to Date.now()
      }
    }

    const payload = {
      feedUrl,
      fcmToken,
      deviceType,
      updatedAt: Date.now(),
      lastPushed,
    };

    await env.V2EX_PUSH_KV.put(`user:${fcmToken}`, JSON.stringify(payload));

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response("Error processing request", { status: 500 });
  }
}

import { fetchAndParseFeed, V2exNotification } from "./utils/v2ex";
import { sendPushNotification } from "./utils/fcm";

async function handleScheduled(event: ScheduledEvent, env: Env) {
  console.log("Scheduled event triggered at", event.scheduledTime);

  const historyStr = await env.V2EX_PUSH_KV.get("history:recent");
  let history: any[] = historyStr ? JSON.parse(historyStr) : [];

  const keys = await getAllUserKeys(env);
  console.log(`Found ${keys.length} registered users to check.`);

  let pushedCount = 0;

  await Promise.allSettled(
    keys.map(async (key) => {
      const userDataStr = await env.V2EX_PUSH_KV.get(key.name);
      if (!userDataStr) return;

      const userData = JSON.parse(userDataStr);

      const result = await processUserNotifications(
        env,
        key.name,
        userData,
        history,
        sendPushNotification,
        fetchAndParseFeed,
      );
      pushedCount += result.pushedCount;
    }),
  );

  await checkHotTopics(env, history);

  if (history.length > 100) history = history.slice(history.length - 100);
  await env.V2EX_PUSH_KV.put("history:recent", JSON.stringify(history));

  console.log(`Pushed ${pushedCount} notifications total.`);
}

export async function processUserNotifications(
  env: Env,
  keyName: string,
  userData: any,
  history: any[],
  sendPush: typeof sendPushNotification,
  fetchFeed: typeof fetchAndParseFeed,
): Promise<{ pushedCount: number }> {
  const { feedUrl, fcmToken, lastPushed = 0 } = userData;
  if (!feedUrl || !fcmToken) return { pushedCount: 0 };

  const notifications = await fetchFeed(feedUrl);

  const pushedIds = await getPushedIds(env.V2EX_PUSH_KV, fcmToken);

  const newItems = notifications.filter(
    (n) => n.published > lastPushed && !pushedIds.has(n.id),
  );

  if (newItems.length === 0) return { pushedCount: 0 };

  console.log(`User ${keyName} has ${newItems.length} new notifications.`);

  const itemsToPush = newItems.slice(-MAX_PUSH_PER_USER_PER_RUN);
  const hasDeferred = newItems.length > itemsToPush.length;
  if (hasDeferred) {
    console.log(
      `User ${keyName} has ${newItems.length - itemsToPush.length} backlog items, deferring to next run.`,
    );
  }

  let pushedCount = 0;
  let anyFailure = false;
  let maxSuccessTimestamp = lastPushed;

  for (const item of itemsToPush) {
    const { title, body } = buildNotificationTitleBody(item);
    const topicId = extractTopicIdFromLink(item.link);
    const data: Record<string, string> = {
      link: item.link || "",
      notificationId: item.id || "",
    };
    if (topicId) {
      data.topicId = topicId;
    }

    const success = await sendPush(
      fcmToken,
      title,
      body,
      data,
      env.FIREBASE_SERVICE_ACCOUNT_JSON,
      env.V2EX_PUSH_KV,
    );

    if (!success) {
      anyFailure = true;
      console.warn(
        `Push failed for user ${keyName} notification ${item.id}, will retry next run.`,
      );
      continue;
    }

    pushedCount++;
    pushedIds.add(item.id);
    if (item.published > maxSuccessTimestamp) {
      maxSuccessTimestamp = item.published;
    }

    await setPushedIds(env.V2EX_PUSH_KV, fcmToken, pushedIds);

    history.push({
      timestamp: Date.now(),
      type: "User",
      title: item.title,
      details: `To: ...${fcmToken.substring(0, 6)}`,
    });
  }

  // Advance lastPushed only on a clean run (no failures, no deferred items).
  // On failure/deferral, keep the old cursor so the missed items get retried;
  // pushedIds prevents already-pushed items from being re-sent.
  const shouldAdvance =
    !anyFailure && !hasDeferred && maxSuccessTimestamp > lastPushed;
  const updatedUserData = {
    ...userData,
    lastPushed: shouldAdvance ? maxSuccessTimestamp : lastPushed,
    updatedAt: Date.now(),
  };
  await env.V2EX_PUSH_KV.put(keyName, JSON.stringify(updatedUserData));

  return { pushedCount };
}

async function checkHotTopics(env: Env, history: any[]) {
  try {
    const response = await fetch("https://www.v2ex.com/api/topics/hot.json", {
      headers: { "User-Agent": "V2ex.Maui/1.0 PushService" },
    });
    if (!response.ok) return;

    const topics: any[] = await response.json();
    const hotTopics = topics.filter(
      (t: any) => t.replies > HOT_TOPIC_REPLIES_THRESHOLD,
    );

    const processedStr = await env.V2EX_PUSH_KV.get(
      "global:processed_hot_topics",
    );
    const processedIds: number[] = processedStr ? JSON.parse(processedStr) : [];

    const processedSet = new Set(processedIds);
    const newHotTopics = hotTopics.filter(
      (t: any) => !processedSet.has(t.id),
    );

    if (newHotTopics.length === 0) return;

    const keys = await getAllUserKeys(env);

    for (const topic of newHotTopics) {
      let successCount = 0;
      await Promise.allSettled(
        keys.map(async (key) => {
          const userDataStr = await env.V2EX_PUSH_KV.get(key.name);
          if (!userDataStr) return;
          const userData = JSON.parse(userDataStr);
          const { fcmToken } = userData;

          if (fcmToken) {
            const { title, body } = buildHotTopicTitleBody(topic);
            const success = await sendPushNotification(
              fcmToken,
              title,
              body,
              {
                link: topic.url,
                topicId: String(topic.id),
              },
              env.FIREBASE_SERVICE_ACCOUNT_JSON,
              env.V2EX_PUSH_KV,
            );
            if (success) successCount++;
          }
        }),
      );

      history.push({
        timestamp: Date.now(),
        type: "HotTopic",
        title: topic.title,
        details: `Sent to ${successCount} users`,
      });

      processedIds.push(topic.id);
      if (processedIds.length > PUSHED_IDS_LIMIT) {
        processedIds.splice(0, processedIds.length - PUSHED_IDS_LIMIT);
      }
      await env.V2EX_PUSH_KV.put(
        "global:processed_hot_topics",
        JSON.stringify(processedIds),
      );
    }
  } catch (e) {
    console.error("Error checking hot topics", e);
  }
}

async function getAllUserKeys(env: Env): Promise<any[]> {
  let keys: any[] = [];
  let cursor: string | undefined = undefined;
  do {
    const list: { keys: any[]; list_complete: boolean; cursor?: string } =
      await env.V2EX_PUSH_KV.list({ prefix: "user:", cursor });
    keys = keys.concat(list.keys);
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  return keys;
}
