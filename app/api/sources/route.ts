import { NextResponse } from 'next/server'
import { getMergedSourceOptions } from '@/lib/source-store'

/**
 * GET /api/sources
 * 返回合并后的来源下拉选项（内置来源 + 动态创建的来源）
 * 供 admin 表单在客户端加载最新的来源列表
 */
export async function GET() {
  try {
    const options = getMergedSourceOptions()
    return NextResponse.json({ options })
  } catch (error) {
    console.error('获取来源列表失败:', error)
    return NextResponse.json({ error: '获取来源列表失败' }, { status: 500 })
  }
}
