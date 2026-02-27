/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-09 19:04:50
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-16 20:30:58
 * @FilePath: /yishe-admin/src/stores/connectionStatus.ts
 * @Description: 管理与本地客户端和远程服务的连接状态
 */
import { ref, computed } from 'vue'
import { websocketClient } from '@/services/websocketClient'
import { getAccessToken } from '@/utils/auth'
import { isClientAuthorized as checkClientAuthApi } from '@/api/user'

// 本地客户端连接状态
export const isLocalConnected = ref(false)
export const setLocalConnected = (val: boolean) => {
  isLocalConnected.value = val
}

// 远程服务连接状态（通过 WebSocket 连接状态判断）
export const isRemoteConnected = computed(() => {
  return websocketClient.state.status === 'connected'
})

// 客户端授权状态
export const isClientAuthorized = ref(false)
export const setClientAuthorized = (val: boolean) => {
  isClientAuthorized.value = val
}

export const checkClientAuthorized = async () => {
  try {
    const authorized = await checkClientAuthApi()
    setClientAuthorized(authorized)
  } catch {
    setClientAuthorized(false)
  }
}

// 检查客户端连接状态
let checkClientConnectionTimer: ReturnType<typeof setInterval> | null = null

// 通过 WebSocket 检查客户端连接状态
export const checkClientConnection = () => {
  if (websocketClient.state.status !== 'connected') {
    setLocalConnected(false)
    return
  }
  websocketClient.checkMyClientStatus()
}

// 启动客户端连接状态检查
const startClientConnectionCheck = () => {
  if (checkClientConnectionTimer) {
    clearInterval(checkClientConnectionTimer)
  }
  checkClientConnection()
  checkClientConnectionTimer = setInterval(checkClientConnection, 5000)
}

// 停止客户端连接状态检查
const stopClientConnectionCheck = () => {
  if (checkClientConnectionTimer) {
    clearInterval(checkClientConnectionTimer)
    checkClientConnectionTimer = null
  }
  setLocalConnected(false)
}

// 监听 WebSocket 状态变化
let statusWatcher: ReturnType<typeof setInterval> | null = null

const watchWebSocketStatus = () => {
  if (statusWatcher) {
    clearInterval(statusWatcher)
  }

  statusWatcher = setInterval(() => {
    const status = websocketClient.state.status
    if (status === 'connected') {
      if (!checkClientConnectionTimer) {
        startClientConnectionCheck()
      }
    } else {
      stopClientConnectionCheck()
    }
  }, 1000)

  if (websocketClient.state.status === 'connected') {
    startClientConnectionCheck()
  } else {
    stopClientConnectionCheck()
  }
}

// 启动 WebSocket 连接
export const startWebSocketConnection = () => {
  const token = getAccessToken()
  if (!token) {
    console.warn('[ws] 无 token，跳过 WebSocket 连接')
    return
  }

  if (websocketClient.state.status === 'idle' || websocketClient.state.status === 'disconnected') {
    console.log('[ws] 启动 WebSocket 连接...')
    websocketClient.connect()
  }

  websocketClient.events.on('myClientStatus', ({ hasClient }) => {
    setLocalConnected(hasClient)
  })

  watchWebSocketStatus()
}

// 启动所有连接检查
export const startConnectionChecks = () => {
  return {
    localTimer: 0,
    remoteTimer: 0
  }
}

// 清理所有定时器
export const clearConnectionChecks = (timers: { localTimer: number, remoteTimer: number }) => {
  stopClientConnectionCheck()
  if (statusWatcher) {
    clearInterval(statusWatcher)
    statusWatcher = null
  }
}