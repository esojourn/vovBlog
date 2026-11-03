import { getAllPosts } from '@/lib/posts'

// 构建时生成的全文搜索索引（slug → 正文），由 CDN 缓存
// 首页只在元数据搜索无结果时才按需加载，避免每次访问首页都传输全文
export const dynamic = 'force-static'

export async function GET() {
  const posts = await getAllPosts(true)
  const index: Record<string, string> = {}
  for (const post of posts) {
    if (post.published) {
      index[post.slug] = post.content.toLowerCase()
    }
  }

  return Response.json(index, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=31536000',
    },
  })
}
