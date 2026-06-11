<template>
  <el-container class="ai-assistant">
    <el-aside class="ai-assistant__sidebar">
      <div class="sidebar-header">
        <div class="sidebar-title">
          <span>会话</span>
          <el-tag size="small" effect="plain" round>{{ store.conversations.length }}</el-tag>
        </div>
        <div class="sidebar-actions">
          <el-button size="small" text :icon="Refresh" @click="handleRefresh" />
          <el-button size="small" type="primary" plain :icon="Plus" @click="handleCreateConversation">
            新会话
          </el-button>
        </div>
      </div>

      <el-scrollbar class="conversation-list">
        <button
          v-for="conv in store.conversations"
          :key="conv.id"
          class="conversation-item"
          :class="{ active: store.currentConversationId === conv.id }"
          @click="store.selectConversation(conv.id)"
        >
          <span class="conversation-title">{{ conv.title || "未命名会话" }}</span>
          <span class="conversation-meta">
            <el-tag size="small" effect="plain">{{ conv.persona?.name || "默认助手" }}</el-tag>
            <el-button
              class="delete-btn"
              size="small"
              text
              :icon="Delete"
              @click.stop="store.deleteConversation(conv.id)"
            />
          </span>
        </button>
        <el-empty v-if="!store.conversations.length" description="暂无会话" :image-size="54" />
      </el-scrollbar>
    </el-aside>

    <el-main class="ai-assistant__main">
      <header class="assistant-toolbar">
        <div class="assistant-heading">
          <div class="assistant-title">
            <el-avatar :size="28" class="assistant-title__avatar">
              <el-icon><ChatDotRound /></el-icon>
            </el-avatar>
            <div>
              <strong>{{ store.activeConversationTitle }}</strong>
              <span>{{ store.statusText }}</span>
            </div>
          </div>
        </div>
        <div class="toolbar-actions">
          <span v-if="store.activePersonaName" class="persona-pill">{{ store.activePersonaName }}</span>
          <el-tooltip v-if="store.currentRunId" :content="store.currentRunId" placement="bottom">
            <span class="run-tag">
              Run {{ store.currentRunId.slice(-8) }}
            </span>
          </el-tooltip>
          <el-button size="small" plain @click="handleOpenToolDialog">
            <el-icon><Grid /></el-icon>
            查看工具
          </el-button>
          <el-button v-if="store.messages.length" size="small" plain @click="store.clearMessages()">
            清空记录
          </el-button>
        </div>
      </header>

      <AssistantChat
        ref="assistantChatRef"
        :messages="store.messages"
        :loading="store.loading"
        :thinking-text="store.thinkingText"
        :pending-interaction="store.pendingInteraction"
        :input-placeholder="store.senderPlaceholder"
        :input-hint="store.inputHintText"
        :can-send="store.canSend"
        :prompt-items="store.promptItems"
        :has-pending-assistant-message="store.hasPendingAssistantMessage"
        @send="handleSendMessage"
        @interaction-submit="handleInteractionSubmit"
        @interaction-reject="handleInteractionReject"
        @prompt-click="handlePromptClick"
      />
    </el-main>

    <!-- 工具列表弹窗 -->
    <el-dialog
      v-model="showToolDialog"
      title="可用工具"
      fullscreen
      :close-on-click-modal="true"
      class="tool-dialog"
      @open="handleOpenToolDialog"
    >
      <div class="tool-dialog-body">
        <!-- 搜索栏 -->
        <div class="tool-search-bar">
          <el-input
            v-model="toolSearchQuery"
            placeholder="搜索工具..."
            clearable
            size="default"
            @input="handleToolSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <span class="tool-count">{{ filteredTools.length }} 个</span>
        </div>

        <!-- 工具列表 -->
        <el-scrollbar class="tool-scroll-area">
          <div v-if="toolsLoading" class="tool-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
          <el-empty v-else-if="filteredTools.length === 0" description="没有匹配的工具" :image-size="60" />
          <div v-else class="tool-grouped-list">
            <template v-for="group in filteredToolGroups" :key="group.key">
              <div class="tool-group-header">
                <span class="tool-group-label">{{ group.label }}</span>
                <span class="tool-group-count">{{ group.tools.length }}</span>
              </div>
              <div
                v-for="tool in group.tools"
                :key="tool.name"
                class="tool-row"
                :class="{ 'is-expanded': expandedTool === tool.name }"
                @click="toggleToolExpand(tool)"
              >
                <div class="tool-row-main">
                  <span class="tool-row-name">{{ tool.name }}</span>
                  <span class="tool-row-label">{{ tool.label }}</span>
                  <span v-if="!tool.readOnly" class="tool-row-write" title="可写入">W</span>
                </div>
                <div class="tool-row-desc">{{ tool.description }}</div>
                <!-- 展开详情 -->
                <div v-if="expandedTool === tool.name" class="tool-expand" @click.stop>
                  <div v-if="getToolParameters(tool).length" class="tool-expand-section">
                    <div class="tool-expand-title">参数</div>
                    <div class="tool-param-list">
                      <div v-for="p in getToolParameters(tool)" :key="p.name" class="tool-param-row">
                        <code class="tool-param-name">{{ p.name }}</code>
                        <span v-if="p.required" class="tool-param-req">必填</span>
                        <span class="tool-param-type">{{ p.type }}</span>
                        <span class="tool-param-desc">{{ p.description }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="tool.examples && tool.examples.length" class="tool-expand-section">
                    <div class="tool-expand-title">示例</div>
                    <div v-for="(ex, i) in tool.examples.slice(0, 3)" :key="i" class="tool-example-row">
                      {{ ex.prompt || ex }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </el-scrollbar>
      </div>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ChatDotRound,
  Delete,
  Grid,
  Loading,
  Plus,
  Refresh,
  Search,
} from "@element-plus/icons-vue";

import { AiAssistantApi } from "@/api/aiAssistant";
import { useAiAssistantStore } from "@/store/modules/aiAssistant";
import type { InteractionSubmitResult } from "./interactions/types";
import AssistantChat from "./AssistantChat.vue";

defineOptions({ name: "AiAssistant" });

const route = useRoute();
const store = useAiAssistantStore();

const assistantChatRef = ref<InstanceType<typeof AssistantChat> | null>(null);

// ========== Tool dialog state (UI-only, not shared) ==========

const showToolDialog = ref(false);
const toolSearchQuery = ref("");
const allTools = ref<any[]>([]);
const filteredTools = ref<any[]>([]);
const toolCategories = ref<any[]>([]);
const toolsLoading = ref(false);
const expandedTool = ref<string | null>(null);

const filteredToolGroups = computed(() => {
  const map = new Map<string, { key: string; label: string; tools: any[] }>();
  for (const tool of filteredTools.value) {
    const cat = tool.category || "other";
    if (!map.has(cat)) {
      const label = tool.categoryLabel || getCategoryLabel(cat);
      map.set(cat, { key: cat, label, tools: [] });
    }
    map.get(cat)!.tools.push(tool);
  }
  return Array.from(map.values());
});

function getCategoryLabel(key: string): string {
  const labels: Record<string, string> = {
    system: "系统", temu: "Temu", browser: "浏览器", material: "素材",
    product: "商品", shop: "店铺", publish: "发布", statistics: "统计",
    workflow: "流程", partner: "供应商", insight: "洞察", ecom: "电商",
    ai: "AI", other: "其他",
  };
  return labels[key] || key;
}

function toggleToolExpand(tool: any) {
  expandedTool.value = expandedTool.value === tool.name ? null : tool.name;
}

// ========== Prompt text map ==========

const promptTextMap: Record<string, string> = {
  page: "请结合当前页面上下文，帮我分析我下一步可以做什么。",
  plan: "请先把这个任务拆成可执行步骤，再开始处理。",
  confirm: "如果你需要我确认、选择或补充参数，请直接暂停并向我提问。",
};

// ========== Page context (route-specific) ==========

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

// ========== Event handlers (delegate to store) ==========

async function handleRefresh() {
  await store.loadConversations();
  if (store.currentConversationId) {
    await store.loadMessages();
  }
}

async function handleCreateConversation() {
  await store.createConversation();
  nextTick(() => assistantChatRef.value?.focusInput());
}

function handleSendMessage(message: string) {
  store.sendMessage(message, buildPageContext());
}

function handleInteractionSubmit(result: InteractionSubmitResult) {
  if (!store.pendingInteraction?.runId || store.loading) return;
  store.resumeInteraction(result.confirmed, result.input, result.reason || "");
}

function handleInteractionReject(result: InteractionSubmitResult) {
  const pending = store.pendingInteraction;
  if (!pending?.runId || store.loading) return;
  store.resumeInteraction(
    false,
    { ...(pending.input || {}), action: "reject" },
    result.reason || "用户跳过或取消本次交互",
  );
}

function handlePromptClick(key: string) {
  const text = promptTextMap[key] || "";
  if (text) store.sendMessage(text, buildPageContext());
}

// ========== Tool dialog methods (UI-only) ==========

async function handleOpenToolDialog() {
  showToolDialog.value = true;
  if (allTools.value.length === 0) {
    await loadTools();
  }
}

async function loadTools() {
  toolsLoading.value = true;
  try {
    const data = await AiAssistantApi.getTools();
    const tools = (data.tools || []).map((tool: any) => ({
      ...tool,
      parameters: extractParameters(tool.inputSchema),
    }));
    allTools.value = tools;
    filteredTools.value = allTools.value;
    buildToolCategories();
    if (allTools.value.length === 0) {
      ElMessage.warning("当前没有可用的工具");
    }
  } catch (error: any) {
    ElMessage.error(`加载工具列表失败: ${error.message || "未知错误"}`);
  } finally {
    toolsLoading.value = false;
  }
}

function buildToolCategories() {
  const categoryMap = new Map<string, any[]>();
  allTools.value.forEach((tool) => {
    const category = tool.category;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(tool);
  });

  const categoryLabels: Record<string, string> = {
    system: "系统查询",
    temu: "Temu 业务",
    browser: "浏览器自动化",
    material: "素材资源",
    product: "商品管理",
    shop: "店铺管理",
    publish: "发布任务",
    "ps-automation": "Photoshop 自动化",
    statistics: "统计分析",
    human: "用户交互",
  };

  toolCategories.value = Array.from(categoryMap.entries())
    .map(([key, tools]) => ({
      key,
      label: categoryLabels[key] || key,
      toolCount: tools.length,
      tools,
    }))
    .sort((a, b) => b.toolCount - a.toolCount);
}

function extractParameters(inputSchema: any): any[] {
  if (!inputSchema || !inputSchema.properties) return [];
  const properties = inputSchema.properties;
  const required = inputSchema.required || [];
  const params: any[] = [];
  for (const [name, prop] of Object.entries(properties)) {
    const p = prop as any;
    params.push({
      name,
      label: p.label || name,
      description: p.description || "",
      type: Array.isArray(p.type) ? p.type.join(" | ") : (p.type || "any"),
      required: required.includes(name),
      default: p.default,
      enum: p.enum,
      example: p.example,
    });
  }
  return params;
}

function getToolParameters(tool: any): any[] {
  return tool.parameters || [];
}

function handleToolSearch() {
  const query = toolSearchQuery.value.toLowerCase().trim();
  if (!query) {
    filteredTools.value = allTools.value;
    return;
  }
  filteredTools.value = allTools.value.filter(
    (tool) =>
      tool.name.toLowerCase().includes(query) ||
      tool.label.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query) ||
      (tool.tags && tool.tags.some((tag: string) => tag.toLowerCase().includes(query))),
  );
}

// ========== Lifecycle ==========

onMounted(() => {
  store.initialize();
});
</script>

<style scoped>
.ai-assistant {
  --ai-bubble-bg: var(--el-fill-color-light);
  --ai-user-bubble-bg: var(--el-color-primary-light-9);
  --ai-input-bg: var(--el-fill-color-light);
  --ai-primary: var(--el-color-primary);
  --ai-warning-text: var(--el-color-warning-dark-2);
  --ai-success-text: var(--el-color-success-dark-2);
  --ai-danger-text: var(--el-color-danger-dark-2);
  --ai-dot: var(--el-text-color-placeholder);
  display: flex;
  height: 100%;
  min-height: 0;
  border: 0;
  border-radius: 0;
  overflow: hidden;
  background: transparent;
  color: var(--el-text-color-primary);
  font-size: 13px;
}

.ai-assistant :deep(.el-button) {
  border: 0;
  box-shadow: none;
}

.ai-assistant :deep(.el-button.is-plain) {
  background: transparent;
  color: var(--el-text-color-primary);
}

.ai-assistant :deep(.el-button.is-text) {
  background: transparent;
  color: var(--el-text-color-secondary);
}

.ai-assistant :deep(.el-tag) {
  border: 0;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.ai-assistant__sidebar {
  width: 260px;
  flex: 0 0 260px;
  display: flex;
  flex-direction: column;
  background: transparent;
  min-height: 0;
  border-right: 1px solid var(--el-border-color-light);
}

.sidebar-header {
  min-height: 48px;
  padding: 8px 14px 6px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.sidebar-title {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.sidebar-actions,
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.conversation-list {
  flex: 1;
  min-height: 0;
}

.conversation-list :deep(.el-scrollbar__view) {
  padding: 6px 12px 12px;
}

.conversation-item {
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 6px;
  color: var(--el-text-color-regular);
  background: transparent;
  text-align: left;
  transition:
    background-color 0.16s ease,
    transform 0.16s ease,
    color 0.16s ease;
}

.conversation-item:hover {
  background: transparent;
  color: var(--el-text-color-primary);
}

.conversation-item.active {
  background: transparent;
  color: var(--el-color-primary);
}

.conversation-title {
  display: block;
  font-size: 12px;
  line-height: 16px;
  margin-bottom: 4px;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.delete-btn {
  opacity: 0;
  width: 20px;
  height: 20px;
  color: var(--el-text-color-placeholder);
  transition:
    opacity 0.2s,
    color 0.2s;
}

.conversation-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--el-color-danger);
}

.ai-assistant__main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  background: transparent;
}

.assistant-toolbar {
  min-height: 54px;
  padding: 10px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: transparent;
}

.assistant-heading {
  min-width: 0;
}

.assistant-title {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.assistant-title strong {
  display: block;
  font-size: 14px;
  line-height: 18px;
  font-weight: 650;
}

.assistant-title span {
  display: block;
  margin-top: 1px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 16px;
}

.assistant-title__avatar {
  background: transparent;
  color: var(--el-color-primary);
}

.persona-pill,
.run-tag {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  max-width: 128px;
  padding: 0 8px;
  border-radius: 6px;
  overflow: hidden;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── 工具弹窗 ── */
.tool-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 14px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.tool-dialog :deep(.el-dialog__title) {
  font-size: 15px;
  font-weight: 600;
}

.tool-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.tool-dialog-body {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px);
}

.tool-search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  flex-shrink: 0;
}

.tool-search-bar .el-input {
  max-width: 420px;
}

.tool-count {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.tool-scroll-area {
  flex: 1;
  min-height: 0;
}

.tool-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 60px 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.tool-grouped-list {
  padding: 6px 0 24px;
}

.tool-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px 6px;
  position: sticky;
  top: 0;
  background: var(--el-bg-color);
  z-index: 1;
}

.tool-group-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.tool-group-count {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  font-weight: 400;
}

.tool-row {
  padding: 8px 20px;
  cursor: pointer;
  transition: background 0.12s;
  border-left: 2px solid transparent;
}

.tool-row:hover {
  background: var(--el-fill-color-light);
}

.tool-row.is-expanded {
  background: var(--el-color-primary-light-9);
  border-left-color: var(--el-color-primary);
}

.tool-row-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tool-row-name {
  font-family: "SF Mono", "Monaco", "Menlo", "Consolas", monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
  letter-spacing: 0.2px;
  flex-shrink: 0;
}

.tool-row-label {
  font-size: 12.5px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-row-write {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 9px;
  font-weight: 700;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border-radius: 3px;
  line-height: 1;
}

.tool-row-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 展开详情 */
.tool-expand {
  margin-top: 8px;
  padding: 12px 14px;
  background: var(--el-bg-color);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-extra-light);
}

.tool-expand-section {
  margin-bottom: 10px;
}

.tool-expand-section:last-child {
  margin-bottom: 0;
}

.tool-expand-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
  letter-spacing: 0.3px;
}

.tool-param-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tool-param-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  line-height: 1.5;
}

.tool-param-name {
  font-family: "SF Mono", "Monaco", "Menlo", monospace;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex-shrink: 0;
  min-width: 100px;
}

.tool-param-req {
  font-size: 10px;
  font-weight: 600;
  color: var(--el-color-danger);
  flex-shrink: 0;
}

.tool-param-type {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
  min-width: 56px;
}

.tool-param-desc {
  font-size: 12px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-example-row {
  font-size: 12px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  padding: 2px 0;
}
</style>
