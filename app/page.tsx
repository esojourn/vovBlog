import { getAllPosts, getAllTags, getAllCategories } from '@/lib/posts'
import HomeClient from '@/components/HomeClient'

export default async function HomePage() {
  const posts = await getAllPosts()
  const tags = await getAllTags()
  const categories = await getAllCategories()

  return <HomeClient initialPosts={posts} allTags={tags} allCategories={categories} />
}
