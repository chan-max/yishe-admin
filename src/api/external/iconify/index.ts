/**
 * Iconify 开源图标聚合平台 接口封装
 */
import {
  getMyOnlineRuntimeConnectionViews,
  sendServiceCommand,
  type ServiceCommandDTO,
  type WebsocketConnectionVO,
} from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

export interface IconifyIcon {
  id: string
  name?: string
  title: string
  description?: string
  image: string // SVG 直链 (带颜色参数)
  svgUrl?: string // SVG 矢量原图直链
  pngUrl?: string // PNG 直链
  thumbnail?: string // 缩略图
  downloadUrl?: string
  link?: string
  url?: string
  prefix?: string // 图标集前缀 (mdi, fa, heroicons, ...)
  color?: string // 当前图标色
  defaultColor?: string // 默认色
  width?: number | null
  height?: number | null
  author?: string
  license?: string
  isFree?: boolean
  tags?: string
}

export interface IconifySearchResult {
  success: boolean
  query: string
  count: number
  total?: number
  totalPages?: number
  items: IconifyIcon[]
  links: string[]
  page: number
  nextPage: number | null
  error?: string
}

export interface IconifyServiceStatus {
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

export interface IconifyClientVO {
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
  iconify?: IconifyServiceStatus | null
}

export interface IconifyCommandResponse {
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

function sendIconifyCommand(
  clientId: string,
  commandName: string,
  payload?: Record<string, any>,
) {
  const data: ServiceCommandDTO = {
    target: {
      clientId,
      pluginKey: 'iconify',
    },
    command: {
      name: commandName,
      payload: payload || {},
    },
    mode: 'production',
  }

  return sendServiceCommand(data) as Promise<IconifyCommandResponse>
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

export function refreshIconifyStatus(clientId: string) {
  return sendIconifyCommand(clientId, 'refreshRuntime')
}

export function searchIconify(
  clientId: string,
  keyword: string,
  options: { page?: number; limit?: number; prefix?: string; color?: string } = {},
) {
  return sendIconifyCommand(clientId, 'search', {
    keyword,
    query: keyword,
    page: options.page || 1,
    limit: options.limit || 20,
    prefix: options.prefix,
    color: options.color,
  })
}

export function syncIconifyToMaterialLibrary(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
) {
  return sendIconifyCommand(clientId, 'sync', data)
}

export function downloadIconifyIcon(
  clientId: string,
  data: { imageUrl: string; filename?: string; color?: string },
) {
  return sendIconifyCommand(clientId, 'download', data)
}

export async function searchIconifyAndWait(
  clientId: string,
  keyword: string,
  options: { page?: number; limit?: number; prefix?: string; color?: string } = {},
): Promise<IconifySearchResult> {
  const response = await searchIconify(clientId, keyword, options)
  const commandId = response.data?.commandId || (response as any).commandId
  if (!response.success || !commandId) {
    throw new Error(response.message || '搜索命令发送失败')
  }
  const result = await waitForServiceCommandResult(commandId, 60000)
  if (!result.success) {
    throw new Error(result.message || '搜索失败')
  }
  const realData = (result.data && result.data.data ? result.data.data : result.data) || {}
  return realData as IconifySearchResult
}

export async function syncIconifyToMaterialLibraryAndWait(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
): Promise<{ success: boolean; message: string; data?: any }> {
  const response = await syncIconifyToMaterialLibrary(clientId, data)
  const commandId = response.data?.commandId || (response as any).commandId
  if (!response.success || !commandId) {
    throw new Error(response.message || '同步命令发送失败')
  }
  return waitForServiceCommandResult(commandId, 60000)
}
