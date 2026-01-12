/**
 * 平台检测工具
 * 结合 JS UserAgent 和 C# DeviceInfo 双重检测
 */

import React from "react";

export type Platform = "web" | "ios" | "android" | "unknown";

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
  return "unknown";
}

/**
 * 快速同步检测（用于首屏渲染）
 */
export function getPlatformInfoSync(): PlatformInfo {
  const platform = detectPlatformFromUserAgent();

  return {
    platform,
    isMaui: platform === "ios" || platform === "android",
  };
}

/**
 * 方法二：原生流派 - 通过 C# DeviceInfo 准确判断（异步）
 */
export async function getPlatformInfoFromNative(): Promise<PlatformInfo> {
  // 如果不在 MAUI 环境，直接返回 JS 检测结果
  if (!getPlatformInfoSync().isMaui) {
    return getPlatformInfoSync();
  }

  try {
    // 定义一个 Promise 来等待 C# 回调
    return new Promise<PlatformInfo>((resolve) => {
      // 设置全局回调函数，供 C# 调用
      (window as any).receivePlatformInfo = (platform: string) => {
        console.log("[Platform] C# 报告当前平台:", platform);

        // 清理全局函数
        delete (window as any).receivePlatformInfo;

        // 映射 C# 返回的平台字符串
        const platformMap: Record<string, Platform> = {
          iOS: "ios",
          Android: "android",
          Mac: "ios", // MacCatalyst 归类为 iOS
          Windows: "unknown",
          Unknown: "unknown",
        };

        resolve({
          platform: platformMap[platform] || "unknown",
          isMaui: true,
        });
      };

      // 设置超时保护（3秒后如果 C# 没响应，使用 JS 检测结果）
      const timeoutId = setTimeout(() => {
        console.warn("[Platform] C# 检测超时，使用 JS 检测结果");
        delete (window as any).receivePlatformInfo;
        resolve(getPlatformInfoSync());
      }, 3000);

      // 调用 C# 方法
      (window as any).HybridWebView.InvokeDotNet("GetPlatformInfo", []);

      // 如果 C# 成功响应，清除超时
      // 注意：这里不能直接 clearTimeout，因为 resolve 是在回调里调用的
      // 我们需要在 resolve 之前清除 timeout
      const originalResolve = resolve;
      resolve = ((value: PlatformInfo) => {
        clearTimeout(timeoutId);
        originalResolve(value);
      }) as typeof resolve;
    });
  } catch (error) {
    console.error("[Platform] C# 检测失败:", error);
    return getPlatformInfoSync();
  }
}

/**
 * 获取平台信息（结合同步和异步检测）
 *
 * 使用示例：
 * ```typescript
 * // 方式1：快速同步获取（适合首屏渲染）
 * const info = getPlatformInfoSync();
 * if (info.isMaui) { ... }
 *
 * // 方式2：准确异步获取（适合需要精确判断的场景）
 * const info = await getPlatformInfo();
 * if (info.platform === 'ios') { ... }
 * ```
 */
export async function getPlatformInfo(): Promise<PlatformInfo> {
  // 先用同步检测快速显示
  const syncInfo = getPlatformInfoSync();

  // 如果不在 MAUI 环境，直接返回
  if (!syncInfo.isMaui) {
    return syncInfo;
  }

  // 在 MAUI 环境，用 C# 检测结果校准
  try {
    const nativeInfo = await getPlatformInfoFromNative();
    return nativeInfo;
  } catch (error) {
    console.error("[Platform] 获取原生平台信息失败，使用同步检测:", error);
    return syncInfo;
  }
}

/**
 * React Hook - 使用平台信息
 */
export function usePlatform() {
  const [platformInfo, setPlatformInfo] = React.useState<PlatformInfo>(
    getPlatformInfoSync()
  );

  React.useEffect(() => {
    // 组件挂载后，用 C# 检测结果校准
    if (platformInfo.isMaui) {
      getPlatformInfo().then((accurateInfo) => {
        // 只有当检测结果不同时才更新（避免不必要的重渲染）
        if (accurateInfo.platform !== platformInfo.platform) {
          console.log("[Platform] 校准平台信息:", {
            from: platformInfo,
            to: accurateInfo,
          });
          setPlatformInfo(accurateInfo);
        }
      });
    }
  }, [platformInfo.isMaui]);

  return platformInfo;
}
