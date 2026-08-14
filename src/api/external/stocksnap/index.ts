import request from '@/config/axios'
import { sendServiceCommand } from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

export interface StockSnapPhoto {
  id: string
  title: string
  description: string
  image: string
  thumbnail: string
  link: string
  url: string
  width?: number
  height?: number
  author?: string
  license?: string
  isFree?: boolean
  tags?: string
}

export interface StockSnapSearchResult {
  success: boolean
  query: string
  count: number
  total?: number
  items: StockSnapPhoto[]
  links: string[]
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

export function searchStockSnap(
  clientId: string,
  keyword: string,
  options: {
    limit?: number
    page?: number
    sort?: string
  } = {}
) {
  return sendServiceCommand({
    target: { clientId, pluginKey: 'stocksnap' },
    command: {
      name: 'search',
      payload: {
        keyword,
        limit: options.limit ?? 20,
        page: options.page ?? 1,
        sort: options.sort || 'date',
      },
    },
    mode: 'production',
  })
}

export async function searchStockSnapAndWait(
  clientId: string,
  keyword: string,
  options: {
    limit?: number
    page?: number
    sort?: string
  } = {}
): Promise<StockSnapSearchResult> {
  const response = await searchStockSnap(clientId, keyword, options)
  if (!response?.success || !response.data?.commandId) {
    throw new Error(response?.message || '搜索命令发送失败')
  }
  const result = await waitForServiceCommandResult(response.data.commandId, 60000)
  if (!result.success) {
    throw new Error(result.message || '搜索失败')
  }
  const realData = (result.data && result.data.data ? result.data.data : result.data) || {}
  return realData as StockSnapSearchResult
}

export function collectStockSnap(
  clientId: string,
  keyword: string,
  options: {
    maxCount?: number
    sort?: string
  } = {}
) {
  return sendServiceCommand({
    target: { clientId, pluginKey: 'stocksnap' },
    command: {
      name: 'collect',
      payload: {
        keyword,
        maxCount: options.maxCount ?? 10,
        sort: options.sort || 'date',
      },
    },
    mode: 'production',
  })
}

export const getStockSnapStatus = async () => {
  return request.get({ url: '/external/stocksnap/status' })
}
