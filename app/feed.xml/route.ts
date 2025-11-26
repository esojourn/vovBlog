import { getAllPosts } from '@/lib/posts'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const posts = await getAllPosts(false)

  // 按日期降序排序
  const sortedPosts = posts.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // 获取最新的发布日期
  const latestPubDate = sortedPosts.length > 0
    ? new Date(sortedPosts[0].date).toUTCString()
    : new Date().toUTCString()

  // 构建 RSS XML
  let rss = '<?xml version="1.0" encoding="UTF-8"?>\n'
  rss += '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">\n'
  rss += '  <channel>\n'
  rss += '    <title>瓦器 WaQi.uk - 博客</title>\n'
  rss += `    <link>${escapeXml(baseUrl)}</link>\n`
  rss += '    <description>充满瑕疵的脆弱器皿</description>\n'
  rss += `    <atom:link href="${escapeXml(`${baseUrl}/feed.xml`)}" rel="self" type="application/rss+xml" />\n`
  rss += `    <language>zh-cn</language>\n`
  rss += `    <pubDate>${latestPubDate}</pubDate>\n`
  rss += `    <lastBuildDate>${latestPubDate}</lastBuildDate>\n`
  rss += `    <generator>Next.js RSS</generator>\n`

  // 添加所有文章
  for (const post of sortedPosts) {
    const postUrl = `${baseUrl}/blog/${post.slug}`
    const pubDate = new Date(post.date).toUTCString()

    rss += '    <item>\n'
    rss += `      <title>${escapeXml(post.title)}</title>\n`
    rss += `      <link>${escapeXml(postUrl)}</link>\n`
    rss += `      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>\n`
    rss += `      <pubDate>${pubDate}</pubDate>\n`

    // 添加描述
    if (post.description) {
      rss += `      <description>${escapeXml(post.description)}</description>\n`
    } else {
      // 如果没有描述，使用标题
      rss += `      <description>${escapeXml(post.title)}</description>\n`
    }

    // 添加分类
    if (post.category) {
      rss += `      <category>${escapeXml(post.category)}</category>\n`
    }

    // 添加标签
    if (post.tags && post.tags.length > 0) {
      for (const tag of post.tags) {
        rss += `      <category>${escapeXml(tag)}</category>\n`
      }
    }

    // 添加来源信息
    if (post.source) {
      rss += `      <author>${escapeXml(post.source)}</author>\n`
    }

    rss += '    </item>\n'
  }

  rss += '  </channel>\n'
  rss += '</rss>'

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

/**
 * 转义 XML 特殊字符
 */
function escapeXml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
