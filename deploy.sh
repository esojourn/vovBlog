#!/bin/bash

# VovBlog 一键部署脚本
# 作者: VovBlog
# 描述: 自动化部署到 Vercel

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装，请先安装 $1"
        exit 1
    fi
}

print_success "🚀 开始部署 VovBlog 到 Vercel"

# 检查必需的命令
print_info "检查环境..."
check_command "node"
check_command "bun"
check_command "git"

# Vercel CLI 将通过 bunx 运行，无需全局安装
print_info "Vercel CLI 将通过 bunx 运行"

# 检查 .env.local 文件
if [ ! -f ".env.local" ]; then
    print_warning ".env.local 文件不存在，请确保已配置必要环境变量"
    print_info "参考 .env.local.example 文件进行配置"
    read -p "是否继续部署？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "部署已取消"
        exit 1
    fi
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ] || [ ! -f "bun.lock" ]; then
    print_info "安装依赖..."
    bun install
fi

# 检查代码格式
print_info "检查代码格式..."
bun run lint

# 运行构建测试
print_info "测试构建..."
bun run build

# 询问是否推送代码到 Git
if git diff --quiet && git diff --cached --quiet; then
    print_info "Git 工作目录干净"
else
    print_warning "检测到未提交的更改"
    read -p "是否提交并推送代码到 Git？(Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        print_info "添加文件到 Git..."
        git add .
        print_info "输入提交信息:"
        read -p "提交信息: " commit_msg
        if [ -z "$commit_msg" ]; then
            commit_msg="Update: 部署到生产环境"
        fi
        git commit -m "$commit_msg"

        # 询问是否推送到远程仓库
        read -p "是否推送到远程仓库？(Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
            print_info "推送到远程仓库..."
            git push
            print_success "代码已推送到远程仓库"
        fi
    fi
fi

# 部署到 Vercel
print_info "准备部署到 Vercel..."

# 询问部署模式
echo "请选择部署模式:"
echo "1) 生产环境部署 (Production)"
echo "2) 预览环境部署 (Preview)"
read -p "请输入选择 (1-2): " deploy_mode

if [ "$deploy_mode" = "1" ]; then
    print_info "部署到生产环境..."
    bunx vercel --prod
elif [ "$deploy_mode" = "2" ]; then
    print_info "部署到预览环境..."
    bunx vercel
else
    print_warning "无效选择，使用默认预览部署..."
    bunx vercel
fi

print_success "✅ 部署完成！"
print_info "访问您的 Vercel 控制台查看部署状态: https://vercel.com/dashboard"

# 打开 Vercel 仪表板
read -p "是否打开 Vercel 仪表板？(Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open https://vercel.com/dashboard
    elif command -v open &> /dev/null; then
        open https://vercel.com/dashboard
    else
        print_info "请手动访问: https://vercel.com/dashboard"
    fi
fi

print_success "🎉 部署流程完成！"
