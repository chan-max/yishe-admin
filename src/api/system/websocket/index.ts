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

// 定时任务相关接口
export interface ScheduledTask {
  clientId: string
  type: 'cron' | 'interval'
  schedule: string
  params: any
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface SetTaskDTO {
  clientId: string
  type: 'cron' | 'interval'
  schedule: string
  params: any
}

export interface ToggleTaskDTO {
  clientId: string
  enabled: boolean
}

// 设置定时任务
export const setScheduleTask = (data: SetTaskDTO) => {
  return request.post({ url: '/websocket/schedule/set', data })
}

// 获取指定客户端的定时任务
export const getScheduleTask = (clientId: string) => {
  return request.post<{ success: boolean; data: ScheduledTask | null }>({ url: '/websocket/schedule/get', data: { clientId } })
}

// 获取所有定时任务
export const getAllScheduleTasks = () => {
  return request.post<{ success: boolean; data: ScheduledTask[] }>({ url: '/websocket/schedule/list' })
}

// 删除定时任务
export const removeScheduleTask = (clientId: string) => {
  return request.post<{ success: boolean; message: string }>({ url: '/websocket/schedule/remove', data: { clientId } })
}

// 启用/禁用定时任务
export const toggleScheduleTask = (data: ToggleTaskDTO) => {
  return request.post<{ success: boolean; message: string }>({ url: '/websocket/schedule/toggle', data })
}

