'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export function CreateButton() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // 检查认证状态
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check')
        setIsAuthenticated(response.ok)
      } catch {
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [])

  // 等待认证状态检查完成
  if (isAuthenticated === null) {
    return null
  }

  // 未认证时不显示
  if (!isAuthenticated) {
    return null
  }

  return (
    <Link
      href="/admin/new"
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
      title="创建新文章"
    >
      <Plus className="w-4 h-4" />
      <span className="text-sm font-medium">创建</span>
    </Link>
  )
}
