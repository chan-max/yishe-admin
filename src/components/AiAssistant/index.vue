<template>
  <el-container class="ai-assistant">
    <el-aside class="ai-assistant__sidebar">
      <div class="sidebar-header">
        <div class="sidebar-title">
          <span>会话</span>
          <el-tag size="small" effect="plain" round>{{ conversations.length }}</el-tag>
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
          v-for="conv in conversations"
          :key="conv.id"
          class="conversation-item"
          :class="{ active: currentConversationId === conv.id }"
          @click="selectConversation(conv.id)"
        >
          <span class="conversation-title">{{ conv.title || "未命名会话" }}</span>
          <span class="conversation-meta">
            <el-tag size="small" effect="plain">{{ conv.persona?.name || "默认助手" }}</el-tag>
            <el-button
              class="delete-btn"
              size="small"
              text
              :icon="Delete"
              @click.stop="handleDeleteConversation(conv.id)"
            />
          </span>
        </button>
        <el-empty v-if="!conversations.length" description="暂无会话" :image-size="54" />
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
              <strong>{{ activeConversationTitle }}</strong>
              <span>{{ statusText }}</span>
            </div>
          </div>
        </div>
        <div class="toolbar-actions">
          <span v-if="activePersonaName" class="persona-pill">{{ activePersonaName }}</span>
          <el-tooltip v-if="currentRunId" :content="currentRunId" placement="bottom">
            <span class="run-tag">
              Run {{ currentRunId.slice(-8) }}
            </span>
          </el-tooltip>
          <el-button size="small" plain @click="handleOpenToolDialog">
            <el-icon><Grid /></el-icon>
            查看工具
          </el-button>
          <el-button v-if="messages.length" size="small" plain @click="handleClear">
            清空记录
          </el-button>
        </div>
      </header>

      <el-scrollbar ref="messageScrollbarRef" class="message-scrollbar">
        <div ref="messageListRef" class="message-list">
          <div v-if="!messages.length && !loading" class="empty-state">
            <div class="empty-state__title">智能助手</div>
            <div class="empty-state__desc">告诉我你要完成的事，我会结合当前页面和工具能力来处理。</div>
            <div class="prompt-list">
              <button
                v-for="prompt in promptItems"
                :key="prompt.key"
                class="prompt-item"
                type="button"
                @click="handlePromptClick(prompt.key)"
              >
                {{ prompt.label }}
              </button>
            </div>
          </div>

          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message-item"
            :class="[`message-${msg.role}`]"
          >
            <div v-if="msg.role === 'user'" class="message-content message-content--user">
              <div class="message-text">{{ msg.content }}</div>
            </div>

            <div v-else-if="msg.role === 'assistant'" class="message-content message-content--assistant">
              <el-avatar :size="28" class="message-avatar">
                <el-icon><ChatDotRound /></el-icon>
              </el-avatar>
              <div class="message-body">
                <div class="message-text">
                  <MarkdownView v-if="msg.content" :content="msg.content" />
                  <span v-else class="message-pending">正在整理回复...</span>
                </div>
              </div>
            </div>

            <div v-else class="message-content message-content--tool">
              <div class="message-tool" :class="toolMessageClass(msg)">
                <span class="tool-dot" />
                <span class="tool-title">{{ msg.toolLabel || msg.toolKey || "工具" }}</span>
                <span class="tool-result">{{ msg.content }}</span>
              </div>
            </div>
          </div>

          <div v-if="loading && !hasPendingAssistantMessage" class="message-item message-assistant">
            <div class="message-content message-content--assistant">
              <el-avatar :size="28" class="message-avatar">
                <el-icon><ChatDotRound /></el-icon>
              </el-avatar>
              <div class="message-body">
                <div class="message-text message-text--typing">
                  <span class="typing-dot" />
                  <span class="typing-dot" />
                  <span class="typing-dot" />
                  <span>正在思考</span>
                </div>
              </div>
            </div>
          </div>

          <el-button
            v-if="messages.length > 2"
            class="scroll-bottom-button"
            size="small"
            circle
            @click="scrollToBottom"
          >
            ↓
          </el-button>
        </div>
      </el-scrollbar>

      <section v-if="pendingInteraction" class="interaction-wrapper">
        <InteractionRenderer
          :payload="pendingInteraction"
          :loading="loading"
          @submit="handleInteractionSubmit"
          @reject="handleInteractionReject"
        />
      </section>

      <footer class="input-area">
        <el-input
          ref="inputRef"
          v-model="inputMessage"
          type="textarea"
          :rows="3"
          :placeholder="senderPlaceholder"
          @keydown="handleKeydown"
        />
        <div class="input-actions">
          <span class="input-hint">{{ inputHintText }}</span>
          <el-button
            type="primary"
            :icon="Promotion"
            :loading="loading"
            :disabled="!canSend"
            @click="handleSend"
          >
            {{ loading ? "处理中" : "发送" }}
          </el-button>
        </div>
      </footer>
    </el-main>

    <!-- 工具列表对话框 -->
    <el-dialog
      v-model="showToolDialog"
      title="可用工具列表"
      fullscreen
      :close-on-click-modal="false"
      class="tool-list-dialog"
    >
      <div class="tool-dialog-content">
        <div class="tool-dialog-header">
          <el-input
            v-model="toolSearchQuery"
            placeholder="搜索工具名称、描述或标签..."
            clearable
            @input="handleToolSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <div class="tool-stats">
            <el-tag size="small" type="primary">
              共 {{ filteredTools.length }} 个工具
            </el-tag>
            <el-tag size="small" type="success">
              {{ readOnlyToolsCount }} 只读
            </el-tag>
            <el-tag size="small" type="warning">
              {{ writeToolsCount }} 可写入
            </el-tag>
          </div>
        </div>

        <el-tabs v-model="activeToolTab" class="tool-tabs">
          <el-tab-pane label="全部工具" name="all">
            <el-scrollbar class="tool-list-scroll">
              <div v-if="toolsLoading" class="tool-loading">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>加载中...</span>
              </div>
              <el-empty v-else-if="filteredTools.length === 0" description="暂无工具" :image-size="80" />
              <div v-else class="tool-list">
                <div
                  v-for="tool in filteredTools"
                  :key="tool.name"
                  class="tool-item"
                  @click="showToolDetail(tool)"
                >
                  <div class="tool-item-header">
                    <div class="tool-item-title">
                      <span class="tool-name">{{ tool.name }}</span>
                      <el-tag size="small" :type="tool.readOnly ? 'success' : 'warning'">
                        {{ tool.readOnly ? '只读' : '可写入' }}
                      </el-tag>
                    </div>
                    <div class="tool-item-category">
                      {{ tool.categoryLabel }}
                    </div>
                  </div>
                  <div class="tool-item-description">
                    {{ tool.description }}
                  </div>
                  <div class="tool-item-meta">
                    <el-tag
                      v-for="tag in (tool.tags || []).slice(0, 3)"
                      :key="tag"
                      size="small"
                      effect="plain"
                    >
                      {{ tag }}
                    </el-tag>
                    <span class="tool-params-count">
                      {{ getToolParameters(tool).length }} 个参数
                    </span>
                  </div>
                </div>
              </div>
            </el-scrollbar>
          </el-tab-pane>

          <el-tab-pane label="按分类" name="category">
            <el-scrollbar class="tool-list-scroll">
              <div v-if="toolsLoading" class="tool-loading">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>加载中...</span>
              </div>
              <el-empty v-else-if="toolCategories.length === 0" description="暂无分类" :image-size="80" />
              <div v-else class="tool-categories">
                <div
                  v-for="category in toolCategories"
                  :key="category.key"
                  class="tool-category"
                >
                  <h3 class="category-title">
                    {{ category.label }}
                    <el-tag size="small" type="info">
                      {{ category.toolCount }} 个工具
                    </el-tag>
                  </h3>
                  <div class="category-tools">
                    <div
                      v-for="tool in (category.tools || []).slice(0, 6)"
                      :key="tool.name"
                      class="tool-item-compact"
                      @click="showToolDetail(tool)"
                    >
                      <span class="tool-name-compact">{{ tool.name }}</span>
                      <span class="tool-label-compact">{{ tool.label }}</span>
                    </div>
                    <el-button
                      v-if="category.tools && category.tools.length > 6"
                      size="small"
                      text
                      @click="filterByCategory(category.key)"
                    >
                      查看全部 {{ category.toolCount }} 个 →
                    </el-button>
                  </div>
                </div>
              </div>
            </el-scrollbar>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <el-button @click="showToolDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 工具详情对话框 -->
    <el-dialog
      v-model="showToolDetailDialog"
      :title="selectedTool?.label || '工具详情'"
      width="70%"
      class="tool-detail-dialog"
    >
      <div v-if="selectedTool" class="tool-detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工具名称">
            <code>{{ selectedTool.name }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="分类">
            {{ selectedTool.categoryLabel }}
          </el-descriptions-item>
          <el-descriptions-item label="权限">
            <el-tag :type="selectedTool.readOnly ? 'success' : 'warning'" size="small">
              {{ selectedTool.readOnly ? '只读' : '可写入' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="riskLevelType(selectedTool.executionPolicy.riskLevel)" size="small">
              {{ selectedTool.executionPolicy.riskLevel }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider>工具描述</el-divider>
        <p class="tool-description">{{ selectedTool.description }}</p>

        <el-divider>参数列表</el-divider>
        <el-table :data="getToolParameters(selectedTool)" stripe border size="small">
          <el-table-column prop="name" label="参数名" width="180">
            <template #default="{ row }">
              <code>{{ row.name }}</code>
              <el-tag v-if="row.required" type="danger" size="small" style="margin-left: 4px;">
                必填
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="description" label="描述" min-width="200" />
          <el-table-column prop="default" label="默认值" width="120">
            <template #default="{ row }">
              {{ row.default !== undefined ? JSON.stringify(row.default) : '-' }}
            </template>
          </el-table-column>
        </el-table>

        <el-divider>使用示例</el-divider>
        <div v-if="selectedTool.examples && selectedTool.examples.length > 0" class="tool-examples">
          <div
            v-for="(example, index) in selectedTool.examples.slice(0, 5)"
            :key="index"
            class="example-item"
          >
            <el-icon><ChatLineRound /></el-icon>
            <span>{{ example.prompt }}</span>
          </div>
        </div>
        <el-empty v-else description="暂无示例" :image-size="60" />
      </div>

      <template #footer>
        <el-button @click="showToolDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import dayjs from "dayjs";
import { ElMessage, ElMessageBox } from "element-plus";
import { ChatDotRound, Delete, Plus, Promotion, Refresh, Grid, Search, ChatLineRound, Loading } from "@element-plus/icons-vue";
import type { ScrollbarInstance } from "element-plus";
import {
  AiAssistantApi,
  type AiAssistantConversation,
  type AiAssistantMessage,
} from "@/api/aiAssistant";
import MarkdownView from "@/components/MarkdownView/index.vue";
import InteractionRenderer from "./interactions/InteractionRenderer.vue";
import type { InteractionPayload, InteractionSubmitResult } from "./interactions/types";

// 工具列表相关状态
const showToolDialog = ref(false);
const showToolDetailDialog = ref(false);
const toolSearchQuery = ref("");
const activeToolTab = ref("all");
const allTools = ref<any[]>([]);
const filteredTools = ref<any[]>([]);
const toolCategories = ref<any[]>([]);
const selectedTool = ref<any>(null);
const toolsLoading = ref(false);

interface StreamContext {
  fullReply: string;
  assistantMsg: AiAssistantMessage | null;
}

const route = useRoute();
const messageListRef = ref<HTMLElement>();
const messageScrollbarRef = ref<ScrollbarInstance>();
const inputRef = ref<{ focus?: () => void }>();
const inputMessage = ref("");
const loading = ref(false);
const runtimeStatus = ref("idle");
const currentRunId = ref("");
const pendingInteraction = ref<InteractionPayload | null>(null);
const messages = ref<AiAssistantMessage[]>([]);
const conversations = ref<AiAssistantConversation[]>([]);
const currentConversationId = ref<number | null>(null);

const activeConversation = computed(() =>
  conversations.value.find((item) => item.id === currentConversationId.value),
);

const activePersonaName = computed(() => activeConversation.value?.persona?.name || "");

const activeConversationTitle = computed(() =>
  activeConversation.value?.title || "智能助手",
);

const statusText = computed(() => {
  if (pendingInteraction.value) return "等待用户参与";
  if (loading.value) return runtimeStatus.value === "tool_calling" ? "工具执行中" : "流式响应中";
  if (activeConversation.value?.lastMessageAt) {
    return `最近更新 ${formatDateTime(activeConversation.value.lastMessageAt)}`;
  }
  return "准备就绪";
});

const senderPlaceholder = computed(() => {
  if (pendingInteraction.value) return "可以先输入下一条消息，完成上方交互后再发送";
  if (loading.value) return "智能助手正在处理";
  return "输入你的目标或问题";
});

const inputHintText = computed(() => {
  if (pendingInteraction.value) return "当前需先完成上方交互，输入内容会保留";
  if (loading.value) return "正在处理，请稍候";
  return "Enter 发送，Shift+Enter 换行";
});

const canSend = computed(
  () => Boolean(inputMessage.value.trim()) && !loading.value && !pendingInteraction.value,
);

// 工具列表计算属性
const readOnlyToolsCount = computed(() => {
  return filteredTools.value.filter((t) => t.readOnly).length;
});

const writeToolsCount = computed(() => {
  return filteredTools.value.filter((t) => !t.readOnly).length;
});

const hasPendingAssistantMessage = computed(() =>
  messages.value.some(
    (message) =>
      message.role === "assistant" &&
      !message.content &&
      message.runTrace?.runId === currentRunId.value,
  ),
);

const promptItems = [
  { key: "page", label: "分析当前页面" },
  { key: "plan", label: "先拆解任务" },
  { key: "confirm", label: "先问我问题" },
];

const promptTextMap: Record<string, string> = {
  page: "请结合当前页面上下文，帮我分析我下一步可以做什么。",
  plan: "请先把这个任务拆成可执行步骤，再开始处理。",
  confirm: "如果你需要我确认、选择或补充参数，请直接暂停并向我提问。",
};

// 交互处理 — 由 InteractionRenderer 统一管理
function handleInteractionSubmit(result: InteractionSubmitResult) {
  const pending = pendingInteraction.value;
  if (!pending?.runId || loading.value) return;
  pendingInteraction.value = null;
  resumeInteraction(result.confirmed, result.input, result.reason || "");
}

function handleInteractionReject(result: InteractionSubmitResult) {
  const pending = pendingInteraction.value;
  if (!pending?.runId || loading.value) return;
  pendingInteraction.value = null;
  resumeInteraction(false, {
    ...(pending.input || {}),
    action: "reject",
  }, result.reason || "用户跳过或取消本次交互");
}

async function loadConversations() {
  try {
    conversations.value = await AiAssistantApi.getConversations();
  } catch (error) {
    console.error("加载会话列表失败:", error);
    ElMessage.error("加载会话失败");
  }
}

async function loadMessages() {
  try {
    messages.value = await AiAssistantApi.getMessages({
      conversationId: currentConversationId.value || undefined,
    });
    scrollToBottom();
  } catch (error) {
    console.error("加载消息失败:", error);
    ElMessage.error("加载消息失败");
  }
}

async function selectConversation(id: number) {
  if (currentConversationId.value === id) return;
  currentConversationId.value = id;
  pendingInteraction.value = null;
  await loadMessages();
}

async function handleCreateConversation() {
  try {
    const result = await AiAssistantApi.createConversation({ title: "新会话" });
    conversations.value.unshift(result);
    currentConversationId.value = result.id;
    messages.value = [];
    pendingInteraction.value = null;
    nextTick(() => inputRef.value?.focus?.());
  } catch (error) {
    ElMessage.error("创建会话失败");
  }
}

async function handleDeleteConversation(id: number) {
  try {
    await ElMessageBox.confirm("确认删除此会话？", "提示", { type: "warning" });
    await AiAssistantApi.deleteConversation(id);
    conversations.value = conversations.value.filter((c) => c.id !== id);
    if (currentConversationId.value === id) {
      currentConversationId.value = conversations.value[0]?.id || null;
      messages.value = [];
      if (currentConversationId.value) {
        await loadMessages();
      }
    }
    ElMessage.success("已删除");
  } catch (error) {
    if (error !== "cancel") ElMessage.error("删除失败");
  }
}

// ========== 工具列表相关方法 ==========

/**
 * 打开工具列表对话框
 */
async function handleOpenToolDialog() {
  console.log('[ToolDialog] 打开工具列表对话框');
  showToolDialog.value = true;
  
  // 如果还没有加载工具数据，则加载
  if (allTools.value.length === 0) {
    console.log('[ToolDialog] 首次加载，开始获取工具列表...');
    await loadTools();
  }
}

/**
 * 加载工具列表
 */
async function loadTools() {
  toolsLoading.value = true;
  try {
    console.log('[ToolDialog] 开始请求工具列表...');
    
    // 使用统一的 API 方法，自动携带 token
    const data = await AiAssistantApi.getTools();
    console.log('[ToolDialog] 获取到工具数据:', data);
    
    // 为每个工具提取参数
    const tools = (data.tools || []).map((tool: any) => ({
      ...tool,
      parameters: extractParameters(tool.inputSchema),
    }));
    
    allTools.value = tools;
    console.log('[ToolDialog] 工具数量:', allTools.value.length);
    
    filteredTools.value = allTools.value;
    
    // 构建分类信息
    buildToolCategories();
    console.log('[ToolDialog] 分类数量:', toolCategories.value.length);
    
    if (allTools.value.length === 0) {
      ElMessage.warning('当前没有可用的工具');
    }
  } catch (error: any) {
    console.error('[ToolDialog] 加载工具列表失败:', error);
    ElMessage.error(`加载工具列表失败: ${error.message || '未知错误'}`);
  } finally {
    toolsLoading.value = false;
  }
}

/**
 * 构建工具分类
 */
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
    system: '系统查询',
    temu: 'Temu 业务',
    browser: '浏览器自动化',
    material: '素材资源',
    product: '商品管理',
    shop: '店铺管理',
    publish: '发布任务',
    'ps-automation': 'Photoshop 自动化',
    statistics: '统计分析',
    human: '用户交互',
  };

  toolCategories.value = Array.from(categoryMap.entries()).map(([key, tools]) => ({
    key,
    label: categoryLabels[key] || key,
    toolCount: tools.length,
    tools,
  })).sort((a, b) => b.toolCount - a.toolCount);
}

/**
 * 从 inputSchema 提取参数列表
 */
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
      description: p.description || '',
      type: Array.isArray(p.type) ? p.type.join(' | ') : (p.type || 'any'),
      required: required.includes(name),
      default: p.default,
      enum: p.enum,
      example: p.example,
    });
  }
  
  return params;
}

/**
 * 获取工具的参数列表
 */
function getToolParameters(tool: any): any[] {
  return tool.parameters || [];
}

/**
 * 工具搜索
 */
function handleToolSearch() {
  const query = toolSearchQuery.value.toLowerCase().trim();
  
  if (!query) {
    filteredTools.value = allTools.value;
    return;
  }
  
  filteredTools.value = allTools.value.filter((tool) => {
    return (
      tool.name.toLowerCase().includes(query) ||
      tool.label.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query) ||
      (tool.tags && tool.tags.some((tag: string) => tag.toLowerCase().includes(query)))
    );
  });
}

/**
 * 显示工具详情
 */
function showToolDetail(tool: any) {
  selectedTool.value = tool;
  showToolDetailDialog.value = true;
}

/**
 * 按分类过滤
 */
function filterByCategory(category: string) {
  activeToolTab.value = 'all';
  toolSearchQuery.value = '';
  filteredTools.value = allTools.value.filter((t) => t.category === category);
}

/**
 * 风险等级标签类型
 */
function riskLevelType(level: string) {
  switch (level) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
      return 'danger';
    default:
      return 'info';
  }
}

async function handleRefresh() {
  await loadConversations();
  if (currentConversationId.value) {
    await loadMessages();
  }
}

function handlePromptClick(key: string) {
  inputMessage.value = promptTextMap[key] || "";
  nextTick(() => inputRef.value?.focus?.());
}

async function handleSend() {
  const message = inputMessage.value.trim();
  if (!message || loading.value || pendingInteraction.value) return;

  inputMessage.value = "";
  loading.value = true;
  runtimeStatus.value = "thinking";
  currentRunId.value = "";
  pendingInteraction.value = null;

  messages.value.push(createLocalMessage({ role: "user", content: message }));
  scrollToBottom();

  await consumeStream((handlers) =>
    AiAssistantApi.chatStream(
      {
        message,
        conversationId: currentConversationId.value || undefined,
        pageContext: buildPageContext(),
      },
      handlers,
    ),
  );
}

async function resumeInteraction(confirmed: boolean, resumeInput: Record<string, any>, reason: string) {
  const runId = currentRunId.value;
  if (!runId || loading.value) return;

  loading.value = true;
  runtimeStatus.value = "thinking";

  await consumeStream((handlers) =>
    AiAssistantApi.resumeRunStream(
      runId,
      {
        conversationId: currentConversationId.value || undefined,
        confirmed,
        input: resumeInput,
        reason,
      },
      handlers,
    ),
  );
}

async function consumeStream(
  start: (handlers: {
    onEvent: (event: { event: string; data: any }) => void;
    onError: (error: Error) => void;
    onDone: () => void;
  }) => Promise<void>,
) {
  const context: StreamContext = { fullReply: "", assistantMsg: null };
  try {
    await start({
      onEvent(event) {
        handleStreamEvent(event.event, event.data, context);
      },
      onError(error) {
        console.error("流式请求失败:", error);
        ElMessage.error("请求失败，请重试");
      },
      onDone() {
        loading.value = false;
      },
    });
  } catch (error) {
    console.error("发送失败:", error);
    ElMessage.error("发送失败");
  } finally {
    loading.value = false;
    if (!pendingInteraction.value) runtimeStatus.value = "idle";
    await loadConversations();
    if (currentConversationId.value) await loadMessages();
  }
}

function handleStreamEvent(event: string, data: any, context: StreamContext) {
  if (data?.runId) currentRunId.value = data.runId;
  if (data?.conversationId) currentConversationId.value = Number(data.conversationId);

  switch (event) {
    case "run.started":
    case "run.resumed":
      runtimeStatus.value = "thinking";
      ensureAssistantMessage(context);
      break;
    case "assistant.status":
      runtimeStatus.value = data?.status || "thinking";
      break;
    case "assistant.plan":
      runtimeStatus.value = "tool_calling";
      (data?.toolCalls || []).forEach((toolCall: any) => {
        upsertToolMessage(toolCall.tool, toolCall.label, `准备调用：${toolCall.label || toolCall.tool}`, data);
      });
      break;
    case "tool.pending":
      runtimeStatus.value = "tool_calling";
      upsertToolMessage(data.tool, data.label, "执行中...", data);
      break;
    case "tool.completed":
      upsertToolMessage(data.tool, data.label, data.summary || "执行完成", {
        ...data,
        toolResult: { success: true, summary: data.summary, data: data.data },
      });
      break;
    case "tool.error":
      upsertToolMessage(data.tool, data.label, data.error || "执行失败", {
        ...data,
        toolResult: { success: false, error: data.error },
      });
      break;
    case "assistant.answer.delta":
      appendAssistantDelta(data?.content || data?.delta || "", context);
      break;
    case "interrupt":
    case "run.waiting":
      applyInterrupt(data?.interrupt || data);
      loading.value = false;
      runtimeStatus.value = "waiting_user";
      break;
    case "run.completed":
      if (data?.reply) {
        if (context.assistantMsg && !context.assistantMsg.content) {
          context.assistantMsg.content = data.reply;
        } else if (!context.assistantMsg) {
          messages.value.push(createLocalMessage({ role: "assistant", content: data.reply }));
        }
      }
      runtimeStatus.value = "idle";
      break;
    case "run.error":
    case "error":
      ElMessage.error(data?.error || "智能助手执行失败");
      runtimeStatus.value = "idle";
      break;
  }
  scrollToBottom();
}

function ensureAssistantMessage(context: StreamContext) {
  if (context.assistantMsg) return context.assistantMsg;
  context.assistantMsg = createLocalMessage({
    role: "assistant",
    content: "",
    runTrace: { runId: currentRunId.value },
  });
  messages.value.push(context.assistantMsg);
  return context.assistantMsg;
}

function appendAssistantDelta(content: string, context: StreamContext) {
  if (!content) return;
  const assistantMessage = ensureAssistantMessage(context);
  context.fullReply += content;
  assistantMessage.content = context.fullReply;
}

function applyInterrupt(payload: any) {
  const interrupt = payload || {};
  const runId = interrupt.runId || currentRunId.value;
  const question = interrupt.question || "需要你确认后继续。";
  if (
    pendingInteraction.value &&
    pendingInteraction.value.runId === runId &&
    pendingInteraction.value.question === question
  ) {
    return;
  }

  pendingInteraction.value = {
    type: normalizeInteractionType(interrupt.type),
    runId,
    question,
    tool: interrupt.tool,
    toolName: interrupt.toolName,
    label: interrupt.label,
    input: interrupt.input || {},
    options: interrupt.options || [],
    multiple: interrupt.multiple === true,
    fields: interrupt.fields || [],
    placeholder: interrupt.placeholder || "",
    defaultValue: interrupt.defaultValue,
    riskLevel: interrupt.riskLevel,
    // 新增交互类型字段
    preview: interrupt.preview,
    plan: interrupt.plan,
    compare: interrupt.compare,
    steps: interrupt.steps,
  } as InteractionPayload;

  const alreadyInserted = [...messages.value].reverse().some((msg) => {
    const traceInterrupt = msg.runTrace?.interrupt;
    return (
      msg.role === "assistant" &&
      msg.content === question &&
      (traceInterrupt?.runId || msg.runTrace?.runId) === runId
    );
  });
  if (alreadyInserted) return;

  messages.value.push(
    createLocalMessage({
      role: "assistant",
      content: question,
      runTrace: { interrupt, runId },
    }),
  );
}

function normalizeInteractionType(type: string) {
  const normalized = String(type || "").trim();
  const valid = ["confirm", "input", "choice", "form", "feedback", "clarify", "impact_preview", "plan_edit", "compare", "step_form"];
  if (valid.includes(normalized)) return normalized;
  return "input";
}

function upsertToolMessage(
  toolKey: string,
  label: string,
  content: string,
  payload: Record<string, any>,
) {
  const runId = payload?.runId || currentRunId.value;
  const existing = [...messages.value]
    .reverse()
    .find((msg) => msg.role === "tool" && msg.toolKey === toolKey && msg.runTrace?.runId === runId);

  if (existing) {
    existing.content = content;
    existing.toolResult = payload.toolResult || existing.toolResult;
    return;
  }

  messages.value.push(
    createLocalMessage({
      role: "tool",
      content,
      toolKey,
      toolLabel: label || toolKey,
      toolInput: payload.input || null,
      toolResult: payload.toolResult || null,
      runTrace: { runId },
    }),
  );
}

function toolMessageClass(message: AiAssistantMessage) {
  if (message.toolResult?.success === false) return "is-error";
  if (message.content === "执行中..." || message.content.startsWith("准备调用")) {
    return "is-running";
  }
  return "is-done";
}

async function handleClear() {
  try {
    await ElMessageBox.confirm("确认清空当前会话的所有消息？", "提示", { type: "warning" });
    await AiAssistantApi.clearMessages({
      conversationId: currentConversationId.value || undefined,
    });
    messages.value = [];
    pendingInteraction.value = null;
    ElMessage.success("已清空");
  } catch (error) {
    if (error !== "cancel") ElMessage.error("清空失败");
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    if (!canSend.value) return;
    e.preventDefault();
    void handleSend();
  }
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

function createLocalMessage(partial: Partial<AiAssistantMessage>): AiAssistantMessage {
  return {
    id: Date.now() + Math.random(),
    conversationId: currentConversationId.value,
    role: partial.role || "assistant",
    content: partial.content || "",
    attachments: partial.attachments || [],
    pageContext: partial.pageContext || null,
    toolKey: partial.toolKey || null,
    toolLabel: partial.toolLabel || null,
    toolInput: partial.toolInput || null,
    toolResult: partial.toolResult || null,
    runTrace: partial.runTrace || null,
    createdAt: new Date().toISOString(),
  };
}

function scrollToBottom() {
  nextTick(() => {
    const height = messageListRef.value?.scrollHeight || 0;
    if (messageScrollbarRef.value) {
      messageScrollbarRef.value.setScrollTop(height);
    }
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const date = dayjs(value);
  if (!date.isValid()) return "";
  return date.isSame(dayjs(), "day") ? date.format("HH:mm") : date.format("MM-DD HH:mm");
}

onMounted(async () => {
  await loadConversations();
  if (conversations.value.length) {
    currentConversationId.value = conversations.value[0].id;
    await loadMessages();
  }
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

.message-scrollbar {
  flex: 1;
  min-height: 0;
  background: transparent;
}

.message-list {
  position: relative;
  min-height: 100%;
  padding: 16px 22px 18px;
}

.empty-state {
  min-height: calc(100% - 12px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 560px;
  margin: 0 auto;
  padding: 24px 12px;
  color: var(--el-text-color-secondary);
}

.empty-state__title {
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 650;
  line-height: 28px;
}

.empty-state__desc {
  margin-top: 6px;
  font-size: 13px;
  line-height: 22px;
}

.prompt-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.prompt-item {
  height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
  transition:
    color 0.16s ease,
    background-color 0.16s ease;
}

.prompt-item:hover {
  background: transparent;
  color: var(--el-color-primary);
}

.message-item {
  margin-bottom: 16px;
}

.message-content {
  display: flex;
  min-width: 0;
}

.message-content--user {
  justify-content: flex-end;
}

.message-content--user .message-text {
  background: var(--ai-user-bubble-bg);
  color: var(--ai-primary);
  border-radius: 8px 8px 2px 8px;
  max-width: min(640px, 72%);
}

.message-content--assistant {
  gap: 8px;
  align-items: flex-start;
}

.message-avatar {
  flex-shrink: 0;
  background: transparent;
  color: var(--el-text-color-secondary);
}

.message-body {
  max-width: min(720px, 76%);
  min-width: 0;
}

.message-text {
  padding: 9px 12px;
  border: 0;
  background: var(--ai-bubble-bg);
  border-radius: 2px 8px 8px 8px;
  word-break: break-word;
  line-height: 1.62;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.message-text :deep(.markdown-view) {
  font-size: 13px;
  line-height: 1.62;
}

.message-text :deep(p) {
  margin: 0 0 6px;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 4px 0 6px;
  padding-left: 18px;
}

.message-text :deep(code) {
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--el-fill-color);
  color: var(--el-color-primary);
  font-size: 12px;
}

.message-pending {
  color: var(--el-text-color-secondary);
}

.message-text--typing {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--el-text-color-secondary);
}

.typing-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--ai-dot);
  animation: typingPulse 1.2s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.12s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.24s;
}

.message-content--tool {
  width: min(680px, calc(100% - 40px));
  padding-left: 36px;
}

.message-tool {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  gap: 7px;
  padding: 5px 9px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.message-tool.is-running {
  background: transparent;
  color: var(--ai-primary);
}

.message-tool.is-done {
  background: transparent;
  color: var(--ai-success-text);
}

.message-tool.is-error {
  background: transparent;
  color: var(--ai-danger-text);
}

.tool-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.72;
  flex: 0 0 auto;
}

.tool-title {
  flex-shrink: 0;
  font-weight: 600;
  color: currentColor;
}

.tool-result {
  min-width: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: currentColor;
  opacity: 0.86;
}

.scroll-bottom-button {
  position: sticky;
  bottom: 10px;
  left: 100%;
  z-index: 2;
  display: block;
  margin-left: auto;
  background: transparent;
  color: var(--el-text-color-secondary);
}

.interaction-wrapper {
  margin: 0 18px 12px;
}

.interaction-wrapper :deep(.interaction-panel) {
  padding: 12px 14px;
  display: grid;
  gap: 12px;
  border-radius: 8px;
  background: transparent;
}

.interaction-wrapper :deep(.interaction-main) {
  display: flex;
  gap: 11px;
  align-items: flex-start;
}

.interaction-wrapper :deep(.interaction-badge) {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 6px;
  background: transparent;
  color: var(--ai-warning-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 24px;
  flex: 0 0 auto;
}

.interaction-wrapper :deep(.interaction-title) {
  font-size: 13px;
  line-height: 18px;
  font-weight: 650;
  margin-bottom: 2px;
}

.interaction-wrapper :deep(.interaction-tip) {
  margin-bottom: 6px;
  color: var(--ai-warning-text);
  font-size: 12px;
  line-height: 18px;
}

.interaction-wrapper :deep(.interaction-actions) {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.interaction-wrapper :deep(.el-input__wrapper),
.interaction-wrapper :deep(.el-textarea__inner) {
  border-radius: 6px;
  border: 0;
  box-shadow: none;
  background: transparent;
}

.input-area {
  padding: 10px 18px 14px;
  background: transparent;
}

.input-area :deep(.el-textarea__inner) {
  min-height: 72px !important;
  border-radius: 8px;
  border: 0;
  background: var(--ai-input-bg);
  font-size: 13px;
  line-height: 1.55;
  box-shadow: none;
  resize: none;
}

.input-area :deep(.el-textarea__inner:focus) {
  background: var(--ai-input-bg);
  box-shadow: none;
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}

.input-hint {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  line-height: 22px;
}

@keyframes typingPulse {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  40% {
    opacity: 1;
    transform: translateY(-2px);
  }
}

@media (max-width: 860px) {
  .ai-assistant__sidebar {
    width: 210px;
    flex-basis: 210px;
  }

  .message-body,
  .message-content--user .message-text {
    max-width: 86%;
  }

  .message-list {
    padding: 14px;
  }

  .input-hint {
    display: none;
  }
}

/* 工具列表对话框样式 */
.tool-list-dialog :deep(.el-dialog__wrapper) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-list-dialog :deep(.el-dialog) {
  margin: 0;
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 100vh;
  border-radius: 0;
  display: flex;
  flex-direction: column;
}

.tool-list-dialog :deep(.el-dialog__header) {
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
  margin: 0;
  flex-shrink: 0;
}

.tool-list-dialog :deep(.el-dialog__body) {
  padding: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.tool-list-dialog :deep(.el-dialog__footer) {
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.tool-dialog-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 120px);
}

.tool-dialog-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  gap: 12px;
  align-items: center;
}

.tool-dialog-header .el-input {
  flex: 1;
}

.tool-stats {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.tool-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.tool-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 16px;
  flex-shrink: 0;
}

.tool-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.tool-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.tool-list-scroll {
  height: 100%;
  max-height: calc(100vh - 200px);
}

.tool-list-scroll :deep(.el-scrollbar__wrap) {
  max-height: calc(100vh - 200px);
}

.tool-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.tool-loading .el-icon {
  font-size: 24px;
}

.tool-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tool-item {
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-item:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.tool-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tool-item-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-name {
  font-weight: 600;
  font-family: monospace;
}

.tool-item-category {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.tool-item-description {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
  line-height: 1.5;
}

.tool-item-meta {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.tool-params-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: auto;
}

/* 工具分类 */
.tool-categories {
  padding: 12px;
}

.tool-category {
  margin-bottom: 20px;
}

.category-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-tools {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
}

.tool-item-compact {
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tool-item-compact:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.tool-name-compact {
  font-family: monospace;
  font-size: 12px;
  font-weight: 600;
}

.tool-label-compact {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 工具详情对话框 */
.tool-detail-dialog :deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}

.tool-detail-content {
  padding: 8px 0;
}

.tool-description {
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.tool-examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.example-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  font-size: 13px;
}

.example-item .el-icon {
  color: var(--el-color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}
</style>
