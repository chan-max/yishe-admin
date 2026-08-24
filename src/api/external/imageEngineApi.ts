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
  console.log(`[ImageEngineApi] waitForServiceCommandResult 开始: commandId=${commandId}, timeout=${timeoutMs}ms`)
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      websocketClient.events.off('serviceCommandResult', handler)
      console.error(`[ImageEngineApi] 命令执行超时: commandId=${commandId}, timeout=${timeoutMs}ms`)
      reject(new Error(`命令执行超时 (${timeoutMs / 1000}s)`))
    }, timeoutMs)

    const handler = (event: any) => {
      console.log(`[ImageEngineApi] 收到 serviceCommandResult 事件: commandId=${event.commandId}, 匹配=${event.commandId === commandId}`)
      if (event.commandId === commandId) {
        clearTimeout(timer)
        websocketClient.events.off('serviceCommandResult', handler)
        console.log(`[ImageEngineApi] 结果匹配成功: success=${event.success}, message=${event.message}, data类型=${typeof event.data}`)
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
    console.log(`[ImageEngineApi] 发送命令: pluginKey=${pluginKey}, clientId=${clientId}, command=${commandName}, payload=`, payload)
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
      console.log(`[ImageEngineApi] searchAndWait 开始: pluginKey=${pluginKey}, clientId=${clientId}, keyword=${keyword}, options=`, options)
      const response = await sendCommand(clientId, 'search', {
        keyword,
        query: keyword,
        page: options.page || 1,
        limit: options.limit || 20,
      }) as any
      console.log(`[ImageEngineApi] searchAndWait 命令发送完成: response=`, response)
      const commandId = response?.data?.commandId || response?.commandId
      if (!response?.success || !commandId) {
        console.error(`[ImageEngineApi] searchAndWait 命令发送失败: response.success=${response?.success}, commandId=${commandId}, message=${response?.message}`)
        throw new Error(response?.message || '搜索命令发送失败')
      }
      console.log(`[ImageEngineApi] searchAndWait 等待结果: commandId=${commandId}, timeout=60000ms`)
      const result = await waitForServiceCommandResult(commandId, 60000)
      console.log(`[ImageEngineApi] searchAndWait 收到结果: success=${result.success}, message=${result.message}, data类型=${typeof result.data}`)
      if (!result.success) {
        console.error(`[ImageEngineApi] searchAndWait 执行失败: result.message=${result.message}, error=${result.error}`)
        throw new Error(result.message || '搜索失败')
      }
      // 数据可能是 { success, data: { items, count, ... } } 或直接 { items, count, ... }
      const realData = (result.data && result.data.data ? result.data.data : result.data) || {}
      console.log(`[ImageEngineApi] searchAndWait 解析数据: realData.success=${realData.success}, realData.count=${realData.count}, realData.items长度=${realData.items?.length}`)
      // 检查数据有效性：有 items 或者 success 为 true 都算成功
      if (!realData.success && !realData.items && !realData.successCount) {
        console.error(`[ImageEngineApi] searchAndWait 数据格式异常: realData=`, realData)
        throw new Error('搜索返回数据格式异常')
      }
      // 确保返回的数据结构统一
      const normalizedData = {
        success: realData.success || realData.successCount > 0 || (realData.items?.length || 0) > 0,
        query: realData.query || keyword,
        count: realData.count || realData.items?.length || 0,
        total: realData.total || realData.count || realData.items?.length || 0,
        items: realData.items || [],
        links: realData.links || [],
        page: realData.page || options.page || 1,
        nextPage: realData.nextPage || null,
        error: realData.error,
      }
      console.log(`[ImageEngineApi] searchAndWait 最终数据:`, normalizedData)
      return normalizedData as ImageEngineSearchResult
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
