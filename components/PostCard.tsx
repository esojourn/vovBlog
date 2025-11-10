import Link from 'next/link'
import { formatDate, calculateReadingTime } from '@/lib/utils'
import { Post } from '@/lib/posts'
import { Calendar, Clock, Tag, Share2 } from 'lucide-react'

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  const readingTime = calculateReadingTime(post.content)

  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-card">
        <h2 className="text-2xl font-bold mb-2 hover:text-primary transition-colors">
          {post.title}
        </h2>

        {post.description && (
          <p className="text-muted-foreground mb-4 line-clamp-2">
            {post.description}
          </p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
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
              <Tag className="w-4 h-4" />
              <span>{post.category}</span>
            </div>
          )}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </Link>
  )
}
