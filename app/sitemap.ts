import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/posts'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts(false)

  const postUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const homeUrl: MetadataRoute.Sitemap = [
    {
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
  ]

  return [...homeUrl, ...postUrls]
}
