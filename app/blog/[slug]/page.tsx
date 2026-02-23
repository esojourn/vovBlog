import { getAllPosts, getPostBySlug } from '@/lib/posts'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeSlug from 'rehype-slug'
import { formatDate, calculateReadingTime } from '@/lib/utils'
import { extractTocFromMarkdown } from '@/lib/toc'
import { Calendar, Clock, Tag, FolderOpen, Share2 } from 'lucide-react'
import Link from 'next/link'
import { EditButton } from '@/components/EditButton'
import TableOfContents from '@/components/TableOfContents'
import ArticleContent from '@/components/ArticleContent'

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (!post) {
    return {
      title: '文章不存在',
    }
  }

  const postUrl = `${baseUrl}/blog/${slug}`
  const description = post.description || post.title

  return {
    title: `${post.title} - VovBlog`,
    description,
    keywords: post.tags?.join(', '),
    authors: post.source ? [{ name: post.source }] : undefined,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      url: postUrl,
      siteName: '瓦器 WaQi.uk',
      locale: 'zh_CN',
      publishedTime: post.date,
      authors: post.source ? [post.source] : undefined,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      creator: post.source,
    },
    canonical: postUrl,
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (!post || !post.published) {
    notFound()
  }

  const readingTime = calculateReadingTime(post.content)
  const tocItems = extractTocFromMarkdown(post.content)

  // JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description || post.title,
    author: post.source ? {
      '@type': 'Organization',
      name: post.source,
    } : undefined,
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${slug}`,
    },
    publisher: {
      '@type': 'Organization',
      name: '瓦器 WaQi.uk',
      url: baseUrl,
    },
    inLanguage: 'zh-CN',
    keywords: post.tags?.join(', '),
  }

  return (
    <article className="max-w-4xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 文章头部 */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <EditButton slug={slug} />

        <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(post.date)}</span>
          </div>
          {post.source && (
            <div className="flex items-center gap-1">
              <Share2 className="w-4 h-4" />
              <span>{post.source}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{readingTime} 分钟阅读</span>
          </div>
          {post.category && (
            <div className="flex items-center gap-1">
              <FolderOpen className="w-4 h-4" />
              <span>{post.category}</span>
            </div>
          )}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {post.description && (
          <p className="text-lg text-muted-foreground border-l-4 border-primary pl-4 italic">
            {post.description}
          </p>
        )}
      </header>

      {/* 文章内容 + 目录导航（共享字号控制） */}
      <ArticleContent>
        <MDXRemote source={post.content} options={{ mdxOptions: { rehypePlugins: [rehypeSlug] } }} />
      </ArticleContent>
      {tocItems.length > 0 && <TableOfContents items={tocItems} />}
      
      {/* 文章来源 */}
      <div className="mt-12 pt-8 border-t text-muted-foreground">
        <p>文章来源：{post.source}</p>
      </div>

      {/* 返回首页 */}
      <div className="mt-8">
        <Link
          href="/"
          className="text-primary hover:underline"
        >
          ← 返回文章列表
        </Link>
      </div>
    </article>
  )
}
