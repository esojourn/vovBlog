@echo off
REM VovBlog Publisher 启动脚本（Windows）
REM 启动 Next.js 开发服务器和 Cloudflare Tunnel

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

REM 检查 cloudflared 是否已安装
where cloudflared >nul 2>nul
if errorlevel 1 (
  echo 错误: 未找到 cloudflared，请先安装
  echo 访问: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
  echo.
  pause
  exit /b 1
)

REM 创建临时文件来存储进程 PID
set "PID_FILE=%TEMP%\vovblog-publisher.pids"

REM 清理旧的 PID 文件
if exist "%PID_FILE%" del "%PID_FILE%"

REM 启动 Next.js 开发服务器
echo.
echo =========================================
echo 1️⃣  启动 Next.js 开发服务器...
echo =========================================
echo 访问: http://localhost:3000
echo.

start "VovBlog Dev Server" cmd /k "cd /d %PROJECT_DIR% && bun run dev"

REM 等待开发服务器启动
timeout /t 3 /nobreak

REM 启动 Cloudflare Tunnel
echo.
echo =========================================
echo 2️⃣  启动 Cloudflare Tunnel...
echo =========================================
echo 访问: https://pub.waqi.uk/admin
echo.
echo 按 Ctrl+C 停止所有服务
echo.

start "Cloudflare Tunnel" cmd /k "cd /d %PROJECT_DIR% && cloudflared tunnel run vovblog-publisher"

REM 保持窗口打开
pause
