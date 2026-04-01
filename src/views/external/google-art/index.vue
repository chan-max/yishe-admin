<template>
  <ContentWrap :plain="true">
    <div class="google-art-page">
      <div class="google-art-toolbar">
        <div class="google-art-toolbar__title">Google Art 控制台</div>
        <div class="google-art-toolbar__actions">
          <el-button @click="loadClients">刷新节点</el-button>
          <el-button
            type="primary"
            :disabled="!selectedClientId || !selectedClient?.isOnline"
            :loading="actionLoading.refreshRuntime"
            @click="handleRefreshRuntime"
          >
            刷新状态
          </el-button>
        </div>
      </div>

      <div class="google-art-layout" v-loading="loading">
        <ExternalClientSidebar
          :items="clientNodeItems"
          :loading="loading"
          :selected-client-id="selectedClientId"
          section-title="客户端节点"
          empty-text="暂无可用客户端"
          @select="handleSelectClient"
        />

        <section class="google-art-main">
          <div v-if="selectedClient" class="google-art-panel">
            <div class="status-hero">
              <div class="hero-main" :class="`is-${availabilityTone}`">
                <div class="hero-eyebrow">Google Art</div>
                <div class="hero-value">{{ availabilityText }}</div>
                <div class="hero-subtitle">
                  {{ selectedClient.machine?.code || selectedClient.clientId }}
                </div>
              </div>
              <div class="status-pills">
                <div class="status-pill" :class="`is-${clientTone}`">
                  <span class="status-pill__dot" />
                  <span>{{ clientStatusText }}</span>
                </div>
                <div class="status-pill" :class="`is-${siteTone}`">
                  <span class="status-pill__dot" />
                  <span>{{ siteStatusBadge }}</span>
                </div>
                <div class="status-pill is-neutral">
                  <span>{{ platformText }}</span>
                </div>
                <div class="status-pill is-neutral">
                  <span>{{ checkedAtText }}</span>
                </div>
              </div>
            </div>

            <div class="google-art-section">
              <div class="google-art-section__title">站点入口</div>
              <div class="google-art-inline">
                <el-input
                  v-model="keyword"
                  clearable
                  placeholder="输入关键词，可在当前设备打开 Google Arts 搜索页"
                  @keyup.enter="openSearch"
                />
                <el-button @click="openSearch">打开搜索</el-button>
              </div>
            </div>

            <div class="google-art-section">
              <div class="google-art-section__title">素材同步</div>
              <div class="google-art-inline">
                <el-input
                  v-model="artUrl"
                  clearable
                  placeholder="https://artsandculture.google.com/asset/..."
                  @keyup.enter="handleFetchZooms"
                />
                <el-button
                  type="primary"
                  :disabled="!canOperate || !artUrl.trim()"
                  :loading="actionLoading.getZooms"
                  @click="handleFetchZooms"
                >
                  获取分辨率
                </el-button>
              </div>

              <div v-if="zoomOptions.length" class="google-art-field">
                <div class="google-art-field__label">分辨率</div>
                <el-radio-group v-model="selectedZoom" class="zoom-group">
                  <el-radio-button v-for="item in zoomOptions" :key="item.idx" :label="item.idx">
                    {{ item.width }} × {{ item.height }}
                  </el-radio-button>
                </el-radio-group>
              </div>

              <div class="google-art-actions">
                <el-button
                  type="primary"
                  :disabled="!canOperate || !artUrl.trim() || selectedZoom === null"
                  :loading="actionLoading.sync"
                  @click="handleSync"
                >
                  同步到素材库
                </el-button>
              </div>
            </div>

            <div class="google-art-section">
              <div class="google-art-section__title">执行结果</div>
              <el-empty v-if="!lastResult" description="暂无执行结果" />
              <div v-else class="result-block">
                <div class="result-row">
                  <span class="result-row__label">结果</span>
                  <span class="result-row__value">{{ lastResult.message }}</span>
                </div>
                <div class="result-row" v-if="lastResult.data?.filePath">
                  <span class="result-row__label">文件路径</span>
                  <span class="result-row__value result-row__value--mono">{{
                    lastResult.data.filePath
                  }}</span>
                </div>
                <div class="result-row" v-if="lastResult.data?.fileSize">
                  <span class="result-row__label">文件大小</span>
                  <span class="result-row__value">{{
                    formatFileSize(lastResult.data.fileSize)
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="google-art-panel google-art-panel--empty">
            <el-empty description="请选择客户端节点" />
          </div>
        </section>
      </div>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  fetchGoogleArtZooms,
  refreshGoogleArtStatus,
  syncGoogleArtToMaterialLibrary,
  type GoogleArtClientVO,
  type GoogleArtServiceStatus,
  type GoogleArtZoomLevel,
} from "@/api/external/googleArt";
import { websocketClient, type ServiceCommandResultEvent } from "@/services/websocketClient";
import { usePluginClientNodes } from "@/services/clientNodeState";
import { formatDate } from "@/utils/formatTime";
import ExternalClientSidebar, {
  type ClientNodeItem,
} from "../components/ExternalClientSidebar.vue";

defineOptions({ name: "ExternalGoogleArt" });

const GOOGLE_ART_QUICK_LINK = "https://artsandculture.google.com/search/asset?q";

const {
  clients: rawClients,
  loading,
  refresh: refreshClientNodes,
  getServiceRuntime,
} = usePluginClientNodes("google-art");
const selectedClientId = ref("");
const keyword = ref("");
const artUrl = ref("");
const zoomOptions = ref<GoogleArtZoomLevel[]>([]);
const selectedZoom = ref<number | null>(null);
const lastResult = ref<{
  success: boolean;
  message: string;
  data?: Record<string, any> | null;
} | null>(null);

const actionLoading = reactive({
  refreshRuntime: false,
  getZooms: false,
  sync: false,
});

const pendingCommandIds = reactive<Record<string, "refreshRuntime" | "getZooms" | "sync">>({});

const mapGoogleArtClient = (client: any): GoogleArtClientVO => ({
  clientId: client.id,
  isOnline: client.isOnline,
  nodeStatus: client.nodeStatus,
  connectedAt: client.connectedAt,
  lastOnlineAt: client.lastOnlineAt,
  appVersion: client.clientInfo?.appVersion || null,
  machine: client.clientInfo?.machine || null,
  location: client.clientInfo?.location || null,
  googleArt: (getServiceRuntime(client) as GoogleArtServiceStatus | null) || null,
});

const clients = computed<GoogleArtClientVO[]>(() =>
  rawClients.value.map((client) => mapGoogleArtClient(client)),
);

const selectedClient = computed(
  () => clients.value.find((item) => item.clientId === selectedClientId.value) || null,
);
const selectedService = computed<GoogleArtServiceStatus | null>(
  () => selectedClient.value?.googleArt || null,
);
const selectedDetails = computed<Record<string, any>>(() => selectedService.value?.details || {});
const canOperate = computed(
  () =>
    !!(
      selectedClientId.value &&
      selectedClient.value?.isOnline &&
      selectedService.value?.available
    ),
);
const clientNodeItems = computed<ClientNodeItem[]>(() =>
  clients.value.map((client) => ({
    connectionId: client.clientId,
    name: client.machine?.code || client.clientId,
    time: formatDateSafe(client.connectedAt),
    metaLeft: client.appVersion || "未知版本",
    metaRight: client.location?.ip || client.location?.city || "未知位置",
    badges: [
      { text: client.isOnline ? "在线" : "离线", tone: client.isOnline ? "success" : "muted" },
      {
        text: resolveAvailabilityText(client.googleArt),
        tone: client.googleArt?.available
          ? "success"
          : client.googleArt?.connected
            ? "warning"
            : "muted",
      },
    ],
  })),
);
const availabilityTone = computed(() =>
  selectedService.value?.available
    ? "success"
    : selectedClient.value?.isOnline
      ? "warning"
      : "muted",
);
const availabilityText = computed(() => {
  if (!selectedClient.value?.isOnline) return "客户端离线";
  if (selectedService.value?.available) return "可同步";
  return "受限";
});
const clientTone = computed(() => (selectedClient.value?.isOnline ? "success" : "muted"));
const clientStatusText = computed(() =>
  selectedClient.value?.isOnline ? "客户端在线" : "客户端离线",
);
const siteTone = computed(() => {
  if (!selectedClient.value?.isOnline) return "muted";
  if (selectedDetails.value.siteAvailable) return "success";
  return "warning";
});
const siteStatusBadge = computed(() => {
  if (!selectedClient.value?.isOnline) return "站点未检测";
  if (selectedDetails.value.siteAvailable) {
    return Number.isFinite(selectedDetails.value.siteLatencyMs)
      ? `网站连通 ${selectedDetails.value.siteLatencyMs}ms`
      : "网站连通";
  }
  return "站点异常";
});
const platformText = computed(
  () => selectedDetails.value.platformName || selectedDetails.value.platform || "未知平台",
);
const checkedAtText = computed(
  () => `检测 ${formatDateSafe(selectedService.value?.lastCheckedAt)}`,
);

const normalizePluginKey = (value?: string | null) => {
  const normalized = String(value || "").trim();
  return normalized || "";
};

const finishAction = (action?: keyof typeof actionLoading) => {
  if (!action) {
    return;
  }
  actionLoading[action] = false;
};

const loadClients = async () => {
  await refreshClientNodes();
  const list = clients.value;
  if (!selectedClientId.value && list.length) {
    selectedClientId.value = list[0].clientId;
  } else if (
    selectedClientId.value &&
    !list.some((item) => item.clientId === selectedClientId.value)
  ) {
    selectedClientId.value = list[0]?.clientId || "";
  }
};

const handleSelectClient = (clientId: string) => {
  selectedClientId.value = clientId;
  zoomOptions.value = [];
  selectedZoom.value = null;
  lastResult.value = null;
};

const resolveAvailabilityText = (service?: GoogleArtServiceStatus | null) => {
  if (!service) return "未知";
  if (service.available) return "可用";
  if (service.connected) return "已连接但不可执行";
  if (service.status === "error") return "异常";
  return "不可用";
};

const formatDateSafe = (value?: string | null) => {
  if (!value) return "-";
  try {
    return formatDate(new Date(value));
  } catch {
    return value;
  }
};

const formatFileSize = (value?: number) => {
  if (!value || !Number.isFinite(value)) return "-";
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
};

const openSearch = () => {
  const target = keyword.value.trim()
    ? `${GOOGLE_ART_QUICK_LINK}=${encodeURIComponent(keyword.value.trim())}`
    : GOOGLE_ART_QUICK_LINK;
  window.open(target, "_blank", "noopener,noreferrer");
};

const trackCommand = async (
  action: "refreshRuntime" | "getZooms" | "sync",
  request: Promise<{ success: boolean; message: string; data?: { commandId?: string } }>,
) => {
  actionLoading[action] = true;
  try {
    const response = await request;
    if (!response.success) {
      finishAction(action);
      ElMessage.error(response.message || "命令发送失败");
      return;
    }

    const commandId = response.data?.commandId;
    if (!commandId) {
      finishAction(action);
      ElMessage.success(response.message || "命令已执行");
      return;
    }

    pendingCommandIds[commandId] = action;
    ElMessage.success(response.message || "命令已发送");
  } catch (error: any) {
    finishAction(action);
    ElMessage.error(error?.message || "命令发送失败");
  }
};

const handleRefreshRuntime = async () => {
  if (!selectedClientId.value) return;
  await trackCommand("refreshRuntime", refreshGoogleArtStatus(selectedClientId.value));
};

const handleFetchZooms = async () => {
  if (!selectedClientId.value || !artUrl.value.trim()) {
    ElMessage.warning("请输入 Google Art 链接");
    return;
  }
  zoomOptions.value = [];
  selectedZoom.value = null;
  lastResult.value = null;
  await trackCommand("getZooms", fetchGoogleArtZooms(selectedClientId.value, artUrl.value.trim()));
};

const handleSync = async () => {
  if (!selectedClientId.value || !artUrl.value.trim()) {
    ElMessage.warning("请输入 Google Art 链接");
    return;
  }
  if (selectedZoom.value === null) {
    ElMessage.warning("请先获取并选择分辨率");
    return;
  }

  await trackCommand(
    "sync",
    syncGoogleArtToMaterialLibrary(selectedClientId.value, {
      url: artUrl.value.trim(),
      zoomLevel: selectedZoom.value,
    }),
  );
};

const handleServiceCommandResult = async (event: ServiceCommandResultEvent) => {
  if (normalizePluginKey(event.pluginKey || event.service) !== "google-art") {
    return;
  }

  const pendingAction = pendingCommandIds[event.commandId];
  if (pendingAction) {
    delete pendingCommandIds[event.commandId];
    finishAction(pendingAction);
  }

  if (pendingAction === "getZooms") {
    const zooms = Array.isArray(event.data?.zooms) ? event.data.zooms : [];
    zoomOptions.value = zooms;
    selectedZoom.value = zooms.length ? (zooms[zooms.length - 1]?.idx ?? null) : null;
  }

  if (pendingAction === "sync") {
    lastResult.value = {
      success: event.success,
      message: event.message || (event.success ? "执行完成" : "执行失败"),
      data: event.data || null,
    };
  }

  if (!event.success) {
    ElMessage.error(event.message || "执行失败");
    await loadClients();
    return;
  }

  if (pendingAction === "refreshRuntime") {
    ElMessage.success(event.message || "状态已刷新");
  } else if (pendingAction === "getZooms") {
    ElMessage.success(event.message || "已获取可用分辨率");
  } else if (pendingAction === "sync") {
    ElMessage.success(event.message || "已同步到素材库");
  }

  await loadClients();
};

watch(clients, (list) => {
  if (!selectedClientId.value && list.length) {
    selectedClientId.value = list[0].clientId;
  } else if (
    selectedClientId.value &&
    !list.some((item) => item.clientId === selectedClientId.value)
  ) {
    selectedClientId.value = list[0]?.clientId || "";
  }
});

onMounted(async () => {
  await loadClients();
  websocketClient.events.on("serviceCommandResult", handleServiceCommandResult);
});

onUnmounted(() => {
  websocketClient.events.off("serviceCommandResult", handleServiceCommandResult);
});
</script>

<style scoped>
.google-art-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.google-art-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.google-art-toolbar__title {
  font-size: 16px;
  font-weight: 600;
}

.google-art-toolbar__actions {
  display: flex;
  gap: 8px;
}

.google-art-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 12px;
}

.google-art-panel {
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-bg-color);
  padding: 12px;
}

.google-art-panel--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
}

.google-art-inline,
.google-art-actions,
.result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.google-art-field__label,
.result-row__label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.result-row__value--mono {
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
}

.google-art-section + .google-art-section {
  margin-top: 16px;
}

.status-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.hero-main {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
}

.hero-main.is-success {
  border-color: var(--el-color-success-light-5);
  background: var(--el-color-success-light-9);
}

.hero-main.is-warning {
  border-color: var(--el-color-warning-light-5);
  background: var(--el-color-warning-light-9);
}

.hero-main.is-muted {
  background: var(--el-fill-color-light);
}

.hero-eyebrow {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
}

.hero-value {
  margin-top: 4px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  margin-top: 8px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.status-pills {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 8px;
  padding: 2px 0;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  background: var(--el-fill-color-light);
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.status-pill__dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: currentColor;
}

.status-pill.is-success {
  border-color: var(--el-color-success-light-5);
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.status-pill.is-warning {
  border-color: var(--el-color-warning-light-5);
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.status-pill.is-muted {
  color: var(--el-text-color-secondary);
}

.status-pill.is-neutral {
  color: var(--el-text-color-secondary);
}

.google-art-section__title {
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.google-art-inline {
  justify-content: flex-start;
}

.google-art-inline :deep(.el-input) {
  flex: 1;
}

.google-art-field {
  margin-top: 12px;
}

.zoom-group {
  display: flex;
  flex-wrap: wrap;
}

.google-art-actions {
  justify-content: flex-start;
  margin-top: 12px;
}

.result-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 2px 2px 0;
}

.result-row {
  justify-content: flex-start;
  align-items: flex-start;
}

.result-row__label {
  width: 52px;
  flex: none;
  font-size: 11px;
}

.result-row__value {
  flex: 1;
  word-break: break-all;
  font-size: 12px;
}

@media (max-width: 1100px) {
  .google-art-layout {
    grid-template-columns: 1fr;
  }

  .status-hero {
    grid-template-columns: 1fr;
  }
}
</style>
