import { v2 as cloudinary } from 'cloudinary'

// 验证环境变量
const cloudinaryConfig = {
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}

// 仅在需要时输出调试信息
if (process.env.NODE_ENV === 'development') {
  console.log('[Cloudinary] Config loaded:', {
    cloud_name: cloudinaryConfig.cloud_name ? '✓' : '✗',
    api_key: cloudinaryConfig.api_key ? '✓' : '✗',
    api_secret: cloudinaryConfig.api_secret ? '✓' : '✗',
  })
}

cloudinary.config(cloudinaryConfig)

export { cloudinary }

export async function uploadImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'vovblog',
        resource_type: 'auto',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
          { width: 1200, crop: 'limit' },
        ],
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload error:', error)
          reject(error)
        } else if (result?.secure_url) {
          console.log('[Cloudinary] Upload success:', result.secure_url)
          resolve(result.secure_url)
        } else {
          const err = new Error('Cloudinary 上传失败：未返回有效的结果')
          console.error('[Cloudinary]', err.message, result)
          reject(err)
        }
      }
    )

    stream.on('error', (err) => {
      console.error('[Cloudinary] Stream error:', err)
      reject(err)
    })

    stream.end(buffer)
  })
}
