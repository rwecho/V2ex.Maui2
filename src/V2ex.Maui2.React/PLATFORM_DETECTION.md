# 平台检测使用示例

## 概述

本项目的平台检测采用**双重检测策略**：

1. **快速同步检测** - 基于 UserAgent，用于首屏渲染
2. **准确异步检测** - 基于 C# DeviceInfo，用于精确判断

## 快速开始

### 方式一：在组件中使用 Hook

```tsx
import { usePlatform } from "@/services/platform";

function MyComponent() {
  const { platform, environment, isMaui } = usePlatform();

  return (
    <div>
      <p>当前平台: {platform}</p>
      <p>运行环境: {environment}</p>

      {isMaui && <p>移动端原生功能</p>}
      {platform === "ios" && <p>iOS 特性</p>}
      {platform === "android" && <p>Android 特性</p>}
    </div>
  );
}
```

### 方式二：直接调用检测函数

```tsx
import { getPlatformInfoSync, getPlatformInfo } from "@/services/platform";

// 同步检测（快速，适合首屏）
function syncCheck() {
  const info = getPlatformInfoSync();
  console.log(info.platform); // "ios" | "android" | "web" | "unknown"
  console.log(info.isMaui);   // true | false
}

// 异步检测（准确，需要校准时使用）
async function accurateCheck() {
  const info = await getPlatformInfo();
  console.log(info.platform); // 准确的平台信息
}
```

### 方式三：在 API 服务中使用

```tsx
import { v2exApi } from "@/services/apiService";
import { getPlatformInfoSync } from "@/services/platform";

function loadData() {
  const { isMaui } = getPlatformInfoSync();

  if (isMaui) {
    console.log("📱 使用 MAUI Bridge 调用 C# 方法");
  } else {
    console.log("🌐 使用 HTTP API 调用 localhost:5199");
  }

  // v2exApi 会自动选择正确的实现
  v2exApi.getTopics().then(topics => {
    console.log(`获取到 ${topics.length} 个话题`);
  });
}
```

## 完整示例：HomePage 集成

```tsx
import { useEffect, useState } from "react";
import { usePlatform } from "@/services/platform";
import { v2exApi } from "@/services/apiService";
import type { Topic } from "@/types/v2ex";

export function HomePage() {
  const { platform, isMaui } = usePlatform();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 显示平台信息（开发调试用）
    console.log(`[HomePage] 运行在 ${platform} 平台`);
    console.log(`[HomePage] API 模式: ${isMaui ? "Bridge" : "HTTP"}`);

    // 加载话题
    v2exApi.getTopics().then(data => {
      setTopics(data);
      setLoading(false);
    });
  }, [platform, isMaui]);

  return (
    <div>
      {/* 平台特定样式 */}
      {platform === "ios" && (
        <div style={{ paddingTop: 44 /* iOS safe area */ }}>
          iOS 特定布局
        </div>
      )}

      {platform === "android" && (
        <div style={{ paddingTop: 16 /* Android status bar */ }}>
          Android 特定布局
        </div>
      )}

      {/* 话题列表 */}
      {loading ? (
        <div>加载中...</div>
      ) : (
        <ul>
          {topics.map(topic => (
            <li key={topic.id}>{topic.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## 平台特定功能示例

### iOS 安全区域适配

```tsx
import { usePlatform } from "@/services/platform";

function IOSAwareComponent() {
  const { platform } = usePlatform();

  if (platform === "ios") {
    return (
      <div style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)"
      }}>
        iOS 安全区域适配
      </div>
    );
  }

  return <div>常规布局</div>;
}
```

### 条件功能加载

```tsx
import { usePlatform } from "@/services/platform";
import { HapticFeedback } from "./haptic";

function InteractiveButton() {
  const { platform } = usePlatform();

  const handleClick = () => {
    // 仅在移动端启用触觉反馈
    if (platform !== "web") {
      HapticFeedback.impact();
    }
  };

  return <button onClick={handleClick}>点击</button>;
}
```

## 调试技巧

### 在开发时查看平台信息

```tsx
import { usePlatform } from "@/services/platform";

function DebugPanel() {
  const { platform, environment, isMaui } = usePlatform();

  if (process.env.NODE_ENV === "development") {
    return (
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: 10,
        fontSize: 12,
        zIndex: 9999
      }}>
        <div>平台: {platform}</div>
        <div>环境: {environment}</div>
        <div>MAUI: {isMaui ? "是" : "否"}</div>
      </div>
    );
  }

  return null;
}
```

### 浏览器控制台查看日志

```tsx
import { useEffect } from "react";
import { getPlatformInfo } from "@/services/platform";

useEffect(() => {
  // 开发环境输出详细平台信息
  if (process.env.NODE_ENV === "development") {
    getPlatformInfo().then(info => {
      console.table({
        "平台": info.platform,
        "环境": info.environment,
        "MAUI": info.isMaui,
        "UserAgent": navigator.userAgent,
      });
    });
  }
}, []);
```

## API 自动切换机制

项目的 `apiService.ts` 已经集成了平台检测：

```typescript
// apiService.ts 会自动判断：
if (isMauiEnvironment()) {
  // 📱 移动端：使用 mauiBridgeApi
  return mauiBridgeApi;
} else {
  // 🌐 Web 端：使用 httpApiService
  return httpApiService;
}
```

**你不需要手动选择，直接使用 `v2exApi` 即可！**

## C# 端实现

C# 的 `MauiBridge` 类已经添加了 `GetPlatformInfo()` 方法：

```csharp
public string GetPlatformInfo()
{
    return DeviceInfo.Platform switch
    {
        DevicePlatform.iOS => "iOS",
        DevicePlatform.Android => "Android",
        DevicePlatform.MacCatalyst => "Mac",
        // ...
    };
}
```

React 会通过 `HybridWebView.InvokeDotNet("GetPlatformInfo", [])` 调用此方法。

## 注意事项

1. **不要在首屏渲染前依赖异步检测** - 使用同步检测进行初始渲染
2. **HybridWebView 检测优先** - `window.HybridWebView` 是否存在是最可靠的判断
3. **开发环境回退** - 浏览器调试时会自动使用 HTTP API
4. **超时保护** - C# 检测有 3 秒超时，超时后回退到 JS 检测

## 故障排除

### 问题：平台检测错误

**检查步骤：**

1. 打开浏览器控制台，查看是否有 `[Platform]` 前缀的日志
2. 检查 `window.HybridWebView` 是否存在
3. 在 MAUI 应用中，查看 C# 日志是否有 "Bridge: 获取平台信息"

### 问题：API 调用失败

**检查步骤：**

1. 确认 `isMaui` 返回值是否正确
2. MAUI 环境：检查 `MauiBridge.cs` 是否正确注册
3. Web 环境：确认 ASP.NET Core API 是否在 `https://localhost:5199` 运行

### 问题：样式不正确

**检查步骤：**

1. iOS：确认 `safeAreas={false}` 设置正确
2. Android：检查是否需要额外的状态栏适配
3. Web：使用浏览器开发工具检查样式
