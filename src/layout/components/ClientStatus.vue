<template>
  <div class="header-connection-status">
    <el-popover
      v-model:visible="popoverVisible"
      trigger="click"
      placement="bottom-end"
      :width="344"
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
          :title="isRemoteConnected ? '查看连接状态' : '远程已断开，点击重连'"
          @click="handleTriggerClick"
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
          <div class="header-connection-status__panel-title">连接状态</div>
          <el-button text size="small" :loading="isRefreshing" @click="refreshAllStatuses">
            刷新
          </el-button>
        </div>

        <section class="header-connection-status__section">
          <div class="header-connection-status__metrics">
            <div class="header-connection-status__metric">
              <div class="header-connection-status__metric-head">
                <span class="header-connection-status__metric-dot is-plugin" />
                <span>插件端</span>
              </div>
              <span class="header-connection-status__metric-value">{{ extensionCount }}</span>
            </div>
            <div class="header-connection-status__metric">
              <div class="header-connection-status__metric-head">
                <span class="header-connection-status__metric-dot is-admin" />
                <span>管理端</span>
              </div>
              <span class="header-connection-status__metric-value">{{ adminCount }}</span>
            </div>
            <div class="header-connection-status__metric">
              <div class="header-connection-status__metric-head">
                <span class="header-connection-status__metric-dot is-client" />
                <span>客户端</span>
              </div>
              <span class="header-connection-status__metric-value">{{ clientRuntimeCount }}</span>
            </div>
            <div class="header-connection-status__metric">
              <div class="header-connection-status__metric-head">
                <span class="header-connection-status__metric-dot is-design-tool" />
                <span>设计工具</span>
              </div>
              <span class="header-connection-status__metric-value">{{ designToolCount }}</span>
            </div>
          </div>
        </section>

        <section class="header-connection-status__section">
          <div class="header-connection-status__section-title">连接概览</div>
          <div class="header-connection-status__status-lines">
            <div class="header-connection-status__status-line">
              <div class="header-connection-status__status-main">
                <span
                  class="header-connection-status__status-dot"
                  :class="isRemoteConnected ? 'is-online' : 'is-offline'"
                />
                <div class="header-connection-status__status-copy">
                  <div class="header-connection-status__status-title">管理端</div>
                  <div class="header-connection-status__status-meta">
                    {{ remoteStatusText }} · {{ remoteStatusMeta }}
                  </div>
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
                  <div class="header-connection-status__status-title">客户端</div>
                  <div class="header-connection-status__status-meta">
                    {{ clientNodeStatusText }} · {{ clientNodeMeta }}
                  </div>
                </div>
              </div>
              <el-button link size="small" @click="handleClientAction">
                {{ hasClientRecords ? "查看" : "启动" }}
              </el-button>
            </div>

            <div class="header-connection-status__status-line">
              <div class="header-connection-status__status-main">
                <span
                  class="header-connection-status__status-dot"
                  :class="extensionCount > 0 ? 'is-online' : 'is-offline'"
                />
                <div class="header-connection-status__status-copy">
                  <div class="header-connection-status__status-title">插件端</div>
                  <div class="header-connection-status__status-meta">
                    {{ extensionStatusText }} · {{ extensionStatusMeta }}
                  </div>
                </div>
              </div>
            </div>

            <div class="header-connection-status__status-line">
              <div class="header-connection-status__status-main">
                <span
                  class="header-connection-status__status-dot"
                  :class="designToolCount > 0 ? 'is-online' : 'is-offline'"
                />
                <div class="header-connection-status__status-copy">
                  <div class="header-connection-status__status-title">设计工具</div>
                  <div class="header-connection-status__status-meta">
                    {{ designToolStatusText }} · {{ designToolStatusMeta }}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
import { formatPast } from "@/utils/formatTime";
import { useMyRuntimeConnectionStoreRefs } from "@/store/modules/myRuntimeConnection";
import { resolveRuntimeConnectionSourceKey } from "@/utils/websocketConnection";

defineOptions({ name: "ClientStatus" });

const popoverVisible = ref(false);
const clientDialogVisible = ref(false);
const {
  store: runtimeConnectionStore,
  connections: runtimeConnections,
  loading: runtimeConnectionLoading,
} = useMyRuntimeConnectionStoreRefs();
const hasClientRecords = computed(() => myClients.value.length > 0);
const clientRecordCount = computed(() => myClients.value.length);
const onlineClientCount = computed(
  () => myClients.value.filter((client) => client.isOnline).length,
);
const offlineClientCount = computed(
  () => myClients.value.filter((client) => !client.isOnline).length,
);
const onlineRuntimeConnections = computed(() =>
  runtimeConnections.value.filter((connection) => connection.isOnline !== false),
);
const runtimeConnectionCountBySource = (source: "extension" | "admin" | "client" | "design-tool") =>
  onlineRuntimeConnections.value.filter(
    (connection) => resolveRuntimeConnectionSourceKey(connection) === source,
  ).length;
const extensionCount = computed(() => runtimeConnectionCountBySource("extension"));
const adminCount = computed(() =>
  Math.max(runtimeConnectionCountBySource("admin"), isRemoteConnected.value ? 1 : 0),
);
const clientRuntimeCount = computed(() =>
  Math.max(runtimeConnectionCountBySource("client"), onlineClientCount.value),
);
const designToolCount = computed(() => runtimeConnectionCountBySource("design-tool"));
const runtimeTotalCount = computed(() => adminCount.value + clientRuntimeCount.value + designToolCount.value);
const isRefreshing = computed(() => clientRefreshLoading.value || runtimeConnectionLoading.value);
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
  return `${clientRuntimeCount.value} 个连接`;
});
const clientNodeMeta = computed(() => {
  if (!clientRecordCount.value) {
    return "暂无节点";
  }

  if (onlineClientCount.value === clientRecordCount.value) {
    return `${clientRecordCount.value} 个节点在线`;
  }

  if (onlineClientCount.value > 0) {
    return `节点 ${onlineClientCount.value}/${clientRecordCount.value} 在线`;
  }

  return `${offlineClientCount.value} 个节点离线`;
});
const extensionStatusText = computed(() => `${extensionCount.value} 个连接`);
const extensionStatusMeta = computed(() =>
  extensionCount.value > 0 ? "当前账号在线" : "进入远程连接页查看",
);
const designToolStatusText = computed(() => `${designToolCount.value} 个连接`);
const designToolStatusMeta = computed(() =>
  designToolCount.value > 0 ? "当前账号在线" : "暂无连接",
);

let timers: { localTimer: number; remoteTimer: number } | null = null;
let runtimeRefreshTimer: ReturnType<typeof setInterval> | null = null;

const remoteStatusText = computed(() => `${adminCount.value} 个连接`);

const remoteStatusMeta = computed(() => {
  if (isRemoteConnected.value) {
    if (adminCount.value > 1) {
      return `含当前页面 ${adminCount.value} 个在线`;
    }

    return websocketClient.state.connectedAt
      ? formatPast(websocketClient.state.connectedAt)
      : "连接正常";
  }

  switch (websocketClient.state.status) {
    case "connecting":
      return "正在建立";
    case "reconnecting":
      return "正在恢复";
    case "error":
      return "连接异常";
    default:
      return "等待连接";
  }
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

function handleTriggerClick(event: MouseEvent) {
  if (isRemoteConnected.value) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  reconnectRemote();
}

async function refreshAllStatuses() {
  await Promise.all([refreshMyClients(), runtimeConnectionStore.refresh()]);
}

function handleClientDialogVisibleChange(value: boolean) {
  clientDialogVisible.value = value;
  if (!value) {
    void refreshMyClients();
  }
}

onMounted(() => {
  timers = startConnectionChecks();
  void runtimeConnectionStore.refresh();
  runtimeRefreshTimer = setInterval(() => {
    if (websocketClient.state.status === "connected") {
      void runtimeConnectionStore.refresh();
    }
  }, 15_000);
});

onUnmounted(() => {
  if (timers) {
    clearConnectionChecks(timers);
  }
  if (runtimeRefreshTimer) {
    clearInterval(runtimeRefreshTimer);
    runtimeRefreshTimer = null;
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
  height: var(--top-header-action-size);
  min-width: 0;
  padding: 0 10px;
  color: var(--top-header-text-color);
  cursor: pointer;
  background: color-mix(in srgb, var(--top-header-hover-color) 48%, transparent 52%);
  border: none;
  border-radius: 12px;
  transition:
    background-color 0.18s ease,
    transform 0.18s ease;
  align-items: center;
  gap: 8px;
}

.header-connection-status__trigger:hover {
  background: color-mix(in srgb, var(--top-header-hover-color) 82%, transparent 18%);
}

.header-connection-status__trigger.is-active {
  background: color-mix(in srgb, var(--top-header-hover-color) 96%, transparent 4%);
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
  background: color-mix(in srgb, var(--status-accent) 22%, transparent 78%);
  border-radius: 999px;
  opacity: 0;
  animation: header-connection-status-wave 2.4s ease-out infinite;
  inset: 2px;
}

.header-connection-status__wave.wave-2 {
  animation-delay: 0.8s;
}

.header-connection-status__wave.wave-3 {
  animation-delay: 1.6s;
}

.header-connection-status__signal {
  position: absolute;
  background: var(--status-accent);
  border-radius: 999px;
  animation: header-connection-status-breathe 1.8s ease-in-out infinite;
  inset: 6px;
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
  font-size: 10px;
  line-height: 1.2;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-connection-status__panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  will-change: transform, opacity;
}

.header-connection-status__panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 1px;
}

.header-connection-status__panel-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.header-connection-status__section {
  display: flex;
  padding: 10px;
  background: color-mix(in srgb, var(--el-fill-color-light) 38%, var(--el-bg-color) 62%);
  border: 1px solid color-mix(in srgb, var(--app-content-border-color) 62%, transparent 38%);
  border-radius: 12px;
  flex-direction: column;
  gap: 8px;
}

.header-connection-status__section-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.header-connection-status__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.header-connection-status__metric {
  display: flex;
  min-width: 0;
  padding: 8px 8px 7px;
  background: color-mix(in srgb, var(--el-bg-color) 54%, var(--el-fill-color-light) 46%);
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--app-content-border-color) 36%, transparent 64%);
  flex-direction: column;
  gap: 6px;
}

.header-connection-status__metric-head {
  display: inline-flex;
  font-size: 10px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  align-items: center;
  gap: 5px;
}

.header-connection-status__metric-value {
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.header-connection-status__metric-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 999px;
}

.header-connection-status__metric-dot.is-plugin {
  background: #67c23a;
}

.header-connection-status__metric-dot.is-admin {
  background: var(--el-color-primary);
}

.header-connection-status__metric-dot.is-client {
  background: #e6a23c;
}

.header-connection-status__metric-dot.is-design-tool {
  background: #13c2c2;
}

.header-connection-status__status-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 999px;
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
  gap: 6px;
}

.header-connection-status__status-line {
  display: flex;
  padding: 8px 10px;
  background: color-mix(in srgb, var(--el-bg-color) 58%, var(--el-fill-color-light) 42%);
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--app-content-border-color) 34%, transparent 66%);
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.header-connection-status__status-main {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 8px;
}

.header-connection-status__status-copy {
  min-width: 0;
}

.header-connection-status__status-title {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.header-connection-status__status-meta {
  margin-top: 2px;
  font-size: 10px;
  line-height: 1.35;
  color: var(--el-text-color-secondary);
}

.header-connection-status__runtime-list {
  display: flex;
  max-height: 184px;
  flex-direction: column;
  gap: 5px;
  overflow-y: auto;
}

.header-connection-status__runtime-item {
  display: flex;
  padding: 7px 8px;
  background: color-mix(in srgb, var(--el-bg-color) 58%, var(--el-fill-color-light) 42%);
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--app-content-border-color) 32%, transparent 68%);
  flex-direction: column;
  gap: 3px;
}

.header-connection-status__runtime-main {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
}

.header-connection-status__runtime-source {
  display: inline-flex;
  min-width: 48px;
  padding: 2px 7px;
  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: 999px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.header-connection-status__runtime-source.is-extension {
  color: #4e9b2f;
  background: color-mix(in srgb, #67c23a 12%, transparent);
  border-color: color-mix(in srgb, #67c23a 34%, transparent);
}

.header-connection-status__runtime-source.is-admin {
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}

.header-connection-status__runtime-source.is-client {
  color: #c78922;
  background: color-mix(in srgb, #e6a23c 12%, transparent);
  border-color: color-mix(in srgb, #e6a23c 30%, transparent);
}

.header-connection-status__runtime-source.is-unknown {
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-text-color-secondary) 10%, transparent);
  border-color: color-mix(in srgb, var(--el-text-color-secondary) 26%, transparent);
}

.header-connection-status__runtime-title {
  min-width: 0;
  overflow: hidden;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.header-connection-status__runtime-meta {
  font-size: 9px;
  line-height: 1.3;
  color: var(--el-text-color-secondary);
}

.header-connection-status__runtime-empty {
  padding: 8px 0 1px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  text-align: center;
  background: color-mix(in srgb, var(--el-fill-color-light) 56%, transparent 44%);
  border-radius: 10px;
}

:global(.header-connection-status-popover.el-popover.el-popper) {
  max-width: min(92vw, 344px);
  padding: 10px !important;
  background: color-mix(in srgb, var(--el-bg-color) 98%, transparent 2%) !important;
  border: 1px solid color-mix(in srgb, var(--app-content-border-color) 76%, transparent 24%) !important;
  box-shadow:
    0 10px 28px rgb(15 23 42 / 12%),
    0 1px 0 rgb(255 255 255 / 4%) inset !important;
  backdrop-filter: blur(10px);
}

:global(.header-connection-status__panel .el-button--small) {
  min-height: 24px;
  padding: 5px 8px;
  font-size: 11px;
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
    opacity: 0;
    transform: scale(0.7);
  }

  25% {
    opacity: 0.28;
  }

  100% {
    opacity: 0;
    transform: scale(1.8);
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

@media (width <= 1380px) {
  .header-connection-status__trigger-subtitle {
    max-width: 126px;
  }
}

@media (width <= 1180px) {
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

@media (width <= 768px) {
  .header-connection-status__status-line {
    align-items: stretch;
    flex-direction: column;
    gap: 6px;
  }
}

@media (width <= 420px) {
  .header-connection-status__trigger-copy {
    display: none;
  }
}
</style>
