/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-09 19:04:50
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-16 20:30:58
 * @FilePath: /design-server/Users/jackie/workspace/yishe-admin/src/stores/connectionStatus.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ref, computed } from 'vue'
import { websocketClient } from '@/services/websocketClient'
import { getAccessToken } from '@/utils/auth'

// 本地客户端连接状态
export const isLocalConnected = ref(false)
export const setLocalConnected = (val: boolean) => {
  isLocalConnected.value = val
}

// 远程服务连接状态（通过 WebSocket 连接状态判断）
export const isRemoteConnected = computed(() => {
  return websocketClient.state.status === 'connected'
})

// 设计工具连接状态
export const isDesignToolConnected = ref(false)
export const setDesignToolConnected = (val: boolean) => {
  isDesignToolConnected.value = val
}

// 客户端授权状态
export const isClientAuthorized = ref(false)
export const setClientAuthorized = (val: boolean) => {
  isClientAuthorized.value = val
}

import { isClientAuthorized as checkClientAuthApi } from '@/api/user'

export const checkClientAuthorized = async () => {
  try {
    const authorized = await checkClientAuthApi()
    setClientAuthorized(authorized)
  } catch {
    setClientAuthorized(false)
  }
}

// 本地客户端连接状态通过 WebSocket 更新，不再使用 HTTP health check

// 检查客户端连接状态
let checkClientConnectionTimer: ReturnType<typeof setInterval> | null = null

// 判断 IP 是否为本地 IP
const isLocalIP = (ip: string | undefined): boolean => {
  if (!ip) return false
  
  // IPv4 localhost
  if (ip === '127.0.0.1' || ip === 'localhost') return true
  
  // IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return true
  
  // 局域网 IP 段
  // 192.168.x.x
  if (/^192\.168\./.test(ip)) return true
  // 10.x.x.x
  if (/^10\./.test(ip)) return true
  // 172.16.x.x - 172.31.x.x
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true
  
  // 检查是否与当前页面同源（通过比较 hostname）
  if (typeof window !== 'undefined') {
    try {
      const currentHost = window.location.hostname
      // 如果 IP 对应的 hostname 与当前 hostname 相同，也认为是本地
      // 这里简化处理，如果 IP 是当前页面的 hostname，也认为是本地
      // 实际场景中，本地客户端通常通过 localhost 或 127.0.0.1 连接
    } catch (e) {
      // ignore
    }
  }
  
  return false
}

export const checkClientConnection = async () => {
  try {
    // 只有在 WebSocket 已连接时才检查
    if (websocketClient.state.status !== 'connected') {
      setLocalConnected(false)
      return
    }

    const { getWebsocketConnections } = await import('@/api/system/websocket')
    const connections = await getWebsocketConnections()
    
    // 检查是否有 clientSource 为 '客户端' 且 IP 为本地 IP 的连接
    const hasLocalClient = connections.some(conn => {
      const clientSource = conn.clientSource || conn.query?.clientSource
      if (clientSource !== '客户端') return false
      
      // 检查 IP 是否为本地 IP
      const ip = conn.ip || conn.clientInfo?.location?.ip
      return isLocalIP(ip)
    })
    
    setLocalConnected(hasLocalClient)
  } catch (error) {
    console.error('[connectionStatus] 检查客户端连接失败:', error)
    // 检查失败时，如果 WebSocket 未连接，则设置为 false
    if (websocketClient.state.status !== 'connected') {
      setLocalConnected(false)
    }
  }
}

// 启动客户端连接状态检查
const startClientConnectionCheck = () => {
  // 清理旧的定时器
  if (checkClientConnectionTimer) {
    clearInterval(checkClientConnectionTimer)
  }
  
  // 立即检查一次
  checkClientConnection()
  
  // 每 5 秒检查一次
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
  // 清理旧的监听器
  if (statusWatcher) {
    clearInterval(statusWatcher)
  }
  
  // 每 1 秒检查一次 WebSocket 状态
  statusWatcher = setInterval(() => {
    const status = websocketClient.state.status
    if (status === 'connected') {
      // WebSocket 已连接，启动客户端连接检查
      if (!checkClientConnectionTimer) {
        startClientConnectionCheck()
      }
    } else {
      // WebSocket 未连接，停止客户端连接检查
      stopClientConnectionCheck()
    }
  }, 1000)
  
  // 立即检查一次
  const status = websocketClient.state.status
  if (status === 'connected') {
    startClientConnectionCheck()
  } else {
    stopClientConnectionCheck()
  }
}

// 启动 WebSocket 连接（仅在用户登录后调用）
export const startWebSocketConnection = () => {
  // 检查是否有 token
  const token = getAccessToken()
  if (!token) {
    console.warn('[ws] 无 token，跳过 WebSocket 连接')
    return
  }
  
  // 启动 WebSocket 连接（如果还未连接）
  if (websocketClient.state.status === 'idle' || websocketClient.state.status === 'disconnected') {
    console.log('[ws] 启动 WebSocket 连接...')
    websocketClient.connect()
  }
  
  // 启动状态监听
  watchWebSocketStatus()
}

// 启动所有连接检查（不包含 WebSocket，WebSocket 需要在用户登录后单独启动）
// 本地客户端连接状态通过 WebSocket 更新，不再需要定时器
export const startConnectionChecks = () => {
  // 本地连接状态通过 WebSocket 更新，不再需要 HTTP health check
  return {
    localTimer: 0, // 不再需要本地定时器
    remoteTimer: 0 // 不再需要远程定时器，使用 WebSocket 状态
  }
}

// 清理所有定时器
export const clearConnectionChecks = (timers: { localTimer: number, remoteTimer: number }) => {
  // 清理客户端连接检查定时器
  stopClientConnectionCheck()
  // 清理状态监听器
  if (statusWatcher) {
    clearInterval(statusWatcher)
    statusWatcher = null
  }
} 