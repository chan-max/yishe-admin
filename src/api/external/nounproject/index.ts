/**
 * The Noun Project 图标/摄影图片 接口封装
 */
import {
  getMyOnlineRuntimeConnectionViews,
  sendServiceCommand,
  type ServiceCommandDTO,
  type WebsocketConnectionVO,
} from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

export interface NounProjectAsset {
  id: string
  name?: string
  title: string
  description?: string
  image: string // 预览图
  svgUrl?: string // SVG 矢量原图直连
  pngUrl?: string // PNG 位图直连
  thumbnail?: string // 缩略图
  downloadUrl?: string
  link?: string
  url?: string
  author?: string
  license?: string
  isFree?: boolean
  format?: string
  tags?: string
}

export interface NounProjectSearchResult {
  success: boolean
  query: string
  count: number
  total?: number
  totalPages?: number
  items: NounProjectAsset[]
  links: string[]
  page: number
  nextPage: number | null
  error?: string
}

export interface NounProjectServiceStatus {
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

export interface NounProjectClientVO {
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
  nounproject?: NounProjectServiceStatus | null
}

export interface NounProjectCommandResponse {
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

function sendNounProjectCommand(
  clientId: string,
  commandName: string,
  payload?: Record<string, any>,
) {
  const data: ServiceCommandDTO = {
    target: {
      clientId,
      pluginKey: 'nounproject',
    },
    command: {
      name: commandName,
      payload: payload || {},
    },
    mode: 'production',
  }

  return sendServiceCommand(data) as Promise<NounProjectCommandResponse>
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

export function refreshNounProjectStatus(clientId: string) {
  return sendNounProjectCommand(clientId, 'refreshRuntime')
}

export function searchNounProject(
  clientId: string,
  keyword: string,
  options: { page?: number; limit?: number; mediaType?: 'icons' | 'photos' } = {},
) {
  return sendNounProjectCommand(clientId, 'search', {
    keyword,
    query: keyword,
    page: options.page || 1,
    limit: options.limit || 20,
    mediaType: options.mediaType || 'icons',
  })
}

export function syncNounProjectToMaterialLibrary(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
) {
  return sendNounProjectCommand(clientId, 'sync', data)
}

export function downloadNounProjectAsset(
  clientId: string,
  data: { imageUrl: string; filename?: string; format?: string },
) {
  return sendNounProjectCommand(clientId, 'download', data)
}

export async function searchNounProjectAndWait(
  clientId: string,
  keyword: string,
  options: { page?: number; limit?: number; mediaType?: 'icons' | 'photos' } = {},
): Promise<NounProjectSearchResult> {
  const response = await searchNounProject(clientId, keyword, options)
  const commandId = response.data?.commandId || (response as any).commandId
  if (!response.success || !commandId) {
    throw new Error(response.message || '搜索命令发送失败')
  }
  const result = await waitForServiceCommandResult(commandId, 60000)
  if (!result.success) {
    throw new Error(result.message || '搜索失败')
  }
  const realData = (result.data && result.data.data ? result.data.data : result.data) || {}
  return realData as NounProjectSearchResult
}

export async function syncNounProjectToMaterialLibraryAndWait(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
): Promise<{ success: boolean; message: string; data?: any }> {
  const response = await syncNounProjectToMaterialLibrary(clientId, data)
  const commandId = response.data?.commandId || (response as any).commandId
  if (!response.success || !commandId) {
    throw new Error(response.message || '同步命令发送失败')
  }
  return waitForServiceCommandResult(commandId, 60000)
}
