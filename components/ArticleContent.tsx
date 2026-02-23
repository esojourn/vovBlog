'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { AArrowUp, AArrowDown } from 'lucide-react'

const FONT_SIZES = [
  { value: 'prose-base' },
  { value: 'prose-lg' },
  { value: 'prose-xl' },
  { value: 'prose-2xl' },
  { value: 'prose-2xl [&_p]:text-[1.625rem] [&_li]:text-[1.625rem]' },
  { value: 'prose-2xl [&_p]:text-[1.75rem] [&_li]:text-[1.75rem]' },
]

const STORAGE_KEY = 'vovblog-font-size'
const DEFAULT_INDEX = 2

export default function ArticleContent({ children }: { children: ReactNode }) {
  const [sizeIndex, setSizeIndex] = useState(DEFAULT_INDEX)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      const idx = parseInt(saved, 10)
      if (idx >= 0 && idx < FONT_SIZES.length) setSizeIndex(idx)
    }
    setLoaded(true)
  }, [])

  const update = (idx: number) => {
    setSizeIndex(idx)
    localStorage.setItem(STORAGE_KEY, String(idx))
    window.dispatchEvent(new CustomEvent('vovblog-font-size-change', { detail: idx }))
  }

  const sizeClass = loaded ? FONT_SIZES[sizeIndex].value : FONT_SIZES[DEFAULT_INDEX].value

  return (
    <div data-font-size={sizeIndex}>
      <div className="flex items-center gap-2 mb-4 justify-end">
        <span className="text-sm text-muted-foreground">文字大小：</span>
        <button
          onClick={() => update(Math.max(0, sizeIndex - 1))}
          disabled={sizeIndex === 0}
          className="p-3 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="缩小字号"
        >
          <AArrowDown className="w-6 h-6" />
        </button>
        <button
          onClick={() => update(Math.min(FONT_SIZES.length - 1, sizeIndex + 1))}
          disabled={sizeIndex === FONT_SIZES.length - 1}
          className="p-3 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="放大字号"
        >
          <AArrowUp className="w-6 h-6" />
        </button>
      </div>
      <div className={`prose ${sizeClass} max-w-none leading-loose [&_p]:leading-loose [&_li]:leading-loose transition-all`}>
        {children}
      </div>
    </div>
  )
}

export { FONT_SIZES, STORAGE_KEY, DEFAULT_INDEX }
