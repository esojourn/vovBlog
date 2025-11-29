/**
 * 登录限流工具
 *
 * 基于内存的滑动窗口限流，防止暴力破解
 * - 每个 IP 在 15 分钟内最多尝试 5 次登录
 * - 超过限制返回 429 Too Many Requests
 * - 登录成功后重置计数器
 */

interface RateLimitEntry {
  count: number
  resetAt: number  // 重置时间戳（毫秒）
}

// 存储登录尝试记录
const loginAttempts = new Map<string, RateLimitEntry>()

// 配置
const MAX_ATTEMPTS = 5           // 最大尝试次数
const WINDOW_MS = 15 * 60 * 1000  // 15 分钟窗口期

/**
 * 检查是否允许登录尝试
 */
export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const entry = loginAttempts.get(ip)

  // 没有记录或已过期，允许访问
  if (!entry || now >= entry.resetAt) {
    return { allowed: true }
  }

  // 检查尝试次数
  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)  // 秒
    return { allowed: false, retryAfter }
  }

  return { allowed: true }
}

/**
 * 记录一次登录尝试（失败时调用）
 */
export function recordAttempt(ip: string): void {
  const now = Date.now()
  const entry = loginAttempts.get(ip)

  if (!entry || now >= entry.resetAt) {
    // 创建新记录
    loginAttempts.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    })
  } else {
    // 增加计数
    entry.count += 1
    loginAttempts.set(ip, entry)
  }
}

/**
 * 重置登录尝试记录（成功登录后调用）
 */
export function resetRateLimit(ip: string): void {
  loginAttempts.delete(ip)
}

/**
 * 从请求中获取客户端 IP
 * 支持 Cloudflare 的 CF-Connecting-IP 头
 */
export function getClientIp(request: Request, headers: Headers): string {
  // Cloudflare 真实 IP
  const cfIp = headers.get('cf-connecting-ip')
  if (cfIp) return cfIp

  // X-Forwarded-For（代理）
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // X-Real-IP
  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp

  // 默认返回未知
  return 'unknown'
}

// 定期清理过期记录（每 5 分钟）
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of loginAttempts) {
    if (now >= entry.resetAt) {
      loginAttempts.delete(ip)
    }
  }
}, 5 * 60 * 1000)
