import request from '@/config/axios'

export interface BrowserAutomationServiceStatus {
  key?: string
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

export interface BrowserAutomationClientVO {
  clientId: string
  isOnline?: boolean
  nodeStatus?: string | null
  connectedAt?: string | null
  lastOnlineAt?: string | null
  lastOfflineAt?: string | null
  appVersion?: string | null
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
  uploader?: BrowserAutomationServiceStatus | null
}

export interface BrowserAutomationCommandResponse {
  success: boolean
  message: string
  data?: {
    commandId?: string
    clientId?: string
    service?: string
    action?: string
    payload?: Record<string, any>
    createdAt?: string
  }
}

export interface BrowserAutomationSnapshotResponse {
  success: boolean
  data: BrowserAutomationClientVO
}

export const getBrowserAutomationClients = () => {
  return request.get<BrowserAutomationClientVO[]>({ url: '/external/browser-automation/clients' })
}

export const getBrowserAutomationStatus = (clientId: string) => {
  return request.get<BrowserAutomationSnapshotResponse>({
    url: `/external/browser-automation/${clientId}/status`
  })
}

export const checkBrowserAutomationStatus = (clientId: string) => {
  return request.post<BrowserAutomationCommandResponse>({
    url: `/external/browser-automation/${clientId}/check-status`
  })
}

export const connectBrowserAutomation = (clientId: string, data?: { port?: number; headless?: boolean }) => {
  return request.post<BrowserAutomationCommandResponse>({
    url: `/external/browser-automation/${clientId}/connect`,
    data
  })
}

export const closeBrowserAutomation = (clientId: string) => {
  return request.post<BrowserAutomationCommandResponse>({
    url: `/external/browser-automation/${clientId}/close`
  })
}

export const forceCloseBrowserAutomation = (clientId: string, data?: { port?: number }) => {
  return request.post<BrowserAutomationCommandResponse>({
    url: `/external/browser-automation/${clientId}/force-close`,
    data
  })
}

export const fetchBrowserAutomationPages = (clientId: string) => {
  return request.get<BrowserAutomationCommandResponse>({
    url: `/external/browser-automation/${clientId}/pages`
  })
}

export const executeBrowserAutomationDebug = (clientId: string, data: Record<string, any>) => {
  return request.post<BrowserAutomationCommandResponse>({
    url: `/external/browser-automation/${clientId}/debug`,
    data
  })
}

export const openBrowserAutomationPlatform = (clientId: string, data: { platform: string }) => {
  return request.post<BrowserAutomationCommandResponse>({
    url: `/external/browser-automation/${clientId}/open-platform`,
    data
  })
}

export const openBrowserAutomationLink = (clientId: string, data: { url: string }) => {
  return request.post<BrowserAutomationCommandResponse>({
    url: `/external/browser-automation/${clientId}/open-link`,
    data
  })
}

export const queryBrowserAutomationTasks = (clientId: string, data?: Record<string, any>) => {
  return request.post<BrowserAutomationCommandResponse>({
    url: `/external/browser-automation/${clientId}/tasks/query`,
    data
  })
}

export const getBrowserAutomationTaskDetail = (clientId: string, taskId: string) => {
  return request.post<BrowserAutomationCommandResponse>({
    url: `/external/browser-automation/${clientId}/tasks/${encodeURIComponent(taskId)}/detail`
  })
}

export const getBrowserAutomationTaskLogs = (clientId: string, taskId: string) => {
  return request.post<BrowserAutomationCommandResponse>({
    url: `/external/browser-automation/${clientId}/tasks/${encodeURIComponent(taskId)}/logs`
  })
}

export const getBrowserAutomationPlatforms = (clientId: string) => {
  return request.post<BrowserAutomationCommandResponse>({
    url: `/external/browser-automation/${clientId}/platforms`
  })
}

export const getBrowserAutomationLoginStatus = (clientId: string, data?: { refresh?: boolean }) => {
  return request.post<BrowserAutomationCommandResponse>({
    url: `/external/browser-automation/${clientId}/login-status`,
    data
  })
}

export const publishByBrowserAutomation = (clientId: string, data: Record<string, any>) => {
  return request.post<BrowserAutomationCommandResponse>({
    url: `/external/browser-automation/${clientId}/publish`,
    data
  })
}
