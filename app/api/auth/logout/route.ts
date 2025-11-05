import { NextRequest, NextResponse } from 'next/server'

export async function POST(_request: NextRequest) {
  const response = NextResponse.json(
    { success: true, message: '已登出' },
    { status: 200 }
  )

  // 清除session cookie
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // 立即过期
    path: '/',
  })

  return response
}
