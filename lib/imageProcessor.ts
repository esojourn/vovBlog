/**
 * 图片处理工具库
 * 用于处理从HTML粘贴内容中的图片上传
 */

const IMAGE_MAX_SIZE = 5 * 1024 * 1024 // 5MB
const DOWNLOAD_TIMEOUT = 5000 // 5秒超时
const MAX_CONCURRENT_UPLOADS = 3 // 最多并发3个上传
const MAX_IMAGES_PER_PASTE = 20 // 单次粘贴最多处理20张图片

interface ImageInfo {
  src: string
  element: HTMLImageElement
  type: 'base64' | 'url' | 'relative'
}

/**
 * 从HTML字符串中提取所有图片信息
 * 支持标准 src 和微信公众号等特殊属性 (data-src, data-original-src 等)
 */
export function extractImagesFromHtml(htmlString: string): ImageInfo[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, 'text/html')
  const images = doc.querySelectorAll('img')
  const imageInfos: ImageInfo[] = []

  images.forEach((element) => {
    // 按优先级查找图片URL
    // 微信公众号和其他平台使用不同的属性存储图片链接
    const src =
      element.getAttribute('src') ||
      element.getAttribute('data-src') ||
      element.getAttribute('data-original-src') ||
      element.getAttribute('data-lazysrc') ||
      element.getAttribute('data-image-src') ||
      element.getAttribute('data-fail-src')

    if (!src) {
      // 如果没有找到图片URL，记录警告信息
      const alt = element.getAttribute('alt')
      if (alt) {
        console.warn(`⚠️ 未找到图片URL: <img alt="${alt}" /> (可能的属性: src, data-src, data-original-src 等)`)
      }
      return
    }

    // 过滤掉无效的URL（如 http://, //  等）
    if (!src || src.length === 0 || src === 'http://' || src === '//') {
      return
    }

    let type: 'base64' | 'url' | 'relative'

    if (src.startsWith('data:image')) {
      type = 'base64'
    } else if (src.startsWith('http://') || src.startsWith('https://')) {
      type = 'url'
    } else if (src.startsWith('//')) {
      // 处理 //cdn.example.com/image.jpg 格式（协议相对URL）
      type = 'url'
    } else {
      type = 'relative'
    }

    imageInfos.push({
      src,
      element,
      type,
    })
  })

  if (imageInfos.length > 0) {
    console.log(`✓ 从HTML中检测到 ${imageInfos.length} 张图片`)
  }

  return imageInfos
}

/**
 * Base64字符串转换为File对象
 */
export function base64ToFile(base64String: string, filename: string = 'image.png'): File {
  // 处理base64格式：data:image/png;base64,xxxxx
  const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/)

  if (!matches) {
    throw new Error('无效的Base64图片格式')
  }

  const mimeType = matches[1]
  const base64Data = matches[2]

  // 转换为二进制数组
  const binary = atob(base64Data)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return new File([bytes], filename, { type: mimeType })
}

/**
 * 下载远程图片为File对象
 */
export async function downloadImage(url: string): Promise<File> {
  // URL验证
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('不支持的URL协议')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const contentType = response.headers.get('content-type')

    if (!contentType?.startsWith('image/')) {
      throw new Error('URL不是有效的图片')
    }

    const blob = await response.blob()

    if (blob.size > IMAGE_MAX_SIZE) {
      throw new Error('图片文件过大（超过5MB）')
    }

    // 从URL获取文件名
    const pathname = new URL(url).pathname
    const filename = pathname.split('/').pop() || 'image.jpg'

    return new File([blob], filename, { type: contentType })
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * 尝试解析相对URL为绝对URL
 * 基于HTML来源（如微信公众号）进行转换
 */
export function resolveRelativeUrl(
  url: string,
  baseUrl: string = 'https://mp.weixin.qq.com'
): string {
  if (url.startsWith('/')) {
    const base = new URL(baseUrl)
    return `${base.protocol}//${base.host}${url}`
  }

  if (!url.startsWith('http')) {
    return `${baseUrl}/${url}`
  }

  return url
}

/**
 * 上传单个图片到服务器
 */
export async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`上传失败: ${response.statusText}`)
  }

  const { url } = await response.json()

  if (!url) {
    throw new Error('上传响应中缺少URL')
  }

  return url
}

/**
 * 处理HTML中的图片：下载并上传到Cloudinary
 * @param htmlString - 原始HTML字符串
 * @param onProgress - 进度回调函数
 * @returns 处理后的HTML字符串
 */
export async function processHtmlWithImages(
  htmlString: string,
  onProgress?: (_current: number, _total: number) => void
): Promise<string> {
  // 验证HTML字符串
  if (!htmlString || typeof htmlString !== 'string') {
    console.warn('无效的HTML字符串')
    return htmlString
  }

  // 诊断日志：显示粘贴内容的前500字符
  console.log('📋 粘贴的HTML内容（前500字符）:', htmlString.substring(0, 500))

  // 提取图片信息
  let imageInfos = extractImagesFromHtml(htmlString)

  if (imageInfos.length === 0) {
    console.warn('⚠️ 未检测到任何图片URL')
    console.warn('可能的原因：')
    console.warn('  1. 复制的内容中没有<img>标签')
    console.warn('  2. 图片标签没有以下属性：src, data-src, data-original-src, data-lazysrc')
    console.warn('  3. 请尝试以下替代方案：')
    console.warn('    - 右键点击图片 → "复制图片" 后粘贴')
    console.warn('    - 使用截图工具（Ctrl+Shift+S）截取图片后粘贴')
    return htmlString
  }

  console.log('🖼️ 检测到的图片信息:')
  imageInfos.forEach((img, index) => {
    console.log(`  ${index + 1}. [${img.type}] ${img.src.substring(0, 60)}...`)
  })

  // 检查图片数量限制
  if (imageInfos.length > MAX_IMAGES_PER_PASTE) {
    console.warn(`粘贴内容包含 ${imageInfos.length} 张图片，限制为 ${MAX_IMAGES_PER_PASTE} 张。超出部分将被移除。`)
    imageInfos = imageInfos.slice(0, MAX_IMAGES_PER_PASTE)
  }

  // 处理每个图片
  const uploadedUrls = new Map<string, string>()
  const failedUrls = new Set<string>()
  const excessImageUrls = new Set<string>()

  // 标记超出限制的图片
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, 'text/html')
  const allImages = doc.querySelectorAll('img')

  if (allImages.length > MAX_IMAGES_PER_PASTE) {
    Array.from(allImages).slice(MAX_IMAGES_PER_PASTE).forEach((img) => {
      const src = img.getAttribute('src')
      if (src) {
        excessImageUrls.add(src)
      }
    })
  }

  // 使用并发控制来上传图片
  let uploadedCount = 0

  for (let i = 0; i < imageInfos.length; i += MAX_CONCURRENT_UPLOADS) {
    const batch = imageInfos.slice(i, i + MAX_CONCURRENT_UPLOADS)

    const promises = batch.map(async (imageInfo) => {
      try {
        let file: File

        if (imageInfo.type === 'base64') {
          file = base64ToFile(imageInfo.src)
        } else if (imageInfo.type === 'url') {
          file = await downloadImage(imageInfo.src)
        } else {
          // 相对路径：尝试转换为绝对路径
          try {
            const absoluteUrl = resolveRelativeUrl(imageInfo.src)
            file = await downloadImage(absoluteUrl)
          } catch (error) {
            console.warn(`无法处理相对路径图片: ${imageInfo.src}`, error)
            throw error
          }
        }

        // 上传到Cloudinary
        const cloudinaryUrl = await uploadImageFile(file)
        uploadedUrls.set(imageInfo.src, cloudinaryUrl)

        uploadedCount++
        onProgress?.(uploadedCount, imageInfos.length)
      } catch (error) {
        console.error(`图片上传失败 (${imageInfo.src}):`, error instanceof Error ? error.message : error)
        failedUrls.add(imageInfo.src)

        uploadedCount++
        onProgress?.(uploadedCount, imageInfos.length)
      }
    })

    await Promise.all(promises)
  }

  // 构建结果HTML：替换URL和移除失败的图片
  const resultDoc = parser.parseFromString(htmlString, 'text/html')
  const images = resultDoc.querySelectorAll('img')

  const removedCount = {
    failed: 0,
    excess: 0,
  }

  images.forEach((img) => {
    const src = img.getAttribute('src')
    if (!src) return

    if (uploadedUrls.has(src)) {
      // 替换为Cloudinary URL
      img.setAttribute('src', uploadedUrls.get(src)!)
    } else if (failedUrls.has(src)) {
      // 移除失败的图片
      img.remove()
      removedCount.failed++
    } else if (excessImageUrls.has(src)) {
      // 移除超出限制的图片
      img.remove()
      removedCount.excess++
    }
  })

  // 记录处理结果
  if (removedCount.failed > 0) {
    console.warn(`${removedCount.failed} 张图片上传失败，已从内容中移除`)
  }
  if (removedCount.excess > 0) {
    console.warn(`超出限制：${removedCount.excess} 张图片被移除`)
  }

  return resultDoc.body.innerHTML
}

/**
 * 验证图片URL是否有效（CORS预检）
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
      credentials: 'omit',
    })

    const contentType = response.headers.get('content-type')
    return response.ok && !!(contentType?.startsWith('image/'))
  } catch {
    return false
  }
}
