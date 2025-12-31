'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [retryAfter, setRetryAfter] = useState(0)  // 限流倒计时

  // 倒计时效果
  useEffect(() => {
    if (retryAfter <= 0) return

    const timer = setInterval(() => {
      setRetryAfter((prev) => {
        if (prev <= 1) {
          setError('')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [retryAfter])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // 如果正在限流中，不允许提交
    if (retryAfter > 0) return

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        // 处理 429 限流错误
        if (response.status === 429 && data.retryAfter) {
          setRetryAfter(data.retryAfter)
          setError(`登录尝试次数过多，请等待 ${data.retryAfter} 秒后重试`)
        } else {
          setError(data.error || '登录失败，请重试')
        }
        setLoading(false)
        return
      }

      // 登录成功，重定向到创建页面
      router.push('/admin/new')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    } catch (err) {
      setError('网络错误，请重试')
      setLoading(false)
    }
  }

  // 格式化剩余时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins} 分 ${secs} 秒`
    }
    return `${secs} 秒`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">
            VovBlog
          </h1>
          <p className="text-center text-slate-600 mb-8">
            管理员登录
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                管理员密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入管理员密码"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <div className={`p-3 border rounded-lg text-sm ${
                retryAfter > 0
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {retryAfter > 0 ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>请等待 {formatTime(retryAfter)} 后重试</span>
                  </div>
                ) : (
                  error
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim() || retryAfter > 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              {loading ? '登录中...' : retryAfter > 0 ? `请等待 ${formatTime(retryAfter)}` : '登 录'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs mt-6">
            仅授权用户可访问
          </p>
        </div>
      </div>
    </div>
  )
}
