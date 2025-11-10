import { Post } from './posts'

export function searchPosts(posts: Post[], query: string): Post[] {
  if (!query.trim()) {
    return posts
  }

  const lowerQuery = query.toLowerCase()

  // 🎯 第1层：快速过滤（元数据）
  // 搜索标题、描述、标签、分类
  const quickResults = posts.filter((post) => {
    const titleMatch = post.title.toLowerCase().includes(lowerQuery)
    const descriptionMatch = post.description?.toLowerCase().includes(lowerQuery)
    const tagsMatch = post.tags?.some((tag) =>
      tag.toLowerCase().includes(lowerQuery)
    )
    const categoryMatch = post.category?.toLowerCase().includes(lowerQuery)

    return titleMatch || descriptionMatch || tagsMatch || categoryMatch
  })

  // 🎯 如果元数据中找到结果，直接返回
  if (quickResults.length > 0) {
    return quickResults
  }

  // 🎯 第2层：深度搜索（完整内容）
  // 只有在元数据中找不到时，才搜索完整文章内容
  // 这样可以保留全文搜索功能，同时 90% 的查询仍然很快
  return posts.filter((post) => {
    return post.content.toLowerCase().includes(lowerQuery)
  })
}
