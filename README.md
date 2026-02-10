# MV2 - V2EX 跨平台客户端

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-blue)](https://dotnet.microsoft.com/en-us/apps/maui)

**MV2** 是一款现代、流畅、自适配的 V2EX 社区第三方客户端。基于 **.NET MAUI + Ionic React** 混合框架构建，旨在为移动端用户提供超越网页端的原生浏览体验。

---

## ✨ 主要功能

- **流畅浏览**：支持最新、热门话题浏览，深度适配移动端交互。
- **混合驱动**：结合了 C# 的强类型业务逻辑处理与 React 的灵活性。
- **话题管理**：支持按 Tab 或 Node 分类浏览话题（采用 HTML 解析增强非 API 内容）。
- **深度互动**：话题详情阅读、回复查看，支持感谢、引用回复及屏蔽（Ignore）功能。
- **跨平台一致性**：统一的视觉语言，支持深色模式（Dark Mode），提供原生级别的触感反馈与通知（Native Toast）。
- **隐私保护**：安全的数据处理机制，内置数据删除申请渠道。

---

## 🛠️ 技术栈

### 原生层 (C# / .NET MAUI)

- **.NET 10 + MAUI**：核心跨平台宿主。
- **HtmlAgilityPack**：用于增强解析 V2EX Web 页面的 HTML 内容。
- **Serilog**：工业级日志记录，支持本地文件滚动存储。
- **CommunityToolkit.Maui**：增强的 Native UI 组件（Snackbar/Toast）。

### 前端层 (TypeScript / React)

- **Vite + React 19**：高速的前端开发与构建工具。
- **Ionic Framework**：移动端 UI 基础组件库。
- **Zustand**：轻量级状态管理方案。
- **MauiBridge**：自定义的 JavaScript 与 C# 通信桥。

---

## 📁 目录结构

```
src/
├── V2ex.Maui2.App/       # MAUI 宿主：HybridWebView 配置、Native Bridge 实现、应用入口
├── V2ex.Maui2.Core/      # 核心模型：API 接口定义、HTML 解析逻辑、业务模型
├── V2ex.Maui2.IonicApp/  # 前端应用：React 项目源码
└── docs/                 # 相关文档：包含隐私政策与合规页面
```

---

## 🚀 快速开始

### 开发环境准备

- **.NET 10 SDK** (包含 MAUI 工作负载)
- **Node.js 22+**
- **pnpm** (前端包管理)

### 安装依赖

```bash
# 前端
cd src/V2ex.Maui2.IonicApp
pnpm install

# MAUI
cd ../V2ex.Maui2.App
dotnet restore
```

### 构建与部署流程

1. **构建前端产物**：
   ```bash
   cd src/V2ex.Maui2.IonicApp
   pnpm build
   ```
2. **运行应用**：

   ```bash
   # iOS (Mac Required)
   dotnet build -t:Run -f net10.0-ios

   # Android
   dotnet build -t:Run -f net10.0-android
   ```

---

## 📄 法律与隐私

- [隐私政策 (Privacy Policy)](https://rwecho.github.io/V2ex.Maui2/privacy.html)
- [数据删除说明 (Data Deletion)](https://rwecho.github.io/V2ex.Maui2/deletion.html)

---

## 🤝 致谢

- [V2EX](https://www.v2ex.com/)
- [.NET MAUI](https://dotnet.microsoft.com/apps/maui)
- [Ionic Framework](https://ionicframework.com/)

---

## 📧 联系方式

- Email: [rwecho@live.com](mailto:rwecho@live.com)

---

## 许可证

本项目采用 [MIT](LICENSE) 许可证。
