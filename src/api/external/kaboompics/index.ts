/**
 * Kaboompics 免费高清图库 接口封装
 */
import { sendServiceCommand } from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

export interface KaboompicsPhoto {
  id: string
  name: string
  title: string
  description: string
  image: string // 高清原图直连 (Full Original)
  thumbnail: string
  downloadUrl: string
  link: string
  url: string
  width?: number | null
  height?: number | null
  author?: string
  license?: string
  isFree?: boolean
  tags?: string
  colors?: string[]
}

export interface KaboompicsSearchResult {
  success: boolean
  query: string
  count: number
  total?: number
  items: KaboompicsPhoto[]
  links: string[]
  page: number
  nextPage: number | null
  error?: string
}

export interface KaboompicsClientVO {
  clientId: string
  isOnline?: boolean
  nodeStatus?: string | null
  connectedAt?: string | null
  lastOnlineAt?: string | null
  appVersion?: string | null
  workspaceDirectory?: string | null
  machine?: any
  location?: any
  kaboompics?: KaboompicsServiceStatus | null
}

export interface KaboompicsServiceStatus {
  key: string
  pluginKey: string
  label: string
  connected: boolean
  available: boolean
  status: string
  state: string
  message: string
  lastCheckedAt: string
  supportedCommands: string[]
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

export async function searchKaboompics(
  clientId: string,
  query: string,
  options: { page?: number; limit?: number } = {},
) {
  return sendServiceCommand(clientId, {
    serviceName: 'kaboompics',
    command: 'search',
    payload: {
      query,
      page: options.page || 1,
      limit: options.limit || 20,
    },
  })
}

export async function syncKaboompicsToMaterialLibrary(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
) {
  return sendServiceCommand(clientId, {
    serviceName: 'kaboompics',
    command: 'sync',
    payload: data,
  })
}

export async function downloadKaboompicsImage(
  clientId: string,
  data: { imageUrl: string; filename?: string },
) {
  return sendServiceCommand(clientId, {
    serviceName: 'kaboompics',
    command: 'download',
    payload: data,
  })
}

export async function refreshKaboompicsStatus(clientId: string) {
  return sendServiceCommand(clientId, {
    serviceName: 'kaboompics',
    command: 'status',
    payload: {},
  })
}

export async function searchKaboompicsAndWait(
  clientId: string,
  keyword: string,
  options: { page?: number; limit?: number } = {},
): Promise<KaboompicsSearchResult> {
  const response = await searchKaboompics(clientId, keyword, options)
  if (!response.success || !response.data?.commandId) {
    throw new Error(response.message || '搜索命令发送失败')
  }
  const result = await waitForServiceCommandResult(response.data.commandId, 60000)
  if (!result.success) {
    throw new Error(result.message || '搜索失败')
  }
  const realData = (result.data && result.data.data ? result.data.data : result.data) || {}
  return realData as KaboompicsSearchResult
}

export async function syncKaboompicsToMaterialLibraryAndWait(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
): Promise<{ success: boolean; message: string; data?: any }> {
  const response = await syncKaboompicsToMaterialLibrary(clientId, data)
  if (!response.success || !response.data?.commandId) {
    throw new Error(response.message || '同步命令发送失败')
  }
  return waitForServiceCommandResult(response.data.commandId, 60000)
}
