import { NextResponse } from 'next/server'
import { uploadImage } from '@/lib/cloudinary'

interface ProxyUploadRequest {
  imageUrls: string[]
}

interface UploadResult {
  url?: string
  error?: string
}

// 下载超时配置（毫秒）
const DOWNLOAD_TIMEOUT = 15000

// 最多同时处理图片数量
const MAX_IMAGES = 5

/**
 * 从 URL 下载图片 blob
 */
async function downloadImage(
  url: string,
  index: number,
  total: number
): Promise<Blob | null> {
  try {
    console.log(`[Proxy Upload] 开始下载图片 (${index + 1}/${total}):`, url)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        // 伪装成浏览器请求，绕过某些反爬虫
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.warn(
        `[Proxy Upload] 下载失败 (${index + 1}/${total}): ${response.status} ${response.statusText}`
      )
      return null
    }

    const blob = await response.blob()
    console.log(
      `[Proxy Upload] 下载成功 (${index + 1}/${total}): ${blob.size} bytes, type: ${blob.type}`
    )

    return blob
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.warn(`[Proxy Upload] 下载图片失败 (${index + 1}/${total}):`, errorMsg)
    return null
  }
}

/**
 * 上传单个图片到 Cloudinary
 */
async function uploadSingleImage(
  blob: Blob,
  index: number,
  total: number
): Promise<string | null> {
  try {
    // 验证文件类型
    if (!blob.type.startsWith('image/')) {
      console.warn(
        `[Proxy Upload] 无效的图片类型 (${index + 1}/${total}): ${blob.type}`
      )
      return null
    }

    // 验证文件大小
    if (blob.size > 10 * 1024 * 1024) {
      console.warn(`[Proxy Upload] 图片过大 (${index + 1}/${total}): ${blob.size} bytes`)
      return null
    }

    // 转换为 File 对象
    const file = new File([blob], `image-${index}.jpg`, { type: blob.type })

    console.log(`[Proxy Upload] 开始上传到 Cloudinary (${index + 1}/${total})`)

    const url = await uploadImage(file)

    console.log(`[Proxy Upload] 上传成功 (${index + 1}/${total}):`, url)
    return url
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[Proxy Upload] 上传失败 (${index + 1}/${total}):`, errorMsg)
    return null
  }
}

/**
 * POST /api/proxy-upload
 * 后端代理上传多张图片到 Cloudinary
 *
 * 请求体:
 * {
 *   imageUrls: string[]  // 最多 5 个 URL
 * }
 *
 * 响应:
 * {
 *   results: Array<{ url?: string, error?: string }>
 * }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProxyUploadRequest

    if (!body.imageUrls || !Array.isArray(body.imageUrls)) {
      console.warn('[Proxy Upload] 无效的请求体')
      return NextResponse.json(
        { error: '请提供 imageUrls 数组' },
        { status: 400 }
      )
    }

    const imageUrls = body.imageUrls.slice(0, MAX_IMAGES)

    if (imageUrls.length === 0) {
      console.warn('[Proxy Upload] 没有提供图片 URL')
      return NextResponse.json(
        { error: '至少需要提供 1 个图片 URL' },
        { status: 400 }
      )
    }

    console.log(
      `[Proxy Upload] 开始处理 ${imageUrls.length} 张图片`,
      imageUrls
    )

    // 并发下载所有图片
    const downloadPromises = imageUrls.map((url, index) =>
      downloadImage(url, index, imageUrls.length)
    )
    const blobs = await Promise.all(downloadPromises)

    // 并发上传所有图片
    const uploadPromises = blobs.map((blob, index) => {
      if (!blob) {
        return Promise.resolve(null)
      }
      return uploadSingleImage(blob, index, imageUrls.length)
    })
    const uploadedUrls = await Promise.all(uploadPromises)

    // 生成结果数组
    const results: UploadResult[] = uploadedUrls.map((url) => {
      if (url) {
        return { url }
      } else {
        return { error: '上传失败' }
      }
    })

    console.log(
      `[Proxy Upload] 处理完成: 成功 ${results.filter((r) => r.url).length}/${imageUrls.length} 张`
    )

    return NextResponse.json({ results })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Proxy Upload] 请求处理失败:', errorMessage)

    return NextResponse.json(
      { error: `处理失败: ${errorMessage}` },
      { status: 500 }
    )
  }
}
