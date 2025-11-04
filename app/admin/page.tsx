'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Post } from '@/lib/posts'
import { PlusCircle, Edit, Trash2, Eye, FileText, LogOut } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error('获取文章失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (slug: string) => {
    if (!confirm('确定要删除这篇文章吗？')) {
      return
    }

    try {
      const response = await fetch(`/api/posts?slug=${slug}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('删除失败')
      }

      alert('删除成功！')
      fetchPosts()
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch (error) {
      console.error('登出失败:', error)
      alert('登出失败，请重试')
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto text-center py-16">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">文章管理</h1>
        <div className="flex gap-3">
          <Link
            href="/admin/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <PlusCircle className="w-4 h-4" />
            新建文章
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" />
            登 出
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg mb-4">还没有文章</p>
          <Link
            href="/admin/new"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            创建第一篇文章 →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.slug}
              className="border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold">{post.title}</h2>
                    {!post.published && (
                      <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                        草稿
                      </span>
                    )}
                  </div>

                  <p className="text-muted-foreground text-sm mb-3">
                    {formatDate(post.date)}
                  </p>

                  {post.description && (
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {post.description}
                    </p>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-primary/10 text-primary rounded text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {post.published && (
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-secondary rounded"
                      title="预览"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  )}
                  <Link
                    href={`/admin/edit/${post.slug}`}
                    className="p-2 hover:bg-secondary rounded"
                    title="编辑"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(post.slug)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
