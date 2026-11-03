import { PostMeta } from './posts'

type SearchablePost = PostMeta & { slug: string }

/**
 * 两层搜索
 * - 第1层：元数据（标题、描述、标签、分类）
 * - 第2层：全文，需要传入 contentIndex（slug → 小写正文），未传入时返回空
 */
export function searchPosts<T extends SearchablePost>(
  posts: T[],
  query: string,
  contentIndex?: Record<string, string> | null
): T[] {
  if (!query.trim()) {
    return posts
  }

  const lowerQuery = query.toLowerCase()

  // 🎯 第1层：快速过滤（元数据）
  const quickResults = searchPostsByMeta(posts, lowerQuery)

  // 🎯 如果元数据中找到结果，直接返回
  if (quickResults.length > 0 || !contentIndex) {
    return quickResults
  }

  // 🎯 第2层：深度搜索（完整内容）
  // 只有在元数据中找不到时，才搜索完整文章内容
  return posts.filter((post) => contentIndex[post.slug]?.includes(lowerQuery))
}

export function hasMetaMatch(posts: SearchablePost[], query: string): boolean {
  return !query.trim() || searchPostsByMeta(posts, query.toLowerCase()).length > 0
}

function searchPostsByMeta<T extends SearchablePost>(posts: T[], lowerQuery: string): T[] {
  return posts.filter((post) => {
    const titleMatch = post.title.toLowerCase().includes(lowerQuery)
    const descriptionMatch = post.description?.toLowerCase().includes(lowerQuery)
    const tagsMatch = post.tags?.some((tag) =>
      tag.toLowerCase().includes(lowerQuery)
    )
    const categoryMatch = post.category?.toLowerCase().includes(lowerQuery)

    return titleMatch || descriptionMatch || tagsMatch || categoryMatch
  })
}
