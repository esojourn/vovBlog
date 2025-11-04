import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 检查是否为需要保护的路由
  const isAdminRoute = pathname.startsWith('/admin')
  const isApiRoute = pathname.startsWith('/api/posts') || pathname.startsWith('/api/upload')
  const isLoginRoute = pathname === '/admin/login'
  const isAuthApiRoute = pathname.startsWith('/api/auth')

  // 检查是否有有效的session
  const sessionCookie = request.cookies.get('admin_session')
  const isAuthenticated = sessionCookie && sessionCookie.value

  // 认证API和登录页面不需要保护
  if (isAuthApiRoute || isLoginRoute) {
    return NextResponse.next()
  }

  // 保护 /admin 路由
  if (isAdminRoute) {
    if (!isAuthenticated) {
      // 重定向到登录页面
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // 保护 API 路由
  if (isApiRoute) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

// 配置middleware应用的路由
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/posts/:path*',
    '/api/upload/:path*',
  ],
}
