export interface Env {
  V2EX_PUSH_KV: KVNamespace;
  FIREBASE_SERVICE_ACCOUNT_JSON: string;
  ADMIN_SECRET: string;
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

    // Admin Routes
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

// ... handleRegister implementation ...

async function handleAdmin(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== env.ADMIN_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (url.pathname === "/admin/api/stats") {
    const keys = await getAllUserKeys(env);

    // Get history
    const historyStr = await env.V2EX_PUSH_KV.get("history:recent");
    const history = historyStr ? JSON.parse(historyStr) : [];

    return new Response(
      JSON.stringify({
        userCount: keys.length,
        users: keys, // Be careful if too many users, might want to just count
        history: history,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Serve HTML Dashboard
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
  // ... existing handleRegister code ...
  try {
    const data: any = await request.json();
    const { feedUrl, fcmToken, deviceType } = data;

    if (!feedUrl || !fcmToken) {
      return new Response("Missing feedUrl or fcmToken", { status: 400 });
    }

    // Simple validation of feedUrl (must be v2ex)
    if (!feedUrl.includes("v2ex.com/")) {
      return new Response("Invalid feedUrl: must be a v2ex.com URL", {
        status: 400,
      });
    }

    // Store in KV
    const payload = {
      feedUrl,
      fcmToken,
      deviceType,
      updatedAt: Date.now(),
      lastPushed: Date.now(), // Init with now to avoid pushing old items
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

  // Load history
  const historyStr = await env.V2EX_PUSH_KV.get("history:recent");
  let history: any[] = historyStr ? JSON.parse(historyStr) : [];

  const keys = await getAllUserKeys(env);
  console.log(`Found ${keys.length} registered users to check.`);

  let pushedCount = 0;

  const results = await Promise.allSettled(
    keys.map(async (key) => {
      const userDataStr = await env.V2EX_PUSH_KV.get(key.name);
      if (!userDataStr) return;

      const userData = JSON.parse(userDataStr);
      const { feedUrl, fcmToken, lastPushed = 0 } = userData;

      if (!feedUrl || !fcmToken) return;

      // Fetch Feed
      const notifications = await fetchAndParseFeed(feedUrl);

      // Filter new
      const newItems = notifications.filter((n) => n.published > lastPushed);

      if (newItems.length === 0) {
        return; // Nothing new
      }

      console.log(`User ${key.name} has ${newItems.length} new notifications.`);

      const maxTimestamp = Math.max(...newItems.map((n) => n.published));

      for (const item of newItems) {
        const success = await sendPushNotification(
          fcmToken,
          item.title,
          newItems.length > 1
            ? item.content.substring(0, 100) + "..."
            : item.content,
          {
            link: item.link,
            notificationId: item.id,
          },
          env.FIREBASE_SERVICE_ACCOUNT_JSON,
          env.V2EX_PUSH_KV,
        );

        if (success) {
          pushedCount++;
          // Log to history
          history.push({
            timestamp: Date.now(),
            type: "User",
            title: item.title,
            details: `To: ...${fcmToken.substring(0, 6)}`,
          });
        }
      }

      // Update KV
      userData.lastPushed = maxTimestamp;
      userData.updatedAt = Date.now();
      await env.V2EX_PUSH_KV.put(key.name, JSON.stringify(userData));
    }),
  );

  await checkHotTopics(env, history);

  // Trim history and save
  if (history.length > 100) history = history.slice(history.length - 100);
  await env.V2EX_PUSH_KV.put("history:recent", JSON.stringify(history));
}

async function checkHotTopics(env: Env, history: any[]) {
  try {
    // 1. Fetch Hot Topics
    const response = await fetch("https://www.v2ex.com/api/topics/hot.json", {
      headers: { "User-Agent": "V2ex.Maui/1.0 PushService" },
    });
    if (!response.ok) return;

    const topics: any[] = await response.json();
    const hotTopics = topics.filter((t: any) => t.replies > 100);

    const processedStr = await env.V2EX_PUSH_KV.get(
      "global:processed_hot_topics",
    );
    const processedIds: number[] = processedStr ? JSON.parse(processedStr) : [];

    const newHotTopics = hotTopics.filter(
      (t: any) => !processedIds.includes(t.id),
    );

    if (newHotTopics.length === 0) return;

    const keys = await getAllUserKeys(env);

    for (const topic of newHotTopics) {
      let successCount = 0;
      // Broadcast loop
      await Promise.allSettled(
        keys.map(async (key) => {
          const userDataStr = await env.V2EX_PUSH_KV.get(key.name);
          if (!userDataStr) return;
          const userData = JSON.parse(userDataStr);
          const { fcmToken } = userData;

          if (fcmToken) {
            const success = await sendPushNotification(
              fcmToken,
              "🔥 Hot: " + topic.title,
              `Replies: ${topic.replies}`,
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
    }

    if (processedIds.length > 200) {
      processedIds.splice(0, processedIds.length - 200);
    }
    await env.V2EX_PUSH_KV.put(
      "global:processed_hot_topics",
      JSON.stringify(processedIds),
    );
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
