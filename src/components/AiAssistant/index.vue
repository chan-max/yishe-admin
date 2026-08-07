<template>
  <div class="ai-desktop" :class="{ 'ai-desktop--sidebar-open': sidebarOpen }">
    <aside class="sidebar">
      <div class="sidebar__logo">
        <button class="sidebar__new" @click="handleCreateConversation">+ 新建会话</button>
      </div>
      <div class="sidebar__nav">
        <div class="sidebar__section">
          <div
            v-for="conv in store.conversations"
            :key="conv.id"
            class="sidebar__item"
            :class="{ active: store.currentConversationId === conv.id }"
            @click="handleSelectConversation(conv.id)"
            @mouseenter="showConversationDetail(conv, $event)"
            @mouseleave="hideConversationDetail"
          >
            <div class="sidebar__item-main">
              <span class="sidebar__item-text">{{ conv.title || "未命名会话" }}</span>
            </div>
            <button class="sidebar__item-del" @click.stop="store.deleteConversation(conv.id)">
              ×
            </button>
          </div>
          <div v-if="!store.conversations.length" class="sidebar__empty">暂无会话</div>
        </div>
      </div>

      <!-- 对话详情浮层 -->
      <div v-if="hoveredConversation" class="conversation-detail-popup" :style="popupStyle">
        <div class="conversation-detail-header">
          <span class="conversation-detail-title">{{
            hoveredConversation.title || "未命名会话"
          }}</span>
        </div>
        <div class="conversation-detail-body">
          <div class="detail-row">
            <span class="detail-label">创建时间</span>
            <span class="detail-value">{{ formatTime(hoveredConversation.createdAt) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">消息数</span>
            <span class="detail-value">{{ hoveredConversation.messageCount || 0 }} 条</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">运行次数</span>
            <span class="detail-value">
              {{ hoveredConversation.successfulRunCount || 0 }} 成功 /
              {{ hoveredConversation.failedRunCount || 0 }} 失败
            </span>
          </div>
          <div class="detail-row" v-if="hoveredConversation.totalDurationMs">
            <span class="detail-label">总耗时</span>
            <span class="detail-value">{{
              formatDuration(hoveredConversation.totalDurationMs)
            }}</span>
          </div>
          <div class="detail-row" v-if="hoveredConversation.avgAiResponseMs">
            <span class="detail-label">平均AI响应</span>
            <span class="detail-value">{{
              formatDuration(hoveredConversation.avgAiResponseMs)
            }}</span>
          </div>
        </div>
      </div>
      <div class="sidebar__bottom">
        <button class="sidebar__item" @click="handleOpenToolDialog">
          <span class="sidebar__item-text">工具</span>
        </button>
      </div>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <div class="topbar__left">
          <button class="topbar__menu" @click="sidebarOpen = !sidebarOpen">☰</button>
          <span class="topbar__title">{{ store.activeConversationTitle }}</span>
        </div>
        <div class="topbar__right">
          <button class="topbar__btn" @click="handleRefresh">
            刷新
          </button>
          <button v-if="store.messages.length" class="topbar__btn" @click="store.clearMessages()">
            清空
          </button>
        </div>
      </header>

      <div class="chat" v-loading="store.historyLoading" element-loading-text="正在读取会话历史...">
        <div class="chat__scroll" ref="chatScrollRef">
          <div class="chat__list">
            <template v-if="!visibleMessages.length && !store.loading">
              <div class="chat__empty">
                <p class="chat__empty-text">有什么可以帮你的？</p>
              </div>
            </template>
            <template v-for="msg in visibleMessages" :key="msg.id">
              <div class="msg" :class="[`msg--${msg.role}`]">
                <div class="msg__body">
                  <div class="msg__content">
                    <template v-if="msg.role === 'user'">
                      <span class="msg__text">{{ msg.content }}</span>
                    </template>
                    <template v-else>
                      <template v-if="msg.toolCalls?.length">
                        <div v-for="tc in msg.toolCalls" :key="tc.id" class="tool-card">
                          <div class="tool-card__head">
                            <span class="tool-card__dot"></span>
                            <span class="tool-card__name">{{ tc.name }}</span>
                          </div>
                          <div v-if="tc.result" class="tool-card__result">
                            <pre class="tool-card__pre">{{ formatToolResult(tc.result) }}</pre>
                          </div>
                        </div>
                      </template>
                      <div v-if="msg.content" class="md-body">
                        <MarkdownView :content="msg.content" />
                      </div>
                      <div
                        v-if="
                          msg.content &&
                          store.thinkingText &&
                          store.loading &&
                          msg === visibleMessages[visibleMessages.length - 1]
                        "
                        class="thinking-block"
                      >
                        <span class="thinking-dot"></span>
                        <span>{{ store.thinkingText }}</span>
                      </div>
                    </template>
                  </div>
                  <div v-if="hasMessageDetails(msg)" class="msg__meta">
                    <el-popover
                      trigger="click"
                      placement="bottom-start"
                      :width="360"
                      popper-class="ai-message-detail-popover"
                    >
                      <template #reference>
                        <span>
                          <el-tooltip
                            effect="dark"
                            placement="top"
                            :content="getMessageDetailsTooltip(msg)"
                          >
                            <button class="msg__meta-toggle" aria-label="消息详情">
                              <el-icon><InfoFilled /></el-icon>
                            </button>
                          </el-tooltip>
                        </span>
                      </template>
                      <div class="msg__meta-panel">
                        <div class="msg__meta-row">
                          <span>创建时间</span>
                          <strong>{{ formatTime(msg.createdAt) }}</strong>
                        </div>
                        <div v-if="msg.startedAt" class="msg__meta-row">
                          <span>开始处理</span>
                          <strong>{{ formatTime(msg.startedAt) }}</strong>
                        </div>
                        <div v-if="msg.completedAt" class="msg__meta-row">
                          <span>完成时间</span>
                          <strong>{{ formatTime(msg.completedAt) }}</strong>
                        </div>
                        <div v-if="hasMetric(msg.durationMs)" class="msg__meta-row">
                          <span>总耗时</span>
                          <strong>{{ formatDuration(msg.durationMs) }}</strong>
                        </div>
                        <div v-if="hasMetric(msg.aiResponseMs)" class="msg__meta-row">
                          <span>AI 响应</span>
                          <strong>{{ formatDuration(msg.aiResponseMs) }}</strong>
                        </div>
                        <div v-if="hasMetric(msg.toolExecutionMs)" class="msg__meta-row">
                          <span>工具耗时</span>
                          <strong>{{ formatDuration(msg.toolExecutionMs) }}</strong>
                        </div>
                        <div v-if="msg.toolKey" class="msg__meta-row">
                          <span>工具</span>
                          <strong>{{ msg.toolLabel || msg.toolKey }}</strong>
                        </div>
                        <div v-if="getMessageToolDetails(msg).length" class="msg__meta-tools">
                          <div class="msg__meta-tools-title">工具调用</div>
                          <div
                            v-for="tool in getMessageToolDetails(msg)"
                            :key="`${tool.tool}-${tool.startedAt || tool.summary}`"
                            class="msg__meta-tool"
                          >
                            <div class="msg__meta-tool-main">
                              <span
                                class="msg__meta-tool-status"
                                :class="{ failed: tool.success === false }"
                              ></span>
                              <strong>{{ tool.label || tool.tool }}</strong>
                            </div>
                            <span>{{ formatDuration(tool.durationMs) }}</span>
                            <small v-if="tool.summary">{{ tool.summary }}</small>
                          </div>
                        </div>
                        <div v-if="getMessageRunId(msg)" class="msg__meta-row">
                          <span>Run ID</span>
                          <strong>{{ getMessageRunId(msg) }}</strong>
                        </div>
                      </div>
                    </el-popover>
                  </div>
                  <template
                    v-if="
                      msg.role === 'assistant' &&
                      msg === visibleMessages[visibleMessages.length - 1] &&
                      store.pendingInteraction
                    "
                  >
                    <InteractionRenderer
                      :payload="store.pendingInteraction"
                      @submit="handleInteractionSubmit"
                      @reject="handleInteractionReject"
                    />
                  </template>
                </div>
              </div>
            </template>
            <div v-if="store.loading && !store.pendingInteraction" class="msg msg--assistant">
              <div class="msg__body">
                <div v-if="!lastAssistantHasContent" class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="composer">
          <div class="composer__wrap">
            <textarea
              ref="textareaRef"
              v-model="inputMessage"
              class="composer__input"
              :placeholder="store.senderPlaceholder"
              rows="1"
              @keydown.enter.exact.prevent="handleSend"
              @input="autoResize"
            ></textarea>
            <div class="composer__actions">
              <button
                class="composer__send"
                :disabled="!canSend || store.loading"
                @click="handleSend"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="showToolDialog"
      title="Agent 工具目录"
      fullscreen
      :close-on-click-modal="true"
      class="tools-dialog"
    >
      <div class="tools-dialog__body">
        <div class="tools-dialog__search">
          <el-input
            v-model="toolSearchQuery"
            placeholder="搜索..."
            clearable
            @input="handleToolSearch"
            :prefix-icon="Search"
          />
          <span class="tools-dialog__count">{{ filteredTools.length }}</span>
        </div>
        <div class="tools-dialog__summary" v-if="toolCatalogUpdatedAt">
          <span class="tools-dialog__updated">更新于 {{ toolCatalogUpdatedAt }}</span>
        </div>
        <div class="tools-dialog__filters">
          <button
            v-for="filter in toolSourceFilters"
            :key="filter.key"
            type="button"
            class="tools-filter"
            :class="{ active: toolSourceFilter === filter.key }"
            @click="setToolSourceFilter(filter.key)"
          >
            {{ filter.label }}
          </button>
        </div>
        <el-scrollbar class="tools-dialog__list">
          <div v-if="toolsLoading" class="tools-dialog__loading">
            <el-icon class="is-loading"><Loading /></el-icon>
          </div>
          <template v-else>
            <div v-for="source in filteredToolTree" :key="source.key" class="tools-tree__source">
              <button
                type="button"
                class="tools-tree__source-head"
                @click="toggleToolSource(source.key)"
              >
                <span
                  class="tools-tree__arrow"
                  :class="{ expanded: expandedToolSources.has(source.key) }"
                  >›</span
                >
                <strong>{{ source.label }}</strong>
                <em>{{ source.total }}</em>
              </button>
              <div v-if="expandedToolSources.has(source.key)" class="tools-tree__domains">
                <div v-for="domain in source.domains" :key="domain.key" class="tools-tree__domain">
                  <button
                    type="button"
                    class="tools-tree__domain-head"
                    @click="toggleToolGroup(domain.key)"
                  >
                    <span
                      class="tools-tree__arrow"
                      :class="{ expanded: expandedToolGroups.has(domain.key) }"
                      >›</span
                    >
                    <span>{{ domain.label }}</span>
                    <em>{{ domain.tools.length }}</em>
                  </button>
                  <div v-if="expandedToolGroups.has(domain.key)" class="tools-tree__tools">
                    <div
                      v-for="tool in domain.tools"
                      :key="tool.name"
                      class="tools-row"
                      :class="{ expanded: expandedTool === tool.name }"
                      @click="toggleToolExpand(tool)"
                    >
                      <div class="tools-row__head">
                        <code class="tools-row__name">{{ tool.name }}</code>
                        <span class="tools-row__label">{{ tool.label }}</span>
                        <span
                          class="tools-row__runtime"
                          :class="tool.runtime === 'client' ? 'is-client' : 'is-server'"
                          >{{
                            tool.sourceLabel ||
                            (tool.runtime === "client" ? "客户端 MCP" : "服务端")
                          }}</span
                        >
                      </div>
                      <div class="tools-row__desc">{{ tool.summary || tool.description }}</div>
                      <div class="tools-row__chips">
                        <span v-if="tool.hierarchy?.capability?.label">{{
                          tool.hierarchy.capability.label
                        }}</span>
                        <span v-if="tool.hierarchy?.action?.label">{{
                          tool.hierarchy.action.label
                        }}</span>
                        <span v-if="getToolParameters(tool).length"
                          >{{ getToolParameters(tool).length }} 个参数</span
                        >
                        <span v-if="tool.children?.length">{{ tool.children.length }} 个操作</span>
                        <span v-if="tool.workflow?.requiresConfirmation" class="is-warning"
                          >需确认</span
                        >
                      </div>
                      <div v-if="expandedTool === tool.name" class="tools-row__detail" @click.stop>
                        <div class="tools-row__meta">
                          <span
                            >层级：{{ tool.groupLabel || getCategoryLabel(tool.category) }}</span
                          >
                          <span v-if="tool.hierarchy?.action?.label"
                            >动作：{{ tool.hierarchy.action.label }}</span
                          >
                          <span
                            >执行位置：{{ tool.runtime === "client" ? "客户端" : "服务端" }}</span
                          >
                          <span v-if="tool.riskLevel">风险：{{ tool.riskLevel }}</span>
                          <span v-if="tool.confirmRequired">需要确认</span>
                        </div>
                        <div
                          v-for="p in getToolParameters(tool)"
                          :key="p.name"
                          class="tools-row__param"
                        >
                          <div>
                            <code>{{ p.name }}</code>
                            <span v-if="p.required" class="req">必填</span>
                            <span class="type">{{ p.type }}</span>
                          </div>
                          <small v-if="p.description">{{ p.description }}</small>
                        </div>
                        <div v-if="tool.children?.length" class="tools-row__children">
                          <div class="tools-row__children-title">
                            支持的{{ tool.children[0]?.kind === "action" ? "动作" : "操作" }}
                          </div>
                          <div
                            v-for="child in tool.children"
                            :key="child.key"
                            class="tools-row__child"
                          >
                            <code>{{ child.key }}</code>
                            <span>{{ child.label }}</span>
                            <small v-if="child.description">{{ child.description }}</small>
                          </div>
                        </div>
                        <div v-if="tool.runtime === 'client'" class="tools-row__clients">
                          <span>可用客户端：</span>
                          <code v-for="client in tool.clients || []" :key="client.connectionId">{{
                            client.clientId || client.connectionId
                          }}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-scrollbar>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { InfoFilled, Loading, Search } from "@element-plus/icons-vue";
import { AiAssistantApi } from "@/api/aiAssistant";
import { useAiAssistantStore } from "@/store/modules/aiAssistant";
import { websocketClient } from "@/services/websocketClient";
import type { InteractionSubmitResult } from "./interactions/types";
import MarkdownView from "@/components/MarkdownView/index.vue";
import InteractionRenderer from "./interactions/InteractionRenderer.vue";

defineOptions({ name: "AiAssistant" });

const route = useRoute();
const store = useAiAssistantStore();
const chatScrollRef = ref<HTMLElement>();
const textareaRef = ref<HTMLTextAreaElement>();
const inputMessage = ref("");

const showToolDialog = ref(false);
const toolSearchQuery = ref("");
const allTools = ref<any[]>([]);
const filteredTools = ref<any[]>([]);
const toolsLoading = ref(false);
const expandedTool = ref<string | null>(null);
const expandedToolSources = ref<Set<string>>(new Set(["server", "client"]));
const expandedToolGroups = ref<Set<string>>(new Set());
const toolSourceFilter = ref("all");
const toolCatalogUpdatedAt = ref("");
const hoveredConversation = ref<any>(null);
const popupStyle = ref<Record<string, string>>({});
const sidebarOpen = ref(true);

const canSend = computed(() => inputMessage.value.trim().length > 0 && store.canSend);

const lastAssistantHasContent = computed(() => {
  const last = [...visibleMessages.value].reverse().find((m) => m.role === "assistant");
  return !!(last && last.content);
});

const visibleMessages = computed(() => {
  const list = store.messages.filter((m) => {
    if ((m.role as string) === "system") return false;
    if (m.role === "tool") return false;
    return true;
  });

  const result: typeof list = [];

  function isPollingLog(content: string): boolean {
    if (!content) return false;
    const text = String(content);
    return (
      text.includes("查询图片处理记录详情") ||
      text.includes("查询视频渲染任务") ||
      text.includes("image_processing_record.detail") ||
      text.includes("video_render_execute") ||
      (text.includes("查询") && text.includes("状态")) ||
      (text.includes("查询") && text.includes("详情"))
    );
  }

  for (let i = 0; i < list.length; i++) {
    const msg = list[i];

    // 如果是轮询状态等过程日志，只显示最后一条结果，过滤掉中间的重复过程
    if (msg.role === "assistant" && isPollingLog(msg.content)) {
      const hasLater = list.slice(i + 1).some((m) => m.role === "assistant" && isPollingLog(m.content));
      if (hasLater) {
        continue;
      }
    }

    // 过滤完全相同且相邻的重复消息
    if (result.length > 0) {
      const last = result[result.length - 1];
      if (last.role === msg.role && last.content.trim() === msg.content.trim()) {
        continue;
      }
    }

    result.push(msg);
  }

  return result;
});

const filteredToolTree = computed(() => {
  const sourceMap = new Map<
    string,
    {
      key: string;
      label: string;
      total: number;
      domains: Array<{ key: string; label: string; tools: any[] }>;
    }
  >();
  for (const tool of filteredTools.value) {
    const sourceKey = tool.runtime === "client" ? "client" : "server";
    const sourceLabel = tool.sourceLabel || (sourceKey === "client" ? "客户端 MCP" : "服务端");
    const source = sourceMap.get(sourceKey) || {
      key: sourceKey,
      label: sourceLabel,
      total: 0,
      domains: [],
    };
    source.total += 1;
    const domainKey = tool.groupKey || `${sourceKey}.${tool.category || "other"}`;
    let domain = source.domains.find((item) => item.key === domainKey);
    if (!domain) {
      domain = {
        key: domainKey,
        label: tool.groupLabel || getCategoryLabel(tool.category),
        tools: [],
      };
      source.domains.push(domain);
    }
    domain.tools.push(tool);
    sourceMap.set(sourceKey, source);
  }
  return Array.from(sourceMap.values());
});

const toolSourceFilters = computed(() => [
  { key: "all", label: "全部" },
  { key: "server", label: "服务端" },
  { key: "client", label: "客户端 MCP" },
]);

function getCategoryLabel(key: string) {
  const m: Record<string, string> = {
    system: "系统",
    temu: "Temu",
    browser: "浏览器",
    material: "素材",
    product: "商品",
    shop: "店铺",
    publish: "发布",
    statistics: "统计",
    "ps-automation": "PS",
    ai: "AI",
    other: "其他",
  };
  return m[key] || key;
}

function toggleToolExpand(tool: any) {
  expandedTool.value = expandedTool.value === tool.name ? null : tool.name;
}

function toggleToolSource(key: string) {
  const next = new Set(expandedToolSources.value);
  next.has(key) ? next.delete(key) : next.add(key);
  expandedToolSources.value = next;
}

function toggleToolGroup(key: string) {
  const next = new Set(expandedToolGroups.value);
  next.has(key) ? next.delete(key) : next.add(key);
  expandedToolGroups.value = next;
}

function formatToolResult(result: any) {
  if (!result) return "";
  const text = result?.content?.[0]?.text || JSON.stringify(result, null, 2);
  return text.length > 500 ? text.slice(0, 500) + "..." : text;
}

function autoResize() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 200) + "px";
}

function scrollToBottom() {
  nextTick(() => {
    if (chatScrollRef.value) {
      chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight;
    }
  });
}

function buildPageContext() {
  return {
    routePath: route.path,
    fullPath: route.fullPath,
    routeName: String(route.name || ""),
    routeTitle: String(route.meta?.title || ""),
    query: route.query,
    params: route.params,
  };
}

function handleSend() {
  if (!canSend.value || store.loading) return;
  const text = inputMessage.value.trim();
  if (!text) return;
  inputMessage.value = "";
  if (textareaRef.value) textareaRef.value.style.height = "auto";
  store.sendMessage(text, buildPageContext());
  scrollToBottom();
}

async function handleRefresh() {
  store.resetLoadingState();
  try {
    await store.loadConversations();
    if (store.currentConversationId) {
      await store.loadMessages();
    }
    ElMessage.success("刷新成功");
  } catch (error) {
    console.error("刷新会话失败:", error);
  }
}

async function handleCreateConversation() {
  await store.createConversation();
  nextTick(() => textareaRef.value?.focus());
}
async function handleSelectConversation(id: number) {
  await store.selectConversation(id);
  nextTick(() => textareaRef.value?.focus());
}

function showConversationDetail(conv: any, event: MouseEvent) {
  hoveredConversation.value = conv;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const popupHeight = 200;
  const viewportHeight = window.innerHeight;
  let top = rect.top;
  if (top + popupHeight > viewportHeight) {
    top = viewportHeight - popupHeight - 16;
  }
  popupStyle.value = {
    position: "fixed",
    left: `${rect.right + 8}px`,
    top: `${top}px`,
  };
}

function hideConversationDetail() {
  hoveredConversation.value = null;
}

function formatTime(dateStr: string | null | undefined) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hasMetric(value: number | string | null | undefined) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function formatDuration(ms: number | string | null | undefined) {
  if (!hasMetric(ms)) return "-";
  const num = Math.max(0, Number(ms));
  if (num < 1000) return `${num}ms`;
  if (num < 60000) return `${(num / 1000).toFixed(1)}s`;
  return `${(num / 60000).toFixed(1)}min`;
}

function getMessageRunId(message: any) {
  return String(message.runId || message.runTrace?.runId || "").trim();
}

function getMessageToolDetails(message: any) {
  const tools = Array.isArray(message.runTrace?.tools) ? message.runTrace.tools : [];
  if (tools.length) return tools;
  if (!message.toolKey) return [];
  return [
    {
      tool: message.toolKey,
      label: message.toolLabel,
      success: message.toolResult?.success,
      summary: message.toolResult?.summary,
      durationMs: message.toolResult?.durationMs ?? message.toolExecutionMs,
      startedAt: message.toolResult?.startedAt || message.startedAt,
      completedAt: message.toolResult?.completedAt || message.completedAt,
    },
  ];
}

function getMessageDetailsTooltip(message: any) {
  const parts = [];
  if (hasMetric(message.durationMs)) parts.push(`总耗时 ${formatDuration(message.durationMs)}`);
  if (hasMetric(message.aiResponseMs)) parts.push(`AI ${formatDuration(message.aiResponseMs)}`);
  if (hasMetric(message.toolExecutionMs))
    parts.push(`工具 ${formatDuration(message.toolExecutionMs)}`);
  const tools = getMessageToolDetails(message);
  if (tools.length) parts.push(`${tools.length} 个工具`);
  return parts.length ? parts.join(" / ") : "查看消息详情";
}

function hasMessageDetails(message: any) {
  return Boolean(
    message.startedAt ||
    message.completedAt ||
    hasMetric(message.durationMs) ||
    hasMetric(message.aiResponseMs) ||
    hasMetric(message.toolExecutionMs) ||
    getMessageToolDetails(message).length ||
    getMessageRunId(message) ||
    message.toolKey,
  );
}

function handleInteractionSubmit(r: InteractionSubmitResult) {
  if (!store.pendingInteraction?.runId || store.loading) return;
  store.resumeInteraction(r.confirmed, r.input, r.reason || "");
}
function handleInteractionReject(r: InteractionSubmitResult) {
  const p = store.pendingInteraction;
  if (!p?.runId || store.loading) return;
  store.resumeInteraction(false, { ...(p.input || {}), action: "reject" }, r.reason || "跳过");
}

async function handleOpenToolDialog() {
  showToolDialog.value = true;
  toolsLoading.value = true;
  try {
    const data = await AiAssistantApi.getToolCatalog();
    allTools.value = (data.tools || []).map((t: any) => ({
      ...t,
      parameters: extractParams(t.inputSchema),
    }));
    toolCatalogUpdatedAt.value = data.generatedAt
      ? new Date(data.generatedAt).toLocaleTimeString()
      : "";
    handleToolSearch();
  } catch (e: any) {
    ElMessage.error(e?.message || "加载失败");
  } finally {
    toolsLoading.value = false;
  }
}

function extractParams(schema: any): any[] {
  if (!schema?.properties) return [];
  const req = schema.required || [];
  return Object.entries(schema.properties).map(([k, v]: [string, any]) => ({
    name: k,
    label: v.label || k,
    description: v.description || "",
    type: Array.isArray(v.type) ? v.type.join(" | ") : v.type || "any",
    required: req.includes(k),
  }));
}

function getToolParameters(tool: any) {
  return tool.parameters || [];
}

function handleToolSearch() {
  const q = toolSearchQuery.value.toLowerCase().trim();
  filteredTools.value = allTools.value.filter((t) => {
    const matchesSource =
      toolSourceFilter.value === "all" ||
      (toolSourceFilter.value === "client" ? t.runtime === "client" : t.runtime !== "client");
    const matchesQuery =
      !q ||
      t.name.toLowerCase().includes(q) ||
      String(t.label || "")
        .toLowerCase()
        .includes(q) ||
      String(t.description || "")
        .toLowerCase()
        .includes(q);
    return matchesSource && matchesQuery;
  });
}

function setToolSourceFilter(filter: string) {
  toolSourceFilter.value = filter;
  handleToolSearch();
}

function handleMcpAsyncResult(data: { requestId: string; toolName: string; result: any }) {
  const { toolName, result } = data || {};
  if (!result) return;
  const text = result?.content?.[0]?.text || JSON.stringify(result);
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  const display = typeof parsed === "object" ? JSON.stringify(parsed, null, 2) : String(parsed);
  store.addSystemMessage(`[客户端工具 ${toolName}] 执行完成:\n${display}`);
}

watch(() => store.messages.length, scrollToBottom);
watch(() => store.loading, scrollToBottom);

onMounted(() => {
  store.initialize();
  websocketClient.events.on("mcp-async-result", handleMcpAsyncResult);
});

onUnmounted(() => {
  websocketClient.events.off("mcp-async-result", handleMcpAsyncResult);
});
</script>

<style scoped>
/* ════════════════════════════════════════
   AI Assistant — Adaptive Theme
   ════════════════════════════════════════ */

.ai-desktop {
  --bg: var(--app-content-bg-color);
  --surface: var(--bg);
  --surface-hover: var(--el-fill-color-light);
  --border: var(--app-content-border-color);
  --text: var(--el-text-color-primary);
  --text-2: var(--el-text-color-regular);
  --text-3: var(--el-text-color-secondary);
  --primary: var(--el-color-primary);
  --success: var(--el-color-success);
  --danger: var(--el-color-danger);

  display: flex;
  height: 100%;
  min-height: 0;
  background: var(--bg);
  color: var(--text);
  font-family:
    "Inter",
    "SF Pro Display",
    system-ui,
    -apple-system,
    sans-serif;
}

/* ── Sidebar ── */
.sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  border-right: 1px solid var(--border);
}

.sidebar__logo {
  padding: 12px;
  flex-shrink: 0;
}

.sidebar__new {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-2);
  transition: all 0.15s;
}
.sidebar__new:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.sidebar__nav {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px 10px;
}

.sidebar__section {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
  font-size: 12px;
  color: var(--text-2);
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}
.sidebar__item:hover {
  background: var(--surface-hover);
  color: var(--text);
}
.sidebar__item.active {
  background: var(--el-fill-color-light);
}

.sidebar__item-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
  display: block;
}

.sidebar__item-main {
  flex: 1;
  min-width: 0;
}

.sidebar__item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  font-size: 11px;
  color: var(--text-3);
}

.sidebar__item-count {
  color: var(--text-3);
}

.sidebar__item-status {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
}

.sidebar__item-status--running {
  background: color-mix(in srgb, var(--el-color-primary) 15%, transparent);
  color: var(--el-color-primary);
}

.sidebar__item-status--error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.conversation-detail-popup {
  width: 280px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  padding: 16px;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.conversation-detail-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.conversation-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.conversation-detail-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.detail-label {
  color: var(--text-3);
}

.detail-value {
  color: var(--text);
  font-weight: 500;
}

.sidebar__item-del {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  color: var(--text-3);
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.1s;
}
.sidebar__item-del:hover {
  color: var(--text);
}
.sidebar__item:hover .sidebar__item-del {
  opacity: 1;
}

.sidebar__empty {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-3);
}

.sidebar__bottom {
  flex-shrink: 0;
  padding: 0 8px 8px;
}

/* ── Workspace ── */
.workspace {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* ── Topbar ── */
.topbar {
  height: 44px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.topbar__left {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.topbar__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.topbar__right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.topbar__menu {
  display: none;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  color: var(--text-2);
  flex-shrink: 0;
  transition: background 0.12s;
}
.topbar__menu:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.topbar__btn {
  height: 28px;
  padding: 0 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-2);
  transition: all 0.15s;
}
.topbar__btn:hover {
  background: var(--surface-hover);
  color: var(--text);
}

/* ── Chat ── */
.chat {
  flex: 1;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
}

.chat__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 0 80px;
}

.chat__list {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
}

.chat__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}
.chat__empty-text {
  font-size: 14px;
  color: var(--text-3);
}

/* ── Message ── */
.msg {
  display: flex;
  gap: 14px;
  padding: 8px 0;
}

.msg--user {
  justify-content: flex-end;
}
.msg--user .msg__body {
  max-width: 85%;
}
.msg--user .msg__text {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px 16px 4px 16px;
  padding: 10px 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text);
  display: inline-block;
}

.msg--assistant {
  justify-content: flex-start;
}
.msg--assistant .msg__body {
  flex: 1;
  min-width: 0;
}

.msg__content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
}

.msg__text {
  white-space: pre-wrap;
}

.msg__meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-3);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease-in-out;
}

.msg:hover .msg__meta {
  opacity: 1;
  pointer-events: auto;
}

.msg--user .msg__meta {
  text-align: right;
}

.msg__meta-toggle {
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-3);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  vertical-align: top;
}

.msg__meta-toggle:hover,
.msg__meta-toggle:focus-visible {
  background: var(--surface-hover);
  color: var(--text-2);
}

.msg__meta-panel {
  display: grid;
  gap: 4px;
  max-width: 100%;
  text-align: left;
}

.msg__meta-row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 8px;
  align-items: baseline;
}

.msg__meta-row strong {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--text-2);
  font-weight: 500;
}

.msg__meta-tools {
  display: grid;
  gap: 5px;
  margin-top: 2px;
  padding-top: 6px;
  border-top: 1px solid var(--border);
}

.msg__meta-tools-title {
  color: var(--text-3);
}

.msg__meta-tool {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px 10px;
  align-items: center;
}

.msg__meta-tool-main {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.msg__meta-tool-main strong {
  overflow: hidden;
  color: var(--text-2);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.msg__meta-tool-status {
  width: 6px;
  height: 6px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #16a34a;
}

.msg__meta-tool-status.failed {
  background: #dc2626;
}

.msg__meta-tool small {
  grid-column: 1 / -1;
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--text-3);
}

:global(.ai-message-detail-popover) {
  padding: 10px 12px;
  border-radius: 6px;
}

/* ── Markdown body (scoped overrides) ── */
.md-body :deep(p) {
  margin: 0 0 8px;
}
.md-body :deep(p:last-child) {
  margin-bottom: 0;
}
.md-body :deep(pre) {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
  overflow-x: auto;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 13px;
  line-height: 1.5;
  margin: 8px 0;
}
.md-body :deep(code) {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 13px;
}
.md-body :deep(:not(pre) > code) {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 5px;
}
.md-body :deep(ul),
.md-body :deep(ol) {
  padding-left: 20px;
  margin: 6px 0;
}
.md-body :deep(li) {
  margin: 2px 0;
}
.md-body :deep(blockquote) {
  border-left: 2px solid var(--border);
  padding-left: 12px;
  margin: 8px 0;
  color: var(--text-2);
}
.md-body :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
  font-size: 13px;
}
.md-body :deep(th),
.md-body :deep(td) {
  border: 1px solid var(--border);
  padding: 6px 10px;
  text-align: left;
}
.md-body :deep(th) {
  background: var(--surface);
  font-weight: 600;
}
.md-body :deep(a) {
  color: var(--el-color-primary);
  text-decoration: none;
}
.md-body :deep(a:hover) {
  text-decoration: underline;
}
.md-body :deep(h1),
.md-body :deep(h2),
.md-body :deep(h3),
.md-body :deep(h4) {
  margin: 12px 0 6px;
  font-weight: 600;
}
.md-body :deep(h1) {
  font-size: 20px;
}
.md-body :deep(h2) {
  font-size: 17px;
}
.md-body :deep(h3) {
  font-size: 15px;
}
.md-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 12px 0;
}

/* ── Tool Card ── */
.tool-card {
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 14px;
  margin: 6px 0;
}

.tool-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-2);
}

.tool-card__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
}

.tool-card__name {
  font-family: "JetBrains Mono", monospace;
  font-weight: 500;
  color: var(--text);
}

.tool-card__result {
  margin-top: 8px;
}

.tool-card__pre {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px;
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-2);
  overflow-x: auto;
  margin: 0;
}

/* ── Thinking Block ── */
.thinking-block {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 10px 16px;
  margin-top: 8px;
  font-size: 13px;
  color: var(--text-2);
}

.thinking-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-3);
  animation: pulse 1.4s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}

/* ── Typing Indicator ── */
.typing-indicator {
  display: inline-flex;
  gap: 4px;
  padding: 4px 0;
}
.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-3);
  animation: typingBounce 1.4s infinite;
}
.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}
.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingBounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

/* ── Composer ── */
.composer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 24px 12px;
  pointer-events: none;
}

.composer__wrap {
  max-width: 700px;
  margin: 0 auto;
  position: relative;
  pointer-events: auto;
}

.composer__input {
  width: 100%;
  min-height: 44px;
  max-height: 200px;
  padding: 10px 48px 10px 16px;
  background: var(--surface);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: 20px;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text);
  transition: border-color 0.15s;
}
.composer__input::placeholder {
  color: var(--text-3);
}
.composer__input:focus {
  border-color: var(--el-color-primary);
}

.composer__actions {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.composer__send {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: var(--surface);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}
.composer__send:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.composer__send:not(:disabled):hover {
  opacity: 0.85;
}

/* ── Tools Dialog (dark) ── */
.tools-dialog :deep(.el-dialog) {
  background: var(--surface) !important;
}
.tools-dialog :deep(.el-dialog__header) {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  margin: 0;
}
.tools-dialog :deep(.el-dialog__title) {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}
.tools-dialog :deep(.el-dialog__body) {
  padding: 0;
  color: var(--text);
}
.tools-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: var(--text-2);
}
.tools-dialog__body {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px);
}
.tools-dialog__search {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.tools-dialog__search :deep(.el-input__wrapper) {
  background: var(--surface);
  box-shadow: 0 0 0 1px var(--border);
}
.tools-dialog__search :deep(.el-input__inner) {
  color: var(--text);
}
.tools-dialog__search :deep(.el-input__prefix .el-icon) {
  color: var(--text-3);
}
.tools-dialog__count {
  font-size: 12px;
  color: var(--text-3);
}
.tools-dialog__summary {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 8px 16px 0;
  font-size: 12px;
  color: var(--text-2);
}
.tools-dialog__updated {
  color: var(--text-3);
}
.tools-dialog__filters {
  display: flex;
  gap: 6px;
  padding: 8px 16px;
}
.tools-filter {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px 10px;
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
  font-size: 12px;
}
.tools-filter.active {
  border-color: var(--primary);
  color: var(--primary);
}
.tools-dialog__list {
  flex: 1;
  min-height: 0;
}
.tools-dialog__loading {
  display: flex;
  justify-content: center;
  padding: 40px;
  color: var(--text-3);
}
.tools-tree__source {
  border-bottom: 1px solid var(--border);
}
.tools-tree__source-head,
.tools-tree__domain-head {
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
}
.tools-tree__source-head {
  padding: 12px 16px;
  background: var(--bg);
}
.tools-tree__source-head strong {
  font-size: 13px;
}
.tools-tree__source-head em,
.tools-tree__domain-head em {
  margin-left: auto;
  color: var(--text-3);
  font-size: 10px;
  font-style: normal;
}
.tools-tree__domain-head {
  padding: 9px 16px 9px 28px;
  color: var(--text-2);
  border-top: 1px solid var(--border);
}
.tools-tree__domain-head:hover,
.tools-tree__source-head:hover {
  background: var(--surface-hover);
}
.tools-tree__arrow {
  display: inline-flex;
  width: 14px;
  justify-content: center;
  color: var(--text-3);
  font-size: 18px;
  line-height: 1;
  transition: transform 0.15s ease;
}
.tools-tree__arrow.expanded {
  transform: rotate(90deg);
}
.tools-tree__tools {
  padding-left: 28px;
}
.tools-tree__children {
  margin: 0 12px 8px 42px;
  padding: 5px 0;
  border-left: 1px solid var(--border);
}
.tools-tree__child {
  display: grid;
  grid-template-columns: 18px 150px 110px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  color: var(--text-2);
  font-size: 11px;
}
.tools-tree__child:hover {
  background: var(--surface-hover);
}
.tools-tree__child-marker {
  color: var(--text-3);
}
.tools-tree__child code {
  color: var(--text);
  font-family: monospace;
}
.tools-tree__child strong {
  color: var(--text-2);
  font-weight: 600;
}
.tools-tree__child-description,
.tools-tree__child-count {
  overflow: hidden;
  color: var(--text-3);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tools-tree__child-count {
  color: var(--text-2);
}

.tools-group__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 4px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.tools-group__title em {
  min-width: 18px;
  padding: 2px 5px;
  border-radius: 999px;
  background: var(--bg);
  color: var(--text-3);
  font-size: 10px;
  font-style: normal;
  text-align: center;
}

.tools-row {
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.1s;
  border-left: 2px solid transparent;
}
.tools-row:hover {
  background: var(--surface-hover);
}
.tools-row.expanded {
  background: var(--surface);
  border-left-color: var(--primary);
}
.tools-row__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tools-row__name {
  font-family: monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
}
.tools-row__label {
  font-size: 12px;
  color: var(--text-2);
}
.tools-row__runtime {
  margin-left: auto;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 10px;
  white-space: nowrap;
}
.tools-row__runtime.is-server {
  color: var(--primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}
.tools-row__runtime.is-client {
  color: #67c23a;
  background: rgba(103, 194, 58, 0.12);
}
.tools-row__desc {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tools-row__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 6px;
}
.tools-row__chips span {
  border-radius: 4px;
  padding: 2px 6px;
  background: var(--bg);
  color: var(--text-3);
  font-size: 10px;
}
.tools-row__chips span.is-warning {
  color: #e6a23c;
  background: rgba(230, 162, 60, 0.12);
}
.tools-row__detail {
  margin-top: 6px;
  padding: 8px;
  background: var(--bg);
  border-radius: 8px;
  border: 1px solid var(--border);
}
.tools-row__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-bottom: 8px;
  color: var(--text-3);
  font-size: 11px;
}
.tools-row__param {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  font-size: 11px;
  padding: 4px 0;
}
.tools-row__param code {
  font-family: monospace;
  font-weight: 600;
  min-width: 80px;
  color: var(--text);
}
.tools-row__param .req {
  font-size: 10px;
  color: var(--danger);
}
.tools-row__param .type {
  font-size: 10px;
  color: var(--text-3);
}
.tools-row__param small {
  color: var(--text-3);
  line-height: 1.4;
}
.tools-row__clients {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  color: var(--text-3);
  font-size: 11px;
}
.tools-row__children {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}
.tools-row__children-title {
  margin-bottom: 5px;
  color: var(--text-2);
  font-size: 11px;
  font-weight: 600;
}
.tools-row__child {
  display: grid;
  grid-template-columns: 18px 150px 110px minmax(0, 1fr);
  gap: 8px;
  align-items: baseline;
  padding: 3px 0;
  color: var(--text-2);
  font-size: 11px;
}
.tools-row__child::before {
  content: "↳";
  color: var(--text-3);
}
.tools-row__child code {
  color: var(--text);
  font-family: monospace;
}
.tools-row__child small {
  color: var(--text-3);
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    width: 260px;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
  }
  .ai-desktop--sidebar-open .sidebar {
    transform: translateX(0);
  }
  .ai-desktop--sidebar-open::after {
    content: "";
    position: fixed;
    inset: 0;
    z-index: 99;
    background: var(--el-overlay-color);
  }

  .topbar__menu {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .topbar {
    padding: 0 12px;
    gap: 8px;
  }
  .topbar__title {
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .topbar__btn {
    font-size: 12px;
    padding: 0 8px;
    height: 28px;
  }

  .chat__list {
    padding: 0 12px;
  }
  .chat__scroll {
    padding-bottom: 70px;
  }

  .composer {
    padding: 0 12px 8px;
  }
  .composer__input {
    min-height: 40px;
    font-size: 14px;
  }

  .msg {
    gap: 8px;
  }
  .msg--user .msg__body {
    max-width: 90%;
  }
  .msg__content {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 240px;
  }

  .chat__list {
    padding: 0 8px;
  }

  .msg--user .msg__text {
    font-size: 13px;
    padding: 8px 12px;
  }
  .msg--user .msg__body {
    max-width: 92%;
  }

  .tools-dialog__body {
    height: calc(100vh - 48px);
  }
  .tools-dialog__search {
    padding: 10px 12px;
  }
}
</style>
