import request from '@/config/axios'

export interface WebsocketClientInfo {
  clientId?: string
  timestamp?: string
  extension?: {
    name?: string
    version?: string
    manifestVersion?: number
  }
  browser?: {
    name?: string
    version?: string
  }
  os?: {
    name?: string
    version?: string
  }
  platform?: {
    os?: string
    arch?: string
    nacl_arch?: string
  }
  language?: string
  uiLanguage?: string
  timeZone?: string
  userAgent?: string
  device?: {
    memory?: number
    hardwareConcurrency?: number
  }
  location?: {
    ip?: string
    city?: string
    region?: string
    country?: string
    latitude?: number
    longitude?: number
    org?: string
    timeZone?: string
    fetchedAt?: string
    source?: string
  }
}

export interface WebsocketConnectionVO {
  id: string
  namespace: string
  connectedAt: string
  ip?: string
  userAgent?: string
  query?: Record<string, string | string[]>
  clientInfo?: WebsocketClientInfo
  clientSource?: string
}

export const getWebsocketConnections = () => {
  return request.post<WebsocketConnectionVO[]>({ url: '/websocket/connections' })
}

export const sendMessageToConnection = (connectionId: string, data: any, event?: string) => {
  return request.post({ url: '/websocket/send-message', data: { id: connectionId, event, data } })
}

