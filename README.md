# VovBlog - Voice of Vessel

为了转载保存一些微信公众号的文章，我开发了这个程序。

- ✨✨✨ **一键导入微信公众号文章**！支持自动提取标题、正文、图片。直接输入 URL，内容自动填充到编辑器！
- ✨✨ 使用免费的 Vercel / Cloudinary 额度，足够个人用户使用。
- ✨ 使用 Cloudinary存储图片，兼顾墙内浏览速度，并且无需复杂的实名注册流程。

实例预览：https://vov-blog.vercel.app

## 🚀 快速开始

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fesojourn%2FvovBlog)
获取 Cloudinary API Key：https://cloudinary.com
点击 "Deploy with Vercel"，设置环境变量；开始使用吧！ 😎👍


## ✨ 特性

- 🤖 **微信公众号一键导入**：输入公众号文章 URL，自动提取标题、正文和图片，自动上传到 Cloudinary
  - 使用 Playwright 无头浏览器，智能绕过反爬虫检测
  - 自动清洗 HTML，确保 MDX 编译兼容
  - 提取的图片自动上传到 Cloudinary CDN，墙内高速访问
  - 支持编辑导入内容，灵活调整
- 📝 **强大的富文本编辑器**：基于 TipTap，类似 Notion 的编辑体验
- 🖼️ **智能图片处理**：支持粘贴、拖拽上传，自动优化和 CDN 加速
- 🔍 **混合全文搜索**（v1.2.0 新增）：程序首先搜索元数据（标题、标签、分类），保持初次装载仅有70KB。保持运行急速流畅。当在元数据中没有搜索结果时，自动切换全文搜索。
- 🌐 **子域名访问支持**（v1.2.0 新增）：通过子域名访问特定公众号的文章，支持多公众号独立展示
- 🏷️ **标签和分类系统**：灵活的内容组织方式
- 📱 **响应式设计**：在任何设备上都有良好的阅读体验
- ⚡ **极速部署**：零配置部署到 Vercel
- 📱 **远程发布**（v1.4.0 新增）：通过 Cloudflare Tunnel 在手机上发布文章
- 🔒 **登录限流**（v1.4.0 新增）：防止暴力破解，15 分钟最多 5 次尝试
- 🚀 **Git 自动同步**（v1.4.0 新增）：保存后自动推送到 GitHub，触发 Vercel 部署
- 🔍 **SEO 优化**（v1.3.0 新增）：增强搜索引擎索引能力
  - 增强 sitemap.xml：支持 Google News 扩展，搜索引擎可直接看到中文标题
  - RSS Feed 订阅：完整的文章 feed，支持 RSS 阅读器订阅 (`/feed.xml`)
  - HTML 站点地图：用户友好的文章列表页面 (`/sitemap-page`)
  - JSON-LD 结构化数据：帮助搜索引擎理解文章内容，提升 Rich Snippets 显示
  - Open Graph 和 Twitter Card：优化社交媒体分享显示

## 🚀 本地部署 
文章发布需要本地部署。在本地发布后，文章保存为.mdx文件。git push到github后，自动同步vercel。这样设计的原因是：
1. 不需要数据库支持，避免依赖付费服务。
2. 微信公众号阻挡爬虫抓取，但支持本地浏览。程序使用本地无头浏览器访问，不会触发反爬虫检测。

进行以下步骤时，先确认上面“快速开始”中，线上vercel环境已经完成部署。

### 1. 克隆项目

```bash
# 克隆仓库到本地
git clone https://github.com/esojourn/vovBlog.git
cd vovBlog
```

### 2. 安装 Node.js 环境

访问 [nodejs.org](https://nodejs.org) 下载并安装 LTS 版本（推荐 24.x）。

### 3. 安装依赖

```bash
# 安装 Bun（超快的 JavaScript 运行时和包管理器）
curl -fsSL https://bun.com/install | bash

# 或者在 Windows 上使用
powershell -c "irm bun.sh/install.ps1|iex"

# 刷新环境变量（如果需要）
source ~/.bashrc  # Linux/macOS
# 或重启终端

# 验证 Bun 安装
bun --version

# 安装项目依赖
bun install
```

**WSL/Linux 用户额外步骤（用于微信文章导入）：**

首次使用时需要安装系统依赖库：

```bash
# 安装 Chromium 所需的系统库（仅需运行一次）
bunx playwright install-deps chromium
```

**说明：**
- Playwright 浏览器会在 `bun install` 时自动下载
- 上述命令仅用于安装操作系统级别的依赖库（如 libatk、libnss3 等）
- Windows/macOS 用户通常不需要此步骤

**注意：** 本项目使用 Bun 作为包管理器，比 npm 快 6-10 倍。如果未安装 Bun，可以使用 npm 或 yarn 替代：
```bash
npm install  # 或 yarn install
```

### 4. 配置环境变量

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

### 5. 启动开发服务器

```bash
bun run dev
```

访问 `http://localhost:3000` 查看您的博客。

### 6. 部署到生产环境

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

## 📱 远程发布配置 (可选)

如果你希望在手机或其他设备上远程发布文章，可以配置 Cloudflare Tunnel。

### 为什么需要远程发布？

- 📱 **手机发布**：随时随地发布文章，不受地点限制
- 🔒 **安全访问**：双重认证保护，无需暴露端口
- ⚡ **自动同步**：保存后自动推送到 GitHub，触发 Vercel 部署
- 🌐 **动态 IP 友好**：无需配置 DDNS 或端口转发

### 工作原理与安全说明

#### Cloudflare Tunnel 工作流程

```
外部用户                 Cloudflare Edge          你的本地电脑
   ↓                          ↓                       ↓
访问 https://admin.domain/admin
   ↓                          ↓
   └──────→ (HTTPS 443) ─────→ Cloudflare 边缘服务器
                              ↓ (加密隧道)
                        Cloudflare Tunnel 协议
                        (QUIC/HTTP2，动态端口)
                              ↓
                        本地 cloudflared 客户端
                        (出站连接，无需开放端口)
                              ↓
                         http://localhost:3000
                              ↓
                         Next.js 开发服务器
```

#### 关键特性

**1. 无需开放公网端口**
- 本地电脑不监听任何公网端口
- 不需要配置路由器端口转发
- cloudflared 主动连接到 Cloudflare（出站连接）

**2. 443 端口位置**
- HTTPS 443 端口**仅在 Cloudflare Edge 服务器**（美国）
- 本地服务运行在 `localhost:3000`（内网）
- 两者通过加密 Tunnel 连接

**3. 法律合规性** ✅
- ✅ 完全合法，无需 ICP 备案
- ✅ 出站连接符合家庭宽带使用规范
- ✅ 不违反任何中国法律法规
- ✅ 真正的 Web 服务运行在 Cloudflare 海外服务器

#### 与传统端口转发的对比

| 特性 | Cloudflare Tunnel | 传统端口转发 |
|-----|------------------|------------|
| 本地开放端口 | ❌ 不需要 | ✅ 需要开放 443 |
| 路由器配置 | ❌ 不需要 | ✅ 需要端口转发 |
| 公网 IP 要求 | ❌ 不需要 | ✅ 需要固定/动态IP |
| 法律风险 | ✅ 无风险 | ⚠️ 可能需要备案 |
| 安全性 | ✅ 高（双重认证） | ⚠️ 需自行加固 |
| 动态 IP 友好 | ✅ 完全支持 | ❌ 需配置 DDNS |

### 前提条件

- ✅ 已完成上述"本地部署"步骤
- ✅ 拥有 Cloudflare 账号（免费）
- ✅ 域名已托管在 Cloudflare（或可添加子域名）
- ✅ 本地电脑保持开机运行

### 配置步骤

#### 1. 安装 cloudflared

**macOS:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Windows:**
```bash
winget install Cloudflare.cloudflared
```

**Linux:**
访问 [官方安装指南](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)

#### 2. 登录 Cloudflare

```bash
cloudflared tunnel login
```

浏览器会打开，选择你的域名（如 `waqi.uk`）并授权。

#### 3. 创建 Tunnel

```bash
# 创建名为 vovblog-publisher 的隧道
cloudflared tunnel create vovblog-publisher

# 记录输出的 Tunnel ID（后续需要）
```

#### 4. 配置 Tunnel

创建或编辑 `~/.cloudflared/config.yml`：

```yaml
tunnel: <粘贴上步获得的 TUNNEL_ID>
credentials-file: ~/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: admin.domain  # 修改为你的子域名
    service: http://localhost:3000
  - service: http_status:404
```

#### 5. 配置 DNS

```bash
# 自动创建 CNAME 记录
cloudflared tunnel route dns vovblog-publisher admin.domain
```

#### 6. 配置 Cloudflare Access (推荐)

访问 [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com)：

1. **创建 Access Application**
   - Application name: `VovBlog Publisher`
   - Application domain: `admin.domain`
   - Path: `/admin/*`

2. **创建 Access Policy**
   - Policy name: `Admin Only`
   - Action: `Allow`
   - Include rules (选择以下之一):
     - **Email**: 你的邮箱（推荐）
     - **One-time PIN**: 每次访问发送验证码
     - **IP Range**: 你的常用 IP 段

3. **Session Duration**: 设置为 24 小时

#### 7. 启动发布服务

**Linux/Mac:**
```bash
./scripts/start-publisher.sh
```

**Windows:**
```bash
.\scripts\start-publisher.bat
```

或双击运行 `start-publisher.bat` 文件。

#### 8. 访问远程发布界面

1. 手机浏览器访问 `https://admin.domain/admin`
2. 通过 Cloudflare Access 验证（首次或会话过期时）
3. 输入 admin 密码登录
4. 使用完整的发布界面创建/编辑文章
5. 保存后自动推送到 GitHub → Vercel 自动部署

### 安全说明

远程发布采用双重认证机制：

1. **第一层**：Cloudflare Access（邮箱/PIN 验证）
2. **第二层**：应用密码登录（带限流保护）
   - 15 分钟内最多 5 次登录尝试
   - 超限后需等待冷却时间

建议设置强密码（至少 16 位，包含大小写、数字、特殊字符）。

### 故障排查

**Q: 无法访问 admin.domain？**
- 检查 Tunnel 是否正在运行：`cloudflared tunnel info vovblog-publisher`
- 检查 DNS 记录是否生效（可能需要 5-10 分钟）
- 确认本地开发服务器正在运行（localhost:3000）

**Q: Cloudflare Access 无法验证？**
- 检查 Access Application 配置是否正确
- 确认邮箱地址与 Cloudflare 账户一致
- 检查垃圾邮件文件夹（如果使用 PIN 验证）

**Q: Git 自动同步失败？**
- 检查 Git 凭证是否正确配置
- 查看服务器日志：`[GitSync]` 开头的日志信息
- 手动测试：`git push` 是否正常工作

### 7. 创建文章

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
   - 自动格式转换（WebP）
   - 质量优化
   - 最大宽度限制（1200px）
   - CDN 加速
- ✅ 自动清洗 HTML，确保兼容性

#### 方法二：手动创建文章

1. 访问 `/admin/new` 创建新文章
2. 填写标题等
3. 在编辑器中写作或粘贴
5. 直接粘贴图片到编辑器，自动上传
6. 支持拖拽上传图片
7. 从其他网页复制内容时，自动保留格式

## 📋 版本更新 (v1.4.0)

### 🎉 新增功能

1. **📱 远程发布支持** ⭐ 核心功能
   - 通过 Cloudflare Tunnel 实现手机远程发布文章
   - 访问 `admin.domain/admin` 即可在任何设备上发布
   - 双重认证机制：Cloudflare Access + 应用密码
   - 零端口转发配置，安全便捷

2. **🔒 登录限流保护**
   - 防止暴力破解攻击
   - 15 分钟内最多 5 次登录尝试
   - 超限后显示倒计时提示
   - 支持 Cloudflare 真实 IP 识别

3. **🚀 Git 自动同步**
   - 文章保存后自动推送到 GitHub
   - 后台异步处理，不阻塞请求
   - 自动触发 Vercel 部署
   - 无需手动 git push

4. **🛠️ 便捷启动脚本**
   - 一键启动开发服务器和 Tunnel
   - 支持 Linux/Mac/Windows 平台
   - 自动检查依赖和环境配置

---

## 📋 版本更新 (v1.3.0)

### 🎉 新增功能

1. **增强 SEO 优化** ⭐ 搜索引擎友好
   - **增强 sitemap.xml**：
     - 添加 Google News 扩展（`<news:title>`），搜索引擎可直接看到中文标题
     - 添加 Image 扩展，支持文章图片索引
     - 即使 URL 使用拼音，搜索引擎也能正确理解中文内容

   - **RSS Feed** (`/feed.xml`)：
     - 支持 RSS 2.0 标准
     - 包含所有文章的完整信息（标题、描述、分类、标签）
     - 搜索引擎可订阅以发现新文章
     - 用户可使用 RSS 阅读器订阅

   - **HTML 站点地图** (`/sitemap-page`)：
     - 用户友好的文章列表页面
     - 按分类组织展示所有文章
     - 为爬虫提供额外的索引入口

   - **结构化数据**：
     - Article JSON-LD Schema：帮助搜索引擎理解文章结构
     - Organization JSON-LD Schema：标识网站身份
     - WebSite JSON-LD Schema：支持搜索框识别

   - **完善元数据**：
     - Open Graph 标签：优化 Facebook、LinkedIn 等社交媒体分享
     - Twitter Card 标签：优化 Twitter 分享显示
     - Keywords、Robots、Canonical URL 等 SEO 标签
     - HTML `<link>` 声明：自动发现 RSS Feed 和 Sitemap

2. **SEO 效果**：
   - ✅ 搜索引擎可直接看到中文标题（通过 sitemap News 扩展的 `<news:title>`）
   - ✅ 支持 RSS 订阅，爬虫可发现新文章
   - ✅ HTML Sitemap 为爬虫提供额外索引入口
   - ✅ JSON-LD Schema 提升搜索结果显示质量（Rich Snippets）
   - ✅ 社交媒体分享显示优化（Open Graph）
   - ✅ URL 保持拼音形式，搜索引擎仍能理解中文内容

---

## 📋 版本更新 (v1.2.0)

### 🎉 新增功能

1. **子域名访问支持** ⭐ 核心功能
   - 支持通过子域名访问特定公众号的文章
   - 子域名映射：
     - `wqws.waqi.uk` → 瓦器微声公众号
     - `yds.waqi.uk` → 盐读书公众号
     - `wbey.waqi.uk` → 五饼二鱼能量站公众号
     - `www.waqi.uk` → 主域名（显示所有内容）
   - 在子域名访问时自动隐藏文章来源筛选

2. **混合全文搜索**
   - 支持标题、标签、分类等多维度搜索
   - 增强搜索体验，更快找到需要的文章

### 🔧 Bug 修复
- ✅ 修复中文阅读时间计算
- ✅ 修复布局问题

### 📝 其他改进
- 更新 CLAUDE.md 添加完整的子域名配置说明和 Vercel 部署指南
- 更正环境变量示例中的主域名配置

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
│   ├── blog/[slug]/       # 文章详情页（含 JSON-LD Schema）
│   ├── api/               # API 路由
│   │   ├── posts/         # 文章 CRUD 操作
│   │   ├── upload/        # 图片上传到 Cloudinary
│   │   ├── proxy-upload/  # 代理上传（绕过 CORS）
│   │   └── fetch-wechat-article/ # ⭐ 微信公众号导入
│   ├── sitemap.xml/       # 🆕 增强 sitemap（Google News 扩展）
│   ├── feed.xml/          # 🆕 RSS Feed
│   ├── sitemap-page/      # 🆕 HTML 站点地图
│   ├── layout.tsx         # 根布局（含 JSON-LD Schema）
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

## 🔍 SEO 功能说明

### Sitemap.xml
访问 `/sitemap.xml` 查看增强的站点地图，包含：
- **Google News 扩展**：每篇文章的中文标题直接在 XML 中显示（`<news:title>`）
- **Image 扩展**：文章图片信息
- **完整文章列表**：所有发布的文章都包含在 sitemap 中

搜索引擎通过 sitemap.xml 可以：
- 发现所有文章，即使 URL 使用拼音形式
- 识别文章的中文标题（通过 `<news:title>` 标签）
- 了解文章的更新时间和优先级

### RSS Feed
访问 `/feed.xml` 获取 RSS 订阅源，支持：
- **RSS 阅读器**：在 Feedly、Inoreader 等 RSS 阅读器中订阅
- **搜索引擎自动发现**：爬虫可订阅以发现新文章
- **完整文章信息**：包含标题、描述、分类、标签等
- **标准 RSS 2.0 格式**：兼容所有标准 RSS 阅读器

### HTML 站点地图
访问 `/sitemap-page` 查看用户友好的文章列表：
- **分类展示**：所有文章按分类组织
- **发布日期**：每篇文章显示发布日期
- **统计信息**：显示总文章数、分类数、最新更新时间
- **便于浏览**：用户可以通过站点地图浏览所有文章
- **爬虫索引**：为搜索引擎提供额外的索引入口

### 结构化数据（JSON-LD）
所有页面自动包含 JSON-LD 结构化数据：

**文章页面** (`/blog/[slug]`)：
- `Article` Schema：标题、作者、发布日期、描述等
- 帮助搜索引擎理解文章结构
- 使用 `<script type="application/ld+json">` 标签

**首页和所有页面**：
- `Organization` Schema：标识网站身份
- `WebSite` Schema：支持搜索框识别
- 提升搜索结果中的富文本片段（Rich Snippets）显示

### 社交媒体分享优化
所有页面都配置了社交媒体标签：

**Open Graph 标签**：
- 优化 Facebook、LinkedIn、Pinterest 等社交媒体分享效果
- 显示标题、描述、图片等信息

**Twitter Card 标签**：
- 优化 Twitter 分享显示
- 支持 summary_large_image 格式

### SEO 元数据
所有页面都包含完整的 SEO 元数据：
- `<title>`：网页标题（包含关键词）
- `<meta name="description">`：页面描述
- `<meta name="keywords">`：关键词
- `<meta name="robots">`：爬虫指令
- `<link rel="canonical">`：规范化 URL
- `<link rel="alternate" type="application/rss+xml">`：自动发现 RSS Feed

### SEO 验证清单

部署后，建议进行以下验证以确保 SEO 优化有效：

1. **Google Search Console**：
   - 提交 `https://www.waqi.uk/sitemap.xml`
   - 检查"覆盖范围"中是否包含所有文章
   - 检查"增强内容"中的"文章"部分

2. **结构化数据测试**：
   - 使用 [Google Rich Results Test](https://search.google.com/test/rich-results)
   - 输入文章页面 URL，验证 Article Schema 是否正确识别

3. **Open Graph 测试**：
   - 使用 [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - 输入文章 URL，查看社交媒体分享预览

4. **RSS Feed 验证**：
   - 访问 `https://www.waqi.uk/feed.xml`
   - 在 [W3C Feed Validator](https://validator.w3.org/feed/) 验证格式
   - 在 RSS 阅读器（如 Feedly）中测试订阅

5. **Sitemap 验证**：
   - 访问 `https://www.waqi.uk/sitemap.xml` 查看 XML 格式
   - 检查是否包含所有文章的中文标题（`<news:title>` 标签）

6. **移动设备友好性**：
   - 使用 [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
   - 确保网站在移动设备上的显示效果

## 🔧 环境变量说明

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | 是 |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | 是 |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | 是 |
| `NEXT_PUBLIC_SITE_URL` | 网站 URL（用于 SEO） | 否 |
| `ADMIN_PASSWORD` | 管理员密码（建议 16 位以上，包含大小写、数字、特殊符号） | 是 |

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Made with ❤️ using Next.js and Cloudinary**
