import { NextResponse } from 'next/server'
import { uploadImage } from '@/lib/cloudinary'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.warn('[Upload API] 没有上传文件')
      return NextResponse.json(
        { error: '没有上传文件' },
        { status: 400 }
      )
    }

    // 服务端文件类型验证
    if (!file.type.startsWith('image/')) {
      console.warn('[Upload API] 非图片文件:', file.type)
      return NextResponse.json(
        { error: '只允许上传图片文件' },
        { status: 400 }
      )
    }

    // 文件大小验证（10MB）
    if (file.size > 10 * 1024 * 1024) {
      console.warn('[Upload API] 文件过大:', file.size)
      return NextResponse.json(
        { error: '图片大小不能超过 10MB' },
        { status: 400 }
      )
    }

    console.log('[Upload API] 开始上传:', {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    const url = await uploadImage(file)

    console.log('[Upload API] 上传成功:', url)
    return NextResponse.json({ url })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Upload API] 上传失败:', errorMessage)

    return NextResponse.json(
      { error: `上传失败: ${errorMessage}` },
      { status: 500 }
    )
  }
}
