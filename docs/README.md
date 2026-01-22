# GitHub Pages 使用说明

本目录包含用于发布到 GitHub Pages 的文件，用于 App Store 和 Google Play 的展示。

## 部署

### 手动部署（推荐）

项目使用手动触发方式部署到 GitHub Pages，支持从任意分支部署。

配置步骤：

1. 在 GitHub 仓库设置中启用 Pages：
   - 进入 **Settings** → **Pages**
   - 选择 **Source** 为 **GitHub Actions**

2. 在 GitHub Actions 页面手动触发部署：
   - 进入 **Actions** → **Deploy to GitHub Pages**
   - 点击 **Run workflow**
   - 在下拉菜单中选择要部署的分支（默认 `main`）

**推荐理由**：
- 可从开发分支（如 `develop`、`staging`）预览更新
- 不需要在发布到 Pages 时先合并到 `main`
- 灵活控制部署时机

### 自动部署（可选）

如需在推送时自动部署，可以在 `.github/workflows/deploy-pages.yml` 中修改：

```yaml
on:
  push:
    branches: [your-branch-name]  # 替换为你的分支名
  workflow_dispatch:
```

## 文件说明

- `index.html` - 应用主页，包含：
  - 应用介绍
  - 主要功能特性
  - 应用截图（占位符）
  - App Store 和 Google Play 下载链接
  - 相关链接

- `privacy.html` - 隐私政策页面，Apple Store 和 Google Play 要求

## 自定义内容

### 1. 选择部署分支

在 GitHub Actions 中触发部署时，可以选择以下分支：
- `main` - 主分支（默认）
- `master` - 主分支（备用）
- `develop` - 开发分支（可选）
- `staging` - 预发布分支（可选）

**使用场景**：
- 在 `develop` 分支开发新功能，部署到 Pages 预览
- 确认无误后，合并到 `main` 并重新部署
- 使用 `staging` 分支进行最终的预发布测试

### 2. 更新应用商店链接

### 2. 添加应用截图

将实际的应用截图放到 `docs/images/` 目录，然后在 `index.html` 中更新：

```html
<img src="images/screenshot1.png" alt="首页" class="screenshot">
```

### 3. 更新联系信息

在 `privacy.html` 中更新实际的联系邮箱和 GitHub 仓库地址：

```html
<p>邮箱：your-email@example.com</p>
<p>GitHub：https://github.com/yourusername/V2ex.Maui2</p>
```

### 4. 添加 App Store 和 Google Play 所需信息

根据平台要求，可能需要添加以下文件：

根据平台要求，可能需要添加以下文件：

#### App Store

- **App Store 描述**：在 `index.html` 的描述部分
- **应用截图**：至少需要 iOS 设备截图
- **隐私政策链接**：`https://yourusername.github.io/V2ex.Maui2/privacy.html`

#### Google Play

- **Play Store 描述**：在 `index.html` 的描述部分
- **应用截图**：至少需要 2 张手机截图（建议 4 张）
- **隐私政策链接**：`https://yourusername.github.io/V2ex.Maui2/privacy.html`

## 访问网站

部署成功后，网站可通过以下地址访问：

```
https://yourusername.github.io/V2ex.Maui2/
```

或在 GitHub 仓库的 **Settings** → **Pages** 查看实际 URL。

## App Store 和 Google Play 审核

提交应用到商店时，通常需要提供以下信息：

1. **应用商店网址**：可以使用 GitHub Pages 的 URL
2. **隐私政策网址**：使用 `privacy.html` 的 URL
3. **支持联系方式**：使用隐私政策中的邮箱地址

## 维护建议

- 定期更新隐私政策（如有变更）
- 保持应用截图与最新版本一致
- 确保所有链接正确可访问
- 测试页面在移动设备上的显示效果
