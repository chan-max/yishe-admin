<template>
  <div class="client-management" v-loading="loading">
    <div class="top-bar">
      <div>
        <div class="top-bar__title">客户端管理</div>
      </div>
      <el-button text @click="handleRefresh">刷新</el-button>
    </div>

    <div class="body">
      <ExternalClientSidebar
        class="sidebar"
        :items="clientNodeItems"
        :loading="loading"
        :selected-client-id="selectedClientId"
        @select="selectedClientId = $event"
      />

      <section class="main">
        <template v-if="selectedClient">
          <div class="client-head">
            <span class="client-head__name">{{ selectedClientDisplayName }}</span>
            <span class="client-head__meta">
              {{ selectedClient.clientInfo?.location?.city || "" }}
              <span class="dot" />
              {{ selectedClient.isOnline ? "在线" : "离线" }}
            </span>
          </div>

          <el-tabs v-model="activeTab" class="tabs">
            <el-tab-pane label="文件下载" name="file-download">
              <ClientFileDownloadPanel
                :client-id="selectedClientId"
                :client-name="selectedClientDisplayName"
              />
            </el-tab-pane>
            <el-tab-pane label="服务状态" name="service-status">
              <ClientServiceStatus :client="selectedClient" />
            </el-tab-pane>
            <el-tab-pane label="连接信息" name="connection-info">
              <ClientConnectionInfo :client="selectedClient" />
            </el-tab-pane>
          </el-tabs>
        </template>

        <el-empty v-else description="请选择客户端节点" />
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import ExternalClientSidebar, {
  type ClientNodeItem,
} from "@/views/external/components/ExternalClientSidebar.vue";
import ClientFileDownloadPanel from "./components/ClientFileDownloadPanel.vue";
import ClientServiceStatus from "./components/ClientServiceStatus.vue";
import ClientConnectionInfo from "./components/ClientConnectionInfo.vue";
import { useClientNodeState } from "@/services/clientNodeState";
import { resolveClientServiceSummary } from "@/services/clientServiceRuntime";
import { formatDate } from "@/utils/formatTime";

const { clients, loading, refresh } = useClientNodeState();

const selectedClientId = ref<string>("");
const activeTab = ref("file-download");

const clientNodeItems = computed<ClientNodeItem[]>(() =>
  clients.value.map((client) => {
    const runtime = client.clientInfo?.services?.["file-download"];
    const summary = resolveClientServiceSummary(runtime);

    return {
      connectionId: client.id,
      name: client.clientInfo?.machine?.code || client.id,
      time: dateText(client.lastOnlineAt || client.connectedAt || client.lastOfflineAt),
      metaLeft: client.clientInfo?.app?.version || "未知版本",
      metaRight: client.clientInfo?.location?.city || "未知位置",
      detail: client.clientInfo?.workspaceDirectory
        ? `工作目录: ${client.clientInfo.workspaceDirectory}`
        : "工作目录: 未上报",
      status: !!client.isOnline ? (summary === "available" ? "online" : "online") : "offline",
    };
  }),
);

const dateText = (value?: string | null) =>
  value ? formatDate(new Date(value), "YYYY-MM-DD HH:mm:ss") : "-";

const selectedClient = computed(() =>
  clients.value.find((c) => c.id === selectedClientId.value),
);

const selectedClientDisplayName = computed(() => {
  const c = selectedClient.value;
  if (!c) return "未选择";
  return c.clientInfo?.machine?.code || c.id;
});

const handleRefresh = async () => {
  await refresh();
  ElMessage.success("已刷新");
};
</script>

<style scoped lang="scss">
.client-management {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &__title {
    font-size: 15px;
    font-weight: 600;
  }
}

.body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--el-border-color-lighter);
}

.main {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.client-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 14px;

  &__name {
    font-size: 14px;
    font-weight: 600;
  }

  &__meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.dot {
  display: inline-block;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
  margin: 0 6px;
  vertical-align: middle;
}

.tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 12px;
  }
}
</style>
