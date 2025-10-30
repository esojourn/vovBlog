import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'

export interface PostMeta {
  title: string
  date: string
  tags?: string[]
  category?: string
  published?: boolean
  description?: string
}

export interface Post extends PostMeta {
  slug: string
  content: string
}

const postsDirectory = path.join(process.cwd(), 'content/posts')

export async function getAllPosts(): Promise<Post[]> {
  try {
    const fileNames = await fs.readdir(postsDirectory)
    const posts = await Promise.all(
      fileNames
        .filter((fileName) => fileName.endsWith('.mdx'))
        .map(async (fileName) => {
          const slug = fileName.replace(/\.mdx$/, '')
          return getPostBySlug(slug)
        })
    )

    return posts
      .filter((post): post is Post => post !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    return []
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const filePath = path.join(postsDirectory, `${slug}.mdx`)
    const fileContents = await fs.readFile(filePath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      slug,
      content,
      title: data.title || '',
      date: data.date || new Date().toISOString(),
      tags: data.tags || [],
      category: data.category || '',
      published: data.published !== false,
      description: data.description || '',
    }
  } catch (error) {
    return null
  }
}

export async function savePost(slug: string, post: Omit<Post, 'slug'>): Promise<void> {
  const { content, ...meta } = post
  const fileContent = matter.stringify(content, meta)
  const filePath = path.join(postsDirectory, `${slug}.mdx`)

  await fs.mkdir(postsDirectory, { recursive: true })
  await fs.writeFile(filePath, fileContent, 'utf8')
}

export async function deletePost(slug: string): Promise<void> {
  const filePath = path.join(postsDirectory, `${slug}.mdx`)
  await fs.unlink(filePath)
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
