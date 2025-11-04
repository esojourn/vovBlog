'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback, useState } from 'react'
import DOMPurify from 'dompurify'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Loader2,
} from 'lucide-react'

interface TipTapEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
}

export default function TipTapEditor({
  content = '',
  onChange,
  placeholder = '开始写作...',
}: TipTapEditorProps) {
  const [uploading, setUploading] = useState(false)

  const sanitizeHtml = (html: string) => {
    // 第一步：DOMPurify清理危险标签和属性
    const cleanHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote',
        'code', 'pre', 'span', 'div'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'style'],
      KEEP_CONTENT: true,
    })

    // 第二步：HTML结构修复（处理复杂的嵌套错误）
    let fixedHtml = cleanHtml

    // 修复自闭合标签后的错误结束标签（如<img></p>）
    fixedHtml = fixedHtml.replace(/<(img|br|hr)\s*[^>]*>(?=[^<]*<\/p>)/gi, '<$1 />')

    // 修复孤立的结束标签
    fixedHtml = fixedHtml.replace(/<\/p>\s*<\/p>/g, '</p>') // 连续结束标签
    fixedHtml = fixedHtml.replace(/<p>\s*<\/p>/g, '') // 空段落

    // 统一自闭合标签格式
    fixedHtml = fixedHtml
      .replace(/<br\s*\/?>/gi, '<br />')
      .replace(/<hr\s*\/?>/gi, '<hr />')
      .replace(/<img\s+([^>]*?)\/?>/gi, '<img $1 />')

    // 修复段落结构
    fixedHtml = fixedHtml
      .replace(/<p><br\s*\/?><\/p>/gi, '')
      .replace(/<p><br\s*\/?>/gi, '<p>')
      .replace(/<br\s*\/?><\/p>/gi, '</p>')
      .replace(/\s+<\/p>/gi, '</p>')
      .replace(/<p>\s+/gi, '<p>')

    // 第三步：确保所有图片标签格式正确
    fixedHtml = fixedHtml.replace(
      /<img([^>]+?)\/>(?=\s*<\/p>)/g,
      '<img$1 />'
    )

    return fixedHtml
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0]
          if (file.type.startsWith('image/')) {
            event.preventDefault()
            handleImageUpload(file)
            return true
          }
        }
        return false
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || [])

        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const file = item.getAsFile()
            if (file) {
              handleImageUpload(file)
            }
            return true
          }
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const sanitizedHtml = sanitizeHtml(html)
      onChange?.(sanitizedHtml)
    },
  })

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return

      setUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('上传失败')
        }

        const { url } = await response.json()
        editor.chain().focus().setImage({ src: url }).run()
      } catch (error) {
        console.error('图片上传失败:', error)
        alert('图片上传失败，请重试')
      } finally {
        setUploading(false)
      }
    },
    [editor]
  )

  const handleImageSelect = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        await handleImageUpload(file)
      }
    }
    input.click()
  }, [handleImageUpload])

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 工具栏 */}
      <div className="bg-muted border-b p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-background ${
            editor.isActive('bold') ? 'bg-background' : ''
          }`}
          title="粗体"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-background ${
            editor.isActive('italic') ? 'bg-background' : ''
          }`}
          title="斜体"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-px bg-border mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-background ${
            editor.isActive('heading', { level: 1 }) ? 'bg-background' : ''
          }`}
          title="标题 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-background ${
            editor.isActive('heading', { level: 2 }) ? 'bg-background' : ''
          }`}
          title="标题 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-background ${
            editor.isActive('heading', { level: 3 }) ? 'bg-background' : ''
          }`}
          title="标题 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px bg-border mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-background ${
            editor.isActive('bulletList') ? 'bg-background' : ''
          }`}
          title="无序列表"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-background ${
            editor.isActive('orderedList') ? 'bg-background' : ''
          }`}
          title="有序列表"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px bg-border mx-1" />

        <button
          type="button"
          onClick={handleImageSelect}
          className="p-2 rounded hover:bg-background flex items-center gap-1"
          title="插入图片"
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* 编辑器内容 */}
      <EditorContent editor={editor} className="min-h-[400px]" />

      {uploading && (
        <div className="p-2 text-sm text-muted-foreground bg-muted border-t">
          正在上传图片...
        </div>
      )}
    </div>
  )
}
