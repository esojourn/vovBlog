# 部署指南

本指南将帮助您将 VovBlog 部署到 Vercel。

## 前置准备

### 1. 注册 Cloudinary 账号

1. 访问 https://cloudinary.com/users/register_free
2. 注册免费账号
3. 登录后访问控制台：https://cloudinary.com/console
4. 记录以下信息：
   - Cloud Name
   - API Key
   - API Secret

### 2. 准备 Git 仓库

如果您还没有将代码推送到 Git：

\`\`\`bash
git init
git add .
git commit -m "Initial commit: VovBlog"
git remote add origin <your-github-repo-url>
git push -u origin main
\`\`\`

## 部署到 Vercel

### 🚀 一键部署（推荐）

我们提供了一键部署脚本，自动化完成整个部署流程：

```bash
npm run deploy
```

或者直接运行脚本：

```bash
./deploy.sh
```

一键部署脚本会自动：
1. ✅ 检查 Node.js 和 npm 环境
2. ✅ 安装 Vercel CLI（如果未安装）
3. ✅ 检查环境变量配置
4. ✅ 安装项目依赖
5. ✅ 检查代码格式
6. ✅ 测试构建
7. ✅ 询问是否提交并推送代码到 Git
8. 🚀 部署到 Vercel
9. 🌐 打开 Vercel 仪表板

**可用命令：**
- `npm run deploy` - 全自动部署流程（交互式）
- `npm run deploy:vercel` - 直接部署到生产环境
- `npm run deploy:check` - 检查环境变量配置

### 方法一：通过 Vercel 网站部署

1. 访问 https://vercel.com
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 导入您的 GitHub 仓库
5. 配置项目：

   **环境变量设置：**
   - 点击 "Environment Variables"
   - 添加以下变量：
     ```
     NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
     CLOUDINARY_API_KEY=your_api_key
     CLOUDINARY_API_SECRET=your_api_secret
     NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
     ```

6. 点击 "Deploy"
7. 等待部署完成（约 1-2 分钟）

### 方法二：通过 Vercel CLI 部署

1. 安装 Vercel CLI：

\`\`\`bash
npm i -g vercel
\`\`\`

2. 登录 Vercel：

\`\`\`bash
vercel login
\`\`\`

3. 部署：

\`\`\`bash
vercel
\`\`\`

4. 按照提示操作，添加环境变量

## 配置自定义域名（可选）

1. 在 Vercel 项目设置中，进入 "Domains"
2. 添加您的域名
3. 按照提示配置 DNS 记录
4. 等待 DNS 生效（通常 5-30 分钟）

## 更新网站

每次推送代码到 GitHub，Vercel 会自动重新部署：

\`\`\`bash
git add .
git commit -m "Update content"
git push
\`\`\`

## 性能优化建议

### 1. Cloudinary 优化设置

在 Cloudinary 控制台中：

1. 进入 Settings → Upload
2. 启用 "Auto optimize quality"
3. 启用 "Auto format"

### 2. Vercel 配置

在 `vercel.json` 中（如需要）：

\`\`\`json
{
  "regions": ["hkg1", "sin1"],
  "cleanUrls": true,
  "trailingSlash": false
}
\`\`\`

## 常见问题

### Q: 图片上传失败

A: 检查以下几点：
- Cloudinary 环境变量是否正确配置
- Cloudinary 账号是否有足够的免费额度
- 图片大小是否超过限制

### Q: 文章不显示

A: 检查：
- `content/posts/` 目录是否存在
- MDX 文件格式是否正确
- frontmatter 是否完整

### Q: 部署后访问慢

A: 可能的原因：
- Vercel 在国内访问可能较慢
- 建议使用 Cloudflare 作为 CDN 加速
- 或配置自定义域名

## 监控和分析

### Vercel Analytics

1. 在 Vercel 项目设置中启用 Analytics
2. 查看访问量、性能指标等

### 环境变量管理

在 Vercel 项目设置 → Environment Variables 中：
- 可以为不同环境（Production、Preview、Development）设置不同的值
- 修改环境变量后需要重新部署

## 备份策略

### 内容备份

所有文章都存储在 `content/posts/` 目录下的 MDX 文件中，通过 Git 自动备份。

### 图片备份

图片存储在 Cloudinary，建议：
1. 定期下载 Cloudinary 中的图片
2. 或使用 Cloudinary 的备份功能（付费功能）

---

**部署完成后，您的博客将在 `https://your-project.vercel.app` 上线！**

需要帮助？欢迎提交 Issue。
