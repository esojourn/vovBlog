# HTML粘贴自动上传图片 - 快速参考

## 核心文件

| 文件 | 用途 | 关键函数 |
|------|------|--------|
| `lib/imageProcessor.ts` | 图片处理工具库 | `processHtmlWithImages()` |
| `components/TipTapEditor.tsx` | 编辑器组件 | `processHtmlPaste()` |
| `/api/upload` | 上传API | 已有，无需改动 |

## 功能工作流

```
用户粘贴HTML → handlePaste事件 → processHtmlPaste()
→ processHtmlWithImages() → 提取图片 → 下载和上传 → 替换URL → 插入编辑器
```

## 支持的图片类型

| 类型 | 格式 | 处理方式 |
|------|------|---------|
| 远程URL | `https://example.com/pic.jpg` | 直接下载 → 上传 |
| Base64 | `data:image/png;base64,...` | 转File → 上传 |
| 相对路径 | `/images/pic.jpg` | 转绝对路径 → 下载 → 上传 |

## 配置参数

```typescript
// lib/imageProcessor.ts
const IMAGE_MAX_SIZE = 5 * 1024 * 1024        // 单张图片最大5MB
const DOWNLOAD_TIMEOUT = 5000                 // 下载超时5秒
const MAX_CONCURRENT_UPLOADS = 3              // 最多并发3个上传
const MAX_IMAGES_PER_PASTE = 20               // 单次最多20张图片
```

## 快速测试

1. 启动项目：`npm run dev`
2. 打开编辑页面：http://localhost:3000/admin/new
3. 从微信公众号/网页复制带图片的文章
4. 粘贴到编辑器（Ctrl+V）
5. 等待上传完成

## 进度提示

```
粘贴包含10张图片 → 显示进度条 → "正在处理粘贴内容... (3/10 张图片)"
                  ↓
            上传完成 → 自动插入编辑器 → 显示完整内容
```

## 错误处理

| 场景 | 处理方式 | 用户提示 |
|------|---------|--------|
| 图片下载失败 | 移除该图片 | 控制台日志 |
| CORS限制 | 移除该图片 | "部分图片由于安全限制无法上传" |
| 超时 | 移除该图片 | "图片下载超时，请检查网络" |
| 超大图片 | 移除该图片 | "图片文件过大（超过5MB）" |

## 常用开发命令

```bash
# 构建验证
npm run build

# 开发服务器
npm run dev

# 查看logs
# 打开浏览器F12 → Console标签
```

## 日志查看

浏览器控制台会显示：
```
✓ 粘贴内容处理成功
✓ 成功提取 5 张图片
✗ 图片上传失败 (https://example.com/img.jpg): HTTP 404
⚠ 粘贴内容包含 25 张图片，限制为 20 张。超出部分将被移除。
```

## 开发者快速修改

### 增加图片数量限制
```typescript
// lib/imageProcessor.ts, 第9行
const MAX_IMAGES_PER_PASTE = 50  // 改为50张
```

### 增加并发数
```typescript
// lib/imageProcessor.ts, 第8行
const MAX_CONCURRENT_UPLOADS = 5  // 改为5个
```

### 修改相对路径基础URL
```typescript
// lib/imageProcessor.ts, resolveRelativeUrl函数
baseUrl: string = 'https://example.com'  // 改为你需要的域名
```

### 禁用HTML粘贴功能
```typescript
// components/TipTapEditor.tsx, handlePaste函数
// 注释掉 HTML 处理部分
/*
const htmlItem = items.find((item) => item.type === 'text/html')
if (htmlItem) { ... }
*/
```

## 故障排查

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 粘贴无反应 | API调用失败 | 检查控制台错误信息 |
| 图片未上传 | Cloudinary配置错误 | 验证.env.local配置 |
| CORS错误 | 跨域限制 | 这是正常的，系统会移除这些图片 |
| 上传很慢 | 网络较差或图片过多 | 检查网络连接，或减少图片数量 |

## 相关文档

- `IMPLEMENTATION_SUMMARY.md` - 详细实现说明
- `TESTING_GUIDE.md` - 完整测试指南
- `lib/imageProcessor.ts` - 源代码注释

## 技术栈

- **编辑器**：TipTap + ProseMirror
- **图片存储**：Cloudinary
- **HTML处理**：DOMPurify + DOMParser
- **框架**：Next.js + React
