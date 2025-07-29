/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-09 19:04:50
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-16 20:30:58
 * @FilePath: /design-server/Users/jackie/workspace/yishe-admin/src/stores/connectionStatus.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ref } from 'vue'

// 本地客户端连接状态
export const isLocalConnected = ref(false)

// 远程服务连接状态
export const isRemoteConnected = ref(false)

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
let lastRemoteCheck = 0
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
    const response = await fetch('http://localhost:1519')
    isLocalConnected.value = response.ok
  } catch (error) {
    isLocalConnected.value = false
  }
}

// 检查远程服务连接（带节流）
export const checkRemoteConnection = async () => {
  // 检查是否需要节流
  if (!throttle(lastRemoteCheck, THROTTLE_DELAY)) {
    return
  }
  
  lastRemoteCheck = Date.now()
  
  try {
    const response = await fetch('https://1s.design:1520/api/test')
    isRemoteConnected.value = response.ok
  } catch (error) {
    isRemoteConnected.value = false
  }
}

// 启动所有连接检查
export const startConnectionChecks = () => {
  // 初始化时立即检查一次
  checkLocalConnection()
  checkRemoteConnection()
  
  const localTimer = window.setInterval(checkLocalConnection, 5000)
  const remoteTimer = window.setInterval(checkRemoteConnection, 10000)

  return {
    localTimer,
    remoteTimer
  }
}

// 清理所有定时器
export const clearConnectionChecks = (timers: { localTimer: number, remoteTimer: number }) => {
  if (timers.localTimer) {
    window.clearInterval(timers.localTimer)
  }
  if (timers.remoteTimer) {
    window.clearInterval(timers.remoteTimer)
  }
} 