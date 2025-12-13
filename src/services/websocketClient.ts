import { io, type Socket } from 'socket.io-client'
import { reactive } from 'vue'
import mitt from 'mitt'
import { getAccessToken } from '@/utils/auth'

type WsStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'

const CLIENT_SOURCE = '管理后台'
const HEARTBEAT_INTERVAL = 15_000
const HEARTBEAT_TIMEOUT = 10_000

// 获取 WebSocket 地址
const getDefaultWsUrl = () => {
  const explicitUrl = import.meta.env.VITE_WS_URL as string | undefined
  if (explicitUrl) {
    return explicitUrl
  }

  const baseUrl = (import.meta.env.VITE_BASE_URL as string | undefined) ?? ''
  if (baseUrl) {
    const normalizedBase = baseUrl.replace(/\/$/, '')
    const sanitizedBase = normalizedBase.replace(/\/api$/i, '')
    return `${sanitizedBase.replace(/^http/i, 'ws')}/ws`
  }

  if (typeof window === 'undefined') {
    return ''
  }

  const { protocol, host } = window.location
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:'
  return `${wsProtocol}//${host}/ws`
}

const DEFAULT_WS_ENDPOINT = getDefaultWsUrl()

interface WsState {
  endpoint: string
  status: WsStatus
  connectedAt: string | null
  lastPingAt: string | null
  lastPongAt: string | null
  lastLatencyMs: number | null
  lastError: string | null
  retryCount: number
  connectionId: string | null
}

interface ClientInfoPayload {
  clientId: string
  source: string
  platform?: string
  locale?: string
  timezone?: string
  userAgent?: string
  device?: {
    memory?: number
    hardwareConcurrency?: number
  }
  machine?: {
    code?: string
    platform?: string
  }
  location?: {
    ip?: string
    city?: string
    region?: string
    country?: string
    org?: string
    timezone?: string
  }
}

const wsState = reactive<WsState>({
  endpoint: DEFAULT_WS_ENDPOINT,
  status: 'idle',
  connectedAt: null,
  lastPingAt: null,
  lastPongAt: null,
  lastLatencyMs: null,
  lastError: null,
  retryCount: 0,
  connectionId: null
})

// 生成客户端 ID
function generateClientId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `admin_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`
}

const clientId = generateClientId()

const clientInfo = reactive<ClientInfoPayload>({
  clientId,
  source: CLIENT_SOURCE,
  platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
  locale: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  device: {
    memory: typeof navigator !== 'undefined' ? (navigator as any).deviceMemory : undefined,
    hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined
  },
  machine: {
    code: `ADMIN-${clientId.slice(-12).toUpperCase()}`,
    platform: typeof navigator !== 'undefined' ? navigator.platform : undefined
  }
})

export type WebsocketEvents = {
  log: { level: 'info' | 'warn' | 'error'; message: string }
  toast: { color: string; icon: string; message: string }
  adminMessage: { data: any; timestamp: string }
  myClientStatus: { hasClient: boolean }
}

const emitter = mitt<WebsocketEvents>()

let socket: Socket | null = null
let heartbeatInterval: ReturnType<typeof setInterval> | null = null
let heartbeatTimeout: ReturnType<typeof setTimeout> | null = null
let lastPingTimestamp: number | null = null
let intentionalDisconnect = false

function updateState(patch: Partial<WsState>) {
  Object.assign(wsState, patch)
  emitter.emit('log', { level: 'info', message: `[ws] state updated ${JSON.stringify(patch)}` })
}

function clearHeartbeatInterval() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
}

function clearHeartbeatTimeout() {
  if (heartbeatTimeout) {
    clearTimeout(heartbeatTimeout)
    heartbeatTimeout = null
  }
}

function stopHeartbeat() {
  clearHeartbeatInterval()
  clearHeartbeatTimeout()
  lastPingTimestamp = null
}

function scheduleHeartbeatTimeout() {
  clearHeartbeatTimeout()
  heartbeatTimeout = setTimeout(() => {
    updateState({
      status: 'error',
      lastError: 'Heartbeat timeout'
    })
    emitter.emit('log', { level: 'warn', message: '[ws] heartbeat timeout, reconnecting' })
    reconnect()
  }, HEARTBEAT_TIMEOUT)
}

function emitHeartbeat() {
  if (!socket || !socket.connected) return
  lastPingTimestamp = Date.now()
  updateState({
    lastPingAt: new Date(lastPingTimestamp).toISOString()
  })
  socket.emit('ping')
  scheduleHeartbeatTimeout()
}

function startHeartbeatLoop() {
  stopHeartbeat()
  heartbeatInterval = setInterval(emitHeartbeat, HEARTBEAT_INTERVAL)
  emitHeartbeat()
}

function cleanupSocket() {
  if (socket) {
    socket.removeAllListeners()
    socket.io.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  stopHeartbeat()
}

function buildQuery() {
  const token = getAccessToken()
  const payload: Record<string, string> = {
    clientSource: CLIENT_SOURCE,
    clientId: clientId,
    machineCode: clientInfo.machine?.code || ''
  }

  if (token) {
    payload.token = token
  }

  try {
    payload.clientInfo = JSON.stringify(clientInfo)
  } catch {
    // ignore serialization errors
  }

  return payload
}

function bindSocketEvents(currentSocket: Socket) {
  currentSocket.on('connect', () => {
    const socketId = currentSocket.id
    updateState({
      status: 'connected',
      connectedAt: new Date().toISOString(),
      lastError: null,
      retryCount: 0,
      connectionId: socketId
    })
    emitter.emit('log', { level: 'info', message: `[ws] connected (id: ${socketId})` })
    emitClientInfo()
    startHeartbeatLoop()
  })

  currentSocket.on('disconnect', (reason) => {
    emitter.emit('log', { level: 'warn', message: `[ws] disconnected: ${reason}` })
    stopHeartbeat()
    updateState({
      status: intentionalDisconnect ? 'disconnected' : 'error',
      lastError: reason || null,
      connectedAt: null,
      connectionId: null
    })
  })

  currentSocket.on('pong', () => {
    clearHeartbeatTimeout()
    const now = Date.now()
    updateState({
      status: 'connected',
      lastPongAt: new Date(now).toISOString(),
      lastLatencyMs: lastPingTimestamp ? now - lastPingTimestamp : null,
      lastError: null
    })
    lastPingTimestamp = null
  })

  currentSocket.on('connect_error', (error) => {
    emitter.emit('log', { level: 'error', message: `[ws] connect_error: ${serializeError(error)}` })
    updateState({
      status: 'error',
      lastError: serializeError(error)
    })
  })

  currentSocket.on('error', (error) => {
    emitter.emit('log', { level: 'error', message: `[ws] error: ${serializeError(error)}` })
    updateState({
      status: 'error',
      lastError: serializeError(error)
    })
  })

  currentSocket.io.on('reconnect_attempt', (attempt) => {
    emitter.emit('log', { level: 'info', message: `[ws] reconnect attempt #${attempt}` })
    updateState({
      status: 'reconnecting',
      retryCount: attempt
    })
  })

  currentSocket.io.on('reconnect_failed', () => {
    emitter.emit('log', { level: 'error', message: '[ws] reconnect failed' })
    updateState({
      status: 'error',
      lastError: 'Reconnect failed'
    })
  })

  currentSocket.io.on('reconnect_error', (error) => {
    emitter.emit('log', { level: 'error', message: `[ws] reconnect_error: ${serializeError(error)}` })
    updateState({
      status: 'error',
      lastError: serializeError(error)
    })
  })

  // 监听客户端连接状态响应
  currentSocket.on('my-client-status', (data: { hasClient: boolean }) => {
    emitter.emit('myClientStatus', { hasClient: data.hasClient })
  })
}

// 检查当前用户的客户端连接状态（通过 WebSocket）
export function checkMyClientStatus() {
  if (!socket || !socket.connected) {
    return false
  }
  socket.emit('check-my-client')
  return true
}

function serializeError(error: unknown) {
  if (!error) return 'Unknown error'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

function emitClientInfo() {
  if (!socket || !socket.connected) return
  socket.emit('client-info', { ...clientInfo })
}

function connect(endpoint?: string) {
  const targetEndpoint = endpoint || wsState.endpoint || DEFAULT_WS_ENDPOINT
  wsState.endpoint = targetEndpoint

  if (socket && socket.connected) {
    return
  }

  cleanupSocket()
  intentionalDisconnect = false

  updateState({
    status: 'connecting',
    lastError: null,
    retryCount: 0
  })

  socket = io(targetEndpoint, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 12_000,
    timeout: 8000,
    query: buildQuery(),
    auth: {
      token: getAccessToken() || undefined
    }
  })

  bindSocketEvents(socket)
}

function disconnect() {
  intentionalDisconnect = true
  cleanupSocket()
  updateState({
    status: 'disconnected',
    lastError: null,
    retryCount: 0,
    connectedAt: null,
    connectionId: null
  })
}

function reconnect() {
  intentionalDisconnect = false
  cleanupSocket()
  connect()
}

function setEndpoint(endpoint: string) {
  wsState.endpoint = endpoint || DEFAULT_WS_ENDPOINT
  reconnect()
}

function updateClientInfo(payload: Partial<ClientInfoPayload>) {
  Object.assign(clientInfo, payload)
  emitClientInfo()
}

export const websocketClient = {
  state: wsState,
  profile: clientInfo,
  connect,
  disconnect,
  reconnect,
  setEndpoint,
  updateClientInfo,
  checkMyClientStatus,
  events: emitter
}

