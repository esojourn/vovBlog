#!/usr/bin/env bun
/**
 * HTML 转 Markdown 迁移脚本
 * 用途：将现有的 HTML 格式的文章转换为 Markdown 格式
 * 使用：bun run scripts/migrate-to-markdown.ts
 */

import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import TurndownService from 'turndown'

const postsDirectory = path.join(process.cwd(), 'content/posts')

interface MigrationResult {
  success: number
  failed: number
  skipped: number
  errors: Array<{ file: string; error: string }>
}

/**
 * 🔧 修正文本中的多余空格
 */
function fixSpaces(text: string): string {
  return text
    .replace(/属\s+灵/g, '属灵')
    .replace(/恩\s+赐/g, '恩赐')
    .replace(/宣\s+教/g, '宣教')
    .replace(/教\s+会/g, '教会')
}

/**
 * 检查内容是否是 Markdown
 * 简单启发式：Markdown 通常包含 #、**、- 等标记，而 HTML 包含 < >
 */
function isMarkdown(content: string): boolean {
  // 如果包含 HTML 标签，判为 HTML
  if (/<[a-z][^>]*>/i.test(content)) {
    return false
  }
  // 如果包含 Markdown 标记，判为 Markdown
  if (/^#+\s|^\*{1,3}\s|^[-*]\s|^\d+\.\s|\*\*|`/m.test(content)) {
    return true
  }
  // 默认判为 Markdown（纯文本）
  return true
}

/**
 * 将 HTML 转换为 Markdown
 */
function htmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx', // 使用 # 风格
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
  })

  // 添加规则：保留链接的 title 属性
  turndownService.addRule('link-with-title', {
    filter: 'a',
    replacement: (content, node) => {
      const href = node.getAttribute('href') || ''
      const title = node.getAttribute('title') || ''
      if (title) {
        return `[${content}](${href} "${title}")`
      }
      return `[${content}](${href})`
    },
  })

  // 添加规则：处理图片的 alt 和 title
  turndownService.addRule('image-with-title', {
    filter: 'img',
    replacement: (content, node) => {
      const src = node.getAttribute('src') || ''
      const alt = node.getAttribute('alt') || ''
      const title = node.getAttribute('title') || ''
      if (title) {
        return `![${alt}](${src} "${title}")`
      }
      return `![${alt}](${src})`
    },
  })

  try {
    let markdown = turndownService.turndown(html)
    // 🔧 新增：应用空格修正规则
    markdown = fixSpaces(markdown)
    return markdown
  } catch (err) {
    console.error('Turndown 转换失败:', err)
    throw err
  }
}

/**
 * 迁移单个文件
 */
async function migrateFile(filePath: string): Promise<{ success: boolean; message: string }> {
  try {
    const fileName = path.basename(filePath)

    // 读取文件
    const fileContents = await fs.readFile(filePath, 'utf8')
    const { data, content } = matter(fileContents)

    // 检查是否已经是 Markdown
    const isAlreadyMarkdown = isMarkdown(content)
    let processedContent = content

    if (isAlreadyMarkdown) {
      // 🔧 新增：即使已经是 Markdown，也应用空格修正规则
      processedContent = fixSpaces(content)

      // 检查是否有变化
      if (processedContent === content) {
        return {
          success: true,
          message: `⏭️  ${fileName} - 已经是 Markdown，跳过`,
        }
      } else {
        // 有改动，需要保存
        console.log(`🔧 修正 ${fileName} 中的空格...`)
        const migrated = matter.stringify(processedContent, data)
        await fs.writeFile(filePath, migrated, 'utf8')
        return {
          success: true,
          message: `✨ ${fileName} - 已修正空格`,
        }
      }
    }

    // 转换 HTML 到 Markdown
    console.log(`🔄 转换 ${fileName}...`)
    const markdown = htmlToMarkdown(content)

    // 验证转换结果
    if (!markdown || markdown.length === 0) {
      return {
        success: false,
        message: `❌ ${fileName} - Markdown 转换结果为空`,
      }
    }

    // 写回文件
    const migrated = matter.stringify(markdown, data)
    await fs.writeFile(filePath, migrated, 'utf8')

    return {
      success: true,
      message: `✅ ${fileName} - 转换成功 (${content.length} → ${markdown.length} bytes)`,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      message: `❌ 转换失败: ${errorMsg}`,
    }
  }
}

/**
 * 执行迁移
 */
async function migrate(): Promise<void> {
  console.log('🚀 开始迁移文章格式（HTML → Markdown）\n')

  const result: MigrationResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  }

  try {
    // 读取所有 .mdx 文件
    const files = await fs.readdir(postsDirectory)
    const mdxFiles = files.filter((f) => f.endsWith('.mdx'))

    console.log(`📁 找到 ${mdxFiles.length} 个文章文件\n`)

    // 逐个迁移
    for (const file of mdxFiles) {
      const filePath = path.join(postsDirectory, file)
      const migrationResult = await migrateFile(filePath)

      console.log(migrationResult.message)

      if (migrationResult.success) {
        if (migrationResult.message.includes('⏭️')) {
          result.skipped++
        } else {
          result.success++
        }
      } else {
        result.failed++
        result.errors.push({
          file,
          error: migrationResult.message,
        })
      }
    }

    // 打印摘要
    console.log('\n' + '='.repeat(50))
    console.log('📊 迁移摘要')
    console.log('='.repeat(50))
    console.log(`✅ 成功转换: ${result.success} 个`)
    console.log(`⏭️  已跳过: ${result.skipped} 个（已是 Markdown）`)
    console.log(`❌ 转换失败: ${result.failed} 个`)

    if (result.errors.length > 0) {
      console.log('\n⚠️  错误详情：')
      result.errors.forEach(({ file, error }) => {
        console.log(`  - ${file}: ${error}`)
      })
    }

    console.log('\n✨ 迁移完成！')

    if (result.failed === 0) {
      console.log('🎉 所有文章已成功转换为 Markdown 格式！')
      process.exit(0)
    } else {
      console.log('⚠️  部分文章转换失败，请检查错误信息')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ 迁移过程出错:', error)
    process.exit(1)
  }
}

// 执行迁移
migrate()
