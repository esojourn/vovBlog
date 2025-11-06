'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import TipTapEditor from '@/components/TipTapEditor'
import { Post } from '@/lib/posts'

interface PostFormData {
  title: string
  content: string
  tags: string[]
  category: string
  published: boolean
  description: string
  date: string
  source: string
  originalUrl: string
}

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    tags: [],
    category: '',
    published: false,
    description: '',
    date: '',
    source: '"瓦器微声"公众号',
    originalUrl: '',
  })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importUrl, setImportUrl] = useState('')

  useEffect(() => {
    fetchPost()
  }, [slug])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts?slug=${slug}`)
      if (!response.ok) {
        throw new Error('获取文章失败')
      }
      const post: Post = await response.json()
      setFormData({
        title: post.title,
        content: post.content,
        tags: post.tags || [],
        category: post.category || '',
        published: post.published !== false,
        description: post.description || '',
        date: post.date,
        source: post.source || '"瓦器微声"公众号',
        originalUrl: post.originalUrl || '',
      })
      if (post.originalUrl) {
        setImportUrl(post.originalUrl)
      }
    } catch (error) {
      console.error('获取文章失败:', error)
      alert('获取文章失败')
      router.push('/admin')
    } finally {
      setLoading(false)
    }
  }

  const handleImportArticle = async () => {
    if (!importUrl.trim()) {
      setImportError('请输入原文链接')
      return
    }

    setImporting(true)
    setImportError('')

    try {
      console.log('[Import] 开始导入:', importUrl)

      const response = await fetch('/api/fetch-wechat-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl }),
      })

      if (!response.ok) {
        throw new Error('导入请求失败')
      }

      const data = await response.json()

      if (data.error) {
        setImportError(data.error)
        return
      }

      console.log('[Import] 导入成功，原始内容:', data)

      // 如果有图片 URL，使用代理上传
      let processedContent = data.content || ''
      if (data.images && data.images.length > 0) {
        console.log('[Import] 开始上传图片:', data.images)
        try {
          const uploadResponse = await fetch('/api/proxy-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrls: data.images.slice(0, 5) }), // 最多 5 张
          })

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            console.log('[Import] 图片上传结果:', uploadData)

            // 替换 HTML 中的图片 URL
            if (uploadData.results) {
              uploadData.results.forEach((result: any, index: number) => {
                if (result.url && data.images[index]) {
                  const originalUrl = data.images[index]
                  processedContent = processedContent.replace(
                    new RegExp(originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                    result.url
                  )
                  console.log(`[Import] 已替换图片 ${index + 1}/${data.images.length}`)
                }
              })
            }
          } else {
            console.warn('[Import] 图片上传失败，继续使用原始 URL')
          }
        } catch (err) {
          console.warn('[Import] 图片上传异常:', err)
          // 继续使用原始 URL
        }
      }

      // 填充表单数据
      setFormData((prev) => ({
        ...prev,
        title: data.title || prev.title,
        content: processedContent || prev.content,
        originalUrl: importUrl,
      }))

      alert('✅ 文章导入成功！请检查并编辑后再发布')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '导入失败'
      console.error('[Import] 错误:', error)
      setImportError(`导入失败: ${errorMsg}`)
    } finally {
      setImporting(false)
    }
  }

  const handleSave = async (publish: boolean) => {
    if (!formData.title.trim()) {
      alert('请输入文章标题')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/posts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug,
          ...formData,
          published: publish,
        }),
      })

      if (!response.ok) {
        throw new Error('保存失败')
      }

      alert(publish ? '文章已发布！' : '更新成功！')
      router.push(publish ? `/blog/${slug}` : '/admin')
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmedTag],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">编辑文章</h1>
        <p className="text-muted-foreground">
          支持粘贴图片、拖拽上传，保留标题格式
        </p>
      </div>

      <div className="space-y-6">
        {/* 原文链接导入 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            原文链接（微信公众号）
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={importUrl}
              onChange={(e) => {
                setImportUrl(e.target.value)
                setImportError('')
              }}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="粘贴微信公众号文章链接... (mp.weixin.qq.com)"
              disabled={importing}
            />
            <button
              type="button"
              onClick={handleImportArticle}
              disabled={importing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? '导入中...' : '导入'}
            </button>
          </div>
          {importError && (
            <p className="text-sm text-red-600 mt-1">{importError}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            ℹ️ 自动导入标题、正文和图片，导入后可继续编辑
          </p>
        </div>

        {/* 标题 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            文章标题 *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="输入文章标题..."
          />
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            文章描述
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="简短描述文章内容..."
            rows={2}
          />
        </div>

        {/* 分类 */}
        <div>
          <label className="block text-sm font-medium mb-2">分类</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, category: e.target.value }))
            }
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="例如：技术、生活、随笔..."
          />
        </div>

        {/* 文章来源 */}
        <div>
          <label className="block text-sm font-medium mb-2">文章来源</label>
          <select
            value={formData.source}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, source: e.target.value }))
            }
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value='"瓦器微声"公众号'>"瓦器微声"公众号</option>
            <option value="原创">原创</option>
          </select>
        </div>

        {/* 标签 */}
        <div>
          <label className="block text-sm font-medium mb-2">标签</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="输入标签，按回车添加..."
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
            >
              添加
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-destructive"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 编辑器 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            文章内容 *
          </label>
          <TipTapEditor
            content={formData.content}
            onChange={(content) =>
              setFormData((prev) => ({ ...prev, content }))
            }
            placeholder="开始写作... 支持粘贴图片、拖拽上传"
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-4 justify-end pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg hover:bg-secondary"
            disabled={saving}
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
            disabled={saving}
          >
            {saving ? '保存中...' : '保存草稿'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            disabled={saving}
          >
            {saving ? '发布中...' : '发布文章'}
          </button>
        </div>
      </div>
    </div>
  )
}
