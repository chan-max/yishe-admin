import {
  getMyOnlineRuntimeConnectionViews,
  sendServiceCommand,
  type ServiceCommandDTO,
  type WebsocketConnectionVO,
} from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

// ─── 类型定义 ──────────────────────────────────────────────

export interface GoogleArtServiceStatus {
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

export interface GoogleArtClientVO {
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
  googleArt?: GoogleArtServiceStatus | null
}

export interface GoogleArtZoomLevel {
  idx: number
  label: string
  width: number
  height: number
  tiles: number
}

export interface GoogleArtCommandResponse {
  success: boolean
  message: string
  data?: {
    commandId?: string
    clientId?: string
    pluginKey?: string
    service?: string
    action?: string
    payload?: Record<string, any>
    createdAt?: string
  }
}

// ─── Google Arts API 搜索 ──────────────────────────────────

export interface GoogleArtAsset {
  id: string
  title: string
  artist: string | null
  thumbnail: string | null
  url: string
  color: string | null
  aspectRatio: number | null
  pixelData: string | null
  hasPixels: boolean
  institution: string | null
}

export interface GoogleArtsSearchResult {
  query: string
  page: number
  total: number
  count: number
  items: GoogleArtAsset[]
  links: string[]
  nextCursor: string | null
}

/**
 * 搜索 Google Arts & Culture（通过客户端 MCP Tool）
 * 服务端只负责转发命令到客户端，实际请求由客户端发起
 */
/**
 * 搜索 Google Arts & Culture（通过客户端）
 * 返回 commandId，实际结果通过 service-command-result 事件返回
 */
export function searchGoogleArts(
  clientId: string,
  query: string,
  page = 1,
  hl = 'en',
  maxCount?: number,
  cursor?: string | null,
): Promise<GoogleArtCommandResponse> {
  const data: ServiceCommandDTO = {
    target: { clientId, pluginKey: 'google-art' },
    command: { name: 'search', payload: { query, page, hl, maxCount, cursor } },
    mode: 'production',
  }
  return sendServiceCommand(data) as Promise<GoogleArtCommandResponse>
}

/**
 * 搜索并等待结果（用于前端）
 */
export async function searchGoogleArtsAndWait(
  clientId: string,
  query: string,
  page = 1,
  hl = 'en',
  maxCount?: number,
  cursor?: string | null,
): Promise<GoogleArtsSearchResult> {
  const data: ServiceCommandDTO = {
    target: { clientId, pluginKey: 'google-art' },
    command: { name: 'search', payload: { query, page, hl, maxCount, cursor } },
    mode: 'production',
  }
  const response = await sendServiceCommand(data) as GoogleArtCommandResponse

  if (!response.success || !response.data?.commandId) {
    throw new Error(response.message || '搜索命令发送失败')
  }

  // 等待结果
  const commandId = response.data.commandId
  const result = await waitForServiceCommandResult(commandId, 30000)
  if (!result.success) {
    throw new Error(result.message || '搜索失败')
  }
  return result.data as GoogleArtsSearchResult
}

// ─── 客户端节点管理 ────────────────────────────────────────

function mapConnectionToGoogleArtClient(connection: WebsocketConnectionVO): GoogleArtClientVO {
  const services = connection.clientInfo?.services || {}
  const googleArt =
    services['google-art'] ||
    services.googleArt ||
    null

  return {
    clientId: connection.id,
    isOnline: connection.isOnline,
    nodeStatus: connection.nodeStatus,
    connectedAt: connection.connectedAt,
    lastOnlineAt: connection.lastOnlineAt,
    appVersion: connection.clientInfo?.appVersion || null,
    workspaceDirectory: connection.clientInfo?.workspaceDirectory || null,
    machine: connection.clientInfo?.machine || null,
    location: connection.clientInfo?.location || null,
    googleArt
  }
}

export async function getGoogleArtClients() {
  const list = await getMyOnlineRuntimeConnectionViews()
  return (Array.isArray(list) ? list : [])
    .map(mapConnectionToGoogleArtClient)
    .filter((item) => {
      if (!item.isOnline || !item.googleArt) {
        return false
      }
      const service = item.googleArt
      return !!(service.available || service.connected || service.status === 'error')
    })
}

// ─── 客户端命令（下载相关仍需客户端）──────────────────────

function sendGoogleArtCommand(clientId: string, commandName: string, payload?: Record<string, any>) {
  const data: ServiceCommandDTO = {
    target: {
      clientId,
      pluginKey: 'google-art'
    },
    command: {
      name: commandName,
      payload: payload || {}
    },
    mode: 'production'
  }

  return sendServiceCommand(data) as Promise<GoogleArtCommandResponse>
}

export function refreshGoogleArtStatus(clientId: string) {
  return sendGoogleArtCommand(clientId, 'refreshRuntime')
}

export function fetchGoogleArtZooms(clientId: string, url: string) {
  return sendGoogleArtCommand(clientId, 'getZooms', { url })
}

export function syncGoogleArtToMaterialLibrary(clientId: string, data: { url: string; zoomLevel: number }) {
  return sendGoogleArtCommand(clientId, 'sync', data)
}

/**
 * 等待服务命令结果
 */
function waitForServiceCommandResult(commandId: string, timeoutMs = 30000): Promise<{ success: boolean; message: string; data?: any }> {
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
 * 获取分辨率并等待结果
 */
export async function fetchGoogleArtZoomsAndWait(clientId: string, url: string): Promise<{ success: boolean; message: string; data?: any }> {
  const data: ServiceCommandDTO = {
    target: { clientId, pluginKey: 'google-art' },
    command: { name: 'getZooms', payload: { url } },
    mode: 'production',
  }
  const response = await sendServiceCommand(data) as GoogleArtCommandResponse
  if (!response.success || !response.data?.commandId) {
    throw new Error(response.message || '获取分辨率命令发送失败')
  }
  return waitForServiceCommandResult(response.data.commandId, 30000)
}

/**
 * 同步到素材库并等待结果
 */
export async function syncGoogleArtToMaterialLibraryAndWait(clientId: string, data: { url: string; zoomLevel: number }): Promise<{ success: boolean; message: string; data?: any }> {
  const cmdData: ServiceCommandDTO = {
    target: { clientId, pluginKey: 'google-art' },
    command: { name: 'sync', payload: data },
    mode: 'production',
  }
  const response = await sendServiceCommand(cmdData) as GoogleArtCommandResponse
  if (!response.success || !response.data?.commandId) {
    throw new Error(response.message || '同步命令发送失败')
  }
  return waitForServiceCommandResult(response.data.commandId, 60000)
}
