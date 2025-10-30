'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TipTapEditor from '@/components/TipTapEditor'
import { slugify } from '@/lib/utils'

interface PostFormData {
  title: string
  content: string
  tags: string[]
  category: string
  published: boolean
  description: string
}

export default function NewPostPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    tags: [],
    category: '',
    published: false,
    description: '',
  })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async (publish: boolean) => {
    if (!formData.title.trim()) {
      alert('请输入文章标题')
      return
    }

    setSaving(true)
    try {
      const slug = slugify(formData.title)
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          published: publish,
          date: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('保存失败')
      }

      const { slug: savedSlug } = await response.json()
      alert(publish ? '文章已发布！' : '草稿已保存！')
      router.push(publish ? `/blog/${savedSlug}` : '/admin')
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">创建新文章</h1>
        <p className="text-muted-foreground">
          支持粘贴图片、拖拽上传，保留标题格式
        </p>
      </div>

      <div className="space-y-6">
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
