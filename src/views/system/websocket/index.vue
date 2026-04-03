<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="websocket-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="websocket-toolbar">
            <div class="websocket-toolbar__summary">
              <div class="websocket-toolbar__title">远程连接</div>
              <div class="websocket-toolbar__description">
                {{ runtimeViewDescription }}
              </div>
            </div>

            <div class="websocket-toolbar__meta">
              <div class="websocket-toolbar__meta-item">
                <span class="websocket-toolbar__meta-label">后台状态</span>
                <el-tag :type="adminWsStatusTag.type" size="small">
                  {{ adminWsStatusTag.text }}
                </el-tag>
              </div>

              <div class="websocket-toolbar__meta-item">
                <span class="websocket-toolbar__meta-label">客户端节点</span>
                <span class="websocket-toolbar__meta-value">
                  在线 {{ nodeOnlineCount }} / 断线 {{ nodeOfflineCount }}
                </span>
              </div>

              <div class="websocket-toolbar__meta-item">
                <span class="websocket-toolbar__meta-label">运行时连接</span>
                <span class="websocket-toolbar__meta-value">
                  插件 {{ runtimeExtensionCount }} / 其他后台 {{ runtimeOtherAdminCount }} /
                  当前后台 {{ runtimeCurrentAdminCount }} / 客户端 {{ runtimeClientCount }}
                </span>
              </div>

              <div class="websocket-toolbar__meta-item" v-if="adminConnectionId">
                <span class="websocket-toolbar__meta-label">当前连接 ID</span>
                <span class="admin-connection-id">{{ adminConnectionId }}</span>
              </div>

              <div class="websocket-toolbar__meta-item websocket-toolbar__meta-item--switch">
                <span class="websocket-toolbar__meta-label">自动刷新</span>
                <el-switch v-model="autoRefresh" />
              </div>

              <div class="websocket-toolbar__actions">
                <el-button
                  size="small"
                  type="primary"
                  @click="refreshConnectionData"
                  :loading="isRefreshing"
                >
                  <Icon icon="ep:refresh" class="mr-5px" /> 刷新列表
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #table>
        <el-empty
          v-if="!isRefreshing && adminConnectionRows.length === 0"
          :description="runtimeEmptyDescription"
        />

        <div
          v-else
          class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat"
        >
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid
                v-bind="runtimeGridOptions"
                :data="adminConnectionRows"
                :loading="isRefreshing"
                ref="gridRef"
              >
                <template #status_default="{ row }">
                  <el-tag :type="getConnectionStatusTagType(row)" size="small">
                    {{ getConnectionStatusText(row) }}
                  </el-tag>
                </template>

                <template #connectedAt_default="{ row }">
                  {{ formatStatusTime(row.lastOnlineAt || row.connectedAt) }}
                </template>

                <template #lastOfflineAt_default="{ row }">
                  {{ formatStatusTime(row.lastOfflineAt) }}
                </template>

                <template #duration_default="{ row }">
                  {{ row.isOnline ? formatPast(row.connectedAt || row.lastOnlineAt) : "-" }}
                </template>

                <template #clientSource_default="{ row }">
                  <div class="websocket-source-tags">
                    <el-tag :type="getSourceTagType(row)" size="small">
                      {{ formatSourceLabel(row) }}
                    </el-tag>
                  </div>
                </template>

                <template #ip_default="{ row }">
                  {{ row.ip || row.clientInfo?.location?.ip || "-" }}
                </template>

                <template #ua_default="{ row }">
                  {{ row.userAgent || row.clientInfo?.userAgent || "-" }}
                </template>

                <template #clientInfo_default="{ row }">
                  {{ formatClientInfo(row.clientInfo) }}
                </template>

                <template #query_default="{ row }">
                  {{ formatQuery(row.query) }}
                </template>

                <template #operation_default="{ row }">
                  <div class="flex justify-start">
                    <el-dropdown
                      class="operation-dropdown"
                      placement="bottom-end"
                      :disabled="!row.isOnline"
                      @command="(command) => handleOperationCommand(command, row)"
                    >
                      <el-button type="primary" link size="small" class="operation-trigger-button">
                        操作
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item command="send-message">
                            <span>发送消息</span>
                          </el-dropdown-item>
                          <el-dropdown-item
                            v-if="canControlConnection(row)"
                            command="control"
                            divided
                          >
                            <span>操控</span>
                          </el-dropdown-item>
                          <el-dropdown-item
                            command="disconnect"
                            divided
                            class="operation-menu-item--danger"
                          >
                            <span>强制断开</span>
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </template>
              </vxe-grid>
            </div>
          </div>
        </div>
      </template>
    </ListPageLayout>

    <el-dialog
      v-model="controlDialogVisible"
      title="连接操控"
      fullscreen
      :close-on-click-modal="false"
      class="control-dialog"
    >
      <div class="control-dialog-content">
        <div class="control-dialog-header">
          <div class="control-connection-info">
            <div class="connection-info-left">
              <div class="connection-id">
                <span class="label">连接 ID：</span>
                <span class="value">{{ currentConnection?.id || "-" }}</span>
              </div>
              <div class="connection-meta">
                <span class="meta-item">
                  <Icon icon="ep:location" class="mr-4px" />
                  {{ currentConnection?.ip || currentConnection?.clientInfo?.location?.ip || "-" }}
                </span>
                <span class="meta-item">
                  <Icon icon="ep:clock" class="mr-4px" />
                  {{
                    currentConnection?.connectedAt ? formatPast(currentConnection.connectedAt) : "-"
                  }}
                </span>
                <span class="meta-item" v-if="currentConnection?.namespace">
                  <Icon icon="ep:folder" class="mr-4px" />
                  {{ currentConnection.namespace }}
                </span>
                <span class="meta-item">
                  <Icon icon="ep:connection" class="mr-4px" />
                  {{ currentConnection?.isOnline ? "在线" : "断线" }}
                </span>
              </div>
            </div>
            <div class="connection-info-right">
              <el-tag :type="getSourceTagType(currentConnection)" size="small">
                {{ formatSourceLabel(currentConnection) }}
              </el-tag>
              <div class="connection-time" v-if="currentConnection?.connectedAt">
                {{ formatDate(new Date(currentConnection.connectedAt)) }}
              </div>
            </div>
          </div>
        </div>

        <div class="control-dialog-body">
          <vxe-grid
            v-if="currentConnection && canControlConnection(currentConnection)"
            v-bind="functionGridOptions"
            :data="functionList"
            class="function-grid"
          >
            <template #icon_default="{ row }">
              <div class="function-icon-cell">
                <Icon :icon="row.icon" />
              </div>
            </template>

            <template #schedule_default="{ row }">
              <div v-if="row.schedule" class="schedule-status-cell">
                <div class="schedule-status-row">
                  <el-tag :type="row.schedule.enabled ? 'success' : 'info'" size="small">
                    {{ row.schedule.enabled ? "已启用" : "已禁用" }}
                  </el-tag>
                  <span class="schedule-info-text">{{ formatSchedule(row.schedule) }}</span>
                </div>
                <div v-if="row.schedule.type" class="schedule-type-text">
                  <el-tag
                    :type="row.schedule.type === 'cron' ? 'primary' : 'success'"
                    size="small"
                    plain
                  >
                    {{ row.schedule.type === "cron" ? "固定时间点" : "间隔时间" }}
                  </el-tag>
                </div>
              </div>
              <span v-else class="text-gray-400">未设置</span>
            </template>

            <template #operation_default="{ row }">
              <div class="flex justify-start">
                <el-dropdown
                  class="operation-dropdown"
                  placement="bottom-end"
                  @command="(command) => handleFunctionOperation(command, row)"
                >
                  <el-button type="primary" link size="small" class="operation-trigger-button">
                    操作
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu class="operation-menu-compact">
                      <el-dropdown-item command="open">
                        <span>打开配置</span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </vxe-grid>

          <el-empty v-else description="当前连接类型不支持操控功能" :image-size="100" />
        </div>
      </div>
      <template #footer>
        <el-button @click="controlDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="sendMessageDialogVisible"
      title="发送消息"
      width="500px"
      align-center
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="连接 ID">
          <el-input :value="currentConnection?.id" disabled />
        </el-form-item>
        <el-form-item label="连接类型">
          <el-tag :type="getSourceTagType(currentConnection)" size="small">
            {{ formatSourceLabel(currentConnection) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="事件名称">
          <el-input v-model="messageEvent" placeholder="默认为 admin-message" />
        </el-form-item>
        <el-form-item label="消息内容">
          <el-input
            v-model="messageContent"
            type="textarea"
            :rows="6"
            placeholder='请输入消息内容，支持 JSON 格式，如 {"type":"test","message":"Hello"}'
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sendMessageDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="sendMessageDialogLoading"
          @click="handleConfirmSendMessage"
        >
          发送
        </el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from "vue";
import { useRouter } from "vue-router";
import type { VxeGridInstance, VxeGridProps } from "vxe-table";
import { useWindowSize } from "@vueuse/core";
import { buildOperationColumn, commonGridOptions } from "@/common/table";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import { useMessage } from "@/hooks/web/useMessage";
import { formatDate, formatPast } from "@/utils/formatTime";
import * as WebsocketApi from "@/api/system/websocket";
import type {
  ScheduledTask,
  TokenUserInfo,
  WebsocketClientInfo,
  WebsocketConnectionVO,
} from "@/api/system/websocket";
import { websocketClient } from "@/services/websocketClient";

defineOptions({ name: "SystemWebsocketConnections" });

type WebsocketConnectionRow = WebsocketConnectionVO;

interface ExtensionFunctionItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  handler: () => void | Promise<void>;
  scheduleCommand?: string;
  schedule: ScheduledTask | null;
}

const router = useRouter();
const message = useMessage();
const gridRef = ref<VxeGridInstance>();
const { height } = useWindowSize();

const autoRefresh = ref(false);
const refreshTimer = ref<number | null>(null);
const refreshInterval = 10_000;

const runtimeConnections = ref<WebsocketConnectionRow[]>([]);
const nodeConnections = ref<WebsocketConnectionRow[]>([]);
const runtimeLoading = ref(false);
const nodeLoading = ref(false);
const isRefreshing = computed(() => runtimeLoading.value || nodeLoading.value);

const sendMessageDialogVisible = ref(false);
const sendMessageDialogLoading = ref(false);
const controlDialogVisible = ref(false);
const currentConnection = ref<WebsocketConnectionRow | null>(null);
const messageContent = ref("");
const messageEvent = ref("admin-message");
const functionList = ref<ExtensionFunctionItem[]>([]);

const adminWsStatus = computed(() => websocketClient.state.status);
const adminConnectionId = computed(() => websocketClient.state.connectionId);

const adminWsStatusTag = computed(() => {
  switch (adminWsStatus.value) {
    case "connected":
      return { text: "已连接", type: "success" as const };
    case "connecting":
      return { text: "连接中", type: "warning" as const };
    case "reconnecting":
      return { text: "重连中", type: "warning" as const };
    case "error":
      return { text: "连接异常", type: "danger" as const };
    case "disconnected":
      return { text: "已断开", type: "info" as const };
    default:
      return { text: "未连接", type: "info" as const };
  }
});

const nodeOnlineCount = computed(() => nodeConnections.value.filter((row) => row.isOnline).length);
const nodeOfflineCount = computed(
  () => nodeConnections.value.filter((row) => !row.isOnline).length,
);

const resolveConnectionSourceKey = (row?: Partial<WebsocketConnectionRow> | null) => {
  const source = String(row?.clientSource || row?.clientInfo?.source || "").trim();
  if (source === "yishe-extension") return "extension";
  if (source === "管理后台") return "admin";
  if (source === "客户端") return "client";
  return "unknown";
};

const isCurrentAdminConnection = (row?: Partial<WebsocketConnectionRow> | null) => {
  return (
    resolveConnectionSourceKey(row) === "admin" && !!row?.id && row.id === adminConnectionId.value
  );
};

const isOtherAdminConnection = (row?: Partial<WebsocketConnectionRow> | null) => {
  return resolveConnectionSourceKey(row) === "admin" && !isCurrentAdminConnection(row);
};

const runtimeExtensionCount = computed(
  () =>
    runtimeConnections.value.filter((row) => resolveConnectionSourceKey(row) === "extension")
      .length,
);
const runtimeClientCount = computed(
  () =>
    runtimeConnections.value.filter((row) => resolveConnectionSourceKey(row) === "client").length,
);
const runtimeCurrentAdminCount = computed(
  () => runtimeConnections.value.filter((row) => isCurrentAdminConnection(row)).length,
);
const runtimeOtherAdminCount = computed(
  () => runtimeConnections.value.filter((row) => isOtherAdminConnection(row)).length,
);
const adminConnectionRows = computed(() => {
  const rowMap = new Map<string, WebsocketConnectionRow>();

  for (const row of runtimeConnections.value) {
    rowMap.set(row.id, row);
  }

  for (const row of nodeConnections.value) {
    if (!rowMap.has(row.id)) {
      rowMap.set(row.id, row);
    }
  }

  return Array.from(rowMap.values()).sort(compareAdminConnectionRows);
});

const runtimeViewDescription =
  "当前页面直接展示统一连接列表，在线会话和离线客户端节点都会显示，方便管理员统一排查。";
const runtimeEmptyDescription = "暂无可展示的连接记录";

const formatStatusTime = (value?: string | null) => {
  if (!value) return "-";
  try {
    return formatDate(new Date(value));
  } catch {
    return value;
  }
};

const getConnectionStatusText = (row: WebsocketConnectionRow) => (row.isOnline ? "在线" : "断线");
const getConnectionStatusTagType = (row: WebsocketConnectionRow) =>
  row.isOnline ? "success" : "danger";

const formatSourceLabel = (row?: Partial<WebsocketConnectionRow> | null) => {
  switch (resolveConnectionSourceKey(row)) {
    case "extension":
      return "插件端";
    case "admin":
      return "管理端";
    case "client":
      return "客户端";
    default:
      return "未知端";
  }
};

const getSourceTagType = (row?: Partial<WebsocketConnectionRow> | null) => {
  return row?.isOnline === false ? "danger" : "success";
};

const formatQuery = (query?: Record<string, string | string[]>) => {
  if (!query) return "-";
  const entries = Object.entries(query).filter(([key]) => key !== "clientInfo" && key !== "token");
  if (!entries.length) return "-";
  return entries
    .map(([key, value]) => (Array.isArray(value) ? `${key}=${value.join(",")}` : `${key}=${value}`))
    .join("；");
};

const formatUserSummary = (user?: Partial<TokenUserInfo> & { username?: string }) => {
  if (!user) return "-";

  const parts: string[] = [];
  const displayName = user.name || user.nickname || user.account || user.username;
  if (displayName) {
    parts.push(displayName);
  }
  if (user.id) {
    parts.push(`ID: ${user.id}`);
  }
  if (user.email) {
    parts.push(user.email);
  }
  if (user.company?.name) {
    parts.push(`公司: ${user.company.name}`);
  }
  return parts.length ? parts.join(" | ") : "-";
};

const formatUserFromConnection = (row: WebsocketConnectionRow) => {
  const info: any = row.clientInfo || {};
  const user = info.user || {
    id: row.userId,
    account: row.username,
    nickname: row.nickname,
    email: row.email,
  };
  return formatUserSummary(user);
};

const formatClientInfo = (info?: WebsocketClientInfo) => {
  if (!info) return "-";

  const segments: string[] = [];

  if (info.app?.name) {
    segments.push(
      `应用: ${info.app.name}${info.app.version ? ` ${info.app.version}` : ""}${info.app.mode ? ` (${info.app.mode})` : ""}`,
    );
  }

  if (info.extension?.name) {
    segments.push(
      `插件: ${info.extension.name}${info.extension.version ? ` ${info.extension.version}` : ""}`,
    );
  }

  if (info.clientId) {
    segments.push(`ID: ${info.clientId}`);
  }

  if (info.machine?.code) {
    segments.push(`机器码: ${info.machine.code}`);
  }

  if (info.browser?.name) {
    segments.push(
      `浏览器: ${info.browser.name}${info.browser.version ? ` ${info.browser.version}` : ""}`,
    );
  }

  if (info.os?.name) {
    segments.push(`系统: ${info.os.name}${info.os.version ? ` ${info.os.version}` : ""}`);
  }

  if (info.screen?.width && info.screen?.height) {
    const ratio = info.screen.pixelRatio ? ` @${info.screen.pixelRatio}` : "";
    segments.push(`屏幕: ${info.screen.width}x${info.screen.height}${ratio}`);
  }

  if (info.page?.path) {
    segments.push(`页面: ${info.page.path}`);
  }

  if (info.page?.visibilityState) {
    segments.push(`可见性: ${info.page.visibilityState}`);
  }

  if (info.platform?.arch) {
    segments.push(
      `架构: ${info.platform.arch}${info.platform.nacl_arch ? ` / ${info.platform.nacl_arch}` : ""}`,
    );
  }

  if (info.language) {
    segments.push(`语言: ${info.language}`);
  }

  if (info.timeZone) {
    segments.push(`时区: ${info.timeZone}`);
  }

  if (info.device?.hardwareConcurrency || info.device?.memory || info.device?.touchPoints) {
    const parts: string[] = [];
    if (info.device?.hardwareConcurrency) {
      parts.push(`${info.device.hardwareConcurrency} 核`);
    }
    if (info.device?.memory) {
      parts.push(`${info.device.memory} GB`);
    }
    if (info.device?.touchPoints) {
      parts.push(`${info.device.touchPoints} 触点`);
    }
    segments.push(`硬件: ${parts.join(" / ")}`);
  }

  const locationParts = [info.location?.city, info.location?.region, info.location?.country].filter(
    Boolean,
  );
  if (locationParts.length) {
    segments.push(`位置: ${locationParts.join(" · ")}`);
  }

  if (info.location?.ip) {
    segments.push(`IP: ${info.location.ip}`);
  }

  if (info.location?.org) {
    segments.push(`网络: ${info.location.org}`);
  }

  return segments.length ? segments.join(" | ") : "-";
};

const resolveListResponse = (response: unknown) => {
  if (Array.isArray(response)) {
    return response as WebsocketConnectionVO[];
  }
  if (response && typeof response === "object" && Array.isArray((response as any).data)) {
    return (response as any).data as WebsocketConnectionVO[];
  }
  return [];
};

const compareNodeConnections = (a: WebsocketConnectionRow, b: WebsocketConnectionRow) => {
  if (!!a.isOnline !== !!b.isOnline) {
    return a.isOnline ? -1 : 1;
  }
  const aTime = a.lastOnlineAt || a.lastOfflineAt || a.connectedAt || "";
  const bTime = b.lastOnlineAt || b.lastOfflineAt || b.connectedAt || "";
  if (aTime !== bTime) {
    return aTime > bTime ? -1 : 1;
  }
  return String(a.id || "").localeCompare(String(b.id || ""));
};

const getRuntimePriority = (row: WebsocketConnectionRow) => {
  if (resolveConnectionSourceKey(row) === "extension") return 0;
  if (isOtherAdminConnection(row)) return 1;
  if (isCurrentAdminConnection(row)) return 2;
  if (resolveConnectionSourceKey(row) === "client") return 3;
  return 4;
};

const compareRuntimeConnections = (a: WebsocketConnectionRow, b: WebsocketConnectionRow) => {
  const priorityDiff = getRuntimePriority(a) - getRuntimePriority(b);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }
  const aTime = a.connectedAt || "";
  const bTime = b.connectedAt || "";
  return aTime > bTime ? -1 : 1;
};

const compareAdminConnectionRows = (a: WebsocketConnectionRow, b: WebsocketConnectionRow) => {
  if (!!a.isOnline !== !!b.isOnline) {
    return a.isOnline ? -1 : 1;
  }

  return a.isOnline ? compareRuntimeConnections(a, b) : compareNodeConnections(a, b);
};

const fetchRuntimeConnections = async () => {
  runtimeLoading.value = true;
  try {
    const response = await WebsocketApi.getRuntimeWebsocketConnectionViews();
    runtimeConnections.value = resolveListResponse(response)
      .map((item) => ({
        ...item,
        isOnline: item.isOnline !== false,
        nodeStatus: item.nodeStatus || "online",
      }))
      .sort(compareRuntimeConnections);
  } catch (error: any) {
    message.error(error?.message ?? "获取运行时连接失败");
  } finally {
    runtimeLoading.value = false;
  }
};

const fetchNodeConnections = async () => {
  nodeLoading.value = true;
  try {
    const response = await WebsocketApi.getWebsocketConnectionViews();
    nodeConnections.value = resolveListResponse(response)
      .map((item) => ({
        ...item,
        isOnline: item.isOnline !== false,
        nodeStatus: item.nodeStatus || (item.isOnline ? "online" : "offline"),
      }))
      .sort(compareNodeConnections);
  } catch (error: any) {
    message.error(error?.message ?? "获取客户端节点失败");
  } finally {
    nodeLoading.value = false;
  }
};

const refreshConnectionData = async () => {
  await Promise.allSettled([fetchRuntimeConnections(), fetchNodeConnections()]);
};

const formatSchedule = (task: ScheduledTask) => {
  if (task.type === "cron") {
    return task.schedule;
  }
  const hours = parseFloat(task.schedule);
  if (hours >= 24) {
    return `每 ${Math.floor(hours / 24)} 天`;
  }
  if (hours >= 1) {
    return `每 ${hours} 小时`;
  }
  return `每 ${Math.floor(hours * 60)} 分钟`;
};

const initializeFunctionList = () => {
  functionList.value = [
    {
      id: "browser-automation",
      name: "浏览器自动化",
      description: "打开浏览器自动化页面查看当前插件能力与运行时状态。",
      icon: "ep:monitor",
      handler: async () => {
        await router.push("/external/browser-automation");
      },
      schedule: null,
    },
    {
      id: "ps-automation",
      name: "套图制作",
      description: "打开套图制作页面查看 PS 自动化相关配置与状态。",
      icon: "ep:picture-filled",
      handler: async () => {
        await router.push("/external/ps-automation");
      },
      schedule: null,
    },
    {
      id: "google-art",
      name: "Google Art",
      description: "打开 Google Art 页面查看当前插件侧的运行能力。",
      icon: "ep:brush-filled",
      handler: async () => {
        await router.push("/external/google-art");
      },
      schedule: null,
    },
  ];
};

const loadFunctionSchedule = async () => {
  if (!currentConnection.value) return;

  await Promise.all(
    functionList.value.map(async (func) => {
      if (!func.scheduleCommand) {
        func.schedule = null;
        return;
      }
      try {
        const response = await WebsocketApi.getScheduleTask(
          currentConnection.value!.id,
          func.scheduleCommand,
        );
        func.schedule = response.data;
      } catch {
        func.schedule = null;
      }
    }),
  );
};

const canControlConnection = (row?: Partial<WebsocketConnectionRow> | null) => {
  return resolveConnectionSourceKey(row) === "extension";
};

const handleOperationCommand = (command: string, row: WebsocketConnectionRow) => {
  if (command === "send-message") {
    handleSendMessage(row);
  } else if (command === "control") {
    void handleControl(row);
  } else if (command === "disconnect") {
    void handleDisconnect(row);
  }
};

const handleControl = async (row: WebsocketConnectionRow) => {
  if (!row.isOnline) {
    message.warning("离线连接暂时无法操控");
    return;
  }
  if (!canControlConnection(row)) {
    message.warning("当前连接类型不支持操控");
    return;
  }
  currentConnection.value = row;
  controlDialogVisible.value = true;
  await loadFunctionSchedule();
};

const handleSendMessage = (row: WebsocketConnectionRow) => {
  if (!row.isOnline) {
    message.warning("离线连接暂时无法发送消息");
    return;
  }
  currentConnection.value = row;
  messageContent.value = "";
  messageEvent.value = "admin-message";
  sendMessageDialogVisible.value = true;
};

const handleDisconnect = async (row: WebsocketConnectionRow) => {
  if (!row.isOnline) {
    message.warning("离线连接无需断开");
    return;
  }

  const confirmText = isCurrentAdminConnection(row)
    ? `确认断开当前后台连接 ${row.id} 吗？断开后本页面会立即失去实时连接。`
    : `确认强制断开连接 ${row.id} 吗？客户端如果开启自动重连，稍后可能会重新连回。`;

  await message.confirm(confirmText, "强制断开");

  try {
    const response = await WebsocketApi.disconnectWebsocketConnection(row.id);
    if (response.success) {
      message.success(response.message || "连接已强制断开");
      await refreshConnectionData();
      return;
    }
    message.error(response.message || "连接断开失败");
  } catch (error: any) {
    message.error(error?.response?.data?.message || error?.message || "连接断开失败");
  }
};

const handleFunctionOperation = (command: string, row: ExtensionFunctionItem) => {
  if (command === "open") {
    void row.handler();
  }
};

const handleConfirmSendMessage = async () => {
  if (!currentConnection.value) {
    return;
  }

  if (!messageContent.value.trim()) {
    message.warning("请输入消息内容");
    return;
  }

  sendMessageDialogLoading.value = true;
  try {
    let data: any = messageContent.value;
    try {
      data = JSON.parse(messageContent.value);
    } catch {
      // keep plain text
    }

    const response = await WebsocketApi.sendMessageToConnection(
      currentConnection.value.id,
      data,
      messageEvent.value || undefined,
    );

    const result = response as any;
    if (result?.success === false || result?.data?.success === false) {
      const errorMsg = result?.message || result?.data?.message || "消息发送失败";
      message.error(errorMsg);
      return;
    }

    message.success("消息发送成功");
    sendMessageDialogVisible.value = false;
    messageContent.value = "";
  } catch (error: any) {
    message.error(error?.response?.data?.message || error?.message || "消息发送失败");
  } finally {
    sendMessageDialogLoading.value = false;
  }
};

const functionGridOptions = ref<VxeGridProps<any>>({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: {
    keyField: "id",
    isHover: true,
  },
  columns: [
    { type: "seq", width: 60, title: "序号", align: "center" },
    {
      field: "icon",
      title: "",
      width: 80,
      align: "center",
      slots: { default: "icon_default" },
    },
    {
      field: "name",
      title: "功能名称",
      minWidth: 200,
      showOverflow: "tooltip",
    },
    {
      field: "description",
      title: "功能描述",
      minWidth: 260,
      showOverflow: "tooltip",
    },
    {
      field: "schedule",
      title: "定时任务",
      minWidth: 200,
      align: "center",
      slots: { default: "schedule_default" },
    },
    buildOperationColumn("operation_default"),
  ],
});

const runtimeGridOptions = ref<VxeGridProps<WebsocketConnectionRow>>({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: {
    keyField: "id",
  },
  columns: [
    { type: "seq", width: 60, title: "序号", align: "center" },
    {
      field: "isOnline",
      title: "状态",
      width: 100,
      align: "center",
      slots: { default: "status_default" },
    },
    {
      field: "clientSource",
      title: "连接类型",
      width: 170,
      align: "center",
      slots: { default: "clientSource_default" },
    },
    {
      field: "user",
      title: "用户信息",
      minWidth: 220,
      showOverflow: "tooltip",
      formatter: ({ row }) => formatUserFromConnection(row as WebsocketConnectionRow),
    },
    {
      field: "id",
      title: "连接 ID",
      minWidth: 240,
      showOverflow: "tooltip",
    },
    {
      field: "connectedAt",
      title: "最近在线",
      minWidth: 180,
      slots: { default: "connectedAt_default" },
    },
    {
      field: "lastOfflineAt",
      title: "断线时间",
      minWidth: 180,
      slots: { default: "lastOfflineAt_default" },
    },
    {
      field: "duration",
      title: "在线时长",
      minWidth: 130,
      slots: { default: "duration_default" },
    },
    {
      field: "ip",
      title: "IP 地址",
      minWidth: 160,
      showOverflow: "tooltip",
      slots: { default: "ip_default" },
    },
    {
      field: "clientInfo",
      title: "设备与环境",
      minWidth: 460,
      showOverflow: "tooltip",
      slots: { default: "clientInfo_default" },
    },
    {
      field: "query",
      title: "附加参数",
      minWidth: 240,
      showOverflow: "tooltip",
      slots: { default: "query_default" },
    },
    buildOperationColumn("operation_default"),
  ],
});

watchEffect(() => {
  const maxHeight = height.value - 240;
  runtimeGridOptions.value.maxHeight = maxHeight;
  functionGridOptions.value.maxHeight = maxHeight;
});

watch(autoRefresh, (value) => {
  if (refreshTimer.value !== null) {
    window.clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
  if (value) {
    refreshTimer.value = window.setInterval(() => {
      void refreshConnectionData();
    }, refreshInterval);
  }
});

onMounted(() => {
  initializeFunctionList();
  void refreshConnectionData();
});

onBeforeUnmount(() => {
  if (refreshTimer.value !== null) {
    window.clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
});
</script>

<style scoped>
:deep(.websocket-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.websocket-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.websocket-page .list-page-filter--flat) {
  padding-bottom: 10px;
}

.websocket-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px 16px;
}

.websocket-toolbar__summary {
  min-width: 0;
  flex: 1 1 320px;
}

.websocket-toolbar__title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.websocket-toolbar__description {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.websocket-toolbar__meta {
  display: flex;
  flex: 0 1 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
}

.websocket-toolbar__meta-item {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border: 1px solid var(--app-content-border-color);
  border-radius: 8px;
  background: var(--app-content-surface-muted-color);
}

.websocket-toolbar__meta-item--switch {
  padding-right: 6px;
}

.websocket-toolbar__meta-label {
  font-size: 11px;
  line-height: 1;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.websocket-toolbar__meta-value {
  font-size: 11px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.websocket-toolbar__actions {
  display: inline-flex;
  align-items: center;
}

.admin-connection-id {
  font-size: 11px;
  color: var(--el-text-color-primary);
  font-family: "Monaco", "Menlo", monospace;
}

.common-table {
  border-radius: 8px;
  overflow: hidden;
}

.websocket-source-tags {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.control-dialog {
  .el-dialog__body {
    padding: 0;
    height: calc(100vh - 120px);
    overflow: hidden;
  }
}

.control-dialog-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.control-dialog-header {
  padding: 12px 20px;
  background: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.control-connection-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.connection-info-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.connection-id {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;

  .label {
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }

  .value {
    color: var(--el-text-color-primary);
    font-family: "Monaco", "Menlo", monospace;
    font-size: 11px;
  }
}

.connection-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 11px;
  color: var(--el-text-color-regular);

  .meta-item {
    display: flex;
    align-items: center;
  }
}

.connection-info-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.connection-time {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.control-dialog-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: var(--el-bg-color);
}

.function-grid {
  height: 100%;
}

.function-icon-cell {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary-light-9);
  border-radius: 6px;
  margin: 0 auto;

  .iconify {
    font-size: 20px;
    color: var(--el-color-primary);
  }
}

.schedule-status-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;

  .schedule-status-row {
    display: flex;
    align-items: center;
    gap: 8px;

    .schedule-info-text {
      font-size: 12px;
      color: var(--el-text-color-regular);
    }
  }
}

.schedule-type-text {
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .websocket-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .websocket-toolbar__meta {
    justify-content: flex-start;
  }

  .websocket-toolbar__meta-item,
  .websocket-toolbar__actions {
    width: 100%;
  }

  .websocket-toolbar__actions :deep(.el-button) {
    width: 100%;
  }
}
</style>
