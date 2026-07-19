<template>
  <div class="parallel-entry">
    <el-button
      class="parallel-entry__button"
      :class="{
        'parallel-entry__button--running': hasUnsettledRuns,
        'parallel-entry__button--paused': allActiveRunsPaused,
      }"
      size="small"
      type="primary"
      :disabled="!selectedReadyWorkers.length && !runs.length"
      @click="openDialog"
    >
      <Icon
        :icon="hasUnsettledRuns ? 'ep:loading' : 'ep:magic-stick'"
        :class="{ 'parallel-entry__spinner': hasUnsettledRuns }"
      />
      {{ productionButtonLabel }}
      <span v-if="!hasUnsettledRuns && selectedReadyWorkers.length" class="parallel-entry__count">
        {{ selectedReadyWorkers.length }}
      </span>
    </el-button>

    <el-dialog
      v-model="dialogVisible"
      class="parallel-design-dialog"
      width="min(760px, 94vw)"
      append-to-body
      :close-on-click-modal="false"
      :destroy-on-close="false"
    >
      <template #header>
        <div class="pd-dialog-header">
          <div class="pd-dialog-header__icon">
            <Icon icon="ep:magic-stick" />
          </div>
          <div>
            <div class="pd-dialog-header__title">自动制作</div>
            <div class="pd-dialog-header__meta">
              {{ displayWorkers.length }} 个实例 · {{ quantity }} 张设计
            </div>
          </div>
        </div>
      </template>

      <div class="pd-content">
        <section class="pd-section pd-targets">
          <div class="pd-section__header">
            <span class="pd-section__label">设计实例</span>
            <span class="pd-section__value">{{ displayWorkers.length }} 个执行实例</span>
          </div>
          <div v-if="displayWorkers.length" class="pd-target-list">
            <span v-for="worker in displayWorkers" :key="worker.id" class="pd-target">
              <span class="pd-target__dot" />
              {{ worker.name }}
            </span>
          </div>
          <div v-else class="pd-empty">请先在实例列表中选择可用的设计工具</div>
        </section>

        <section class="pd-section">
          <div class="pd-section__header">
            <label class="pd-section__label" for="parallel-design-prompt">设计需求</label>
            <span class="pd-section__value">自然语言提示词</span>
          </div>
          <el-input
            id="parallel-design-prompt"
            v-model="prompt"
            type="textarea"
            :rows="6"
            resize="vertical"
            placeholder="描述主题、商品类型、画布尺寸、文案、风格、配色和保存要求"
            @keydown.enter.ctrl="startProduction"
          />
        </section>

        <section class="pd-section pd-settings">
          <div class="pd-setting">
            <div>
              <div class="pd-section__label">制作数量</div>
              <div class="pd-setting__meta">单实例最多 {{ estimatedRounds }} 张</div>
            </div>
            <el-input-number v-model="quantity" :min="1" :max="50" controls-position="right" />
          </div>
          <el-checkbox v-model="enableAnalysisOptimization" class="pd-variant-toggle">
            分析并自动优化
          </el-checkbox>
        </section>

        <section v-if="runs.length" class="pd-section pd-progress">
          <div class="pd-progress__header">
            <div>
              <span class="pd-section__label">制作进度</span>
              <span class="pd-progress__numbers">{{ completedItemCount }}/{{ totalItemCount }}</span>
            </div>
            <span v-if="activeRunCount" class="pd-progress__active">
              {{ activeRunCount }} 个正在制作
            </span>
          </div>
          <el-progress :percentage="runProgress" :stroke-width="7" />
          <div class="pd-run-list">
            <div v-for="run in runs" :key="run.requestId" class="pd-run">
              <span class="pd-run__index">{{ run.itemIndex + 1 }}</span>
              <span class="pd-run__worker">
                {{ run.workerName || '等待分配' }} · {{ run.assignedCount }} 张
              </span>
              <el-tag size="small" effect="plain" :type="getRunTagType(run.phase)">
                {{ getRunLabel(run.phase) }}
              </el-tag>
              <span class="pd-run__message">{{ getRunMessage(run) }}</span>
              <el-button
                v-if="run.phase === 'accepted' && run.batch?.status === 'paused'"
                size="small"
                text
                type="primary"
                @click="controlBatch(run, 'resume')"
              >
                继续
              </el-button>
              <el-button
                v-else-if="run.phase === 'accepted' && run.batch?.status === 'running'"
                size="small"
                text
                @click="controlBatch(run, 'pause')"
              >
                暂停
              </el-button>
              <el-button
                v-if="run.phase === 'accepted'"
                size="small"
                text
                type="danger"
                @click="stopRun(run)"
              >
                停止
              </el-button>
              <el-button
                v-if="run.connectionId"
                size="small"
                text
                @click="viewWorker(run.connectionId)"
              >
                详情
              </el-button>
            </div>
          </div>
        </section>
      </div>

      <template #footer>
        <div class="pd-footer">
          <span class="pd-footer__summary">
            {{ readyWorkerCount }} 个并发实例，制作 {{ quantity }} 张
          </span>
          <span class="pd-footer__spacer" />
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button
            type="primary"
            :loading="dispatching"
            :disabled="!canStart"
            @click="startProduction"
          >
            <Icon icon="ep:video-play" />
            开始制作
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import request from "@/config/axios";
import {
  websocketClient,
  type RemoteResultEvent,
} from "@/services/websocketClient";
import type { WebsocketConnectionVO } from "@/api/system/websocket";
import { isDesignToolConnectionRunning } from "@/services/designToolRuntimeState";

type RunPhase =
  | "dispatching"
  | "accepted"
  | "completed"
  | "failed"
  | "rejected"
  | "cancelled";

type BatchItemStatus =
  | "pending"
  | "designing"
  | "evaluating"
  | "revising"
  | "saving"
  | "done"
  | "failed"
  | "skipped";

interface BatchRuntimeSnapshot {
  requestId?: string | null;
  status: "idle" | "preparing" | "running" | "paused" | "stopped" | "done";
  current: number;
  total: number;
  completed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  description?: string;
  error?: string;
  startedAt?: number;
  finishedAt?: number;
  updatedAt?: string;
  items?: Array<{
    index: number;
    title: string;
    status: BatchItemStatus;
    score: number | null;
    revisionCount: number;
    error?: string;
    savedUrl?: string;
  }>;
}

interface ProductionRun {
  requestId: string;
  itemIndex: number;
  connectionId: string;
  workerName: string;
  assignedCount: number;
  rangeStart: number;
  rangeEnd: number;
  phase: RunPhase;
  batch?: BatchRuntimeSnapshot;
  message?: string;
  error?: string;
}

interface WorkerSnapshot {
  id: string;
  name: string;
}

const props = defineProps<{
  workers: WebsocketConnectionVO[];
  selectedWorkers: WebsocketConnectionVO[];
}>();

const emit = defineEmits<{
  control: [worker: WebsocketConnectionVO | undefined];
  started: [];
}>();

const dialogVisible = ref(false);
const prompt = ref("");
const quantity = ref(1);
const enableAnalysisOptimization = ref(false);
const dispatching = ref(false);
const runs = ref<ProductionRun[]>([]);
const batchWorkers = ref<WorkerSnapshot[]>([]);
let activeBatchId = "";

const getDesignWorker = (worker: WebsocketConnectionVO) =>
  worker.clientInfo?.designWorker || null;

const isWorkerIdle = (worker: WebsocketConnectionVO) => {
  if (worker.isOnline === false) return false;
  return !isDesignToolConnectionRunning(worker);
};

const selectedReadyWorkers = computed(() =>
  props.selectedWorkers.filter(isWorkerIdle),
);

const terminalPhases = new Set<RunPhase>([
  "completed",
  "failed",
  "rejected",
  "cancelled",
]);
const activePhases = new Set<RunPhase>(["dispatching", "accepted"]);

const activeRunCount = computed(
  () => runs.value.filter((run) => activePhases.has(run.phase)).length,
);
const totalItemCount = computed(() =>
  runs.value.reduce((total, run) => total + run.assignedCount, 0),
);
const completedItemCount = computed(() =>
  runs.value.reduce((total, run) => {
    if (run.batch) return total + Math.min(run.batch.completed, run.assignedCount);
    return total + (terminalPhases.has(run.phase) ? run.assignedCount : 0);
  }, 0),
);
const runProgress = computed(() =>
  totalItemCount.value
    ? Math.round((completedItemCount.value / totalItemCount.value) * 100)
    : 0,
);
const hasUnsettledRuns = computed(() =>
  runs.value.some((run) => !terminalPhases.has(run.phase)),
);
const allActiveRunsPaused = computed(() => {
  const activeRuns = runs.value.filter((run) => !terminalPhases.has(run.phase));
  return (
    activeRuns.length > 0 &&
    activeRuns.every((run) => run.batch?.status === "paused")
  );
});
const productionButtonLabel = computed(() => {
  if (!hasUnsettledRuns.value) return "制作";
  const state = allActiveRunsPaused.value ? "已暂停" : "制作中";
  return `${state} ${completedItemCount.value}/${totalItemCount.value}`;
});

const currentSelectedSnapshots = computed<WorkerSnapshot[]>(() =>
  selectedReadyWorkers.value
    .slice(0, Math.min(selectedReadyWorkers.value.length, quantity.value))
    .map((worker) => ({
    id: worker.id,
    name: getWorkerName(worker),
    })),
);

const displayWorkers = computed(() =>
  hasUnsettledRuns.value || !currentSelectedSnapshots.value.length
    ? batchWorkers.value
    : currentSelectedSnapshots.value,
);

const readyWorkerCount = computed(
  () => currentSelectedSnapshots.value.length || batchWorkers.value.length,
);
const estimatedRounds = computed(() =>
  readyWorkerCount.value
    ? Math.ceil(quantity.value / readyWorkerCount.value)
    : 0,
);
const canStart = computed(
  () =>
    !!prompt.value.trim() &&
    selectedReadyWorkers.value.length > 0 &&
    quantity.value > 0 &&
    !dispatching.value &&
    !hasUnsettledRuns.value,
);

function getWorkerName(worker: WebsocketConnectionVO) {
  const launch = worker.clientInfo?.launch;
  return (
    launch?.profileName ||
    launch?.profileId ||
    worker.clientInfo?.machine?.code ||
    worker.id
  );
}

const findWorker = (connectionId: string) =>
  props.workers.find((worker) => worker.id === connectionId);

const openDialog = () => {
  if (!hasUnsettledRuns.value && selectedReadyWorkers.value.length > 1 && quantity.value === 1) {
    quantity.value = selectedReadyWorkers.value.length;
  }
  dialogVisible.value = true;
};

const viewWorker = (connectionId: string) => {
  dialogVisible.value = false;
  emit("control", findWorker(connectionId));
};

const getRunLabel = (phase: RunPhase) =>
  ({
    dispatching: "发送中",
    accepted: "制作中",
    completed: "已完成",
    failed: "失败",
    rejected: "未接收",
    cancelled: "已停止",
  })[phase];

const getRunTagType = (
  phase: RunPhase,
): "success" | "danger" | "primary" | "info" => {
  if (phase === "completed") return "success";
  if (["failed", "rejected", "cancelled"].includes(phase)) return "danger";
  if (phase === "accepted") return "primary";
  return "info";
};

const batchItemStatusLabel = (status?: BatchItemStatus) =>
  ({
    pending: "等待中",
    designing: "设计中",
    evaluating: "评估中",
    revising: "优化中",
    saving: "上传图库",
    done: "已完成",
    failed: "失败",
    skipped: "已跳过",
  })[status || "pending"];

const getRunMessage = (run: ProductionRun) => {
  if (run.error) return run.error;
  const batch = run.batch;
  if (!batch) return run.message || "等待设计端接收";
  if (batch.status === "preparing") return `正在拆解 brief · 0/${run.assignedCount}`;
  if (batch.status === "paused") return `已暂停 · ${batch.completed}/${run.assignedCount}`;
  if (batch.status === "done") {
    return `${batch.succeeded}/${run.assignedCount} 已上传图库`;
  }
  if (batch.status === "stopped") {
    return `${batch.completed}/${run.assignedCount} · 批次已停止`;
  }
  const current = batch.items?.[batch.current];
  const detail = current
    ? `${current.title} · ${current.error || batchItemStatusLabel(current.status)}`
    : "自动制作中";
  return `${batch.completed}/${run.assignedCount} · ${detail}`;
};

const buildWorkerDescription = (run: ProductionRun) => {
  if (runs.value.length <= 1) return prompt.value.trim();
  return `${prompt.value.trim()}\n\n这是一个跨实例协同批次，总计 ${quantity.value} 张。当前实例负责全局第 ${run.rangeStart}-${run.rangeEnd} 张，共 ${run.assignedCount} 张。保持整个系列的视觉语言一致，同时让当前负责范围内的主题、构图和装饰元素彼此有明确差异。`;
};

const dispatchBatch = async (run: ProductionRun) => {
  try {
    const response: any = await request.postOriginal({
      url: "/websocket/remote-command",
      data: {
        connectionId: run.connectionId,
        command: {
          type: "batch-start",
          payload: {
            description: buildWorkerDescription(run),
            count: run.assignedCount,
            enableAnalysisOptimization: enableAnalysisOptimization.value,
            failureStrategy: "save_anyway",
          },
          requestId: run.requestId,
        },
      },
    });
    if (response?.success === false) {
      throw new Error(response?.message || "指令发送失败");
    }
    if (run.phase === "dispatching") {
      run.message = "等待设计端启动自动制作";
    }
  } catch (error: any) {
    run.phase = "failed";
    run.error = error?.message || "批次启动失败";
  }
};

const startProduction = () => {
  const targets = selectedReadyWorkers.value.slice(
    0,
    Math.min(selectedReadyWorkers.value.length, quantity.value),
  );
  if (!canStart.value || !targets.length) return;

  dispatching.value = true;
  activeBatchId = `production-${Date.now()}`;
  batchWorkers.value = targets.map((worker) => ({
    id: worker.id,
    name: getWorkerName(worker),
  }));
  const baseCount = Math.floor(quantity.value / targets.length);
  const remainder = quantity.value % targets.length;
  let rangeStart = 1;
  runs.value = targets.map((worker, itemIndex) => {
    const assignedCount = baseCount + (itemIndex < remainder ? 1 : 0);
    const run: ProductionRun = {
      requestId: `${activeBatchId}-${itemIndex + 1}`,
      itemIndex,
      connectionId: worker.id,
      workerName: getWorkerName(worker),
      assignedCount,
      rangeStart,
      rangeEnd: rangeStart + assignedCount - 1,
      phase: "dispatching",
      message: "正在启动设计端自动制作",
    };
    rangeStart = run.rangeEnd + 1;
    return run;
  });

  emit("started");
  runs.value.forEach((run) => void dispatchBatch(run));
  dispatching.value = false;
  ElMessage.success(
    `已在 ${runs.value.length} 个设计实例启动 ${quantity.value} 张自动制作`,
  );
};

const controlBatch = async (
  run: ProductionRun,
  action: "pause" | "resume" | "stop",
) => {
  if (!run.connectionId) return;
  try {
    const response: any = await request.postOriginal({
      url: "/websocket/remote-command",
      data: {
        connectionId: run.connectionId,
        command: {
          type: "batch-control",
          payload: { action },
          requestId: `${action}-${run.requestId}-${Date.now()}`,
        },
      },
    });
    if (response?.success === false) {
      throw new Error(response?.message || "批次控制指令发送失败");
    }
    run.message =
      action === "pause"
        ? "正在暂停"
        : action === "resume"
          ? "正在继续"
          : "正在停止";
  } catch (error: any) {
    ElMessage.error(error?.message || "批次控制指令发送失败");
  }
};

const stopRun = (run: ProductionRun) => controlBatch(run, "stop");

const applyTerminalBatchState = (
  run: ProductionRun,
  batch?: BatchRuntimeSnapshot,
) => {
  if (!batch) return false;
  if (batch.status === "done") {
    const total = Number(batch.total || 0);
    const succeeded = Number(batch.succeeded || 0);
    const failed = Number(batch.failed || 0);
    const skipped = Number(batch.skipped || 0);
    const notUploaded = Math.max(total - succeeded, failed + skipped);
    const allUploaded =
      total > 0 && failed === 0 && skipped === 0 && succeeded === total;
    run.phase = allUploaded ? "completed" : "failed";
    run.error = allUploaded
      ? undefined
      : `有 ${notUploaded} 张未成功上传图库`;
    run.message = allUploaded
      ? `${succeeded}/${total} 已上传图库`
      : run.error;
    return true;
  }
  if (batch.status === "stopped") {
    run.phase = batch.error ? "failed" : "cancelled";
    run.error = batch.error;
    run.message = batch.error || `批次已停止 · ${batch.completed}/${batch.total}`;
    return true;
  }
  return false;
};

const handleRemoteResult = (event: RemoteResultEvent) => {
  const run = runs.value.find((item) => item.requestId === event.requestId);
  if (!run) return;

  const phase = String(event.phase || "");
  if (event.batch) run.batch = event.batch as BatchRuntimeSnapshot;
  if (applyTerminalBatchState(run, run.batch)) {
    if (event.message) run.message = event.message;
    if (event.error) run.error = event.error;
    return;
  }
  if (phase === "progress") {
    run.phase = "accepted";
    run.message = event.message;
    return;
  }
  if (phase === "accepted") run.phase = "accepted";
  else if (phase === "rejected") run.phase = "rejected";
  else if (phase === "cancelled") run.phase = "cancelled";
  else if (phase === "failed" || event.success === false) run.phase = "failed";
  else run.phase = "completed";
  run.message = event.message;
  run.error = event.error;
};

watch(
  () =>
    props.workers.map((worker) => ({
      connectionId: worker.id,
      requestId: getDesignWorker(worker)?.activeRequestId || null,
      workerState: getDesignWorker(worker)?.state || null,
      batch: getDesignWorker(worker)?.batch || null,
    })),
  (snapshots) => {
    snapshots.forEach((snapshot) => {
      const requestRun = snapshot.requestId
        ? runs.value.find((run) => run.requestId === snapshot.requestId)
        : null;
      const connectionRun = [...runs.value]
        .reverse()
        .find(
          (run) =>
            run.connectionId === snapshot.connectionId &&
            !terminalPhases.has(run.phase),
        );
      let run = requestRun || connectionRun;
      const recoverableBatch =
        snapshot.batch &&
        snapshot.batch.status !== "idle" &&
        Number(snapshot.batch.total || 0) > 0;
      if (!run && recoverableBatch) {
        const worker = findWorker(snapshot.connectionId);
        const assignedCount = Math.max(1, Number(snapshot.batch.total) || 1);
        run = {
          requestId:
            snapshot.requestId ||
            snapshot.batch.requestId ||
            `recovered-batch-${snapshot.connectionId}-${Date.now()}`,
          itemIndex: runs.value.length,
          connectionId: snapshot.connectionId,
          workerName: worker ? getWorkerName(worker) : snapshot.connectionId,
          assignedCount,
          rangeStart: 1,
          rangeEnd: assignedCount,
          phase: "accepted",
          batch: snapshot.batch as BatchRuntimeSnapshot,
          message: "已从设计端恢复自动制作状态",
        };
        runs.value.push(run);
        activeBatchId = activeBatchId || `recovered-${Date.now()}`;
        if (!prompt.value.trim() && snapshot.batch.description) {
          prompt.value = snapshot.batch.description;
        }
        quantity.value = Math.max(
          1,
          runs.value.reduce((total, item) => total + item.assignedCount, 0),
        );
        if (
          !batchWorkers.value.some((item) => item.id === snapshot.connectionId)
        ) {
          batchWorkers.value.push({
            id: snapshot.connectionId,
            name: run.workerName,
          });
        }
      }
      if (run && snapshot.batch) {
        run.batch = snapshot.batch as BatchRuntimeSnapshot;
        if (["preparing", "running", "paused"].includes(run.batch.status)) {
          run.phase = "accepted";
        } else if (applyTerminalBatchState(run, run.batch)) {
          return;
        }
      }
      if (
        run &&
        !terminalPhases.has(run.phase) &&
        (snapshot.workerState === "busy" || snapshot.workerState === "cancelling")
      ) {
        run.phase = "accepted";
        run.message = "设计端自动制作中";
      }

      const activeRun = runs.value.find(
        (run) =>
          run.connectionId === snapshot.connectionId &&
          run.phase === "accepted",
      );
      const workerIsIdle = snapshot.workerState === "idle";
      if (!activeRun || !workerIsIdle) return;

      if (applyTerminalBatchState(activeRun, snapshot.batch as BatchRuntimeSnapshot)) {
        return;
      }

      activeRun.phase = "failed";
      activeRun.error = "设计实例已结束，但未收到完整的批次结果";
      activeRun.message = activeRun.error;
    });
  },
  { deep: true, immediate: true },
);

onMounted(() => {
  websocketClient.events.on("remote-result", handleRemoteResult);
});

onBeforeUnmount(() => {
  activeBatchId = "";
  websocketClient.events.off("remote-result", handleRemoteResult);
});
</script>

<style scoped>
.parallel-entry {
  display: inline-flex;
}

.parallel-entry__button {
  min-width: 72px;
}

.parallel-entry__button--running {
  min-width: 116px;
  border-color: #6c5ce7;
  background: #6c5ce7;
  box-shadow: 0 0 0 2px rgb(108 92 231 / 14%);
}

.parallel-entry__button--running:hover,
.parallel-entry__button--running:focus {
  border-color: #5b4cdb;
  background: #5b4cdb;
}

.parallel-entry__button--paused,
.parallel-entry__button--paused:hover,
.parallel-entry__button--paused:focus {
  border-color: #d97706;
  background: #d97706;
}

.parallel-entry__button--paused .parallel-entry__spinner {
  animation-play-state: paused;
}

.parallel-entry__spinner {
  animation: parallel-entry-spin 0.9s linear infinite;
}

@keyframes parallel-entry-spin {
  to {
    transform: rotate(360deg);
  }
}

.parallel-entry__count {
  display: inline-flex;
  min-width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border-radius: 8px;
  background: rgb(255 255 255 / 20%);
  font-size: 10px;
  line-height: 1;
}

.pd-dialog-header,
.pd-section__header,
.pd-setting,
.pd-progress__header,
.pd-run,
.pd-footer {
  display: flex;
  align-items: center;
}

.pd-dialog-header {
  gap: 10px;
}

.pd-dialog-header__icon {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 17px;
}

.pd-dialog-header__title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 650;
}

.pd-dialog-header__meta,
.pd-section__value,
.pd-setting__meta,
.pd-footer__summary {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.pd-content {
  display: flex;
  flex-direction: column;
}

.pd-section {
  padding: 14px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.pd-section:last-child {
  border-bottom: 0;
}

.pd-section__header,
.pd-progress__header {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.pd-section__label {
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
}

.pd-target-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pd-target {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  color: var(--el-text-color-regular);
  font-size: 11px;
}

.pd-target__dot {
  width: 5px;
  height: 5px;
  flex: 0 0 5px;
  border-radius: 50%;
  background: var(--el-color-success);
}

.pd-empty {
  padding: 12px 0;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  text-align: center;
}

.pd-settings {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto;
  gap: 18px;
  align-items: center;
}

.pd-setting {
  justify-content: space-between;
  gap: 16px;
}

.pd-variant-toggle {
  margin-right: 0;
}

.pd-progress__numbers {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.pd-progress__active {
  color: var(--el-color-warning);
  font-size: 11px;
}

.pd-run-list {
  max-height: 210px;
  margin-top: 8px;
  overflow-y: auto;
}

.pd-run {
  min-height: 34px;
  gap: 8px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  font-size: 11px;
}

.pd-run:last-child {
  border-bottom: 0;
}

.pd-run__index {
  width: 20px;
  color: var(--el-text-color-placeholder);
  text-align: right;
}

.pd-run__worker {
  width: 120px;
  overflow: hidden;
  color: var(--el-text-color-regular);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pd-run__message {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pd-footer {
  width: 100%;
  gap: 8px;
}

.pd-footer__spacer {
  flex: 1;
}

:global(.parallel-design-dialog .el-dialog__body) {
  padding-top: 2px;
  padding-bottom: 0;
}

:global(.parallel-design-dialog .el-dialog__footer) {
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 640px) {
  .pd-settings {
    grid-template-columns: 1fr;
  }

  .pd-run__worker {
    width: 82px;
  }

  .pd-footer__summary {
    display: none;
  }
}
</style>
