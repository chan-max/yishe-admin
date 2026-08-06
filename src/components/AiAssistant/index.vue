<template>
  <div class="ai-desktop">
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
            <button class="sidebar__item-del" @click.stop="store.deleteConversation(conv.id)">×</button>
          </div>
          <div v-if="!store.conversations.length" class="sidebar__empty">暂无会话</div>
        </div>
      </div>

      <!-- 对话详情浮层 -->
      <div
        v-if="hoveredConversation"
        class="conversation-detail-popup"
        :style="popupStyle"
      >
        <div class="conversation-detail-header">
          <span class="conversation-detail-title">{{ hoveredConversation.title || "未命名会话" }}</span>
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
              {{ hoveredConversation.successfulRunCount || 0 }} 成功
              / {{ hoveredConversation.failedRunCount || 0 }} 失败
            </span>
          </div>
          <div class="detail-row" v-if="hoveredConversation.totalDurationMs">
            <span class="detail-label">总耗时</span>
            <span class="detail-value">{{ formatDuration(hoveredConversation.totalDurationMs) }}</span>
          </div>
          <div class="detail-row" v-if="hoveredConversation.avgAiResponseMs">
            <span class="detail-label">平均AI响应</span>
            <span class="detail-value">{{ formatDuration(hoveredConversation.avgAiResponseMs) }}</span>
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
          <button v-if="store.loading" class="topbar__btn" @click="store.resetLoadingState()">刷新</button>
          <button v-if="store.messages.length" class="topbar__btn" @click="store.clearMessages()">清空</button>
        </div>
      </header>

      <div class="chat">
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
                      <div v-if="msg.content && store.thinkingText && store.loading && msg === visibleMessages[visibleMessages.length - 1]" class="thinking-block">
                        <span class="thinking-dot"></span>
                        <span>{{ store.thinkingText }}</span>
                      </div>
                    </template>
                  </div>
                  <template v-if="msg.role === 'assistant' && msg === visibleMessages[visibleMessages.length - 1] && store.pendingInteraction">
                    <InteractionRenderer
                      :payload="store.pendingInteraction"
                      @submit="$emit('interaction-submit', $event)"
                      @reject="$emit('interaction-reject', $event)"
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
              <button class="composer__send" :disabled="!canSend || store.loading" @click="handleSend">↑</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showToolDialog" title="工具" fullscreen :close-on-click-modal="true" class="tools-dialog">
      <div class="tools-dialog__body">
        <div class="tools-dialog__search">
          <el-input v-model="toolSearchQuery" placeholder="搜索..." clearable @input="handleToolSearch" :prefix-icon="Search"/>
          <span class="tools-dialog__count">{{ filteredTools.length }}</span>
        </div>
        <el-scrollbar class="tools-dialog__list">
          <div v-if="toolsLoading" class="tools-dialog__loading"><el-icon class="is-loading"><Loading /></el-icon></div>
          <template v-else>
            <div v-for="group in filteredToolGroups" :key="group.key" class="tools-group">
              <div class="tools-group__title">{{ group.label }}</div>
              <div
                v-for="tool in group.tools"
                :key="tool.name"
                class="tools-row"
                :class="{ expanded: expandedTool === tool.name }"
                @click="toggleToolExpand(tool)"
              >
                <div class="tools-row__head">
                  <code class="tools-row__name">{{ tool.name }}</code>
                  <span class="tools-row__label">{{ tool.label }}</span>
                </div>
                <div class="tools-row__desc">{{ tool.description }}</div>
                <div v-if="expandedTool === tool.name" class="tools-row__detail" @click.stop>
                  <div v-for="p in getToolParameters(tool)" :key="p.name" class="tools-row__param">
                    <code>{{ p.name }}</code>
                    <span v-if="p.required" class="req">必填</span>
                    <span class="type">{{ p.type }}</span>
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
import { Delete, Grid, Loading, Search } from "@element-plus/icons-vue";
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
const hoveredConversation = ref<any>(null);
const popupStyle = ref<Record<string, string>>({});

const canSend = computed(() => inputMessage.value.trim().length > 0 && store.canSend);

const lastAssistantHasContent = computed(() => {
  const last = [...visibleMessages.value].reverse().find(m => m.role === "assistant");
  return !!(last && last.content);
});

const visibleMessages = computed(() =>
  store.messages.filter((m) => {
    if (m.role === "system") return false;
    if (m.role === "tool") return false;
    return true;
  })
);

const filteredToolGroups = computed(() => {
  const map = new Map<string, { key: string; label: string; tools: any[] }>();
  for (const tool of filteredTools.value) {
    const cat = tool.category || "other";
    if (!map.has(cat)) map.set(cat, { key: cat, label: getCategoryLabel(cat), tools: [] });
    map.get(cat)!.tools.push(tool);
  }
  return Array.from(map.values());
});

function getCategoryLabel(key: string) {
  const m: Record<string, string> = { system: "系统", temu: "Temu", browser: "浏览器", material: "素材", product: "商品", shop: "店铺", publish: "发布", statistics: "统计", "ps-automation": "PS", ai: "AI", other: "其他" };
  return m[key] || key;
}

function toggleToolExpand(tool: any) { expandedTool.value = expandedTool.value === tool.name ? null : tool.name; }

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
  return { routePath: route.path, fullPath: route.fullPath, routeName: String(route.name || ""), routeTitle: String(route.meta?.title || ""), query: route.query, params: route.params };
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

async function handleCreateConversation() { await store.createConversation(); nextTick(() => textareaRef.value?.focus()); }
async function handleSelectConversation(id: number) { await store.selectConversation(id); nextTick(() => textareaRef.value?.focus()); }

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
    position: 'fixed',
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
  return d.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatDuration(ms: number | string | null | undefined) {
  if (!ms) return "-";
  const num = Number(ms);
  if (num < 1000) return `${num}ms`;
  if (num < 60000) return `${(num / 1000).toFixed(1)}s`;
  return `${(num / 60000).toFixed(1)}min`;
}

function handleInteractionSubmit(r: InteractionSubmitResult) { if (!store.pendingInteraction?.runId || store.loading) return; store.resumeInteraction(r.confirmed, r.input, r.reason || ""); }
function handleInteractionReject(r: InteractionSubmitResult) { const p = store.pendingInteraction; if (!p?.runId || store.loading) return; store.resumeInteraction(false, { ...(p.input || {}), action: "reject" }, r.reason || "跳过"); }

async function handleOpenToolDialog() {
  showToolDialog.value = true;
  if (allTools.value.length) return;
  toolsLoading.value = true;
  try {
    const data = await AiAssistantApi.getTools();
    allTools.value = (data.tools || []).map((t: any) => ({ ...t, parameters: extractParams(t.inputSchema) }));
    filteredTools.value = allTools.value;
  } catch (e: any) { ElMessage.error(e?.message || "加载失败"); }
  finally { toolsLoading.value = false; }
}

function extractParams(schema: any): any[] {
  if (!schema?.properties) return [];
  const req = schema.required || [];
  return Object.entries(schema.properties).map(([k, v]: [string, any]) => ({ name: k, label: v.label || k, description: v.description || "", type: Array.isArray(v.type) ? v.type.join(" | ") : (v.type || "any"), required: req.includes(k) }));
}

function getToolParameters(tool: any) { return tool.parameters || []; }

function handleToolSearch() {
  const q = toolSearchQuery.value.toLowerCase().trim();
  filteredTools.value = q ? allTools.value.filter(t => t.name.toLowerCase().includes(q) || t.label.toLowerCase().includes(q)) : allTools.value;
}

function handleMcpAsyncResult(data: { requestId: string; toolName: string; result: any }) {
  const { toolName, result } = data || {};
  if (!result) return;
  const text = result?.content?.[0]?.text || JSON.stringify(result);
  let parsed: any;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
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
  font-family: "Inter", "SF Pro Display", system-ui, -apple-system, sans-serif;
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
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-2);
  transition: all .15s;
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
  padding: 4px 8px;
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background .12s;
  font-size: 14px;
  color: var(--text-2);
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}
.sidebar__item:hover { background: var(--surface-hover); color: var(--text); }
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
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
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
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
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
  transition: opacity .1s;
}
.sidebar__item-del:hover { color: var(--text); }
.sidebar__item:hover .sidebar__item-del { opacity: 1; }

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

.topbar__left { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; }
.topbar__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.topbar__right { display: flex; align-items: center; gap: 4px; }

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
  transition: background .12s;
}
.topbar__menu:hover { background: var(--surface-hover); color: var(--text); }

.topbar__btn {
  height: 28px;
  padding: 0 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-2);
  transition: all .15s;
}
.topbar__btn:hover { background: var(--surface-hover); color: var(--text); }

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
.chat__empty-text { font-size: 14px; color: var(--text-3); }

/* ── Message ── */
.msg {
  display: flex;
  gap: 14px;
  padding: 8px 0;
}

.msg--user { justify-content: flex-end; }
.msg--user .msg__body { max-width: 85%; }
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

.msg--assistant { justify-content: flex-start; }
.msg--assistant .msg__body { flex: 1; min-width: 0; }

.msg__content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
}

.msg__text { white-space: pre-wrap; }

/* ── Markdown body (scoped overrides) ── */
.md-body :deep(p) { margin: 0 0 8px; }
.md-body :deep(p:last-child) { margin-bottom: 0; }
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
.md-body :deep(ul), .md-body :deep(ol) { padding-left: 20px; margin: 6px 0; }
.md-body :deep(li) { margin: 2px 0; }
.md-body :deep(blockquote) {
  border-left: 2px solid var(--border);
  padding-left: 12px;
  margin: 8px 0;
  color: var(--text-2);
}
.md-body :deep(table) { border-collapse: collapse; margin: 8px 0; font-size: 13px; }
.md-body :deep(th), .md-body :deep(td) {
  border: 1px solid var(--border);
  padding: 6px 10px;
  text-align: left;
}
.md-body :deep(th) { background: var(--surface); font-weight: 600; }
.md-body :deep(a) { color: var(--el-color-primary); text-decoration: none; }
.md-body :deep(a:hover) { text-decoration: underline; }
.md-body :deep(h1), .md-body :deep(h2), .md-body :deep(h3), .md-body :deep(h4) { margin: 12px 0 6px; font-weight: 600; }
.md-body :deep(h1) { font-size: 20px; }
.md-body :deep(h2) { font-size: 17px; }
.md-body :deep(h3) { font-size: 15px; }
.md-body :deep(hr) { border: none; border-top: 1px solid var(--border); margin: 12px 0; }

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
  0%, 100% { opacity: .4; }
  50% { opacity: 1; }
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
.typing-indicator span:nth-child(2) { animation-delay: .2s; }
.typing-indicator span:nth-child(3) { animation-delay: .4s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: .4; }
  30% { transform: translateY(-4px); opacity: 1; }
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
  transition: border-color .15s;
}
.composer__input::placeholder { color: var(--text-3); }
.composer__input:focus { border-color: var(--el-color-primary); }

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
  transition: opacity .15s;
}
.composer__send:disabled { opacity: .3; cursor: not-allowed; }
.composer__send:not(:disabled):hover { opacity: .85; }

/* ── Tools Dialog (dark) ── */
.tools-dialog :deep(.el-dialog) { background: var(--surface) !important; }
.tools-dialog :deep(.el-dialog__header) { padding: 12px 16px; border-bottom: 1px solid var(--border); margin: 0; }
.tools-dialog :deep(.el-dialog__title) { font-size: 14px; font-weight: 600; color: var(--text); }
.tools-dialog :deep(.el-dialog__body) { padding: 0; color: var(--text); }
.tools-dialog :deep(.el-dialog__headerbtn .el-dialog__close) { color: var(--text-2); }
.tools-dialog__body { display: flex; flex-direction: column; height: calc(100vh - 48px); }
.tools-dialog__search { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--border); }
.tools-dialog__search :deep(.el-input__wrapper) { background: var(--surface); box-shadow: 0 0 0 1px var(--border); }
.tools-dialog__search :deep(.el-input__inner) { color: var(--text); }
.tools-dialog__search :deep(.el-input__prefix .el-icon) { color: var(--text-3); }
.tools-dialog__count { font-size: 12px; color: var(--text-3); }
.tools-dialog__list { flex: 1; min-height: 0; }
.tools-dialog__loading { display: flex; justify-content: center; padding: 40px; color: var(--text-3); }

.tools-group__title { padding: 10px 16px 4px; font-size: 10px; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: .4px; }

.tools-row { padding: 8px 16px; cursor: pointer; transition: background .1s; border-left: 2px solid transparent; }
.tools-row:hover { background: var(--surface-hover); }
.tools-row.expanded { background: var(--surface); border-left-color: var(--primary); }
.tools-row__head { display: flex; align-items: center; gap: 8px; }
.tools-row__name { font-family: monospace; font-size: 12px; font-weight: 600; color: var(--text); }
.tools-row__label { font-size: 12px; color: var(--text-2); }
.tools-row__desc { font-size: 11px; color: var(--text-3); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tools-row__detail { margin-top: 6px; padding: 8px; background: var(--bg); border-radius: 8px; border: 1px solid var(--border); }
.tools-row__param { display: flex; align-items: center; gap: 6px; font-size: 11px; padding: 2px 0; }
.tools-row__param code { font-family: monospace; font-weight: 600; min-width: 80px; color: var(--text); }
.tools-row__param .req { font-size: 10px; color: var(--danger); }
.tools-row__param .type { font-size: 10px; color: var(--text-3); }

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
    transition: transform .2s ease;
    box-shadow: 4px 0 20px rgba(0, 0, 0, .15);
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

  .topbar__menu { display: flex; align-items: center; justify-content: center; }
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

  .chat__list { padding: 0 12px; }
  .chat__scroll { padding-bottom: 70px; }

  .composer {
    padding: 0 12px 8px;
  }
  .composer__input {
    min-height: 40px;
    font-size: 14px;
  }

  .msg { gap: 8px; }
  .msg--user .msg__body { max-width: 90%; }
  .msg__content { font-size: 13px; }
}

@media (max-width: 480px) {
  .sidebar { width: 240px; }

  .chat__list { padding: 0 8px; }

  .msg--user .msg__text {
    font-size: 13px;
    padding: 8px 12px;
  }
  .msg--user .msg__body { max-width: 92%; }

  .tools-dialog__body { height: calc(100vh - 48px); }
  .tools-dialog__search { padding: 10px 12px; }
}
</style>
