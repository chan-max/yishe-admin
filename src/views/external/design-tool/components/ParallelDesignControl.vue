<template>
  <section class="parallel-control">
    <div class="parallel-control__header">
      <div>
        <div class="parallel-control__title">并行制作</div>
        <div class="parallel-control__summary">
          {{ idleWorkers.length }} 个实例可用
          <span v-if="selectedIds.length">· 已选择 {{ selectedIds.length }} 个</span>
        </div>
      </div>
      <div class="parallel-control__actions">
        <el-button size="small" @click="selectIdleWorkers">选择空闲实例</el-button>
        <el-button size="small" text @click="selectedIds = []">清空</el-button>
      </div>
    </div>

    <div class="parallel-control__body">
      <div class="parallel-control__compose">
        <el-input
          v-model="prompt"
          type="textarea"
          :rows="4"
          resize="vertical"
          placeholder="输入要同时交给多个设计端的自然语言设计需求"
          @keydown.enter.ctrl="startParallelDesign"
        />
        <div class="parallel-control__compose-footer">
          <el-checkbox v-model="createVariants">生成差异化方案</el-checkbox>
          <span class="parallel-control__spacer" />
          <el-button
            type="primary"
            :loading="dispatching"
            :disabled="!prompt.trim() || !selectedIds.length"
            @click="startParallelDesign"
          >
            <Icon icon="ep:video-play" />
            开始制作
          </el-button>
        </div>
      </div>

      <el-checkbox-group v-model="selectedIds" class="parallel-workers">
        <label
          v-for="worker in workers"
          :key="worker.id"
          class="parallel-worker"
          :class="{
            'parallel-worker--busy': !isWorkerIdle(worker),
            'parallel-worker--selected': selectedIds.includes(worker.id),
          }"
        >
          <el-checkbox :value="worker.id" :disabled="!isWorkerIdle(worker)" />
          <span class="parallel-worker__main">
            <span class="parallel-worker__name">{{ getWorkerName(worker) }}</span>
            <span class="parallel-worker__meta">{{ getWorkerEnvironment(worker) }}</span>
          </span>
          <el-tag
            size="small"
            effect="plain"
            :type="isWorkerIdle(worker) ? 'success' : 'warning'"
          >
            {{ getWorkerStateLabel(worker) }}
          </el-tag>
          <el-button size="small" text @click.prevent="$emit('control', worker)">
            查看
          </el-button>
        </label>
      </el-checkbox-group>
    </div>

    <div v-if="runs.length" class="parallel-runs">
      <div class="parallel-runs__header">
        <span>本次执行</span>
        <el-progress
          :percentage="runProgress"
          :stroke-width="6"
          :show-text="false"
          class="parallel-runs__progress"
        />
        <span>{{ completedRunCount }}/{{ runs.length }}</span>
      </div>
      <div class="parallel-runs__list">
        <div v-for="run in runs" :key="run.requestId" class="parallel-run">
          <span class="parallel-run__name">{{ run.workerName }}</span>
          <el-tag size="small" effect="plain" :type="getRunTagType(run.phase)">
            {{ getRunLabel(run.phase) }}
          </el-tag>
          <span class="parallel-run__message">{{ run.message || run.error || '' }}</span>
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
            size="small"
            text
            @click="$emit('control', findWorker(run.connectionId))"
          >
            详情
          </el-button>
        </div>
      </div>
    </div>
  </section>
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

interface ParallelRun {
  requestId: string;
  connectionId: string;
  workerName: string;
  phase:
    | "dispatching"
    | "accepted"
    | "completed"
    | "failed"
    | "rejected"
    | "cancelled";
  message?: string;
  error?: string;
}

const props = defineProps<{
  workers: WebsocketConnectionVO[];
}>();

defineEmits<{
  control: [worker: WebsocketConnectionVO | undefined];
}>();

const prompt = ref("");
const createVariants = ref(true);
const selectedIds = ref<string[]>([]);
const dispatching = ref(false);
const runs = ref<ParallelRun[]>([]);

const getAgent = (worker: WebsocketConnectionVO) =>
  (worker.clientInfo as any)?.agent || null;

const getDesignWorker = (worker: WebsocketConnectionVO) =>
  worker.clientInfo?.designWorker || null;

const isWorkerIdle = (worker: WebsocketConnectionVO) => {
  if (worker.isOnline === false) return false;
  const agent = getAgent(worker);
  const designWorker = getDesignWorker(worker);
  if (designWorker?.state && designWorker.state !== "idle") return false;
  if (agent?.available === false) return false;
  return !agent?.agentState || agent.agentState === "idle";
};

const idleWorkers = computed(() => props.workers.filter(isWorkerIdle));

const terminalPhases = new Set(["completed", "failed", "rejected", "cancelled"]);
const completedRunCount = computed(
  () => runs.value.filter((run) => terminalPhases.has(run.phase)).length,
);
const runProgress = computed(() =>
  runs.value.length
    ? Math.round((completedRunCount.value / runs.value.length) * 100)
    : 0,
);

const findWorker = (connectionId: string) =>
  props.workers.find((worker) => worker.id === connectionId);

const getWorkerName = (worker: WebsocketConnectionVO) => {
  const launch = worker.clientInfo?.launch;
  return (
    launch?.profileName ||
    launch?.profileId ||
    worker.clientInfo?.machine?.code ||
    worker.id
  );
};

const getWorkerEnvironment = (worker: WebsocketConnectionVO) => {
  const browser = worker.clientInfo?.browser?.name || "浏览器";
  const workspace = worker.clientInfo?.designWorker?.workspaceId;
  return workspace ? `${browser} · ${workspace.slice(-8)}` : browser;
};

const getWorkerStateLabel = (worker: WebsocketConnectionVO) => {
  const agent = getAgent(worker);
  const state = String(
    getDesignWorker(worker)?.state || agent?.agentState || "idle",
  );
  const labels: Record<string, string> = {
    idle: "空闲",
    busy: "制作中",
    thinking: "思考中",
    executing: "执行中",
    waiting_user: "等待响应",
    cancelling: "取消中",
    error: "异常",
  };
  return labels[state] || state;
};

const getRunLabel = (phase: ParallelRun["phase"]) =>
  ({
    dispatching: "发送中",
    accepted: "制作中",
    completed: "已完成",
    failed: "失败",
    rejected: "未接收",
    cancelled: "已停止",
  })[phase];

const getRunTagType = (
  phase: ParallelRun["phase"],
): "success" | "danger" | "primary" | "info" => {
  if (phase === "completed") return "success";
  if (phase === "failed" || phase === "rejected" || phase === "cancelled") return "danger";
  if (phase === "accepted") return "primary";
  return "info";
};

const selectIdleWorkers = () => {
  selectedIds.value = idleWorkers.value.map((worker) => worker.id);
};

const buildWorkerPrompt = (index: number, total: number) => {
  const delivery = "完成设计和必要检查后，直接保存到素材库。";
  if (!createVariants.value || total <= 1) {
    return `${prompt.value.trim()}\n\n${delivery}`;
  }
  return `${prompt.value.trim()}\n\n这是同一套商品设计中的第 ${index + 1}/${total} 个并行方案。保持主题、文案和商品适用性一致，同时主动采用不同的构图、视觉焦点或装饰节奏，避免与其他方案雷同。${delivery}`;
};

const startParallelDesign = async () => {
  const targets = selectedIds.value
    .map(findWorker)
    .filter((worker): worker is WebsocketConnectionVO => !!worker && isWorkerIdle(worker));
  if (!prompt.value.trim() || !targets.length || dispatching.value) return;

  dispatching.value = true;
  const batchRequestId = `parallel-${Date.now()}`;
  runs.value = targets.map((worker, index) => ({
    requestId: `${batchRequestId}-${index + 1}`,
    connectionId: worker.id,
    workerName: getWorkerName(worker),
    phase: "dispatching",
    message: "正在发送指令",
  }));

  await Promise.all(
    runs.value.map(async (run, index) => {
      try {
        const response: any = await request.postOriginal({
          url: "/websocket/remote-command",
          data: {
            connectionId: run.connectionId,
            command: {
              type: "chat",
              payload: { message: buildWorkerPrompt(index, runs.value.length) },
              requestId: run.requestId,
            },
          },
        });
        if (response?.success === false) {
          throw new Error(response?.message || "指令发送失败");
        }
        if (run.phase === "dispatching") {
          run.message = "指令已发送，等待设计端接收";
        }
      } catch (error: any) {
        run.phase = "failed";
        run.error = error?.message || "指令发送失败";
      }
    }),
  );

  dispatching.value = false;
  const sentCount = runs.value.filter((run) => run.phase !== "failed").length;
  if (sentCount) ElMessage.success(`已向 ${sentCount} 个设计实例发送指令`);
};

const stopRun = async (run: ParallelRun) => {
  try {
    const response: any = await request.postOriginal({
      url: "/websocket/remote-command",
      data: {
        connectionId: run.connectionId,
        command: {
          type: "stop",
          payload: { requestId: run.requestId },
          requestId: `stop-${run.requestId}-${Date.now()}`,
        },
      },
    });
    if (response?.success === false) {
      throw new Error(response?.message || "停止指令发送失败");
    }
    run.message = "正在停止";
  } catch (error: any) {
    ElMessage.error(error?.message || "停止指令发送失败");
  }
};

const handleRemoteResult = (event: RemoteResultEvent) => {
  const run = runs.value.find((item) => item.requestId === event.requestId);
  if (!run) return;
  const phase = String(event.phase || "");
  if (phase === "accepted") run.phase = "accepted";
  else if (phase === "rejected") run.phase = "rejected";
  else if (phase === "cancelled") run.phase = "cancelled";
  else if (phase === "failed" || event.success === false) run.phase = "failed";
  else run.phase = "completed";
  run.message = event.message;
  run.error = event.error;
};

watch(
  () => props.workers.map((worker) => worker.id),
  (workerIds) => {
    const availableIds = new Set(workerIds);
    selectedIds.value = selectedIds.value.filter((id) => availableIds.has(id));
  },
);

watch(
  () =>
    props.workers.map((worker) => ({
      connectionId: worker.id,
      requestId: worker.clientInfo?.designWorker?.activeRequestId || null,
      workerState: worker.clientInfo?.designWorker?.state || null,
      agentState: getAgent(worker)?.agentState || null,
      userInput: getAgent(worker)?.userInput || "",
      lastError: getAgent(worker)?.lastError || "",
    })),
  (snapshots) => {
    snapshots.forEach((snapshot) => {
      if (snapshot.requestId && snapshot.requestId !== "launch-prompt") {
        const existing = runs.value.find(
          (run) => run.requestId === snapshot.requestId,
        );
        if (!existing) {
          const worker = findWorker(snapshot.connectionId);
          runs.value.unshift({
            requestId: snapshot.requestId,
            connectionId: snapshot.connectionId,
            workerName: worker ? getWorkerName(worker) : snapshot.connectionId,
            phase: "accepted",
            message: snapshot.userInput || "设计端正在制作",
          });
        }
        return;
      }

      const activeRun = runs.value.find(
        (run) =>
          run.connectionId === snapshot.connectionId &&
          run.phase === "accepted",
      );
      if (
        activeRun &&
        snapshot.workerState === "idle" &&
        (!snapshot.agentState || snapshot.agentState === "idle")
      ) {
        activeRun.phase = snapshot.lastError ? "failed" : "completed";
        activeRun.error = snapshot.lastError || undefined;
        activeRun.message = snapshot.lastError || "设计实例已恢复空闲";
      }
    });
  },
  { deep: true, immediate: true },
);

onMounted(() => {
  websocketClient.events.on("remote-result", handleRemoteResult);
});

onBeforeUnmount(() => {
  websocketClient.events.off("remote-result", handleRemoteResult);
});
</script>

<style scoped>
.parallel-control {
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 10px 0;
}

.parallel-control__header,
.parallel-control__compose-footer,
.parallel-runs__header,
.parallel-run,
.parallel-worker {
  display: flex;
  align-items: center;
}

.parallel-control__header {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.parallel-control__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.parallel-control__summary,
.parallel-worker__meta,
.parallel-run__message {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.parallel-control__body {
  display: grid;
  grid-template-columns: minmax(280px, 0.85fr) minmax(420px, 1.15fr);
  gap: 12px;
}

.parallel-control__compose-footer {
  min-height: 34px;
  margin-top: 6px;
}

.parallel-control__spacer {
  flex: 1;
}

.parallel-workers {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: start;
  gap: 6px;
  max-height: 156px;
  overflow-y: auto;
}

.parallel-worker {
  min-width: 0;
  min-height: 42px;
  gap: 7px;
  padding: 4px 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  cursor: pointer;
}

.parallel-worker--selected {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.parallel-worker--busy {
  opacity: 0.72;
  cursor: default;
}

.parallel-worker__main {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
}

.parallel-worker__name,
.parallel-worker__meta,
.parallel-run__name,
.parallel-run__message {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.parallel-worker__name {
  font-size: 12px;
  font-weight: 600;
}

.parallel-runs {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.parallel-runs__header {
  gap: 10px;
  margin-bottom: 5px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.parallel-runs__progress {
  width: 160px;
}

.parallel-runs__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 12px;
}

.parallel-run {
  min-width: 0;
  gap: 7px;
  font-size: 12px;
}

.parallel-run__name {
  width: 110px;
  font-weight: 500;
}

.parallel-run__message {
  flex: 1;
}

@media (max-width: 900px) {
  .parallel-control__body,
  .parallel-runs__list {
    grid-template-columns: 1fr;
  }

  .parallel-workers {
    grid-template-columns: 1fr;
    max-height: 190px;
  }
}

@media (max-width: 560px) {
  .parallel-control__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .parallel-control__actions {
    width: 100%;
  }
}
</style>
