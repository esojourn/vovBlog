import { getAllPosts, getAllTags, getAllCategories, getAllSources } from '@/lib/posts'
import HomeClient from '@/components/HomeClient'

export default async function HomePage() {
  const posts = await getAllPosts()
  const tags = await getAllTags()
  const categories = await getAllCategories()
  const sources = await getAllSources()

  return <HomeClient initialPosts={posts} allTags={tags} allCategories={categories} allSources={sources} />
}
