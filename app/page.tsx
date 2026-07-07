import { headers, cookies } from 'next/headers'
import { getAllPosts, extractTags, extractCategories, extractSources } from '@/lib/posts'
import { getCurrentSubdomain, getMainDomain } from '@/lib/domain-utils'
import { getSourceBySubdomainMerged } from '@/lib/source-store'
import { isPublisherMode } from '@/lib/publisher-mode'
import HomeClient from '@/components/HomeClient'

export default async function HomePage() {
  // 🎯 加载完整内容以支持混合搜索（方案A）
  // 第1层搜索：快速搜索元数据（标题、描述、标签）
  // 第2层搜索：仅当元数据无结果时，才搜索完整内容
  // 这样可以保留全文搜索功能，同时大多数查询依然很快（5-10ms）

  // 发布模式检查
  const publisherMode = isPublisherMode()

  // 检查登录状态
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin_session')
  const isAuthenticated = !!sessionCookie?.value

  // 在发布模式且未登录时，不加载文章数据
  const shouldLoadPosts = !publisherMode || isAuthenticated

  const allPosts = shouldLoadPosts ? await getAllPosts(true) : []

  // 🌐 子域名支持：识别当前访问的子域名
  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host')
  const mainDomain = getMainDomain()
  const currentSubdomain = getCurrentSubdomain(mainDomain, host)

  // 如果通过子域名访问，只显示对应来源的文章
  let posts = allPosts
  if (currentSubdomain && shouldLoadPosts) {
    const targetSource = getSourceBySubdomainMerged(currentSubdomain)
    if (targetSource) {
      posts = allPosts.filter((post) => post.source === targetSource)
    }
  }

  // 总是从所有文章中提取标签、分类、来源（用于首页展示）
  const tags = shouldLoadPosts ? extractTags(posts) : []
  const categories = shouldLoadPosts ? extractCategories(posts) : []
  const sources = shouldLoadPosts ? extractSources(posts) : []

  return (
    <HomeClient
      initialPosts={posts}
      allTags={tags}
      allCategories={categories}
      allSources={sources}
      currentSubdomain={currentSubdomain}
      publisherMode={publisherMode}
      isAuthenticated={isAuthenticated}
    />
  )
}
