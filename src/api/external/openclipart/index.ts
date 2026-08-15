/**
 * Openclipart 免费矢量插画 接口封装
 */
import {
  getMyOnlineRuntimeConnectionViews,
  sendServiceCommand,
  type ServiceCommandDTO,
  type WebsocketConnectionVO,
} from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

export interface OpenclipartPhoto {
  id: string
  name?: string
  title: string
  description?: string
  image: string // 2000px 超清 PNG 直连
  svgUrl?: string // 矢量 SVG 原图直连
  pngUrl?: string // 2000px 超清 PNG 直连
  thumbnail: string // 800px 缩略图
  downloadUrl?: string
  link?: string
  url?: string
  width?: number | null
  height?: number | null
  author?: string
  license?: string
  isFree?: boolean
  tags?: string
}

export interface OpenclipartSearchResult {
  success: boolean
  query: string
  count: number
  total?: number
  totalPages?: number
  items: OpenclipartPhoto[]
  links: string[]
  page: number
  nextPage: number | null
  error?: string
}

export interface OpenclipartServiceStatus {
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

export interface OpenclipartClientVO {
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
  openclipart?: OpenclipartServiceStatus | null
}

export interface OpenclipartCommandResponse {
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

function sendOpenclipartCommand(
  clientId: string,
  commandName: string,
  payload?: Record<string, any>,
) {
  const data: ServiceCommandDTO = {
    target: {
      clientId,
      pluginKey: 'openclipart',
    },
    command: {
      name: commandName,
      payload: payload || {},
    },
    mode: 'production',
  }

  return sendServiceCommand(data) as Promise<OpenclipartCommandResponse>
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

export function refreshOpenclipartStatus(clientId: string) {
  return sendOpenclipartCommand(clientId, 'refreshRuntime')
}

export function searchOpenclipart(
  clientId: string,
  keyword: string,
  options: { page?: number; limit?: number; formatPreference?: 'svg' | 'png' } = {},
) {
  return sendOpenclipartCommand(clientId, 'search', {
    keyword,
    query: keyword,
    page: options.page || 1,
    limit: options.limit || 20,
    formatPreference: options.formatPreference,
  })
}

export function syncOpenclipartToMaterialLibrary(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
) {
  return sendOpenclipartCommand(clientId, 'sync', data)
}

export function downloadOpenclipartImage(
  clientId: string,
  data: { imageUrl: string; filename?: string; format?: 'svg' | 'png' },
) {
  return sendOpenclipartCommand(clientId, 'download', data)
}

export async function searchOpenclipartAndWait(
  clientId: string,
  keyword: string,
  options: { page?: number; limit?: number; formatPreference?: 'svg' | 'png' } = {},
): Promise<OpenclipartSearchResult> {
  const response = await searchOpenclipart(clientId, keyword, options)
  const commandId = response.data?.commandId || (response as any).commandId
  if (!response.success || !commandId) {
    throw new Error(response.message || '搜索命令发送失败')
  }
  const result = await waitForServiceCommandResult(commandId, 60000)
  if (!result.success) {
    throw new Error(result.message || '搜索失败')
  }
  const realData = (result.data && result.data.data ? result.data.data : result.data) || {}
  return realData as OpenclipartSearchResult
}

export async function syncOpenclipartToMaterialLibraryAndWait(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
): Promise<{ success: boolean; message: string; data?: any }> {
  const response = await syncOpenclipartToMaterialLibrary(clientId, data)
  const commandId = response.data?.commandId || (response as any).commandId
  if (!response.success || !commandId) {
    throw new Error(response.message || '同步命令发送失败')
  }
  return waitForServiceCommandResult(commandId, 60000)
}
