import { useHistory } from "react-router-dom";
import { useEffect } from "react";

export interface LinkHandlerOptions {
  onExternalLink?: (url: string) => void;
  onInternalLink?: (path: string) => void;
}

export const useLinkInterceptor = (options: LinkHandlerOptions = {}) => {
  const history = useHistory();

  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest("a");

      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      event.preventDefault();
      event.stopPropagation();

      const isInternalLink = isV2exInternalLink(href);

      if (isInternalLink) {
        const path = extractInternalPath(href);
        options.onInternalLink?.(path);
        history.push(path);
      } else {
        options.onExternalLink?.(href);
      }
    };

    document.addEventListener("click", handleLinkClick, true);

    return () => {
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [history, options]);
};

export const isV2exInternalLink = (href: string): boolean => {
  const normalized = href.trim();

  if (normalized.startsWith("/t/")) return true;
  if (normalized.startsWith("/go/")) return true;
  if (normalized.startsWith("/member/")) return true;
  if (normalized.startsWith("/node/")) return true;
  if (normalized.startsWith("/new")) return true;
  if (normalized.startsWith("/my")) return true;

  if (normalized.startsWith("https://www.v2ex.com/t/")) return true;
  if (normalized.startsWith("https://www.v2ex.com/go/")) return true;
  if (normalized.startsWith("https://www.v2ex.com/member/")) return true;
  if (normalized.startsWith("https://www.v2ex.com/node/")) return true;
  if (normalized.startsWith("https://www.v2ex.com/new")) return true;
  if (normalized.startsWith("https://www.v2ex.com/my")) return true;

  return false;
};

export const extractInternalPath = (href: string): string => {
  const normalized = href.trim();

  if (normalized.startsWith("/")) {
    return normalized;
  }

  try {
    const url = new URL(normalized);
    return url.pathname + url.search + url.hash;
  } catch {
    return href;
  }
};

export const extractTopicId = (href: string): string | null => {
  const match = href.match(/\/t\/(\d+)/);
  return match ? match[1] : null;
};

export const extractNodeName = (href: string): string | null => {
  const match = href.match(/\/go\/([a-z0-9_-]+)/i);
  return match ? match[1] : null;
};

export const extractUsername = (href: string): string | null => {
  const match = href.match(/\/member\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};
