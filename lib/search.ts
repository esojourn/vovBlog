import { Post } from './posts'

export function searchPosts(posts: Post[], query: string): Post[] {
  if (!query.trim()) {
    return posts
  }

  const lowerQuery = query.toLowerCase()

  return posts.filter((post) => {
    const titleMatch = post.title.toLowerCase().includes(lowerQuery)
    const contentMatch = post.content.toLowerCase().includes(lowerQuery)
    const tagsMatch = post.tags?.some((tag) =>
      tag.toLowerCase().includes(lowerQuery)
    )
    const categoryMatch = post.category?.toLowerCase().includes(lowerQuery)

    return titleMatch || contentMatch || tagsMatch || categoryMatch
  })
}
