/**
 * 域名和子域名处理工具
 * 支持 Vercel 生产环境和本地开发环境
 */

/**
 * 从完整域名中提取子域名前缀
 * @param host - 完整域名（例如：yds.waqi.uk 或 www.waqi.uk）
 * @param mainDomain - 主域名（例如：waqi.uk）
 * @returns 子域名前缀（例如：yds）或 null（表示主域名）
 */
export function extractSubdomain(
  host: string | null,
  mainDomain: string
): string | null {
  if (!host) return null

  // 移除端口号（本地开发环境可能有端口）
  const hostname = host.split(':')[0]

  // 检查是否以主域名结尾
  if (!hostname.endsWith(mainDomain)) {
    return null
  }

  // 提取子域名前缀
  const prefix = hostname.substring(0, hostname.length - mainDomain.length)

  // 移除末尾的点号
  const subdomain = prefix.replace(/\.$/, '')

  // 如果是空字符串或 'www'，表示主域名
  if (!subdomain || subdomain === 'www') {
    return null
  }

  return subdomain
}

/**
 * 从请求 headers 中获取当前子域名
 * 支持 Vercel 环境和本地开发
 *
 * @param mainDomain - 主域名（从环境变量 NEXT_PUBLIC_SITE_URL 中提取）
 * @param headers - Next.js RequestCookie 对象（包含 host 等）
 * @returns 当前子域名或 null（表示访问的是主域名）
 */
export function getCurrentSubdomain(
  mainDomain: string,
  host: string | null
): string | null {
  // 在 Vercel 部署时，使用 x-forwarded-host header
  // 在本地开发时，使用 host header
  const fullHost = host

  return extractSubdomain(fullHost, mainDomain)
}

/**
 * 从环境变量 NEXT_PUBLIC_SITE_URL 中提取主域名
 * @param siteUrl - 完整 URL（例如：https://www.waqi.uk）
 * @returns 主域名（例如：waqi.uk）
 */
export function extractMainDomain(siteUrl: string): string {
  try {
    const url = new URL(siteUrl)
    const hostname = url.hostname

    // 移除 www. 前缀
    if (hostname.startsWith('www.')) {
      return hostname.substring(4)
    }

    return hostname
  } catch (error) {
    console.error('Failed to parse NEXT_PUBLIC_SITE_URL:', error)
    // 降级处理：假设格式为 https://www.example.com
    const match = siteUrl.match(/https?:\/\/(?:www\.)?(.+)/)
    return match ? match[1] : 'example.com'
  }
}

/**
 * 验证主域名配置
 * @returns 主域名字符串
 */
export function getMainDomain(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    throw new Error('NEXT_PUBLIC_SITE_URL environment variable is not set')
  }
  return extractMainDomain(siteUrl)
}
