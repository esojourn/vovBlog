# VovBlog 快速开始指南

## 🎉 恭喜！项目已成功创建

VovBlog 是一个基于 Next.js 15、TipTap 编辑器和 Cloudinary 的现代博客系统。

## 📋 下一步操作

### 1. 配置 Cloudinary（必需）

在运行项目之前，您需要配置 Cloudinary 图片存储服务：

#### 1.1 注册 Cloudinary 免费账号

访问：https://cloudinary.com/users/register_free

#### 1.2 获取 API 凭据

登录后访问控制台：https://cloudinary.com/console

记录以下信息：
- **Cloud Name**
- **API Key**
- **API Secret**

#### 1.3 配置环境变量

创建 `.env.local` 文件：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，填入您的 Cloudinary 凭据：

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

### 3. 开始使用

#### 查看首页
访问：http://localhost:3000
- 查看示例文章
- 测试搜索功能
- 体验标签筛选

#### 创建新文章
访问：http://localhost:3000/admin/new

**功能亮点：**
- ✅ 直接粘贴图片（Ctrl+V / Cmd+V）自动上传
- ✅ 拖拽图片到编辑器
- ✅ 从网页复制内容保留格式（h1-h6）
- ✅ 支持 Markdown 风格编辑
- ✅ 实时预览

#### 管理文章
访问：http://localhost:3000/admin
- 查看所有文章（包括草稿）
- 编辑已发布的文章
- 删除文章

## 🎯 核心功能

### 编辑器功能
- **粗体**、*斜体* 格式化
- 标题（H1-H6）
- 无序列表、有序列表
- 图片上传（粘贴/拖拽/选择）
- 代码块

### 内容管理
- 标签系统
- 分类管理
- 草稿/发布状态
- 全文搜索
- 标签筛选

### 图片处理（Cloudinary）
- 自动压缩优化
- WebP 格式转换
- 响应式图片
- CDN 全球加速
- 免费 25GB 存储 + 25GB 流量/月

## 📝 创建您的第一篇文章

1. 访问 http://localhost:3000/admin/new
2. 填写标题：例如"我的第一篇博客"
3. 添加描述（可选）
4. 选择分类：例如"随笔"
5. 添加标签：例如"开始"、"欢迎"
6. 在编辑器中写作
7. 尝试粘贴一张图片（Ctrl+V）
8. 点击"发布文章"

## 🚀 部署到 Vercel

详见 `DEPLOYMENT.md` 文件，包含完整的部署指南。

简要步骤：
1. 将代码推送到 GitHub
2. 访问 https://vercel.com 并导入项目
3. 配置环境变量（Cloudinary 凭据）
4. 点击部署

## 🛠️ 常用命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint
```

## 📂 项目结构

```
VovBlog/
├── app/                  # Next.js App Router
│   ├── admin/           # 管理后台
│   ├── blog/[slug]/     # 文章详情
│   └── api/             # API 路由
├── components/          # React 组件
├── lib/                 # 工具函数
├── content/posts/       # MDX 文章
└── public/              # 静态资源
```

## 📚 技术栈

- **Next.js 15** - React 框架
- **TipTap** - 富文本编辑器
- **Cloudinary** - 图片存储和 CDN
- **Tailwind CSS** - 样式框架
- **TypeScript** - 类型安全
- **MDX** - Markdown + JSX

## 💡 使用技巧

### 图片上传的三种方式
1. **粘贴**：复制图片后 Ctrl+V
2. **拖拽**：直接拖到编辑器
3. **按钮**：点击工具栏图片按钮

### 复制网页内容
从其他网页复制文字时，标题格式会自动保留：
- 复制的 H1 → 博客中的 H1
- 复制的 H2 → 博客中的 H2
- 以此类推

### 草稿功能
- 点击"保存草稿"不会公开发布
- 可以在管理后台继续编辑
- 准备好后点击"发布文章"

## ❓ 遇到问题？

### 图片无法上传
- 检查 `.env.local` 配置是否正确
- 确保 Cloudinary 账号有足够额度
- 查看浏览器控制台错误信息

### 文章不显示
- 确保文章设置为"已发布"
- 检查 `content/posts/` 目录是否存在
- MDX 文件格式是否正确

### 开发服务器无法启动
- 删除 `.next` 目录后重试
- 运行 `npm install` 重新安装依赖

## 📖 更多文档

- `README.md` - 项目说明
- `DEPLOYMENT.md` - 部署指南

## 🎨 自定义

### 修改样式
编辑 `app/globals.css` 和 `tailwind.config.ts`

### 修改布局
编辑 `app/layout.tsx`

### 添加页面
在 `app/` 目录下创建新文件夹

---

**祝您使用愉快！如有问题，欢迎提交 Issue。** 🚀
