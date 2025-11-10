import { getAllPosts, extractTags, extractCategories, extractSources } from '@/lib/posts'
import HomeClient from '@/components/HomeClient'

export default async function HomePage() {
  // 🎯 优化：首页只加载元数据，不加载完整内容
  const posts = await getAllPosts(false)
  const tags = extractTags(posts)
  const categories = extractCategories(posts)
  const sources = extractSources(posts)

  return <HomeClient initialPosts={posts} allTags={tags} allCategories={categories} allSources={sources} />
}
