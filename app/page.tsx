import { getAllPosts, extractTags, extractCategories, extractSources } from '@/lib/posts'
import HomeClient from '@/components/HomeClient'

export default async function HomePage() {
  // 🎯 加载完整内容以支持混合搜索（方案A）
  // 第1层搜索：快速搜索元数据（标题、描述、标签）
  // 第2层搜索：仅当元数据无结果时，才搜索完整内容
  // 这样可以保留全文搜索功能，同时大多数查询依然很快（5-10ms）
  const posts = await getAllPosts(true)
  const tags = extractTags(posts)
  const categories = extractCategories(posts)
  const sources = extractSources(posts)

  return <HomeClient initialPosts={posts} allTags={tags} allCategories={categories} allSources={sources} />
}
