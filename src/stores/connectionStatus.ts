import { computed, ref } from 'vue'
import { websocketClient } from '@/services/websocketClient'
import { getAccessToken } from '@/utils/auth'
import { isClientAuthorized as checkClientAuthApi } from '@/api/user'
import { getMyWebsocketConnectionViews, type WebsocketConnectionVO } from '@/api/system/websocket'

export const myClients = ref<WebsocketConnectionVO[]>([])
export const clientRefreshLoading = ref(false)
export const lastClientRefreshAt = ref<string | null>(null)

export const isLocalConnected = computed(() => myClients.value.some((client) => client.isOnline))

export const setMyClients = (clients: WebsocketConnectionVO[]) => {
  myClients.value = clients
  lastClientRefreshAt.value = new Date().toISOString()
}

export const isRemoteConnected = computed(() => websocketClient.state.status === 'connected')

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

export const refreshMyClients = async () => {
  if (websocketClient.state.status !== 'connected') {
    setMyClients([])
    return []
  }

  clientRefreshLoading.value = true
  try {
    const response = await getMyWebsocketConnectionViews()
    const clients = Array.isArray(response)
      ? response
      : response && typeof response === 'object' && Array.isArray((response as any).data)
        ? (response as any).data
        : []
    setMyClients(clients)
    return clients
  } catch (error) {
    setMyClients([])
    return []
  } finally {
    clientRefreshLoading.value = false
  }
}

let checkClientConnectionTimer: ReturnType<typeof setInterval> | null = null
let statusWatcher: ReturnType<typeof setInterval> | null = null

const startClientConnectionCheck = () => {
  if (checkClientConnectionTimer) {
    clearInterval(checkClientConnectionTimer)
  }
  void refreshMyClients()
  checkClientConnectionTimer = setInterval(() => {
    void refreshMyClients()
  }, 5000)
}

const stopClientConnectionCheck = () => {
  if (checkClientConnectionTimer) {
    clearInterval(checkClientConnectionTimer)
    checkClientConnectionTimer = null
  }
  setMyClients([])
}

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
      return
    }
    stopClientConnectionCheck()
  }, 1000)

  if (websocketClient.state.status === 'connected') {
    startClientConnectionCheck()
  } else {
    stopClientConnectionCheck()
  }
}

export const startWebSocketConnection = () => {
  const token = getAccessToken()
  if (!token) {
    return
  }

  if (websocketClient.state.status === 'idle' || websocketClient.state.status === 'disconnected') {
    websocketClient.connect()
  }

  watchWebSocketStatus()
}

export const startConnectionChecks = () => {
  startWebSocketConnection()
  return {
    localTimer: 0,
    remoteTimer: 0
  }
}

export const clearConnectionChecks = (_timers: { localTimer: number; remoteTimer: number }) => {
  stopClientConnectionCheck()
  if (statusWatcher) {
    clearInterval(statusWatcher)
    statusWatcher = null
  }
}
