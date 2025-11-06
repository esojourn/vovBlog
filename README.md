# VovBlog - Voice of Vessel

为了转载保留一些公众号的文章，我开发了这个程序。
这是一个基于 Next.js 16、TipTap 编辑器和 Cloudinary 构建的博客系统。


- ✨✨✨ **一键导入微信公众号文章**！支持自动提取标题、正文、图片。直接输入 URL，内容自动填充到编辑器！
- ✨✨ 使用免费的 Vercel / Cloudinary 额度，足够个人用户使用。
- ✨ 使用 Cloudinary，兼顾墙内浏览速度。并且无需复杂的实名注册流程。

实例预览：https://vov-blog.vercel.app



## 🚀 快速开始

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fesojourn%2FvovBlog)

获取 Cloudinary API Key；
点击 "Deploy with Vercel"，设置 ADMIN_PASSWORD 环境变量作为管理员密码；
开始使用吧！ :)

## ✨ 特性

- 🤖 **微信公众号一键导入**：输入公众号文章 URL，自动提取标题、正文和图片，自动上传到 Cloudinary
  - 使用 Playwright 无头浏览器，智能绕过反爬虫检测
  - 自动清洗 HTML，确保 MDX 编译兼容
  - 提取的图片自动上传到 Cloudinary CDN，墙内高速访问
  - 支持编辑导入内容，灵活调整

- 📝 **强大的富文本编辑器**：基于 TipTap，类似 Notion 的编辑体验
- 🖼️ **智能图片处理**：支持粘贴、拖拽上传，自动优化和 CDN 加速
- 🏷️ **标签和分类系统**：灵活的内容组织方式
- 🔍 **全文搜索**：快速找到您需要的文章
- 📱 **响应式设计**：在任何设备上都有良好的阅读体验
- ⚡ **极速部署**：零配置部署到 Vercel

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装bun
curl -fsSL https://bun.com/install | bash
bun install
```

在WSL中，使用Playwright需要安装很多依赖。我使用的是Ubuntu 24

```
bunx playwright install-deps chromium 
bunx playwright install chromium
```

### 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local`：

```bash
cp .env.local.example .env.local
```

然后填入您的 Cloudinary 凭据（从 https://cloudinary.com/console 获取）：

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ADMIN_PASSWORD=password
```

### 3. 启动开发服务器

```bash
bun run dev
```

访问 `http://localhost:3000` 查看您的博客。

### 4. 部署到生产环境

一键部署到 Vercel：

```bash
bun run deploy
```

该脚本将自动：
- 检查环境配置
- 安装依赖
- 检查代码格式
- 构建测试
- 推送到 Git（可选）
- 部署到 Vercel

更多部署选项：
- `bun run deploy:vercel` - 直接部署到生产环境
- `bun run deploy:check` - 检查环境变量配置

详细部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)。

### 5. 创建文章

#### 方法一：一键导入微信公众号文章 ⭐ 推荐

1. 访问 `/admin/new` 创建新文章
2. **在"原文链接"字段粘贴微信公众号文章 URL**
3. 点击"导入"按钮
4. 等待 3-5 秒，标题和正文自动填充到编辑器
5. 系统自动上传文章中的所有图片到 Cloudinary CDN
6. 你可以进一步编辑或调整内容
7. 点击"保存草稿"或"发布文章"

**支持的 URL 格式：**
- `https://mp.weixin.qq.com/s/...`（微信公众号链接）

**自动处理：**
- ✅ 自动提取标题
- ✅ 自动提取正文（包含所有格式）
- ✅ 自动上传文章中的图片到 Cloudinary
- ✅ 自动设置文章来源为"瓦器微声"公众号
- ✅ 自动清洗 HTML，确保兼容性

#### 方法二：手动创建文章

1. 访问 `/admin/new` 创建新文章
2. 填写标题、描述、分类
3. 添加标签
4. 在编辑器中写作
5. 直接粘贴图片到编辑器，自动上传
6. 支持拖拽上传图片
7. 从其他网页复制内容时，自动保留标题格式

## 📦 技术栈

- **框架**：Next.js 16 (App Router)
- **包管理**：Bun
- **编辑器**：TipTap (富文本编辑器)
- **样式**：Tailwind CSS
- **图片存储**：Cloudinary
- **内容格式**：MDX
- **网络爬取**：Playwright (微信公众号导入)
- **部署**：Vercel

## 🎯 项目结构

```
VovBlog/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理后台
│   │   ├── new/           # 创建文章
│   │   └── edit/[slug]/   # 编辑文章
│   ├── blog/[slug]/       # 文章详情页
│   ├── api/               # API 路由
│   │   ├── posts/         # 文章 CRUD 操作
│   │   ├── upload/        # 图片上传到 Cloudinary
│   │   ├── proxy-upload/  # 代理上传（绕过 CORS）
│   │   └── fetch-wechat-article/ # ⭐ 微信公众号导入
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── TipTapEditor.tsx  # 编辑器组件（支持导入内容）
│   ├── PostCard.tsx      # 文章卡片
│   └── SearchBar.tsx     # 搜索框
├── lib/                   # 工具函数
│   ├── cloudinary.ts     # Cloudinary 配置
│   ├── posts.ts          # 文章管理（支持 originalUrl）
│   └── search.ts         # 搜索功能
└── content/posts/         # MDX 文章文件
```

## 📝 使用指南

### 创建文章

1. 访问 `/admin/new`
2. 填写标题、描述、分类
3. 添加标签
4. 在编辑器中写作
5. 粘贴或拖拽图片（自动上传到 Cloudinary）
6. 点击"保存草稿"或"发布文章"

### 编辑文章

1. 访问 `/admin`
2. 点击文章右侧的编辑按钮
3. 修改内容后保存

### 图片上传

编辑器支持三种上传方式：

1. **粘贴**：Ctrl+V 或 Cmd+V
2. **拖拽**：直接拖拽图片到编辑器
3. **点击按钮**：点击工具栏的图片按钮选择文件

所有图片自动上传到 Cloudinary，并应用以下优化：

- 自动格式转换（WebP）
- 质量优化
- 最大宽度限制（1200px）
- CDN 加速

### 搜索和筛选

- 首页顶部的搜索框支持全文搜索
- 点击分类或标签可筛选文章
- 支持多条件组合筛选

### 微信公众号文章导入详解

#### 工作流程

1. **内容抓取**：使用 Playwright 无头浏览器访问微信公众号链接
2. **智能解析**：自动识别微信 DOM 结构，提取标题、正文、图片
3. **HTML 清洗**：移除微信特定标签和样式，确保 MDX 兼容
4. **图片处理**：识别文章中的所有图片，上传到 Cloudinary CDN
5. **编辑器填充**：自动将标题和正文填充到编辑器中

#### 特点和优势

- 🚀 **智能反爬**：使用真实浏览器环境，绕过微信反爬虫检测
- 🖼️ **图片自动处理**：自动上传所有图片，无需手动操作
- 🧹 **智能清洗**：自动移除微信追踪代码和样式，保留有效内容
- ✏️ **可编辑**：导入后仍可继续编辑和调整内容
- 📱 **全设备支持**：在编辑和阅读页面都可导入文章
- ⚡ **快速导入**：通常只需 3-5 秒即可导入整篇文章

#### 常见问题

**Q: 导入失败或内容不完整怎么办？**
A: 微信公众号的 HTML 结构可能因更新而改变。如果导入失败，可尝试：
   - 刷新页面重试
   - 检查浏览器控制台的错误信息
   - 如果仍然失败，可手动复制文章内容到编辑器

**Q: 导入的图片会被压缩吗？**
A: 会的。所有图片都会通过 Cloudinary 进行优化处理，包括：
   - 自动转换为 WebP 格式
   - 质量优化（压缩）
   - 最大宽度限制（1200px）
   - 这样可以加快页面加载速度，同时保持良好的视觉质量

**Q: 是否支持其他来源的文章导入？**
A: 目前仅支持微信公众号 (mp.weixin.qq.com)。未来可根据需求添加其他平台支持。

## 🌐 部署到 Vercel

1. 将代码推送到 GitHub
2. 访问 [Vercel](https://vercel.com)
3. 导入您的 GitHub 仓库
4. 配置环境变量（Cloudinary 凭据）
5. 点击部署

部署完成后，您的博客将在 `https://your-project.vercel.app` 上线。
使用自己的域名，指向vercel项目，即可墙内访问。

## 🔧 环境变量说明

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | 是 |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | 是 |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | 是 |
| `NEXT_PUBLIC_SITE_URL` | 网站 URL（用于 SEO） | 否 |
| `ADMIN_PASSWORD` | 管理员密码 | 是 |

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Made with ❤️ using Next.js and Cloudinary**
