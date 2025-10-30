import { NextResponse } from 'next/server'
import {
  getAllPosts,
  getPostBySlug,
  savePost,
  deletePost,
} from '@/lib/posts'
import { slugify } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (slug) {
      const post = await getPostBySlug(slug)
      if (!post) {
        return NextResponse.json(
          { error: '文章不存在' },
          { status: 404 }
        )
      }
      return NextResponse.json(post)
    }

    const posts = await getAllPosts()
    return NextResponse.json(posts)
  } catch (error) {
    console.error('获取文章失败:', error)
    return NextResponse.json(
      { error: '获取文章失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const slug = data.slug || slugify(data.title)

    await savePost(slug, {
      title: data.title,
      content: data.content,
      date: data.date || new Date().toISOString(),
      tags: data.tags || [],
      category: data.category || '',
      published: data.published !== false,
      description: data.description || '',
    })

    return NextResponse.json({ slug, success: true })
  } catch (error) {
    console.error('保存文章失败:', error)
    return NextResponse.json(
      { error: '保存文章失败' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { slug } = data

    if (!slug) {
      return NextResponse.json(
        { error: '缺少 slug 参数' },
        { status: 400 }
      )
    }

    await savePost(slug, {
      title: data.title,
      content: data.content,
      date: data.date,
      tags: data.tags || [],
      category: data.category || '',
      published: data.published !== false,
      description: data.description || '',
    })

    return NextResponse.json({ slug, success: true })
  } catch (error) {
    console.error('更新文章失败:', error)
    return NextResponse.json(
      { error: '更新文章失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { error: '缺少 slug 参数' },
        { status: 400 }
      )
    }

    await deletePost(slug)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除文章失败:', error)
    return NextResponse.json(
      { error: '删除文章失败' },
      { status: 500 }
    )
  }
}
