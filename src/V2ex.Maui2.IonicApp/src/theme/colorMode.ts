export type ColorMode = "light" | "dark" | "system";

const STORAGE_KEY = "v2ex.colorMode";

// Keep track of the media query listener so we can remove it
let systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null;
let mediaQuery: MediaQueryList | null = null;

export function getSystemPreferredMode(): "light" | "dark" {
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
    if (v === "dark" || v === "light" || v === "system") return v;
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

function notifyHostTheme(mode: "light" | "dark"): void {
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

function applyEffectiveTheme(effectiveMode: "light" | "dark"): void {
  const isDark = effectiveMode === "dark";

  // Prefer palette-based toggle (this matches what ends up in our bundled CSS).
  document.documentElement.classList.toggle("ion-palette-dark", isDark);

  // Keep compatibility with classic dark mode selector.
  document.body.classList.toggle("dark", isDark);

  // Hint the UA for form controls/scrollbars.
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  
  notifyHostTheme(effectiveMode);
}

export function applyColorMode(mode: ColorMode): void {
  // Remove existing system theme listener if any
  if (systemThemeListener && mediaQuery) {
    mediaQuery.removeEventListener("change", systemThemeListener);
    systemThemeListener = null;
    mediaQuery = null;
  }

  if (mode === "system") {
    // Apply based on system preference
    const systemMode = getSystemPreferredMode();
    applyEffectiveTheme(systemMode);

    // Listen for system theme changes
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      systemThemeListener = (e: MediaQueryListEvent) => {
        applyEffectiveTheme(e.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", systemThemeListener);
    }
  } else {
    applyEffectiveTheme(mode);
  }
}

export function getEffectiveMode(mode: ColorMode): "light" | "dark" {
  return mode === "system" ? getSystemPreferredMode() : mode;
}

export function initColorMode(): ColorMode {
  const mode = getStoredMode() ?? "system";
  applyColorMode(mode);
  return mode;
}

