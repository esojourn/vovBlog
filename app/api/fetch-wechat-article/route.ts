import { NextResponse } from 'next/server'
import { chromium } from 'playwright-core'

interface FetchResult {
  title?: string
  content?: string
  images?: string[]
  error?: string
}

const BROWSER_TIMEOUT = 30000 // 30 秒超时

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
 * 从 HTML 提取纯文本中的所有图片 URL
 */
function extractImageUrls(html: string): string[] {
  const urls: string[] = []
  // 匹配 src 属性中的 URL
  const srcRegex = /src=["']([^"']+)["']/g
  let match
  while ((match = srcRegex.exec(html)) !== null) {
    const url = match[1]
    if (url.startsWith('http')) {
      urls.push(url)
    }
  }
  return [...new Set(urls)] // 去重
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

  // 清理标签间的空白
  cleaned = cleaned
    .replace(/>\s+</g, '><')
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

    // 提取正文内容
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
        error: '无法提取文章内容，可能被反爬虫拦截或页面结构已变更',
      }
    }

    await context.close()

    return {
      title,
      content,
      images,
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
