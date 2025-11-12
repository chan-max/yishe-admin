import request from '@/config/axios'

export interface WebsocketConnectionVO {
  id: string
  namespace: string
  connectedAt: string
  ip?: string
  userAgent?: string
  query?: Record<string, string | string[]>
}

export const getWebsocketConnections = () => {
  return request.post<WebsocketConnectionVO[]>({ url: '/websocket/connections' })
}

