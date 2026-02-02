import { FontSize } from "../store/fontSizeStore";

export function applyFontSize(size: FontSize): void {
  const root = document.documentElement;
  root.classList.remove("font-small", "font-medium", "font-large");
  root.classList.add(`font-${size}`);
}

export function initFontSize(size: FontSize): void {
  applyFontSize(size);
}
