'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface ReadingPosition {
  headingId: string
  headingText: string
  scrollRatio: number
  savedAt: number
  contentHash: string
}

const STORAGE_PREFIX = 'vovblog-reading-pos-'
const MAX_ENTRIES = 20
const EXPIRE_DAYS = 30
const DEBOUNCE_MS = 1500
const AUTO_DISMISS_MS = 12000
const APPEAR_DELAY_MS = 300

function getStorageKey(slug: string) {
  return `${STORAGE_PREFIX}${slug}`
}

function cleanupExpired() {
  const now = Date.now()
  const expireMs = EXPIRE_DAYS * 24 * 60 * 60 * 1000
  const entries: { key: string; savedAt: number }[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(STORAGE_PREFIX)) continue
    try {
      const data: ReadingPosition = JSON.parse(localStorage.getItem(key)!)
      if (now - data.savedAt > expireMs) {
        localStorage.removeItem(key)
      } else {
        entries.push({ key, savedAt: data.savedAt })
      }
    } catch {
      localStorage.removeItem(key!)
    }
  }

  // 超出上限，删最旧的
  if (entries.length > MAX_ENTRIES) {
    entries.sort((a, b) => a.savedAt - b.savedAt)
    const toRemove = entries.slice(0, entries.length - MAX_ENTRIES)
    toRemove.forEach((e) => localStorage.removeItem(e.key))
  }
}

function getCurrentHeading(): { id: string; text: string } | null {
  const headings = document.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id]')
  let current: HTMLElement | null = null
  for (const h of headings) {
    if (h.getBoundingClientRect().top <= 100) {
      current = h
    }
  }
  if (current?.id) {
    return { id: current.id, text: current.textContent?.trim() || '' }
  }
  return null
}

function getScrollRatio(): number {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  return docHeight > 0 ? scrollTop / docHeight : 0
}

export default function ReadingPositionManager({
  slug,
  contentHash,
}: {
  slug: string
  contentHash: string
}) {
  const [banner, setBanner] = useState<{ headingId: string; headingText: string; scrollRatio: number } | null>(null)
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  // 初始化：读取 localStorage，校验 contentHash
  useEffect(() => {
    try {
      const raw = localStorage.getItem(getStorageKey(slug))
      if (!raw) return
      const pos: ReadingPosition = JSON.parse(raw)
      if (pos.contentHash !== contentHash) {
        localStorage.removeItem(getStorageKey(slug))
        return
      }
      // 太靠近顶部的不提示
      if (pos.scrollRatio < 0.05) return
      setBanner({ headingId: pos.headingId, headingText: pos.headingText, scrollRatio: pos.scrollRatio })
    } catch {
      localStorage.removeItem(getStorageKey(slug))
    }
  }, [slug, contentHash])

  // 显示提示条 + 自动消失
  useEffect(() => {
    if (!banner) return
    const appearTimer = setTimeout(() => setVisible(true), APPEAR_DELAY_MS)
    return () => clearTimeout(appearTimer)
  }, [banner])

  useEffect(() => {
    if (!visible) return
    timerRef.current = setTimeout(() => {
      setFading(true)
      setTimeout(() => { setVisible(false); setBanner(null) }, 300)
    }, AUTO_DISMISS_MS)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [visible])

  // 滚动监听：debounce 记录位置
  const savePosition = useCallback(() => {
    const ratio = getScrollRatio()
    // 读完了，清除记录
    if (ratio > 0.95) {
      localStorage.removeItem(getStorageKey(slug))
      return
    }
    // 太靠近顶部不记录
    if (ratio < 0.05) return

    const heading = getCurrentHeading()
    const pos: ReadingPosition = {
      headingId: heading?.id || '',
      headingText: heading?.text || '',
      scrollRatio: ratio,
      savedAt: Date.now(),
      contentHash,
    }
    localStorage.setItem(getStorageKey(slug), JSON.stringify(pos))
    cleanupExpired()
  }, [slug, contentHash])

  useEffect(() => {
    const onScroll = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(savePosition, DEBOUNCE_MS)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [savePosition])

  const handleResume = () => {
    if (!banner) return
    if (banner.headingId) {
      const el = document.getElementById(banner.headingId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        dismiss()
        return
      }
    }
    // 降级：用 scrollRatio
    window.scrollTo({ top: banner.scrollRatio * (document.documentElement.scrollHeight - window.innerHeight), behavior: 'smooth' })
    dismiss()
  }

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setFading(true)
    setTimeout(() => { setVisible(false); setBanner(null) }, 300)
  }

  if (!visible || !banner) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 px-4 py-3 bg-background/95 backdrop-blur border-b shadow-sm transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}
    >
      <span className="text-base text-muted-foreground truncate max-w-[60%]">
        上次读到「{banner.headingText || '文章中间'}」
      </span>
      <button
        onClick={handleResume}
        className="text-base px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
      >
        继续阅读
      </button>
      <button
        onClick={dismiss}
        className="text-muted-foreground hover:text-foreground transition-colors p-1"
        aria-label="关闭"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  )
}
