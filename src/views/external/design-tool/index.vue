<template>
  <div class="dt-page">
    <!-- 紧凑工具栏 -->
    <div class="dt-toolbar">
      <div class="dt-toolbar__left">
        <span class="dt-toolbar__title">设计工具连接</span>
        <el-tag :type="adminWsStatusTag.type" size="small" effect="plain">
          {{ adminWsStatusTag.text }}
        </el-tag>
        <span class="dt-toolbar__count">{{ toolConnections.length }} 台在线</span>
        <span v-if="browserDistributionText !== '-'" class="dt-toolbar__meta">{{ browserDistributionText }}</span>
      </div>
      <div class="dt-toolbar__right">
        <span class="dt-toolbar__time">{{ lastRefreshText }}</span>
        <el-button size="small" type="primary" @click="openLaunchDialog">
          打开设计工具
        </el-button>
        <el-switch v-model="autoRefresh" size="small" inline-prompt active-text="自动" inactive-text="手动" />
        <el-button size="small" :loading="refreshing" @click="refreshConnections" circle>
          <Icon icon="ep:refresh" />
        </el-button>
      </div>
    </div>

    <!-- 表格 -->
    <el-table
      v-if="toolConnections.length > 0 || initialLoading"
      :data="toolConnections"
      v-loading="initialLoading"
      class="dt-table"
      size="small"
      :row-class-name="tableRowClass"
    >
      <el-table-column label="实例" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          <div class="cell-instance">
            <div class="cell-instance__main">
              <span class="cell-instance__dot" :class="row.isOnline === false ? 'cell-instance__dot--off' : ''" />
              <span class="cell-instance__name">{{ getToolName(row) }}</span>
              <span v-if="row.clientInfo?.app?.version" class="cell-instance__ver">{{ row.clientInfo.app.version }}</span>
            </div>
            <div class="cell-instance__id">{{ row.id }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="环境" min-width="240" show-overflow-tooltip>
        <template #default="{ row }">
          <div class="cell-env">
            <span>{{ formatBrowser(row) }} · {{ formatOs(row) }}</span>
            <span class="cell-env__sub">{{ row.clientInfo?.machine?.code || '-' }} · {{ formatScreen(row) }}</span>
            <div v-if="getLaunchBinding(row)" class="cell-launch">
              <el-tag size="small" type="primary" effect="plain">客户端环境</el-tag>
              <span class="cell-launch__text">{{ formatLaunchBinding(row) }}</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <span v-if="isStreaming(row)" class="cell-status cell-status--active">● 共享中</span>
          <span v-else class="cell-status cell-status--idle">空闲</span>
        </template>
      </el-table-column>

      <el-table-column label="连接" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">
          <div class="cell-conn">
            <span>{{ formatDateTime(row.connectedAt) }}</span>
            <span class="cell-conn__sub">{{ row.connectedAt ? formatPast(row.connectedAt) : '-' }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="AI Agent" min-width="220">
        <template #default="{ row }">
          <div v-if="getAgent(row)" class="cell-agent">
            <div class="cell-agent__header">
              <el-tag :type="agentTagType(getAgent(row).agentState)" size="small" effect="plain">
                {{ agentLabel(getAgent(row).agentState) }}
              </el-tag>
              <el-tag v-if="getAgent(row).available" type="success" size="small" effect="plain">可制作</el-tag>
              <span class="cell-agent__time">{{ formatAgentTime(getAgent(row).updatedAt) }}</span>
            </div>
            <!-- 只在非空闲状态时显示详细信息，单行紧凑布局 -->
            <template v-if="getAgent(row).agentState !== 'idle'">
              <div v-if="getAgent(row).userInput" class="cell-agent__compact">
                <span class="cell-agent__v cell-agent__v--hl">{{ getAgent(row).userInput }}</span>
              </div>
              <div v-if="getAgent(row).plan" class="cell-agent__compact">
                <span class="cell-agent__v">
                  {{ getAgent(row).plan.goal }}
                  <b class="cell-agent__p">{{ getAgent(row).plan.currentStep }}/{{ getAgent(row).plan.totalSteps }}</b>
                </span>
              </div>
              <div v-if="getAgent(row).step" class="cell-agent__compact">
                <span class="cell-agent__v">{{ getAgent(row).step }}</span>
              </div>
              <div v-if="getAgent(row).lastToolCall" class="cell-agent__compact">
                <span class="cell-agent__v cell-agent__v--mono">{{ getAgent(row).lastToolCall }}</span>
              </div>
              <div v-if="getAgent(row).lastError" class="cell-agent__compact">
                <span class="cell-agent__v cell-agent__v--err">{{ getAgent(row).lastError }}</span>
              </div>
            </template>
          </div>
          <span v-else class="cell-empty">-</span>
        </template>
      </el-table-column>

      <el-table-column label="" width="60" fixed="right" align="center">
        <template #default="{ row }">
          <div class="cell-actions">
            <el-dropdown trigger="click" @command="(cmd: string) => handleAction(cmd, row)">
              <el-button size="small" text circle :disabled="row.isOnline === false">
                <Icon icon="ep:more-filled" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="control">操控面板</el-dropdown-item>
                  <el-dropdown-item command="clear" divided>清空对话</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-else description="当前没有已连接的设计工具" :image-size="60" />

    <!-- 操控面板 -->
    <el-dialog
      v-model="controlPanelVisible"
      class="cp-dialog"
      fullscreen
      :show-close="false"
      :close-on-click-modal="false"
      destroy-on-close
      @close="onControlPanelClose"
    >
      <div v-if="controlTarget" class="cp">
        <!-- 顶部工具栏 -->
        <div class="cp-topbar">
          <span class="cp-topbar__title">设计工具</span>
          <el-tag v-if="getAgent(controlTarget)" :type="agentTagType(getAgent(controlTarget).agentState)" size="small">
            {{ agentLabel(getAgent(controlTarget).agentState) }}
          </el-tag>
          <span class="cp-topbar__step">{{ getAgent(controlTarget)?.step || '' }}</span>
          <span class="cp-spacer" />
          <el-tag v-if="streamStatus === 'streaming'" type="success" size="small" effect="plain">共享中</el-tag>
          <el-button size="small" text :loading="conversationLoading" @click="fetchConversation(controlTarget!)">刷新</el-button>
          <el-button size="small" text class="cp-topbar__hide-mobile" @click="copyConversation">复制</el-button>
          <el-button size="small" text circle @click="controlPanelVisible = false">
            <Icon icon="ep:close" />
          </el-button>
        </div>

        <!-- 左右分栏 -->
        <div class="cp-main">
          <!-- 左侧：日志 + 输入 -->
          <div class="cp-left">
            <div v-loading="conversationLoading" class="cp-log-body">
              <template v-if="conversationData?.conversation?.length">
                <div
                  v-for="(msg, idx) in conversationData.conversation"
                  :key="msg.id || idx"
                  class="conv-msg"
                  :class="`conv-msg--${msg.role}`"
                >
                  <div class="conv-msg__header">
                    <span class="conv-msg__role">{{ msg.role }}</span>
                    <span v-if="msg.meta?.iteration" class="conv-msg__iter">第{{ msg.meta.iteration }}轮</span>
                    <span v-if="msg.meta?.duration" class="conv-msg__dur">{{ msg.meta.duration }}ms</span>
                    <span class="conv-msg__time">{{ formatMs(msg.timestamp) }}</span>
                  </div>
                  <div v-if="msg.content" class="conv-msg__body">{{ msg.content }}</div>
                  <div v-if="msg.tool_calls?.length" class="conv-msg__tools">
                    <div v-for="tc in msg.tool_calls" :key="tc.id" class="conv-tool">
                      <div class="conv-tool__name">{{ tc.name }}</div>
                      <pre class="conv-tool__args">{{ formatJson(tc.arguments) }}</pre>
                    </div>
                  </div>
                  <div v-if="msg.role === 'tool' && msg.meta?.toolResult" class="conv-msg__result">
                    <span :class="msg.meta.toolResult.success ? 'conv-ok' : 'conv-err'">
                      {{ msg.meta.toolResult.success ? '✅' : '❌' }}
                    </span>
                    <pre class="conv-tool__args">{{ formatJson(msg.meta.toolResult) }}</pre>
                  </div>
                  <div v-if="msg.role === 'tool' && msg.meta?.toolArgs" class="conv-msg__args">
                    <span class="conv-label">调用参数:</span>
                    <pre class="conv-tool__args">{{ formatJson(msg.meta.toolArgs) }}</pre>
                  </div>
                  <div v-if="msg.meta?.plan" class="conv-msg__plan">
                    <span class="conv-label">计划:</span>
                    {{ msg.meta.plan.goal }} ({{ msg.meta.plan.currentStep || 0 }}/{{ msg.meta.plan.totalSteps }}步)
                  </div>
                </div>
              </template>
              <el-empty v-else-if="!conversationLoading" description="暂无对话数据" :image-size="36" />
            </div>

            <!-- 指令输入 -->
            <div class="cp-input">
              <div class="cp-input-row">
                <el-input
                  v-model="remoteMessage"
                  type="textarea"
                  :rows="2"
                  placeholder="输入设计需求（Ctrl+Enter 发送）"
                  :disabled="remoteSending"
                  @keydown.enter.ctrl="sendRemoteCommand"
                />
                <el-button class="cp-send-btn" type="primary" :loading="remoteSending" :disabled="!remoteMessage.trim()" @click="sendRemoteCommand">
                  发送
                </el-button>
              </div>
              <div v-if="targetResults.length" class="cp-results">
                <div v-for="r in targetResults" :key="r.requestId" class="cp-result" :class="r.success ? 'cp-result--ok' : 'cp-result--err'">
                  <el-tag :type="r.success ? 'success' : 'danger'" size="small" effect="plain">{{ r.success ? '完成' : '失败' }}</el-tag>
                  <span v-if="r.message" class="cp-result__msg">{{ r.message }}</span>
                  <span v-if="r.error" class="cp-result__err">{{ r.error }}</span>
                  <span class="cp-result__time">{{ formatAgentTime(r.reportedAt) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：监控画面（常驻） -->
          <div class="cp-right">
            <div class="cp-video-bar">
              <el-tag v-if="monitorStatus.connecting" type="warning" size="small">连接中...</el-tag>
              <el-tag v-else-if="monitorStatus.connected" type="success" size="small" effect="plain">已连接</el-tag>
              <span v-else class="cp-video-idle">等待工具端共享</span>
              <span v-if="monitorStatus.error" class="cp-err">{{ monitorStatus.error }}</span>
              <span class="cp-spacer" />
              <el-button v-if="monitorStatus.connected || monitorStatus.connecting" size="small" text @click="stopMonitoring">断开</el-button>
              <el-button v-else size="small" text type="primary" @click="startMonitoringFromPanel">连接</el-button>
            </div>
            <div class="cp-video-box">
              <video ref="monitorVideoRef" class="cp-video" autoplay playsinline muted />
              <div v-if="monitorStatus.connecting" class="cp-video-overlay">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>等待选择共享窗口...</span>
              </div>
              <div v-else-if="!monitorStatus.connected" class="cp-video-overlay">
                <span class="cp-video-hint">工具端共享屏幕后，点击"连接"查看</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="launchDialogVisible"
      title="打开设计工具"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="目标客户端">
          <el-select
            v-model="launchClientId"
            placeholder="选择在线客户端"
            filterable
            style="width: 100%"
            :loading="launchClientsLoading"
          >
            <el-option
              v-for="client in launchClientOptions"
              :key="client.id"
              :label="formatLaunchClientLabel(client)"
              :value="client.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="浏览器环境">
          <el-select
            v-model="launchProfileId"
            placeholder="请选择浏览器环境"
            filterable
            style="width: 100%"
            :disabled="!launchClientId"
            popper-class="design-tool-launch-profile-popper"
          >
            <el-option
              v-for="profile in launchProfileOptions"
              :key="profile.profileId"
              :label="profile.label"
              :value="profile.profileId"
            >
              <div class="launch-profile-option" :class="{ 'launch-profile-option--busy': profile.busy }">
                <div class="launch-profile-option__main">
                  <span class="launch-profile-option__name">{{ profile.name }}</span>
                  <span class="launch-profile-option__id">{{ profile.profileId }}</span>
                </div>
                <span class="launch-profile-option__meta">
                  <el-tag v-if="profile.isActive" size="small" type="success" effect="plain">当前</el-tag>
                  <el-tag v-if="profile.busy" size="small" type="warning" effect="plain">执行中</el-tag>
                  <el-tag v-else-if="profile.connected" size="small" type="info" effect="plain">已打开</el-tag>
                  <small>{{ profile.description }}</small>
                </span>
              </div>
            </el-option>
          </el-select>
          <div v-if="launchClientId && !launchProfileOptions.length" class="launch-form-tip">
            当前客户端没有上报浏览器环境，请先在浏览器自动化/Temu 工具集中同步或创建环境。
          </div>
          <div v-else-if="hasBusyLaunchProfiles" class="launch-form-tip">
            环境执行发布任务时仍可打开设计工具，打开操作不会中断当前任务。
          </div>
        </el-form-item>
        <el-form-item label="初始指令">
          <el-input
            v-model="launchPrompt"
            type="textarea"
            :rows="3"
            placeholder="可选：打开后要执行的设计需求，后续会自动交给 tool agent"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="launchDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="launchSending"
          :disabled="!launchClientId || !launchProfileId"
          @click="sendLaunchDesignTool"
        >
          打开
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from "vue";
import { Loading } from "@element-plus/icons-vue";
import {
  getMyOnlineRuntimeConnectionViews,
  openDesignToolOnClient,
  type WebsocketConnectionVO,
} from "@/api/system/websocket";
import {
  websocketClient,
  type RuntimeConnectionChangedEvent,
  type ServiceCommandResultEvent,
} from "@/services/websocketClient";
import { formatDate, formatPast } from "@/utils/formatTime";
import request from "@/config/axios";
import { getAccessToken } from "@/utils/auth";
import { ElMessage } from "element-plus";
import { useClientNodeStore } from "@/store/modules/clientNode";
import { normalizeBrowserAutomationProfilesPayload } from "@/services/browserAutomationExecutionContext";
import { resolveDesignToolUrl } from "@/config/toolRegistry";

defineOptions({ name: "DesignToolConnection" });

const DESIGN_TOOL_SOURCES = new Set(["设计工具", "设计端"]);
const CLIENT_SOURCES = new Set(["客户端"]);
const AUTO_REFRESH_INTERVAL_MS = 60_000; // WebSocket 实时推送为主，60s 轮询为兆底
type TagType = "success" | "warning" | "danger" | "info" | "primary";

const initialLoading = ref(true);
const refreshing = ref(false);
const autoRefresh = ref(true);
const toolConnections = ref<WebsocketConnectionVO[]>([]);
const refreshTimer = ref<number | null>(null);
const lastRefreshAt = ref<string | null>(null);
const launchDialogVisible = ref(false);
const launchClientsLoading = ref(false);
const launchSending = ref(false);
const launchClientId = ref("");
const launchProfileId = ref("");
const defaultDesignToolUrl = resolveDesignToolUrl();
const launchPrompt = ref("");
const launchClientOptions = ref<WebsocketConnectionVO[]>([]);
const clientNodeStore = useClientNodeStore();
const pendingLaunchCommandId = ref("");
const pendingLaunchClientId = ref("");
const pendingLaunchProfileId = ref("");
let launchResultTimer: number | null = null;

// 操控面板状态
const controlPanelVisible = ref(false);
const controlTarget = ref<WebsocketConnectionVO | null>(null);
const monitorVideoRef = ref<HTMLVideoElement | null>(null);
const monitorStatus = ref({
  connecting: false,
  connected: false,
  error: null as string | null,
  designToolPeerId: null as string | null,
});
let monitorSessionId = 0;

const selectedLaunchClient = computed(() =>
  launchClientOptions.value.find((item) => item.id === launchClientId.value) || null,
);

const getBrowserAutomationRuntime = (row?: WebsocketConnectionVO | null) =>
  row?.clientInfo?.services?.["browser-automation"] ||
  row?.clientInfo?.services?.uploader ||
  null;

const launchProfileOptions = computed(() => {
  const runtime = getBrowserAutomationRuntime(selectedLaunchClient.value) as any;
  const profilePayload = normalizeBrowserAutomationProfilesPayload(runtime?.details || {});
  const profiles = Array.isArray(profilePayload.items) ? profilePayload.items : [];
  const instances = Array.isArray(runtime?.details?.browserInstances)
    ? runtime.details.browserInstances
    : Array.isArray(runtime?.details?.instances)
      ? runtime.details.instances
      : [];
  const instanceMap = new Map<string, any>(
    instances
      .map((item: any) => [String(item?.profileId || item?.id || "").trim(), item] as const)
      .filter(([profileId]) => !!profileId),
  );

  return profiles
    .map((profile: any) => {
      const profileId = String(profile?.id || profile?.profileId || "").trim();
      if (!profileId) return null;
      const name = String(profile?.name || profile?.profileName || profileId).trim();
      const instance = instanceMap.get(profileId) || null;
      const busy = instance?.busy === true || instance?.state === "busy";
      const connected = instance?.connected === true || instance?.hasInstance === true;
      const pageCount = typeof instance?.pageCount === "number" ? instance.pageCount : null;
      const isActive = profileId === String(profilePayload.activeProfileId || "").trim();
      return {
        profileId,
        name,
        label: `${name} (${profileId})`,
        description: busy
          ? pageCount !== null
            ? `任务执行中，${pageCount} 个页面`
            : "任务执行中，可继续打开"
          : connected
            ? pageCount !== null
              ? `浏览器已打开，${pageCount} 个页面`
              : "浏览器已打开"
            : isActive
              ? "当前活动环境，执行时复用"
              : "未打开，执行时自动拉起",
        busy,
        connected,
        isActive,
      };
    })
    .filter(Boolean) as Array<{ profileId: string; name: string; label: string; description: string; busy: boolean; connected: boolean; isActive: boolean }>;
});

const hasBusyLaunchProfiles = computed(() => launchProfileOptions.value.some((item) => item.busy));

// 工具端视频流状态（从 clientInfo.screenSharing 读取）
const isStreaming = (row: WebsocketConnectionVO) => !!(row.clientInfo as any)?.screenSharing;

// 工具端视频流状态（当前操控面板目标）
const streamStatus = computed(() => {
  if (!controlTarget.value) return "idle";
  return isStreaming(controlTarget.value) ? "streaming" : "idle";
});

const adminWsStatusTag = computed<{ text: string; type: TagType }>(() => {
  const s = websocketClient.state.status;
  const m: Record<string, { text: string; type: TagType }> = {
    connected: { text: "已连接", type: "success" },
    connecting: { text: "连接中", type: "warning" },
    reconnecting: { text: "重连中", type: "warning" },
    error: { text: "异常", type: "danger" },
    disconnected: { text: "已断开", type: "info" },
  };
  return m[s] || { text: "未连接", type: "info" };
});

const browserDistributionText = computed(() => {
  if (!toolConnections.value.length) return "-";
  const c = new Map<string, number>();
  toolConnections.value.forEach((r) => {
    const n = r.clientInfo?.browser?.name?.trim() || "未知";
    c.set(n, (c.get(n) || 0) + 1);
  });
  return Array.from(c.entries()).sort((a, b) => b[1] - a[1]).map(([n, v]) => `${n} ${v}`).join(" / ");
});

const lastRefreshText = computed(() => {
  if (!lastRefreshAt.value) return initialLoading.value ? "读取中" : "-";
  return formatDateTime(lastRefreshAt.value);
});

const isDesignToolConnection = (row?: WebsocketConnectionVO | null) => {
  const src = row?.clientSource || row?.query?.clientSource;
  const s = Array.isArray(src) ? src[0] : src || "";
  return (
    DESIGN_TOOL_SOURCES.has(String(s).trim()) ||
    String(row?.clientInfo?.app?.name || "").trim() === "yishe-tool" ||
    String(row?.id || "").trim().startsWith("designtool-")
  );
};

const isClientConnection = (row?: WebsocketConnectionVO | null) => {
  const src = row?.clientSource || row?.query?.clientSource;
  const s = Array.isArray(src) ? src[0] : src || "";
  return CLIENT_SOURCES.has(String(s).trim());
};

const normalizeRows = (res: unknown): WebsocketConnectionVO[] => {
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object" && Array.isArray((res as any).data)) return (res as any).data;
  return [];
};

const refreshConnections = async () => {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    const res = await getMyOnlineRuntimeConnectionViews();
    toolConnections.value = normalizeRows(res)
      .filter((r) => isDesignToolConnection(r))
      .sort((a, b) => ((a.connectedAt || "") > (b.connectedAt || "") ? -1 : 1));
    lastRefreshAt.value = new Date().toISOString();
  } finally {
    refreshing.value = false;
    initialLoading.value = false;
  }
};

const refreshLaunchClients = async () => {
  launchClientsLoading.value = true;
  try {
    await clientNodeStore.refresh({ summary: false });
    launchClientOptions.value = clientNodeStore.clients
      .filter((r) => r.isOnline !== false && isClientConnection(r))
      .sort((a, b) => ((a.connectedAt || "") > (b.connectedAt || "") ? -1 : 1));
    if (!launchClientId.value && launchClientOptions.value.length) {
      launchClientId.value = launchClientOptions.value[0].id;
    } else if (
      launchClientId.value &&
      !launchClientOptions.value.some((item) => item.id === launchClientId.value)
    ) {
      launchClientId.value = launchClientOptions.value[0]?.id || "";
    }
  } finally {
    launchClientsLoading.value = false;
  }
};

const formatLaunchClientLabel = (r: WebsocketConnectionVO) => {
  const machine = r.clientInfo?.machine?.code || r.clientInfo?.machineCode || "";
  const workspace = r.clientInfo?.workspaceDirectory || "";
  return [machine || r.id, workspace].filter(Boolean).join(" · ");
};

const openLaunchDialog = () => {
  launchDialogVisible.value = true;
  void refreshLaunchClients();
};

watch(
  () => [launchClientId.value, launchProfileOptions.value.map((item) => item.profileId).join("|")],
  () => {
    if (!launchClientId.value) {
      launchProfileId.value = "";
      return;
    }
    if (
      launchProfileId.value &&
      launchProfileOptions.value.some((item) => item.profileId === launchProfileId.value)
    ) {
      return;
    }
    launchProfileId.value =
      launchProfileOptions.value.find((item) => item.isActive)?.profileId ||
      launchProfileOptions.value[0]?.profileId ||
      "";
  },
);

const selectedLaunchProfile = computed(
  () => launchProfileOptions.value.find((item) => item.profileId === launchProfileId.value) || null,
);

const clearLaunchResultTimer = () => {
  if (launchResultTimer !== null) {
    window.clearTimeout(launchResultTimer);
    launchResultTimer = null;
  }
};

const finishLaunchWaiting = () => {
  pendingLaunchCommandId.value = "";
  pendingLaunchClientId.value = "";
  pendingLaunchProfileId.value = "";
  clearLaunchResultTimer();
  launchSending.value = false;
};

const getCommandResultMessage = (event: ServiceCommandResultEvent) => {
  const data = event.data && typeof event.data === "object" ? event.data : {};
  const result = data.result && typeof data.result === "object" ? data.result : {};
  return (
    event.message ||
    event.error ||
    result.message ||
    data.message ||
    "客户端打开设计工具失败"
  );
};

const isCommandResultFailure = (event: ServiceCommandResultEvent) => {
  if (event.success === false) {
    return true;
  }

  const data = event.data && typeof event.data === "object" ? event.data : {};
  const result = data.result && typeof data.result === "object" ? data.result : {};
  return (
    data.success === false ||
    result.success === false ||
    !!event.error ||
    !!event.errorDetail ||
    !!result.error ||
    !!result.errorDetail ||
    !!data.error ||
    !!data.errorDetail
  );
};

const getLaunchCommandId = (response: any) => {
  return String(response?.data?.commandId || response?.commandId || response?.data?.data?.commandId || "").trim();
};

const sendLaunchDesignTool = async () => {
  const token = String(getAccessToken() || "").trim();
  if (!token) {
    ElMessage.warning("当前后台没有可用 token，请重新登录");
    return;
  }
  if (!launchClientId.value) {
    ElMessage.warning("请选择目标客户端");
    return;
  }
  if (!launchProfileId.value) {
    ElMessage.warning("请选择浏览器环境");
    return;
  }

  launchSending.value = true;
  try {
    const res: any = await openDesignToolOnClient({
      clientId: launchClientId.value,
      token,
      profileId: launchProfileId.value,
      profileName: selectedLaunchProfile.value?.name || selectedLaunchProfile.value?.label,
      machineCode: selectedLaunchClient.value?.clientInfo?.machine?.code,
      toolUrl: defaultDesignToolUrl,
      prompt: launchPrompt.value,
    });
    if (res?.success === false) {
      throw new Error(res?.message || "打开设计工具失败");
    }
    const commandId = getLaunchCommandId(res);
    if (!commandId) {
      throw new Error(res?.message || "打开命令没有返回 commandId");
    }
    pendingLaunchCommandId.value = commandId;
    pendingLaunchClientId.value = launchClientId.value;
    pendingLaunchProfileId.value = launchProfileId.value;
    ElMessage.success("打开命令已发送，等待客户端执行结果");
    clearLaunchResultTimer();
    launchResultTimer = window.setTimeout(() => {
      if (pendingLaunchCommandId.value === commandId) {
        const timeoutText = [
          "客户端执行结果等待超时",
          `commandId=${commandId}`,
          `clientId=${pendingLaunchClientId.value || "-"}`,
          `profileId=${pendingLaunchProfileId.value || "-"}`,
        ].join("，");
        finishLaunchWaiting();
        ElMessage.warning(timeoutText);
      }
    }, 30_000);
  } catch (error: any) {
    pendingLaunchCommandId.value = "";
    pendingLaunchClientId.value = "";
    pendingLaunchProfileId.value = "";
    clearLaunchResultTimer();
    ElMessage.error(error?.message || "打开设计工具失败");
    launchSending.value = false;
  }
};

const onServiceCommandResult = (event: ServiceCommandResultEvent) => {
  if (!pendingLaunchCommandId.value || event.commandId !== pendingLaunchCommandId.value) {
    return;
  }

  finishLaunchWaiting();
  if (!isCommandResultFailure(event)) {
    ElMessage.success(event.message || "设计工具已在所选浏览器环境中打开");
    launchDialogVisible.value = false;
    void refreshConnections();
    return;
  }

  ElMessage.error(getCommandResultMessage(event));
};

const resetLaunchState = () => {
  finishLaunchWaiting();
};

const handleLaunchDialogClosed = () => {
  if (!pendingLaunchCommandId.value) {
    return;
  }
  resetLaunchState();
};

watch(launchDialogVisible, (visible) => {
  if (!visible) {
    handleLaunchDialogClosed();
  }
});

watch(launchClientId, () => {
  if (pendingLaunchCommandId.value) {
    resetLaunchState();
  }
});

watch(launchProfileId, () => {
  if (pendingLaunchCommandId.value) {
    resetLaunchState();
  }
});

const clearLaunchStateOnUnmount = () => {
  clearLaunchResultTimer();
  pendingLaunchCommandId.value = "";
  pendingLaunchClientId.value = "";
  pendingLaunchProfileId.value = "";
};

const tableRowClass = ({ row }: { row: WebsocketConnectionVO }) =>
  row.isOnline === false ? "dt-row--offline" : "";

const getToolName = (r: WebsocketConnectionVO) => {
  const name = r.clientInfo?.app?.name || "";
  if (name === "yishe-tool" || !name) return "设计工具";
  return name;
};

const formatBrowser = (r: WebsocketConnectionVO) => {
  const b = r.clientInfo?.browser;
  return b?.name ? (b.version ? `${b.name} ${b.version}` : b.name) : "-";
};

const formatOs = (r: WebsocketConnectionVO) => {
  const o = r.clientInfo?.os;
  return o?.name ? (o.version ? `${o.name} ${o.version}` : o.name) : "-";
};

const formatScreen = (r: WebsocketConnectionVO) => {
  const s = r.clientInfo?.screen;
  return s?.width && s?.height ? `${s.width}×${s.height}` : "-";
};

const getLaunchBinding = (r: WebsocketConnectionVO) => {
  const launch = r.clientInfo?.launch;
  if (
    launch?.source !== "admin-design-tool" ||
    !String(launch.clientId || "").trim() ||
    !String(launch.profileId || "").trim()
  ) {
    return null;
  }
  return launch;
};

const formatLaunchBinding = (r: WebsocketConnectionVO) => {
  const launch = getLaunchBinding(r);
  if (!launch) return "";
  const client = launch.machineCode || launch.clientId;
  const profile = launch.profileName || launch.profileId;
  return `${client} · ${profile}`;
};

const formatDateTime = (v?: string | null) => (v ? formatDate(new Date(v), "YYYY-MM-DD HH:mm:ss") : "-");

const getAgent = (r: WebsocketConnectionVO) => (r.clientInfo as any)?.agent || null;

const agentLabel = (s: string) =>
  ({ idle: "空闲", thinking: "思考中", executing: "执行中", waiting_user: "等待用户", error: "异常" }[s] || s);

const agentTagType = (s: string): TagType =>
  ({ idle: "success", thinking: "warning", executing: "primary", waiting_user: "info", error: "danger" }[s] as TagType || "info");

const formatAgentTime = (iso?: string) => {
  if (!iso) return "-";
  try { return new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }
  catch { return iso; }
};

const stopTimer = () => { if (refreshTimer.value !== null) { clearInterval(refreshTimer.value); refreshTimer.value = null; } };

// WebSocket 实时更新：收到推送后原地更新连接列表，无需 REST 轮询
const onRuntimeConnectionChanged = (evt: RuntimeConnectionChangedEvent) => {
  const conn = evt.connection;
  if (!conn || !isDesignToolConnection(conn)) return;

  const list = toolConnections.value;
  const idx = list.findIndex((c) => c.id === conn.id);

  if (evt.action === "removed") {
    if (idx >= 0) list.splice(idx, 1);
    return;
  }

  // connected / updated → 原地更新或插入
  if (idx >= 0) {
    list[idx] = conn;
  } else {
    list.push(conn);
    list.sort((a, b) => ((a.connectedAt || "") > (b.connectedAt || "") ? -1 : 1));
  }
  lastRefreshAt.value = new Date().toISOString();
};
const startTimer = () => { stopTimer(); if (autoRefresh.value) refreshTimer.value = window.setInterval(() => refreshConnections(), AUTO_REFRESH_INTERVAL_MS); };

// ── 远程命令 ──
const remoteMessage = ref("");
const remoteSending = ref(false);
const remoteResults = ref<Array<{
  requestId: string;
  success: boolean;
  message?: string;
  agentResponse?: string;
  error?: string;
  connectionId?: string;
  reportedAt?: string;
}>>([]);

const openControlPanel = async (row: WebsocketConnectionVO) => {
  // 关闭旧面板
  if (controlPanelVisible.value) {
    await stopMonitoring();
  }
  controlTarget.value = row;
  remoteMessage.value = "";
  remoteResults.value = [];
  controlPanelVisible.value = true;
  monitorSessionId += 1;
  monitorStatus.value = {
    connecting: false,
    connected: false,
    error: null,
    designToolPeerId: null,
  };
  // 加载对话日志
  fetchConversation(row);
};

const onControlPanelClose = () => {
  stopMonitoring();
  controlTarget.value = null;
};

const startMonitoringFromPanel = () => {
  if (controlTarget.value) {
    void startMonitoring(controlTarget.value);
  }
};

const startMonitoring = async (row: WebsocketConnectionVO) => {
  const sessionId = monitorSessionId;
  console.log("[Monitor] startMonitoring called, sessionId:", sessionId, "targetId:", row.id);

  if (!monitorVideoRef.value) {
    console.warn("[Monitor] monitorVideoRef is null");
    monitorStatus.value.error = "视频元素未准备好";
    return;
  }
  console.log("[Monitor] monitorVideoRef OK");

  monitorStatus.value.connecting = true;
  monitorStatus.value.error = null;
  let removeResponseListener = () => {};

  try {
    console.log("[Monitor] importing canvasMonitorService...");
    const { canvasMonitorService } = await import("@/services/canvasMonitor");
    console.log("[Monitor] canvasMonitorService imported, initPeer...");

    const adminPeerId = await canvasMonitorService.initPeer();
    console.log("[Monitor] adminPeerId:", adminPeerId);

    const requestId = `monitor-${Date.now()}`;
    console.log("[Monitor] requestId:", requestId);

    const responsePromise = new Promise<any>((resolve) => {
      let settled = false;
      let timer: number | null = null;
      const cleanup = (handler: (data: any) => void) => {
        (websocketClient.events as any).off("remote-result", handler);
        if (timer !== null) { window.clearTimeout(timer); timer = null; }
      };
      const handler = (data: any) => {
        if (data?.requestId !== requestId || settled) return;
        settled = true;
        console.log("[Monitor] remote-result received:", data);
        cleanup(handler);
        resolve(data);
      };
      removeResponseListener = () => {
        if (settled) return;
        settled = true;
        cleanup(handler);
      };
      (websocketClient.events as any).on("remote-result", handler);

      timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        console.warn("[Monitor] remote-result timeout (15s)");
        cleanup(handler);
        resolve({ success: false, error: "请求超时" });
      }, 15000);
    });

    if (sessionId !== monitorSessionId || !controlPanelVisible.value) {
      console.log("[Monitor] session changed or panel closed, aborting");
      removeResponseListener();
      return;
    }

    console.log("[Monitor] sending page-monitor-request to connection:", row.id);
    const sendResult: any = await request.postOriginal({
      url: "/websocket/remote-command",
      data: {
        connectionId: row.id,
        command: {
          type: "page-monitor-request",
          payload: { adminPeerId, requestId },
          requestId,
        },
      },
    });
    console.log("[Monitor] sendResult:", sendResult);

    if (sendResult?.success === false) {
      removeResponseListener();
      throw new Error(sendResult?.message || "监控请求发送失败");
    }

    console.log("[Monitor] waiting for remote-result...");
    const response = await responsePromise;
    console.log("[Monitor] response:", response);

    if (sessionId !== monitorSessionId || !controlPanelVisible.value) {
      console.log("[Monitor] session changed after response, aborting");
      return;
    }

    if (!response.success || !response.designToolPeerId) {
      throw new Error(response.error || "获取设计端页面流 Peer ID 失败");
    }

    monitorStatus.value.designToolPeerId = response.designToolPeerId;
    console.log("[Monitor] connecting to design tool peer:", response.designToolPeerId);

    await canvasMonitorService.connectToDesignTool(
      response.designToolPeerId,
      monitorVideoRef.value,
      {
        autoReconnect: true,
        maxRetries: 3,
        onStatusChange: (status) => {
          console.log("[Monitor] onStatusChange:", status);
          if (sessionId !== monitorSessionId || !controlPanelVisible.value) return;
          monitorStatus.value.connected = status.isConnected;
          monitorStatus.value.connecting = !status.isConnected && !status.error;
          monitorStatus.value.error = status.error;
        },
      },
    );

    if (sessionId !== monitorSessionId || !controlPanelVisible.value) {
      console.log("[Monitor] session changed after connect, stopping");
      canvasMonitorService.stopMonitoring();
      return;
    }

    monitorStatus.value.connected = true;
    monitorStatus.value.connecting = false;
    console.log("[Monitor] monitoring started successfully");
  } catch (error: any) {
    removeResponseListener();
    console.error("[Monitor] startMonitoring failed:", error?.message, error);
    monitorStatus.value.error = error?.message || "启动监控失败";
    monitorStatus.value.connecting = false;
  }
};

const stopMonitoring = async () => {
  const targetId = controlTarget.value?.id;
  monitorSessionId += 1;
  try {
    const { canvasMonitorService } = await import("@/services/canvasMonitor");
    canvasMonitorService.stopMonitoring();
  } catch (error) {
    console.error("停止监控失败:", error);
  }
  monitorStatus.value.connected = false;
  monitorStatus.value.connecting = false;
  monitorStatus.value.designToolPeerId = null;
  monitorStatus.value.error = null;

  if (targetId) {
    request.postOriginal({
      url: "/websocket/remote-command",
      data: {
        connectionId: targetId,
        command: {
          type: "page-monitor-stop",
          requestId: `monitor-stop-${Date.now()}`,
        },
      },
    }).catch(() => undefined);
  }
};

const handleAction = (cmd: string, row: WebsocketConnectionVO) => {
  switch (cmd) {
    case "control": void openControlPanel(row); break;
    case "clear": sendRemoteClear(row); break;
  }
};

const sendRemoteCommand = async () => {
  if (!controlTarget.value || !remoteMessage.value.trim() || remoteSending.value) return;
  remoteSending.value = true;
  const requestId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  try {
    const res: any = await request.postOriginal({
      url: "/websocket/remote-command",
      data: {
        connectionId: controlTarget.value.id,
        command: {
          type: "chat",
          payload: { message: remoteMessage.value.trim() },
          requestId,
        },
      },
    });
    if (res?.success === false) {
      throw new Error(res?.message || "发送失败");
    }
    remoteResults.value.unshift({
      requestId,
      success: true,
      message: "命令已发送，Agent 正在处理...",
      connectionId: controlTarget.value.id,
      reportedAt: new Date().toISOString(),
    });
    remoteMessage.value = "";
  } catch (error: any) {
    remoteResults.value.unshift({
      requestId,
      success: false,
      error: error?.message || "发送失败",
      connectionId: controlTarget.value.id,
      reportedAt: new Date().toISOString(),
    });
  } finally {
    remoteSending.value = false;
  }
};

const sendRemoteClear = async (row: WebsocketConnectionVO) => {
  try {
    const res: any = await request.postOriginal({
      url: "/websocket/remote-command",
      data: {
        connectionId: row.id,
        command: { type: "clear", requestId: `clear-${Date.now()}` },
      },
    });
    if (res?.success === false) {
      throw new Error(res?.message || "远程清空失败");
    }
  } catch (error: any) {
    console.error("远程清空失败:", error);
  }
};

// 过滤当前目标的执行结果
const targetResults = computed(() => {
  if (!controlTarget.value) return [];
  return remoteResults.value
    .filter((r) => r.connectionId === controlTarget.value!.id)
    .slice(0, 5);
});

// ── 对话日志 ──
const conversationTarget = ref<WebsocketConnectionVO | null>(null);
const conversationLoading = ref(false);
const conversationData = ref<{
  conversation?: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: number;
    tool_calls?: Array<{ id: string; name: string; arguments: any }>;
    tool_call_id?: string;
    tool_name?: string;
    meta?: {
      iteration?: number;
      duration?: number;
      plan?: { goal: string; totalSteps: number; currentStep: number };
      toolArgs?: any;
      toolResult?: { success: boolean; [k: string]: any };
      type?: string;
    };
  }>;
  agentStatus?: {
    status: string;
    plan?: { goal: string; totalSteps: number; currentStep: number } | null;
    error?: string | null;
  };
  message?: string;
} | null>(null);

const fetchConversation = async (row: WebsocketConnectionVO) => {
  conversationTarget.value = row;
  conversationLoading.value = true;
  conversationData.value = null;
  const requestId = `conv-${Date.now()}`;
  try {
    const res: any = await request.postOriginal({
      url: "/websocket/remote-command",
      data: {
        connectionId: row.id,
        command: { type: "getConversation", requestId },
      },
    });
    if (res?.success === false) {
      throw new Error(res?.message || "请求失败");
    }
  } catch (error: any) {
    conversationData.value = { message: `请求失败: ${error?.message || "网络错误"}` };
    conversationLoading.value = false;
    return;
  }
  // 超时兜底：10 秒没收到 WebSocket 响应则停止 loading
  setTimeout(() => {
    if (conversationLoading.value) {
      conversationLoading.value = false;
      if (!conversationData.value) {
        conversationData.value = { message: "等待响应超时，请确认设计工具已连接并重试" };
      }
    }
  }, 10_000);
};

const formatMs = (ts?: number) => {
  if (!ts) return "-";
  return new Date(ts).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatJson = (data: any) => {
  if (data === undefined || data === null) return "";
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};

const copyConversation = () => {
  if (!conversationData.value?.conversation) return;
  const lines = conversationData.value.conversation.map((m) => {
    const time = formatMs(m.timestamp);
    const iter = m.meta?.iteration ? ` [第${m.meta.iteration}轮]` : "";
    const dur = m.meta?.duration ? ` (${m.meta.duration}ms)` : "";
    let text = `--- ${m.role.toUpperCase()}${iter}${dur} ${time} ---\n`;
    if (m.content) text += m.content + "\n";
    if (m.tool_calls?.length) {
      m.tool_calls.forEach((tc) => {
        text += `工具调用: ${tc.name}\n参数: ${formatJson(tc.arguments)}\n`;
      });
    }
    if (m.role === "tool" && m.meta?.toolArgs) {
      text += `调用参数: ${formatJson(m.meta.toolArgs)}\n`;
    }
    if (m.role === "tool" && m.meta?.toolResult) {
      text += `执行结果: ${formatJson(m.meta.toolResult)}\n`;
    }
    return text;
  });
  const log = lines.join("\n");
  navigator.clipboard.writeText(log).then(() => {
    // 简单提示
    const btn = document.querySelector(".conv-copy-toast");
    if (btn) btn.textContent = "已复制";
  });
};

let wsUnsubscribe: (() => void) | null = null;

const resultHandler = (data: any) => {
  // 对话日志响应（按 requestId 前缀匹配，不依赖 conversation 字段）
  if (data?.requestId?.startsWith("conv-")) {
    conversationData.value = {
      conversation: data.conversation || [],
      agentStatus: data.agentStatus,
      message: data.message || data.error || "无数据",
    };
    conversationLoading.value = false;
    return;
  }
  // 普通远程命令结果
  if (data?.requestId?.startsWith("monitor-") || data?.requestId?.startsWith("monitor-stop-")) {
    return;
  }

  remoteResults.value.unshift({
    requestId: data?.requestId || "unknown",
    success: data?.success,
    message: data?.message,
    agentResponse: data?.agentResponse,
    error: data?.error,
    connectionId: data?.connectionId,
    reportedAt: data?.reportedAt,
  });
  if (remoteResults.value.length > 20) remoteResults.value.length = 20;
};

onMounted(() => {
  refreshConnections();
  startTimer();
  const handler = onRuntimeConnectionChanged;
  websocketClient.events.on("runtimeConnectionChanged", handler as any);
  wsUnsubscribe = () => websocketClient.events.off("runtimeConnectionChanged", handler as any);
  websocketClient.events.on("serviceCommandResult", onServiceCommandResult);
  (websocketClient.events as any).on("remote-result", resultHandler);
});

onBeforeUnmount(() => {
  stopTimer();
  wsUnsubscribe?.();
  websocketClient.events.off("serviceCommandResult", onServiceCommandResult);
  clearLaunchStateOnUnmount();
  (websocketClient.events as any).off("remote-result", resultHandler);
  // 清理监控连接
  stopMonitoring();
});
</script>

<style scoped>
.dt-page {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 10px 12px;
}

/* ── Toolbar ── */
.dt-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  padding: 4px 0;
}

/* ── Control Panel (fullscreen) ── */
.cp-dialog :deep(.el-dialog__header) {
  display: none;
}
.cp-dialog :deep(.el-dialog__body) {
  padding: 0;
  height: 100vh;
  overflow: hidden;
}

.cp {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.cp-spacer { flex: 1; }
.cp-err { font-size: 12px; color: var(--el-color-danger); margin-left: 4px; }

/* 顶部工具栏 */
.cp-topbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  background: var(--el-bg-color);
  min-width: 0;
  flex-wrap: nowrap;
}
.cp-topbar__title { font-size: 14px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
.cp-topbar__step {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  max-width: 200px;
}
.cp-topbar .el-tag { flex-shrink: 0; }
.cp-topbar .el-button { flex-shrink: 0; }
.cp-spacer { flex: 1; min-width: 8px; }

/* 左右分栏 */
.cp-main {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 左侧：日志 + 输入 */
.cp-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}
.cp-log-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}

/* 指令输入区 */
.cp-input {
  flex-shrink: 0;
  padding: 8px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cp-input-row { display: flex; gap: 8px; align-items: flex-start; }
.cp-input-row .el-textarea { flex: 1; }
.cp-send-btn { align-self: flex-end; }

/* 执行结果 */
.cp-results { display: flex; flex-direction: column; gap: 3px; max-height: 80px; overflow-y: auto; }
.cp-result { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 3px 6px; border-radius: 3px; background: var(--el-fill-color-light); }
.cp-result--ok { border-left: 3px solid var(--el-color-success); }
.cp-result--err { border-left: 3px solid var(--el-color-danger); }
.cp-result__msg { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cp-result__err { flex: 1; color: var(--el-color-danger); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cp-result__time { font-size: 10px; color: var(--el-text-color-placeholder); flex: none; }

/* 右侧：监控画面（常驻） */
.cp-right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #000;
  border-left: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
}
.cp-video-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}
.cp-video-idle { font-size: 12px; color: var(--el-text-color-placeholder); }
.cp-video-box {
  position: relative;
  width: 640px;
  height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cp-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}
.cp-video-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: rgba(255,255,255,0.5);
  font-size: 13px;
}
.cp-video-overlay .el-icon { font-size: 24px; }
.cp-video-hint { font-size: 12px; color: rgba(255,255,255,0.35); }

/* 移动端适配 */
@media (max-width: 768px) {
  .cp-main {
    flex-direction: column;
  }
  .cp-right {
    border-left: none;
    border-top: 1px solid var(--el-border-color-lighter);
  }
  .cp-video-box {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }
  .cp-topbar {
    gap: 4px;
    padding: 6px 8px;
  }
  .cp-topbar__step {
    display: none;
  }
  .cp-topbar__hide-mobile {
    display: none;
  }
}

.dt-toolbar__left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dt-toolbar__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.dt-toolbar__count {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.dt-toolbar__meta {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.dt-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dt-toolbar__time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

/* ── Table ── */
:deep(.dt-table.el-table) {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

:deep(.dt-table .el-table__header th) {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 4px 0;
}

:deep(.dt-table .el-table__cell) {
  padding: 4px 0;
  vertical-align: top;
}

:deep(.dt-table .dt-row--offline) {
  opacity: 0.5;
}

/* ── Instance cell ── */
.cell-instance { display: flex; flex-direction: column; gap: 2px; }
.cell-instance__main { display: flex; align-items: center; gap: 6px; }
.cell-instance__dot {
  width: 6px; height: 6px; border-radius: 50%; flex: none;
  background: var(--el-color-success);
}
.cell-instance__dot--off { background: var(--el-text-color-placeholder); }
.cell-instance__name { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.cell-instance__stream { font-size: 11px; color: #52c41a; margin-left: 4px; white-space: nowrap; }
.cell-instance__ver { font-size: 11px; color: var(--el-text-color-secondary); }
.cell-instance__id { font-size: 10px; color: var(--el-text-color-placeholder); word-break: break-all; }

/* ── Env cell ── */
.cell-env { display: flex; flex-direction: column; gap: 2px; font-size: 12px; color: var(--el-text-color-primary); }
.cell-env__sub { font-size: 11px; color: var(--el-text-color-secondary); }
.cell-launch {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  margin-top: 2px;
}
.cell-launch__text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

/* ── Connection cell ── */
.cell-conn { display: flex; flex-direction: column; gap: 2px; font-size: 12px; color: var(--el-text-color-primary); }
.cell-conn__sub { font-size: 11px; color: var(--el-text-color-secondary); }

/* ── Agent cell ── */
.cell-agent { display: flex; flex-direction: column; gap: 1px; font-size: 12px; line-height: 1.4; }
.cell-agent__header { display: flex; align-items: center; gap: 4px; }
.cell-agent__time { font-size: 10px; color: var(--el-text-color-placeholder); margin-left: auto; }
.cell-agent__compact { font-size: 11px; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cell-agent__v { color: var(--el-text-color-primary); }
.cell-agent__v--hl { color: var(--el-color-primary); font-weight: 600; }
.cell-agent__v--mono { font-family: "SF Mono", Consolas, monospace; font-size: 10px; }
.cell-agent__v--err { color: var(--el-color-danger); }
.cell-agent__p { font-weight: 700; color: var(--el-color-primary); margin-left: 4px; }

.cell-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 100%;
}

.cell-empty { color: var(--el-text-color-placeholder); }

.cell-status { font-size: 12px; white-space: nowrap; }
.cell-status--active { color: #52c41a; }
.cell-status--idle { color: var(--el-text-color-placeholder); }

.launch-profile-option {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  width: 100%;
  padding: 5px 0;
  line-height: 1.25;
}

.launch-profile-option__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.launch-profile-option__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.launch-profile-option__id {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  font-family: "SF Mono", Consolas, monospace;
  font-size: 11px;
}

.launch-profile-option__meta {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  flex-direction: column;
  gap: 6px;
  flex: none;
  max-width: 44%;
  min-width: 0;
}

.launch-profile-option__meta small,
.launch-form-tip {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.launch-profile-option__meta small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  line-height: 1.2;
}

.launch-profile-option--busy .launch-profile-option__name {
  color: var(--el-text-color-regular);
}

:global(.design-tool-launch-profile-popper .el-select-dropdown__item) {
  height: auto;
  min-height: 48px;
  line-height: normal;
  padding-top: 4px;
  padding-bottom: 4px;
}

.launch-form-tip {
  margin-top: 6px;
  line-height: 1.5;
}

/* ── Conversation Dialog ── */
.conv-dialog {
  min-height: 200px;
  max-height: 70vh;
  overflow-y: auto;
}

.conv-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 10px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 12px;
}

.conv-status__err {
  color: var(--el-color-danger);
  font-weight: 500;
}

.conv-status__plan {
  color: var(--el-text-color-secondary);
  margin-left: auto;
}

.conv-timeline {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.conv-msg {
  padding: 6px 10px;
  border-radius: 4px;
  border-left: 3px solid transparent;
  font-size: 12px;
  line-height: 1.5;
}

.conv-msg--user {
  background: var(--el-color-primary-light-9);
  border-left-color: var(--el-color-primary);
}

.conv-msg--assistant {
  background: var(--el-fill-color-lighter);
  border-left-color: var(--el-color-success);
}

.conv-msg--tool {
  background: var(--el-fill-color);
  border-left-color: var(--el-color-warning);
}

.conv-msg__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}

.conv-msg__role {
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
}

.conv-msg__iter {
  font-size: 10px;
  padding: 0 4px;
  background: var(--el-color-primary-light-8);
  border-radius: 2px;
  color: var(--el-color-primary);
}

.conv-msg__dur {
  font-size: 10px;
  color: var(--el-color-success);
  font-family: monospace;
}

.conv-msg__time {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  margin-left: auto;
  font-family: monospace;
}

.conv-msg__body {
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--el-text-color-primary);
}

.conv-msg__tools {
  margin-top: 4px;
}

.conv-tool {
  margin-bottom: 4px;
}

.conv-tool__name {
  font-weight: 600;
  font-size: 11px;
  color: var(--el-color-warning);
  margin-bottom: 2px;
}

.conv-tool__args {
  margin: 0;
  padding: 4px 6px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 3px;
  font-size: 10px;
  font-family: "SF Mono", Consolas, monospace;
  line-height: 1.4;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--el-text-color-regular);
}

.conv-msg__result {
  margin-top: 4px;
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.conv-msg__args {
  margin-top: 4px;
}

.conv-msg__plan {
  margin-top: 4px;
  font-size: 11px;
  color: var(--el-color-primary);
}

.conv-label {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  font-weight: 600;
}

.conv-ok { color: var(--el-color-success); }
.conv-err { color: var(--el-color-danger); }

/* ── Remote results ── */
.remote-results {
  margin-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 10px;
}

.remote-results__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}

.remote-results__item {
  padding: 6px 8px;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 12px;
  line-height: 1.5;
  background: var(--el-fill-color-light);
}

.remote-results__item--ok { border-left: 3px solid var(--el-color-success); }
.remote-results__item--err { border-left: 3px solid var(--el-color-danger); }

.remote-results__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.remote-results__time {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  margin-left: auto;
}

.remote-results__msg {
  color: var(--el-text-color-regular);
}

.remote-results__response {
  margin-top: 4px;
  padding: 4px 6px;
  background: var(--el-color-primary-light-9);
  border-radius: 3px;
  color: var(--el-color-primary);
  word-break: break-all;
  max-height: 80px;
  overflow-y: auto;
}

.remote-results__error {
  color: var(--el-color-danger);
}
</style>
