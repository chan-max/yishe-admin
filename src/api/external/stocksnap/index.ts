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
  timeoutMs = 30000,
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

export const searchStockSnap = async (
  clientId: string,
  params: {
    keyword: string
    limit?: number
    page?: number
    sort?: string
  }
): Promise<StockSnapSearchResult> => {
  const result = await sendServiceCommand({
    target: { clientId, pluginKey: 'stocksnap' },
    command: {
      name: 'search',
      payload: params,
    },
    mode: 'production',
  })
  return (result?.data || result) as StockSnapSearchResult
}

export const searchStockSnapAndWait = async (
  clientId: string,
  params: {
    keyword: string
    limit?: number
    page?: number
    sort?: string
    timeoutMs?: number
  }
): Promise<StockSnapSearchResult> => {
  const { timeoutMs = 60000, ...payload } = params
  const commandId = `stocksnap-search-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const resultPromise = waitForServiceCommandResult(commandId, timeoutMs)

  await sendServiceCommand({
    commandId,
    target: { clientId, pluginKey: 'stocksnap' },
    command: {
      name: 'search',
      payload,
    },
    mode: 'production',
  })

  const result = await resultPromise
  const realData = (result.data && result.data.data ? result.data.data : result.data) || {}
  return realData as StockSnapSearchResult
}

export const collectStockSnap = async (
  clientId: string,
  params: {
    keyword: string
    maxCount?: number
    page?: number
    sort?: string
    timeoutMs?: number
  }
) => {
  const { timeoutMs = 120000, ...payload } = params
  const commandId = `stocksnap-collect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const resultPromise = waitForServiceCommandResult(commandId, timeoutMs)

  await sendServiceCommand({
    commandId,
    target: { clientId, pluginKey: 'stocksnap' },
    command: {
      name: 'collect',
      payload,
    },
    mode: 'production',
  })

  const result = await resultPromise
  return result?.data || result
}

export const getStockSnapStatus = async () => {
  return request.get({ url: '/external/stocksnap/status' })
}
