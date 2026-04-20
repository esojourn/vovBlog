@echo off
REM VovBlog Publisher 启动脚本（Windows）
REM 启动 Next.js 生产服务器，通过 Tailscale 网络访问

setlocal enabledelayedexpansion

REM 获取脚本所在目录的父目录（项目根目录）
set SCRIPT_DIR=%~dp0
for %%I in ("%SCRIPT_DIR%..") do set PROJECT_DIR=%%~fI

echo =========================================
echo VovBlog Publisher 启动脚本（Windows）
echo =========================================
echo.
echo 项目目录: %PROJECT_DIR%
echo.

REM 检查是否在项目目录中
if not exist "%PROJECT_DIR%\package.json" (
  echo 错误: 无法找到 package.json
  echo 请确保脚本在项目的 scripts\ 目录中
  pause
  exit /b 1
)

REM 进入项目目录
cd /d "%PROJECT_DIR%"

REM 检查依赖是否已安装
if not exist "node_modules" (
  echo ⚠️  依赖未安装，正在运行 bun install...
  call bun install
  echo.
)

REM 检查生产构建是否存在
if not exist ".next" (
  echo ⚠️  生产构建不存在，正在构建...
  call bun run build
  echo.
) else (
  echo 🔍 生产构建已存在
  echo 按 'r' 重新构建，或按任意其他键继续...
  choice /c rn /t 5 /d n /n >nul 2>nul
  if !errorlevel! equ 1 (
    echo 🔨 正在重新构建生产包...
    call bun run build
    echo.
  )
)

REM 获取 Tailscale IP 地址
set TAILSCALE_IP=
for /f "tokens=*" %%a in ('tailscale ip -4 2^>nul') do set TAILSCALE_IP=%%a

REM 启动 Next.js 生产服务器
echo.
echo =========================================
echo 🚀 启动 Next.js 生产服务器...
echo =========================================
echo 本地访问: http://localhost:3000
if defined TAILSCALE_IP (
  echo Tailscale 访问: http://%TAILSCALE_IP%:3000
) else (
  echo Tailscale: 未检测到 IP（请确保已加入 Tailscale 网络）
)
echo.
echo 按 Ctrl+C 停止服务
echo.

set HOST=0.0.0.0
call bun start
