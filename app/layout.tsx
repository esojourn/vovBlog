import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VovBlog - 个人博客',
  description: '一个简洁优雅的个人博客系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold">
                  VovBlog
                </Link>
                <div className="flex gap-6">
                  <Link href="/" className="hover:text-primary transition-colors">
                    首页
                  </Link>
                  <Link href="/admin" className="hover:text-primary transition-colors">
                    管理
                  </Link>
                </div>
              </nav>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t mt-16">
            <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} VovBlog. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
