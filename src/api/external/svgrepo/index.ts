/**
 * SVGRepo 50万+开源矢量图库 接口封装
 */
import {
  sendServiceCommand,
  type ServiceCommandDTO,
} from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

export interface SvgrepoPhoto {
  id: string
  title: string
  description?: string
  image: string
  svgUrl?: string
  thumbnail?: string
  downloadUrl?: string
  link?: string
  url?: string
  style?: string
  author?: string
  license?: string
  isFree?: boolean
  tags?: string
}

export interface SvgrepoSearchResult {
  success: boolean
  query: string
  count: number
  total?: number
  totalPages?: number
  items: SvgrepoPhoto[]
  links: string[]
  page: number
  nextPage: number | null
  error?: string
}

export interface SvgrepoServiceStatus {
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

export interface SvgrepoClientVO {
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
  svgrepo?: SvgrepoServiceStatus | null
}

export interface SvgrepoCommandResponse {
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

function sendSvgrepoCommand(
  clientId: string,
  commandName: string,
  payload?: Record<string, any>,
) {
  const data: ServiceCommandDTO = {
    target: {
      clientId,
      pluginKey: 'svgrepo',
    },
    command: {
      name: commandName,
      payload: payload || {},
    },
    mode: 'production',
  }

  return sendServiceCommand(data) as Promise<SvgrepoCommandResponse>
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

export function refreshSvgrepoStatus(clientId: string) {
  return sendSvgrepoCommand(clientId, 'refreshRuntime')
}

export function searchSvgrepo(
  clientId: string,
  keyword: string,
  options: { page?: number; limit?: number; style?: string } = {},
) {
  return sendSvgrepoCommand(clientId, 'search', {
    keyword,
    query: keyword,
    page: options.page || 1,
    limit: options.limit || 20,
    style: options.style || 'all',
  })
}

export async function searchSvgrepoAndWait(
  clientId: string,
  keyword: string,
  options: { page?: number; limit?: number; style?: string } = {},
  timeoutMs = 60000,
): Promise<SvgrepoSearchResult> {
  const res = await searchSvgrepo(clientId, keyword, options)
  const commandId = res?.data?.commandId
  if (!commandId) {
    return {
      success: false,
      query: keyword,
      count: 0,
      items: [],
      links: [],
      page: options.page || 1,
      nextPage: null,
      error: res?.message || '下发搜索指令失败',
    }
  }

  const result = await waitForServiceCommandResult(commandId, timeoutMs)
  const payload = result?.data?.data || result?.data || {}
  return {
    success: result.success,
    query: keyword,
    count: payload.count || payload.items?.length || 0,
    total: payload.total || payload.items?.length || 0,
    items: payload.items || [],
    links: payload.links || [],
    page: payload.page || options.page || 1,
    nextPage: payload.nextPage ?? null,
    error: result.message,
  }
}

export function syncSvgrepoToMaterialLibrary(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
) {
  return sendSvgrepoCommand(clientId, 'sync', data)
}

export async function syncSvgrepoToMaterialLibraryAndWait(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
  timeoutMs = 60000,
) {
  const res = await syncSvgrepoToMaterialLibrary(clientId, data)
  const commandId = res?.data?.commandId
  if (!commandId) {
    return { success: false, message: res?.message || '下发同步指令失败' }
  }
  return waitForServiceCommandResult(commandId, timeoutMs)
}

export function downloadSvgrepoImage(
  clientId: string,
  data: { imageUrl: string; filename?: string },
) {
  return sendSvgrepoCommand(clientId, 'download', data)
}
