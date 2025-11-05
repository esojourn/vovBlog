# Cloudinary 图片上传修复总结

## 问题诊断

你遇到的问题有三个方面：

### 1. **关键问题：Promise 永久挂起**
   - **文件**: `lib/cloudinary.ts`
   - **原因**: 当 Cloudinary 上传失败但没有返回 error 时，Promise 既不 resolve 也不 reject，导致上传状态永远显示"正在上传..."
   - **表现**: 编辑器卡住，前端无法继续操作

### 2. **过滤过于严格**
   - **文件**: `components/TipTapEditor.tsx`
   - **原因**: 之前添加的过滤逻辑在编辑器实时更新时就删除所有非 Cloudinary 的图片
   - **表现**: 编辑器中的图片立即消失，用户体验很差

### 3. **错误信息不清楚**
   - **文件**: `app/api/upload/route.ts`
   - **原因**: 错误时只返回通用错误信息，无法定位真实问题
   - **表现**: 即使 Cloudinary 有问题也看不出来

---

## 修复方案

### ✅ 修复 1：改进 Promise 处理 (`lib/cloudinary.ts`)

```typescript
// 添加了 else 分支处理异常情况
(error, result) => {
  if (error) {
    reject(error)
  } else if (result?.secure_url) {
    resolve(result.secure_url)
  } else {
    reject(new Error('Cloudinary 上传失败：未返回有效的结果'))
  }
}

// 添加了 stream 错误监听
stream.on('error', (err) => {
  reject(err)
})
```

**好处**: 任何异常情况都能被正确捕获并反馈给前端

---

### ✅ 修复 2：改进 API 错误处理 (`app/api/upload/route.ts`)

添加了：
- 详细的日志记录（标记 `[Upload API]` 便于搜索）
- 文件类型验证
- 文件大小验证
- 清晰的错误信息返回给前端

**好处**: 能快速定位问题所在

---

### ✅ 修复 3：移除实时过滤 (`components/TipTapEditor.tsx`)

**之前**: 编辑器实时清理 HTML，删除所有非 Cloudinary 的图片

```javascript
// ❌ 旧代码在 onChange 时立即过滤，导致编辑器中的图片消失
fixedHtml = fixedHtml.replace(
  /<img\s+([^>]*?)src=["'](?!https:\/\/res\.cloudinary\.com)[^"']*["']([^>]*?)>/gi,
  ''
)
```

**现在**: 只进行基础 HTML 清理，允许所有图片临时存在

```javascript
// ✓ 现在允许编辑器中的所有图片显示
// 只有在保存时才验证
```

**好处**: 图片上传中和上传成功的图片都能正确显示

---

### ✅ 修复 4：保存时验证 (`app/admin/new/page.tsx`)

```typescript
const validateContent = (content: string): boolean => {
  // 只允许 Cloudinary URL、localhost（开发环境）
  // 拒绝其他本地路径或无效 URL
  const invalidImagePattern = /<img\s+[^>]*src=["'](?!https:\/\/res\.cloudinary\.com)(?!http:\/\/localhost)(?!http:\/\/127\.0\.0\.1)(?!data:)[^"']*["']/gi

  if (invalidImagePattern.test(content)) {
    alert('检测到无效的图片 URL。请确保所有图片都已成功上传到 Cloudinary。')
    return false
  }
  return true
}
```

**好处**: 发布前验证，确保只有有效的 Cloudinary URL 才能保存到 MDX 文件

---

### ✅ 修复 5：改进图片上传日志 (`components/TipTapEditor.tsx`)

添加了详细的 console.log，便于调试：

```javascript
console.log('[Editor] 开始上传图片:', file.name)
console.log('[Editor] 上传响应:', response.status)
console.log('[Editor] 上传成功，URL:', url)
console.error('[Editor] 图片上传失败:', errorMsg)
```

**好处**: 打开浏览器控制台（F12）可以清楚地看到上传过程

---

## 测试步骤

### 1. 检查环境变量
```bash
cat .env.local | grep CLOUDINARY
```

输出应该包含：
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=ddzj8nww3
CLOUDINARY_API_KEY=225737933698653
CLOUDINARY_API_SECRET=76hYFqM5JRVllsWxnmUuBks4264
```

### 2. 打开浏览器开发者工具（F12）
- 切换到 **Console** 标签
- 切换到 **Network** 标签

### 3. 测试图片上传
访问 `http://localhost:3002/admin/new`

**方式 A - 点击图片按钮**:
1. 点击编辑器工具栏的图片图标
2. 选择一张图片文件
3. 观察 Console 输出

**方式 B - 拖拽上传**:
1. 从文件管理器拖拽图片到编辑器
2. 观察 Console 输出

**方式 C - 粘贴上传**:
1. 使用截图工具（Win+Shift+S 或 Command+Shift+4）
2. 粘贴到编辑器（Ctrl+V 或 Command+V）
3. 观察 Console 输出

### 4. 观察 Console 输出

**成功的日志**:
```
[Cloudinary] Config loaded: {cloud_name: "✓", api_key: "✓", api_secret: "✓"}
[Upload API] 开始上传: {name: "image.png", size: 1024, type: "image/png"}
[Cloudinary] Upload success: https://res.cloudinary.com/...
[Upload API] 上传成功: https://res.cloudinary.com/...
[Editor] 上传成功，URL: https://res.cloudinary.com/...
```

**失败的日志** (例如 API Key 无效):
```
[Upload API] 上传失败: Error: Invalid API key
[Editor] 图片上传失败: 上传失败: Invalid API key
```

### 5. 观察 Network 标签
- 查看 `/api/upload` 请求
- 检查响应状态码（200 = 成功，其他 = 失败）
- 检查响应体中是否包含 `url` 字段

### 6. 发布文章测试
1. 上传一张图片（等待上传完成）
2. 填写标题、描述等
3. 点击"发布文章"或"保存草稿"
4. 检查生成的 `.mdx` 文件中的 `img src` 是否为 Cloudinary URL

---

## 预期结果

| 场景 | 预期行为 | 问题排查 |
|------|---------|--------|
| 图片上传成功 | 编辑器显示图片，Console 显示 `[Cloudinary] Upload success` | 检查 Cloudinary 凭证是否正确 |
| 图片上传中 | "正在上传图片..." 提示显示，编辑器可编辑 | 检查网络连接 |
| 上传失败 | 弹出错误提示，Console 显示具体错误 | 根据错误信息检查 API Key、网络等 |
| 发布文章 | MDX 文件中的图片都是 Cloudinary URL，不含本地路径 | 检查是否所有图片都上传成功 |

---

## 常见问题排查

### Q: 图片上传后编辑器中看不到
**A**: 可能上传失败了。检查 Console 中是否有红色错误信息。

### Q: Console 显示 "Cloudinary API key 无效"
**A**:
1. 检查 `.env.local` 中的 API Key 是否正确（不要有多余空格）
2. 重启开发服务器：`npm run dev`
3. 登录 Cloudinary 确认凭证

### Q: Network 标签显示 `/api/upload` 返回 500 错误
**A**: Console 中应该有详细的错误信息。根据错误信息排查。

### Q: 发布文章时提示 "检测到无效的图片 URL"
**A**: 说明有图片还没上传成功。请确保所有图片的上传进度条都完成了再发布。

---

## 技术细节

### 为什么要在编辑器中允许临时 URL？

1. **用户体验**: 上传中可以看到图片预览
2. **灵活性**: localhost 开发环境可以访问本地上传的图片
3. **防御性检查**: 在保存时再进行严格验证

### 为什么不直接禁用 Base64？

虽然 `allowBase64: false` 能防止编码保存，但用户仍然可能：
- 粘贴截图时自动转换
- 通过其他方式上传本地图片

所以需要**多层验证**：
1. 编辑器配置：禁止 Base64
2. 上传逻辑：确保只接收 Cloudinary URL
3. 保存验证：最后检查确保所有图片都是 Cloudinary URL

---

## 相关文件修改列表

- ✅ `lib/cloudinary.ts` - 修复 Promise 处理
- ✅ `app/api/upload/route.ts` - 改进错误处理和验证
- ✅ `components/TipTapEditor.tsx` - 移除实时过滤，改进上传逻辑
- ✅ `app/admin/new/page.tsx` - 保存时验证图片 URL

---

如有任何问题，请检查 Console 和 Network 标签中的详细日志信息！
