import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import TurndownService from 'turndown'

export interface PostMeta {
  title: string
  date: string
  tags?: string[]
  category?: string
  published?: boolean
  description?: string
  source?: string
  originalUrl?: string
}

export interface Post extends PostMeta {
  slug: string
  content: string
}

const postsDirectory = path.join(process.cwd(), 'content/posts')

// 🎯 缓存机制
const CACHE_DURATION = 60 * 1000 // 60 秒
let postsCache: { data: Post[], timestamp: number } | null = null

function getCachedPosts(cachedPosts: { data: Post[], timestamp: number } | null): { data: Post[], timestamp: number } | null {
  if (!cachedPosts) return null

  const now = Date.now()
  const age = now - cachedPosts.timestamp

  // 缓存过期（开发环境禁用缓存）
  if (process.env.NODE_ENV === 'development' || age > CACHE_DURATION) {
    return null
  }

  return cachedPosts
}

function setCachePost(posts: Post[]): void {
  postsCache = { data: posts, timestamp: Date.now() }
}

function clearPostsCache(): void {
  postsCache = null
}

// 🔧 HTML 检测和转换函数
function isHtmlContent(content: string): boolean {
  return /<[a-z][^>]*>/i.test(content.trim())
}

// 🔧 修正文本中的多余空格
function fixSpaces(text: string): string {
  return text
    .replace(/属\s+灵/g, '属灵')
    .replace(/恩\s+赐/g, '恩赐')
    .replace(/宣\s+教/g, '宣教')
    .replace(/教\s+会/g, '教会')
}

// 🔧 清洗列表标记重复问题
function cleanListMarkers(text: string): string {
  // 处理有序列表重复：1. 1. 开头 -> 1. 开头
  text = text.replace(/^(\s*)(\d+)\.\s+\d+\.\s+/gm, '$1$2. ')

  // 处理无序列表重复：- • 开头 -> - 开头
  text = text.replace(/^(\s*)-\s+[•◦◾▪▫]/gm, '$1-')

  // 处理无序列表重复：- 1. 开头 -> - 开头（如果数字紧跟在bullet后）
  text = text.replace(/^(\s*)-\s+\d+\.\s+/gm, '$1- ')

  // 移除多余的反斜杠转义（保留在需要的地方）
  // 但不是在代码块中的反斜杠
  text = text.replace(/^(\s*)-\s+\\\\/gm, '$1-')

  // 修复列表项中的多余空格和转义
  // 例如：- • \*\*描述：\*\*\\ 蚂蚁 → - **描述：** 蚂蚁
  text = text.replace(/^(\s*)-\s+[•◦◾▪▫]\s+/gm, '$1- ')

  return text
}

function convertToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    preformattedCode: true,  // 保留预格式化代码
  })

  // 添加自定义规则防止过度转义
  // 防止图片 alt 中的方括号被转义
  turndownService.addRule('image-safe', {
    filter: 'img',
    replacement: (content, node) => {
      const src = node.getAttribute('src') || ''
      const alt = node.getAttribute('alt') || ''
      // 不转义 alt 中的特殊字符
      return `![${alt}](${src})`
    },
  })

  let markdown = turndownService.turndown(html)

  // 修复常见的过度转义
  // 图片链接中的方括号：!\[text\] → ![text]
  markdown = markdown.replace(/!\\\[([^\]]*)\\\]/g, '![$1]')

  // 粗体中的星号：\*\*text\*\* → **text**
  markdown = markdown.replace(/\\\*\\\*([^\*]*)\\\*\\\*/g, '**$1**')

  // 斜体中的星号：\*text\* → *text*（但不影响列表中的星号）
  markdown = markdown.replace(/(?<![-])\s\\\*([^\*]+)\\\*/g, ' *$1*')

  // 应用列表标记清洗规则
  markdown = cleanListMarkers(markdown)
  // 应用空格修正规则
  markdown = fixSpaces(markdown)
  return markdown
}

export async function getAllPosts(includeContent: boolean = true): Promise<Post[]> {
  try {
    // 🎯 检查缓存
    const cached = getCachedPosts(postsCache)
    if (cached) {
      const posts = cached.data
      // 如果缓存的是完整内容，可以直接返回
      // 如果请求的是不完整内容，则从缓存中移除 content
      if (!includeContent) {
        return posts.map(p => ({ ...p, content: '' }))
      }
      return posts
    }

    const fileNames = await fs.readdir(postsDirectory)
    const posts = await Promise.all(
      fileNames
        .filter((fileName) => fileName.endsWith('.mdx'))
        .map(async (fileName) => {
          const slug = fileName.replace(/\.mdx$/, '')
          // 总是读取完整内容用于缓存
          return getPostBySlug(slug, true)
        })
    )

    const sortedPosts = posts
      .filter((post): post is Post => post !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // 🎯 缓存完整内容版本
    setCachePost(sortedPosts)

    // 🎯 如果不需要内容，返回去掉 content 的版本
    if (!includeContent) {
      return sortedPosts.map(p => ({ ...p, content: '' }))
    }

    return sortedPosts
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  } catch (error) {
    return []
  }
}

export async function getPostBySlug(slug: string, includeContent: boolean = true): Promise<Post | null> {
  try {
    const filePath = path.join(postsDirectory, `${slug}.mdx`)
    const fileContents = await fs.readFile(filePath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      slug,
      // 🎯 优化：根据参数决定是否包含完整内容
      content: includeContent ? content : '',
      title: data.title || '',
      date: data.date || new Date().toISOString(),
      tags: data.tags || [],
      category: data.category || '',
      published: data.published !== false,
      description: data.description || '',
      source: data.source || '"瓦器微声"公众号',
      originalUrl: data.originalUrl || '',
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  } catch (error) {
    return null
  }
}

export async function savePost(slug: string, post: Omit<Post, 'slug'>): Promise<void> {
  let { content, ...meta } = post

  // 🔧 新增：格式检测和转换
  if (isHtmlContent(content)) {
    console.warn(`[Posts] 检测到 HTML 格式内容（${slug}），自动转换为 Markdown`)
    try {
      content = convertToMarkdown(content)
      console.log(`[Posts] HTML 转换成功（${slug}）`)
    } catch (err) {
      console.warn(`[Posts] HTML 转换失败（${slug}），使用原始内容:`, err)
    }
  }

  const fileContent = matter.stringify(content, meta)
  const filePath = path.join(postsDirectory, `${slug}.mdx`)

  await fs.mkdir(postsDirectory, { recursive: true })
  await fs.writeFile(filePath, fileContent, 'utf8')

  // 🎯 清空缓存，确保下次读取最新数据
  clearPostsCache()
}

export async function deletePost(slug: string): Promise<void> {
  const filePath = path.join(postsDirectory, `${slug}.mdx`)
  await fs.unlink(filePath)

  // 🎯 清空缓存，确保下次读取最新数据
  clearPostsCache()
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.tags?.includes(tag))
}

export async function getPostsByCategory(category: string): Promise<Post[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.category === category)
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts()
  const tagsSet = new Set<string>()

  posts.forEach((post) => {
    post.tags?.forEach((tag) => tagsSet.add(tag))
  })

  return Array.from(tagsSet).sort()
}

export async function getAllCategories(): Promise<string[]> {
  const posts = await getAllPosts()
  const categoriesSet = new Set<string>()

  posts.forEach((post) => {
    if (post.category) {
      categoriesSet.add(post.category)
    }
  })

  return Array.from(categoriesSet).sort()
}

export async function getAllSources(): Promise<string[]> {
  const posts = await getAllPosts()
  const sourcesSet = new Set<string>()

  posts.forEach((post) => {
    if (post.source) {
      sourcesSet.add(post.source)
    }
  })

  return Array.from(sourcesSet).sort()
}

// 🎯 新增：从已加载的文章列表中提取数据（避免重复读取文件系统）
export function extractTags(posts: Post[]): string[] {
  const tagsSet = new Set<string>()
  posts.forEach((post) => {
    post.tags?.forEach((tag) => tagsSet.add(tag))
  })
  return Array.from(tagsSet).sort()
}

export function extractCategories(posts: Post[]): string[] {
  const categoriesSet = new Set<string>()
  posts.forEach((post) => {
    if (post.category) {
      categoriesSet.add(post.category)
    }
  })
  return Array.from(categoriesSet).sort()
}

export function extractSources(posts: Post[]): string[] {
  const sourcesSet = new Set<string>()
  posts.forEach((post) => {
    if (post.source) {
      sourcesSet.add(post.source)
    }
  })
  return Array.from(sourcesSet).sort()
}
