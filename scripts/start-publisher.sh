#!/bin/bash
# VovBlog Publisher 启动脚本（Linux/Mac）
# 启动 Next.js 开发服务器和 Cloudflare Tunnel
# wsl内自动启动，可以在 开始 》程序 》启动内创建快捷方式：
# C:\Windows\System32\wsl.exe -d <LINUX> -u <USER> -- bash -l -c "/<PATH>/vovBlog/scripts/start-publisher.sh"

set -e

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( dirname "$SCRIPT_DIR" )"

# 1. 定义用户主目录 (防止 $HOME 变量在某些极端环境下丢失)
USER_HOME=$(eval echo ~$USER)

# --- 兼容性加载 NVM (Node.js) ---
# 大多数 Node 环境是用 NVM 管理的，我们需要手动加载 NVM 脚本
export NVM_DIR="$USER_HOME/.nvm"
# 如果 nvm.sh 存在，就加载它
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 

# --- 兼容性加载 Bun ---
# 如果 .bun 目录存在，将其 bin 加入 PATH
if [ -d "$USER_HOME/.bun/bin" ]; then
    export BUN_INSTALL="$USER_HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
fi

# --- 调试检查 ---
# 打印一下，看看现在找到的是不是新版本
#echo "Node path: $(which node)" > /tmp/debug_env.log
#echo "Node version: $(node -v)" >> /tmp/debug_env.log
#echo "Bun path: $(which bun)" >> /tmp/debug_env.log


echo "========================================="
echo "VovBlog Publisher 启动脚本"
echo "========================================="
echo ""
echo "项目目录: $PROJECT_DIR"
echo ""

# 检查是否在项目目录中
if [ ! -f "$PROJECT_DIR/package.json" ]; then
  echo "错误: 无法找到 package.json，请确保脚本在项目的 scripts/ 目录中"
  exit 1
fi

# 更新到项目目录
cd "$PROJECT_DIR"

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
  echo "⚠️  依赖未安装，正在运行 bun install..."
  bun install
  echo ""
fi

# 检查生产构建是否存在
if [ ! -d ".next" ]; then
  echo "⚠️  生产构建不存在，正在构建..."
  bun run build
  echo ""
else
  # 提示用户是否重新构建
  echo "🔍 生产构建已存在"
  echo "按 'r' 重新构建，或按任意其他键继续..."
  read -t 5 -n 1 rebuild_choice || true
  echo ""

  if [ "$rebuild_choice" = "r" ]; then
    echo "🔨 正在重新构建生产包..."
    bun run build
    echo ""
  fi
fi

# 检查 cloudflared 是否已安装
if ! command -v cloudflared &> /dev/null; then
  echo "错误: 未找到 cloudflared，请先安装:"
  echo "  macOS: brew install cloudflare/cloudflare/cloudflared"
  echo "  Linux: 访问 https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
  exit 1
fi

# 启动前清理旧进程（可选，避免端口被占用）
cleanup() {
  echo ""
  echo "========================================="
  echo "正在清理并停止服务..."
  echo "========================================="
  kill %1 2>/dev/null || true
  kill %2 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM

# 启动 Next.js 生产服务器
echo ""
echo "========================================="
echo "1️⃣  启动 Next.js 生产服务器..."
echo "========================================="
echo "访问: http://localhost:3000"
echo ""

bun start &
DEV_PID=$!

# 等待开发服务器启动
sleep 3

# 启动 Cloudflare Tunnel
echo ""
echo "========================================="
echo "2️⃣  启动 Cloudflare Tunnel..."
echo "========================================="
echo "访问: https://admin.domain/admin"
echo ""

cloudflared tunnel run vovblog-publisher &
TUNNEL_PID=$!

# 等待进程
wait $DEV_PID $TUNNEL_PID
