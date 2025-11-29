/**
 * 发布模式工具函数
 */

/**
 * 判断是否启用发布模式
 */
export function isPublisherMode(): boolean {
  return process.env.PUBLISHER_MODE === 'true'
}
