export type ColorMode = "light" | "dark";

const STORAGE_KEY = "v2ex.colorMode";

export function getSystemPreferredMode(): ColorMode {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getStoredMode(): ColorMode | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "dark" || v === "light") return v;
    return null;
  } catch {
    return null;
  }
}

export function setStoredMode(mode: ColorMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

function notifyHostTheme(mode: ColorMode): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hwv = (window as any).HybridWebView;
    if (hwv && typeof hwv.SendRawMessage === "function") {
      hwv.SendRawMessage(JSON.stringify({ type: "theme", mode }));
    }
  } catch {
    // ignore
  }
}

export function applyColorMode(mode: ColorMode): void {
  // Ionic's dark palette can be applied via a class on the root element.
  // Depending on Ionic version/build, the selector may be:
  // - body.dark (classic dark.class.css)
  // - .ion-palette-dark (newer palette-based builds)
  const isDark = mode === "dark";

  // Prefer palette-based toggle (this matches what ends up in our bundled CSS).
  document.documentElement.classList.toggle("ion-palette-dark", isDark);

  // Keep compatibility with classic dark mode selector.
  document.body.classList.toggle("dark", isDark);

  // Hint the UA for form controls/scrollbars.
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  notifyHostTheme(mode);
}

export function initColorMode(): ColorMode {
  const mode = getStoredMode() ?? getSystemPreferredMode();
  applyColorMode(mode);
  return mode;
}
