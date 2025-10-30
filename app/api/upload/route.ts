import { NextResponse } from 'next/server'
import { uploadImage } from '@/lib/cloudinary'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: '没有上传文件' },
        { status: 400 }
      )
    }

    const url = await uploadImage(file)

    return NextResponse.json({ url })
  } catch (error) {
    console.error('图片上传失败:', error)
    return NextResponse.json(
      { error: '图片上传失败' },
      { status: 500 }
    )
  }
}
