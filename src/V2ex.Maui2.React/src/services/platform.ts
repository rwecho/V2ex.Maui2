/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 平台检测工具
 * 结合 JS UserAgent 和 C# DeviceInfo 双重检测
 */

export type Platform = "web" | "windows" | "ios" | "android" | "unknown";

interface PlatformInfo {
  platform: Platform;
  isMaui: boolean;
}

/**
 * 方法一：前端流派 - 通过 UserAgent 快速判断
 */
function detectPlatformFromUserAgent(): Platform {
  if (typeof navigator === "undefined" || !navigator.userAgent) {
    return "unknown";
  }

  const userAgent =
    navigator.userAgent || navigator.vendor || (window as any).opera;

  // iOS 检测 (iPhone, iPad, iPod)
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return "ios";
  }

  // Android 检测
  if (/android/i.test(userAgent)) {
    return "android";
  }

  // windows 检测
  if (/Win/.test(userAgent)) {
    return "windows";
  }

  return "unknown";
}

/**
 * 快速同步检测（用于首屏渲染）
 */
export function getPlatformInfoSync(): PlatformInfo {
  const platform = detectPlatformFromUserAgent();

  return {
    platform,
    isMaui:
      platform === "ios" || platform === "android" || platform === "windows",
  };
}
