import { getAllPosts } from '@/lib/posts'
import Link from 'next/link'
import { Metadata } from 'next'

interface SitemapPost {
  title: string
  slug: string
  date: string
  category?: string
  tags?: string[]
}

// 服务器端获取数据并生成页面
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '网站地图 | 瓦器 WaQi.uk',
    description: '瓦器博客网站地图，查看所有文章列表和分类。',
  }
}

export default async function SitemapPage() {
  const allPosts = await getAllPosts(false)

  // 按分类和日期组织文章
  const groups: Record<string, SitemapPost[]> = {
    '未分类': [],
  }

  allPosts.forEach((post) => {
    const category = post.category || '未分类'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push({
      title: post.title,
      slug: post.slug,
      date: post.date,
      category: post.category,
      tags: post.tags,
    })
  })

  // 每个分类内按日期降序排序
  Object.keys(groups).forEach((category) => {
    groups[category].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  })

  // 按分类字母顺序排序
  const groupedPosts = Object.entries(groups).sort((a, b) =>
    a[0].localeCompare(b[0])
  )


  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">网站地图</h1>
          <p className="text-gray-600 mb-8">
            以下列出本站所有 {allPosts.length} 篇文章
          </p>

          {groupedPosts.map(([category, categoryPosts]) => (
            <section key={category} className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-blue-500">
                {category}
              </h2>
              <ul className="space-y-3">
                {categoryPosts.map((post) => (
                  <li key={post.slug} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {post.title}
                    </Link>
                    <span className="text-sm text-gray-500 mt-1 sm:mt-0">
                      {new Date(post.date).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">统计信息</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-600">总文章数</dt>
                <dd className="text-2xl font-bold text-gray-900">{allPosts.length}</dd>
              </div>
              <div>
                <dt className="text-gray-600">分类数</dt>
                <dd className="text-2xl font-bold text-gray-900">{groupedPosts.length}</dd>
              </div>
              <div>
                <dt className="text-gray-600">最新文章</dt>
                <dd className="text-sm text-gray-700">
                  {allPosts.length > 0
                    ? new Date(allPosts[0].date).toLocaleDateString('zh-CN')
                    : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">更新时间</dt>
                <dd className="text-sm text-gray-700">
                  {new Date().toLocaleDateString('zh-CN')}
                </dd>
              </div>
            </dl>
          </div>

          <nav className="mt-8 pt-8 border-t border-gray-200">
            <Link
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              ← 返回首页
            </Link>
          </nav>
        </div>
      </div>
    </div>
  )
}
