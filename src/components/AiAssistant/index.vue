<template>
  <el-container class="ai-assistant">
    <el-aside class="ai-assistant__sidebar" width="260px">
      <div class="sidebar-header">
        <div class="sidebar-title">
          <span>会话</span>
          <el-tag size="small" effect="plain" round>{{ conversations.length }}</el-tag>
        </div>
        <el-button size="small" type="primary" plain :icon="Plus" @click="handleCreateConversation">
          新会话
        </el-button>
      </div>

      <el-scrollbar class="conversation-list">
        <button
          v-for="conv in conversations"
          :key="conv.id"
          class="conversation-item"
          :class="{ active: currentConversationId === conv.id }"
          @click="selectConversation(conv.id)"
        >
          <span class="conversation-title">{{ conv.title }}</span>
          <span class="conversation-meta">
            <el-tag size="small" effect="plain">{{ conv.persona.name }}</el-tag>
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
              <strong>智能助手</strong>
              <span>{{ statusText }}</span>
            </div>
          </div>
        </div>
        <el-tooltip v-if="currentRunId" :content="currentRunId" placement="bottom">
          <el-tag size="small" type="info" effect="plain" class="run-tag">
            Run {{ currentRunId.slice(-8) }}
          </el-tag>
        </el-tooltip>
      </header>

      <el-scrollbar ref="messageScrollbarRef" class="message-scrollbar">
        <div ref="messageListRef" class="message-list">
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
                <div class="message-text" v-html="renderMarkdown(msg.content)"></div>
              </div>
            </div>

            <div v-else class="message-content message-content--tool">
              <el-alert
                class="message-tool"
                :type="msg.toolResult?.success === false ? 'error' : 'info'"
                :closable="false"
                show-icon
              >
                <template #title>
                  <span class="tool-title">{{ msg.toolLabel || msg.toolKey || "工具" }}</span>
                  <span class="tool-result">{{ msg.content }}</span>
                </template>
              </el-alert>
            </div>
          </div>

          <div v-if="loading" class="message-item message-assistant">
            <div class="message-content message-content--assistant">
              <el-avatar :size="28" class="message-avatar">
                <el-icon><ChatDotRound /></el-icon>
              </el-avatar>
              <div class="message-body">
                <el-skeleton animated :rows="2" class="assistant-skeleton" />
              </div>
            </div>
          </div>

          <el-empty v-if="!messages.length && !loading" description="发送消息开始对话" :image-size="72" />
        </div>
      </el-scrollbar>

      <section v-if="pendingInteraction" class="interaction-panel">
        <div class="interaction-main">
          <el-tag type="warning" effect="plain" round>{{ interactionTag }}</el-tag>
          <div>
            <div class="interaction-title">{{ pendingInteraction.label || "需要用户参与" }}</div>
            <pre>{{ pendingInteraction.question }}</pre>
          </div>
        </div>

        <template v-if="pendingInteraction.type === 'choice'">
          <el-checkbox-group
            v-if="pendingInteraction.multiple"
            v-model="pendingChoiceList"
            class="choice-list"
          >
            <el-checkbox
              v-for="option in normalizedOptions"
              :key="option.value"
              :label="option.value"
              border
            >
              <span>{{ option.label }}</span>
              <small v-if="option.description">{{ option.description }}</small>
            </el-checkbox>
          </el-checkbox-group>
          <el-radio-group v-else v-model="pendingChoice" class="choice-list">
            <el-radio
              v-for="option in normalizedOptions"
              :key="option.value"
              :label="option.value"
              border
            >
              <span>{{ option.label }}</span>
              <small v-if="option.description">{{ option.description }}</small>
            </el-radio>
          </el-radio-group>
        </template>

        <template v-else-if="pendingInteraction.type === 'form'">
          <el-form label-position="top" class="interaction-form">
            <el-form-item
              v-for="field in normalizedFields"
              :key="field.name"
              :label="field.label"
              :required="field.required"
            >
              <el-switch
                v-if="field.type === 'boolean'"
                v-model="pendingForm[field.name]"
              />
              <el-select
                v-else-if="field.type === 'select'"
                v-model="pendingForm[field.name]"
                :placeholder="field.placeholder || '请选择'"
                filterable
              >
                <el-option
                  v-for="option in normalizeOptions(field.options)"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
              <el-date-picker
                v-else-if="field.type === 'date' || field.type === 'datetime'"
                v-model="pendingForm[field.name]"
                :type="field.type === 'datetime' ? 'datetime' : 'date'"
                :placeholder="field.placeholder || '请选择时间'"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
              <el-input-number
                v-else-if="field.type === 'number'"
                v-model="pendingForm[field.name]"
                controls-position="right"
              />
              <el-input
                v-else
                v-model="pendingForm[field.name]"
                :type="field.type === 'textarea' ? 'textarea' : 'text'"
                :rows="field.type === 'textarea' ? 3 : undefined"
                :placeholder="field.placeholder || '请输入'"
              />
            </el-form-item>
          </el-form>
        </template>

        <template v-else-if="pendingInteraction.type === 'feedback'">
          <div class="feedback-actions">
            <el-button
              v-for="option in normalizedOptions"
              :key="option.value"
              size="small"
              :type="pendingChoice === option.value ? 'primary' : 'default'"
              @click="pendingChoice = option.value"
            >
              {{ option.label }}
            </el-button>
          </div>
          <el-input
            v-model="pendingTextInput"
            type="textarea"
            :rows="2"
            placeholder="可选：补充反馈"
          />
        </template>

        <template v-else-if="pendingInteraction.type !== 'confirm'">
          <el-input
            v-model="pendingTextInput"
            type="textarea"
            :rows="2"
            :placeholder="pendingInteraction.placeholder || '请输入'"
          />
        </template>

        <el-input
          v-if="pendingInteraction.type === 'confirm'"
          v-model="pendingReason"
          size="small"
          placeholder="可选：给这次确认补充一句备注"
        />
        <div class="interaction-actions">
          <el-button size="small" @click="handleRejectInteraction">
            {{ pendingInteraction.type === "confirm" ? "取消" : "跳过" }}
          </el-button>
          <el-button size="small" type="primary" @click="handleSubmitInteraction">
            {{ pendingInteraction.type === "confirm" ? "确认继续" : "提交" }}
          </el-button>
        </div>
      </section>

      <footer class="input-area">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="3"
          placeholder="输入消息，Enter 发送，Shift+Enter 换行"
          :disabled="loading || !!pendingInteraction"
          @keydown="handleKeydown"
        />
        <div class="input-actions">
          <span class="input-hint">Enter 发送，Shift+Enter 换行</span>
          <el-button
            type="primary"
            :icon="Promotion"
            :loading="loading"
            :disabled="!inputMessage.trim() || !!pendingInteraction"
            @click="handleSend"
          >
            发送
          </el-button>
          <el-button v-if="messages.length" type="danger" plain @click="handleClear">
            清空记录
          </el-button>
        </div>
      </footer>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { ChatDotRound, Delete, Plus, Promotion } from "@element-plus/icons-vue";
import type { ScrollbarInstance } from "element-plus";
import { marked } from "marked";
import {
  AiAssistantApi,
  type AiAssistantConversation,
  type AiAssistantMessage,
} from "@/api/aiAssistant";

interface PendingInteraction {
  type: string;
  runId: string;
  question: string;
  tool?: string;
  toolName?: string;
  label?: string;
  input?: Record<string, any>;
  options?: Array<string | Record<string, any>>;
  multiple?: boolean;
  fields?: Array<Record<string, any>>;
  placeholder?: string;
  defaultValue?: any;
  riskLevel?: string;
}

interface StreamContext {
  fullReply: string;
  assistantMsg: AiAssistantMessage | null;
}

interface InteractionOption {
  label: string;
  value: string;
  description?: string;
}

interface InteractionField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: Array<string | Record<string, any>>;
}

const route = useRoute();
const messageListRef = ref<HTMLElement>();
const messageScrollbarRef = ref<ScrollbarInstance>();
const inputMessage = ref("");
const pendingReason = ref("");
const pendingTextInput = ref("");
const pendingChoice = ref("");
const pendingChoiceList = ref<string[]>([]);
const pendingForm = ref<Record<string, any>>({});
const loading = ref(false);
const runtimeStatus = ref("idle");
const currentRunId = ref("");
const pendingInteraction = ref<PendingInteraction | null>(null);
const messages = ref<AiAssistantMessage[]>([]);
const conversations = ref<AiAssistantConversation[]>([]);
const currentConversationId = ref<number | null>(null);

const statusText = computed(() => {
  if (pendingInteraction.value) return "等待用户参与";
  if (loading.value) return runtimeStatus.value === "tool_calling" ? "工具执行中" : "思考中";
  return "空闲";
});

const interactionTag = computed(() => {
  switch (pendingInteraction.value?.type) {
    case "choice":
      return "请选择";
    case "form":
      return "请填写";
    case "feedback":
      return "请反馈";
    case "input":
    case "clarify":
      return "请补充";
    default:
      return "需要确认";
  }
});

const normalizedOptions = computed(() =>
  normalizeOptions(pendingInteraction.value?.options),
);

const normalizedFields = computed<InteractionField[]>(() =>
  (pendingInteraction.value?.fields || [])
    .map((field, index) => normalizeField(field, index))
    .filter(Boolean) as InteractionField[],
);

function renderMarkdown(text: string): string {
  if (!text) return "";
  return marked(text, { breaks: true }) as string;
}

async function loadConversations() {
  try {
    conversations.value = await AiAssistantApi.getConversations();
  } catch (error) {
    console.error("加载会话列表失败:", error);
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
  }
}

async function selectConversation(id: number) {
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
      await loadMessages();
    }
    ElMessage.success("已删除");
  } catch (error) {
    if (error !== "cancel") ElMessage.error("删除失败");
  }
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
  const pending = pendingInteraction.value;
  if (!pending?.runId || loading.value) return;

  pendingInteraction.value = null;
  loading.value = true;
  runtimeStatus.value = "thinking";

  await consumeStream((handlers) =>
    AiAssistantApi.resumeRunStream(
      pending.runId,
      {
        conversationId: currentConversationId.value || undefined,
        confirmed,
        input: resumeInput,
        reason,
      },
      handlers,
    ),
  );
  resetInteractionDrafts();
}

async function handleSubmitInteraction() {
  const pending = pendingInteraction.value;
  if (!pending) return;
  const resumeInput = buildResumeInput(pending);
  if (!validateInteractionInput(pending, resumeInput)) return;
  await resumeInteraction(
    true,
    resumeInput,
    pendingReason.value || resolveInteractionReason(pending, true),
  );
}

async function handleRejectInteraction() {
  const pending = pendingInteraction.value;
  if (!pending) return;
  await resumeInteraction(
    false,
    {
      ...normalizePlainObject(pending.input),
      action: "reject",
    },
    pendingReason.value || resolveInteractionReason(pending, false),
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
      if (data?.reply && !context.assistantMsg) {
        messages.value.push(createLocalMessage({ role: "assistant", content: data.reply }));
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

function appendAssistantDelta(content: string, context: StreamContext) {
  if (!content) return;
  if (!context.assistantMsg) {
    context.assistantMsg = createLocalMessage({ role: "assistant", content: "" });
    messages.value.push(context.assistantMsg);
  }
  context.fullReply += content;
  context.assistantMsg.content = context.fullReply;
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
  };
  initializeInteractionDrafts(pendingInteraction.value);

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
      runTrace: { interrupt },
    }),
  );
}

function normalizeInteractionType(type: string) {
  const normalized = String(type || "").trim();
  if (["confirm", "input", "choice", "form", "feedback", "clarify"].includes(normalized)) {
    return normalized;
  }
  return "input";
}

function initializeInteractionDrafts(interaction: PendingInteraction) {
  resetInteractionDrafts(false);
  pendingTextInput.value = String(interaction.defaultValue ?? "");
  const options = normalizeOptions(interaction.options);
  if (interaction.type === "choice" || interaction.type === "feedback") {
    pendingChoice.value = String(options[0]?.value || "");
  }
  if (interaction.type === "form") {
    const nextForm: Record<string, any> = {};
    for (const field of interaction.fields || []) {
      const normalized = normalizeField(field, 0);
      if (!normalized) continue;
      nextForm[normalized.name] =
        normalized.defaultValue !== undefined
          ? normalized.defaultValue
          : normalized.type === "boolean"
            ? false
            : "";
    }
    pendingForm.value = nextForm;
  }
}

function resetInteractionDrafts(clearReason = true) {
  pendingTextInput.value = "";
  pendingChoice.value = "";
  pendingChoiceList.value = [];
  pendingForm.value = {};
  if (clearReason) pendingReason.value = "";
}

function buildResumeInput(interaction: PendingInteraction) {
  const base = normalizePlainObject(interaction.input);
  switch (interaction.type) {
    case "confirm":
      return {
        ...base,
        action: "confirm",
        note: pendingReason.value || "",
      };
    case "choice": {
      const selected = interaction.multiple
        ? pendingChoiceList.value
        : pendingChoice.value;
      return {
        ...base,
        action: "answer",
        selected,
        value: selected,
      };
    }
    case "form":
      return {
        ...base,
        action: "answer",
        fields: { ...pendingForm.value },
        ...pendingForm.value,
      };
    case "feedback":
      return {
        ...base,
        action: "feedback",
        selected: pendingChoice.value,
        feedback: pendingTextInput.value.trim(),
      };
    default:
      return {
        ...base,
        action: "answer",
        value: pendingTextInput.value.trim(),
        text: pendingTextInput.value.trim(),
      };
  }
}

function validateInteractionInput(
  interaction: PendingInteraction,
  input: Record<string, any>,
) {
  if (interaction.type === "choice") {
    const hasValue = interaction.multiple
      ? Array.isArray(input.selected) && input.selected.length > 0
      : Boolean(input.selected);
    if (!hasValue) {
      ElMessage.warning("请选择一个选项");
      return false;
    }
  }
  if (interaction.type === "form") {
    for (const field of normalizedFields.value) {
      const value = pendingForm.value[field.name];
      if (
        field.required &&
        (value === undefined || value === null || String(value).trim() === "")
      ) {
        ElMessage.warning(`请填写${field.label}`);
        return false;
      }
    }
  }
  if (
    (interaction.type === "input" || interaction.type === "clarify") &&
    !String(input.value || "").trim()
  ) {
    ElMessage.warning("请先输入内容");
    return false;
  }
  return true;
}

function resolveInteractionReason(interaction: PendingInteraction, confirmed: boolean) {
  if (!confirmed) return "用户跳过或取消本次交互";
  switch (interaction.type) {
    case "confirm":
      return "用户确认继续执行";
    case "choice":
      return "用户已完成选择";
    case "form":
      return "用户已提交表单";
    case "feedback":
      return "用户已提交反馈";
    default:
      return "用户已补充信息";
  }
}

function normalizePlainObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function normalizeOptions(rawOptions?: Array<string | Record<string, any>>): InteractionOption[] {
  const options = Array.isArray(rawOptions) ? rawOptions : [];
  return options
    .map((option, index) => {
      if (typeof option === "string") {
        const value = option.trim();
        return value ? { label: value, value } : null;
      }
      if (!option || typeof option !== "object") return null;
      const label = String(option.label || option.title || option.name || option.value || `选项 ${index + 1}`);
      const value = String(option.value ?? option.id ?? option.key ?? label);
      return {
        label,
        value,
        description: String(option.description || option.summary || "").trim(),
      };
    })
    .filter(Boolean) as InteractionOption[];
}

function normalizeField(field: Record<string, any>, index: number): InteractionField | null {
  if (!field || typeof field !== "object") return null;
  const name = String(field.name || field.key || `field_${index + 1}`).trim();
  if (!name) return null;
  const type = normalizeFieldType(field.type);
  return {
    name,
    label: String(field.label || field.title || name).trim(),
    type,
    required: field.required === true,
    placeholder: String(field.placeholder || "").trim(),
    defaultValue: field.defaultValue,
    options: Array.isArray(field.options) ? field.options : [],
  };
}

function normalizeFieldType(type: unknown) {
  const normalized = String(type || "").trim().toLowerCase();
  if (["text", "textarea", "number", "boolean", "select", "date", "datetime"].includes(normalized)) {
    return normalized;
  }
  return "text";
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
    e.preventDefault();
    handleSend();
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
  display: flex;
  height: 100%;
  min-height: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-size: 13px;
}

.ai-assistant__sidebar {
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  background: var(--el-fill-color-blank);
  min-height: 0;
}

.sidebar-header {
  min-height: 48px;
  padding: 8px 10px 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-weight: 600;
}

.sidebar-title {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-primary);
}

.conversation-list {
  flex: 1;
  min-height: 0;
}

.conversation-list :deep(.el-scrollbar__view) {
  padding: 8px;
}

.conversation-item {
  width: 100%;
  padding: 8px 9px;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 6px;
  color: var(--el-text-color-primary);
  background: transparent;
  text-align: left;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease;
}

.conversation-item:hover {
  background: var(--el-fill-color-lighter);
  border-color: var(--el-border-color-lighter);
}

.conversation-item.active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-6);
}

.conversation-title {
  display: block;
  font-size: 13px;
  line-height: 18px;
  margin-bottom: 6px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.delete-btn {
  opacity: 0;
  width: 22px;
  height: 22px;
  color: var(--el-text-color-secondary);
  transition: opacity 0.2s;
}

.conversation-item:hover .delete-btn {
  opacity: 1;
}

.ai-assistant__main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  background: var(--el-bg-color);
}

.assistant-toolbar {
  min-height: 48px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--el-fill-color-blank);
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
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.run-tag {
  max-width: 110px;
  flex-shrink: 0;
}

.message-scrollbar {
  flex: 1;
  min-height: 0;
  background:
    linear-gradient(var(--el-fill-color-extra-light), transparent 120px),
    var(--el-bg-color);
}

.message-list {
  min-height: 100%;
  padding: 18px 20px 20px;
}

.message-item {
  margin-bottom: 14px;
}

.message-content {
  display: flex;
  min-width: 0;
}

.message-content--user {
  justify-content: flex-end;
}

.message-content--user .message-text {
  background: var(--el-color-primary);
  color: #fff;
  border-color: transparent;
  border-radius: 8px 8px 2px 8px;
  max-width: min(640px, 72%);
}

.message-content--assistant {
  gap: 8px;
  align-items: flex-start;
}

.message-avatar {
  flex-shrink: 0;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.message-body {
  max-width: min(720px, 76%);
  min-width: 0;
}

.message-text {
  padding: 9px 11px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-extra-light);
  border-radius: 2px 8px 8px 8px;
  word-break: break-word;
  line-height: 1.62;
  font-size: 13px;
  color: var(--el-text-color-primary);
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

.message-content--tool {
  width: min(680px, calc(100% - 40px));
  padding-left: 36px;
}

.message-tool {
  --el-alert-padding: 6px 9px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.message-tool :deep(.el-alert__title) {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 12px;
  line-height: 18px;
}

.tool-title {
  flex-shrink: 0;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tool-result {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
}

.assistant-skeleton {
  width: min(360px, 60vw);
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 2px 8px 8px 8px;
  background: var(--el-fill-color-extra-light);
}

.assistant-skeleton :deep(.el-skeleton__item) {
  height: 12px;
}

.interaction-panel {
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 12px 16px;
  display: grid;
  gap: 10px;
  background: var(--el-color-warning-light-9);
}

.interaction-main {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.interaction-main > div {
  min-width: 0;
}

.interaction-title {
  font-size: 13px;
  line-height: 18px;
  font-weight: 650;
  margin-bottom: 3px;
}

.interaction-panel pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.55;
}

.choice-list,
.interaction-form,
.feedback-actions {
  display: grid;
  gap: 8px;
}

.choice-list :deep(.el-radio),
.choice-list :deep(.el-checkbox) {
  width: 100%;
  height: auto;
  min-height: 34px;
  margin-right: 0;
  padding: 7px 10px;
  border-radius: 6px;
  background: var(--el-bg-color);
}

.choice-list :deep(.el-radio__label),
.choice-list :deep(.el-checkbox__label) {
  font-size: 12px;
  line-height: 18px;
}

.choice-list small {
  display: block;
  margin-top: 1px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.interaction-form :deep(.el-form-item) {
  margin-bottom: 8px;
}

.interaction-form :deep(.el-form-item__label) {
  margin-bottom: 3px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.interaction-form :deep(.el-select),
.interaction-form :deep(.el-date-editor),
.interaction-form :deep(.el-input-number) {
  width: 100%;
}

.interaction-panel :deep(.el-input__wrapper),
.interaction-panel :deep(.el-textarea__inner) {
  border-radius: 6px;
}

.feedback-actions {
  grid-template-columns: repeat(auto-fit, minmax(76px, max-content));
}

.interaction-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.input-area {
  padding: 10px 12px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
}

.input-area :deep(.el-textarea__inner) {
  min-height: 72px !important;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.55;
  box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
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

@media (max-width: 860px) {
  .ai-assistant__sidebar {
    width: 210px;
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
</style>
