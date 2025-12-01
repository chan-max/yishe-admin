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

// 节流相关状态
let lastLocalCheck = 0
const THROTTLE_DELAY = 5000 // 5秒节流

// 节流函数
const throttle = (lastCheck: number, delay: number) => {
  const now = Date.now()
  return now - lastCheck >= delay
}

// 检查本地客户端连接（带节流）
export const checkLocalConnection = async () => {
  // 检查是否需要节流
  if (!throttle(lastLocalCheck, THROTTLE_DELAY)) {
    return
  }
  
  lastLocalCheck = Date.now()
  
  try {
    const response = await fetch('http://localhost:1519/api/health')
    isLocalConnected.value = response.ok
  } catch (error) {
    isLocalConnected.value = false
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
}

// 启动所有连接检查（不包含 WebSocket，WebSocket 需要在用户登录后单独启动）
export const startConnectionChecks = () => {
  // 初始化时立即检查一次
  checkLocalConnection()
  
  const localTimer = window.setInterval(checkLocalConnection, 5000)

  return {
    localTimer,
    remoteTimer: 0 // 不再需要远程定时器，使用 WebSocket 状态
  }
}

// 清理所有定时器
export const clearConnectionChecks = (timers: { localTimer: number, remoteTimer: number }) => {
  if (timers.localTimer) {
    window.clearInterval(timers.localTimer)
  }
  // remoteTimer 不再需要清理
} 