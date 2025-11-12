/**
 * 子域名到公众号来源的映射配置
 * 在 Vercel 上部署时，需要配置对应的子域名 DNS 记录
 */

/**
 * 子域名前缀到公众号来源的映射关系
 * key: 子域名前缀（例如：yds, wqws）
 * value: 文章 source 字段的值
 */
export const SUBDOMAIN_SOURCE_MAP: Record<string, string> = {
  'wqws': '"瓦器微声"公众号',
  'yds': '"盐读书"公众号',
  'wbey': '"五饼二鱼能量站"公众号',
}

/**
 * 根据子域名获取对应的来源
 * @param subdomain - 子域名前缀（例如：yds）
 * @returns 对应的来源字符串，如果不存在返回 null
 */
export function getSourceBySubdomain(subdomain: string | null): string | null {
  if (!subdomain) return null
  return SUBDOMAIN_SOURCE_MAP[subdomain] || null
}

/**
 * 根据来源获取对应的子域名
 * @param source - 文章来源字符串
 * @returns 对应的子域名前缀，如果不存在返回 null
 */
export function getSubdomainBySource(source: string): string | null {
  for (const [subdomain, src] of Object.entries(SUBDOMAIN_SOURCE_MAP)) {
    if (src === source) {
      return subdomain
    }
  }
  return null
}

/**
 * 获取所有已配置的子域名
 * @returns 子域名前缀数组
 */
export function getAllSubdomains(): string[] {
  return Object.keys(SUBDOMAIN_SOURCE_MAP)
}

/**
 * 检查是否是有效的子域名
 * @param subdomain - 子域名前缀
 * @returns 是否有效
 */
export function isValidSubdomain(subdomain: string): boolean {
  return subdomain in SUBDOMAIN_SOURCE_MAP
}
