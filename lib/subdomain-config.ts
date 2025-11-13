/**
 * ⚠️ 废弃提示：此文件仅用于向后兼容
 *
 * 所有来源配置已迁移到 lib/source-config.ts
 * 请在新代码中直接导入使用 source-config.ts
 *
 * 迁移指南：
 * - import { SUBDOMAIN_SOURCE_MAP, getSourceBySubdomain, ... } from '@/lib/subdomain-config'
 * + import { SUBDOMAIN_SOURCE_MAP, getSourceBySubdomain, ... } from '@/lib/source-config'
 */

// 重新导出所有函数和常量，保持向后兼容
export {
  SUBDOMAIN_SOURCE_MAP,
  getSourceBySubdomain,
  getSubdomainBySource,
  getAllSubdomains,
  isValidSubdomain,
  // 新增导出，仅在此文件中重导出
  getDefaultSource,
  getSourceConfig,
  matchSourceByAccountName,
  getAllSourceOptions,
  getAllSourceIds,
  ACCOUNT_SOURCE_MAP,
  SOURCES,
  type SourceConfig,
} from '@/lib/source-config'
