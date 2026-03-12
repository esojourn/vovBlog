# 安全配置说明

## 架构概述

VovBlog 采用双环境架构：

### 1. 发布端（Publisher）- 本地环境
- **位置**：本地机器/WSL
- **用途**：远程发布文章
- **访问方式**：
  - Tailscale 网络：`http://100.x.x.x:3000`
  - Cloudflare Tunnel：`https://pub.waqi.uk`
- **环境变量**：`PUBLISHER_MODE=true`

### 2. 服务端（Production）- Vercel
- **位置**：Vercel 无服务器平台
- **用途**：公开博客网站
- **访问方式**：`https://www.waqi.uk` 及子域名
- **环境变量**：`PUBLISHER_MODE=false` 或未设置

---

## 发布端安全配置

### 网络绑定

发布端使用 `HOST=0.0.0.0` 允许 Tailscale 网络访问：

```bash
# scripts/start-publisher.sh
HOST=0.0.0.0 bun start
```

**安全性说明：**
- ✅ Tailscale 是加密的点对点 VPN，网络流量已加密
- ✅ 只有 Tailscale 网络成员可以访问
- ✅ 通过 Cloudflare Tunnel 暴露的端点有双重认证保护

### 认证保护

**多层防护：**

1. **Cloudflare Access**（外层）
   - 访问 `pub.waqi.uk` 需要通过 Cloudflare 身份验证
   - 支持 Email OTP、Google OAuth 等

2. **应用密码**（内层）
   - 环境变量：`ADMIN_PASSWORD`
   - 登录限流：15 分钟内最多 5 次尝试
   - Session Cookie：24 小时有效期

3. **Middleware 路由保护**
   - `/admin/*` - 需要登录
   - `/api/posts/*` - 需要登录
   - `/api/upload/*` - 需要登录

### Cookie 安全策略

```typescript
// 根据环境动态设置
response.cookies.set('admin_session', sessionToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // 生产环境强制 HTTPS
  sameSite: 'lax',
  maxAge: 24 * 60 * 60,
  path: '/',
})
```

**说明：**
- **开发/发布端**：`secure: false` - 允许 HTTP（Tailscale 内网）
- **生产环境**：`secure: true` - 强制 HTTPS（Vercel）

---

## 服务端安全配置

### Vercel 平台安全

Vercel 部署天然具备以下安全特性：

1. **无直接 IP 访问**
   - 所有流量通过 Vercel 边缘网络
   - 无法绕过域名直接访问

2. **强制 HTTPS**
   - 自动 SSL/TLS 证书
   - HTTP 自动重定向到 HTTPS

3. **环境隔离**
   - 生产环境变量独立配置
   - 不受本地 `PUBLISHER_MODE` 影响

### 安全响应头

`vercel.json` 配置：

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

---

## 威胁模型分析

### 发布端威胁

| 威胁 | 风险等级 | 缓解措施 |
|------|---------|---------|
| Tailscale 网络内部攻击 | 🟡 低 | 信任网络成员 + 应用密码保护 |
| HTTP 中间人攻击 | 🟡 低 | Tailscale 流量已加密 |
| 暴力破解密码 | 🟢 极低 | 登录限流（15分钟5次） |
| Session 劫持 | 🟡 低 | HttpOnly Cookie + 24小时过期 |

### 服务端威胁

| 威胁 | 风险等级 | 缓解措施 |
|------|---------|---------|
| 未授权访问管理后台 | 🟢 极低 | Middleware 保护 + Vercel 无直接访问 |
| DDoS 攻击 | 🟢 极低 | Vercel 边缘网络自动防护 |
| SQL 注入 | 🟢 无风险 | 使用文件系统存储，无数据库 |
| XSS 攻击 | 🟢 极低 | React 自动转义 + DOMPurify 清洗 |

---

## 安全最佳实践

### 发布端

1. **定期更新密码**
   ```bash
   # .env.local
   ADMIN_PASSWORD="使用强密码（16+ 字符，包含特殊字符）"
   ```

2. **限制 Tailscale 网络成员**
   - 只添加信任的设备
   - 定期审查网络成员列表

3. **监控登录日志**
   ```bash
   # 查看登录尝试
   grep "Login" logs/*.log
   ```

### 服务端

1. **Vercel 环境变量**
   - 在 Vercel Dashboard 配置 `ADMIN_PASSWORD`
   - 不要在代码中硬编码密码

2. **定期更新依赖**
   ```bash
   bun update
   ```

3. **启用 Vercel 日志监控**
   - 监控异常 API 调用
   - 设置告警规则

---

## 应急响应

### 发现未授权访问

1. **立即更改密码**
   ```bash
   # 更新 .env.local
   ADMIN_PASSWORD="新密码"

   # 重启服务
   ./scripts/start-publisher.sh
   ```

2. **检查 Tailscale 网络**
   ```bash
   tailscale status
   # 移除可疑设备
   ```

3. **审查文章修改记录**
   ```bash
   git log --since="1 day ago" -- content/posts/
   ```

### Session 泄露

1. **重启发布端服务**
   - 所有 Session 存储在内存中，重启后失效

2. **更改密码**
   - 强制所有用户重新登录

---

## 合规性说明

### GDPR/隐私保护

- ✅ 不收集用户个人信息
- ✅ 不使用第三方追踪
- ✅ Cookie 仅用于认证（HttpOnly）

### 数据备份

- ✅ 文章内容自动同步到 GitHub
- ✅ Git 历史记录完整保留
- ✅ Vercel 自动部署备份

---

## 联系方式

如发现安全问题，请通过以下方式报告：
- GitHub Issues（非敏感问题）
- 私密渠道（敏感漏洞）

**最后更新：** 2026-03-12
