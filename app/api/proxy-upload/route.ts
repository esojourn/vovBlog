import { NextResponse } from 'next/server'
import { uploadImage } from '@/lib/cloudinary'
import { createHash } from 'crypto'

interface ProxyUploadRequest {
  imageUrls: string[]
}

interface UploadResult {
  url?: string
  error?: string
  reused?: boolean  // 标记是否为复用的图片
}

// 下载超时配置（毫秒）
const DOWNLOAD_TIMEOUT = 15000

// 最多同时处理图片数量
const MAX_IMAGES = 5

/**
 * 计算 Blob 的 SHA256 哈希值
 */
async function calculateBlobHash(blob: Blob): Promise<string> {
  const buffer = Buffer.from(await blob.arrayBuffer())
  const hash = createHash('sha256')
  hash.update(buffer)
  return hash.digest('hex')
}

/**
 * 从 URL 下载图片 blob 并返回哈希值
 */
async function downloadImage(
  url: string,
  index: number,
  total: number
): Promise<{ blob: Blob; hash: string } | null> {
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

    // 🔧 新增：计算图片哈希值用于去重检测
    const hash = await calculateBlobHash(blob)
    console.log(`[Proxy Upload] 图片哈希值 (${index + 1}/${total}): ${hash}`)

    return { blob, hash }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.warn(`[Proxy Upload] 下载图片失败 (${index + 1}/${total}):`, errorMsg)
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
 *   results: Array<{ url?: string, error?: string, reused?: boolean }>
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

    // 🔧 新增：哈希映射表，用于去重检测
    const hashMap = new Map<string, string>()  // hash -> cloudinaryUrl

    // 并发下载所有图片
    const downloadPromises = imageUrls.map((url, index) =>
      downloadImage(url, index, imageUrls.length)
    )
    const downloadResults = await Promise.all(downloadPromises)

    // 处理上传和去重逻辑
    const uploadPromises = downloadResults.map(async (result, index) => {
      if (!result) {
        return { error: '下载失败' }
      }

      const { blob, hash } = result

      // 🔧 检查哈希是否已存在（重复图片）
      if (hashMap.has(hash)) {
        const existingUrl = hashMap.get(hash)!
        console.log(`[Proxy Upload] 检测到重复图片 (${index + 1}/${imageUrls.length}): ${hash}`)
        console.log(`[Proxy Upload] 复用已上传图片 (${index + 1}/${imageUrls.length}):`, existingUrl)
        return { url: existingUrl, reused: true }
      }

      // 新图片，执行上传
      try {
        console.log(`[Proxy Upload] 开始上传到 Cloudinary (${index + 1}/${imageUrls.length})`)

        // 验证文件类型
        if (!blob.type.startsWith('image/')) {
          console.warn(
            `[Proxy Upload] 无效的图片类型 (${index + 1}/${imageUrls.length}): ${blob.type}`
          )
          return { error: '无效的图片类型' }
        }

        // 验证文件大小
        if (blob.size > 10 * 1024 * 1024) {
          console.warn(`[Proxy Upload] 图片过大 (${index + 1}/${imageUrls.length}): ${blob.size} bytes`)
          return { error: '图片过大' }
        }

        // 转换为 File 对象
        const file = new File([blob], `image-${index}.jpg`, { type: blob.type })

        // 上传到 Cloudinary
        const url = await uploadImage(file)

        // 🔧 记录上传成功的图片哈希
        hashMap.set(hash, url)

        console.log(`[Proxy Upload] 上传成功 (${index + 1}/${imageUrls.length}):`, url)
        return { url }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error(`[Proxy Upload] 上传失败 (${index + 1}/${imageUrls.length}):`, errorMsg)
        return { error: '上传失败' }
      }
    })

    const results = await Promise.all(uploadPromises)

    const successCount = results.filter((r) => r.url).length
    const reuseCount = results.filter((r) => r.reused).length

    console.log(
      `[Proxy Upload] 处理完成: 成功 ${successCount}/${imageUrls.length} 张, 复用 ${reuseCount} 张`
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
