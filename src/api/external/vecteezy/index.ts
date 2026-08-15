/**
 * Vecteezy 免版税素材 接口封装
 */
import {
  getMyOnlineRuntimeConnectionViews,
  sendServiceCommand,
  type ServiceCommandDTO,
  type WebsocketConnectionVO,
} from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

export interface VecteezyAsset {
  id: string
  name?: string
  title: string
  description?: string
  image: string
  svgUrl?: string
  pngUrl?: string
  jpgUrl?: string
  thumbnail?: string
  downloadUrl?: string
  link?: string
  url?: string
  width?: number | null
  height?: number | null
  author?: string
  license?: string
  isFree?: boolean
  format?: 'svg' | 'png' | 'jpg'
  mediaType?: 'photos' | 'png' | 'vector'
  tags?: string
}

export interface VecteezySearchResult {
  success: boolean
  query: string
  count: number
  total?: number
  totalPages?: number
  items: VecteezyAsset[]
  links: string[]
  page: number
  nextPage: number | null
  error?: string
}

export interface VecteezyServiceStatus {
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
  currentTaskId?: string | null
  lastError?: string | null
  supportedCommands?: string[]
  details?: Record<string, any>
}

export interface VecteezyClientVO {
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
  vecteezy?: VecteezyServiceStatus | null
}

export interface VecteezyCommandResponse {
  success: boolean
  message: string
  data?: {
    commandId?: string
    clientId?: string
    pluginKey?: string
    service?: string
    action?: string
    mode?: string
    payload?: any
  }
}

function sendVecteezyCommand(
  clientId: string,
  commandName: string,
  payload?: Record<string, any>,
) {
  const data: ServiceCommandDTO = {
    target: {
      clientId,
      pluginKey: 'vecteezy',
    },
    command: {
      name: commandName,
      payload: payload || {},
    },
    mode: 'production',
  }

  return sendServiceCommand(data) as Promise<VecteezyCommandResponse>
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

export function refreshVecteezyStatus(clientId: string) {
  return sendVecteezyCommand(clientId, 'refreshRuntime')
}

export function searchVecteezy(
  clientId: string,
  keyword: string,
  options: { page?: number; limit?: number; mediaType?: 'photos' | 'png' | 'vector' } = {},
) {
  return sendVecteezyCommand(clientId, 'search', {
    keyword,
    query: keyword,
    page: options.page || 1,
    limit: options.limit || 20,
    mediaType: options.mediaType || 'photos',
  })
}

export function syncVecteezyToMaterialLibrary(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
) {
  return sendVecteezyCommand(clientId, 'sync', data)
}

export function downloadVecteezyAsset(
  clientId: string,
  data: { imageUrl: string; filename?: string; format?: 'svg' | 'png' | 'jpg' },
) {
  return sendVecteezyCommand(clientId, 'download', data)
}

export async function searchVecteezyAndWait(
  clientId: string,
  keyword: string,
  options: { page?: number; limit?: number; mediaType?: 'photos' | 'png' | 'vector' } = {},
): Promise<VecteezySearchResult> {
  const response = await searchVecteezy(clientId, keyword, options)
  const commandId = response.data?.commandId || (response as any).commandId
  if (!response.success || !commandId) {
    throw new Error(response.message || '搜索命令发送失败')
  }
  const result = await waitForServiceCommandResult(commandId, 60000)
  if (!result.success) {
    throw new Error(result.message || '搜索失败')
  }
  const realData = (result.data && result.data.data ? result.data.data : result.data) || {}
  return realData as VecteezySearchResult
}

export async function syncVecteezyToMaterialLibraryAndWait(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
): Promise<{ success: boolean; message: string; data?: any }> {
  const response = await syncVecteezyToMaterialLibrary(clientId, data)
  const commandId = response.data?.commandId || (response as any).commandId
  if (!response.success || !commandId) {
    throw new Error(response.message || '同步命令发送失败')
  }
  return waitForServiceCommandResult(commandId, 60000)
}
