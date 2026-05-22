<template>
  <div class="file-download-console" v-loading="loading">
    <div class="ops-header">
      <div>
        <div class="ops-header__title">文件下载</div>
        <div class="ops-header__desc">将远程文件下载到指定客户端的工作目录</div>
      </div>
      <div class="ops-header__actions">
        <div class="inline-status-group">
          <div class="inline-status" :class="`is-${serviceStatus.level}`">
            <span class="inline-status__dot" />
            <span class="inline-status__label">文件下载服务</span>
            <span class="inline-status__text">{{ serviceStatus.text }}</span>
          </div>
        </div>
        <el-button type="primary" @click="refreshClients">刷新节点</el-button>
      </div>
    </div>

    <div class="tab-layout">
      <ExternalClientSidebar
        class="ops-sidebar"
        :items="clientNodeItems"
        :loading="loading"
        :selected-client-id="selectedClientId"
        section-title="客户端节点"
        empty-text="暂无可用客户端"
        @select="selectedClientId = $event"
      />

      <section class="ops-main">
        <!-- 下载面板 -->
        <div class="ops-panel" v-if="selectedClient">
          <div class="ops-panel__head">
            <div>
              <div class="ops-panel__title">下载文件到客户端</div>
              <div class="ops-panel__sub">{{ selectedClientDisplayName }}</div>
            </div>
          </div>

          <div class="download-form">
            <div class="download-form__field">
              <label class="download-form__label">文件 URL</label>
              <el-input
                v-model="downloadUrl"
                placeholder="请输入文件 URL，例如 https://example.com/file.jpg"
                clearable
                @keyup.enter="handleDownload"
              />
            </div>

            <div class="download-form__actions">
              <el-button
                type="primary"
                :loading="isDownloading"
                :disabled="!downloadUrl.trim() || isDownloading"
                @click="handleDownload"
              >
                {{ isDownloading ? "下载中..." : "下载到客户端" }}
              </el-button>
            </div>
          </div>

          <!-- 下载结果 -->
          <div v-if="lastDownloadResult" class="download-result">
            <div class="download-result__head">
              <span>最近一次下载结果</span>
              <el-tag
                size="small"
                effect="plain"
                :type="lastDownloadResult.success ? 'success' : 'danger'"
              >
                {{ lastDownloadResult.success ? "成功" : "失败" }}
              </el-tag>
            </div>
            <div class="download-result__body">
              <div v-if="lastDownloadResult.filePath" class="download-result__row">
                <span class="download-result__label">本地路径</span>
                <span class="download-result__value">{{ lastDownloadResult.filePath }}</span>
              </div>
              <div v-if="lastDownloadResult.fileSize" class="download-result__row">
                <span class="download-result__label">文件大小</span>
                <span class="download-result__value">{{
                  formatFileSize(lastDownloadResult.fileSize)
                }}</span>
              </div>
              <div class="download-result__row">
                <span class="download-result__label">消息</span>
                <span class="download-result__value">{{ lastDownloadResult.message }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 下载历史 -->
        <div class="ops-panel ops-panel--history" v-if="selectedClient">
          <div class="ops-panel__head">
            <div>
              <div class="ops-panel__title">下载历史</div>
            </div>
            <el-button
              v-if="downloadHistory.length"
              text
              size="small"
              type="danger"
              @click="clearHistory"
            >
              清空历史
            </el-button>
          </div>

          <div v-if="downloadHistory.length" class="history-list">
            <div
              v-for="(entry, index) in downloadHistory"
              :key="index"
              class="history-item"
              :class="{ 'is-failed': !entry.success }"
            >
              <div class="history-item__head">
                <el-tag
                  size="small"
                  effect="plain"
                  :type="entry.success ? 'success' : 'danger'"
                >
                  {{ entry.success ? "成功" : "失败" }}
                </el-tag>
                <span class="history-item__url" :title="entry.url">{{ entry.url }}</span>
              </div>
              <div class="history-item__meta">
                <span v-if="entry.filePath">{{ entry.filePath }}</span>
                <span v-if="entry.fileSize">{{ formatFileSize(entry.fileSize) }}</span>
                <span>{{ formatTime(entry.timestamp) }}</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无下载记录" :image-size="60" />
        </div>

        <el-empty v-else description="请选择客户端节点" />
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import ExternalClientSidebar from "@/views/external/components/ExternalClientSidebar.vue";
import { useClientNodeStore, getClientServiceRuntime } from "@/store/modules/clientNode";
import { ClientControlService } from "@/services/clientControl";
import type { WebsocketConnectionVO } from "@/api/system/websocket";

const store = useClientNodeStore();
store.ensureInitialized();

const selectedClientId = ref<string>("");
const downloadUrl = ref("");
const isDownloading = ref(false);
const lastDownloadResult = ref<{
  success: boolean;
  message: string;
  filePath?: string;
  fileSize?: number;
} | null>(null);
const downloadHistory = ref<
  {
    url: string;
    filePath?: string;
    fileSize?: number;
    success: boolean;
    message: string;
    timestamp: Date;
  }[]
>([]);

const loading = computed(() => store.loading);

const clientNodeItems = computed(() => {
  return store.clients
    .filter((client) => {
      if (!client.isOnline) return true; // Show offline too
      return !!getClientServiceRuntime(client, "file-download");
    })
    .map((client) => {
      const runtime = getClientServiceRuntime(client, "file-download");
      const isOnline = !!client.isOnline;
      const hasService = !!runtime;
      const time =
        client.lastOnlineAt || client.lastOfflineAt || client.connectedAt || "";
      const metaLeft = client.clientInfo?.machine?.code
        ? client.clientInfo.machine.code
        : String(client.id).slice(0, 8);
      const metaRight = client.clientInfo?.location?.city || "";
      const detail = `${client.clientInfo?.app?.name || "Client"} v${client.clientInfo?.app?.version || "?"}`;

      return {
        connectionId: client.id,
        name: isOnline ? (hasService ? "文件下载" : "在线") : "离线",
        time,
        metaLeft,
        metaRight,
        detail,
      };
    });
});

const selectedClient = computed<WebsocketConnectionVO | undefined>(() =>
  store.clients.find((c) => c.id === selectedClientId.value),
);

const selectedClientDisplayName = computed(() => {
  const client = selectedClient.value;
  if (!client) return "未选择客户端";
  const parts: string[] = [];
  if (client.clientInfo?.machine?.code) {
    parts.push(client.clientInfo.machine.code);
  } else {
    parts.push(String(client.id).slice(0, 8));
  }
  if (client.clientInfo?.app?.version) {
    parts.push(`v${client.clientInfo.app.version}`);
  }
  return parts.join(" · ");
});

const serviceStatus = computed(() => {
  if (!selectedClient.value) return { level: "info", text: "未选择" };
  const client = selectedClient.value;
  if (!client.isOnline) return { level: "warning", text: "客户端离线" };
  const runtime = getClientServiceRuntime(client, "file-download");
  if (!runtime) return { level: "warning", text: "服务不可用" };
  return { level: "success", text: "可用" };
});

const refreshClients = async () => {
  await store.refresh();
  ElMessage.success("节点列表已刷新");
};

const handleDownload = async () => {
  const url = downloadUrl.value.trim();
  if (!url) {
    ElMessage.warning("请输入文件 URL");
    return;
  }
  if (!selectedClientId.value) {
    ElMessage.warning("请先选择客户端");
    return;
  }

  isDownloading.value = true;
  try {
    const result = await ClientControlService.downloadFileToClient(
      selectedClientId.value,
      url,
      true,
    );

    if (result.success) {
      lastDownloadResult.value = {
        success: true,
        message: result.message || "下载成功",
        filePath: result.filePath,
      };
      downloadHistory.value.unshift({
        url,
        filePath: result.filePath,
        success: true,
        message: result.message,
        timestamp: new Date(),
      });
      ElMessage.success(result.message || "文件已下载到客户端");
    } else {
      lastDownloadResult.value = {
        success: false,
        message: result.message || "下载失败",
      };
      downloadHistory.value.unshift({
        url,
        success: false,
        message: result.message,
        timestamp: new Date(),
      });
      ElMessage.error(result.message || "下载失败");
    }

    // Keep last 50 entries
    if (downloadHistory.value.length > 50) {
      downloadHistory.value = downloadHistory.value.slice(0, 50);
    }
  } finally {
    isDownloading.value = false;
  }
};

const clearHistory = () => {
  downloadHistory.value = [];
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const formatTime = (date: Date): string => {
  const d = new Date(date);
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};
</script>

<style scoped lang="scss">
.file-download-console {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ops-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 2px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.inline-status-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.inline-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  background: var(--el-fill-color-light);

  &.is-success {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
  }

  &.is-warning {
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning);
  }

  &.is-info {
    background: var(--el-fill-color);
    color: var(--el-text-color-secondary);
  }

  &.is-danger {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }

  &__label {
    opacity: 0.8;
  }

  &__text {
    font-weight: 500;
  }
}

.tab-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.ops-sidebar {
  width: 260px;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-shrink: 0;
}

.ops-main {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ops-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 16px;

  &--history {
    flex-shrink: 0;
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__sub {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 2px;
  }
}

.download-form {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__label {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    margin-bottom: 4px;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }
}

.download-result {
  margin-top: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    font-size: 13px;
    font-weight: 500;
  }

  &__body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__row {
    display: flex;
    gap: 8px;
    font-size: 12px;
  }

  &__label {
    color: var(--el-text-color-secondary);
    min-width: 70px;
    flex-shrink: 0;
  }

  &__value {
    color: var(--el-text-color-primary);
    word-break: break-all;
  }
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  font-size: 12px;

  &.is-failed {
    border-color: var(--el-color-danger-light-5);
    background: var(--el-color-danger-light-9);
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__url {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--el-text-color-primary);
  }

  &__meta {
    display: flex;
    gap: 12px;
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    overflow: hidden;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
