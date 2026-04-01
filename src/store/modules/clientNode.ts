import { computed, ref } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { getMyWebsocketConnectionViews, type WebsocketConnectionVO } from '@/api/system/websocket'
import {
  websocketClient,
  type ClientConnectionChangedEvent,
  type PsAutomationStatusEvent,
  type ServiceRuntimeEvent
} from '@/services/websocketClient'

export type ClientPluginKey = 'browser-automation' | 'ps-automation' | 'google-art'
export type ClientPluginSummary = 'available' | 'degraded' | 'offline'

const listenersBound = ref(false)

export const normalizeClientPluginKey = (value?: string | null) => {
  const normalized = String(value || '').trim()
  if (!normalized) return ''
  const aliasMap: Record<string, ClientPluginKey> = {
    uploader: 'browser-automation',
    browser: 'browser-automation',
    photoshop: 'ps-automation'
  }
  return aliasMap[normalized] || normalized
}

export const getClientServiceRuntime = (
  client: WebsocketConnectionVO | undefined,
  pluginKey: ClientPluginKey
) => {
  const services = client?.clientInfo?.services || {}
  if (pluginKey === 'browser-automation') {
    return services['browser-automation'] || services.uploader || null
  }
  if (pluginKey === 'ps-automation') {
    return services['ps-automation'] || services.photoshop || null
  }
  return services['google-art'] || services.googleArt || null
}

export const useClientNodeStore = defineStore('client-node', () => {
  const clients = ref<WebsocketConnectionVO[]>([])
  const loading = ref(false)
  const initialized = ref(false)

  const replaceClient = (
    clientId: string,
    updater: (previous?: WebsocketConnectionVO) => WebsocketConnectionVO
  ) => {
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

  const pluginStatusMap = computed<Record<ClientPluginKey, ClientPluginSummary>>(() => {
    const summary: Record<ClientPluginKey, ClientPluginSummary> = {
      'browser-automation': 'offline',
      'ps-automation': 'offline',
      'google-art': 'offline'
    }

    ;(['browser-automation', 'ps-automation', 'google-art'] as ClientPluginKey[]).forEach(
      (pluginKey) => {
        let hasRuntime = false
        let hasAvailable = false

        clients.value.forEach((client) => {
          if (!client.isOnline) return
          const runtime = getClientServiceRuntime(client, pluginKey)
          if (!runtime) return
          hasRuntime = true
          if (runtime.available) {
            hasAvailable = true
          }
        })

        summary[pluginKey] = hasAvailable ? 'available' : hasRuntime ? 'degraded' : 'offline'
      }
    )

    return summary
  })

  const onlineClients = computed(() => clients.value.filter((item) => item.isOnline))

  const getPluginClients = (pluginKey: ClientPluginKey) =>
    onlineClients.value.filter((client) => !!getClientServiceRuntime(client, pluginKey))

  const handleServiceRuntime = (event: ServiceRuntimeEvent) => {
    const pluginKey = normalizeClientPluginKey(event.pluginKey || event.service)
    if (!pluginKey || !event.clientId) return

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
    if (!clientId) return

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
    if (!event.clientId) return
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
    if (initialized.value) return
    initialized.value = true
    if (!listenersBound.value) {
      listenersBound.value = true
      websocketClient.events.on('serviceRuntime', handleServiceRuntime)
      websocketClient.events.on('clientConnectionChanged', handleClientConnectionChanged)
      websocketClient.events.on('psAutomationStatus', handlePsAutomationStatus)
    }
    void refresh()
  }

  return {
    clients,
    onlineClients,
    loading,
    initialized,
    pluginStatusMap,
    refresh,
    ensureInitialized,
    getPluginClients
  }
})

export const useClientNodeStoreRefs = () => {
  const store = useClientNodeStore()
  store.ensureInitialized()
  return {
    store,
    ...storeToRefs(store)
  }
}
