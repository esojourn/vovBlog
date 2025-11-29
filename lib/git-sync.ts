/**
 * Git 自动同步工具
 *
 * 文章保存成功后自动提交和推送到 GitHub
 * - 使用后台任务处理，不阻塞主请求
 * - 同步失败只记录日志，不影响文章发布
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface GitSyncResult {
  success: boolean
  error?: string
  stdout?: string
}

/**
 * 执行 Git 同步
 * @param slug 文章 slug
 * @param action 操作类型：create | update | delete
 * @returns Git 同步结果
 */
export async function syncToGithub(
  slug: string,
  action: 'create' | 'update' | 'delete'
): Promise<GitSyncResult> {
  const actionText = {
    create: '新增',
    update: '更新',
    delete: '删除',
  }[action]

  const commitMessage = `Auto: ${actionText}文章 ${slug}`

  try {
    console.log(`[GitSync] 开始同步: ${commitMessage}`)

    // 添加文件
    await execAsync('git add content/posts/')
    console.log('[GitSync] 文件已暂存')

    // 检查是否有更改
    const { stdout: statusOutput } = await execAsync('git status --porcelain')
    if (!statusOutput.trim()) {
      console.log('[GitSync] 没有文件更改，跳过提交')
      return {
        success: true,
      }
    }

    // 提交
    const { stdout: commitOutput } = await execAsync(
      `git commit -m "${commitMessage}"`
    )
    console.log(`[GitSync] 提交成功: ${commitOutput.trim()}`)

    // 推送
    const { stdout: pushOutput } = await execAsync('git push')
    console.log(`[GitSync] 推送成功: ${pushOutput.trim()}`)

    return {
      success: true,
      stdout: pushOutput,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[GitSync] 同步失败: ${errorMsg}`)

    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * 后台异步同步（不等待结果）
 * 用于发布流程，避免同步失败影响用户操作
 * @param slug 文章 slug
 * @param action 操作类型
 */
export function syncToGithubAsync(
  slug: string,
  action: 'create' | 'update' | 'delete'
): void {
  // 使用 setImmediate 确保不阻塞当前请求
  setImmediate(async () => {
    try {
      const result = await syncToGithub(slug, action)
      if (!result.success) {
        console.warn(`[GitSync] 后台同步失败 (${slug}): ${result.error}`)
      }
    } catch (error) {
      console.error('[GitSync] 后台同步异常:', error)
    }
  })
}
