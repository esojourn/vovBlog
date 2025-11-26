# VovBlog 生产部署指南

## 📋 目录
1. [前置要求](#前置要求)
2. [VPS 环境配置](#vps-环境配置)
3. [项目部署](#项目部署)
4. [运行和管理](#运行和管理)
5. [手机访问指南](#手机访问指南)
6. [故障排查](#故障排查)

---

## 前置要求

### 硬件和系统
- **操作系统**：Linux（Ubuntu 20.04 LTS 或更高版本推荐）
- **CPU**：最少 1核，推荐 2+ 核
- **内存**：最少 512MB，推荐 2GB+（用于 Playwright）
- **存储**：至少 5GB（用于 Node modules 和 content）
- **网络**：稳定的公网 IP 和域名

### 必需软件
- Git（版本控制）
- Bun 1.2.22+ 或 Node.js 18+
- Nginx（反向代理）
- PM2（进程管理，可选）或 systemd

---

## VPS 环境配置

### 1. 更新系统
```bash
sudo apt update
sudo apt upgrade -y
```

### 2. 安装 Bun（推荐）或 Node.js

#### 方案 A：安装 Bun（更快）
```bash
# 下载并安装 Bun
curl -fsSL https://bun.sh/install | bash

# 检查安装
bun --version
```

#### 方案 B：使用 Node.js（如果不用 Bun）
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 检查版本
node --version
npm --version
```

### 3. 安装 Playwright 依赖

Playwright 需要一些系统库来运行无头浏览器。根据你的系统安装：

```bash
# Ubuntu/Debian
sudo apt install -y \
  wget \
  git \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libglib2.0-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libxss1 \
  fonts-noto-cjk \
  fonts-noto-cjk-extra

# 验证 Chromium 依赖
which chromium-browser || echo "⚠️ 需要通过 Playwright 自动安装 Chromium"
```

### 4. 安装 Nginx
```bash
sudo apt install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

### 5. 设置 Let's Encrypt SSL 证书（必需，用于 HTTPS）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书（交互式）
sudo certbot certonly -d your-domain.com -d *.your-domain.com

# 验证证书
sudo certbot renew --dry-run

# 自动续期（通常已默认启用）
sudo systemctl enable certbot.timer
```

### 6. 创建应用用户（安全最佳实践）

```bash
# 创建专用用户
sudo useradd -m -s /bin/bash vovblog

# 为用户配置 sudo（可选）
sudo usermod -aG sudo vovblog

# 切换到该用户
sudo su - vovblog
```

---

## 项目部署

### 1. 克隆项目
```bash
# 进入项目目录
cd /home/vovblog

# 克隆仓库
git clone https://github.com/your-username/VovBlog.git

# 进入项目目录
cd VovBlog

# 查看分支
git branch -a
```

### 2. 配置环境变量

创建 `.env.local` 文件（**不要提交到 Git！**）：

```bash
# 编辑环境变量文件
nano .env.local
```

添加以下内容：

```env
# Cloudinary 配置
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# 管理员密码（强密码，20+ 字符推荐）
ADMIN_PASSWORD=your-strong-password-here-min-20-chars

# 网站 URL（用于子域名识别和 SEO）
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Google Analytics（可选）
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**⚠️ 安全提示：**
- 不要将 `.env.local` 提交到 GitHub
- 使用强密码（20+ 字符，包含大小写字母、数字、特殊字符）
- 定期更换 ADMIN_PASSWORD

### 3. 安装依赖

#### 使用 Bun（推荐）
```bash
# 进入项目目录
cd /home/vovblog/VovBlog

# 安装依赖
bun install

# 安装 Playwright Chromium
bunx playwright install chromium

# 验证安装
bun --version
```

#### 使用 npm
```bash
npm install
npx playwright install chromium
```

### 4. 构建项目

```bash
# 使用 Bun
bun run build

# 或使用 npm
npm run build

# 检查构建输出
ls -la .next
```

**预期输出：**
```
✓ Building application...
✓ Finalizing page optimization...
✓ Collecting build metrics...

Route (app)                              Size     First Load JS
┌ ○ /                                    XXX kB   XXX kB
├ ○ /admin                               XXX kB   XXX kB
├ ○ /admin/edit/[slug]                   XXX kB   XXX kB
├ ○ /admin/new                           XXX kB   XXX kB
└ [other routes]
```

---

## 运行和管理

### 方案 A：使用 PM2（推荐）

PM2 是一个强大的进程管理工具，提供自动重启、监控等功能。

#### 1. 安装 PM2
```bash
sudo npm install -g pm2

# 或使用 Bun
bunx pm2 install pm2
```

#### 2. 启动应用
```bash
# 使用 ecosystem.config.js 启动
pm2 start ecosystem.config.js

# 查看进程状态
pm2 status

# 查看实时日志
pm2 logs vovblog

# 查看完整日志
pm2 logs vovblog --lines 100
```

#### 3. 配置开机自启
```bash
# 生成启动脚本
pm2 startup systemd -u vovblog --hp /home/vovblog

# 保存当前进程配置
pm2 save

# 验证开机自启
sudo systemctl status pm2-vovblog
```

#### 4. 常用命令
```bash
# 重启应用
pm2 restart vovblog

# 停止应用
pm2 stop vovblog

# 删除应用
pm2 delete vovblog

# 查看应用详细信息
pm2 info vovblog

# 监控应用
pm2 monit
```

### 方案 B：使用 systemd（轻量级）

如果不想使用 PM2，可以使用 systemd 管理。

#### 1. 配置 systemd 服务
```bash
# 复制服务配置文件
sudo cp vovblog.service /etc/systemd/system/

# 编辑文件
sudo nano /etc/systemd/system/vovblog.service

# 修改以下字段：
# - User=your-username
# - WorkingDirectory=/path/to/VovBlog
# - EnvironmentFile=/path/to/.env.production
```

#### 2. 启动服务
```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start vovblog

# 查看状态
sudo systemctl status vovblog

# 设置开机自启
sudo systemctl enable vovblog
```

#### 3. 常用命令
```bash
# 查看日志
sudo journalctl -u vovblog -f

# 查看历史日志
sudo journalctl -u vovblog -n 100

# 重启服务
sudo systemctl restart vovblog

# 停止服务
sudo systemctl stop vovblog
```

### 配置 Nginx 反向代理

#### 1. 创建 Nginx 配置
```bash
# 复制示例配置
sudo cp nginx.conf.example /etc/nginx/sites-available/vovblog

# 编辑配置
sudo nano /etc/nginx/sites-available/vovblog

# 修改：
# - server_name your-domain.com
# - SSL 证书路径
# - 其他配置
```

#### 2. 启用配置
```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/vovblog /etc/nginx/sites-enabled/

# 删除默认配置（如果需要）
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

#### 3. 验证反向代理
```bash
# 检查 Nginx 状态
sudo systemctl status nginx

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/vovblog-error.log

# 查看访问日志
sudo tail -f /var/log/nginx/vovblog-access.log
```

---

## 手机访问指南

### 前提条件
1. ✅ VPS 已部署并运行
2. ✅ HTTPS 证书已配置
3. ✅ Nginx 已启动
4. ✅ 环境变量中设置了 `ADMIN_PASSWORD`
5. ✅ 手机和 VPS 在同一网络或通过公网连接

### 访问步骤

#### 第 1 步：获取访问 URL
```
https://your-domain.com/admin/login
```

#### 第 2 步：登录管理后台

1. 用手机浏览器访问上面的 URL
2. 输入环境变量中配置的 `ADMIN_PASSWORD`
3. 点击"登 录"按钮
4. 登录成功后，浏览器会显示管理界面

#### 第 3 步：导入文章

1. 点击"创建新文章"或"导入文章"
2. 在"原文链接"输入框中粘贴微信公众号文章 URL
   - 格式：`https://mp.weixin.qq.com/s?__biz=...`
3. 点击"导入"按钮
4. 等待 3-5 秒，文章内容自动填充
5. 检查并编辑文章内容
6. 点击"保存草稿"或"发布文章"

#### 第 4 步：提交更改到 GitHub

等文章保存后，在 VPS 上手动提交并推送：

```bash
# SSH 进入 VPS
ssh your-user@your-domain.com

# 进入项目目录
cd /home/vovblog/VovBlog

# 查看文件变化
git status

# 添加新文章
git add content/posts/

# 提交更改
git commit -m "Add: 新文章标题"

# 推送到 GitHub
git push origin main

# Vercel 会自动部署（如果配置了自动部署）
```

### 手机浏览器兼容性

| 浏览器 | 支持 | 备注 |
|------|------|------|
| Safari | ✅ | iOS 12+ |
| Chrome | ✅ | 推荐使用 |
| Firefox | ✅ | 所有版本 |
| 微信浏览器 | ✅ | 仅供查看，不支持编辑 |
| QQ 浏览器 | ✅ | 仅供查看，不支持编辑 |

### 优化手机操作体验

#### 添加书签
1. 在 Safari/Chrome 中访问 `https://your-domain.com/admin/login`
2. 点击"分享"按钮，选择"添加到主屏幕"或"添加书签"
3. 下次可快速访问

#### 使用快捷指令（iOS）

可以创建 iOS 快捷指令快速分享文章 URL 到 VovBlog：

```
1. 打开"快捷指令"应用
2. 点击"创建快捷指令"
3. 添加以下步骤：
   - 获取 URL（从其他应用分享过来）
   - 文本替换（将 URL 进行处理）
   - 打开 URL：https://your-domain.com/admin/new?url={上一步的 URL}
4. 保存为"导入文章到 VovBlog"
5. 在微信中分享文章时，选择该快捷指令
```

#### 使用 Tasker（Android）

Android 用户可以类似配置。

---

## 故障排查

### 问题 1：Playwright 无法启动

**症状**：导入文章时提示"抓取失败"或"浏览器启动失败"

**解决方案**：
```bash
# 1. 检查 Playwright Chromium 是否安装
ls ~/.cache/ms-playwright/

# 2. 重新安装
bunx playwright install chromium

# 3. 检查系统库依赖
sudo apt install -y libatk1.0-0 libatk-bridge2.0-0 libcups2 libdbus-1-3

# 4. 查看详细错误日志
pm2 logs vovblog --err
```

### 问题 2：SSL 证书过期

**症状**：浏览器提示"您的连接不是私密连接"

**解决方案**：
```bash
# 检查证书有效期
sudo certbot certificates

# 手动续期
sudo certbot renew --force-renewal

# 检查自动续期是否运行
sudo systemctl status certbot.timer
```

### 问题 3：应用无法启动

**症状**：`pm2 status` 显示应用已停止或 systemd 状态为 failed

**解决方案**：
```bash
# 1. 查看详细错误日志
pm2 logs vovblog --err

# 2. 检查环境变量
cat .env.local

# 3. 检查构建产物
ls -la .next

# 4. 手动运行（调试）
bun run start

# 5. 检查端口占用
lsof -i :3000

# 6. 检查磁盘空间
df -h
```

### 问题 4：磁盘空间不足

**症状**：构建或上传文章时报错"Disk quota exceeded"

**解决方案**：
```bash
# 查看磁盘使用情况
du -sh /home/vovblog/*

# 清理 node_modules 缓存
rm -rf node_modules/.cache
bunx playwright install --with-deps

# 删除旧的 Playwright 缓存
rm -rf ~/.cache/ms-playwright

# 查找大文件
find . -type f -size +100M
```

### 问题 5：内存溢出

**症状**：应用频繁重启或被 kill

**解决方案**：
```bash
# 查看内存使用
pm2 status
pm2 monit

# 增加 Node.js 堆大小
pm2 start ecosystem.config.js --node-args="--max-old-space-size=2048"

# 或在 ecosystem.config.js 中配置：
# node_args: "--max-old-space-size=2048"
```

### 问题 6：文章导入失败

**症状**：导入微信文章时返回 400 或 500 错误

**解决方案**：
```bash
# 1. 查看详细日志
pm2 logs vovblog

# 2. 检查 Playwright 是否正常
curl http://localhost:3000/api/fetch-wechat-article \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"url":"https://mp.weixin.qq.com/s?__biz=..."}'

# 3. 检查网络连接
ping mp.weixin.qq.com

# 4. 检查代理配置（如果使用了代理）
env | grep -i proxy
```

### 问题 7：无法通过手机访问

**症状**：手机浏览器打不开网站

**解决方案**：
```bash
# 1. 检查 DNS 解析
nslookup your-domain.com
# 或
dig your-domain.com

# 2. 检查防火墙
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443

# 3. 检查 Nginx 是否监听正确的端口
sudo netstat -tulpn | grep nginx

# 4. 检查路由器端口转发（如果使用了家庭网络）
# 确保 80 和 443 端口已转发到 VPS

# 5. 从手机 ping VPS
ping your-domain.com

# 6. 检查网络延迟
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com
```

### 问题 8：性能缓慢

**症状**：手机打开页面很慢或超时

**解决方案**：
```bash
# 1. 检查网络延迟和带宽
iperf3 -s  # 服务器端
iperf3 -c server-ip  # 客户端

# 2. 优化 Next.js 缓存
# 在 next.config.js 中配置缓存头

# 3. 启用 Gzip 压缩
# 在 Nginx 配置中添加：
# gzip on;
# gzip_types text/plain text/css application/json;

# 4. 增加 Nginx worker 进程
# 在 /etc/nginx/nginx.conf 中修改：
# worker_processes auto;

# 5. 检查 Cloudinary 图片加载速度
curl -w "Time: %{time_total}s\n" https://res.cloudinary.com/...
```

---

## 维护和更新

### 定期备份

```bash
# 备份 content/posts（所有文章）
tar -czf vovblog-backup-$(date +%Y%m%d).tar.gz content/posts/

# 上传备份到云存储（例如 AWS S3）
aws s3 cp vovblog-backup-*.tar.gz s3://your-bucket/
```

### 更新项目

```bash
# 获取最新代码
git fetch origin
git pull origin main

# 安装新依赖
bun install

# 重新构建
bun run build

# 重启应用
pm2 restart vovblog
```

### 监控应用健康

```bash
# 使用 PM2 web 界面（可选）
pm2 web

# 访问 http://your-vps-ip:9615

# 或使用命令行监控
watch -n 1 'pm2 status'
```

---

## 安全最佳实践

1. **定期更新系统**
   ```bash
   sudo apt update && sudo apt upgrade
   ```

2. **配置 SSH 密钥认证**（禁用密码认证）
   ```bash
   # 在本地生成密钥
   ssh-keygen -t rsa -b 4096

   # 复制公钥到服务器
   ssh-copy-id user@server
   ```

3. **启用防火墙**
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow http
   sudo ufw allow https
   ```

4. **定期修改管理员密码**
   ```bash
   # 更新 .env.local
   nano .env.local

   # 修改 ADMIN_PASSWORD
   # 重启应用
   pm2 restart vovblog
   ```

5. **配置自动日志轮转**
   ```bash
   # 编辑 logrotate 配置
   sudo nano /etc/logrotate.d/vovblog
   ```

---

## 支持和反馈

- **GitHub Issues**：https://github.com/your-username/VovBlog/issues
- **文档**：查看项目根目录的 `CLAUDE.md`
- **日志位置**：
  - PM2：`./logs/pm2-*.log`
  - Nginx：`/var/log/nginx/vovblog-*.log`
  - systemd：`journalctl -u vovblog`

---

## 许可证

MIT License - 详见 LICENSE 文件
