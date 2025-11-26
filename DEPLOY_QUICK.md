# VovBlog VPS 部署快速指南

> ⚡️ 快速部署你的专属发布服务器，从手机随时发布文章到 GitHub

## 5 分钟快速开始

### 前置准备
- Linux VPS（Ubuntu 20.04+ 推荐）
- 域名 + SSL 证书（Let's Encrypt 免费）
- Git 账号

### 核心步骤

#### 1️⃣ VPS 基础配置（5 分钟）
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Bun
curl -fsSL https://bun.sh/install | bash

# 安装 Playwright 依赖
sudo apt install -y wget git libatk1.0-0 libatk-bridge2.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libxss1 fonts-noto-cjk fonts-noto-cjk-extra

# 安装 Nginx
sudo apt install -y nginx

# 安装 PM2（可选但推荐）
sudo npm install -g pm2
```

#### 2️⃣ 克隆和配置项目（5 分钟）
```bash
# 克隆项目
git clone https://github.com/your-username/VovBlog.git
cd VovBlog

# 安装依赖
bun install

# 安装 Playwright Chromium
bunx playwright install chromium

# 配置环境变量
cp .env.local.example .env.local
nano .env.local
# 修改以下必需项：
# - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
# - CLOUDINARY_API_KEY
# - CLOUDINARY_API_SECRET
# - ADMIN_PASSWORD（强密码，20+ 字符）
# - NEXT_PUBLIC_SITE_URL
```

#### 3️⃣ 构建和启动（5 分钟）
```bash
# 构建
bun run build

# 使用 PM2 启动（推荐）
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# 或使用 systemd 启动
sudo cp vovblog.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl start vovblog
sudo systemctl enable vovblog
```

#### 4️⃣ 配置 Nginx 反向代理（5 分钟）
```bash
# 复制 Nginx 配置
sudo cp nginx.conf.example /etc/nginx/sites-available/vovblog
sudo nano /etc/nginx/sites-available/vovblog

# 修改 server_name 和 SSL 证书路径

# 启用配置
sudo ln -s /etc/nginx/sites-available/vovblog /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default 2>/dev/null || true

# 测试和重启
sudo nginx -t
sudo systemctl restart nginx
```

#### 5️⃣ 配置 SSL 证书（5 分钟）
```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot certonly -d your-domain.com -d *.your-domain.com

# 验证
sudo certbot renew --dry-run
```

## 从手机发布文章

### 访问管理后台
```
https://your-domain.com/admin/login
```

### 发布流程
1. **输入密码** - 使用 `.env.local` 中的 `ADMIN_PASSWORD`
2. **创建文章**
   - 点击"创建新文章"
   - 粘贴微信公众号 URL
   - 点击"导入"（自动抓取标题、内容、图片）
   - 编辑和调整
   - 点击"保存草稿"或"发布文章"
3. **推送到 GitHub**
   ```bash
   # 在 VPS 上执行
   cd /path/to/VovBlog
   git add content/posts/
   git commit -m "Add: 新文章"
   git push origin main
   ```

## 常用命令

### PM2 管理
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs vovblog

# 重启应用
pm2 restart vovblog

# 停止应用
pm2 stop vovblog

# 监控
pm2 monit
```

### systemd 管理（如果使用 systemd）
```bash
# 查看状态
sudo systemctl status vovblog

# 查看日志
sudo journalctl -u vovblog -f

# 重启
sudo systemctl restart vovblog
```

### Nginx
```bash
# 测试配置
sudo nginx -t

# 重新加载
sudo systemctl reload nginx

# 查看日志
sudo tail -f /var/log/nginx/vovblog-error.log
```

## 故障排查

### 应用无法启动
```bash
# 查看详细错误
pm2 logs vovblog --err

# 检查端口占用
lsof -i :3000

# 检查环境变量
cat .env.local

# 手动运行调试
bun run start
```

### 无法导入文章
```bash
# 检查 Playwright 是否安装
bunx playwright install chromium

# 查看日志
pm2 logs vovblog | grep -i playwright

# 检查网络连接
curl -I https://mp.weixin.qq.com
```

### 证书问题
```bash
# 检查证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew --force-renewal

# 检查自动续期
sudo systemctl status certbot.timer
```

### 无法从手机访问
```bash
# 检查 Nginx 是否运行
sudo systemctl status nginx

# 检查防火墙
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443

# 检查 DNS
nslookup your-domain.com

# 查看 Nginx 错误
sudo tail -f /var/log/nginx/vovblog-error.log
```

## 详细文档

完整的部署指南和故障排查请查看：**[DEPLOY.md](./DEPLOY.md)**

## 系统架构

```
┌─────────────────────────────────────┐
│   你的手机浏览器                    │
│   https://your-domain.com/admin     │
└─────────────────┬───────────────────┘
                  │ HTTPS
                  ▼
      ┌───────────────────────┐
      │   Nginx 反向代理      │
      │   :80 (HTTP)          │
      │   :443 (HTTPS/SSL)    │
      └─────────┬─────────────┘
                │
                ▼
      ┌───────────────────────┐
      │  Next.js 应用 :3000   │
      │  ├─ /admin (管理后台) │
      │  ├─ /api (API 接口)   │
      │  └─ /blog (文章展示)  │
      └────────┬──────────────┘
               │
        ┌──────┴──────────────┐
        │                     │
        ▼                     ▼
  ┌───────────────┐  ┌──────────────────┐
  │ content/posts │  │  Cloudinary CDN  │
  │  (MDX 文件)   │  │  (图片存储)      │
  └───────────────┘  └──────────────────┘
        │
        ▼
   ┌─────────────┐
   │  Git Repo   │
   │  GitHub     │
   └─────────────┘
        │
        ▼
   ┌─────────────┐
   │  Vercel     │
   │  (生产部署) │
   └─────────────┘
```

## 安全建议

1. **管理员密码**
   - 最少 20 字符
   - 包含大小写、数字、特殊字符
   - 定期修改
   - 不要在日志中出现

2. **SSH 访问**
   - 关闭密码认证，使用密钥
   - 修改默认 SSH 端口（22）
   - 启用防火墙

3. **定期备份**
   ```bash
   # 备份所有文章
   tar -czf backup-$(date +%Y%m%d).tar.gz content/posts/
   ```

4. **监控日志**
   ```bash
   # 定期检查错误日志
   sudo tail -f /var/log/nginx/vovblog-error.log
   pm2 logs vovblog --err
   ```

## 下一步

- [ ] 配置自定义域名
- [ ] 启用 Google Analytics
- [ ] 设置自动备份
- [ ] 配置邮件告警（可选）
- [ ] 监控应用性能（可选）

## 需要帮助？

- 查看 [DEPLOY.md](./DEPLOY.md) 获取详细指南
- 查看 [CLAUDE.md](./CLAUDE.md) 了解项目结构
- GitHub Issues：https://github.com/your-username/VovBlog/issues

---

**祝你部署顺利！🚀**

有任何问题欢迎反馈。
