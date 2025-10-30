'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback, useState } from 'react'
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

  const editor = useEditor({
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
      onChange?.(editor.getHTML())
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
