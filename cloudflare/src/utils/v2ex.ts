import { XMLParser } from "fast-xml-parser";

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

export async function fetchAndParseFeed(feedUrl: string): Promise<V2exNotification[]> {
    try {
        const response = await fetch(feedUrl, {
            headers: {
                "User-Agent": "V2ex.Maui/1.0 PushService"
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch feed: ${response.status}`);
            return [];
        }

        const xmlData = await response.text();
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
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
            
            return {
                id: entry.id,
                title: entry.title,
                link: href,
                published,
                content: entry.content?.["#text"] || entry.content || "",
                authorName: entry.author?.name || ""
            };
        });

    } catch (e) {
        console.error("Error parsing feed", e);
        return [];
    }
}
