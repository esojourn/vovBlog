# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

VovBlog 是一个基于 **Next.js 16** 的现代化博客系统，使用 **TipTap** 作为富文本编辑器，**Cloudinary** 作为图片存储方案。项目采用文件系统存储（MDX 格式），通过 gray-matter 管理文章元数据。项目使用 **Bun** 作为包管理器。

## 包管理器：Bun

本项目已迁移至 **Bun v1.2.22**（超快的 JavaScript 运行时和包管理器）。

### 为什么使用 Bun？
- ⚡️ **极速依赖安装**：相比 npm，安装速度快 6-10 倍
- 📦 **兼容 npm/yarn 生态**：无需修改 package.json，完全兼容
- 🚀 **内置开发服务器**：集成 TypeScript、JSX 支持
- 💾 **智能 lockfile**：使用 bun.lock 确保依赖稳定性

### Bun 命令示例
```bash
# 安装依赖
bun install

# 运行脚本
bun run dev
bun run build

# 添加依赖
bun add package-name
bun add -d package-name  # 开发依赖

# 删除依赖
bun remove package-name
```

### 与 npm 对比
| 操作 | npm | Bun |
|-----|-----|-----|
| 安装依赖 | `npm install` | `bun install` |
| 运行脚本 | `npm run dev` | `bun run dev` |
| 添加依赖 | `npm install pkg` | `bun add pkg` |
| 删除依赖 | `npm uninstall pkg` | `bun remove pkg` |

## 常用命令

### 开发命令
- `bun run dev` - 启动开发服务器（http://localhost:3000）
- `bun run build` - 构建生产版本
- `bun start` - 启动生产服务器
- `bun run lint` - 运行 ESLint 检查代码

### 开发工作流
```bash
# 开发时保持这个终端运行
bun run dev

# 在另一个终端进行代码更改
# 更改会自动热更新（HMR）
```

## 项目架构

### 核心概念
- **内容存储**：所有文章保存在 `content/posts/` 目录下，文件格式为 MDX（`.mdx`）
- **内容格式**：文章内容采用 **Markdown** 格式存储（而非 HTML），便于版本控制、可读性和可维护性
- **前置元数据**：每个 MDX 文件使用 gray-matter 格式，YAML 前置块包含 title、date、tags、category 等
- **静态生成与 API**：首页等使用 SSG（Server-Side Generation），API 路由提供动态数据获取和管理

### 目录结构
```
app/                          # Next.js App Router (主要应用代码)
├── layout.tsx               # 根布局（导航栏、页脚）
├── page.tsx                 # 首页（调用 HomeClient）
├── admin/                   # 后台管理区域
│   ├── page.tsx            # 文章列表管理页
│   ├── new/page.tsx        # 创建新文章页
│   └── edit/[slug]/page.tsx # 编辑文章页
├── blog/[slug]/             # 文章详情页（动态路由）
│   └── page.tsx
└── api/                     # API 路由
    ├── posts/route.ts       # GET/POST/PUT/DELETE 文章数据
    ├── upload/route.ts      # 图片上传到 Cloudinary
    ├── proxy-upload/route.ts # 后端代理上传（解决 CORS 问题）
    ├── fetch-wechat-article/route.ts # 微信公众号文章导入
    ├── auth/                # 认证相关 API
    │   ├── login/route.ts   # 登录
    │   ├── logout/route.ts  # 登出
    │   └── check/route.ts   # 检查会话状态
    ├── feed.xml/route.ts    # RSS 源
    └── sitemap.xml/route.ts # XML 网站地图

components/                   # React 组件库（可复用的 UI 组件）
├── HomeClient.tsx           # 首页客户端组件（搜索、筛选、列表）
├── TipTapEditor.tsx         # 富文本编辑器（包含图片拖拽、粘贴上传）
├── PostCard.tsx             # 文章卡片组件
└── SearchBar.tsx            # 搜索框组件

lib/                         # 工具函数与业务逻辑
├── posts.ts                 # 文章文件系统操作（读取、保存、删除）
├── search.ts                # 搜索功能
├── cloudinary.ts            # Cloudinary 配置和上传处理
└── utils.ts                 # 通用工具函数（如 slugify）

content/posts/               # 文章内容文件夹
├── example.mdx              # MDX 格式的文章（包含前置元数据）
└── ...

tailwind.config.ts           # Tailwind CSS 配置
tsconfig.json               # TypeScript 配置（路径别名 @/* -> ./）
```

### 数据流

1. **首页加载**
   - `app/page.tsx`（SSG）调用 `getAllPosts()`、`getAllTags()`、`getAllCategories()`
   - 传递初始数据给 `HomeClient` 组件进行渲染

2. **创建/编辑文章**
   - 在 `/admin/new` 或 `/admin/edit/[slug]` 使用 `TipTapEditor` 组件编写内容
   - 编辑器使用 TipTap + Markdown 扩展，原生支持 Markdown 输出
   - 点击保存时，通过 API 路由（`/api/posts`）提交 POST/PUT 请求
   - `lib/posts.ts` 的 `savePost()` 将文章以 **Markdown 格式** 保存到文件系统
   - 粘贴 HTML 内容（如微信公众号文章）时，自动清洗后导入，编辑器输出 Markdown

3. **图片上传**
   - 编辑器中粘贴、拖拽或点击上传按钮
   - 调用 `/api/upload` 发送到 Cloudinary
   - 返回图片 URL 后插入编辑器

4. **搜索与筛选**
   - 客户端组件 `HomeClient` 实现全文搜索和分类/标签筛选
   - 基于内存数据，在浏览器中执行筛选逻辑

5. **微信公众号文章导入**
   - 用户在 `/admin/new` 页面输入微信文章 URL
   - 调用 `/api/fetch-wechat-article` 使用 Playwright 抓取文章
   - 后端提取：标题、内容、发布日期、公众号名称
   - 使用 `matchSourceByAccountName()` 自动识别来源（`lib/source-config.ts:111`）
   - 通过 `/api/proxy-upload` 代理下载图片（解决 CORS 限制）
   - HTML 转 Markdown（Turndown）后自动填充表单

6. **自动 Git 同步**
   - 文章保存/更新/删除后，`lib/git-sync.ts` 自动触发
   - 使用 `setImmediate()` 异步执行，不阻塞用户操作
   - 自动提交到 `content/posts/` 并推送到 GitHub
   - 失败仅记录日志，不影响文章发布

## 关键技术细节

### 多来源博客系统

VovBlog 支持管理多个内容来源（公众号），每个来源可独立访问。

#### 来源配置

所有来源在 `lib/source-config.ts` 中集中管理：

```typescript
export const SOURCES: SourceConfig[] = [
  {
    id: '"瓦器微声"公众号',
    name: '"瓦器微声"公众号',
    shortName: '瓦器微声',
    subdomain: 'wqws',
    qrCode: '/qrcodes/wqws.png',
    description: '信仰与生活的精妙交织',
  },
  {
    id: '"盐读书"公众号',
    name: '"盐读书"公众号',
    shortName: '盐读书',
    subdomain: 'yds',
    qrCode: '/qrcodes/yds.png',
    description: '阅读的味道，生活的调味料',
  },
  // ... 其他来源
]
```

#### 子域名访问

- **主域名** (`www.waqi.uk`): 显示所有来源的文章，显示来源筛选器
- **子域名** (`wqws.waqi.uk`): 只显示该来源的文章，隐藏来源筛选器

域名解析通过 `lib/domain-utils.ts` 实现，服务端根据 `headers().get('host')` 自动过滤文章。

#### 自动来源识别

导入微信文章时，系统自动匹配公众号名称到来源（`lib/source-config.ts:111`）：

```typescript
export function matchSourceByAccountName(accountName: string): string | null {
  // 精确匹配
  const exactMatch = SOURCES.find(s => s.shortName === accountName)
  if (exactMatch) return exactMatch.id

  // 模糊匹配（双向包含）
  const fuzzyMatch = SOURCES.find(s =>
    accountName.includes(s.shortName) || s.shortName.includes(accountName)
  )
  return fuzzyMatch?.id || null
}
```

#### 添加新来源

1. 在 `lib/source-config.ts` 的 `SOURCES` 数组中添加新配置
2. 在 `public/qrcodes/` 目录添加二维码图片（可选）
3. 在 Vercel 和 DNS 配置新的子域名（参见部署章节）

### 搜索与性能优化

#### 两层搜索策略

`lib/search.ts` 实现了智能两层搜索，平衡性能与准确性：

**第 1 层：快速元数据搜索（90% 的查询）**
- 搜索范围：标题、描述、标签、分类
- 特点：极快，适合大多数查询

**第 2 层：全文搜索（仅当第 1 层无结果）**
- 搜索范围：完整文章内容
- 特点：较慢，但不会遗漏内容

```typescript
// lib/search.ts:10-33
export function searchPosts(posts: Post[], query: string): Post[] {
  // 第1层：快速元数据过滤
  const quickResults = posts.filter((post) => {
    const titleMatch = post.title.toLowerCase().includes(lowerQuery)
    const descriptionMatch = post.description?.toLowerCase().includes(lowerQuery)
    // ... 标签、分类匹配
  })

  // 如果元数据找到结果，直接返回（避免全文搜索）
  if (quickResults.length > 0) return quickResults

  // 第2层：全文搜索（只有必要时）
  return posts.filter((post) =>
    post.content.toLowerCase().includes(lowerQuery)
  )
}
```

#### 缓存策略

**文章列表缓存**（`lib/posts.ts`）：
- 生产环境：60 秒缓存
- 开发环境：禁用缓存
- 避免频繁文件系统读取

### 微信文章导入

#### 使用方法

1. 在 `/admin/new` 页面点击"从微信导入"
2. 粘贴微信公众号文章链接
3. 系统自动提取：
   - 文章标题、内容
   - 发布日期
   - 公众号名称 → 自动匹配来源
   - 所有图片（自动上传到 Cloudinary）

#### 技术实现

**抓取引擎**（`app/api/fetch-wechat-article/route.ts`）：
- 使用 Playwright (Chromium) 渲染页面
- 提取 `<meta>` 标签获取标题、日期
- DOM 解析获取正文内容和公众号名称

**CORS 图片代理**（`app/api/proxy-upload/route.ts`）：
- 微信 CDN 图片有 Referer 限制，前端无法直接访问
- 后端代理下载图片后上传到 Cloudinary
- 流程：微信 URL → 后端代理 → Cloudinary → 返回新 URL

**内容转换**：
- HTML → Markdown（Turndown 库）
- DOMPurify 清洗危险标签
- TipTap 编辑器加载 Markdown 内容

#### 配置要求

需要安装 Playwright 浏览器（自动通过 postinstall hook）：
```bash
bun install
# 自动执行：playwright install chromium --with-deps
```

### 自动 Git 同步

#### 工作原理

每次创建、更新或删除文章时，系统自动提交并推送到 GitHub。

**实现文件**：`lib/git-sync.ts`

#### 执行流程

1. 文章操作完成后，调用 `syncToGithubAsync(slug, action)`
2. 使用 `setImmediate()` 异步执行，**不阻塞** HTTP 响应
3. 执行 Git 命令：
   ```bash
   git add content/posts/
   git commit -m "Auto: 新增文章 article-slug"
   git push
   ```
4. 失败时只记录日志，不影响用户操作

#### 提交消息格式

```
Auto: 新增文章 article-slug    # 创建文章
Auto: 更新文章 article-slug    # 更新文章
Auto: 删除文章 article-slug    # 删除文章
```

#### 触发位置

- `app/api/posts/route.ts` POST/PUT/DELETE 处理器
- 在响应返回前触发，但不等待完成

#### 配置要求

需要配置 Git 认证：
- SSH 密钥（推荐）
- 或 Personal Access Token

**本地测试时**，确保已配置 Git：
```bash
git config user.name "Your Name"
git config user.email "your@email.com"
```

### 图片上传系统

#### 三种上传模式

**1. 直接上传**（`/api/upload`）
- 用户拖拽/粘贴本地图片
- Base64 图片
- 前端可访问的 URL

**2. CORS 代理上传**（`/api/proxy-upload`）
- 微信 CDN 图片（有 Referer 限制）
- 其他有 CORS 限制的图片源
- 后端代理下载 → Cloudinary

**3. 批量上传**
- 编辑器同时处理最多 10 张图片
- 使用 `Promise.all()` 并发上传
- 超过限制时自动分批处理

#### Cloudinary 优化配置

`lib/cloudinary.ts` 设置：
- 自动转换为 WebP/AVIF 格式
- 最大宽度：1200px
- 质量：auto
- 文件夹：`vovblog/posts`

### 认证系统

#### 认证方式

**基于 Cookie 的会话认证**：
- 登录后设置 `httpOnly` Cookie
- 所有管理页面检查会话状态
- 登出时清除 Cookie

#### API 路由

- `POST /api/auth/login` - 登录（验证密码）
- `POST /api/auth/logout` - 登出
- `GET /api/auth/check` - 检查会话状态

#### Publisher 模式

特殊功能：未登录时隐藏部分内容（用于特定公众号）

**实现位置**：
- `app/blog/[slug]/page.tsx` 检查认证状态
- 未认证且文章标记为 `publisherOnly` 时显示登录提示

#### 配置密码

密码通过环境变量配置：

```env
ADMIN_PASSWORD=your-secure-password
```

### SEO 功能

#### 自动生成的 SEO 资源

1. **Sitemap**（`app/sitemap.xml/route.ts`）
   - 自动包含所有已发布文章
   - 包含首页和文章详情页
   - 动态生成，始终最新

2. **RSS Feed**（`app/feed.xml/route.ts`）
   - 标准 RSS 2.0 格式
   - 包含文章摘要和全文
   - 访问：`https://www.waqi.uk/feed.xml`

3. **结构化数据**（`app/blog/[slug]/page.tsx`）
   - JSON-LD Article schema
   - 包含：标题、作者、发布日期、图片
   - 增强 Google 搜索展示

4. **Meta 标签**
   - Open Graph（Facebook/社交分享）
   - Twitter Card（Twitter 分享）
   - 每篇文章自动生成

#### 阅读时间计算

```typescript
// lib/utils.ts
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}
```

## 技术实现细节

### gray-matter 和 Markdown 格式
文章文件格式示例：
```mdx
---
title: 文章标题
date: 2024-01-01T12:00:00Z
tags:
  - tag1
  - tag2
category: 分类
published: true
description: 文章描述
---

# 文章标题

这是第一个段落，使用 **Markdown** 格式编写。

## 二级标题

- 这是无序列表项 1
- 这是无序列表项 2

1. 这是有序列表项 1
2. 这是有序列表项 2

![图片说明](https://cloudinary-url.com/image.webp)

这是[链接](https://example.com)的示例。
```

**说明：**
- 前置块（YAML）：管理文章元数据（标题、日期、标签等）
- 内容块：使用标准 **Markdown** 格式，便于版本控制和可读性
- 图片 URL：指向 Cloudinary CDN（自动上传和优化）
- MDXRemote 渲染：自动解析 Markdown 并转换为 HTML 显示

### Cloudinary 集成
- **配置文件**：`lib/cloudinary.ts`
- **上传端点**：`app/api/upload/route.ts`
- **环境变量**：需要 `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`、`CLOUDINARY_API_KEY`、`CLOUDINARY_API_SECRET`
- **图片优化**：自动转换为 WebP、限制宽度为 1200px、应用质量压缩

### TipTap 编辑器配置
- **扩展**：StarterKit（基础功能）+ Image（图片）+ Placeholder（占位符）+ **Markdown**（输出 Markdown）
- **输出格式**：使用 `editor.storage.markdown.getMarkdown()` 获取 Markdown 格式内容
- **拖拽/粘贴处理**：
  - 在 `editorProps.handleDrop` 和 `handlePaste` 中处理图片上传
  - 粘贴 HTML 内容时自动清洗（移除危险标签和属性）
  - TipTap 自动将清洗后的 HTML 转换为 Markdown 导出
- **样式**：使用 Tailwind 的 prose 类提供优雅的内容排版
- **源代码模式**：可进入源代码模式查看和编辑 Markdown

## 环境变量配置

项目需要以下环境变量（在 `.env.local` 中）：
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_SITE_URL=https://www.waqi.uk  # 主域名，用于子域名识别和 SEO
```

### 子域名配置说明

项目支持通过子域名访问特定公众号的文章。子域名映射关系在 `lib/subdomain-config.ts` 中定义：

```typescript
export const SUBDOMAIN_SOURCE_MAP: Record<string, string> = {
  'wqws': '"瓦器微声"公众号',
  'yds': '"盐读书"公众号',
  'wbey': '"五饼二鱼能量站"公众号',
}
```

#### 访问行为

| 访问地址 | 显示内容 | 文章来源筛选 |
|---------|---------|------------|
| `www.waqi.uk` | 所有公众号文章 | ✅ 显示 |
| `wqws.waqi.uk` | 仅瓦器微声文章 | ❌ 隐藏 |
| `yds.waqi.uk` | 仅盐读书文章 | ❌ 隐藏 |
| `wbey.waqi.uk` | 仅五饼二鱼文章 | ❌ 隐藏 |

#### 添加新的子域名映射

如需添加新的公众号来源与子域名的映射：

1. 编辑 `lib/subdomain-config.ts`
2. 在 `SUBDOMAIN_SOURCE_MAP` 中添加新的映射项
3. 在 Vercel 项目设置中添加对应的域名
4. 在域名提供商的 DNS 配置中添加 CNAME 记录



## 开发注意事项

### 文件系统依赖
- 文章存储依赖本地文件系统（`content/posts/`），在 Vercel 部署时需要使用数据库或数据库方案
- 当前架构不适合无服务器环境的持久化存储

### TypeScript 配置
- 路径别名 `@/*` 映射到项目根目录，可以使用 `@/components`、`@/lib` 等
- 开启了 strict 模式，要求严格的类型检查

### Tailwind CSS
- 使用 prose 类进行文章内容排版
- 配置了 Cloudinary 图片的 Next.js 图片优化

### API 设计
- 文章 API (`/api/posts`) 支持 CRUD 操作
  - `GET ?slug=xxx` - 获取单篇文章
  - `GET` - 获取所有文章列表
  - `POST` - 创建新文章（触发 Git 同步）
  - `PUT` - 更新文章（触发 Git 同步）
  - `DELETE ?slug=xxx` - 删除文章（触发 Git 同步）

- 图片上传 API
  - `POST /api/upload` - 直接上传图片（本地文件、Base64）
  - `POST /api/proxy-upload` - 代理上传（CORS 受限 URL）

- 文章导入 API
  - `POST /api/fetch-wechat-article` - 导入微信公众号文章
    - Body: `{ url: string }`
    - 返回：`{ title, content, date, author, source }`

- 认证 API (`/api/auth/`)
  - `POST /api/auth/login` - 登录
    - Body: `{ password: string }`
    - 返回：设置 httpOnly Cookie
  - `POST /api/auth/logout` - 登出
  - `GET /api/auth/check` - 检查登录状态

- SEO API
  - `GET /feed.xml` - RSS 2.0 订阅源
  - `GET /sitemap.xml` - XML 网站地图

## 常见任务

### 添加新功能
1. 如果是 UI 组件，在 `components/` 下创建新文件
2. 如果涉及文章操作，在 `lib/posts.ts` 中添加新函数
3. 如果需要新 API，在 `app/api/` 下创建新路由文件

### 修改编辑器功能
- 编辑 `components/TipTapEditor.tsx`
- 可以在 TipTap 配置中添加新扩展
- 或修改 `editorProps` 处理拖拽/粘贴逻辑

### 部署到 Vercel

注意：需要在 Vercel 中配置环境变量。如果要持久化存储，考虑：
- 切换到数据库方案（如 MongoDB、PostgreSQL）
- 或使用 Vercel KV/Blob 存储

#### Vercel 子域名配置（必需）

1. **在 Vercel 项目中添加域名**
   - 登录 Vercel Dashboard → 选择项目 → Settings → Domains
   - 添加以下域名：
     - `www.waqi.uk`（主域名）
     - `wqws.waqi.uk`
     - `yds.waqi.uk`
     - `wbey.waqi.uk`

2. **配置 DNS 记录**
   - 登录您的域名提供商（例如：Cloudflare、阿里云、腾讯云）
   - 为每个子域名添加 CNAME 记录指向 Vercel：
     ```
     类型    名称    值
     CNAME   www     cname.vercel-dns.com
     CNAME   wqws    cname.vercel-dns.com
     CNAME   yds     cname.vercel-dns.com
     CNAME   wbey    cname.vercel-dns.com
     ```
   - DNS 生效通常需要 5-30 分钟

3. **环境变量配置**
   - Vercel Dashboard → 项目 → Settings → Environment Variables
   - 确保以下环境变量已正确设置：
     ```
     NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
     CLOUDINARY_API_KEY
     CLOUDINARY_API_SECRET
     NEXT_PUBLIC_SITE_URL=https://www.waqi.uk
     ```

#### 验证子域名配置

部署完成后，可以通过以下方式验证：

```bash
# 检查主域名
curl -I https://www.waqi.uk

# 检查子域名
curl -I https://yds.waqi.uk
curl -I https://wqws.waqi.uk
curl -I https://wbey.waqi.uk
```

所有域名应该返回 HTTP 200 状态码。

#### Bun 部署配置

1. 在 `package.json` 中添加 packageManager 字段：
   ```json
   {
     "packageManager": "bun@1.2.22"
   }
   ```
2. Vercel 将自动检测并使用 Bun 作为包管理器
3. 构建速度和依赖安装速度均会得到大幅提升
