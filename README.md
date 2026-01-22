# V2EX MAUI Client

使用 **.NET MAUI + Ionic React** 的 V2EX 跨平台客户端（iOS / Android）。前端运行在 HybridWebView 中，通过 MauiBridge 与 C# 服务交互。

## 技术栈（现状）

### MAUI 层（C#）

- .NET 10 + MAUI
- Refit（官方 JSON API）
- HtmlAgilityPack（Tab / Node 页面 HTML 解析）
- Serilog（文件 & 控制台日志，滚动保留 7 天）
- CommunityToolkit.Maui

### 前端（Ionic React）

- Vite + React 19 + TypeScript
- Ionic
- React Router，Zustand 状态管理

## 目录结构

```
src/
├── V2ex.Maui2.App/       # MAUI 宿主，HybridWebView，MauiBridge
├── V2ex.Maui2.Core/      # 业务与解析：Refit API、HtmlAgilityPack 解析、模型
├── V2ex.Maui2.Api/       # （可选）Minimal API，供浏览器调试
└── V2ex.Maui2.IonicApp/  # Ionic React 前端（最终产物拷贝到 Resources/Raw/wwwroot）
```

## 快速开始

### 前置

- .NET 10 SDK + MAUI workload
- Node.js 22+（项目使用 pnpm）

### 安装依赖

```bash
# 前端
cd src/V2ex.Maui2.IonicApp
pnpm install

# MAUI
cd ../V2ex.Maui2.App
dotnet restore
```

### 构建前端并拷贝到 MAUI

```bash
cd src/V2ex.Maui2.IonicApp
pnpm build

# 产物会放到 dist/，需要放入 MAUI 资源
cp -R dist/* ../V2ex.Maui2.App/Resources/Raw/wwwroot/
```

### 运行 / 调试

```bash
# iOS 模拟器
cd src/V2ex.Maui2.App
dotnet build -t:Run -f net10.0-ios

# Android 模拟器
dotnet build -t:Run -f net10.0-android

```

### 前端独立开发

```bash
cd src/V2ex.Maui2.IonicApp
pnpm dev   # http://localhost:5173
```

## 主要功能

- 最新 / 热门话题列表（JSON API）
- Tab / Node 话题列表（HTML 解析，HtmlAgilityPack）
- 话题详情 + 回复
- 用户信息、节点信息
- 日志页面（#/logs）：通过 MauiBridge 下载 / 查看 Serilog 日志

## 发布与链接设置

- iOS 发布使用 `-p:MtouchLink=SdkOnly`

## 许可证

MIT

## 致谢

- V2EX (https://www.v2ex.com/)
- MAUI / Ionic Frameworks
