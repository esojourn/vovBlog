import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('admin_session')

  if (sessionCookie && sessionCookie.value) {
    return NextResponse.json(
      { authenticated: true },
      { status: 200 }
    )
  }

  return NextResponse.json(
    { authenticated: false },
    { status: 401 }
  )
}
