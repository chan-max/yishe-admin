<template>
  <div class="browser-plugin-page">
    <section class="browser-plugin-hero">
      <div class="browser-plugin-hero__summary">
        <div class="browser-plugin-hero__eyebrow">Browser Plugin</div>
        <h1 class="browser-plugin-hero__title">浏览器插件</h1>
        <p class="browser-plugin-hero__description">
          展示当前账号已连接到远程通道的浏览器插件，后续会在这里扩展针对单个插件连接的管理与控制能力。
        </p>
      </div>

      <div class="browser-plugin-hero__actions">
        <div class="browser-plugin-switch">
          <span class="browser-plugin-switch__label">自动刷新</span>
          <el-switch v-model="autoRefresh" size="small" />
        </div>

        <el-button size="small" type="primary" plain :loading="refreshing" @click="refreshConnections">
          <Icon icon="ep:refresh" class="mr-5px" />
          刷新列表
        </el-button>
      </div>
    </section>

    <section class="browser-plugin-overview">
      <div class="browser-plugin-metric">
        <div class="browser-plugin-metric__label">后台状态</div>
        <div class="browser-plugin-metric__value browser-plugin-metric__value--status">
          <el-tag :type="adminWsStatusTag.type" size="small" effect="plain">
            {{ adminWsStatusTag.text }}
          </el-tag>
        </div>
      </div>

      <div class="browser-plugin-metric">
        <div class="browser-plugin-metric__label">已连接插件</div>
        <div class="browser-plugin-metric__value browser-plugin-metric__value--strong">
          {{ pluginConnections.length }}
        </div>
      </div>

      <div class="browser-plugin-metric">
        <div class="browser-plugin-metric__label">浏览器分布</div>
        <div class="browser-plugin-metric__value">{{ browserDistributionText }}</div>
      </div>

      <div class="browser-plugin-metric">
        <div class="browser-plugin-metric__label">最近刷新</div>
        <div class="browser-plugin-metric__value">{{ lastRefreshText }}</div>
      </div>
    </section>

    <section class="browser-plugin-list">
      <div class="browser-plugin-list__header">
        <div>
          <div class="browser-plugin-list__title">插件连接列表</div>
          <div class="browser-plugin-list__description">当前账号下已接入远程通道的浏览器插件连接</div>
        </div>
        <div class="browser-plugin-list__count">{{ pluginConnections.length }} 个连接</div>
      </div>

      <el-empty
        v-if="!initialLoading && pluginConnections.length === 0"
        class="browser-plugin-empty"
        description="当前没有已连接的浏览器插件"
      />

      <el-table
        v-else
        :data="pluginConnections"
        v-loading="initialLoading"
        class="browser-plugin-table"
        size="small"
        stripe
      >
        <el-table-column label="插件" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="plugin-cell">
              <div class="plugin-cell__main">
                <span class="plugin-cell__title">{{ getExtensionName(row) }}</span>
                <el-tag size="small" effect="plain">
                  {{ row.clientInfo?.extension?.version || "未知版本" }}
                </el-tag>
              </div>
              <div class="plugin-cell__sub">{{ row.id }}</div>
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

        <el-table-column label="网络位置" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="info-stack">
              <span>{{ row.clientInfo?.location?.ip || "-" }}</span>
              <span class="info-stack__sub">{{ formatLocationRegion(row) }}</span>
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

defineOptions({ name: "ExternalBrowserPlugin" });

const PLUGIN_CLIENT_SOURCE = "yishe-extension";
const AUTO_REFRESH_INTERVAL_MS = 10_000;

const initialLoading = ref(true);
const refreshing = ref(false);
const autoRefresh = ref(true);
const pluginConnections = ref<WebsocketConnectionVO[]>([]);
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
  if (!pluginConnections.value.length) {
    return "-";
  }

  const browserCounter = new Map<string, number>();
  pluginConnections.value.forEach((row) => {
    const browserName = row.clientInfo?.browser?.name?.trim() || "未知";
    browserCounter.set(browserName, (browserCounter.get(browserName) || 0) + 1);
  });

  return Array.from(browserCounter.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name} ${count}`)
    .join(" / ");
});

const lastRefreshText = computed(() => {
  if (!lastRefreshAt.value) {
    return initialLoading.value ? "读取中" : "-";
  }
  return formatDateTime(lastRefreshAt.value);
});

const resolveClientSource = (row?: WebsocketConnectionVO | null) => {
  const source = row?.clientSource || row?.query?.clientSource;
  return Array.isArray(source) ? source[0] : source || "";
};

const normalizeConnectionRows = (response: unknown): WebsocketConnectionVO[] => {
  if (Array.isArray(response)) {
    return response as WebsocketConnectionVO[];
  }

  if (response && typeof response === "object" && Array.isArray((response as any).data)) {
    return (response as any).data as WebsocketConnectionVO[];
  }

  return [];
};

const refreshConnections = async () => {
  if (refreshing.value) {
    return;
  }

  refreshing.value = true;
  try {
    const response = await getMyRuntimeWebsocketConnectionViews();
    const rows = normalizeConnectionRows(response)
      .filter((row) => resolveClientSource(row) === PLUGIN_CLIENT_SOURCE)
      .sort((a, b) => {
        const aTime = a.connectedAt || "";
        const bTime = b.connectedAt || "";
        return aTime > bTime ? -1 : 1;
      });
    pluginConnections.value = rows;
    lastRefreshAt.value = new Date().toISOString();
  } finally {
    refreshing.value = false;
    initialLoading.value = false;
  }
};

const getExtensionName = (row: WebsocketConnectionVO) =>
  row.clientInfo?.extension?.name || "未命名插件";

const formatBrowser = (row: WebsocketConnectionVO) => {
  const browser = row.clientInfo?.browser;
  if (!browser?.name) {
    return "-";
  }
  return browser.version ? `${browser.name} ${browser.version}` : browser.name;
};

const formatOs = (row: WebsocketConnectionVO) => {
  const os = row.clientInfo?.os;
  if (!os?.name) {
    return "-";
  }
  return os.version ? `${os.name} ${os.version}` : os.name;
};

const formatLocationRegion = (row: WebsocketConnectionVO) => {
  const location = row.clientInfo?.location;
  return [location?.city, location?.region, location?.country].filter(Boolean).join(" / ") || "-";
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
  if (!autoRefresh.value) {
    return;
  }

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
.browser-plugin-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 12px 14px 18px;
  background: transparent;
}

.browser-plugin-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--app-content-border-color);
}

.browser-plugin-hero__summary {
  min-width: 0;
  max-width: 760px;
}

.browser-plugin-hero__eyebrow {
  margin-bottom: 8px;
  font-size: 11px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
}

.browser-plugin-hero__title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.browser-plugin-hero__description {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.browser-plugin-hero__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.browser-plugin-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.browser-plugin-switch__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.browser-plugin-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px 24px;
}

.browser-plugin-metric {
  min-width: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.browser-plugin-metric__label {
  margin-bottom: 8px;
  font-size: 11px;
  line-height: 1.4;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--el-text-color-secondary);
}

.browser-plugin-metric__value {
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.browser-plugin-metric__value--status {
  display: flex;
  align-items: center;
}

.browser-plugin-metric__value--strong {
  font-size: 28px;
  line-height: 1.1;
  font-weight: 700;
}

.browser-plugin-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.browser-plugin-list__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--app-content-border-color);
}

.browser-plugin-list__title {
  font-size: 16px;
  line-height: 1.3;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.browser-plugin-list__description {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.browser-plugin-list__count {
  flex: none;
  font-size: 12px;
  line-height: 1;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.browser-plugin-empty {
  margin-top: 2px;
}

.browser-plugin-table {
  width: 100%;
}

:deep(.browser-plugin-table.el-table) {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

:deep(.browser-plugin-table .el-table__header th) {
  font-weight: 600;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
}

:deep(.browser-plugin-table .el-table__cell) {
  padding-top: 10px;
  padding-bottom: 10px;
}

.plugin-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.plugin-cell__main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.plugin-cell__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.plugin-cell__sub {
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
  .browser-plugin-page {
    padding: 10px 12px 16px;
    gap: 18px;
  }

  .browser-plugin-overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 18px;
  }
}

@media (max-width: 768px) {
  .browser-plugin-hero {
    flex-direction: column;
  }

  .browser-plugin-hero__actions {
    justify-content: flex-start;
  }

  .browser-plugin-list__header {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .browser-plugin-page {
    padding: 8px 10px 14px;
    gap: 16px;
  }

  .browser-plugin-hero__title {
    font-size: 20px;
  }

  .browser-plugin-overview {
    grid-template-columns: 1fr;
  }
}
</style>
