<template>
  <div class="header-connection-status">
    <el-popover
      v-model:visible="popoverVisible"
      trigger="click"
      placement="bottom-end"
      :width="360"
      :show-after="0"
      :hide-after="0"
      transition="header-connection-status-pop"
      popper-class="header-connection-status-popover"
    >
      <template #reference>
        <button
          type="button"
          class="header-connection-status__trigger"
          :class="[isRemoteConnected ? 'is-online' : 'is-offline', { 'is-active': popoverVisible }]"
        >
          <span class="header-connection-status__orb" aria-hidden="true">
            <span class="header-connection-status__wave wave-1" />
            <span class="header-connection-status__wave wave-2" />
            <span class="header-connection-status__wave wave-3" />
            <span class="header-connection-status__signal" />
          </span>

          <span class="header-connection-status__trigger-copy">
            <span class="header-connection-status__trigger-label">连接状态</span>
            <span class="header-connection-status__trigger-subtitle">{{ triggerSummaryText }}</span>
          </span>
        </button>
      </template>

      <div class="header-connection-status__panel">
        <div class="header-connection-status__panel-head">
          <div>
            <div class="header-connection-status__panel-title">连接状态</div>
            <div class="header-connection-status__panel-desc">当前账号的连接与节点状态</div>
          </div>
          <el-button text size="small" :loading="isRefreshing" @click="refreshAllStatuses">
            刷新
          </el-button>
        </div>

        <div class="header-connection-status__metrics">
          <span class="header-connection-status__metric">
            <span class="header-connection-status__metric-dot is-plugin" />
            插件 {{ extensionCount }}
          </span>
          <span class="header-connection-status__metric">
            <span class="header-connection-status__metric-dot is-admin" />
            后台 {{ adminCount }}
          </span>
          <span class="header-connection-status__metric">
            <span class="header-connection-status__metric-dot is-client" />
            客户端 {{ clientRuntimeCount }}
          </span>
        </div>

        <section class="header-connection-status__status-lines">
          <div class="header-connection-status__status-line">
            <div class="header-connection-status__status-main">
              <span
                class="header-connection-status__status-dot"
                :class="isRemoteConnected ? 'is-online' : 'is-offline'"
              />
              <div class="header-connection-status__status-copy">
                <div class="header-connection-status__status-title">
                  远程通道 {{ remoteStatusText }}
                </div>
                <div class="header-connection-status__status-meta">{{ remoteStatusMeta }}</div>
              </div>
            </div>
            <el-button v-if="!isRemoteConnected" link size="small" @click="reconnectRemote">
              重连
            </el-button>
          </div>

          <div class="header-connection-status__status-line">
            <div class="header-connection-status__status-main">
              <span
                class="header-connection-status__status-dot"
                :class="onlineClientCount > 0 ? 'is-online' : 'is-offline'"
              />
              <div class="header-connection-status__status-copy">
                <div class="header-connection-status__status-title">
                  客户端节点 {{ clientNodeStatusText }}
                </div>
                <div class="header-connection-status__status-meta">{{ clientNodeMeta }}</div>
              </div>
            </div>
            <el-button link size="small" @click="handleClientAction">
              {{ hasClientRecords ? "查看客户端" : "启动客户端" }}
            </el-button>
          </div>
        </section>

        <section class="header-connection-status__runtime">
          <div class="header-connection-status__runtime-head">
            <span>当前在线连接</span>
            <span class="header-connection-status__runtime-total"
              >共 {{ runtimeTotalCount }} 个</span
            >
          </div>

          <div
            v-if="runtimePreviewConnections.length"
            class="header-connection-status__runtime-list"
          >
            <div
              v-for="item in runtimePreviewConnections"
              :key="item.id"
              class="header-connection-status__runtime-item"
            >
              <div class="header-connection-status__runtime-main">
                <span
                  class="header-connection-status__runtime-source-dot"
                  :class="`is-${resolveRuntimeConnectionSourceKey(item)}`"
                />
                <span class="header-connection-status__runtime-source">
                  {{ formatRuntimeConnectionSourceLabel(item) }}
                </span>
                <span class="header-connection-status__runtime-title">
                  {{ resolveConnectionTitle(item) }}
                </span>
              </div>
              <div class="header-connection-status__runtime-meta">
                {{ resolveConnectionMeta(item) }}
              </div>
            </div>
          </div>
          <div v-else class="header-connection-status__runtime-empty">当前账号还没有在线连接</div>
        </section>
      </div>
    </el-popover>

    <ClientConnectionsDialog
      v-model="clientDialogVisible"
      @update:model-value="handleClientDialogVisibleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { ElMessage } from "element-plus";
import ClientConnectionsDialog from "@/components/ClientConnectionsDialog/index.vue";
import {
  clearConnectionChecks,
  clientRefreshLoading,
  isRemoteConnected,
  myClients,
  refreshMyClients,
  startConnectionChecks,
  startWebSocketConnection,
} from "@/stores/connectionStatus";
import { websocketClient } from "@/services/websocketClient";
import { useMyRuntimeConnectionStoreRefs } from "@/store/modules/myRuntimeConnection";
import { formatPast } from "@/utils/formatTime";
import {
  formatRuntimeConnectionSourceLabel,
  resolveRuntimeConnectionSourceKey,
} from "@/utils/websocketConnection";
import type { WebsocketConnectionVO } from "@/api/system/websocket";

defineOptions({ name: "ClientStatus" });

const {
  store: runtimeStore,
  connections: runtimeConnections,
  loading: runtimeLoading,
} = useMyRuntimeConnectionStoreRefs();

const popoverVisible = ref(false);
const clientDialogVisible = ref(false);
const hasClientRecords = computed(() => myClients.value.length > 0);
const clientRecordCount = computed(() => myClients.value.length);
const onlineClientCount = computed(
  () => myClients.value.filter((client) => client.isOnline).length,
);
const offlineClientCount = computed(
  () => myClients.value.filter((client) => !client.isOnline).length,
);
const extensionCount = computed(
  () =>
    runtimeConnections.value.filter(
      (item) => resolveRuntimeConnectionSourceKey(item) === "extension",
    ).length,
);
const adminCount = computed(
  () =>
    runtimeConnections.value.filter((item) => resolveRuntimeConnectionSourceKey(item) === "admin")
      .length,
);
const clientRuntimeCount = computed(
  () =>
    runtimeConnections.value.filter((item) => resolveRuntimeConnectionSourceKey(item) === "client")
      .length,
);
const runtimeTotalCount = computed(() => runtimeConnections.value.length);
const runtimePreviewConnections = computed(() => runtimeConnections.value.slice(0, 4));
const isRefreshing = computed(() => clientRefreshLoading.value || runtimeLoading.value);
const triggerSummaryText = computed(() => {
  const nodeText = clientRecordCount.value
    ? `节点 ${onlineClientCount.value}/${clientRecordCount.value}`
    : "无节点";

  if (runtimeTotalCount.value > 0) {
    return `在线 ${runtimeTotalCount.value} · ${nodeText}`;
  }

  return isRemoteConnected.value ? `已连接 · ${nodeText}` : `远程未连接`;
});
const clientNodeStatusText = computed(() => {
  if (onlineClientCount.value > 0) {
    return "在线中";
  }

  return clientRecordCount.value > 0 ? "已断开" : "未连接";
});
const clientNodeMeta = computed(() => {
  if (!clientRecordCount.value) {
    return "当前账号暂无客户端节点";
  }

  return `在线 ${onlineClientCount.value} / 断线 ${offlineClientCount.value}`;
});

let timers: { localTimer: number; remoteTimer: number } | null = null;

const remoteStatusText = computed(() => {
  if (isRemoteConnected.value) {
    return "已连接";
  }

  switch (websocketClient.state.status) {
    case "connecting":
      return "连接中";
    case "reconnecting":
      return "重连中";
    case "error":
      return "异常";
    default:
      return "未连接";
  }
});

const remoteStatusMeta = computed(() => {
  if (isRemoteConnected.value) {
    return websocketClient.state.connectedAt
      ? `已连接 ${formatPast(websocketClient.state.connectedAt)}`
      : "远程通道工作正常";
  }

  return websocketClient.state.lastError || "点击后可重新发起远程连接";
});

function openClient() {
  window.open("yishe://");
}

function handleClientAction() {
  if (hasClientRecords.value) {
    clientDialogVisible.value = true;
    popoverVisible.value = false;
    return;
  }

  openClient();
}

function reconnectRemote() {
  if (isRemoteConnected.value) {
    return;
  }

  const status = websocketClient.state.status;
  if (status === "connecting" || status === "reconnecting") {
    ElMessage.info("远程连接正在恢复中");
    return;
  }

  websocketClient.reconnect();
  startWebSocketConnection();
  ElMessage.success("已发起远程重连");
}

async function refreshAllStatuses() {
  await Promise.allSettled([refreshMyClients(), runtimeStore.refresh()]);
}

function handleClientDialogVisibleChange(value: boolean) {
  clientDialogVisible.value = value;
  if (!value) {
    void refreshMyClients();
  }
}

function resolveConnectionTitle(item: WebsocketConnectionVO) {
  const info = item.clientInfo || {};
  return (
    info.page?.title ||
    info.extension?.name ||
    info.app?.name ||
    info.machine?.code ||
    info.clientId ||
    item.id
  );
}

function resolveConnectionMeta(item: WebsocketConnectionVO) {
  const info = item.clientInfo || {};
  const parts: string[] = [];

  const statusTime = item.connectedAt || item.lastOnlineAt;
  if (statusTime) {
    parts.push(`已连接 ${formatPast(statusTime)}`);
  }

  if (info.page?.path) {
    parts.push(info.page.path);
  } else if (info.machine?.code) {
    parts.push(info.machine.code);
  }

  return parts.join(" · ") || "当前账号的在线连接";
}

onMounted(() => {
  timers = startConnectionChecks();
  void refreshAllStatuses();
});

onUnmounted(() => {
  if (timers) {
    clearConnectionChecks(timers);
  }
});
</script>

<style scoped lang="scss">
.header-connection-status {
  display: flex;
  min-width: 0;
  align-items: center;
}

.header-connection-status__trigger {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  padding: 0 4px;
  height: var(--top-header-action-size);
  color: var(--top-header-text-color);
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    transform 0.18s ease;
}

.header-connection-status__trigger:hover {
  background: color-mix(in srgb, var(--top-header-hover-color) 72%, transparent 28%);
}

.header-connection-status__trigger.is-active {
  background: color-mix(in srgb, var(--top-header-hover-color) 84%, transparent 16%);
  transform: translateY(-1px);
}

.header-connection-status__trigger.is-online {
  --status-accent: #67c23a;
}

.header-connection-status__trigger.is-offline {
  --status-accent: #f56c6c;
}

.header-connection-status__orb {
  position: relative;
  display: inline-flex;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
}

.header-connection-status__wave {
  position: absolute;
  inset: 2px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--status-accent) 22%, transparent 78%);
  opacity: 0;
  animation: header-connection-status-wave 2.4s ease-out infinite;
}

.header-connection-status__wave.wave-2 {
  animation-delay: 0.8s;
}

.header-connection-status__wave.wave-3 {
  animation-delay: 1.6s;
}

.header-connection-status__signal {
  position: absolute;
  inset: 6px;
  border-radius: 999px;
  background: var(--status-accent);
  animation: header-connection-status-breathe 1.8s ease-in-out infinite;
}

.header-connection-status__trigger-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
}

.header-connection-status__trigger-label {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.header-connection-status__trigger-subtitle {
  max-width: 146px;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 10px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-connection-status__panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  will-change: transform, opacity;
}

.header-connection-status__panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.header-connection-status__panel-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.header-connection-status__panel-desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.header-connection-status__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.header-connection-status__metric {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.header-connection-status__metric-dot,
.header-connection-status__status-dot,
.header-connection-status__runtime-source-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 999px;
}

.header-connection-status__metric-dot.is-plugin,
.header-connection-status__runtime-source-dot.is-extension {
  background: #67c23a;
}

.header-connection-status__metric-dot.is-admin,
.header-connection-status__runtime-source-dot.is-admin {
  background: var(--el-color-primary);
}

.header-connection-status__metric-dot.is-client,
.header-connection-status__runtime-source-dot.is-client {
  background: #e6a23c;
}

.header-connection-status__status-dot.is-online {
  background: #67c23a;
}

.header-connection-status__status-dot.is-offline {
  background: #f56c6c;
}

.header-connection-status__status-lines {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.header-connection-status__status-line {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.header-connection-status__status-main {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 10px;
}

.header-connection-status__status-copy {
  min-width: 0;
}

.header-connection-status__status-title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.header-connection-status__status-meta {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.header-connection-status__runtime {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.header-connection-status__runtime-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.header-connection-status__runtime-total {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 500;
}

.header-connection-status__runtime-list {
  display: flex;
  max-height: 200px;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
}

.header-connection-status__runtime-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 0;
}

.header-connection-status__runtime-main {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
}

.header-connection-status__runtime-source {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  white-space: nowrap;
}

.header-connection-status__runtime-title {
  min-width: 0;
  flex: 1;
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-connection-status__runtime-meta {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.6;
}

.header-connection-status__runtime-empty {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.7;
  text-align: center;
  padding: 8px 0 4px;
}

:global(.header-connection-status-popover.el-popover.el-popper) {
  max-width: min(92vw, 360px);
  border: 1px solid
    color-mix(in srgb, var(--app-content-border-color) 96%, var(--el-text-color-primary) 4%) !important;
  background: color-mix(in srgb, var(--el-bg-color) 98%, transparent 2%) !important;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--app-content-border-color) 72%, transparent 28%),
    0 14px 34px rgba(15, 23, 42, 0.14) !important;
  padding: 12px 14px !important;
  backdrop-filter: blur(10px);
}

:global(.header-connection-status-popover .el-popper__arrow) {
  display: none !important;
}

:global(.header-connection-status-pop-enter-active),
:global(.header-connection-status-pop-leave-active) {
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
  transform-origin: top right;
}

:global(.header-connection-status-pop-enter-from),
:global(.header-connection-status-pop-leave-to) {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

@keyframes header-connection-status-wave {
  0% {
    transform: scale(0.7);
    opacity: 0;
  }

  25% {
    opacity: 0.28;
  }

  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

@keyframes header-connection-status-breathe {
  0%,
  100% {
    opacity: 0.82;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.08);
  }
}

@media (max-width: 1380px) {
  .header-connection-status__trigger-subtitle {
    max-width: 126px;
  }
}

@media (max-width: 1180px) {
  .header-connection-status__trigger {
    padding: 0 3px;
    gap: 6px;
  }

  .header-connection-status__trigger-label {
    font-size: 11px;
  }

  .header-connection-status__trigger-subtitle {
    display: none;
  }
}

@media (max-width: 768px) {
  .header-connection-status__status-line {
    align-items: stretch;
    flex-direction: column;
    gap: 6px;
  }
}

@media (max-width: 420px) {
  .header-connection-status__trigger-copy {
    display: none;
  }
}
</style>
