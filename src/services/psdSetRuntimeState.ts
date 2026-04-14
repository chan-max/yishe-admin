import { computed, readonly, ref } from 'vue'
import {
  stickerPsdSetApi,
  type ActivePsdSetSummaryItem,
  type ActivePsdSetSummaryResponse,
} from '@/api/stickerPsdSet'
import { getUserSetting } from '@/api/user'
import { websocketClient, type PsAutomationStatusEvent } from '@/services/websocketClient'

const userAutoSchedulingEnabled = ref(false)
const settingLoaded = ref(false)
const activeSummaryLoaded = ref(false)
const activePsdSets = ref<ActivePsdSetSummaryItem[]>([])
const activePsdSetIds = ref<string[]>([])
let initialized = false
let activeSummaryRefreshPromise: Promise<void> | null = null
let activeSummaryPollingTimer: ReturnType<typeof setInterval> | null = null
let activeSummaryRefreshTimer: ReturnType<typeof setTimeout> | null = null

const ACTIVE_PSD_SET_POLLING_MS = 5000

const normalizePsdSetId = (value: unknown) => String(value || '').trim()

const getResponseData = <T = any>(response: any): T => {
  return response?.data?.data || response?.data || response || ({} as T)
}

const normalizeActivePsdSetItem = (item: any): ActivePsdSetSummaryItem | null => {
  const id = normalizePsdSetId(item?.id)
  if (!id) {
    return null
  }

  return {
    id,
    name: String(item?.name || '').trim() || null,
    status: String(item?.status || '').trim() || null,
    schedulerStatus: String(item?.schedulerStatus || '').trim() || null,
    assignedClientId: String(item?.assignedClientId || '').trim() || null,
    assignedMachineCode: String(item?.assignedMachineCode || '').trim() || null,
    updateTime: item?.updateTime || null,
  }
}

const syncActiveSummaryPolling = () => {
  const shouldPoll = activePsdSetIds.value.length > 0 || activePsdSets.value.length > 0
  if (!shouldPoll) {
    if (activeSummaryPollingTimer) {
      clearInterval(activeSummaryPollingTimer)
      activeSummaryPollingTimer = null
    }
    return
  }

  if (activeSummaryPollingTimer) {
    return
  }

  activeSummaryPollingTimer = setInterval(() => {
    void refreshActiveSummary(true)
  }, ACTIVE_PSD_SET_POLLING_MS)
}

const applyActiveSummary = (payload?: Partial<ActivePsdSetSummaryResponse> | null) => {
  const source = Array.isArray(payload?.items) ? payload?.items : []
  const nextItems = source
    .map((item) => normalizeActivePsdSetItem(item))
    .filter((item): item is ActivePsdSetSummaryItem => !!item)
  const nextIds = nextItems.map((item) => item.id)

  activePsdSets.value = nextItems
  activePsdSetIds.value = nextIds
  activeSummaryLoaded.value = true
  syncActiveSummaryPolling()
}

const refreshUserAutoScheduling = async () => {
  try {
    const response: any = await getUserSetting({ key: 'psAutomation' })
    const data = getResponseData(response)
    userAutoSchedulingEnabled.value = !!data?.autoSchedulingEnabled
  } catch {
    userAutoSchedulingEnabled.value = false
  } finally {
    settingLoaded.value = true
  }
}

const refreshActiveSummary = async (silent = false) => {
  if (activeSummaryRefreshPromise) {
    return activeSummaryRefreshPromise
  }

  activeSummaryRefreshPromise = (async () => {
    try {
      const response = await stickerPsdSetApi.getActiveSummary()
      applyActiveSummary(getResponseData(response))
    } catch {
      if (!silent) {
        applyActiveSummary({ items: [] })
      }
    } finally {
      activeSummaryLoaded.value = true
      activeSummaryRefreshPromise = null
    }
  })()

  return activeSummaryRefreshPromise
}

const scheduleActiveSummaryRefresh = (delay = 160) => {
  if (activeSummaryRefreshTimer) {
    clearTimeout(activeSummaryRefreshTimer)
  }

  activeSummaryRefreshTimer = setTimeout(() => {
    activeSummaryRefreshTimer = null
    void refreshActiveSummary(true)
  }, delay)
}

const handlePsAutomationStatus = (event: PsAutomationStatusEvent) => {
  const autoSchedulingEnabled =
    typeof event?.autoDispatchEnabled === 'boolean'
      ? event.autoDispatchEnabled
      : event?.autoSchedulingEnabled

  if (typeof autoSchedulingEnabled === 'boolean') {
    userAutoSchedulingEnabled.value = autoSchedulingEnabled
  }
}

const handleProductionStatus = (event: {
  psdSetId?: string
  status?: string
}) => {
  const psdSetId = normalizePsdSetId(event?.psdSetId)
  const status = String(event?.status || '').trim().toLowerCase()

  if (status === 'processing' || status === 'running' || status === 'assigned') {
    if (psdSetId && !activePsdSetIds.value.includes(psdSetId)) {
      activePsdSetIds.value = Array.from(new Set([...activePsdSetIds.value, psdSetId]))
      syncActiveSummaryPolling()
    }
    scheduleActiveSummaryRefresh(140)
    return
  }

  if (
    status === 'completed' ||
    status === 'failed' ||
    status === 'pending' ||
    status === 'timeout'
  ) {
    if (psdSetId) {
      activePsdSetIds.value = activePsdSetIds.value.filter((id) => id !== psdSetId)
      activePsdSets.value = activePsdSets.value.filter((item) => item.id !== psdSetId)
      syncActiveSummaryPolling()
    }
    scheduleActiveSummaryRefresh(240)
  }
}

const ensureInitialized = () => {
  if (initialized) return
  initialized = true
  websocketClient.events.on('psAutomationStatus', handlePsAutomationStatus)
  websocketClient.events.on('production-status', handleProductionStatus)
  void refreshUserAutoScheduling()
  void refreshActiveSummary(true)
}

export function usePsdSetRuntimeState() {
  ensureInitialized()

  const activePsdSetNames = computed(() =>
    activePsdSets.value
      .map((item) => String(item?.name || '').trim())
      .filter((item) => !!item),
  )
  const activePsdSetCount = computed(() =>
    Math.max(activePsdSetIds.value.length, activePsdSets.value.length),
  )
  const activePsdSetClientIds = computed(() =>
    Array.from(
      new Set(
        activePsdSets.value
          .map((item) => String(item?.assignedClientId || '').trim())
          .filter((item) => !!item),
      ),
    ),
  )
  const isAnyPsdSetProcessing = computed(() => activePsdSetCount.value > 0)
  const processingTooltipText = computed(() => {
    if (!isAnyPsdSetProcessing.value) {
      return userAutoSchedulingEnabled.value ? '自动处理已开启' : '自动处理未开启'
    }

    if (activePsdSetNames.value.length > 0) {
      return `正在制作：${activePsdSetNames.value.join('，')}`
    }

    return '当前有套图正在制作'
  })

  const refresh = async () => {
    await Promise.all([refreshActiveSummary(), refreshUserAutoScheduling()])
  }

  const setUserAutoSchedulingEnabled = (enabled: boolean) => {
    userAutoSchedulingEnabled.value = enabled
  }

  return {
    userAutoSchedulingEnabled: readonly(userAutoSchedulingEnabled),
    settingLoaded: readonly(settingLoaded),
    activeSummaryLoaded: readonly(activeSummaryLoaded),
    activePsdSets: readonly(activePsdSets),
    activePsdSetNames,
    activePsdSetCount,
    activePsdSetClientIds,
    isAnyPsdSetProcessing,
    processingTooltipText,
    refresh,
    refreshActiveSummary,
    refreshUserAutoScheduling,
    setUserAutoSchedulingEnabled
  }
}
