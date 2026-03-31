import { computed, readonly, ref } from 'vue'
import { getMyWebsocketConnectionViews, type WebsocketConnectionVO } from '@/api/system/websocket'
import {
  websocketClient,
  type ClientConnectionChangedEvent,
  type PsAutomationStatusEvent,
  type ServiceRuntimeEvent
} from '@/services/websocketClient'

const clients = ref<WebsocketConnectionVO[]>([])
const loading = ref(false)
let initialized = false
let refreshTimer: ReturnType<typeof setTimeout> | null = null

const normalizePluginKey = (value?: string | null) => {
  const normalized = String(value || '').trim()
  if (!normalized) return ''
  const aliasMap: Record<string, string> = {
    photoshop: 'ps-automation',
    uploader: 'browser-automation',
    browser: 'browser-automation'
  }
  return aliasMap[normalized] || normalized
}

const replaceClient = (clientId: string, updater: (previous?: WebsocketConnectionVO) => WebsocketConnectionVO) => {
  const index = clients.value.findIndex((item) => item.id === clientId)
  if (index >= 0) {
    const next = [...clients.value]
    next[index] = updater(next[index])
    clients.value = next
    return
  }
  clients.value = [updater(undefined), ...clients.value]
}

const refresh = async () => {
  loading.value = true
  try {
    const response = await getMyWebsocketConnectionViews()
    clients.value = Array.isArray(response) ? response : []
  } finally {
    loading.value = false
  }
}

const scheduleRefresh = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
  }
  refreshTimer = setTimeout(() => {
    refreshTimer = null
    void refresh()
  }, 120)
}

const handleServiceRuntime = (event: ServiceRuntimeEvent) => {
  const pluginKey = normalizePluginKey(event.pluginKey || event.service)
  if (!pluginKey || !event.clientId) {
    scheduleRefresh()
    return
  }

  replaceClient(event.clientId, (previous) => ({
    ...(previous || {
      id: event.clientId,
      namespace: '/ws',
      connectedAt: event.reportedAt || null,
      isOnline: true,
      nodeStatus: 'online'
    }),
    clientInfo: {
      ...(previous?.clientInfo || {}),
      services: {
        ...(previous?.clientInfo?.services || {}),
        [pluginKey]: {
          ...(previous?.clientInfo?.services?.[pluginKey] || {}),
          ...(event.runtime || {})
        }
      }
    }
  }) as WebsocketConnectionVO)
}

const handleClientConnectionChanged = (event: ClientConnectionChangedEvent) => {
  const clientId = event.client?.clientId
  if (!clientId) {
    scheduleRefresh()
    return
  }

  if (event.action === 'removed') {
    replaceClient(clientId, (previous) => ({
      ...(previous || {
        id: clientId,
        namespace: '/ws',
        connectedAt: event.client.connectedAt || event.reportedAt || null
      }),
      isOnline: false,
      nodeStatus: 'offline'
    }) as WebsocketConnectionVO)
    return
  }

  replaceClient(clientId, (previous) => ({
    ...(previous || {
      id: clientId,
      namespace: '/ws',
      connectedAt: event.client.connectedAt || event.reportedAt || null
    }),
    connectedAt: event.client.connectedAt || previous?.connectedAt || null,
    isOnline: true,
    nodeStatus: 'online',
    clientInfo: {
      ...(previous?.clientInfo || {}),
      appVersion: event.client.appVersion ?? previous?.clientInfo?.appVersion,
      machine: event.client.machine ?? previous?.clientInfo?.machine,
      location: event.client.location ?? previous?.clientInfo?.location,
      services: {
        ...(previous?.clientInfo?.services || {}),
        ...(event.client.services || {})
      },
      psAutomation: event.client.psAutomation ?? previous?.clientInfo?.psAutomation
    }
  }) as WebsocketConnectionVO)
}

const handlePsAutomationStatus = (event: PsAutomationStatusEvent) => {
  if (!event.clientId) {
    scheduleRefresh()
    return
  }

  replaceClient(event.clientId, (previous) => ({
    ...(previous || {
      id: event.clientId,
      namespace: '/ws',
      connectedAt: event.updatedAt || null,
      isOnline: true,
      nodeStatus: 'online'
    }),
    clientInfo: {
      ...(previous?.clientInfo || {}),
      psAutomation: {
        ...(previous?.clientInfo?.psAutomation || {}),
        ...event
      }
    }
  }) as WebsocketConnectionVO)
}

const ensureInitialized = () => {
  if (initialized) return
  initialized = true
  websocketClient.events.on('serviceRuntime', handleServiceRuntime)
  websocketClient.events.on('clientConnectionChanged', handleClientConnectionChanged)
  websocketClient.events.on('psAutomationStatus', handlePsAutomationStatus)
  void refresh()
}

export function useClientNodeState() {
  ensureInitialized()

  const onlineClients = computed(() => clients.value.filter((item) => item.isOnline))

  return {
    clients: readonly(clients),
    onlineClients,
    loading: readonly(loading),
    refresh
  }
}
