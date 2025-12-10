import { getAllPosts } from '@/lib/posts'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const posts = await getAllPosts(false)

  // 构建 XML 声明和根元素
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
  xml += '         xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n'
  xml += '         xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'

  // 添加首页
  xml += '  <url>\n'
  xml += `    <loc>${escapeXml(baseUrl)}</loc>\n`
  xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`
  xml += '    <changefreq>daily</changefreq>\n'
  xml += '    <priority>1.0</priority>\n'
  xml += '  </url>\n'

  // 添加所有文章
  for (const post of posts) {
    const postUrl = `${baseUrl}/blog/${post.slug}`

    xml += '  <url>\n'
    xml += `    <loc>${escapeXml(postUrl)}</loc>\n`
    xml += `    <lastmod>${post.date.split('T')[0]}</lastmod>\n`
    xml += '    <changefreq>weekly</changefreq>\n'
    xml += '    <priority>0.8</priority>\n'

    // 添加 Google News 扩展
    xml += '    <news:news>\n'
    xml += '      <news:publication>\n'
    xml += '        <news:name>瓦器 WaQi.uk</news:name>\n'
    xml += '        <news:language>zh-CN</news:language>\n'
    xml += '      </news:publication>\n'
    xml += `      <news:publication_date>${post.date}</news:publication_date>\n`
    xml += `      <news:title>${escapeXml(post.title)}</news:title>\n`
    xml += '    </news:news>\n'

    // 添加 Image 扩展（如果有分类或标签作为图片说明）
    if (post.category || post.tags?.length) {
      xml += '    <image:image>\n'
      // 使用通用的文章封面图（可选）
      xml += `      <image:loc>${escapeXml(`${baseUrl}/images/og-image.png`)}</image:loc>\n`
      xml += `      <image:title>${escapeXml(post.title)}</image:title>\n`
      if (post.description) {
        xml += `      <image:caption>${escapeXml(post.description)}</image:caption>\n`
      }
      xml += '    </image:image>\n'
    }

    xml += '  </url>\n'
  }

  xml += '</urlset>'

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
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
