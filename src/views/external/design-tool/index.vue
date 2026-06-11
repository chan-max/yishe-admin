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
      <el-table-column label="实例" min-width="200" show-overflow-tooltip>
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

      <el-table-column label="环境" min-width="170" show-overflow-tooltip>
        <template #default="{ row }">
          <div class="cell-env">
            <span>{{ formatBrowser(row) }} · {{ formatOs(row) }}</span>
            <span class="cell-env__sub">{{ row.clientInfo?.machine?.code || '-' }} · {{ formatScreen(row) }}</span>
          </div>
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

      <el-table-column label="AI Agent" min-width="300">
        <template #default="{ row }">
          <div v-if="getAgent(row)" class="cell-agent">
            <div class="cell-agent__header">
              <el-tag :type="agentTagType(getAgent(row).agentState)" size="small" effect="plain">
                {{ agentLabel(getAgent(row).agentState) }}
              </el-tag>
              <el-tag v-if="getAgent(row).available" type="success" size="small" effect="plain">可制作</el-tag>
              <span class="cell-agent__time">{{ formatAgentTime(getAgent(row).updatedAt) }}</span>
            </div>
            <!-- 只在非空闲状态时显示详细信息 -->
            <template v-if="getAgent(row).agentState !== 'idle'">
              <div v-if="getAgent(row).userInput" class="cell-agent__row">
                <span class="cell-agent__k">输入</span>
                <span class="cell-agent__v cell-agent__v--hl">{{ getAgent(row).userInput }}</span>
              </div>
              <div v-if="getAgent(row).plan" class="cell-agent__row">
                <span class="cell-agent__k">计划</span>
                <span class="cell-agent__v">
                  {{ getAgent(row).plan.goal }}
                  <b class="cell-agent__p">{{ getAgent(row).plan.currentStep }}/{{ getAgent(row).plan.totalSteps }}</b>
                </span>
              </div>
              <div v-if="getAgent(row).step" class="cell-agent__row">
                <span class="cell-agent__k">步骤</span>
                <span class="cell-agent__v">{{ getAgent(row).step }}</span>
              </div>
              <div v-if="getAgent(row).lastToolCall" class="cell-agent__row">
                <span class="cell-agent__k">工具</span>
                <span class="cell-agent__v cell-agent__v--mono">{{ getAgent(row).lastToolCall }}</span>
              </div>
              <div v-if="getAgent(row).lastError" class="cell-agent__row">
                <span class="cell-agent__k">错误</span>
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
                  <el-dropdown-item command="chat">发送指令</el-dropdown-item>
                  <el-dropdown-item command="log">对话日志</el-dropdown-item>
                  <el-dropdown-item command="clear" divided>清空对话</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-else description="当前没有已连接的设计工具" :image-size="60" />

    <!-- 对话日志对话框 -->
    <el-dialog
      v-model="conversationDialogVisible"
      :title="`对话日志 · ${conversationTarget?.id?.slice(0, 20) || ''}`"
      width="80%"
      top="3vh"
      :close-on-click-modal="true"
      destroy-on-close
    >
      <div v-loading="conversationLoading" class="conv-dialog">
        <!-- Agent 状态概览 -->
        <div v-if="conversationData?.agentStatus" class="conv-status">
          <el-tag :type="agentTagType(conversationData.agentStatus.status)" size="small">
            {{ agentLabel(conversationData.agentStatus.status) }}
          </el-tag>
          <span v-if="conversationData.agentStatus.error" class="conv-status__err">
            {{ conversationData.agentStatus.error }}
          </span>
          <span v-if="conversationData.agentStatus.plan" class="conv-status__plan">
            计划: {{ conversationData.agentStatus.plan.goal }}
            ({{ conversationData.agentStatus.plan.currentStep }}/{{ conversationData.agentStatus.plan.totalSteps }})
          </span>
        </div>

        <!-- 消息列表 -->
        <div v-if="conversationData?.conversation?.length" class="conv-timeline">
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

            <!-- 内容 -->
            <div v-if="msg.content" class="conv-msg__body">{{ msg.content }}</div>

            <!-- 工具调用 -->
            <div v-if="msg.tool_calls?.length" class="conv-msg__tools">
              <div v-for="tc in msg.tool_calls" :key="tc.id" class="conv-tool">
                <div class="conv-tool__name">{{ tc.name }}</div>
                <pre class="conv-tool__args">{{ formatJson(tc.arguments) }}</pre>
              </div>
            </div>

            <!-- 工具结果 -->
            <div v-if="msg.role === 'tool' && msg.meta?.toolResult" class="conv-msg__result">
              <span :class="msg.meta.toolResult.success ? 'conv-ok' : 'conv-err'">
                {{ msg.meta.toolResult.success ? '✅' : '❌' }}
              </span>
              <pre class="conv-tool__args">{{ formatJson(msg.meta.toolResult) }}</pre>
            </div>

            <!-- 工具参数 (from meta) -->
            <div v-if="msg.role === 'tool' && msg.meta?.toolArgs" class="conv-msg__args">
              <span class="conv-label">调用参数:</span>
              <pre class="conv-tool__args">{{ formatJson(msg.meta.toolArgs) }}</pre>
            </div>

            <!-- 计划 -->
            <div v-if="msg.meta?.plan" class="conv-msg__plan">
              <span class="conv-label">计划:</span>
              {{ msg.meta.plan.goal }}
              ({{ msg.meta.plan.currentStep || 0 }}/{{ msg.meta.plan.totalSteps }}步)
            </div>
          </div>
        </div>

        <el-empty v-else-if="!conversationLoading" description="暂无对话数据" :image-size="40" />
      </div>

      <template #footer>
        <el-button :loading="conversationLoading" @click="fetchConversation(conversationTarget!)">
          刷新
        </el-button>
        <el-button @click="copyConversation">复制日志</el-button>
        <el-button type="primary" @click="conversationDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 远程指令对话框 -->
    <el-dialog
      v-model="remoteDialogVisible"
      :title="`发送指令 → ${remoteTarget?.id?.slice(0, 20) || '设计工具'}`"
      width="500px"
      :close-on-click-modal="false"
    >
      <div style="margin-bottom: 12px;">
        <div v-if="getAgent(remoteTarget!)" style="margin-bottom: 8px;">
          <el-tag :type="agentTagType(getAgent(remoteTarget!).agentState)" size="small">
            {{ agentLabel(getAgent(remoteTarget!).agentState) }}
          </el-tag>
          <span v-if="getAgent(remoteTarget!).step" style="margin-left: 8px; font-size: 12px; color: var(--el-text-color-secondary);">
            {{ getAgent(remoteTarget!).step }}
          </span>
        </div>
      </div>
      <el-input
        v-model="remoteMessage"
        type="textarea"
        :rows="3"
        placeholder="输入设计需求，如：创建一个科技风格的猫咪贴纸"
        :disabled="remoteSending"
        @keydown.enter.ctrl="sendRemoteCommand"
      />
      <div style="margin-top: 6px; font-size: 11px; color: var(--el-text-color-placeholder);">
        Ctrl+Enter 发送。发送后可在表格中实时观察 Agent 状态变化。
      </div>

      <!-- 执行结果 -->
      <div v-if="targetResults.length" class="remote-results">
        <div class="remote-results__title">执行结果</div>
        <div v-for="r in targetResults" :key="r.requestId" class="remote-results__item" :class="r.success ? 'remote-results__item--ok' : 'remote-results__item--err'">
          <div class="remote-results__header">
            <el-tag :type="r.success ? 'success' : 'danger'" size="small" effect="plain">
              {{ r.success ? '完成' : '失败' }}
            </el-tag>
            <span class="remote-results__time">{{ formatAgentTime(r.reportedAt) }}</span>
          </div>
          <div v-if="r.message" class="remote-results__msg">{{ r.message }}</div>
          <div v-if="r.agentResponse" class="remote-results__response">{{ r.agentResponse }}</div>
          <div v-if="r.error" class="remote-results__error">{{ r.error }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="remoteDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="remoteSending" :disabled="!remoteMessage.trim()" @click="sendRemoteCommand">
          发送
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  getMyOnlineRuntimeConnectionViews,
  type WebsocketConnectionVO,
} from "@/api/system/websocket";
import { websocketClient, type RuntimeConnectionChangedEvent } from "@/services/websocketClient";
import { formatDate, formatPast } from "@/utils/formatTime";
import request from "@/config/axios";

defineOptions({ name: "DesignToolConnection" });

const DESIGN_TOOL_SOURCES = new Set(["设计工具", "设计端"]);
const AUTO_REFRESH_INTERVAL_MS = 60_000; // WebSocket 实时推送为主，60s 轮询为兆底

const initialLoading = ref(true);
const refreshing = ref(false);
const autoRefresh = ref(true);
const toolConnections = ref<WebsocketConnectionVO[]>([]);
const refreshTimer = ref<number | null>(null);
const lastRefreshAt = ref<string | null>(null);

const adminWsStatusTag = computed(() => {
  const s = websocketClient.state.status;
  const m: Record<string, { text: string; type: "success" | "warning" | "danger" | "info" }> = {
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

const formatDateTime = (v?: string | null) => (v ? formatDate(new Date(v), "YYYY-MM-DD HH:mm:ss") : "-");

const getAgent = (r: WebsocketConnectionVO) => (r.clientInfo as any)?.agent || null;

const agentLabel = (s: string) =>
  ({ idle: "空闲", thinking: "思考中", executing: "执行中", waiting_user: "等待用户", error: "异常" }[s] || s);

const agentTagType = (s: string): "" | "success" | "warning" | "danger" | "info" =>
  ({ idle: "success", thinking: "warning", executing: "", waiting_user: "info", error: "danger" }[s] as any || "info");

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
const remoteTarget = ref<WebsocketConnectionVO | null>(null);
const remoteMessage = ref("");
const remoteSending = ref(false);
const remoteDialogVisible = ref(false);
const remoteResults = ref<Array<{
  requestId: string;
  success: boolean;
  message?: string;
  agentResponse?: string;
  error?: string;
  connectionId?: string;
  reportedAt?: string;
}>>([]);

const openRemoteDialog = (row: WebsocketConnectionVO) => {
  remoteTarget.value = row;
  remoteMessage.value = "";
  remoteDialogVisible.value = true;
};

const handleAction = (cmd: string, row: WebsocketConnectionVO) => {
  switch (cmd) {
    case "chat": openRemoteDialog(row); break;
    case "log": fetchConversation(row); break;
    case "clear": sendRemoteClear(row); break;
  }
};

const sendRemoteCommand = async () => {
  if (!remoteTarget.value || !remoteMessage.value.trim() || remoteSending.value) return;
  remoteSending.value = true;
  const requestId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  try {
    const res = await request.post({
      url: "/websocket/remote-command",
      data: {
        connectionId: remoteTarget.value.id,
        command: {
          type: "chat",
          payload: { message: remoteMessage.value.trim() },
          requestId,
        },
      },
    });
    if (res?.data?.success || res?.success) {
      remoteResults.value.unshift({
        requestId,
        success: true,
        message: "命令已发送，Agent 正在处理...",
      });
      remoteMessage.value = "";
    }
  } catch (error: any) {
    remoteResults.value.unshift({
      requestId,
      success: false,
      error: error?.message || "发送失败",
    });
  } finally {
    remoteSending.value = false;
  }
};

const sendRemoteClear = async (row: WebsocketConnectionVO) => {
  try {
    await request.post({
      url: "/websocket/remote-command",
      data: {
        connectionId: row.id,
        command: { type: "clear", requestId: `clear-${Date.now()}` },
      },
    });
  } catch (error: any) {
    console.error("远程清空失败:", error);
  }
};

// 过滤当前目标的执行结果
const targetResults = computed(() => {
  if (!remoteTarget.value) return [];
  return remoteResults.value
    .filter((r) => r.connectionId === remoteTarget.value!.id)
    .slice(0, 5);
});

// ── 对话日志 ──
const conversationDialogVisible = ref(false);
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
  conversationDialogVisible.value = true;
  conversationLoading.value = true;
  conversationData.value = null;
  const requestId = `conv-${Date.now()}`;
  try {
    await request.post({
      url: "/websocket/remote-command",
      data: {
        connectionId: row.id,
        command: { type: "getConversation", requestId },
      },
    });
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
  websocketClient.events.on("runtimeConnectionChanged", handler);
  wsUnsubscribe = () => websocketClient.events.off("runtimeConnectionChanged", handler);
  websocketClient.events.on("remote-result", resultHandler);
});

onBeforeUnmount(() => {
  stopTimer();
  wsUnsubscribe?.();
  websocketClient.events.off("remote-result", resultHandler);
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
  gap: 12px;
  flex-wrap: wrap;
  padding: 6px 0;
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
  padding: 6px 0;
}

:deep(.dt-table .el-table__cell) {
  padding: 6px 0;
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
.cell-instance__ver { font-size: 11px; color: var(--el-text-color-secondary); }
.cell-instance__id { font-size: 10px; color: var(--el-text-color-placeholder); word-break: break-all; }

/* ── Env cell ── */
.cell-env { display: flex; flex-direction: column; gap: 2px; font-size: 12px; color: var(--el-text-color-primary); }
.cell-env__sub { font-size: 11px; color: var(--el-text-color-secondary); }

/* ── Connection cell ── */
.cell-conn { display: flex; flex-direction: column; gap: 2px; font-size: 12px; color: var(--el-text-color-primary); }
.cell-conn__sub { font-size: 11px; color: var(--el-text-color-secondary); }

/* ── Agent cell ── */
.cell-agent { display: flex; flex-direction: column; gap: 2px; font-size: 12px; line-height: 1.45; }
.cell-agent__header { display: flex; align-items: center; gap: 6px; margin-bottom: 1px; }
.cell-agent__time { font-size: 10px; color: var(--el-text-color-placeholder); margin-left: auto; }
.cell-agent__row { display: flex; align-items: baseline; gap: 4px; }
.cell-agent__k { flex: none; width: 24px; font-size: 10px; color: var(--el-text-color-secondary); }
.cell-agent__v { color: var(--el-text-color-primary); word-break: break-all; }
.cell-agent__v--hl { color: var(--el-color-primary); font-weight: 600; }
.cell-agent__v--mono { font-family: "SF Mono", Consolas, monospace; font-size: 11px; }
.cell-agent__v--err { color: var(--el-color-danger); }
.cell-agent__p { font-weight: 700; color: var(--el-color-primary); margin-left: 4px; }

.cell-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.cell-empty { color: var(--el-text-color-placeholder); }

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
