import { NextResponse } from 'next/server'
import { chromium } from 'playwright-core'
import TurndownService from 'turndown'

interface FetchResult {
  title?: string
  content?: string
  images?: string[]
  publishDate?: string
  accountName?: string
  error?: string
}

const BROWSER_TIMEOUT = 30000 // 30 秒超时

/**
 * 解析中文日期格式为 ISO 8601 字符串
 * 支持格式: "2025年11月6日" -> "2025-11-06T00:00:00.000Z"
 */
function parseChinaDate(dateStr: string): string | null {
  if (!dateStr) return null

  try {
    // 尝试匹配中文日期格式: "2025年11月6日"
    const chineseMatch = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
    if (chineseMatch) {
      const [, year, month, day] = chineseMatch
      const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    }

    // 尝试解析为标准格式 (ISO 8601 或其他标准格式)
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toISOString()
    }

    return null
  } catch {
    return null
  }
}


/**
 * 验证 URL 是否为微信公众号链接
 */
function isValidWeChatUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === 'mp.weixin.qq.com'
  } catch {
    return false
  }
}

/**
 * 标准化图片 URL - 移除查询参数和锚点，避免同一张图的不同变体
 * 例: https://host/path?a=1&b=2#anchor → https://host/path
 */
function normalizeImageUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // 只保留协议、域名、路径，移除查询参数和锚点
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`
  } catch {
    // URL 解析失败，返回原始 URL
    return url
  }
}

/**
 * 从 HTML 提取纯文本中的所有图片 URL（去重）
 */
function extractImageUrls(html: string): string[] {
  const urlMap = new Map<string, string>()  // 标准化 URL → 原始 URL
  const srcRegex = /src=["']([^"']+)["']/g
  let match

  while ((match = srcRegex.exec(html)) !== null) {
    const originalUrl = match[1]
    if (originalUrl.startsWith('http')) {
      const normalizedUrl = normalizeImageUrl(originalUrl)

      // 如果这个标准化 URL 已存在，跳过（去重）
      if (!urlMap.has(normalizedUrl)) {
        urlMap.set(normalizedUrl, originalUrl)
        console.log(`[WeChat Fetch] 提取图片: ${originalUrl}`)
      } else {
        console.log(`[WeChat Fetch] 跳过重复图片: ${originalUrl}`)
      }
    }
  }

  const uniqueUrls = Array.from(urlMap.values())
  console.log(`[WeChat Fetch] 提取完成: 总共 ${uniqueUrls.length} 张唯一图片`)

  return uniqueUrls
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
 * 🔧 将 HTML 转换为 Markdown
 */
function htmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    preformattedCode: true,  // 保留预格式化代码
  })

  // 添加自定义规则防止过度转义
  // 防止图片 alt 中的方括号被转义
  turndownService.addRule('image-safe', {
    filter: 'img',
    replacement: (content, node) => {
      const src = node.getAttribute('src') || ''
      const alt = node.getAttribute('alt') || ''
      // 不转义 alt 中的特殊字符
      return `![${alt}](${src})`
    },
  })

  let markdown = turndownService.turndown(html)

  // 修复常见的过度转义
  // 图片链接中的方括号：!\[text\] → ![text]
  markdown = markdown.replace(/!\\\[([^\]]*)\\\]/g, '![$1]')

  // 粗体中的星号：\*\*text\*\* → **text**
  markdown = markdown.replace(/\\\*\\\*([^\*]*)\\\*\\\*/g, '**$1**')

  // 斜体中的星号：\*text\* → *text*（但不影响列表中的星号）
  markdown = markdown.replace(/(?<![-])\s\\\*([^\*]+)\\\*/g, ' *$1*')

  // 应用空格修正规则
  markdown = fixSpaces(markdown)

  return markdown
}

/**
 * 清洗 HTML 内容（移除微信特定样式和代码）
 */
function cleanWeChatHtml(html: string): string {
  let cleaned = html

  // 移除微信追踪代码
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')

  // 移除微信特定标签（mp-*）
  cleaned = cleaned.replace(/<mp-[^>]*>[\s\S]*?<\/mp-[^>]*>/gi, '')
  cleaned = cleaned.replace(/<mp-[^>]*\s*\/>/gi, '')

  // 第一步：将带有 font-weight: bold 的 span/div 转换为 <strong>
  // 支持 font-weight: bold, font-weight: 700+ (粗体值), 忽略 font-size 等其他样式
  // 匹配模式: <span/div ... style="...font-weight: bold/700+...">内容</span/div>
  cleaned = cleaned.replace(
    /<(span|div)([^>]*?)style=["']([^"']*?)font-weight:\s*(bold|[6-9]00)([^"']*?)["']([^>]*?)>(.*?)<\/\1>/gi,
    '<strong>$7</strong>'
  )

  // 也处理 style 属性在标签开头的情况
  cleaned = cleaned.replace(
    /<(span|div)\s+style=["']([^"']*?)font-weight:\s*(bold|[6-9]00)([^"']*?)["']([^>]*?)>(.*?)<\/\1>/gi,
    '<strong>$6</strong>'
  )

  // 移除 style 属性和 data-* 属性，保留 src、alt 等重要属性
  cleaned = cleaned.replace(/\s+(style|class|data-[a-z-]*|id|title)=["'][^"']*["']/gi, '')

  // 简化嵌套的 span：<span>text<span>more</span></span> → text more
  // 这一步需要重复，因为可能有多层嵌套
  for (let i = 0; i < 3; i++) {
    cleaned = cleaned.replace(/<span[^>]*>([^<]*)<span[^>]*>([^<]*)<\/span>([^<]*)<\/span>/gi, '<span>$1$2$3</span>')
  }

  // 移除不必要的 span 标签，只保留文字
  cleaned = cleaned.replace(/<span[^>]*>([^<]*)<\/span>/gi, '$1')

  // 清理多个空白字符（保留换行）
  cleaned = cleaned.replace(/\s{2,}/g, ' ')

  // 移除空段落
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '')
  cleaned = cleaned.replace(/<p>\s*&nbsp;\s*<\/p>/gi, '')

  // 修复图片标签（处理自闭合）
  cleaned = cleaned.replace(/<img\s+([^>]*?)\s*\/?>/gi, '<img $1 />')

  // 🔧 修复 <br> 标签（必须是自闭合格式）
  // 先处理 </br> 这样的错误格式
  cleaned = cleaned.replace(/<\/br\s*>/gi, '')
  // 然后规范化所有 <br> 为 <br />
  cleaned = cleaned.replace(/<br[^>]*>/gi, '<br />')

  // 修复 <hr> 标签
  cleaned = cleaned.replace(/<hr[^>]*>/gi, '<hr />')

  // 清理标签间的多余空白，但保留段落分隔
  // 保留 </p><p> 等块级元素间的换行，只移除标签间的多余空格
  cleaned = cleaned
    .replace(/>\s{2,}</g, '> <')  // 多个空白 → 单个空白
    .trim()

  // 🔧 最后一步：验证和修复常见的 HTML 错误
  // 确保没有 <br></span> 这样的搭配
  cleaned = cleaned.replace(/<br\s*\/>\s*<\/span>/gi, '</span><br />')

  return cleaned
}

/**
 * 使用 Playwright 爬取微信公众号文章
 */
async function fetchWeChatArticle(url: string): Promise<FetchResult> {
  let browser = null

  try {
    console.log(`[WeChat Fetch] 开始爬取: ${url}`)

    // 尝试使用系统中的 Chromium，如果失败则使用 playwright 下载的
    browser = await chromium.launch({
      headless: true,
      timeout: BROWSER_TIMEOUT,
    })

    console.log('[WeChat Fetch] 浏览器已启动')

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })

    const page = await context.newPage()

    // 设置导航超时
    page.setDefaultTimeout(BROWSER_TIMEOUT)

    console.log('[WeChat Fetch] 访问页面...')

    // 访问页面
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' })
    } catch (err) {
      console.warn('[WeChat Fetch] 页面加载超时或失败:', err)
      // 继续尝试提取内容
    }

    // 等待主内容加载
    try {
      await page.waitForSelector('#js_content', { timeout: 5000 })
      console.log('[WeChat Fetch] 主内容已加载')
    } catch {
      console.warn('[WeChat Fetch] 未找到主内容选择器，继续尝试...')
    }

    // 提取标题
    let title = ''
    try {
      const titleElement = await page.$('#activity-name')
      if (titleElement) {
        const titleText = await titleElement.textContent()
        title = titleText?.trim() || ''
      }
    } catch (err) {
      console.warn('[WeChat Fetch] 提取标题失败:', err)
    }

    // 提取发布日期
    let publishDate = ''
    try {
      // 尝试多个日期选择器
      const publishTimeSelectors = [
        '#publish_time',
        '.publish_time',
        '#js_publish_time',
        'span#publish_time',
      ]

      for (const selector of publishTimeSelectors) {
        try {
          const dateElement = await page.$(selector)
          if (dateElement) {
            const dateText = await dateElement.textContent()
            const trimmedDate = dateText?.trim() || ''
            if (trimmedDate) {
              const parsed = parseChinaDate(trimmedDate)
              if (parsed) {
                publishDate = parsed
                console.log(`[WeChat Fetch] 通过选择器 ${selector} 提取到日期: ${trimmedDate}`)
                break
              }
            }
          }
        } catch {
          // 继续尝试下一个选择器
        }
      }

      // 如果仍未找到日期，尝试从页面内容中提取
      if (!publishDate) {
        const pageContent = await page.content()

        // 尝试从脚本变量中提取
        const scriptMatch = pageContent.match(/var\s+ct_publish_time\s*=\s*(\d+)/)
        if (scriptMatch) {
          const timestamp = parseInt(scriptMatch[1], 10)
          if (!isNaN(timestamp)) {
            const date = new Date(timestamp * 1000)
            publishDate = date.toISOString()
            console.log(`[WeChat Fetch] 从脚本变量提取到时间戳: ${timestamp}`)
          }
        }

        // 尝试从 meta 标签中提取
        if (!publishDate) {
          const metaDateMatch = pageContent.match(
            /<meta\s+(?:name|property)=["'](?:publish|updated)_?time["']\s+content=["']([^"']+)["']/i
          )
          if (metaDateMatch && metaDateMatch[1]) {
            const parsed = parseChinaDate(metaDateMatch[1])
            if (parsed) {
              publishDate = parsed
              console.log(`[WeChat Fetch] 从 meta 标签提取到日期: ${metaDateMatch[1]}`)
            }
          }
        }
      }

      if (!publishDate) {
        console.warn('[WeChat Fetch] 未能提取到发布日期')
      }
    } catch (err) {
      console.warn('[WeChat Fetch] 提取日期失败:', err)
    }

    // 提取公众号名称
    let accountName = ''
    try {
      // 微信公众号名称的常见选择器
      const accountSelectors = [
        '#js_name',                    // 主要选择器
        '.rich_media_meta_nickname',   // 备用选择器 1
      ]

      for (const selector of accountSelectors) {
        try {
          const accountElement = await page.$(selector)
          if (accountElement) {
            const accountText = await accountElement.textContent()
            const trimmed = accountText?.trim() || ''
            if (trimmed) {
              accountName = trimmed
              console.log(`[WeChat Fetch] 通过选择器 ${selector} 提取到公众号: ${accountName}`)
              break
            }
          }
        } catch {
          // 继续尝试下一个选择器
        }
      }

      if (!accountName) {
        console.warn('[WeChat Fetch] 未能提取到公众号名称')
      }
    } catch (err) {
      console.warn('[WeChat Fetch] 提取公众号名称失败:', err)
    }

    let content = ''
    try {
      const contentElement = await page.$('#js_content')
      if (contentElement) {
        // 先获取 HTML，处理懒加载图片
        let html = await contentElement.innerHTML()

        // 处理微信的 data-src 懒加载
        html = html.replace(/data-src=/gi, 'src=')

        // 清洗 HTML
        content = cleanWeChatHtml(html)
        console.log(`[WeChat Fetch] 内容长度: ${content.length} 字符`)
      }
    } catch (err) {
      console.warn('[WeChat Fetch] 提取内容失败:', err)
    }

    // 提取图片 URL
    const images = extractImageUrls(content)
    console.log(`[WeChat Fetch] 提取到 ${images.length} 张图片`)

    if (!title && !content) {
      return {
        error: '无法提取文章内容，可能由于本地网络环境变化，也可能被反爬虫拦截或页面结构已变更',
      }
    }

    await context.close()

    // 🔧 修复：返回清洗后的 HTML 格式内容
    // 编辑器会自动将 HTML 转换为 Markdown，前端图片 URL 替换逻辑也需要 HTML 格式
    return {
      title,
      content,  // 直接返回清洗后的 HTML，不进行 Markdown 转换
      images,
      publishDate: publishDate || undefined,
      accountName: accountName || undefined,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('[WeChat Fetch] 爬取失败:', errorMsg)
    return {
      error: `爬取失败: ${errorMsg}`,
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * POST /api/fetch-wechat-article
 * 爬取微信公众号文章
 *
 * 查询参数:
 * - url: 微信公众号文章链接
 *
 * 响应:
 * {
 *   title?: string
 *   content?: string
 *   images?: string[]
 *   publishDate?: string (ISO 8601 格式)
 *   error?: string
 * }
 */
export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: '请提供文章 URL' }, { status: 400 })
    }

    if (!isValidWeChatUrl(url)) {
      return NextResponse.json(
        { error: '仅支持微信公众号链接 (mp.weixin.qq.com)' },
        { status: 400 }
      )
    }

    const result = await fetchWeChatArticle(url)
    return NextResponse.json(result)
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('[WeChat Fetch API] 请求处理失败:', errorMsg)
    return NextResponse.json(
      { error: `处理失败: ${errorMsg}` },
      { status: 500 }
    )
  }
}
