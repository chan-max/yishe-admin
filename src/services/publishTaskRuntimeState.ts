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
const activeTaskIds = ref<string[]>([]);

let initialized = false;

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

const handlePublishTaskRuntime = (event: PublishTaskRuntimeEvent) => {
  const taskId = String(event?.taskId || "").trim();
  if (!taskId) {
    return;
  }

  const eventStatus = String(event.status || "").toLowerCase();
  const activeSet = new Set(activeTaskIds.value);
  const wasActive = activeSet.has(taskId);

  if (eventStatus === "assigned" || eventStatus === "running" || eventStatus === "processing") {
    if (!wasActive) {
      activeSet.add(taskId);
    }
    activeTaskIds.value = Array.from(activeSet);
    summary.value = {
      ...summary.value,
      processing: Math.max(summary.value.processing, activeTaskIds.value.length),
      active: Math.max(summary.value.active, activeTaskIds.value.length),
    };
    return;
  }

  if (eventStatus === "completed" || eventStatus === "failed" || eventStatus === "pending" || eventStatus === "timeout") {
    if (wasActive) {
      activeSet.delete(taskId);
    }
    activeTaskIds.value = Array.from(activeSet);
    summary.value = {
      ...summary.value,
      processing: Math.min(summary.value.processing, activeTaskIds.value.length),
      active: activeTaskIds.value.length,
    };
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

  const runningCount = computed(() =>
    Math.max(activeTaskIds.value.length, summary.value.waiting + summary.value.processing),
  );
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
    await refreshSummary();
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
