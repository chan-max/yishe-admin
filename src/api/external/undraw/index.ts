/**
 * undraw 开源插画 接口封装
 */
import {
  getMyOnlineRuntimeConnectionViews,
  sendServiceCommand,
  type ServiceCommandDTO,
  type WebsocketConnectionVO,
} from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

export interface UndrawPhoto {
  id: string
  name?: string
  title: string
  description?: string
  image: string // 带主题色的 SVG 直链
  svgUrl?: string // SVG 矢量原图直链
  thumbnail?: string // 缩略图
  downloadUrl?: string
  link?: string
  url?: string
  color?: string // 当前主题色
  defaultColor?: string // 默认主题色
  width?: number | null
  height?: number | null
  author?: string
  license?: string
  isFree?: boolean
  tags?: string
}

export interface UndrawSearchResult {
  success: boolean
  query: string
  count: number
  total?: number
  totalPages?: number
  items: UndrawPhoto[]
  links: string[]
  page: number
  nextPage: number | null
  error?: string
}

export interface UndrawServiceStatus {
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

export interface UndrawClientVO {
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
  undraw?: UndrawServiceStatus | null
}

export interface UndrawCommandResponse {
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

function sendUndrawCommand(
  clientId: string,
  commandName: string,
  payload?: Record<string, any>,
) {
  const data: ServiceCommandDTO = {
    target: {
      clientId,
      pluginKey: 'undraw',
    },
    command: {
      name: commandName,
      payload: payload || {},
    },
    mode: 'production',
  }

  return sendServiceCommand(data) as Promise<UndrawCommandResponse>
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

export function refreshUndrawStatus(clientId: string) {
  return sendUndrawCommand(clientId, 'refreshRuntime')
}

export function searchUndraw(
  clientId: string,
  keyword: string,
  options: { page?: number; limit?: number; color?: string } = {},
) {
  return sendUndrawCommand(clientId, 'search', {
    keyword,
    query: keyword,
    page: options.page || 1,
    limit: options.limit || 20,
    color: options.color,
  })
}

export function syncUndrawToMaterialLibrary(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
) {
  return sendUndrawCommand(clientId, 'sync', data)
}

export function downloadUndrawImage(
  clientId: string,
  data: { imageUrl: string; filename?: string; color?: string },
) {
  return sendUndrawCommand(clientId, 'download', data)
}

export async function searchUndrawAndWait(
  clientId: string,
  keyword: string,
  options: { page?: number; limit?: number; color?: string } = {},
): Promise<UndrawSearchResult> {
  const response = await searchUndraw(clientId, keyword, options)
  const commandId = response.data?.commandId || (response as any).commandId
  if (!response.success || !commandId) {
    throw new Error(response.message || '搜索命令发送失败')
  }
  const result = await waitForServiceCommandResult(commandId, 60000)
  if (!result.success) {
    throw new Error(result.message || '搜索失败')
  }
  const realData = (result.data && result.data.data ? result.data.data : result.data) || {}
  return realData as UndrawSearchResult
}

export async function syncUndrawToMaterialLibraryAndWait(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
): Promise<{ success: boolean; message: string; data?: any }> {
  const response = await syncUndrawToMaterialLibrary(clientId, data)
  const commandId = response.data?.commandId || (response as any).commandId
  if (!response.success || !commandId) {
    throw new Error(response.message || '同步命令发送失败')
  }
  return waitForServiceCommandResult(commandId, 60000)
}
