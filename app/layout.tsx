import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { LogoImage } from '@/components/LogoImage'
import { ThemeToggle } from '@/components/ThemeToggle'
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
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen bg-background flex flex-col">
            <header className="border-b">
              <div className="container mx-auto px-4 py-6">
                <nav className="flex items-center justify-center">
                  <LogoImage />
                </nav>
              </div>
            </header>
            <main className="container mx-auto px-4 py-8 flex-1">
              {children}
            </main>
            <footer className="border-t mt-16">
              <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-center sm:text-left text-muted-foreground text-sm">
                    瓦器 WaQi.uk . 本站原创内容采用 CC0 协议，放弃所有版权，可自由使用。
                    转载文章版权归原作者所有。
                  </p>
                  <div className="flex-shrink-0">
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
