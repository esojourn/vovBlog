'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import PostCard from '@/components/PostCard'
import SearchBar from '@/components/SearchBar'
import { CreateButton } from '@/components/CreateButton'
import { AdminLink } from '@/components/AdminLink'
import { searchPosts, hasMetaMatch } from '@/lib/search'
import { PostSummary } from '@/lib/posts'

interface HomeClientProps {
  initialPosts: PostSummary[]
  allTags: string[]
  allCategories: string[]
  allSources: string[]
  currentSubdomain?: string | null
  publisherMode: boolean
  isAuthenticated: boolean
}

const POSTS_PER_PAGE = 20

export default function HomeClient({
  initialPosts,
  allTags,
  allCategories,
  allSources,
  currentSubdomain,
  publisherMode,
  isAuthenticated,
}: HomeClientProps) {
  // 发布模式受限内容显示
  if (publisherMode && !isAuthenticated) {
    // 返回 null，不显示任何内容
    // 页面布局中的 header 会自动显示，页脚会被 layout 隐藏
    return null
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  // 🎯 无限滚动状态
  const [displayedCount, setDisplayedCount] = useState(POSTS_PER_PAGE)
  const observerTarget = useRef<HTMLDivElement>(null)
  // 🎯 全文索引：仅在元数据搜索无结果时按需加载
  const [contentIndex, setContentIndex] = useState<Record<string, string> | null>(null)
  const indexRequested = useRef(false)

  useEffect(() => {
    if (indexRequested.current || hasMetaMatch(initialPosts, searchQuery)) return
    indexRequested.current = true
    fetch('/search-index.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setContentIndex(data))
      .catch(() => {
        indexRequested.current = false
      })
  }, [initialPosts, searchQuery])

  const filteredPosts = useMemo(() => {
    // 🎯 优化：先用搜索函数过滤，再用其他条件过滤
    // 这样搜索函数只调用一次，而不是对每篇文章调用一次
    const searchFiltered = searchQuery
      ? searchPosts(initialPosts, searchQuery, contentIndex)
      : initialPosts

    return searchFiltered.filter((post) => {
      const matchesTag = selectedTag ? post.tags?.includes(selectedTag) : true
      const matchesCategory = selectedCategory
        ? post.category === selectedCategory
        : true
      const matchesSource = selectedSource ? post.source === selectedSource : true

      return matchesTag && matchesCategory && matchesSource && post.published
    })
  }, [initialPosts, searchQuery, contentIndex, selectedTag, selectedCategory, selectedSource])

  // 🎯 显示的文章列表
  const displayedPosts = useMemo(() => {
    return filteredPosts.slice(0, displayedCount)
  }, [filteredPosts, displayedCount])

  const hasMore = displayedCount < filteredPosts.length

  // 🎯 加载更多
  const loadMore = useCallback(() => {
    setDisplayedCount((prev) =>
      Math.min(prev + POSTS_PER_PAGE, filteredPosts.length)
    )
  }, [filteredPosts.length])

  // 🎯 Intersection Observer 实现自动加载
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const target = observerTarget.current
    if (target) observer.observe(target)

    return () => {
      if (target) observer.unobserve(target)
    }
  }, [hasMore, loadMore])

  // 🎯 筛选条件变化时重置
  useEffect(() => {
    setDisplayedCount(POSTS_PER_PAGE)
  }, [filteredPosts.length])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        {/* 创建和管理按钮 - 登录状态下显示 */}
        <div className="flex gap-3 mb-4">
          <CreateButton />
          <AdminLink />
        </div>
        {/* <h1 className="text-4xl font-bold mb-4">文章列表</h1> */}
        <SearchBar onSearch={setSearchQuery} />
      </div>

      {/* 来源筛选 - 在子域名访问时隐藏 */}
      {!currentSubdomain && allSources.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-2">文章来源</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSource(null)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                !selectedSource
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              全部
            </button>
            {allSources.map((source) => (
              <button
                key={source}
                onClick={() => setSelectedSource(source)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedSource === source
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                {source}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 文章列表 */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">暂无文章</p>
          <p className="text-muted-foreground mt-2">
            <a href="/admin/new" className="text-primary hover:underline">
              去创建第一篇文章
            </a>
          </p>
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-6">
            {displayedPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>

          {/* 无限滚动加载触发器 */}
          {hasMore && (
            <div ref={observerTarget} className="h-20 flex items-center justify-center mb-8">
              <span className="text-muted-foreground">加载更多...</span>
            </div>
          )}

          {/* 已加载全部 */}
          {!hasMore && displayedPosts.length > 0 && (
            <div className="text-center py-8 text-muted-foreground mb-8">
              已显示全部 {filteredPosts.length} 篇文章
            </div>
          )}
        </>
      )}

      {/* 分类筛选 */}
      {allCategories.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-2">分类</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !selectedCategory
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              全部
            </button>
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 标签筛选 */}
      {allTags.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium mb-2">标签</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                !selectedTag
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              全部
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTag === tag
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
