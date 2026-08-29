<template>
  <div class="dt-page">
    <div class="dt-toolbar">
      <div class="dt-toolbar__left">
        <div class="dt-toolbar__identity">
          <div class="dt-toolbar__title-row">
            <span class="dt-toolbar__title">设计工具</span>
            <span class="dt-connection-state" :class="`dt-connection-state--${adminWsStatusTag.type}`">
              <span class="dt-connection-state__dot" />
              {{ adminWsStatusTag.text }}
            </span>
          </div>
          <div class="dt-toolbar__summary">
            <span><b>{{ toolConnections.length }}</b> 在线</span>
            <span v-if="runningToolCount"><b>{{ runningToolCount }}</b> 制作中</span>
            <span v-if="browserDistributionText !== '-'">{{ browserDistributionText }}</span>
          </div>
        </div>
      </div>
      <div class="dt-toolbar__right">
        <ParallelDesignControl
          :workers="toolConnections"
          :selected-workers="selectedToolConnections"
          @control="(worker) => worker && openControlPanel(worker)"
          @started="clearWorkerSelection"
        />
        <el-button size="small" @click="openLaunchDialog">
          <Icon icon="ep:plus" />
          打开实例
        </el-button>
        <el-tooltip :content="`最近更新 ${lastRefreshText}`" placement="bottom">
          <el-button size="small" :loading="refreshing" @click="refreshConnections" circle aria-label="刷新连接">
            <Icon icon="ep:refresh" />
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 表格 -->
    <el-table
      ref="toolTableRef"
      v-if="toolConnections.length > 0 || initialLoading"
      :data="toolConnections"
      v-loading="initialLoading"
      class="dt-table"
      size="small"
      row-key="id"
      :row-class-name="tableRowClass"
      @selection-change="handleWorkerSelectionChange"
    >
      <el-table-column type="selection" width="42" :selectable="isSelectableWorker" reserve-selection />
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

      <el-table-column label="状态" width="108" align="center">
        <template #default="{ row }">
          <span v-if="isStreaming(row)" class="cell-status cell-status--active">● 共享中</span>
          <span
            v-else-if="isDesigning(row)"
            class="cell-status cell-status--active"
            :title="formatBatchStatus(row)"
          >
            ● {{ formatBatchStatus(row) }}
          </span>
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

    <!-- 全屏极简设计端操控台 -->
    <el-dialog
      v-model="controlPanelVisible"
      class="cp-fullscreen-dialog"
      fullscreen
      :show-close="false"
      :close-on-click-modal="false"
      destroy-on-close
      @close="onControlPanelClose"
    >
      <div v-if="controlTarget" class="cp-card">
        <!-- 顶部精简导航与状态栏 -->
        <div class="cp-header">
          <div class="cp-header__meta">
            <div class="cp-header__title">
              <Icon icon="ep:cpu" class="cp-header__icon" />
              <span>设计端控制台</span>
              <span class="cp-header__cid">{{ controlTarget.id }}</span>
            </div>
            <div class="cp-header__status">
              <el-tag v-if="getAgent(controlTarget)" :type="agentTagType(getAgent(controlTarget).agentState)" size="small" effect="light">
                {{ agentLabel(getAgent(controlTarget).agentState) }}
              </el-tag>
              <span v-if="getAgent(controlTarget)?.step" class="cp-header__step">
                {{ getAgent(controlTarget)?.step }}
              </span>
            </div>
          </div>

          <div class="cp-header__actions">
            <!-- 屏幕监控弹窗触发按钮 -->
            <el-button
              size="small"
              :type="monitorStatus.connected ? 'success' : 'default'"
              :plain="!monitorStatus.connected"
              @click="openMonitorDialog"
            >
              <Icon icon="ep:video-camera" />
              <span>{{ monitorStatus.connected ? '实时画面 (已连)' : '屏幕监控' }}</span>
            </el-button>

            <!-- 快捷工具按钮组 -->
            <el-button size="small" :loading="snapshotLoading" plain @click="captureRemoteSnapshot">
              <Icon icon="ep:camera" /> 快照
            </el-button>
            <el-button size="small" type="warning" plain @click="sendRemoteClear(controlTarget!)">
              <Icon icon="ep:delete" /> 清空
            </el-button>
            <el-button size="small" type="danger" plain @click="sendRemoteStop(controlTarget!)">
              <Icon icon="ep:video-pause" /> 停止
            </el-button>
            <el-button size="small" text circle :loading="conversationLoading" @click="fetchConversation(controlTarget!)">
              <Icon icon="ep:refresh" />
            </el-button>
            <el-button size="small" text circle @click="controlPanelVisible = false">
              <Icon icon="ep:close" />
            </el-button>
          </div>
        </div>

        <!-- 中间：对话与思考日志流 -->
        <div v-loading="conversationLoading" class="cp-body">
          <template v-if="conversationData?.conversation?.length">
            <div
              v-for="(msg, idx) in conversationData.conversation"
              :key="msg.id || idx"
              class="conv-bubble"
              :class="`conv-bubble--${msg.role}`"
            >
              <div class="conv-bubble__header">
                <span class="conv-bubble__role">{{ msg.role === 'user' ? '用户需求' : msg.role === 'tool' ? '工具执行' : 'Agent 响应' }}</span>
                <span v-if="msg.meta?.iteration" class="conv-bubble__badge">第 {{ msg.meta.iteration }} 轮</span>
                <span v-if="msg.meta?.duration" class="conv-bubble__dur">{{ msg.meta.duration }}ms</span>
                <span class="conv-bubble__time">{{ formatMs(msg.timestamp) }}</span>
              </div>

              <div v-if="msg.content" class="conv-bubble__content">{{ msg.content }}</div>

              <div v-if="msg.tool_calls?.length" class="conv-bubble__tools">
                <div v-for="tc in msg.tool_calls" :key="tc.id" class="conv-tool-item">
                  <div class="conv-tool-item__title">
                    <Icon icon="ep:tools" />
                    <span>{{ tc.name }}</span>
                  </div>
                  <pre class="conv-tool-item__json">{{ formatJson(tc.arguments) }}</pre>
                </div>
              </div>

              <div v-if="msg.role === 'tool' && msg.meta?.toolResult" class="conv-bubble__tool-result">
                <span class="conv-tool-status" :class="msg.meta.toolResult.success ? 'is-ok' : 'is-err'">
                  {{ msg.meta.toolResult.success ? '执行成功' : '执行失败' }}
                </span>
                <pre class="conv-tool-item__json">{{ formatJson(msg.meta.toolResult) }}</pre>
              </div>

              <div v-if="msg.meta?.plan" class="conv-bubble__plan">
                🎯 规划：{{ msg.meta.plan.goal }} ({{ msg.meta.plan.currentStep || 0 }}/{{ msg.meta.plan.totalSteps }} 步)
              </div>
            </div>
          </template>
          <div v-else-if="!conversationLoading" class="cp-empty-hint">
            <Icon icon="ep:chat-dot-round" class="cp-empty-icon" />
            <span>暂无对话记录，可在下方输入指令指派设计任务</span>
          </div>
        </div>

        <!-- 产物流水展示带（若有） -->
        <div v-if="liveArtifacts.length" class="cp-artifact-shelf">
          <div class="cp-artifact-shelf__label">🎨 设计产物:</div>
          <div class="cp-artifact-shelf__items">
            <div v-for="(art, aIdx) in liveArtifacts" :key="aIdx" class="cp-artifact-chip">
              <el-image
                v-if="art.url"
                :src="art.url"
                fit="cover"
                class="cp-artifact-chip__thumb"
                :preview-src-list="[art.url]"
              />
              <span class="cp-artifact-chip__name">{{ art.name || (art.type === 'image-group' ? '组图包' : '贴纸') }}</span>
              <el-tag size="small" :type="art.type === 'image-group' ? 'warning' : 'success'" effect="plain">
                {{ art.type === 'image-group' ? `组图(${art.stickersCount || 2})` : '单张' }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 底部极简指令底座 -->
        <div class="cp-footer">
          <!-- 参数配置条 -->
          <div class="cp-specs">
            <el-radio-group v-model="adminTaskConfig.preset" size="small" @change="onPresetChange">
              <el-radio-button label="single">单图</el-radio-button>
              <el-radio-button label="group">组图</el-radio-button>
              <el-radio-button label="batch">批量</el-radio-button>
            </el-radio-group>

            <template v-if="adminTaskConfig.preset === 'group'">
              <span class="cp-spec-lbl">张数</span>
              <el-select v-model="adminTaskConfig.memberCount" size="small" style="width: 94px">
                <el-option :value="2" label="2 (正反面)" />
                <el-option :value="3" label="3张" />
                <el-option :value="4" label="4张" />
                <el-option :value="5" label="5张" />
              </el-select>
            </template>

            <template v-if="adminTaskConfig.preset === 'batch'">
              <span class="cp-spec-lbl">张数</span>
              <el-input-number v-model="adminTaskConfig.jobCount" :min="1" :max="20" size="small" style="width: 76px" controls-position="right" />
            </template>

            <span class="cp-spec-lbl">交付</span>
            <el-select v-model="adminTaskConfig.delivery" size="small" style="width: 86px">
              <el-option value="save" label="存贴纸" />
              <el-option value="export" label="导出PNG" />
              <el-option value="canvas" label="留画布" />
            </el-select>

            <el-checkbox v-model="adminTaskConfig.autoImportToLibrary" size="small">入素材库</el-checkbox>
          </div>

          <!-- 输入框与发送 -->
          <div class="cp-prompt-row">
            <el-input
              v-model="remoteMessage"
              type="textarea"
              :rows="2"
              resize="none"
              placeholder="输入设计需求（例如：黑金奢华商务名片正反面，Ctrl+Enter 发送）"
              :disabled="remoteSending"
              @keydown.enter.ctrl="sendRemoteCommand"
            />
            <el-button class="cp-submit-btn" type="primary" :loading="remoteSending" :disabled="!remoteMessage.trim()" @click="sendRemoteCommand">
              <Icon icon="ep:promotion" />
              <span>发送</span>
            </el-button>
          </div>

          <!-- 状态通知条 -->
          <div v-if="targetResults.length" class="cp-status-ticker">
            <span class="cp-status-ticker__badge" :class="targetResults[0].success ? 'is-ok' : 'is-err'">
              {{ targetResults[0].success ? '●' : '▲' }} {{ remoteResultLabel(targetResults[0]) }}
            </span>
            <span class="cp-status-ticker__msg">{{ targetResults[0].message || targetResults[0].error }}</span>
            <span class="cp-status-ticker__time">{{ formatAgentTime(targetResults[0].reportedAt) }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 独立屏幕监控画中画小弹窗 -->
    <el-dialog
      v-model="monitorDialogVisible"
      title="实时屏幕监控"
      width="640px"
      append-to-body
      class="cp-monitor-dialog"
      :close-on-click-modal="false"
      @close="stopMonitoring"
    >
      <div class="cp-pip-container">
        <div class="cp-pip-topbar">
          <span class="cp-pip-target">{{ controlTarget?.id }}</span>
          <el-tag v-if="monitorStatus.connecting" type="warning" size="small">连接中...</el-tag>
          <el-tag v-else-if="monitorStatus.connected" type="success" size="small" effect="plain">已连接</el-tag>
          <el-tag v-else type="info" size="small">等待工具端共享</el-tag>
          <span v-if="monitorStatus.error" class="cp-pip-err">{{ monitorStatus.error }}</span>
          <span class="cp-spacer" />
          <el-button v-if="monitorStatus.connected || monitorStatus.connecting" size="small" text type="danger" @click="stopMonitoring">断开画面</el-button>
          <el-button v-else size="small" text type="primary" @click="startMonitoringFromPanel">重新连接</el-button>
        </div>
        <div class="cp-pip-video-box">
          <video ref="monitorVideoRef" class="cp-pip-video" autoplay playsinline muted />
          <div v-if="monitorStatus.connecting" class="cp-pip-overlay">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>正在建立 WebRTC 连接...</span>
          </div>
          <div v-else-if="!monitorStatus.connected" class="cp-pip-overlay">
            <span class="cp-pip-hint">设计端开启屏幕共享后，点击"重新连接"即可实时监控</span>
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
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
import { isDesignToolConnectionRunning } from "@/services/designToolRuntimeState";
import ParallelDesignControl from "./components/ParallelDesignControl.vue";

defineOptions({ name: "DesignToolConnection" });

const DESIGN_TOOL_SOURCES = new Set(["设计工具", "设计端"]);
const CLIENT_SOURCES = new Set(["客户端"]);
const AUTO_REFRESH_INTERVAL_MS = 60_000; // WebSocket 实时推送为主，60s 轮询兜底
type TagType = "success" | "warning" | "danger" | "info" | "primary";

const initialLoading = ref(true);
const refreshing = ref(false);
const toolConnections = ref<WebsocketConnectionVO[]>([]);
const toolTableRef = ref<any>(null);
const selectedWorkerIds = ref<string[]>([]);
const selectedToolConnections = computed(() => {
  const selected = new Set(selectedWorkerIds.value);
  return toolConnections.value.filter((worker) => selected.has(worker.id));
});
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

const isDesigning = (r: WebsocketConnectionVO) =>
  isDesignToolConnectionRunning(r);

const formatBatchStatus = (r: WebsocketConnectionVO) => {
  const batch = r.clientInfo?.designWorker?.batch as any;
  if (!batch || !["preparing", "running", "paused"].includes(batch.status)) {
    return "制作中";
  }
  if (batch.status === "preparing") return "准备中";
  const progress = `${Number(batch.completed || 0)}/${Number(batch.total || 0)}`;
  return batch.status === "paused" ? `${progress} 已暂停` : `${progress} 制作中`;
};

const runningToolCount = computed(
  () => toolConnections.value.filter(isDesigning).length,
);

const isSelectableWorker = (worker: WebsocketConnectionVO) => {
  if (worker.isOnline === false) return false;
  return !isDesigning(worker);
};

const handleWorkerSelectionChange = (workers: WebsocketConnectionVO[]) => {
  selectedWorkerIds.value = workers.map((worker) => worker.id);
};

const clearWorkerSelection = () => {
  selectedWorkerIds.value = [];
  toolTableRef.value?.clearSelection?.();
};

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
const startTimer = () => {
  stopTimer();
  refreshTimer.value = window.setInterval(() => refreshConnections(), AUTO_REFRESH_INTERVAL_MS);
};

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
  phase?: string;
}>>([]);

const remoteResultLabel = (result: { success: boolean; phase?: string }) => {
  if (result.phase === "accepted" || result.phase === "dispatching") return "执行中";
  if (result.phase === "rejected") return "未接收";
  if (result.phase === "cancelled") return "已停止";
  return result.success ? "完成" : "失败";
};

const remoteResultTagType = (result: { success: boolean; phase?: string }): TagType => {
  if (result.phase === "accepted" || result.phase === "dispatching") return "primary";
  if (result.phase === "cancelled") return "info";
  return result.success ? "success" : "danger";
};

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

// ── 独立屏幕监控弹窗 ──
const monitorDialogVisible = ref(false);
const openMonitorDialog = () => {
  monitorDialogVisible.value = true;
  if (!monitorStatus.value.connected && !monitorStatus.value.connecting) {
    startMonitoringFromPanel();
  }
};

// ── 创作形式与参数配置 ──
const adminTaskConfig = reactive({
  preset: "single" as "single" | "group" | "batch",
  outputKind: "single" as "single" | "group" | "independent-batch",
  memberCount: 2,
  jobCount: 1,
  delivery: "save" as "save" | "export" | "canvas",
  autoImportToLibrary: true,
});

const onPresetChange = (val: string) => {
  if (val === "single") {
    adminTaskConfig.outputKind = "single";
    adminTaskConfig.memberCount = 1;
  } else if (val === "group") {
    adminTaskConfig.outputKind = "group";
    if (adminTaskConfig.memberCount < 2) adminTaskConfig.memberCount = 2;
  } else if (val === "batch") {
    adminTaskConfig.outputKind = "independent-batch";
    if (adminTaskConfig.jobCount < 1) adminTaskConfig.jobCount = 3;
  }
};

const liveArtifacts = ref<Array<{
  type: "sticker" | "image-group";
  name?: string;
  url?: string;
  customStickerId?: string;
  stickerId?: string;
  groupId?: string;
  stickersCount?: number;
}>>([]);

const snapshotLoading = ref(false);
const captureRemoteSnapshot = async () => {
  if (!controlTarget.value || snapshotLoading.value) return;
  snapshotLoading.value = true;
  try {
    const res: any = await request.postOriginal({
      url: "/websocket/remote-command",
      data: {
        connectionId: controlTarget.value.id,
        command: { type: "snapshot", requestId: `snap-${Date.now()}` },
      },
    });
    if (res?.data?.snapshot || res?.snapshot) {
      const snapUrl = res?.data?.snapshot || res?.snapshot;
      liveArtifacts.value.unshift({
        type: "sticker",
        name: "画布即时快照",
        url: snapUrl,
      });
      ElMessage.success("已获取画布最新快照");
    }
  } catch (err: any) {
    console.error("捕获画布快照失败:", err);
    ElMessage.error(err?.message || "获取快照失败");
  } finally {
    snapshotLoading.value = false;
  }
};

const sendRemoteStop = async (row: WebsocketConnectionVO) => {
  try {
    await request.postOriginal({
      url: "/websocket/remote-command",
      data: {
        connectionId: row.id,
        command: { type: "stop", requestId: `stop-${Date.now()}` },
      },
    });
    ElMessage.success("已向设计端发送停止指令");
  } catch (error: any) {
    console.error("远程停止失败:", error);
    ElMessage.error("发送停止指令失败");
  }
};

const sendRemoteCommand = async () => {
  if (!controlTarget.value || !remoteMessage.value.trim() || remoteSending.value) return;
  remoteSending.value = true;
  const requestId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  try {
    const taskOptions = {
      preset: adminTaskConfig.preset,
      outputKind: adminTaskConfig.outputKind,
      memberCount: adminTaskConfig.preset === "group" ? adminTaskConfig.memberCount : 1,
      jobCount: adminTaskConfig.preset === "batch" ? adminTaskConfig.jobCount : 1,
      delivery: adminTaskConfig.delivery,
      autoImportToLibrary: adminTaskConfig.autoImportToLibrary,
    };
    const res: any = await request.postOriginal({
      url: "/websocket/remote-command",
      data: {
        connectionId: controlTarget.value.id,
        command: {
          type: "chat",
          payload: {
            message: remoteMessage.value.trim(),
            taskOptions,
          },
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
      phase: "dispatching",
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
    ElMessage.success("已清空设计端画布与对话");
  } catch (error: any) {
    console.error("远程清空失败:", error);
    ElMessage.error("远程清空失败");
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
  // 提取设计产物
  if (data?.outputs && Array.isArray(data.outputs)) {
    for (const out of data.outputs) {
      if (
        !liveArtifacts.value.some(
          (a) =>
            (a.customStickerId && a.customStickerId === out.customStickerId) ||
            (a.groupId && a.groupId === out.groupId) ||
            (a.url && a.url === out.url),
        )
      ) {
        liveArtifacts.value.unshift(out);
      }
    }
  }

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

  const nextResult = {
    requestId: data?.requestId || "unknown",
    success: data?.success,
    phase: data?.phase,
    message: data?.message,
    agentResponse: data?.agentResponse,
    error: data?.error,
    connectionId: data?.connectionId,
    reportedAt: data?.reportedAt,
  };
  const existingIndex = remoteResults.value.findIndex(
    (item) => item.requestId === nextResult.requestId,
  );
  if (existingIndex >= 0) {
    remoteResults.value[existingIndex] = {
      ...remoteResults.value[existingIndex],
      ...nextResult,
    };
  } else {
    remoteResults.value.unshift(nextResult);
  }
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


/* 移动端适配 */
@media (width <= 768px) {
  .cp-main {
    flex-direction: column;
  }

  .cp-right {
    border-top: none;
    border-left: none;
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

@media (width <= 640px) {
  .dt-page {
    padding: 6px;
  }

  .dt-toolbar {
    min-height: 0;
    align-items: flex-start;
    padding: 7px 4px 9px;
  }

  .dt-toolbar__summary span:last-child {
    display: none;
  }

  .dt-toolbar__right {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}

.dt-page {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 10px 12px;
}

/* ── Toolbar ── */
.dt-toolbar {
  display: flex;
  min-height: 54px;
  padding: 7px 10px;
  background: var(--el-bg-color);
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* ── Fullscreen Ultra-Clean Control Console ── */
.cp-fullscreen-dialog :deep(.el-dialog__header) {
  display: none;
}

.cp-fullscreen-dialog :deep(.el-dialog__body) {
  padding: 0;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.cp-card {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--el-bg-color-page);
  overflow: hidden;
}

/* 顶部极简导航 */
.cp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 54px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  gap: 16px;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.cp-header__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.cp-header__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.cp-header__icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

.cp-header__cid {
  font-family: "SF Mono", Consolas, monospace;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 2px 8px;
  border-radius: 4px;
}

.cp-header__status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cp-header__step {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 320px;
}

.cp-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 居中对话流 */
.cp-body {
  flex: 1;
  padding: 24px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  background: var(--el-bg-color-page);
}

.conv-bubble,
.cp-empty-hint {
  width: 100%;
  max-width: 900px;
}

.cp-empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: var(--el-text-color-placeholder);
  gap: 12px;
  font-size: 14px;
}

.cp-empty-icon {
  font-size: 48px;
  opacity: 0.4;
}

/* 气泡 */
.conv-bubble {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.conv-bubble--user {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.conv-bubble--tool {
  background: var(--el-fill-color-extra-light);
  border-left: 4px solid var(--el-color-warning);
}

.conv-bubble--assistant {
  background: var(--el-bg-color);
  border-color: var(--el-border-color-light);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.conv-bubble__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.conv-bubble__role {
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.conv-bubble__badge {
  background: var(--el-fill-color);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--el-color-primary);
  font-size: 11px;
}

.conv-bubble__dur {
  font-family: monospace;
  font-size: 11px;
  color: var(--el-color-success);
}

.conv-bubble__time {
  margin-left: auto;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.conv-bubble__content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.conv-bubble__plan {
  font-size: 13px;
  color: var(--el-color-primary);
  font-weight: 500;
  background: var(--el-color-primary-light-9);
  padding: 6px 10px;
  border-radius: 6px;
}

.conv-tool-item {
  margin-top: 4px;
}

.conv-tool-item__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-warning);
  margin-bottom: 3px;
}

.conv-tool-item__json {
  margin: 0;
  padding: 8px 10px;
  font-family: "SF Mono", Consolas, monospace;
  font-size: 12px;
  line-height: 1.45;
  background: var(--el-fill-color-dark);
  color: var(--el-text-color-regular);
  border-radius: 6px;
  max-height: 160px;
  overflow-y: auto;
}

.conv-tool-status {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
}

.conv-tool-status.is-ok {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.conv-tool-status.is-err {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

/* 产物流水架 */
.cp-artifact-shelf {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 10px 24px;
  flex-shrink: 0;
}

.cp-artifact-shelf__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-right: 12px;
  white-space: nowrap;
}

.cp-artifact-shelf__items {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow-x: auto;
  max-width: 820px;
}

.cp-artifact-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  white-space: nowrap;
}

.cp-artifact-chip__thumb {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  flex-shrink: 0;
}

.cp-artifact-chip__name {
  font-size: 12px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-primary);
}

/* 底部极简指令底座 (居中控制舱) */
.cp-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 24px 20px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.02);
}

.cp-specs,
.cp-prompt-row,
.cp-status-ticker {
  width: 100%;
  max-width: 900px;
}

.cp-specs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
}

.cp-spec-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cp-spec-lbl {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.cp-prompt-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.cp-prompt-row .el-textarea {
  flex: 1;
}

.cp-prompt-row :deep(.el-textarea__inner) {
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
}

.cp-submit-btn {
  height: 52px;
  padding: 0 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cp-status-ticker {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding-top: 6px;
}

.cp-status-ticker__badge.is-ok { color: var(--el-color-success); font-weight: 600; }
.cp-status-ticker__badge.is-err { color: var(--el-color-danger); font-weight: 600; }
.cp-status-ticker__msg { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cp-status-ticker__time { font-size: 11px; color: var(--el-text-color-placeholder); }

/* 独立画中画弹窗 (PiP Monitor) */
.cp-monitor-dialog :deep(.el-dialog__body) {
  padding: 12px;
}

.cp-pip-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cp-pip-topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.cp-pip-target {
  font-family: monospace;
  font-weight: 600;
}

.cp-pip-video-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cp-pip-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.cp-pip-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.7);
}

.cp-pip-hint {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  text-align: center;
  padding: 0 20px;
}
</style>
