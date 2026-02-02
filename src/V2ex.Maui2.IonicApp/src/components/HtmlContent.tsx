import React, { useEffect, useRef } from "react";
import { IonIcon, IonToast } from "@ionic/react";
import { copyOutline } from "ionicons/icons";
import { apiService } from "../services/apiService";

interface HtmlContentProps {
  html: string;
  className?: string;
  style?: React.CSSProperties;
}

export const HtmlContent: React.FC<HtmlContentProps> = ({
  html,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Define regex locally to avoid global state issues
    const BASE64_REGEX = /([A-Za-z0-9+/]{10,}(?:={0,2}))/g;

    const walker = document.createTreeWalker(
      containerRef.current,
      NodeFilter.SHOW_TEXT,
    );

    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    textNodes.forEach((textNode) => {
      const parent = textNode.parentNode;
      if (!parent) return;

      // Avoid double processing: check if parent is already a wrapper
      if (
        parent.nodeName === "SPAN" &&
        ((parent as HTMLElement).classList.contains("base64-wrapper") || 
         (parent as HTMLElement).classList.contains("base64-decoded"))
      ) {
        return;
      }

      const text = textNode.nodeValue;
      if (!text) return;

      // Quick check before regex
      if (!text.match(BASE64_REGEX)) return;

      const fragments = document.createDocumentFragment();
      let lastIndex = 0;
      let match;

      // Reset regex lastIndex just in case
      BASE64_REGEX.lastIndex = 0;

      while ((match = BASE64_REGEX.exec(text)) !== null) {
        const [fullMatch] = match;
        const index = match.index;

        // Check if it's likely valid base64
        if (!isValidBase64(fullMatch)) {
          continue;
        }

        // Add preceding text
        if (index > lastIndex) {
          fragments.appendChild(
            document.createTextNode(text.substring(lastIndex, index)),
          );
        }

        // Add Base64 wrapper
        const wrapper = document.createElement("span");
        wrapper.className = "base64-wrapper"; // Class used for detection
        wrapper.textContent = fullMatch;

        const btn = document.createElement("span");
        btn.className = "base64-decode-btn";
        btn.textContent = " 解码";
        btn.onclick = async (e) => {
            e.stopPropagation();
            try {
              let decoded = atob(fullMatch);
              try {
                  decoded = decodeURIComponent(escape(decoded));
              } catch {
                  // Ignore
              }
              
              await navigator.clipboard.writeText(decoded);
              apiService.showToast(`已解码并复制`);
              
              // Update UI
              wrapper.innerHTML = "";
              wrapper.classList.add("base64-decoded"); // Mark as decoded
              
              if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
                  const link = document.createElement("a");
                  link.href = decoded;
                  link.textContent = decoded;
                  link.style.color = "var(--ion-color-primary)";
                  link.onclick = (ev) => {
                      ev.preventDefault();
                      ev.stopPropagation();
                      apiService.openExternalLink(decoded);
                  };
                  wrapper.appendChild(link);
              } else {
                  wrapper.textContent = decoded;
                  wrapper.style.color = "var(--ion-color-success)";
              }
              
            } catch (e) {
                console.error(e);
                apiService.showToast("解码失败");
            }
        };

        wrapper.appendChild(btn);
        fragments.appendChild(wrapper);

        lastIndex = index + fullMatch.length;
      }

      if (lastIndex < text.length) {
        fragments.appendChild(
          document.createTextNode(text.substring(lastIndex)),
        );
      }

      if (fragments.childNodes.length > 0) {
        parent.replaceChild(fragments, textNode);
      }
    });

  }, [html]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

function isValidBase64(str: string): boolean {
  try {
    const decoded = atob(str);
    // Check if decoded string has mostly printable characters
    // This is a heuristic to avoid flagging random alphanumeric strings
    let printable = 0;
    for (let i = 0; i < decoded.length; i++) {
        const code = decoded.charCodeAt(i);
        if (code >= 32 && code <= 126) printable++;
        // Allow some common chinese/unicode logic if needed, but for now simple ascii check for URLs
        // V2EX usage is mostly URLs or WeChat IDs
    }
    return printable / decoded.length > 0.8; 
  } catch (e) {
    return false;
  }
}
