import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { pinyin } from 'pinyin-pro'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

export function slugify(text: string): string {
  let result = '';
  let lastWasChinese = false;

  for (const char of text) {
    // 检查是否是中文字符
    if (/[\u4e00-\u9fff]/.test(char)) {
      // 中文字符转拼音
      const py = pinyin(char);
      // 移除音调符号
      const normalized = py.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      // 在中文前添加分隔符（连续中文之间或从英文切换到中文）
      if (result && result.charAt(result.length - 1) !== '-' && result.charAt(result.length - 1) !== ' ') {
        result += '-';
      }
      result += normalized;
      lastWasChinese = true;
    } else if (/[a-zA-Z0-9]/.test(char)) {
      // 英文和数字：如果前一个是中文，添加分隔符
      if (lastWasChinese && result && result.charAt(result.length - 1) !== '-') {
        result += '-';
      }
      result += char;
      lastWasChinese = false;
    } else {
      // 其他字符（空格、标点等）用空格表示，后续处理
      result += ' ';
      lastWasChinese = false;
    }
  }

  return result
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')         // 空格替换为-
    .replace(/[^\w-]+/g, '-')     // 移除特殊字符并替换为-
    .replace(/--+/g, '-')         // 多个-替换为单个-
    .replace(/^-+|-+$/g, '');     // 移除首尾的-
}

/**
 * 验证文章内容中的图片 URL
 * 检查是否有无效的图片 URL（不是 Cloudinary、本地开发或 Base64）
 * 返回: { valid: boolean; message: string; invalidUrls: string[] }
 */
export function validateImageUrls(content: string): {
  valid: boolean
  message: string
  invalidUrls: string[]
} {
  // 匹配所有不是 Cloudinary、localhost、127.0.0.1 或 data: URL 的图片
  const invalidImagePattern = /<img\s+[^>]*src=["'](?!https:\/\/res\.cloudinary\.com)(?!http:\/\/localhost)(?!http:\/\/127\.0\.0\.1)(?!data:)[^"']*["']/gi

  const matches = content.match(invalidImagePattern)
  if (!matches || matches.length === 0) {
    return {
      valid: true,
      message: '',
      invalidUrls: [],
    }
  }

  // 提取无效图片的 URL 进行诊断
  const urls = new Set<string>()
  const urlPattern = /src=["']([^"']+)["']/g
  let match
  content.replace(invalidImagePattern, (full) => {
    urlPattern.lastIndex = 0
    match = urlPattern.exec(full)
    if (match?.[1]) {
      urls.add(match[1])
    }
    return full
  })

  const invalidUrls = Array.from(urls)
  const sampleUrl = invalidUrls[0]
  let diagnostic = '检测到无效的图片 URL。\n\n'

  if (sampleUrl?.includes('mmbiz.qpic.cn') || sampleUrl?.includes('wx.qpic.cn')) {
    diagnostic += '💡 检测到微信 CDN 图片\n建议：\n• 重新粘贴文章，确保图片上传完成\n• 或手动上传图片到文章中'
  } else if (sampleUrl?.startsWith('http://') && !sampleUrl.includes('localhost')) {
    diagnostic += '💡 检测到非 HTTPS 图片源\n建议：\n• 使用 HTTPS 源重新粘贴\n• 或检查网络连接'
  } else if (sampleUrl?.startsWith('file://')) {
    diagnostic += '💡 检测到本地文件路径\n建议：\n• 使用在线图片源\n• 或上传图片到服务器'
  } else {
    diagnostic += '原因可能是：\n• 图片上传过程中被中断\n• 使用了不支持的图片源\n• 图片源已被禁用\n\n解决方案：\n• 删除失败的图片\n• 重新粘贴内容（确保所有图片上传成功）\n• 或手动上传图片'
  }

  diagnostic += `\n\n示例 URL：${sampleUrl}`

  return {
    valid: false,
    message: diagnostic,
    invalidUrls,
  }
}

