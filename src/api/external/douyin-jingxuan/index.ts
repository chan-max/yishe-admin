import request from '@/config/axios'
import { sendServiceCommand } from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

export interface DouyinVideo {
  id: string
  title: string
  description: string
  videoUrl: string
  cover: string
  duration: string
  playCount: string
  author: string
  authorId: string
  date: string
  tags: string[]
}

export interface DouyinSearchResult {
  success: boolean
  query: string
  category: string
  count: number
  total: number
  items: DouyinVideo[]
  page: number
  nextPage: number | null
  error?: string
}

function waitForServiceCommandResult(
  commandId: string,
  timeoutMs = 60000,
): Promise<{ success: boolean; message: string; data?: any }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      websocketClient.events.off('serviceCommandResult', handler)
      reject(new Error(`命令执行超时 (${timeoutMs / 1000}s)`))
    }, timeoutMs)

    const handler = (event: any) => {
      if (event.commandId === commandId) {
        clearTimeout(timer)
        websocketClient.events.off('serviceCommandResult', handler)
        resolve({
          success: event.success,
          message: event.message,
          data: event.data,
        })
      }
    }

    websocketClient.events.on('serviceCommandResult', handler)
  })
}

export function searchDouyinJingxuan(
  clientId: string,
  options: {
    category?: string
    limit?: number
    page?: number
  } = {},
) {
  return sendServiceCommand({
    target: { clientId, pluginKey: 'douyin_jingxuan' },
    command: {
      name: 'search',
      payload: {
        category: options.category || '全部',
        limit: options.limit ?? 20,
        page: options.page ?? 1,
      },
    },
    mode: 'production',
  })
}

export async function searchDouyinJingxuanAndWait(
  clientId: string,
  options: {
    category?: string
    limit?: number
    page?: number
  } = {},
): Promise<DouyinSearchResult> {
  const response = await searchDouyinJingxuan(clientId, options)
  if (!response?.success || !response.data?.commandId) {
    throw new Error(response?.message || '采集命令发送失败')
  }
  const result = await waitForServiceCommandResult(response.data.commandId, 120000)
  if (!result.success) {
    throw new Error(result.message || '采集失败')
  }
  const realData = (result.data && result.data.data ? result.data.data : result.data) || {}
  return realData as DouyinSearchResult
}

export const getDouyinJingxuanStatus = async () => {
  return request.get({ url: '/external/douyin-jingxuan/status' })
}
