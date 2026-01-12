# 平台检测功能实现总结

## ✅ 已完成的功能

### 1. **平台检测服务** (`src/services/platform.ts`)

#### 核心特性

- **双重检测策略**：
  - 快速同步检测（UserAgent）- 用于首屏渲染
  - 准确异步检测（C# DeviceInfo）- 用于精确判断

- **导出的类型和函数**：
  ```typescript
  type Platform = "web" | "ios" | "android" | "unknown";
  type Environment = "web" | "maui";

  interface PlatformInfo {
    platform: Platform;
    environment: Environment;
    isMaui: boolean;
  }
  ```

- **主要函数**：
  - `getPlatformInfoSync()` - 同步获取平台信息（快速）
  - `getPlatformInfo()` - 异步获取准确平台信息（精确）
  - `getPlatformFromNative()` - 从 C# 获取平台信息
  - `usePlatform()` - React Hook

### 2. **C# 端实现** (`MauiBridge.cs`)

添加了 `GetPlatformInfo()` 方法：
```csharp
public string GetPlatformInfo()
{
    return DeviceInfo.Platform switch
    {
        DevicePlatform.iOS => "iOS",
        DevicePlatform.Android => "Android",
        DevicePlatform.MacCatalyst => "Mac",
        DevicePlatform.WinUI => "Windows",
        // ...
    };
}
```

### 3. **API 服务集成** (`apiService.ts`)

更新了环境检测逻辑，使用统一的 `getPlatformInfoSync()`：
```typescript
function isMauiEnvironment(): boolean {
  return getPlatformInfoSync().isMaui;
}
```

## 🎯 使用方式

### 快速开始

```tsx
import { usePlatform } from "@/services/platform";

function MyComponent() {
  const { platform, isMaui } = usePlatform();

  return (
    <div>
      <p>平台: {platform}</p>
      <p>API模式: {isMaui ? "Bridge" : "HTTP"}</p>
    </div>
  );
}
```

### API 自动切换

```typescript
import { v2exApi } from "@/services/apiService";

// 自动选择：MAUI 用 Bridge，Web 用 HTTP
const topics = await v2exApi.getTopics();
```

## 📝 实现细节

### 双重检测流程

1. **首屏渲染**：
   - 使用 `navigator.userAgent` 快速判断
   - 同步返回，避免闪烁
   - 适合用于初始样式设置

2. **异步校准**：
   - 组件挂载后调用 C# `GetPlatformInfo()`
   - 通过 `DeviceInfo.Platform` 精确判断
   - 如果与 JS 检测不同，更新 State

### 平台映射

| UserAgent 检测 | C# DeviceInfo | 最终平台 |
|----------------|---------------|----------|
| iPhone/iPad/iPod | iOS | `ios` |
| Android | Android | `android` |
| - | MacCatalyst | `ios` |
| - | WinUI | `unknown` |
| - | - | `web` |

### 环境检测逻辑

```typescript
// 1. 检查 HybridWebView 是否存在
const isMaui = typeof window.HybridWebView !== "undefined";

// 2. 如果存在，使用 MAUI Bridge API
if (isMaui) {
  return mauiBridgeApi;
}

// 3. 否则，使用 HTTP API (localhost:5199)
return httpApiService;
```

## 🔧 调试

### 查看平台信息

在浏览器控制台中：
```javascript
// 查看 HybridWebView 是否存在
console.log(window.HybridWebView);

// 查看平台检测结果
import { getPlatformInfoSync } from "@/services/platform";
console.log(getPlatformInfoSync());
```

### C# 日志

MAUI 应用日志会显示：
```
Bridge: 获取平台信息 - iOS
```

## 📦 构建状态

✅ TypeScript 编译通过
✅ Vite 构建成功
✅ 资源已复制到 MAUI 项目
✅ 新 JS 文件：`index-UJPWdiLi.js`

## 🎨 使用示例

### 示例 1：平台特定样式

```tsx
import { usePlatform } from "@/services/platform";

function StyledComponent() {
  const { platform } = usePlatform();

  return (
    <div style={{
      paddingTop: platform === "ios" ? 44 : 16,
      paddingBottom: platform === "android" ? 16 : 0,
    }}>
      内容
    </div>
  );
}
```

### 示例 2：条件功能加载

```tsx
import { usePlatform } from "@/services/platform";
import { HapticFeedback } from "./haptic";

function Button() {
  const { platform } = usePlatform();

  const handleClick = () => {
    if (platform !== "web") {
      HapticFeedback.impact();
    }
  };

  return <button onClick={handleClick}>点击</button>;
}
```

### 示例 3：调试面板

```tsx
import { usePlatform } from "@/services/platform";

function DebugPanel() {
  const { platform, environment, isMaui } = usePlatform();

  if (process.env.NODE_ENV === "development") {
    return (
      <div style={{
        position: "fixed",
        bottom: 0,
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: 10,
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

## 🚀 下一步

### 测试计划

1. **Web 端测试**：
   ```bash
   cd /Volumes/MacMiniDisk/workspace/V2ex.Maui2/src/V2ex.Maui2.React
   npm run dev
   ```
   - 打开 http://localhost:5173
   - 检查控制台是否显示 "平台: web"

2. **MAUI iOS 测试**：
   ```bash
   cd /Volumes/MacMiniDisk/workspace/V2ex.Maui2/src/V2ex.Maui2.App
   dotnet run -f net10.0-ios
   ```
   - 检查控制台是否显示 "平台: ios"

3. **MAUI Android 测试**：
   ```bash
   dotnet run -f net10.0-android
   ```
   - 检查控制台是否显示 "平台: android"

### 集成到现有组件

可以在 `HomePage.tsx`、`TopicDetailPage.tsx` 等组件中使用：

```tsx
import { usePlatform } from "@/services/platform";

export function HomePage() {
  const { platform } = usePlatform();
  // ... 使用 platform 进行条件渲染
}
```

## 📚 相关文档

- [PLATFORM_DETECTION.md](./src/V2ex.Maui2.React/PLATFORM_DETECTION.md) - 详细使用指南
- [API 服务架构](./src/V2ex.Maui2.React/README.md) - API 自动切换机制
- [MAUI 文档](https://learn.microsoft.com/dotnet/maui/) - MAUI 官方文档

## 💡 最佳实践

1. **首屏使用同步检测** - 避免闪烁
2. **需要精确判断时使用异步检测** - 如文件路径、权限等
3. **开发环境显示调试面板** - 方便查看平台信息
4. **生产环境移除调试代码** - 保持代码整洁
