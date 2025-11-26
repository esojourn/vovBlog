#!/usr/bin/env node

/**
 * VovBlog 生产环境启动脚本
 * 使用 PM2 运行 Next.js 生产服务器
 *
 * 使用方法：
 * 1. npm install (or bun install)
 * 2. npm run build (or bun run build)
 * 3. pm2 start ecosystem.config.js
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// 确保 logs 目录存在
const logsDir = path.join(__dirname, 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// 确保 content/posts 目录存在
const postsDir = path.join(__dirname, 'content', 'posts')
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true })
}

console.log('[VovBlog] 启动 Next.js 生产服务器...')

// 检查是否使用 Bun 或 Node
const isUsingBun = fs.existsSync(path.join(__dirname, 'bun.lock'))
const command = isUsingBun ? 'bun' : 'node'
const args = isUsingBun
  ? ['run', 'start']
  : [path.join(__dirname, 'node_modules', '.bin', 'next'), 'start']

const server = spawn(command, args, {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
  },
})

server.on('error', (err) => {
  console.error('[VovBlog] 启动失败:', err)
  process.exit(1)
})

server.on('exit', (code) => {
  console.log(`[VovBlog] 服务器已退出，代码: ${code}`)
  process.exit(code)
})

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('[VovBlog] 收到 SIGTERM，正在关闭...')
  server.kill('SIGTERM')
})

process.on('SIGINT', () => {
  console.log('[VovBlog] 收到 SIGINT，正在关闭...')
  server.kill('SIGINT')
})
