import { XMLParser } from "fast-xml-parser";

function stripHtml(input: string): string {
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPayloadText(content: string): string {
  if (!content) return "";

  // V2EX 通知里常见 payload 容器
  const payloadMatch = content.match(
    /<div[^>]*class=["'][^"']*payload[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  );
  const payload = payloadMatch?.[1] ?? content;
  return stripHtml(payload);
}

interface FeedEntry {
  id: string;
  title: string;
  link: string; // href
  published: string;
  content: string;
  author: { name: string };
}

export interface V2exNotification {
  id: string;
  title: string;
  link: string;
  published: number; // timestamp
  content: string;
  authorName: string;
}

export async function fetchAndParseFeed(
  feedUrl: string,
): Promise<V2exNotification[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "V2ex.Maui/1.0 PushService",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch feed: ${response.status}`);
      return [];
    }

    const xmlData = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const result = parser.parse(xmlData);

    // Atom feed structure: feed -> entry[]
    const entries = result.feed?.entry;

    if (!entries) return [];

    const list = Array.isArray(entries) ? entries : [entries];

    return list.map((entry: any) => {
      // entry.link is usually object with @_href
      const href = entry.link?.["@_href"] || "";
      const published = new Date(entry.published).getTime();
      const rawContent = entry.content?.["#text"] || entry.content || "";
      const previewContent = extractPayloadText(String(rawContent));

      return {
        id: entry.id,
        title: entry.title,
        link: href,
        published,
        content: previewContent,
        authorName: entry.author?.name || "",
      };
    });
  } catch (e) {
    console.error("Error parsing feed", e);
    return [];
  }
}
