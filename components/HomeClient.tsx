'use client'

import { useState } from 'react'
import PostCard from '@/components/PostCard'
import SearchBar from '@/components/SearchBar'
import { searchPosts } from '@/lib/search'
import { Post } from '@/lib/posts'

interface HomeClientProps {
  initialPosts: Post[]
  allTags: string[]
  allCategories: string[]
  allSources: string[]
}

export default function HomeClient({
  initialPosts,
  allTags,
  allCategories,
  allSources,
}: HomeClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)

  const filteredPosts = initialPosts.filter((post) => {
    const matchesSearch = searchQuery
      ? searchPosts([post], searchQuery).length > 0
      : true
    const matchesTag = selectedTag ? post.tags?.includes(selectedTag) : true
    const matchesCategory = selectedCategory
      ? post.category === selectedCategory
      : true
    const matchesSource = selectedSource ? post.source === selectedSource : true

    return matchesSearch && matchesTag && matchesCategory && matchesSource && post.published
  })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        {/* <h1 className="text-4xl font-bold mb-4">文章列表</h1> */}
        <SearchBar onSearch={setSearchQuery} />
      </div>

      {/* 来源筛选 */}
      {allSources.length > 0 && (
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
        <div className="mb-8 grid gap-6">
          {filteredPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
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
