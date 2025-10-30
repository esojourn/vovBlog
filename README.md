# VovBlog

一个基于 Next.js 15、TipTap 编辑器和 Cloudinary 构建的现代化博客系统。

## ✨ 特性

- 📝 **强大的富文本编辑器**：基于 TipTap，类似 Notion 的编辑体验
- 🖼️ **智能图片处理**：支持粘贴、拖拽上传，自动优化和 CDN 加速
- 🏷️ **标签和分类系统**：灵活的内容组织方式
- 🔍 **全文搜索**：快速找到您需要的文章
- 📱 **响应式设计**：在任何设备上都有良好的阅读体验
- ⚡ **极速部署**：零配置部署到 Vercel

## 🚀 快速开始

### 1. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local`：

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

然后填入您的 Cloudinary 凭据（从 https://cloudinary.com/console 获取）：

\`\`\`env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
\`\`\`

### 3. 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

访问 `http://localhost:3000` 查看您的博客。

### 4. 创建文章

- 访问 `/admin/new` 创建新文章
- 直接粘贴图片到编辑器，自动上传
- 支持拖拽上传图片
- 从其他网页复制内容时，自动保留标题格式

## 📦 技术栈

- **框架**：Next.js 15 (App Router)
- **编辑器**：TipTap (富文本编辑器)
- **样式**：Tailwind CSS
- **图片存储**：Cloudinary
- **内容格式**：MDX
- **部署**：Vercel

## 🎯 项目结构

\`\`\`
VovBlog/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理后台
│   │   ├── new/           # 创建文章
│   │   └── edit/[slug]/   # 编辑文章
│   ├── blog/[slug]/       # 文章详情页
│   ├── api/               # API 路由
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── TipTapEditor.tsx  # 编辑器组件
│   ├── PostCard.tsx      # 文章卡片
│   └── SearchBar.tsx     # 搜索框
├── lib/                   # 工具函数
│   ├── cloudinary.ts     # Cloudinary 配置
│   ├── posts.ts          # 文章管理
│   └── search.ts         # 搜索功能
└── content/posts/         # MDX 文章文件
\`\`\`

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

## 🌐 部署到 Vercel

1. 将代码推送到 GitHub
2. 访问 [Vercel](https://vercel.com)
3. 导入您的 GitHub 仓库
4. 配置环境变量（Cloudinary 凭据）
5. 点击部署

部署完成后，您的博客将在 `https://your-project.vercel.app` 上线。

## 🔧 环境变量说明

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | 是 |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | 是 |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | 是 |
| `NEXT_PUBLIC_SITE_URL` | 网站 URL（用于 SEO） | 否 |

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Made with ❤️ using Next.js and Cloudinary**
