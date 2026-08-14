/**
 * Openverse 开放公共领域图库 接口封装
 */
import { sendServiceCommand } from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

export interface OpenversePhoto {
  id: string
  title: string
  description: string
  image: string
  thumbnail: string
  downloadUrl?: string
  link: string
  url: string
  width?: number | null
  height?: number | null
  author?: string
  license?: string
  isFree?: boolean
  tags?: string
}

export interface OpenverseSearchResult {
  success: boolean
  query: string
  count: number
  total?: number
  items: OpenversePhoto[]
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

/**
 * 搜索 Openverse 图库
 */
export async function searchOpenverse(params: {
  keyword: string
  limit?: number
  page?: number
  clientId?: string
}) {
  const { keyword, limit = 20, page = 1, clientId } = params
  return sendServiceCommand({
    target: { clientId, pluginKey: 'openverse' },
    command: { name: 'search', payload: { keyword, query: keyword, limit, page } },
    mode: 'production',
  })
}

/**
 * 搜索并等待异步结果
 */
export async function searchOpenverseAndWait(params: {
  keyword: string
  limit?: number
  page?: number
  clientId?: string
  timeoutMs?: number
}): Promise<OpenverseSearchResult> {
  const { keyword, limit = 20, page = 1, clientId, timeoutMs = 30000 } = params

  const response = await sendServiceCommand({
    target: { clientId, pluginKey: 'openverse' },
    command: { name: 'search', payload: { keyword, query: keyword, limit, page } },
    mode: 'production',
  })

  if (!response?.success) {
    return {
      success: false,
      query: keyword,
      count: 0,
      items: [],
      links: [],
      page,
      nextPage: null,
      error: response?.message || '指令发送失败',
    }
  }

  const serverCommandId = response.data?.commandId
  if (!serverCommandId) {
    return {
      success: false,
      query: keyword,
      count: 0,
      items: [],
      links: [],
      page,
      nextPage: null,
      error: '服务端未返回有效 commandId',
    }
  }

  try {
    const resultEnvelope = await waitForServiceCommandResult(serverCommandId, timeoutMs)
    if (resultEnvelope.success && resultEnvelope.data) {
      const realData = (resultEnvelope.data && (resultEnvelope.data as any).data ? (resultEnvelope.data as any).data : resultEnvelope.data) || {}
      return realData as OpenverseSearchResult
    }
    return {
      success: false,
      query: keyword,
      count: 0,
      items: [],
      links: [],
      page,
      nextPage: null,
      error: resultEnvelope.message || '搜索超时或未返回有效数据',
    }
  } catch (err: any) {
    return {
      success: false,
      query: keyword,
      count: 0,
      items: [],
      links: [],
      page,
      nextPage: null,
      error: err?.message || String(err),
    }
  }
}

/**
 * 批量转存素材到素材库
 */
export async function collectOpenverse(params: {
  keyword: string
  maxCount?: number
  syncToMaterial?: boolean
  clientId?: string
}) {
  const { keyword, maxCount = 10, syncToMaterial = true, clientId } = params
  return sendServiceCommand({
    target: { clientId, pluginKey: 'openverse' },
    command: { name: 'collect', payload: { keyword, query: keyword, maxCount, syncToMaterial } },
    mode: 'production',
  })
}

/**
 * 获取服务状态
 */
export async function getOpenverseStatus(clientId?: string) {
  return sendServiceCommand({
    target: { clientId, pluginKey: 'openverse' },
    command: { name: 'health', payload: {} },
    mode: 'production',
  })
}
