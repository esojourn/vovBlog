# Playwright 浏览器安装问题修复指南

## 问题背景

您在设置本地开发环境时遇到了 Playwright 浏览器版本不匹配的错误：

```
[WeChat Fetch] 爬取失败: browserType.launch: Executable doesn't exist at
/home/dx/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell
```

### 根本原因

- 项目原本使用 `playwright-core`（轻量级版本，不自动下载浏览器）
- `playwright-core` 要求手动安装匹配的浏览器版本
- 不同版本的 `playwright-core` 需要不同版本的浏览器
- 用户之前可能安装了不匹配版本的浏览器，导致启动失败

## 解决方案

已将项目依赖从 `playwright-core` 升级到完整版 `playwright`。

### 主要改动

#### 1. package.json 更新

**替换依赖包：**
```json
{
  "dependencies": {
    "playwright": "^1.56.1"  // 原来是 "playwright-core": "^1.56.1"
  },
  "scripts": {
    "postinstall": "playwright install chromium --with-deps || true"
  }
}
```

**优势：**
- ✅ 自动下载匹配版本的浏览器
- ✅ `bun install` 时自动完成浏览器安装
- ✅ 零配置，无需手动版本管理
- ✅ 避免版本不匹配问题

#### 2. 代码更新

**文件：** `app/api/fetch-wechat-article/route.ts`

```typescript
// 修改前
import { chromium } from 'playwright-core'

// 修改后
import { chromium } from 'playwright'
```

两个包的 API 完全兼容，无需修改其他代码。

#### 3. README 简化

```bash
# WSL/Linux 用户仅需运行一次
bunx playwright install-deps chromium
```

**改进说明：**
- Playwright 浏览器在 `bun install` 时自动下载
- 上述命令仅用于安装系统级依赖库（libatk、libnss3 等）
- Windows/macOS 用户通常无需此步骤

## 新的安装流程

### 完整流程（仅 5 个步骤）

```bash
# 1. 克隆项目
git clone https://github.com/esojourn/vovBlog.git
cd vovBlog

# 2. 安装依赖（自动下载浏览器）
bun install

# 3. [仅 WSL/Linux] 安装系统依赖
bunx playwright install-deps chromium

# 4. 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local，填入 Cloudinary 凭据

# 5. 启动开发服务器
bun run dev
```

### 如何验证安装成功

```bash
# 检查 Playwright 版本
bunx playwright --version
# 输出：Version 1.57.0

# 检查浏览器缓存
ls ~/.cache/ms-playwright/chromium*
# 应该看到 chromium-1200 目录
```

## 微信文章导入功能测试

安装完成后，可以测试微信导入功能：

1. 启动开发服务器：`bun run dev`
2. 在浏览器中访问：`http://localhost:3000/admin/new`
3. 在"原文链接"字段粘贴微信公众号文章 URL（例如 `https://mp.weixin.qq.com/s/...`）
4. 点击"导入"按钮
5. 等待 3-5 秒，标题和正文应该自动填充到编辑器

## 系统依赖说明（仅 WSL/Linux）

如果在 WSL 或 Linux 环境中，首次运行时可能需要安装系统库：

```bash
# 一次性安装（后续无需重复运行）
bunx playwright install-deps chromium
```

**此命令会安装以下依赖库：**
- libatk1.0-0
- libatk-bridge2.0-0
- libcups2
- libdbus-1-3
- libdrm2
- libgbm1
- libglib2.0-0
- libnspr4
- libnss3
- libpango-1.0-0
- libpangocairo-1.0-0
- libxcomposite1
- libxdamage1
- libxfixes3
- libxrandr2
- libxss1
- fonts-noto-cjk
- fonts-noto-cjk-extra

## FAQ

### Q: 为什么改用完整版 Playwright？

A: 完整版 `playwright` 包含浏览器的自动下载脚本，提供更好的用户体验。`playwright-core` 虽然体积小，但需要手动管理浏览器版本，容易出错。

### Q: 包体积会增加吗？

A:
- npm 上的包增加约 1-2MB（可忽略）
- 浏览器二进制文件（首次下载）约 150MB，但只需下载一次
- 后续 `bun install` 无需重复下载

### Q: 是否需要清理旧浏览器？

A: 已自动清理。系统会下载新版本的浏览器，旧版本可以手动删除以节省磁盘空间：

```bash
rm -rf ~/.cache/ms-playwright/chromium-1200
rm -rf ~/.cache/ms-playwright/firefox-1497
rm -rf ~/.cache/ms-playwright/webkit-2227
```

### Q: 如何重新安装浏览器？

A: 只需重新运行 `bun install`，postinstall 脚本会自动安装浏览器。

### Q: Windows/macOS 需要运行系统依赖命令吗？

A: 不需要。`bunx playwright install-deps` 仅在 Linux/WSL 上需要，其他平台可以跳过。

### Q: 如果仍然遇到问题怎么办？

A:
1. 清除缓存：`rm -rf ~/.cache/ms-playwright/`
2. 重新安装：`bun install`
3. 在 WSL/Linux 上运行：`bunx playwright install-deps chromium`
4. 检查日志：`bun run dev`

## 相关文件

- **修改的文件：**
  - `package.json` - 依赖包更新
  - `app/api/fetch-wechat-article/route.ts` - import 语句更新
  - `README.md` - 安装说明简化

- **文档：**
  - `CLAUDE.md` - 项目架构和技术细节
  - `DEPLOY.md` - 生产部署指南
  - `WECHAT_FIX_GUIDE.md` - 微信导入故障排查

## 反馈和支持

如遇问题，可以：
1. 查看相关文档（上述列出的文件）
2. 检查控制台错误日志
3. 在 GitHub Issues 上报告问题
