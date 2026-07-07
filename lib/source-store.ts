/**
 * 动态来源存储（服务端专用）
 *
 * ⚠️ 本模块使用 Node.js fs，仅可在服务端（API 路由、Server Component）导入。
 * 请勿在客户端组件中 import。
 *
 * 设计：
 * - lib/source-config.ts 的 SOURCES 作为“内置默认来源”（种子数据）
 * - content/sources.json 保存运行时自动创建的“动态来源”
 * - 两者在运行时合并，动态来源不会覆盖同 id 的内置来源
 * - 导入公众号文章时，若来源不存在则自动创建并写入 JSON（通过 git-sync 提交）
 */

import fs from 'fs'
import path from 'path'
import { pinyin } from 'pinyin-pro'
import {
  SOURCES,
  getDefaultSource,
  type SourceConfig,
} from '@/lib/source-config'

const SOURCES_FILE = path.join(process.cwd(), 'content', 'sources.json')

/**
 * 读取动态来源（content/sources.json）
 * 文件不存在或解析失败时返回空数组
 */
export function loadDynamicSources(): SourceConfig[] {
  try {
    if (!fs.existsSync(SOURCES_FILE)) return []
    const raw = fs.readFileSync(SOURCES_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // 只保留结构合法的条目
    return parsed.filter(
      (s): s is SourceConfig =>
        !!s && typeof s.id === 'string' && typeof s.name === 'string'
    )
  } catch (err) {
    console.warn('[SourceStore] 读取 sources.json 失败:', err)
    return []
  }
}

/**
 * 写入动态来源到 content/sources.json
 */
function saveDynamicSources(sources: SourceConfig[]): void {
  const dir = path.dirname(SOURCES_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(SOURCES_FILE, JSON.stringify(sources, null, 2) + '\n', 'utf-8')
}

/**
 * 合并内置来源与动态来源
 * 内置来源优先：动态来源中若存在同 id 的条目将被忽略
 */
export function getMergedSources(): SourceConfig[] {
  const dynamic = loadDynamicSources()
  const builtinIds = new Set(SOURCES.map(s => s.id))
  const extras = dynamic.filter(s => !builtinIds.has(s.id))
  return [...SOURCES, ...extras]
}

/**
 * 合并后的下拉选项（用于 admin 表单）
 */
export function getMergedSourceOptions(): Array<{ value: string; label: string }> {
  return getMergedSources().map(s => ({ value: s.id, label: s.name }))
}

/**
 * 根据子域名在合并列表中查找来源 id
 */
export function getSourceBySubdomainMerged(subdomain: string | null): string | null {
  if (!subdomain) return null
  const source = getMergedSources().find(s => s.subdomain === subdomain)
  return source ? source.id : null
}

/**
 * 在合并列表中按公众号名称匹配来源（精确 + 模糊）
 */
function matchMergedSource(accountName: string): SourceConfig | null {
  if (!accountName) return null
  const merged = getMergedSources()

  const exact = merged.find(s => s.shortName === accountName)
  if (exact) return exact

  const fuzzy = merged.find(
    s =>
      s.shortName &&
      (accountName.includes(s.shortName) || s.shortName.includes(accountName))
  )
  return fuzzy || null
}

/**
 * 由公众号名称生成子域名前缀（取每个汉字拼音首字母）
 * 例："小麦的书房" -> "xmdsf"
 * 非中文字符保留其小写字母/数字
 */
function generateSubdomain(name: string): string {
  // 去掉引号、"公众号"等噪声词
  const cleaned = name
    .replace(/["'"'「」『』]/g, '')
    .replace(/公众号|公號|公众平台/g, '')
    .trim()

  const initials = pinyin(cleaned, {
    pattern: 'first',
    toneType: 'none',
    type: 'array',
    nonZh: 'consecutive',
  })
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  return initials
}

/**
 * 生成一个在合并列表中唯一的子域名前缀
 * 冲突时追加数字后缀（xmdsf -> xmdsf2 -> xmdsf3 ...）
 */
function generateUniqueSubdomain(name: string, existing: Set<string>): string | null {
  let base = generateSubdomain(name)
  if (!base) return null
  // 子域名前缀合理长度：过长时截断到 12 字符
  if (base.length > 12) base = base.slice(0, 12)

  if (!existing.has(base)) return base

  let i = 2
  while (existing.has(`${base}${i}`)) i++
  return `${base}${i}`
}

export interface ResolveSourceResult {
  /** 解析或新建后的来源 id */
  source: string
  /** 是否为本次新建 */
  created: boolean
  /** 新建来源的配置（created 为 true 时提供） */
  config?: SourceConfig
}

/**
 * 根据公众号名称解析来源；若不存在则自动创建新来源并持久化。
 *
 * @param accountName 公众号名称（可能为空）
 * @returns 解析结果，未提供 accountName 时回退到默认来源
 */
export function resolveOrCreateSource(accountName?: string | null): ResolveSourceResult {
  const trimmed = (accountName || '').trim()
  if (!trimmed) {
    return { source: getDefaultSource(), created: false }
  }

  // 1. 已存在：直接复用
  const matched = matchMergedSource(trimmed)
  if (matched) {
    return { source: matched.id, created: false }
  }

  // 2. 不存在：自动创建
  const merged = getMergedSources()
  const existingSubdomains = new Set(
    merged.map(s => s.subdomain).filter((s): s is string => !!s)
  )

  const subdomain = generateUniqueSubdomain(trimmed, existingSubdomains)

  // 来源 id 与内置来源保持一致的命名风格：「"名称"公众号」
  const id = `"${trimmed}"公众号`
  const newSource: SourceConfig = {
    id,
    name: id,
    shortName: trimmed,
    subdomain, // 可能为 null（无法生成拼音时）
    description: `${trimmed}公众号文章`,
  }

  const dynamic = loadDynamicSources()
  dynamic.push(newSource)
  saveDynamicSources(dynamic)

  console.log(
    `[SourceStore] 自动创建新来源: ${id}` +
      (subdomain ? `（子域名前缀: ${subdomain}）` : '（无子域名）')
  )

  return { source: id, created: true, config: newSource }
}
