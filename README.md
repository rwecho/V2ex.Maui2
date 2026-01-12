# V2EX MAUI Client

一个使用 MAUI + React 构建的 V2EX 跨平台移动客户端。

## 技术栈

### MAUI App 层 (C#)

- **.NET 10** + **MAUI**
- **Refit** - 声明式 HTTP 客户端
- **Serilog** - 结构化日志
- **System.Text.Json** - JSON 序列化
- **V2EX JSON API** - 使用官方 JSON API 端点

### React 前端

- **Vite 7** - 构建工具
- **React 19** + **TypeScript**
- **Tailwind CSS 4.x**
- **Konsta UI** - 移动端 UI 组件
- **React Router v7** - 路由
- **Zustand** - 状态管理
- **Zod** - 数据验证

## 项目结构

```
src/
├── V2ex.Maui2.App/          # MAUI 原生层
│   ├── Models/
│   │   ├── Api/             # JSON API 响应模型
│   │   └── V2ex/            # 业务模型
│   ├── Services/
│   │   ├── Interfaces/      # 服务接口
│   │   │   └── IV2exJsonApi.cs  # Refit API 接口
│   │   ├── V2ex/           # V2EX 服务实现
│   │   │   └── V2exJsonService.cs
│   │   └── Bridge/         # JS Bridge
│   │       └── MauiBridge.cs
│   ├── Controls/            # 自定义控件
│   ├── MainPage.xaml        # 主页面（包含 WebView）
│   └── MauiProgram.cs       # DI 配置
│
└── V2ex.Maui2.React/        # React 前端
    ├── src/
    │   ├── pages/           # 页面组件
    │   ├── stores/          # Zustand stores
    │   ├── services/        # API 调用 (mauiBridge.ts)
    │   ├── types/           # TypeScript 类型
    │   └── main.tsx
    └── dist/                # 构建产物

└── V2ex.Maui2.Api/          # REST API（给浏览器版 React 开发用）
    ├── Program.cs           # Minimal API + Swagger + CORS
    └── appsettings.json      # BaseUrl / CORS 等配置
```

## 快速开始

### 前置要求

1. **.NET 10 SDK**

   ```bash
   dotnet --version  # 应该显示 10.x.x
   ```

2. **MAUI 工作负载**

   - Visual Studio 2022 17.8+ 或
   - Visual Studio Code + C# Dev Kit + MAUI 扩展

3. **Node.js 18+**
   ```bash
   node --version
   pnpm --version
   ```

### 安装依赖

```bash
# 安装 React 依赖
cd src/V2ex.Maui2.React
pnpm install

# 恢复 MAUI 依赖
cd ../V2ex.Maui2.App
dotnet restore
```

### 构建项目

使用提供的构建脚本：

**macOS/Linux:**

```bash
./build.sh
```

**Windows:**

```cmd
build.bat
```

构建脚本会自动：

1. 构建 React 项目
2. 构建 REST API 项目
3. 复制构建产物到 MAUI Resources/Raw 目录
4. 构建 MAUI 项目

### 运行 REST API（浏览器开发 React 推荐）

```bash
cd src/V2ex.Maui2.Api
dotnet run
```

默认地址：`http://localhost:5199`，Swagger：`http://localhost:5199/swagger`

### 手动构建

如果需要手动构建各个部分：

```bash
# 1. 构建 React
cd src/V2ex.Maui2.React
pnpm build

# 2. 复制到 MAUI Resources
cp -R dist/* ../V2ex.Maui2.App/Resources/Raw/

# 3. 构建 MAUI
cd ../V2ex.Maui2.App
dotnet build
```

### 运行项目

#### iOS 模拟器

```bash
cd src/V2ex.Maui2.App
dotnet build -t:Run -f net10.0-ios
```

#### Android 模拟器

```bash
cd src/V2ex.Maui2.App
dotnet build -t:Run -f net10.0-android
```

#### macOS (Mac Catalyst)

```bash
cd src/V2ex.Maui2.App
dotnet build -t:Run -f net10.0-maccatalyst
```

### 开发模式

在开发时，你可以单独运行 React 应用：

```bash
cd src/V2ex.Maui2.React
pnpm dev
```

React 应用会在 `http://localhost:5173` 启动，并且会使用 Mock 数据。

## 架构说明

### V2EX JSON API

本项目使用 V2EX 官方 JSON API 端点，不依赖 HTML 解析：

- `GET /api/topics/latest.json` - 获取最新话题
- `GET /api/topics/hot.json` - 获取热门话题
- `GET /api/topics/show.json?id={id}` - 获取话题详情（包含回复）
- `GET /api/nodes/{name}/topics.json` - 获取节点话题列表
- `GET /api/nodes/show.json?name={name}` - 获取节点信息
- `GET /api/nodes/all.json` - 获取所有节点
- `GET /api/member/show.json?id={username}` - 获取用户信息

### 通信机制

React 和 MAUI 之间通过 JavaScript Bridge 通信：

1. **React → C#**: React 调用 `window.MauiBridge.xxx()` 方法
2. **C# 处理**: MauiBridge 接收调用并执行相应的服务
3. **C# → React**: 返回 JSON 格式的结果

### 数据流

```
用户操作 (React UI)
    ↓
Zustand Store
    ↓
MauiBridge 服务
    ↓
V2exJsonService (C#)
    ↓
IV2exJsonApi (Refit)
    ↓
V2EX JSON API
```

## 主要功能

- ✅ 话题列表浏览（最新/热门）
- ✅ 话题详情查看（包含回复）
- ✅ 节点话题列表
- ✅ 节点信息查看
- ✅ 用户信息查看
- 🚧 登录功能（待实现）
- 🚧 发布话题/评论（待实现）

## 开发注意事项

### V2EX API 限制

V2EX JSON API 可能需要登录才能访问某些端点。当前实现未包含登录功能，如需访问受保护的内容，需要先实现登录。

### User-Agent

项目设置了 User-Agent 模拟 iOS Safari 浏览器，但如果 V2EX 加强反爬虫措施，可能需要调整。

### 调试

- C# 日志: `FileSystem.AppDataDirectory/logs/v2ex-.txt`
- React 日志: 浏览器开发者工具控制台

## 技术亮点

1. **类型安全**: 前后端都有完整的类型定义
2. **JSON API**: 使用官方 API，比 HTML 解析更可靠
3. **状态管理**: Zustand 提供简洁的状态管理
4. **移动优先**: Konsta UI 提供 iOS 风格的组件
5. **构建优化**: Vite 提供快速的开发体验

## 许可证

MIT License

## 致谢

- V2EX (https://www.v2ex.com/)
- MAUI 社区
- Konsta UI
