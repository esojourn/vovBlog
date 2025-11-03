import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: '请输入密码' },
        { status: 400 }
      )
    }

    // 验证密码
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD 未配置')
      return NextResponse.json(
        { error: '服务器配置错误' },
        { status: 500 }
      )
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      )
    }

    // 创建session token（简单的时间戳+随机字符串）
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // 设置HTTP-only cookie
    const response = NextResponse.json(
      { success: true, message: '登录成功' },
      { status: 200 }
    )

    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24小时
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '登录处理出错' },
      { status: 500 }
    )
  }
}
