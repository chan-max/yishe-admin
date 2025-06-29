import { ref } from 'vue'

// 本地客户端连接状态
export const isLocalConnected = ref(false)

// 远程服务连接状态
export const isRemoteConnected = ref(false)

// 检查本地客户端连接
export const checkLocalConnection = async () => {
  try {
    const response = await fetch('http://localhost:1519')
    isLocalConnected.value = response.ok
  } catch (error) {
    isLocalConnected.value = false
  }
}

// 检查远程服务连接
export const checkRemoteConnection = async () => {
  try {
    const response = await fetch('https://1s.design:1520/api/test')
    isRemoteConnected.value = response.ok
  } catch (error) {
    isRemoteConnected.value = false
  }
}

// 启动所有连接检查
export const startConnectionChecks = () => {
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