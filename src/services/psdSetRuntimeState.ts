import { computed, readonly, ref } from 'vue'
import { getUserSetting } from '@/api/user'
import { useClientNodeState } from '@/services/clientNodeState'
import { websocketClient, type PsAutomationStatusEvent } from '@/services/websocketClient'

const userAutoSchedulingEnabled = ref(false)
const settingLoaded = ref(false)
let initialized = false

const normalizePhotoshopService = (client: any) =>
  client?.clientInfo?.services?.['ps-automation'] || client?.clientInfo?.services?.photoshop || null

const isClientProcessingPsdSet = (client: any) => {
  const psAutomation = client?.clientInfo?.psAutomation || {}
  const service = normalizePhotoshopService(client)
  return !!(
    psAutomation?.running ||
    psAutomation?.currentPsSetId ||
    psAutomation?.currentPsSetName ||
    service?.busy ||
    service?.state === 'busy'
  )
}

const refreshUserAutoScheduling = async () => {
  try {
    const response: any = await getUserSetting({ key: 'psAutomation' })
    const data = response?.data || response || {}
    userAutoSchedulingEnabled.value = !!data?.autoSchedulingEnabled
  } catch {
    userAutoSchedulingEnabled.value = false
  } finally {
    settingLoaded.value = true
  }
}

const handlePsAutomationStatus = (event: PsAutomationStatusEvent) => {
  if (typeof event?.autoSchedulingEnabled === 'boolean') {
    userAutoSchedulingEnabled.value = event.autoSchedulingEnabled
  }
}

const ensureInitialized = () => {
  if (initialized) return
  initialized = true
  websocketClient.events.on('psAutomationStatus', handlePsAutomationStatus)
  void refreshUserAutoScheduling()
}

export function usePsdSetRuntimeState() {
  ensureInitialized()

  const { clients, refresh: refreshClients } = useClientNodeState()
  const processingClients = computed(() => clients.value.filter((item) => isClientProcessingPsdSet(item)))
  const isAnyPsdSetProcessing = computed(() => processingClients.value.length > 0)

  const refresh = async () => {
    await Promise.all([refreshClients(), refreshUserAutoScheduling()])
  }

  const setUserAutoSchedulingEnabled = (enabled: boolean) => {
    userAutoSchedulingEnabled.value = enabled
  }

  return {
    userAutoSchedulingEnabled: readonly(userAutoSchedulingEnabled),
    settingLoaded: readonly(settingLoaded),
    processingClients,
    isAnyPsdSetProcessing,
    refresh,
    refreshUserAutoScheduling,
    setUserAutoSchedulingEnabled
  }
}
