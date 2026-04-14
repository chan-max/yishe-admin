<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="browser-plugin-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-card shadow="never" class="browser-plugin-panel browser-plugin-panel--overview">
            <div class="browser-plugin-header">
              <div class="browser-plugin-header__summary">
                <div class="browser-plugin-header__title">浏览器插件</div>
                <div class="browser-plugin-header__description">
                  展示当前账号已连接到远程通道的浏览器插件，后续会在这里扩展针对单个插件连接的管理与控制能力。
                </div>
              </div>

              <div class="browser-plugin-header__actions">
                <div class="browser-plugin-header__switch">
                  <span class="browser-plugin-header__switch-label">自动刷新</span>
                  <el-switch v-model="autoRefresh" size="small" />
                </div>

                <el-button
                  size="small"
                  type="primary"
                  plain
                  :loading="loading"
                  @click="refreshConnections"
                >
                  <Icon icon="ep:refresh" class="mr-5px" />
                  刷新列表
                </el-button>
              </div>
            </div>

            <div class="browser-plugin-stats">
              <div class="browser-plugin-stat">
                <span class="browser-plugin-stat__label">后台状态</span>
                <div class="browser-plugin-stat__content">
                  <el-tag :type="adminWsStatusTag.type" size="small" effect="plain">
                    {{ adminWsStatusTag.text }}
                  </el-tag>
                </div>
              </div>

              <div class="browser-plugin-stat">
                <span class="browser-plugin-stat__label">已连接插件</span>
                <div class="browser-plugin-stat__value">{{ pluginConnections.length }}</div>
              </div>

              <div class="browser-plugin-stat">
                <span class="browser-plugin-stat__label">浏览器分布</span>
                <div class="browser-plugin-stat__text">{{ browserDistributionText }}</div>
              </div>

              <div class="browser-plugin-stat">
                <span class="browser-plugin-stat__label">最近刷新</span>
                <div class="browser-plugin-stat__text">
                  {{ lastRefreshText }}
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </template>

      <template #table>
        <el-card shadow="never" class="browser-plugin-panel browser-plugin-panel--table">
          <template #header>
            <div class="browser-plugin-table-header">
              <div class="browser-plugin-table-header__title">插件连接列表</div>
              <el-tag size="small" effect="plain">{{ pluginConnections.length }} 个连接</el-tag>
            </div>
          </template>

          <el-empty
            v-if="!loading && pluginConnections.length === 0"
            description="当前没有已连接的浏览器插件"
          />

          <el-table
            v-else
            :data="pluginConnections"
            v-loading="loading"
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
        </el-card>
      </template>
    </ListPageLayout>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import {
  getMyRuntimeWebsocketConnectionViews,
  type WebsocketConnectionVO,
} from "@/api/system/websocket";
import { websocketClient } from "@/services/websocketClient";
import { formatDate, formatPast } from "@/utils/formatTime";

defineOptions({ name: "ExternalBrowserPlugin" });

const PLUGIN_CLIENT_SOURCE = "yishe-extension";
const AUTO_REFRESH_INTERVAL_MS = 10_000;

const loading = ref(false);
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
    return loading.value ? "读取中" : "-";
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
  if (loading.value) {
    return;
  }

  loading.value = true;
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
    loading.value = false;
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
:deep(.browser-plugin-page .list-page-layout__main) {
  gap: 0;
}

:deep(.browser-plugin-page .list-page-filter--flat) {
  padding-bottom: 14px;
}

.browser-plugin-panel {
  border-radius: 12px;
}

.browser-plugin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.browser-plugin-header__summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.browser-plugin-header__title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.browser-plugin-header__description {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.browser-plugin-header__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.browser-plugin-header__switch {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-light);
}

.browser-plugin-header__switch-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.browser-plugin-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.browser-plugin-stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.browser-plugin-stat__label {
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.browser-plugin-stat__content {
  display: flex;
  align-items: center;
}

.browser-plugin-stat__value {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.browser-plugin-stat__text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.browser-plugin-table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.browser-plugin-table-header__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.browser-plugin-table {
  width: 100%;
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

@media (max-width: 960px) {
  .browser-plugin-header {
    flex-direction: column;
  }

  .browser-plugin-header__actions {
    justify-content: flex-start;
  }

  .browser-plugin-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .browser-plugin-stats {
    grid-template-columns: 1fr;
  }
}
</style>
