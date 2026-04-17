import {
  getMyRuntimeWebsocketConnectionViews,
  sendServiceCommand,
  type ServiceCommandDTO,
  type WebsocketConnectionVO,
} from '@/api/system/websocket'

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
  const list = await getMyRuntimeWebsocketConnectionViews()
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
