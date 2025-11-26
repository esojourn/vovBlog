module.exports = {
  apps: [
    {
      name: 'vovblog',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // 自动重启
      auto_restart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // 监视文件变化
      watch: false,
      // 忽略的目录
      ignore_watch: ['node_modules', 'logs', 'content/posts/.backup'],
      // 最大内存限制（可选，根据服务器配置调整）
      max_memory_restart: '500M',
      // 优雅关闭
      kill_timeout: 10000,
      listen_timeout: 10000,
      shutdown_with_message: true,
    },
  ],
}
