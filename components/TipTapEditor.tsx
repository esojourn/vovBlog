/* eslint-disable no-unused-vars */
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import { Markdown } from 'tiptap-markdown'
import { useCallback, useState, useEffect } from 'react'
import DOMPurify from 'dompurify'
import { html as beautifyHtml } from 'js-beautify'
import hljs from 'highlight.js/lib/core'
import html from 'highlight.js/lib/languages/xml'
import 'highlight.js/styles/atom-one-light.css'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  FileCode,
  Loader2,
  Highlighter,
} from 'lucide-react'

hljs.registerLanguage('html', html)

interface TipTapEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
}

interface UploadProgress {
  current: number
  total: number
}

export default function TipTapEditor({
  content: initialContent = '',
  onChange,
  placeholder = '开始写作...',
}: TipTapEditorProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [isSourceMode, setIsSourceMode] = useState(false)
  const [sourceCode, setSourceCode] = useState('')

  const sanitizeHtml = (html: string) => {
    // 第一步：识别和转换高亮文本（在 DOMPurify 之前处理，因为 style 会被移除）
    let htmlWithHighlights = html

    // 转换具有背景色或文字颜色的 span 为 mark 标签
    htmlWithHighlights = htmlWithHighlights.replace(
      /<span\s+(?:[^>]*?\s)?style=["'](?:[^"']*?(?:background-color|color)[^"']*?)["'][^>]*>([^<]*)<\/span>/gi,
      '<mark>$1</mark>'
    )

    // 转换仅有 style 属性的 span
    htmlWithHighlights = htmlWithHighlights.replace(
      /<span\s+style=["'](?:[^"']*?(?:background-color|color)[^"']*?)["'][^>]*>([^<]*)<\/span>/gi,
      '<mark>$1</mark>'
    )

    // 第二步：DOMPurify清理危险标签和属性，保留 mark 标签
    const cleanHtml = DOMPurify.sanitize(htmlWithHighlights, {
      ALLOWED_TAGS: [
        'p', 'br', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote',
        'code', 'pre', 'span', 'div', 'mark'  // 添加 mark 标签
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'section'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'style', 'class', 'id', 'data-src'],
      KEEP_CONTENT: true,
    })

    // 第三步：智能标题识别 - 识别应转为标题的加粗段落
    let processedHtml = cleanHtml

    // 匹配 <p><strong>文本</strong></p> 的模式
    processedHtml = processedHtml.replace(
      /<p><strong>([^<]*?)<\/strong><\/p>/gi,
      (match, text) => {
        // 条件：文本长度 < 50 且包含序号（中文序号或数字）
        const trimmedText = text.trim()
        const hasNumberPrefix = /^[（(]?[一二三四五六七八九0-9０-９]+[、。.)）]/.test(trimmedText)

        if (trimmedText.length < 50 && hasNumberPrefix) {
          // 转换为 h2 标题
          return `<h2>${trimmedText}</h2>`
        }
        // 不符合条件，保持原样（但格式化）
        return `<p><strong>${trimmedText}</strong></p>`
      }
    )

    // 第四步：HTML结构修复（处理复杂的嵌套错误）
    let fixedHtml = processedHtml

    // 修复自闭合标签后的错误结束标签（如<img></p>）
    // 注意：保留属性，防止图片 src 丢失
    // 修复 img 标签（保留所有属性）
    fixedHtml = fixedHtml.replace(/<img\s+([^>]*?)\s*\/?>/gi, '<img $1 />')
    // 修复 br 和 hr 标签
    fixedHtml = fixedHtml.replace(/<(br|hr)\s*\/?>/gi, '<$1 />')

    // 修复孤立的结束标签
    fixedHtml = fixedHtml.replace(/<\/p>\s*<\/p>/g, '</p>') // 连续结束标签
    fixedHtml = fixedHtml.replace(/<p>\s*<\/p>/g, '') // 空段落

    // 修复段落结构
    fixedHtml = fixedHtml
      .replace(/<p><br\s*\/?><\/p>/gi, '')
      .replace(/<p><br\s*\/?>/gi, '<p>')
      .replace(/<br\s*\/?><\/p>/gi, '</p>')
      .replace(/\s+<\/p>/gi, '</p>')
      .replace(/<p>\s+/gi, '<p>')

    // 第五步：过滤多余空行 - 使用更激进的方式
    // 将连续的 <br /> 和 <p></p> 合并为单个分隔符
    fixedHtml = fixedHtml
      .replace(/(<br\s*\/?>\s*){2,}/gi, '<br />') // 连续 br 合并为一个
      .replace(/(<\/p>\s*<p>)+/gi, '</p><p>') // 多个 p 换行合并

    // 移除开头和结尾的空白行
    fixedHtml = fixedHtml
      .replace(/^(<br\s*\/?>\s*)+/i, '')
      .replace(/(<br\s*\/?>)+$/i, '')

    return fixedHtml
  }

  // HTML 格式化（美化）- 进入源代码模式时使用
  const formatHtml = (html: string): string => {
    try {
      return beautifyHtml(html, {
        indent_size: 2,              // 2空格缩进
        wrap_line_length: 100,       // 每行最多100字符
        preserve_newlines: true,     // 保留原有换行
        max_preserve_newlines: 1,    // 最多保留1个空行
        end_with_newline: false,     // 结尾不添加换行
      })
    } catch (err) {
      console.warn('[Editor] HTML 格式化失败，返回原始 HTML:', err)
      return html
    }
  }

  // HTML 压缩（单行）- 保存时使用
  const compressHtml = (html: string): string => {
    return html
      .replace(/\n\s*/g, ' ')      // 换行+缩进 → 空格（保留标签属性间的分隔）
      .replace(/\s+/g, ' ')        // 压缩连续空格为单个空格
      .replace(/>\s+</g, '><')     // 移除标签间空格
      .trim()
  }

  // 从 Base64 数据 URL 创建 Blob
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',')
    const mimeMatch = arr[0].match(/:(.*?);/)
    const mime = mimeMatch ? mimeMatch[1] : 'image/png'
    const bstr = atob(arr[1])
    const n = bstr.length
    const u8arr = new Uint8Array(n)
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i)
    }
    return new Blob([u8arr], { type: mime })
  }

  // 推断图片 MIME 类型（通过 URL 扩展名或 Content-Type 头）
  const inferImageType = (url: string, contentType?: string): string => {
    // 优先使用 Content-Type 头
    if (contentType && contentType.startsWith('image/')) {
      return contentType
    }

    // 从 URL 推断类型
    const urlPath = url.split('?')[0].split('#')[0].toLowerCase()
    if (urlPath.endsWith('.png')) return 'image/png'
    if (urlPath.endsWith('.jpg') || urlPath.endsWith('.jpeg')) return 'image/jpeg'
    if (urlPath.endsWith('.gif')) return 'image/gif'
    if (urlPath.endsWith('.webp')) return 'image/webp'
    if (urlPath.endsWith('.svg')) return 'image/svg+xml'

    // 默认当作 JPEG（微信图片通常是 JPEG）
    return 'image/jpeg'
  }

  // 判断是否需要使用后端代理上传
  const shouldUseProxy = (src: string): boolean => {
    // Base64 图片使用客户端上传
    if (src.startsWith('data:image/')) return false

    // 微信公众号图片强制使用后端代理（防止 CORS 问题）
    if (src.includes('mmbiz.qpic.cn')) return true

    // 其他远程 URL 先尝试客户端，失败则在异常处理中降级
    return false
  }

  // 通过后端代理上传图片
  const uploadImageViaProxy = useCallback(
    async (src: string, index: number, total: number): Promise<string | null> => {
      try {
        console.log(`[Editor] 使用后端代理上传 (${index + 1}/${total}):`, src)

        const response = await fetch('/api/proxy-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrls: [src] }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: '未知错误' }))
          console.warn(`[Editor] 代理上传失败 (${index + 1}/${total}):`, errorData)
          return null
        }

        const { results } = await response.json()
        const result = results?.[0]

        if (result?.url) {
          console.log(`[Editor] 代理上传成功 (${index + 1}/${total}):`, result.url)
          return result.url
        } else {
          console.warn(`[Editor] 代理上传无返回 URL (${index + 1}/${total}):`, result?.error)
          return null
        }
      } catch (err) {
        console.error(`[Editor] 代理上传异常 (${index + 1}/${total}):`, err)
        return null
      }
    },
    []
  )

  // 从各种来源上传单张图片
  const uploadImageFromSource = useCallback(
    async (src: string, index: number, total: number): Promise<string | null> => {
      try {
        setUploadProgress({ current: index, total })

        // 判断是否需要使用后端代理
        if (shouldUseProxy(src)) {
          console.log(`[Editor] URL 需要后端代理 (${index + 1}/${total}):`, src)
          return await uploadImageViaProxy(src, index, total)
        }

        let blob: Blob | null = null

        if (src.startsWith('data:image/')) {
          // 处理 Base64 图片
          blob = dataUrlToBlob(src)
        } else if (src.startsWith('http://') || src.startsWith('https://')) {
          // 处理远程 URL 图片 - 先尝试客户端
          try {
            console.log(`[Editor] 尝试客户端下载 (${index + 1}/${total}):`, src)

            // 设置超时 15 秒
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000)

            const response = await fetch(src, {
              signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
              console.warn(
                `[Editor] 客户端下载失败 (${index + 1}/${total}): ${response.status} ${response.statusText}`
              )
              // 降级到后端代理
              return await uploadImageViaProxy(src, index, total)
            }

            blob = await response.blob()
            const contentType = response.headers.get('content-type')
            const inferredType = inferImageType(src, contentType || undefined)

            console.log(
              `[Editor] 客户端下载成功 (${index + 1}/${total}): ${blob.size} bytes, type: ${blob.type || contentType || inferredType}`
            )

            // 如果 blob.type 为空，使用推断的类型重新创建 blob
            if (!blob.type || !blob.type.startsWith('image/')) {
              blob = new Blob([blob], { type: inferredType })
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err)
            console.warn(
              `[Editor] 客户端下载异常 (${index + 1}/${total}): ${errorMsg}，降级到后端代理`
            )
            // CORS 或网络错误时，降级到后端代理
            return await uploadImageViaProxy(src, index, total)
          }
        } else {
          console.warn(`[Editor] 不支持的图片源 (${index + 1}/${total}):`, src)
          return null
        }

        if (!blob || !blob.type.startsWith('image/')) {
          console.warn(
            `[Editor] 无效的图片 blob (${index + 1}/${total}): type=${blob?.type}, size=${blob?.size}`
          )
          return null
        }

        // 验证文件大小
        if (blob.size > 10 * 1024 * 1024) {
          console.warn(`[Editor] 图片过大 (${index + 1}/${total}): ${blob.size} bytes`)
          return null
        }

        // 上传到 Cloudinary
        const formData = new FormData()
        formData.append('file', blob)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: '未知错误' }))
          console.warn(`[Editor] 上传图片失败 (${index + 1}/${total}):`, errorData)
          return null
        }

        const { url } = await response.json()
        console.log(`[Editor] 上传成功 (${index + 1}/${total}):`, url)
        return url || null
      } catch (err) {
        console.error(`[Editor] 处理图片出错 (${index + 1}/${total}):`, err)
        return null
      }
    },
    [inferImageType, uploadImageViaProxy, shouldUseProxy]
  )

  // 处理包含图片的 HTML 内容
  const processHtmlWithImages = useCallback(
    async (html: string, editorInstance: any) => {
      if (!editorInstance) return

      const MAX_BATCH_SIZE = 10

      try {
        // 解析 HTML
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const images = Array.from(doc.querySelectorAll('img'))

        if (images.length === 0) {
          // 没有图片，直接插入清洗后的 HTML
          const cleanHtml = sanitizeHtml(html)
          editorInstance.chain().focus().insertContent(cleanHtml).run()
          return
        }

        // 有图片，需要逐个上传
        setUploading(true)

        // 收集所有图片源
        const imageSources: Array<{ element: Element; src: string }> = []
        images.forEach((img) => {
          const src = img.getAttribute('src') || img.getAttribute('data-src') || ''
          if (src) {
            imageSources.push({ element: img, src })
          }
        })

        console.log(`[Editor] 检测到 ${imageSources.length} 张图片`)

        // 如果超过 5 张，限制为 5 张并提示用户
        if (imageSources.length > MAX_BATCH_SIZE) {
          console.warn(
            `[Editor] 图片数量 ${imageSources.length} 超过限制 ${MAX_BATCH_SIZE}，仅处理前 ${MAX_BATCH_SIZE} 张`
          )
          alert(
            `检测到 ${imageSources.length} 张图片，为避免超时，仅处理前 ${MAX_BATCH_SIZE} 张。请分批粘贴。`
          )
        }

        // 截取前 5 张
        const batchImageSources = imageSources.slice(0, MAX_BATCH_SIZE)

        // 逐个上传图片
        const uploadPromises = batchImageSources.map(({ src }, index) =>
          uploadImageFromSource(src, index, batchImageSources.length)
        )
        const uploadedUrls = await Promise.all(uploadPromises)

        // 替换 HTML 中的图片 URL
        batchImageSources.forEach(({ element }, index) => {
          const newUrl = uploadedUrls[index]
          if (newUrl) {
            element.setAttribute('src', newUrl)
            element.removeAttribute('data-src')
          } else {
            // 上传失败时尝试保留原 URL，如果是 Base64 则删除（因为太大）
            const src = element.getAttribute('src') || ''
            if (src.startsWith('data:image/')) {
              element.remove()
            }
          }
        })

        // 移除超过限制的图片
        imageSources.slice(MAX_BATCH_SIZE).forEach(({ element }) => {
          element.remove()
        })

        // 清洗 HTML 并插入编辑器
        const cleanHtml = sanitizeHtml(doc.body.innerHTML)
        editorInstance.chain().focus().insertContent(cleanHtml).run()

        const successCount = uploadedUrls.filter((url) => url).length
        console.log(`[Editor] 成功处理 ${successCount}/${batchImageSources.length} 张图片`)
      } catch (err) {
        console.error('[Editor] 处理 HTML 内容失败:', err)
        alert(`处理内容失败: ${err instanceof Error ? err.message : '未知错误'}`)
      } finally {
        setUploading(false)
        setUploadProgress(null)
      }
    },
    [uploadImageFromSource, sanitizeHtml]
  )

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: false,  // 禁用 Base64，强制上传到 Cloudinary
      }),
      Placeholder.configure({
        placeholder,
      }),
      Highlight.configure({
        multicolor: false,  // 统一样式，不保留原颜色
      }),
      Markdown.configure({
        html: true,                  // 允许 HTML（保留图片上传功能）
        tightLists: true,            // 紧凑列表
        bulletListMarker: '-',       // 无序列表标记
        linkify: false,              // 不自动转换 URL
        breaks: false,               // 换行不转为 <br>
        transformPastedText: true,   // ✨ 粘贴 Markdown 文本时自动转换
        transformCopiedText: true,   // ✨ 改为 true：输出 Markdown 格式（便于存储和版本控制）
      }),
    ],
    content: initialContent,
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

        // 优先处理图片文件
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

        // 处理 HTML 内容中的图片
        const html = event.clipboardData?.getData('text/html')
        if (html && html.includes('<img')) {
          event.preventDefault()
          processHtmlWithImages(html, editor)
          return true
        }

        return false
      },
    },
    onUpdate: ({ editor }) => {
      // ✨ 获取 Markdown 格式内容而非 HTML
      const markdown = editor.storage.markdown.getMarkdown()
      onChange?.(markdown)
    },
  })

  // 🔧 当 content prop 变化时，更新编辑器内容
  useEffect(() => {
    if (editor && initialContent && initialContent.length > 0) {
      // 检查编辑器当前内容是否为空或与新内容不同
      const currentContent = editor.getHTML()
      if (currentContent !== initialContent) {
        console.log('[Editor] 检测到内容更新，使用 setContent 更新编辑器')
        editor.commands.setContent(initialContent, false)
      }
    }
  }, [editor, initialContent])

  // 进入源代码模式
  const enterSourceMode = useCallback(() => {
    if (!editor) return
    // ✨ 改为获取 Markdown 而非 HTML
    const markdown = editor.storage.markdown.getMarkdown()
    setSourceCode(markdown)
    setIsSourceMode(true)
  }, [editor])

  // 退出源代码模式
  const exitSourceMode = useCallback(() => {
    if (!editor) return
    // ✨ 直接设置 Markdown 内容，TipTap 会自动处理
    editor.commands.setContent(sourceCode)
    setIsSourceMode(false)
  }, [editor, sourceCode])

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请上传图片文件')
        return
      }

      // 验证文件大小（限制为 10MB）
      if (file.size > 10 * 1024 * 1024) {
        alert('图片大小不能超过 10MB')
        return
      }

      setUploading(true)
      console.log('[Editor] 开始上传图片:', file.name)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        console.log('[Editor] 上传响应:', response.status)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: '未知错误' }))
          console.error('[Editor] 上传错误:', errorData)
          throw new Error(errorData.error || '上传失败')
        }

        const { url } = await response.json()

        if (!url) {
          throw new Error('服务器未返回图片 URL')
        }

        console.log('[Editor] 上传成功，URL:', url)

        // 插入图片到编辑器
        editor.chain().focus().setImage({ src: url }).run()
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '上传失败，请重试'
        console.error('[Editor] 图片上传失败:', errorMsg)
        alert(`图片上传失败: ${errorMsg}`)
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
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-2 rounded hover:bg-background ${
            editor.isActive('highlight') ? 'bg-background' : ''
          }`}
          title="高亮"
        >
          <Highlighter className="w-4 h-4" />
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

        <div className="w-px bg-border mx-1" />

        <button
          type="button"
          onClick={() => {
            if (isSourceMode) {
              exitSourceMode()
            } else {
              enterSourceMode()
            }
          }}
          className={`p-2 rounded hover:bg-background ${
            isSourceMode ? 'bg-background' : ''
          }`}
          title={isSourceMode ? '所见即所得模式' : '源代码模式'}
        >
          <FileCode className="w-4 h-4" />
        </button>
      </div>

      {/* 编辑器内容 */}
      {isSourceMode ? (
        <div className="bg-white min-h-[400px] p-4 font-mono text-sm overflow-hidden flex flex-col">
          <textarea
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            className="flex-1 w-full border border-border rounded p-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            spellCheck="false"
            style={{
              whiteSpace: 'pre',
              overflowWrap: 'normal',
            }}
          />
          <div className="mt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={exitSourceMode}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              应用更改
            </button>
          </div>
        </div>
      ) : (
        <EditorContent editor={editor} className="min-h-[400px]" />
      )}

      {uploading && (
        <div className="p-2 text-sm text-muted-foreground bg-muted border-t">
          {uploadProgress ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                正在上传图片... {uploadProgress.current + 1}/{uploadProgress.total}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>正在处理内容...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
