import { computed, readonly, ref } from "vue";
import {
  getPublishTaskCapabilityCatalog,
  getPublishTaskRuntimeSummary,
  type PublishTaskRuntimeSummary,
  type PublishTaskRuntimeSummaryItem,
} from "@/api/system/queue";
import { useClientNodeStore } from "@/store/modules/clientNode";
import { websocketClient, type PublishTaskRuntimeEvent } from "@/services/websocketClient";

type MenuStatusTone = "available" | "degraded" | "offline";

interface NormalizedPublishTaskRuntimeItem extends PublishTaskRuntimeSummaryItem {
  id: string;
  taskType: string;
  label: string | null;
  status: string | null;
  dispatchStatus: string | null;
  currentStep: string | null;
  lastError: string | null;
  assignedClientId: string | null;
  assignedMachineCode: string | null;
  profileId: string | null;
  updatedAt: string | null;
}

const ACTIVE_PUBLISH_TASK_POLLING_MS = 5000;

const createDefaultSummary = (): PublishTaskRuntimeSummary => ({
  typePrefix: "publish-product-",
  pending: 0,
  waiting: 0,
  processing: 0,
  delayed: 0,
  completed: 0,
  failed: 0,
  total: 0,
  active: 0,
  items: [],
  fetchedAt: null,
});

const summary = ref<PublishTaskRuntimeSummary>(createDefaultSummary());
const loading = ref(false);
const hasServerDirectExecutableTypes = ref(false);
const activeTaskIds = ref<string[]>([]);
const activeTasks = ref<NormalizedPublishTaskRuntimeItem[]>([]);

let initialized = false;
let summaryRefreshPromise: Promise<void> | null = null;
let activeSummaryPollingTimer: ReturnType<typeof setInterval> | null = null;
let activeSummaryRefreshTimer: ReturnType<typeof setTimeout> | null = null;

const normalizeTaskId = (value: unknown) => String(value || "").trim();

const normalizeRuntimeItem = (item: any): NormalizedPublishTaskRuntimeItem | null => {
  const id = normalizeTaskId(item?.id);
  const taskType = String(item?.taskType || "").trim();
  if (!id || !taskType) {
    return null;
  }

  return {
    id,
    taskType,
    label: String(item?.label || "").trim() || null,
    status: String(item?.status || "").trim() || null,
    dispatchStatus: String(item?.dispatchStatus || "").trim() || null,
    currentStep: String(item?.currentStep || "").trim() || null,
    lastError: String(item?.lastError || "").trim() || null,
    assignedClientId: String(item?.assignedClientId || "").trim() || null,
    assignedMachineCode: String(item?.assignedMachineCode || "").trim() || null,
    profileId: String(item?.profileId || "").trim() || null,
    updatedAt: String(item?.updatedAt || "").trim() || null,
  };
};

const syncActiveSummaryPolling = () => {
  const shouldPoll =
    activeTaskIds.value.length > 0 ||
    activeTasks.value.length > 0 ||
    Number(summary.value.active || 0) > 0;
  if (!shouldPoll) {
    if (activeSummaryPollingTimer) {
      clearInterval(activeSummaryPollingTimer);
      activeSummaryPollingTimer = null;
    }
    return;
  }

  if (activeSummaryPollingTimer) {
    return;
  }

  activeSummaryPollingTimer = setInterval(() => {
    void refreshSummary(true);
  }, ACTIVE_PUBLISH_TASK_POLLING_MS);
};

const applySummary = (payload?: Partial<PublishTaskRuntimeSummary> | null) => {
  const next = payload || {};
  const items = Array.isArray(next.items)
    ? next.items
        .map((item) => normalizeRuntimeItem(item))
        .filter((item): item is NormalizedPublishTaskRuntimeItem => !!item)
    : [];

  activeTasks.value = items;
  activeTaskIds.value = items.map((item) => item.id);
  summary.value = {
    typePrefix: String(next.typePrefix || "publish-product-"),
    pending: Number(next.pending) || 0,
    waiting: Number(next.waiting) || 0,
    processing: Number(next.processing) || 0,
    delayed: Number(next.delayed) || 0,
    completed: Number(next.completed) || 0,
    failed: Number(next.failed) || 0,
    total: Number(next.total) || 0,
    active:
      Number(next.active) ||
      items.length ||
      (Number(next.waiting) || 0) + (Number(next.processing) || 0),
    items,
    fetchedAt: String(next.fetchedAt || "").trim() || null,
  };
  syncActiveSummaryPolling();
};

const refreshSummary = async (silent = false) => {
  if (summaryRefreshPromise) {
    return summaryRefreshPromise;
  }

  if (!silent) {
    loading.value = true;
  }

  summaryRefreshPromise = (async () => {
    try {
      const response: any = await getPublishTaskRuntimeSummary();
      const data = response?.data?.data || response?.data || response || {};
      applySummary(data);
    } catch {
      if (!silent) {
        applySummary(createDefaultSummary());
      }
    } finally {
      if (!silent) {
        loading.value = false;
      }
      summaryRefreshPromise = null;
    }
  })();

  return summaryRefreshPromise;
};

const scheduleActiveSummaryRefresh = (delay = 160) => {
  if (activeSummaryRefreshTimer) {
    clearTimeout(activeSummaryRefreshTimer);
  }

  activeSummaryRefreshTimer = setTimeout(() => {
    activeSummaryRefreshTimer = null;
    void refreshSummary(true);
  }, delay);
};

const handlePublishTaskRuntime = (event: PublishTaskRuntimeEvent) => {
  const taskId = normalizeTaskId(event?.taskId);
  if (!taskId) {
    return;
  }

  const eventStatus = String(event?.status || "")
    .trim()
    .toLowerCase();
  const activeSet = new Set(activeTaskIds.value);
  const wasActive = activeSet.has(taskId);

  if (eventStatus === "assigned" || eventStatus === "running" || eventStatus === "processing") {
    if (!wasActive) {
      activeSet.add(taskId);
      activeTaskIds.value = Array.from(activeSet);
    }
    summary.value = {
      ...summary.value,
      processing: Math.max(summary.value.processing, activeTaskIds.value.length),
      active: Math.max(summary.value.active, activeTaskIds.value.length),
    };
    syncActiveSummaryPolling();
    scheduleActiveSummaryRefresh(140);
    return;
  }

  if (
    eventStatus === "completed" ||
    eventStatus === "failed" ||
    eventStatus === "pending" ||
    eventStatus === "timeout"
  ) {
    if (wasActive) {
      activeSet.delete(taskId);
      activeTaskIds.value = Array.from(activeSet);
    }
    activeTasks.value = activeTasks.value.filter((item) => item.id !== taskId);
    summary.value = {
      ...summary.value,
      processing: Math.min(summary.value.processing, activeTaskIds.value.length),
      active: activeTaskIds.value.length,
      items: activeTasks.value,
    };
    syncActiveSummaryPolling();
    scheduleActiveSummaryRefresh(240);
  }
};

const refreshCapabilityCatalog = async () => {
  try {
    const response: any = await getPublishTaskCapabilityCatalog();
    const data = response?.data?.data || response?.data || response || {};
    const serverTaskTypes = Array.isArray(data?.server?.taskTypes) ? data.server.taskTypes : [];
    hasServerDirectExecutableTypes.value = serverTaskTypes.some(
      (item: any) => !!item?.serverDirectExecuteSupported,
    );
  } catch {
    hasServerDirectExecutableTypes.value = false;
  }
};

const resolveTooltipLabel = (item: NormalizedPublishTaskRuntimeItem) => {
  const baseLabel = String(item?.label || "").trim();
  const targetParts = [
    String(item?.assignedMachineCode || "").trim(),
    item?.profileId ? `实例 ${item.profileId}` : "",
  ].filter(Boolean);

  if (baseLabel && targetParts.length) {
    return `${baseLabel} @ ${targetParts.join(" / ")}`;
  }
  if (baseLabel) {
    return baseLabel;
  }
  if (targetParts.length) {
    return targetParts.join(" / ");
  }
  return item.id;
};

const ensureInitialized = () => {
  if (initialized) return;
  initialized = true;
  websocketClient.events.on("publishTaskRuntime", handlePublishTaskRuntime);
  void refreshCapabilityCatalog();
  void refreshSummary(true);
};

export function usePublishTaskRuntimeState() {
  ensureInitialized();
  const clientNodeStore = useClientNodeStore();
  clientNodeStore.ensureInitialized();

  const activeTaskNames = computed(() =>
    activeTasks.value
      .map((item) => resolveTooltipLabel(item))
      .map((item) => String(item || "").trim())
      .filter((item) => !!item),
  );
  const activeTaskCount = computed(() =>
    Math.max(
      activeTaskIds.value.length,
      activeTasks.value.length,
      summary.value.waiting + summary.value.processing,
    ),
  );
  const isAnyPublishTaskRunning = computed(() => activeTaskCount.value > 0);
  const hasBrowserAutomationExecutor = computed(
    () => clientNodeStore.pluginStatusMap["browser-automation"] === "available",
  );
  const isPublishTaskExecutable = computed(
    () => hasBrowserAutomationExecutor.value || hasServerDirectExecutableTypes.value,
  );
  const menuStatusTone = computed<MenuStatusTone>(() => {
    return isPublishTaskExecutable.value ? "available" : "offline";
  });
  const tooltipText = computed(() => {
    if (isAnyPublishTaskRunning.value) {
      if (activeTaskNames.value.length > 0) {
        const names = activeTaskNames.value.slice(0, 3);
        const remaining = activeTaskNames.value.length - names.length;
        return remaining > 0
          ? `正在执行：${names.join("，")} 等 ${remaining} 条`
          : `正在执行：${names.join("，")}`;
      }
      return `当前有 ${activeTaskCount.value} 条发布任务执行中`;
    }
    return isPublishTaskExecutable.value ? "发布任务可执行" : "发布任务暂不可执行";
  });
  const refresh = async () => {
    await refreshSummary();
  };

  return {
    summary: readonly(summary),
    loading: readonly(loading),
    activeTasks: readonly(activeTasks),
    activeTaskNames,
    activeTaskCount,
    hasServerDirectExecutableTypes: readonly(hasServerDirectExecutableTypes),
    runningCount: activeTaskCount,
    hasBrowserAutomationExecutor,
    isPublishTaskExecutable,
    isAnyPublishTaskRunning,
    menuStatusTone,
    tooltipText,
    refresh,
  };
}
