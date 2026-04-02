import { computed, readonly, ref } from "vue";
import {
  getPublishTaskCapabilityCatalog,
  getPublishTaskRuntimeSummary,
  type PublishTaskRuntimeSummary,
} from "@/api/system/queue";
import { useClientNodeStore } from "@/store/modules/clientNode";
import { websocketClient, type PublishTaskRuntimeEvent } from "@/services/websocketClient";

type MenuStatusTone = "available" | "degraded" | "offline";

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
});

const summary = ref<PublishTaskRuntimeSummary>(createDefaultSummary());
const loading = ref(false);
const hasServerDirectExecutableTypes = ref(false);

let initialized = false;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

const applySummary = (payload?: Partial<PublishTaskRuntimeSummary> | null) => {
  const next = payload || {};
  summary.value = {
    typePrefix: String(next.typePrefix || "publish-product-"),
    pending: Number(next.pending) || 0,
    waiting: Number(next.waiting) || 0,
    processing: Number(next.processing) || 0,
    delayed: Number(next.delayed) || 0,
    completed: Number(next.completed) || 0,
    failed: Number(next.failed) || 0,
    total: Number(next.total) || 0,
    active: Number(next.active) || (Number(next.waiting) || 0) + (Number(next.processing) || 0),
  };
};

const refreshSummary = async (silent = false) => {
  if (!silent) {
    loading.value = true;
  }

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
  }
};

const scheduleRefresh = (delay = 480) => {
  if (refreshTimer) {
    return;
  }

  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    void refreshSummary(true);
  }, delay);
};

const handlePublishTaskRuntime = (event: PublishTaskRuntimeEvent) => {
  if (!event?.taskId) {
    return;
  }

  const eventStatus = String(event.status || "").toLowerCase();
  if (eventStatus === "running") {
    summary.value = {
      ...summary.value,
      processing: Math.max(summary.value.processing, 1),
      active: Math.max(summary.value.active, 1),
    };
    scheduleRefresh(1200);
    return;
  }

  scheduleRefresh(320);
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

  const runningCount = computed(() => summary.value.waiting + summary.value.processing);
  const isAnyPublishTaskRunning = computed(() => runningCount.value > 0);
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
      return "发布任务运行中";
    }
    return isPublishTaskExecutable.value ? "发布任务可执行" : "发布任务暂不可执行";
  });
  const refresh = async () => {
    await Promise.all([refreshSummary(), refreshCapabilityCatalog()]);
  };

  return {
    summary: readonly(summary),
    loading: readonly(loading),
    hasServerDirectExecutableTypes: readonly(hasServerDirectExecutableTypes),
    runningCount,
    hasBrowserAutomationExecutor,
    isPublishTaskExecutable,
    isAnyPublishTaskRunning,
    menuStatusTone,
    tooltipText,
    refresh,
  };
}
