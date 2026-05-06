import { computed, readonly, ref } from 'vue'
import {
  stickerPsdSetApi,
  type ActivePsdSetSummaryItem,
  type ActivePsdSetSummaryResponse,
} from '@/api/stickerPsdSet'
import { getUserSetting } from '@/api/user'
import { websocketClient, type PsAutomationStatusEvent } from '@/services/websocketClient'

type RealtimeActivePsdSetSummaryItem = ActivePsdSetSummaryItem & {
  runtimeExpiresAt: number
}

const userAutoSchedulingEnabled = ref(false)
const settingLoaded = ref(false)
const activeSummaryLoaded = ref(false)
const serverActivePsdSets = ref<ActivePsdSetSummaryItem[]>([])
const realtimeActivePsdSetMap = ref<Record<string, RealtimeActivePsdSetSummaryItem>>({})
const activePsdSets = ref<ActivePsdSetSummaryItem[]>([])
const activePsdSetIds = ref<string[]>([])
let initialized = false
let activeSummaryRefreshPromise: Promise<void> | null = null
let activeSummaryPollingTimer: ReturnType<typeof setInterval> | null = null
let activeSummaryPollingMs = 0
let activeSummaryRefreshTimer: ReturnType<typeof setTimeout> | null = null

const ACTIVE_PSD_SET_POLLING_MS = 5000
const IDLE_PSD_SET_POLLING_MS = 3000
const REALTIME_ACTIVE_PSD_SET_TTL_MS = 10 * 60 * 1000

const normalizePsdSetId = (value: unknown) => String(value || '').trim()
const normalizeRuntimeTime = (value: unknown) => String(value || '').trim() || new Date().toISOString()

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
    statusMessage: String(item?.statusMessage || '').trim() || null,
    currentStep: String(item?.currentStep || '').trim() || null,
    progress: typeof item?.progress === 'number' ? item.progress : null,
    assignedClientId: String(item?.assignedClientId || '').trim() || null,
    assignedMachineCode: String(item?.assignedMachineCode || '').trim() || null,
    updateTime: item?.updateTime || null,
  }
}

const syncActiveSummaryPolling = () => {
  const nextPollingMs =
    activePsdSetIds.value.length > 0 || activePsdSets.value.length > 0
      ? ACTIVE_PSD_SET_POLLING_MS
      : IDLE_PSD_SET_POLLING_MS

  if (activeSummaryPollingTimer && activeSummaryPollingMs === nextPollingMs) {
    return
  }

  if (activeSummaryPollingTimer) {
    clearInterval(activeSummaryPollingTimer)
    activeSummaryPollingTimer = null
  }

  activeSummaryPollingMs = nextPollingMs
  activeSummaryPollingTimer = setInterval(() => {
    void refreshActiveSummary(true)
  }, nextPollingMs)
}

const syncMergedActiveSummary = () => {
  const now = Date.now()
  const realtimeItems = Object.values(realtimeActivePsdSetMap.value).filter(
    (item) => item.runtimeExpiresAt > now,
  )
  if (realtimeItems.length !== Object.keys(realtimeActivePsdSetMap.value).length) {
    realtimeActivePsdSetMap.value = realtimeItems.reduce(
      (result, item) => {
        result[item.id] = item
        return result
      },
      {} as Record<string, RealtimeActivePsdSetSummaryItem>,
    )
  }

  const mergedMap = new Map<string, ActivePsdSetSummaryItem>()
  serverActivePsdSets.value.forEach((item) => {
    if (item?.id) {
      mergedMap.set(item.id, item)
    }
  })
  realtimeItems.forEach((item) => {
    if (item?.id) {
      const runtimeItem: ActivePsdSetSummaryItem = {
        id: item.id,
        name: item.name,
        status: item.status,
        schedulerStatus: item.schedulerStatus,
        statusMessage: item.statusMessage,
        currentStep: item.currentStep,
        progress: item.progress,
        assignedClientId: item.assignedClientId,
        assignedMachineCode: item.assignedMachineCode,
        updateTime: item.updateTime,
      }
      mergedMap.set(item.id, {
        ...(mergedMap.get(item.id) || {}),
        ...runtimeItem,
      })
    }
  })

  const nextItems = Array.from(mergedMap.values())
  const nextIds = nextItems.map((item) => item.id)

  activePsdSets.value = nextItems
  activePsdSetIds.value = nextIds
  activeSummaryLoaded.value = true
  syncActiveSummaryPolling()
}

const applyActiveSummary = (payload?: Partial<ActivePsdSetSummaryResponse> | null) => {
  const hasServerItems = Array.isArray(payload?.items)
  const source = hasServerItems ? payload?.items : []
  serverActivePsdSets.value = source
    .map((item) => normalizeActivePsdSetItem(item))
    .filter((item): item is ActivePsdSetSummaryItem => !!item)
  syncMergedActiveSummary()
}

const upsertRealtimeActivePsdSet = (
  psdSetId: string,
  patch: Partial<ActivePsdSetSummaryItem> = {},
) => {
  const id = normalizePsdSetId(psdSetId)
  if (!id) return
  const previous = realtimeActivePsdSetMap.value[id]
  realtimeActivePsdSetMap.value = {
    ...realtimeActivePsdSetMap.value,
    [id]: {
      id,
      name: patch.name ?? previous?.name ?? null,
      status: patch.status ?? previous?.status ?? 'processing',
      schedulerStatus: patch.schedulerStatus ?? previous?.schedulerStatus ?? 'running',
      statusMessage: patch.statusMessage ?? previous?.statusMessage ?? null,
      currentStep: patch.currentStep ?? previous?.currentStep ?? null,
      progress: patch.progress ?? previous?.progress ?? null,
      assignedClientId: patch.assignedClientId ?? previous?.assignedClientId ?? null,
      assignedMachineCode: patch.assignedMachineCode ?? previous?.assignedMachineCode ?? null,
      updateTime: patch.updateTime ?? previous?.updateTime ?? new Date().toISOString(),
      runtimeExpiresAt: Date.now() + REALTIME_ACTIVE_PSD_SET_TTL_MS,
    },
  }
  syncMergedActiveSummary()
}

const removeRealtimeActivePsdSet = (psdSetId: string) => {
  const id = normalizePsdSetId(psdSetId)
  if (!id || !realtimeActivePsdSetMap.value[id]) return
  const nextMap = { ...realtimeActivePsdSetMap.value }
  delete nextMap[id]
  realtimeActivePsdSetMap.value = nextMap
  syncMergedActiveSummary()
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
  if (typeof event?.autoSchedulingEnabled === 'boolean') {
    userAutoSchedulingEnabled.value = event.autoSchedulingEnabled
  }

  const psdSetId = normalizePsdSetId(event?.currentPsSetId)
  if (event?.running && psdSetId) {
    upsertRealtimeActivePsdSet(psdSetId, {
      name: String(event.currentPsSetName || '').trim() || null,
      status: 'processing',
      schedulerStatus: 'running',
      statusMessage: String(event.currentStep || '').trim() || null,
      currentStep: String(event.currentStep || '').trim() || null,
      progress: typeof event.progress === 'number' ? event.progress : null,
      assignedClientId: String(event.clientId || '').trim() || null,
      updateTime: normalizeRuntimeTime(event.lastHeartbeatAt || event.updatedAt),
    })
    scheduleActiveSummaryRefresh(80)
    return
  }

  if (!event?.running && psdSetId) {
    removeRealtimeActivePsdSet(psdSetId)
    scheduleActiveSummaryRefresh(180)
  }
}

const handleProductionStatus = (event: {
  psdSetId?: string
  status?: string
  clientId?: string
  machineCode?: string
  assignedClientId?: string | null
  assignedMachineCode?: string | null
  message?: string | null
  currentStep?: string | null
  progress?: number | null
  total?: number | null
}) => {
  const psdSetId = normalizePsdSetId(event?.psdSetId)
  const status = String(event?.status || '').trim().toLowerCase()

  if (status === 'processing' || status === 'running' || status === 'assigned') {
    if (psdSetId) {
      const progress =
        typeof event.progress === 'number'
          ? typeof event.total === 'number' && event.total > 0
            ? Math.max(0, Math.min(100, Math.round((event.progress / event.total) * 100)))
            : Math.max(0, Math.min(100, event.progress))
          : null
      const statusMessage =
        String(event.currentStep || '').trim() || String(event.message || '').trim() || null
      upsertRealtimeActivePsdSet(psdSetId, {
        status: 'processing',
        schedulerStatus: 'running',
        statusMessage,
        currentStep: statusMessage,
        progress,
        assignedClientId: String(event.assignedClientId || event.clientId || '').trim() || null,
        assignedMachineCode:
          String(event.assignedMachineCode || event.machineCode || '').trim() || null,
        updateTime: new Date().toISOString(),
      })
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
      removeRealtimeActivePsdSet(psdSetId)
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
  syncActiveSummaryPolling()
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
