<template>
  <div class="design-tool-page">
    <section class="design-tool-hero">
      <div class="design-tool-hero__summary">
        <div class="design-tool-hero__eyebrow">Design Tool</div>
        <h1 class="design-tool-hero__title">设计工具</h1>
        <p class="design-tool-hero__description">
          展示当前账号已连接到远程通道的设计工具实例，支持贴纸设计、画布操作、AI 生成等能力。
        </p>
      </div>

      <div class="design-tool-hero__actions">
        <div class="design-tool-switch">
          <span class="design-tool-switch__label">自动刷新</span>
          <el-switch v-model="autoRefresh" size="small" />
        </div>

        <el-button size="small" type="primary" plain :loading="refreshing" @click="refreshConnections">
          <Icon icon="ep:refresh" class="mr-5px" />
          刷新列表
        </el-button>
      </div>
    </section>

    <section class="design-tool-overview">
      <div class="design-tool-metric">
        <div class="design-tool-metric__label">管理端状态</div>
        <div class="design-tool-metric__value design-tool-metric__value--status">
          <el-tag :type="adminWsStatusTag.type" size="small" effect="plain">
            {{ adminWsStatusTag.text }}
          </el-tag>
        </div>
      </div>

      <div class="design-tool-metric">
        <div class="design-tool-metric__label">已连接工具</div>
        <div class="design-tool-metric__value design-tool-metric__value--strong">
          {{ toolConnections.length }}
        </div>
      </div>

      <div class="design-tool-metric">
        <div class="design-tool-metric__label">在线浏览器分布</div>
        <div class="design-tool-metric__value">{{ browserDistributionText }}</div>
      </div>

      <div class="design-tool-metric">
        <div class="design-tool-metric__label">最近刷新</div>
        <div class="design-tool-metric__value">{{ lastRefreshText }}</div>
      </div>
    </section>

    <section class="design-tool-list">
      <div class="design-tool-list__header">
        <div>
          <div class="design-tool-list__title">设计工具连接列表</div>
          <div class="design-tool-list__description">当前账号下已接入远程通道的设计工具连接</div>
        </div>
        <div class="design-tool-list__count">{{ toolConnections.length }} 个连接</div>
      </div>

      <el-empty
        v-if="!initialLoading && toolConnections.length === 0"
        class="design-tool-empty"
        description="当前没有已连接的设计工具"
      />

      <el-table
        v-else
        :data="toolConnections"
        v-loading="initialLoading"
        class="design-tool-table"
        size="small"
        stripe
      >
        <el-table-column label="工具实例" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="tool-cell">
              <div class="tool-cell__main">
                <span class="tool-cell__title">{{ getToolName(row) }}</span>
                <el-tag size="small" effect="plain">
                  {{ row.clientInfo?.app?.version || "未知版本" }}
                </el-tag>
              </div>
              <div class="tool-cell__sub">{{ row.id }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="浏览器环境" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="info-stack">
              <span>{{ formatBrowser(row) }}</span>
              <span class="info-stack__sub">{{ formatOs(row) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="机器码" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="info-stack">
              <span>{{ row.clientInfo?.machine?.code || "-" }}</span>
              <span class="info-stack__sub">{{ row.clientInfo?.machine?.platform || "-" }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="屏幕分辨率" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="info-stack">
              <span>{{ formatScreen(row) }}</span>
              <span class="info-stack__sub">{{ row.clientInfo?.screen?.pixelRatio ? `${row.clientInfo.screen.pixelRatio}x DPR` : "-" }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="连接时间" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="info-stack">
              <span>{{ formatDateTime(row.connectedAt) }}</span>
              <span class="info-stack__sub">
                {{ row.connectedAt ? formatPast(row.connectedAt) : "-" }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.isOnline === false ? 'info' : 'success'"
              size="small"
              effect="plain"
            >
              {{ row.isOnline === false ? "离线" : "在线" }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  getMyRuntimeWebsocketConnectionViews,
  type WebsocketConnectionVO,
} from "@/api/system/websocket";
import { websocketClient } from "@/services/websocketClient";
import { formatDate, formatPast } from "@/utils/formatTime";

defineOptions({ name: "DesignToolConnection" });

const DESIGN_TOOL_SOURCE = "设计工具";
const AUTO_REFRESH_INTERVAL_MS = 10_000;

const initialLoading = ref(true);
const refreshing = ref(false);
const autoRefresh = ref(true);
const toolConnections = ref<WebsocketConnectionVO[]>([]);
const refreshTimer = ref<number | null>(null);
const lastRefreshAt = ref<string | null>(null);

const adminWsStatusTag = computed(() => {
  const status = websocketClient.state.status;
  switch (status) {
    case "connected":
      return { text: "已连接", type: "success" as const };
    case "connecting":
      return { text: "连接中", type: "warning" as const };
    case "reconnecting":
      return { text: "重连中", type: "warning" as const };
    case "error":
      return { text: "异常", type: "danger" as const };
    case "disconnected":
      return { text: "已断开", type: "info" as const };
    default:
      return { text: "未连接", type: "info" as const };
  }
});

const browserDistributionText = computed(() => {
  if (!toolConnections.value.length) return "-";
  const counter = new Map<string, number>();
  toolConnections.value.forEach((row) => {
    const name = row.clientInfo?.browser?.name?.trim() || "未知";
    counter.set(name, (counter.get(name) || 0) + 1);
  });
  return Array.from(counter.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name} ${count}`)
    .join(" / ");
});

const lastRefreshText = computed(() => {
  if (!lastRefreshAt.value) return initialLoading.value ? "读取中" : "-";
  return formatDateTime(lastRefreshAt.value);
});

const resolveClientSource = (row?: WebsocketConnectionVO | null) => {
  const source = row?.clientSource || row?.query?.clientSource;
  return Array.isArray(source) ? source[0] : source || "";
};

const normalizeConnectionRows = (response: unknown): WebsocketConnectionVO[] => {
  if (Array.isArray(response)) return response as WebsocketConnectionVO[];
  if (response && typeof response === "object" && Array.isArray((response as any).data))
    return (response as any).data as WebsocketConnectionVO[];
  return [];
};

const refreshConnections = async () => {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    const response = await getMyRuntimeWebsocketConnectionViews();
    const rows = normalizeConnectionRows(response)
      .filter((row) => resolveClientSource(row) === DESIGN_TOOL_SOURCE)
      .sort((a, b) => {
        const aTime = a.connectedAt || "";
        const bTime = b.connectedAt || "";
        return aTime > bTime ? -1 : 1;
      });
    toolConnections.value = rows;
    lastRefreshAt.value = new Date().toISOString();
  } finally {
    refreshing.value = false;
    initialLoading.value = false;
  }
};

const getToolName = (row: WebsocketConnectionVO) =>
  row.clientInfo?.app?.name || "设计工具";

const formatBrowser = (row: WebsocketConnectionVO) => {
  const browser = row.clientInfo?.browser;
  if (!browser?.name) return "-";
  return browser.version ? `${browser.name} ${browser.version}` : browser.name;
};

const formatOs = (row: WebsocketConnectionVO) => {
  const os = row.clientInfo?.os;
  if (!os?.name) return "-";
  return os.version ? `${os.name} ${os.version}` : os.name;
};

const formatScreen = (row: WebsocketConnectionVO) => {
  const screen = row.clientInfo?.screen;
  if (!screen?.width || !screen?.height) return "-";
  return `${screen.width} × ${screen.height}`;
};

const formatDateTime = (value?: string | null) =>
  value ? formatDate(new Date(value), "YYYY-MM-DD HH:mm:ss") : "-";

const stopAutoRefresh = () => {
  if (refreshTimer.value !== null) {
    window.clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
};

const startAutoRefresh = () => {
  stopAutoRefresh();
  if (!autoRefresh.value) return;
  refreshTimer.value = window.setInterval(() => {
    void refreshConnections();
  }, AUTO_REFRESH_INTERVAL_MS);
};

watch(autoRefresh, () => {
  startAutoRefresh();
});

onMounted(() => {
  void refreshConnections();
  startAutoRefresh();
});

onBeforeUnmount(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
.design-tool-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 12px 14px 18px;
  background: transparent;
}

.design-tool-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--app-content-border-color);
}

.design-tool-hero__summary {
  min-width: 0;
  max-width: 760px;
}

.design-tool-hero__eyebrow {
  margin-bottom: 8px;
  font-size: 11px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
}

.design-tool-hero__title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.design-tool-hero__description {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.design-tool-hero__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.design-tool-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.design-tool-switch__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.design-tool-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px 24px;
}

.design-tool-metric {
  min-width: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.design-tool-metric__label {
  margin-bottom: 8px;
  font-size: 11px;
  line-height: 1.4;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--el-text-color-secondary);
}

.design-tool-metric__value {
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.design-tool-metric__value--status {
  display: flex;
  align-items: center;
}

.design-tool-metric__value--strong {
  font-size: 28px;
  line-height: 1.1;
  font-weight: 700;
}

.design-tool-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.design-tool-list__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--app-content-border-color);
}

.design-tool-list__title {
  font-size: 16px;
  line-height: 1.3;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.design-tool-list__description {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.design-tool-list__count {
  flex: none;
  font-size: 12px;
  line-height: 1;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.design-tool-empty {
  margin-top: 2px;
}

.design-tool-table {
  width: 100%;
}

:deep(.design-tool-table.el-table) {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

:deep(.design-tool-table .el-table__header th) {
  font-weight: 600;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
}

:deep(.design-tool-table .el-table__cell) {
  padding-top: 10px;
  padding-bottom: 10px;
}

.tool-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tool-cell__main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.tool-cell__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tool-cell__sub {
  font-size: 12px;
  word-break: break-all;
  color: var(--el-text-color-secondary);
}

.info-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
  line-height: 1.45;
  color: var(--el-text-color-primary);
}

.info-stack__sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 1024px) {
  .design-tool-page {
    padding: 10px 12px 16px;
    gap: 18px;
  }

  .design-tool-overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 18px;
  }
}

@media (max-width: 768px) {
  .design-tool-hero {
    flex-direction: column;
  }

  .design-tool-hero__actions {
    justify-content: flex-start;
  }

  .design-tool-list__header {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .design-tool-page {
    padding: 8px 10px 14px;
    gap: 16px;
  }

  .design-tool-hero__title {
    font-size: 20px;
  }

  .design-tool-overview {
    grid-template-columns: 1fr;
  }
}
</style>
