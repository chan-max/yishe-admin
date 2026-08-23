/**
 * 搜索引擎与图片素材平台通用 API 封装
 * 支持百度、必应、DuckDuckGo、搜狗、360、Wallhaven、Unsplash、Flickr、GoogleImages、Yandex 等
 */
import { sendServiceCommand, type ServiceCommandDTO } from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

export interface ImageEnginePhoto {
  id: string
  title: string
  description?: string
  image: string
  thumbnail: string
  link?: string
  url?: string
  width?: number | null
  height?: number | null
  fileSize?: number | null
  author?: string
  tags?: string
  colors?: string[]
}

export interface ImageEngineSearchResult {
  success: boolean
  query: string
  count: number
  total?: number
  items: ImageEnginePhoto[]
  links: string[]
  page: number
  nextPage: number | null
  error?: string
}

export interface ImageEngineServiceStatus {
  key?: string
  pluginKey?: string
  label?: string
  connected?: boolean
  available?: boolean
  status?: 'connected' | 'disconnected' | 'error' | 'unknown'
  state?: 'idle' | 'busy' | 'offline' | 'error'
  busy?: boolean
  message?: string
  version?: string
  endpoint?: string
  lastCheckedAt?: string
  supportedCommands?: string[]
  details?: Record<string, any>
}

export interface ImageEngineClientVO {
  clientId: string
  isOnline?: boolean
  nodeStatus?: string | null
  connectedAt?: string | null
  lastOnlineAt?: string | null
  appVersion?: string | null
  workspaceDirectory?: string | null
  machine?: {
    code?: string
    platform?: string
    createdAt?: string
  } | null
  location?: {
    ip?: string
    city?: string
    region?: string
    country?: string
    org?: string
    fetchedAt?: string
    source?: string
  } | null
  service?: ImageEngineServiceStatus | null
}

export function waitForServiceCommandResult(
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

export function createImageEngineApi(pluginKey: string) {
  const sendCommand = (clientId: string, commandName: string, payload?: Record<string, any>) => {
    const data: ServiceCommandDTO = {
      target: { clientId, pluginKey },
      command: { name: commandName, payload: payload || {} },
      mode: 'production',
    }
    return sendServiceCommand(data)
  }

  return {
    refreshStatus: (clientId: string) => sendCommand(clientId, 'refreshRuntime'),
    search: (clientId: string, keyword: string, options: { page?: number; limit?: number } = {}) => {
      return sendCommand(clientId, 'search', {
        keyword,
        query: keyword,
        page: options.page || 1,
        limit: options.limit || 20,
      })
    },
    syncToMaterialLibrary: (clientId: string, data: { imageUrl: string; metadata?: Record<string, any> }) => {
      return sendCommand(clientId, 'sync', data)
    },
    download: (clientId: string, data: { imageUrl: string; filename?: string }) => {
      return sendCommand(clientId, 'download', data)
    },
    searchAndWait: async (clientId: string, keyword: string, options: { page?: number; limit?: number } = {}): Promise<ImageEngineSearchResult> => {
      const response = await sendCommand(clientId, 'search', {
        keyword,
        query: keyword,
        page: options.page || 1,
        limit: options.limit || 20,
      }) as any
      const commandId = response?.data?.commandId || response?.commandId
      if (!response?.success || !commandId) {
        throw new Error(response?.message || '搜索命令发送失败')
      }
      const result = await waitForServiceCommandResult(commandId, 60000)
      if (!result.success) {
        throw new Error(result.message || '搜索失败')
      }
      const realData = (result.data && result.data.data ? result.data.data : result.data) || {}
      return realData as ImageEngineSearchResult
    },
    syncAndWait: async (clientId: string, data: { imageUrl: string; metadata?: Record<string, any> }) => {
      const response = await sendCommand(clientId, 'sync', data) as any
      const commandId = response?.data?.commandId || response?.commandId
      if (!response?.success || !commandId) {
        throw new Error(response?.message || '同步命令发送失败')
      }
      return waitForServiceCommandResult(commandId, 60000)
    },
  }
}
