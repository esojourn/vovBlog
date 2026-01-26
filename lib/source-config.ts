/**
 * 文章来源统一配置
 * 所有与文章来源相关的配置集中管理
 * 包含：名称、子域名、二维码、简介等信息
 */

/**
 * 来源配置接口
 */
export interface SourceConfig {
  /** 唯一标识（显示在文章中的来源字段） */
  id: string
  /** 显示名称（完整的公众号名称或来源名称） */
  name: string
  /** 短名称（用于自动匹配和识别） */
  shortName: string
  /** 子域名前缀（例如：'wqws' -> wqws.waqi.uk）；null 表示不支持子域名 */
  subdomain: string | null
  /** 二维码图片路径（相对于 public 目录）；例如：'/qrcodes/wqws.png' */
  qrCode?: string
  /** 公众号简介或描述 */
  description?: string
  /** 是否为默认来源 */
  isDefault?: boolean
}

/**
 * 所有文章来源配置
 * 注意：id 字段就是文章 MDX 文件中 source 字段的值
 */
export const SOURCES: SourceConfig[] = [
  {
    id: '原创',
    name: '原创',
    shortName: '原创',
    subdomain: null,
    description: '本站原创文章',
    isDefault: true,
  },
  {
    id: '"瓦器微声"公众号',
    name: '"瓦器微声"公众号',
    shortName: '瓦器微声',
    subdomain: 'wqws',
    qrCode: '/qrcodes/wqws.png',
    description: '信仰与生活的精妙交织，在这里找到灵魂的共鸣',
  },
  {
    id: '"盐读书"公众号',
    name: '"盐读书"公众号',
    shortName: '盐读书',
    subdomain: 'yds',
    qrCode: '/qrcodes/yds.png',
    description: '阅读的味道，生活的调味料',
  },
  {
    id: '"五饼二鱼能量站"公众号',
    name: '"五饼二鱼能量站"公众号',
    shortName: '五饼二鱼能量站',
    subdomain: 'wbey',
    qrCode: '/qrcodes/wbey.png',
    description: '灵粮供应站，属灵能量加油站',
  },
  {
    id: '"拨摩的海岛"公众号',
    name: '"拨摩的海岛"公众号',
    shortName: '拨摩的海岛',
    subdomain: 'bmhd',
    qrCode: '/qrcodes/bmhd.png',
    description: '尔识真理，真理释尔',
  },
]

/**
 * 获取默认来源 ID
 * @returns 默认来源的 id
 */
export function getDefaultSource(): string {
  const defaultSource = SOURCES.find(s => s.isDefault)
  return defaultSource ? defaultSource.id : SOURCES[0].id
}

/**
 * 根据来源 ID 获取来源配置
 * @param sourceId - 来源 ID
 * @returns 来源配置对象，不存在时返回 null
 */
export function getSourceConfig(sourceId: string): SourceConfig | null {
  return SOURCES.find(s => s.id === sourceId) || null
}

/**
 * 根据子域名获取来源 ID
 * @param subdomain - 子域名前缀
 * @returns 来源 ID，不存在时返回 null
 */
export function getSourceBySubdomain(subdomain: string | null): string | null {
  if (!subdomain) return null
  const source = SOURCES.find(s => s.subdomain === subdomain)
  return source ? source.id : null
}

/**
 * 根据来源 ID 获取子域名
 * @param sourceId - 来源 ID
 * @returns 子域名前缀，不存在时返回 null
 */
export function getSubdomainBySource(sourceId: string): string | null {
  const source = SOURCES.find(s => s.id === sourceId)
  return source?.subdomain || null
}

/**
 * 根据公众号名称自动匹配来源（用于导入文章时自动识别）
 * 支持精确匹配和模糊匹配
 * @param accountName - 公众号名称
 * @returns 匹配的来源 ID，未匹配时返回 null
 */
export function matchSourceByAccountName(accountName: string): string | null {
  if (!accountName) return null

  // 精确匹配
  const exactMatch = SOURCES.find(s => s.shortName === accountName)
  if (exactMatch) return exactMatch.id

  // 模糊匹配（双向包含）
  const fuzzyMatch = SOURCES.find(
    s =>
      accountName.includes(s.shortName) || s.shortName.includes(accountName)
  )
  if (fuzzyMatch) return fuzzyMatch.id

  return null
}

/**
 * 获取所有支持子域名的来源子域名列表
 * @returns 子域名数组
 */
export function getAllSubdomains(): string[] {
  return SOURCES.filter(s => s.subdomain !== null).map(
    s => s.subdomain as string
  )
}

/**
 * 检查是否是有效的子域名前缀
 * @param subdomain - 子域名前缀
 * @returns true 表示有效，false 表示无效
 */
export function isValidSubdomain(subdomain: string): boolean {
  return SOURCES.some(s => s.subdomain === subdomain)
}

/**
 * 获取所有来源的下拉选择选项
 * 用于表单的 select 组件
 * @returns 包含 value 和 label 的数组
 */
export function getAllSourceOptions(): Array<{ value: string; label: string }> {
  return SOURCES.map(s => ({
    value: s.id,
    label: s.name,
  }))
}

/**
 * 获取所有来源 ID 列表
 * @returns 来源 ID 数组
 */
export function getAllSourceIds(): string[] {
  return SOURCES.map(s => s.id)
}

/**
 * 子域名到来源 ID 的映射对象
 * 保持向后兼容，用于快速查询
 */
export const SUBDOMAIN_SOURCE_MAP: Record<string, string> = SOURCES.filter(
  s => s.subdomain !== null
).reduce(
  (acc, s) => {
    acc[s.subdomain as string] = s.id
    return acc
  },
  {} as Record<string, string>
)

/**
 * 来源 ID 到公众号名称的映射（用于导入识别）
 */
export const ACCOUNT_SOURCE_MAP: Record<string, string> = SOURCES.filter(
  s => s.subdomain !== null
).reduce(
  (acc, s) => {
    acc[s.shortName] = s.id
    return acc
  },
  {} as Record<string, string>
)
