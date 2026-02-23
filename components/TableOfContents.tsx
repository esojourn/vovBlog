'use client'

import { useState, useEffect, useCallback } from 'react'
import { List, X } from 'lucide-react'
import type { TocItem } from '@/lib/toc'

import { FONT_SIZES, STORAGE_KEY, DEFAULT_INDEX } from '@/components/ArticleContent'

const levelIndent: Record<number, string> = {
  1: 'pl-0',
  2: 'pl-4',
  3: 'pl-8',
}

// 目录字号映射，与正文档位对应
const TOC_TEXT_SIZES = [
  'text-sm',    // prose-base
  'text-base',  // prose-lg
  'text-base',  // prose-xl
  'text-lg',    // prose-2xl
  'text-lg',    // 超大1
  'text-xl',    // 超大2
]

export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [fontIndex, setFontIndex] = useState(DEFAULT_INDEX)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      const idx = parseInt(saved, 10)
      if (idx >= 0 && idx < FONT_SIZES.length) setFontIndex(idx)
    }

    const handleChange = (e: Event) => {
      const idx = (e as CustomEvent).detail
      if (idx >= 0 && idx < FONT_SIZES.length) setFontIndex(idx)
    }
    window.addEventListener('vovblog-font-size-change', handleChange)
    return () => window.removeEventListener('vovblog-font-size-change', handleChange)
  }, [])

  // IntersectionObserver 追踪当前可见标题
  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[]

    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // 找到第一个进入视口的标题
        const visible = entries.find((e) => e.isIntersecting)
        if (visible) {
          setActiveId(visible.target.id)
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [items])

  const handleClick = useCallback(
    (id: string) => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        setActiveId(id)
      }
      setDrawerOpen(false)
    },
    []
  )

  const tocSize = TOC_TEXT_SIZES[fontIndex]

  const navList = (
    <nav className={tocSize}>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className={levelIndent[item.level] ?? 'pl-0'}>
            <button
              onClick={() => handleClick(item.id)}
              className={`block w-full text-left py-1 px-2 rounded transition-colors truncate ${
                activeId === item.id
                  ? 'text-primary font-medium border-l-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )

  return (
    <>
      {/* 桌面端：固定在右侧 */}
      <aside className="hidden xl:block fixed top-24 right-[max(1rem,calc((100vw-56rem)/2-16rem))] w-56 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          目录
        </p>
        {navList}
      </aside>

      {/* 移动端：浮动按钮 + 底部抽屉 */}
      <div className="xl:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
          aria-label="打开目录"
        >
          <List className="w-5 h-5" />
        </button>

        {drawerOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-xl max-h-[60vh] overflow-y-auto p-4 pb-8 animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-muted-foreground">目录</p>
                <button onClick={() => setDrawerOpen(false)} aria-label="关闭目录">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              {navList}
            </div>
          </>
        )}
      </div>
    </>
  )
}
