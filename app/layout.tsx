import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import { Github } from 'lucide-react'
import { ThemeProvider } from '@/components/ThemeProvider'
import { LogoImage } from '@/components/LogoImage'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { RouteChangeListener } from '@/components/RouteChangeListener'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '瓦器 WaQi.uk - 充满瑕疵的脆弱器皿',
  description: '瓦器博客：分享信仰、思想和生活思考。包含来自瓦器微声、盐读书、五饼二鱼能量站等公众号的精选文章。',
  keywords: ['博客', '信仰', '思想', '生活', '公众号文章', '精选'],
  authors: [{ name: '瓦器' }],
  creator: '瓦器',
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
    googleBot: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.waqi.uk',
    siteName: '瓦器 WaQi.uk',
    title: '瓦器 WaQi.uk',
    description: '瓦器博客：分享信仰、思想和生活思考。包含来自瓦器微声、盐读书、五饼二鱼能量站等公众号的精选文章。',
  },
  twitter: {
    card: 'summary_large_image',
    title: '瓦器 WaQi.uk',
    description: '瓦器博客：分享信仰、思想和生活思考',
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.waqi.uk',
  },
  icons: {
    icon: [
      {
        url: '/images/favicon.ico',
      },
      {
        url: '/images/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/images/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
    apple: '/images/apple-touch-icon.png',
    other: [
      {
        rel: 'manifest',
        url: '/images/site.webmanifest',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.waqi.uk'

  // Organization JSON-LD Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '瓦器 WaQi.uk',
    description: '充满瑕疵的脆弱器皿',
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,
    sameAs: [
      'https://github.com/esojourn/vovBlog',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      url: baseUrl,
      contactType: 'Customer Service',
    },
  }

  // WebSite JSON-LD Schema with SearchAction
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '瓦器 WaQi.uk',
    url: baseUrl,
    description: '瓦器博客：分享信仰、思想和生活思考。',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {/* RSS Feed Discovery */}
        <link rel="alternate" type="application/rss+xml" title="瓦器博客 RSS Feed" href={`${baseUrl}/feed.xml`} />
        {/* Sitemap */}
        <link rel="sitemap" type="application/xml" href={`${baseUrl}/sitemap.xml`} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <RouteChangeListener />
          <div className="min-h-screen bg-background flex flex-col">
            <header className="border-b relative">
              <div className="container mx-auto px-4 py-6">
                <nav className="flex items-center justify-center">
                  <LogoImage />
                </nav>
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <main className="container mx-auto px-4 py-8 flex-1">
              {children}
            </main>
            <footer className="border-t mt-16">
              <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <a
                      href="https://github.com/esojourn/vovBlog"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="GitHub Repository"
                    >
                      <Github size={20} />
                    </a>
                    <div className="text-center sm:text-left text-muted-foreground text-sm">
                      <p>
                        <Link
                          href="https://www.waqi.uk/"
                          className="hover:text-foreground transition-colors underline"
                        >瓦器 WaQi.uk</Link> . 本站程序代码及原创内容采用 CC0 协议，放弃所有版权，可自由使用。
                        转载文章版权归原作者所有。
                        <span className="mx-2">·</span>
                        <Link
                          href="/blog/guan-yu-wo-men"
                          className="hover:text-foreground transition-colors underline"
                        >
                          关于我们
                        </Link>
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-4">
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
        <GoogleAnalytics />
        <Analytics />
      </body>
    </html>
  )
}
