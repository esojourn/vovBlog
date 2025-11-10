import { Post } from './posts'

export function searchPosts(posts: Post[], query: string): Post[] {
  if (!query.trim()) {
    return posts
  }

  const lowerQuery = query.toLowerCase()

  return posts.filter((post) => {
    // 🎯 优化：只搜索元数据（标题、描述、标签、分类），不搜索完整内容
    // 这样更高效，首页也就不需要传输完整 content
    const titleMatch = post.title.toLowerCase().includes(lowerQuery)
    const descriptionMatch = post.description?.toLowerCase().includes(lowerQuery)
    const tagsMatch = post.tags?.some((tag) =>
      tag.toLowerCase().includes(lowerQuery)
    )
    const categoryMatch = post.category?.toLowerCase().includes(lowerQuery)

    return titleMatch || descriptionMatch || tagsMatch || categoryMatch
  })
}
