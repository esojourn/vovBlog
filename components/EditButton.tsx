'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Pencil } from 'lucide-react'

interface EditButtonProps {
  slug: string
}

export function EditButton({ slug }: EditButtonProps) {
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
      href={`/admin/edit/${slug}`}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium mt-4 mb-4"
      title="编辑这篇文章"
    >
      <Pencil className="w-4 h-4" />
      <span>编辑</span>
    </Link>
  )
}
