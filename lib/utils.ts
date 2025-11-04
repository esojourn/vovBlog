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

  for (let char of text) {
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
    .replace(/[^\w\-]+/g, '-')    // 移除特殊字符并替换为-
    .replace(/\-\-+/g, '-')       // 多个-替换为单个-
    .replace(/^\-+|\-+$/g, '');   // 移除首尾的-
}
