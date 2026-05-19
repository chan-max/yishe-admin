<template>
  <XProvider :theme="xTheme" component-size="small">
    <section class="ai-assistant">
      <aside class="ai-assistant__sidebar">
        <header class="ai-assistant__sidebar-head">
          <div class="ai-assistant__sidebar-title">
            <span>智能助手</span>
            <ATag>{{ conversations.length }}</ATag>
          </div>
          <Actions :items="sidebarActions" variant="borderless" @click="handleSidebarAction" />
        </header>

        <div class="ai-assistant__conversation-body">
          <Conversations
            v-if="conversationItems.length"
            class="ai-assistant__conversation-list"
            :items="conversationItems"
            :active-key="activeConversationKey"
            :menu="conversationMenu"
            :on-active-change="handleConversationChange"
          />
          <AEmpty v-else class="ai-assistant__empty-side" :image="emptyImage" description="暂无会话" />
        </div>
      </aside>

      <main class="ai-assistant__main">
        <header class="ai-assistant__header">
          <div class="ai-assistant__header-main">
            <div class="ai-assistant__title-row">
              <h2>{{ activeConversationTitle }}</h2>
              <ATag v-if="activePersonaName">{{ activePersonaName }}</ATag>
              <ATooltip v-if="currentRunId" :title="currentRunId">
                <ATag color="blue">Run {{ currentRunId.slice(-8) }}</ATag>
              </ATooltip>
            </div>
            <div class="ai-assistant__subtitle">{{ statusText }}</div>
          </div>
          <Actions
            v-if="headerActions.length"
            :items="headerActions"
            variant="borderless"
            @click="handleHeaderAction"
          />
        </header>

        <section class="ai-assistant__content">
          <div v-if="showEmptyState" class="ai-assistant__empty-main">
            <Welcome
              class="ai-assistant__welcome"
              variant="borderless"
              title="智能助手"
            />
            <Prompts
              class="ai-assistant__prompt-list"
              :items="promptItems"
              wrap
              :on-item-click="handlePromptClick"
            />
          </div>

          <BubbleList
            v-else
            ref="bubbleListRef"
            class="ai-assistant__bubble-list"
            :items="bubbleItems"
            :roles="bubbleRoles"
            :auto-scroll="true"
            :on-scroll="handleBubbleScroll"
          >
            <template #header="{ item }">
              <div class="ai-assistant__bubble-head">
                <span>{{ getBubbleLabel(item) }}</span>
                <span>{{ getBubbleTime(item) }}</span>
                <ATag v-if="isInterruptBubble(item)" color="gold">交互</ATag>
              </div>
            </template>

            <template #message="{ item }">
              <div
                v-if="getBubbleMessage(item).role === 'tool'"
                class="ai-assistant__tool-message"
              >
                <div class="ai-assistant__tool-line">
                  <ATag :color="getToolTagColor(item)">{{ getToolTagText(item) }}</ATag>
                  <strong>{{ getBubbleMessage(item).toolLabel || getBubbleMessage(item).toolKey || "工具" }}</strong>
                </div>
                <p>{{ getBubbleMessage(item).content }}</p>
              </div>

              <MarkdownView
                v-else-if="getBubbleMessage(item).role === 'assistant'"
                class="ai-assistant__markdown"
                :content="getBubbleMessage(item).content || ''"
              />

              <div v-else class="ai-assistant__user-message">
                {{ getBubbleMessage(item).content }}
              </div>
            </template>
          </BubbleList>

          <AButton
            v-if="showScrollToBottom"
            class="ai-assistant__scroll-bottom"
            size="small"
            shape="circle"
            :icon="h(DownOutlined)"
            @click="scrollToBottom"
          />
        </section>

        <section v-if="pendingInteraction" class="ai-assistant__interaction">
          <div class="ai-assistant__interaction-head">
            <ATag color="gold">{{ interactionTag }}</ATag>
            <strong>{{ pendingInteraction.label || "需要用户参与" }}</strong>
            <span v-if="pendingInteraction.toolName || pendingInteraction.tool">
              {{ pendingInteraction.toolName || pendingInteraction.tool }}
            </span>
          </div>
          <div class="ai-assistant__interaction-question">
            {{ pendingInteraction.question }}
          </div>

          <template v-if="pendingInteraction.type === 'choice'">
            <div class="ai-assistant__choice-list">
              <ACheckboxGroup
                v-if="pendingInteraction.multiple"
                v-model:value="pendingChoiceList"
                class="ai-assistant__choice-group"
              >
                <label
                  v-for="option in normalizedOptions"
                  :key="option.value"
                  class="ai-assistant__choice-option"
                >
                  <ACheckbox :value="option.value" />
                  <span>
                    <strong>{{ option.label }}</strong>
                    <small v-if="option.description">{{ option.description }}</small>
                  </span>
                </label>
              </ACheckboxGroup>

              <ARadioGroup
                v-else
                v-model:value="pendingChoice"
                class="ai-assistant__choice-group"
              >
                <label
                  v-for="option in normalizedOptions"
                  :key="option.value"
                  class="ai-assistant__choice-option"
                >
                  <ARadio :value="option.value" />
                  <span>
                    <strong>{{ option.label }}</strong>
                    <small v-if="option.description">{{ option.description }}</small>
                  </span>
                </label>
              </ARadioGroup>
            </div>
          </template>

          <template v-else-if="pendingInteraction.type === 'form'">
            <AForm layout="vertical" class="ai-assistant__form" :colon="false">
              <AFormItem
                v-for="field in normalizedFields"
                :key="field.name"
                :label="field.label"
                :required="field.required"
              >
                <ASwitch
                  v-if="field.type === 'boolean'"
                  v-model:checked="pendingForm[field.name]"
                />
                <ASelect
                  v-else-if="field.type === 'select'"
                  v-model:value="pendingForm[field.name]"
                  :options="normalizeOptions(field.options)"
                  :placeholder="field.placeholder || '请选择'"
                  allow-clear
                />
                <ADatePicker
                  v-else-if="field.type === 'date' || field.type === 'datetime'"
                  :value="getDatePickerValue(field)"
                  :format="field.type === 'datetime' ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'"
                  :show-time="field.type === 'datetime'"
                  :placeholder="field.placeholder || '请选择时间'"
                  class="ai-assistant__date-picker"
                  @change="(_, value) => handleDateFieldChange(field, value)"
                />
                <AInputNumber
                  v-else-if="field.type === 'number'"
                  v-model:value="pendingForm[field.name]"
                  class="ai-assistant__number-input"
                />
                <AInput.TextArea
                  v-else-if="field.type === 'textarea'"
                  v-model:value="pendingForm[field.name]"
                  :rows="3"
                  :placeholder="field.placeholder || '请输入'"
                />
                <AInput
                  v-else
                  v-model:value="pendingForm[field.name]"
                  :placeholder="field.placeholder || '请输入'"
                />
              </AFormItem>
            </AForm>
          </template>

          <template v-else-if="pendingInteraction.type === 'feedback'">
            <div class="ai-assistant__feedback">
              <ASpace wrap>
                <AButton
                  v-for="option in normalizedOptions"
                  :key="option.value"
                  size="small"
                  :type="pendingChoice === option.value ? 'primary' : 'default'"
                  @click="pendingChoice = option.value"
                >
                  {{ option.label }}
                </AButton>
              </ASpace>
              <AInput.TextArea
                v-model:value="pendingTextInput"
                :rows="2"
                placeholder="可选反馈"
              />
            </div>
          </template>

          <template v-else-if="pendingInteraction.type !== 'confirm'">
            <AInput.TextArea
              v-model:value="pendingTextInput"
              :rows="2"
              :placeholder="pendingInteraction.placeholder || '请输入'"
            />
          </template>

          <AInput
            v-if="pendingInteraction.type === 'confirm'"
            v-model:value="pendingReason"
            placeholder="可选备注"
          />

          <div class="ai-assistant__interaction-actions">
            <AButton size="small" @click="handleRejectInteraction">
              {{ pendingInteraction.type === "confirm" ? "取消" : "跳过" }}
            </AButton>
            <AButton size="small" type="primary" @click="handleSubmitInteraction">
              {{ pendingInteraction.type === "confirm" ? "确认继续" : "提交" }}
            </AButton>
          </div>
        </section>

        <footer class="ai-assistant__composer">
          <Sender
            ref="senderRef"
            class="ai-assistant__sender"
            :value="inputMessage"
            :loading="loading"
            :disabled="Boolean(pendingInteraction)"
            :send-disabled="!canSend"
            :placeholder="senderPlaceholder"
            :auto-size="{ minRows: 2, maxRows: 5 }"
            :on-change="handleDraftChange"
            :on-submit="handleSend"
          />
        </footer>
      </main>
    </section>
  </XProvider>
</template>

<script setup lang="ts">
import { computed, h, nextTick, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import dayjs, { type Dayjs } from "dayjs";
import {
  ClearOutlined,
  DownOutlined,
  PlusOutlined,
  ReloadOutlined,
  RobotOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons-vue";
import {
  Avatar as AAvatar,
  Button as AButton,
  Checkbox as ACheckbox,
  CheckboxGroup as ACheckboxGroup,
  DatePicker as ADatePicker,
  Empty as AEmpty,
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput,
  InputNumber as AInputNumber,
  message as antMessage,
  Modal,
  Radio as ARadio,
  RadioGroup as ARadioGroup,
  Select as ASelect,
  Space as ASpace,
  Switch as ASwitch,
  Tag as ATag,
  Tooltip as ATooltip,
} from "ant-design-vue";
import {
  Actions,
  BubbleList,
  Conversations,
  Prompts,
  Sender,
  Welcome,
  XProvider,
  type ActionItem,
} from "ant-design-x-vue";
import {
  AiAssistantApi,
  type AiAssistantConversation,
  type AiAssistantMessage,
} from "@/api/aiAssistant";
import MarkdownView from "@/components/MarkdownView/index.vue";

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

type AssistantBubbleItem = Record<string, any> & {
  raw: AiAssistantMessage;
};

type BubbleListExpose = {
  nativeElement?: HTMLDivElement;
  scrollTo?: (info: {
    offset?: number;
    key?: string | number;
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition;
  }) => void;
};

type SenderExpose = {
  focus?: (options?: { cursor?: "start" | "end" | "all" }) => void;
  blur?: () => void;
};

const route = useRoute();
const emptyImage = AEmpty.PRESENTED_IMAGE_SIMPLE;
const senderRef = ref<SenderExpose | null>(null);
const bubbleListRef = ref<BubbleListExpose | null>(null);
const inputMessage = ref("");
const pendingReason = ref("");
const pendingTextInput = ref("");
const pendingChoice = ref("");
const pendingChoiceList = ref<string[]>([]);
const pendingForm = ref<Record<string, any>>({});
const loading = ref(false);
const runtimeStatus = ref("idle");
const currentRunId = ref("");
const isBubbleReachEnd = ref(true);
const pendingInteraction = ref<PendingInteraction | null>(null);
const messages = ref<AiAssistantMessage[]>([]);
const conversations = ref<AiAssistantConversation[]>([]);
const currentConversationId = ref<number | null>(null);

const xTheme = {
  token: {
    borderRadius: 8,
    fontSize: 13,
    fontSizeSM: 12,
    colorPrimary: "#1677ff",
    wireframe: false,
  },
};

const bubbleRoles = {
  assistant: {
    placement: "start",
    variant: "outlined",
    shape: "corner",
    avatar: () =>
      h(AAvatar, { size: 24, class: "ai-assistant__avatar ai-assistant__avatar--ai" }, () =>
        h(RobotOutlined),
      ),
  },
  user: {
    placement: "end",
    variant: "filled",
    shape: "corner",
    avatar: () =>
      h(AAvatar, { size: 24, class: "ai-assistant__avatar ai-assistant__avatar--user" }, () =>
        h(UserOutlined),
      ),
  },
  tool: {
    placement: "start",
    variant: "outlined",
    shape: "corner",
    avatar: () =>
      h(AAvatar, { size: 24, class: "ai-assistant__avatar ai-assistant__avatar--tool" }, () =>
        h(ToolOutlined),
      ),
  },
} as const;

const activeConversation = computed(() =>
  conversations.value.find((item) => item.id === currentConversationId.value),
);

const activeConversationKey = computed(() =>
  currentConversationId.value ? String(currentConversationId.value) : undefined,
);

const activePersonaName = computed(() => activeConversation.value?.persona?.name || "");

const activeConversationTitle = computed(() =>
  activeConversation.value?.title || "新会话",
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
  if (pendingInteraction.value) return "先完成上方交互";
  if (loading.value) return "智能助手正在处理";
  return "输入你的目标或问题";
});

const canSend = computed(
  () => Boolean(inputMessage.value.trim()) && !loading.value && !pendingInteraction.value,
);

const showEmptyState = computed(
  () => !messages.value.length && !loading.value && !pendingInteraction.value,
);

const showScrollToBottom = computed(
  () => !isBubbleReachEnd.value && messages.value.length > 2,
);

const sidebarActions = computed<ActionItem[]>(() => [
  { key: "refresh", label: "刷新", icon: h(ReloadOutlined) },
  { key: "new", label: "新会话", icon: h(PlusOutlined) },
]);

const headerActions = computed<ActionItem[]>(() => {
  if (!messages.value.length) return [];
  return [{ key: "clear", label: "清空记录", icon: h(ClearOutlined) }];
});

const conversationItems = computed(() =>
  conversations.value.map((item) => ({
    key: String(item.id),
    label: item.title || "未命名会话",
    timestamp: item.updatedAt ? new Date(item.updatedAt).getTime() : undefined,
  })),
);

const promptItems = [
  {
    key: "page",
    label: "分析当前页面",
  },
  {
    key: "plan",
    label: "先拆解任务",
  },
  {
    key: "confirm",
    label: "先问我问题",
  },
];

const promptTextMap: Record<string, string> = {
  page: "请结合当前页面上下文，帮我分析我下一步可以做什么。",
  plan: "请先把这个任务拆成可执行步骤，再开始处理。",
  confirm: "如果你需要我确认、选择或补充参数，请直接暂停并向我提问。",
};

const bubbleItems = computed<any[]>(() =>
  messages.value.map((message) => ({
    key: String(message.id),
    role: message.role,
    content: message.content,
    raw: message,
    rootClassName: [
      "ai-assistant__bubble",
      `ai-assistant__bubble--${message.role}`,
      message.runTrace?.interrupt ? "is-interrupt" : "",
    ]
      .filter(Boolean)
      .join(" "),
    loading:
      message.role === "assistant" &&
      !message.content &&
      loading.value &&
      message.runTrace?.runId === currentRunId.value,
  })),
);

const interactionTag = computed(() => {
  switch (pendingInteraction.value?.type) {
    case "choice":
      return "选择";
    case "form":
      return "填写";
    case "feedback":
      return "反馈";
    case "input":
    case "clarify":
      return "补充";
    default:
      return "确认";
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

function handleSidebarAction(info: { key: string }) {
  if (info.key === "new") {
    handleCreateConversation();
  }
  if (info.key === "refresh") {
    loadConversations();
  }
}

function handleHeaderAction(info: { key: string }) {
  if (info.key === "clear") {
    handleClear();
  }
}

function conversationMenu(item: { key: string }) {
  return {
    items: [{ key: "delete", label: "删除", danger: true }],
    onClick(info: any) {
      info.domEvent?.stopPropagation?.();
      if (info.key === "delete") {
        handleDeleteConversation(Number(item.key));
      }
    },
  };
}

function handlePromptClick(info: { data: { key: string; label?: string } }) {
  inputMessage.value =
    promptTextMap[info.data.key] || String(info.data.label || "");
  nextTick(() => senderRef.value?.focus?.({ cursor: "end" }));
}

function handleDraftChange(value: string) {
  inputMessage.value = value;
}

function handleBubbleScroll(event: Event) {
  const target = event.target as HTMLElement;
  isBubbleReachEnd.value =
    target.scrollHeight - Math.abs(target.scrollTop) - target.clientHeight < 24;
}

function scrollToBottom() {
  nextTick(() => {
    const element = bubbleListRef.value?.nativeElement;
    bubbleListRef.value?.scrollTo({
      offset: element?.scrollHeight || 0,
      behavior: "smooth",
    });
    isBubbleReachEnd.value = true;
  });
}

async function loadConversations() {
  try {
    conversations.value = await AiAssistantApi.getConversations();
  } catch (error) {
    console.error("加载会话列表失败:", error);
    antMessage.error("加载会话失败");
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
    antMessage.error("加载消息失败");
  }
}

async function handleConversationChange(key: string) {
  const id = Number(key);
  if (!Number.isFinite(id) || currentConversationId.value === id) return;
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
    resetInteractionDrafts();
    nextTick(() => senderRef.value?.focus?.({ cursor: "end" }));
  } catch (error) {
    console.error("创建会话失败:", error);
    antMessage.error("创建会话失败");
  }
}

async function handleDeleteConversation(id: number) {
  const confirmed = await confirmAction("删除会话", "删除后无法恢复，确认继续？");
  if (!confirmed) return;

  try {
    await AiAssistantApi.deleteConversation(id);
    conversations.value = conversations.value.filter((item) => item.id !== id);
    if (currentConversationId.value === id) {
      currentConversationId.value = conversations.value[0]?.id || null;
      messages.value = [];
      if (currentConversationId.value) {
        await loadMessages();
      }
    }
    antMessage.success("会话已删除");
  } catch (error) {
    console.error("删除会话失败:", error);
    antMessage.error("删除失败");
  }
}

async function handleSend(submitted?: string) {
  const message = String(submitted ?? inputMessage.value).trim();
  if (!message || loading.value || pendingInteraction.value) return;

  inputMessage.value = "";
  loading.value = true;
  runtimeStatus.value = "thinking";
  currentRunId.value = "";
  pendingInteraction.value = null;

  messages.value.push(createLocalMessage({ role: "user", content: message }));

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

async function resumeInteraction(
  confirmed: boolean,
  resumeInput: Record<string, any>,
  reason: string,
) {
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
        antMessage.error("请求失败，请重试");
      },
      onDone() {
        loading.value = false;
      },
    });
  } catch (error) {
    console.error("发送失败:", error);
    antMessage.error("发送失败");
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
      antMessage.error(data?.error || "智能助手执行失败");
      runtimeStatus.value = "idle";
      break;
  }
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
      runTrace: { interrupt, runId },
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
            : undefined;
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
      antMessage.warning("请选择一个选项");
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
        antMessage.warning(`请填写${field.label}`);
        return false;
      }
    }
  }
  if (
    (interaction.type === "input" || interaction.type === "clarify") &&
    !String(input.value || "").trim()
  ) {
    antMessage.warning("请先输入内容");
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

function getDatePickerValue(field: InteractionField): Dayjs | null {
  const value = pendingForm.value[field.name];
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

function handleDateFieldChange(field: InteractionField, value: string | string[]) {
  pendingForm.value[field.name] = Array.isArray(value) ? value[0] : value;
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
  const confirmed = await confirmAction("清空记录", "确认清空当前会话的所有消息？");
  if (!confirmed) return;

  try {
    await AiAssistantApi.clearMessages({
      conversationId: currentConversationId.value || undefined,
    });
    messages.value = [];
    pendingInteraction.value = null;
    antMessage.success("已清空");
  } catch (error) {
    console.error("清空失败:", error);
    antMessage.error("清空失败");
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

function getBubbleItem(item: unknown): AssistantBubbleItem {
  return item as AssistantBubbleItem;
}

function getBubbleMessage(item: unknown): AiAssistantMessage {
  return getBubbleItem(item).raw;
}

function getBubbleLabel(item: unknown) {
  const message = getBubbleMessage(item);
  if (message.role === "user") return "你";
  if (message.role === "tool") return message.toolLabel || message.toolKey || "工具";
  if (message.runTrace?.interrupt) return "需要用户参与";
  return "智能助手";
}

function getBubbleTime(item: unknown) {
  return formatDateTime(getBubbleMessage(item).createdAt);
}

function isInterruptBubble(item: unknown) {
  return Boolean(getBubbleMessage(item).runTrace?.interrupt);
}

function getToolTagColor(item: unknown) {
  const message = getBubbleMessage(item);
  if (message.toolResult?.success === false) return "red";
  if (message.content === "执行中...") return "blue";
  return "green";
}

function getToolTagText(item: unknown) {
  const message = getBubbleMessage(item);
  if (message.toolResult?.success === false) return "失败";
  if (message.content === "执行中...") return "执行中";
  return "完成";
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const date = dayjs(value);
  if (!date.isValid()) return "";
  return date.isSame(dayjs(), "day") ? date.format("HH:mm") : date.format("MM-DD HH:mm");
}

function confirmAction(title: string, content: string) {
  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      title,
      content,
      okText: "确认",
      cancelText: "取消",
      centered: true,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
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
  --ai-bg: #f6f7f9;
  --ai-surface: #ffffff;
  --ai-surface-soft: #fafbfc;
  --ai-border: #e7e9ee;
  --ai-border-strong: #d9dde5;
  --ai-text: #1f2329;
  --ai-text-secondary: #5d6676;
  --ai-text-tertiary: #8a93a3;
  --ai-primary: #1677ff;
  display: flex;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--ai-border);
  border-radius: 8px;
  background: var(--ai-surface);
  color: var(--ai-text);
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-size: 13px;
  letter-spacing: 0;
}

.ai-assistant * {
  box-sizing: border-box;
  letter-spacing: 0;
}

.ai-assistant__sidebar {
  width: 252px;
  min-width: 252px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--ai-border);
  background: var(--ai-surface-soft);
}

.ai-assistant__sidebar-head,
.ai-assistant__header {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--ai-border);
  background: var(--ai-surface);
}

.ai-assistant__sidebar-title {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
  color: var(--ai-text);
  font-size: 13px;
  font-weight: 600;
}

.ai-assistant__conversation-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 8px;
}

.ai-assistant__conversation-list {
  height: 100%;
  overflow-y: auto;
}

:deep(.ai-assistant__conversation-list.ant-conversations) {
  display: block;
}

:deep(.ant-conversations-item) {
  min-height: 34px;
  margin-bottom: 4px;
  border-radius: 8px;
  color: var(--ai-text-secondary);
  transition:
    background-color 0.16s ease,
    color 0.16s ease;
}

:deep(.ant-conversations-item:hover) {
  background: #eef3ff;
  color: var(--ai-text);
}

:deep(.ant-conversations-item-active) {
  background: #e8f1ff;
  color: var(--ai-primary);
}

:deep(.ant-conversations-label) {
  font-size: 12px;
  font-weight: 500;
}

.ai-assistant__empty-side {
  padding-top: 64px;
}

.ai-assistant__main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--ai-surface);
}

.ai-assistant__header-main {
  min-width: 0;
}

.ai-assistant__title-row {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.ai-assistant__title-row h2 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--ai-text);
  font-size: 14px;
  font-weight: 650;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-assistant__subtitle {
  margin-top: 2px;
  color: var(--ai-text-tertiary);
  font-size: 12px;
  line-height: 16px;
}

.ai-assistant__content {
  position: relative;
  flex: 1;
  min-height: 0;
  background: var(--ai-bg);
}

.ai-assistant__empty-main {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  max-width: 680px;
  margin: 0 auto;
  padding: 24px;
}

.ai-assistant__welcome {
  padding: 0;
  background: transparent;
}

:deep(.ai-assistant__welcome .ant-welcome-title) {
  margin: 0 0 6px;
  color: var(--ai-text);
  font-size: 17px;
  font-weight: 650;
  line-height: 24px;
}

:deep(.ai-assistant__welcome .ant-welcome-description) {
  color: var(--ai-text-secondary);
  font-size: 12px;
  line-height: 20px;
}

:deep(.ai-assistant__prompt-list .ant-prompts-list) {
  gap: 8px;
}

:deep(.ai-assistant__prompt-list .ant-prompts-item) {
  min-width: 168px;
  padding: 9px 10px;
  border: 1px solid var(--ai-border);
  border-radius: 8px;
  background: var(--ai-surface);
  box-shadow: none;
}

:deep(.ai-assistant__prompt-list .ant-prompts-label) {
  margin: 0;
  color: var(--ai-text);
  font-size: 12px;
  font-weight: 600;
}

:deep(.ai-assistant__prompt-list .ant-prompts-desc) {
  margin: 3px 0 0;
  color: var(--ai-text-tertiary);
  font-size: 11px;
  line-height: 16px;
}

.ai-assistant__bubble-list {
  height: 100%;
  padding: 16px 20px 18px;
  gap: 12px;
}

:deep(.ai-assistant__bubble .ant-bubble-content-wrapper) {
  max-width: min(720px, 82%);
}

:deep(.ai-assistant__bubble .ant-bubble-content) {
  min-height: 0;
  padding: 8px 10px;
  border-radius: 8px;
  border-color: var(--ai-border);
  box-shadow: none;
  font-size: 12px;
  line-height: 1.6;
}

:deep(.ai-assistant__bubble--assistant .ant-bubble-content) {
  background: var(--ai-surface);
}

:deep(.ai-assistant__bubble--user .ant-bubble-content) {
  background: var(--ai-primary);
  color: #fff;
}

:deep(.ai-assistant__bubble--tool .ant-bubble-content) {
  background: #f8fafc;
}

:deep(.ai-assistant__bubble.is-interrupt .ant-bubble-content) {
  border-color: #f4c97b;
  background: #fffaf0;
}

.ai-assistant__bubble-head {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 16px;
  color: var(--ai-text-tertiary);
  font-size: 11px;
  line-height: 16px;
}

:deep(.ai-assistant__avatar) {
  flex: 0 0 auto;
  border: 1px solid var(--ai-border);
  background: var(--ai-surface);
  color: var(--ai-text-secondary);
}

:deep(.ai-assistant__avatar--ai) {
  color: var(--ai-primary);
}

:deep(.ai-assistant__avatar--user) {
  border-color: #c8dafd;
  background: #eef4ff;
  color: var(--ai-primary);
}

:deep(.ai-assistant__avatar--tool) {
  color: #748094;
}

.ai-assistant__markdown {
  color: var(--ai-text);
}

.ai-assistant__markdown :deep(.markdown-view) {
  --markdown-font-size: 12px;
  --markdown-line-height: 1.6;
  --markdown-letter-spacing: 0;
  --markdown-paragraph-gap: 5px;
  --markdown-heading-gap-top: 14px;
  --markdown-heading-gap-bottom: 6px;
  --markdown-code-border-color: var(--ai-border);
  --markdown-code-bg: #f8fafc;
}

.ai-assistant__user-message {
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-assistant__tool-message {
  display: grid;
  gap: 6px;
  color: var(--ai-text-secondary);
}

.ai-assistant__tool-message p {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-assistant__tool-line {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 6px;
}

.ai-assistant__tool-line strong {
  min-width: 0;
  overflow: hidden;
  color: var(--ai-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-assistant__scroll-bottom {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 2;
  box-shadow: none;
}

.ai-assistant__interaction {
  flex-shrink: 0;
  display: grid;
  gap: 10px;
  max-height: 320px;
  overflow-y: auto;
  padding: 10px 14px 12px;
  border-top: 1px solid var(--ai-border);
  background: #fffdf7;
}

.ai-assistant__interaction-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  color: var(--ai-text-secondary);
  font-size: 12px;
  line-height: 18px;
}

.ai-assistant__interaction-head strong {
  color: var(--ai-text);
  font-size: 12px;
  font-weight: 650;
}

.ai-assistant__interaction-question {
  color: var(--ai-text);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-assistant__choice-list,
.ai-assistant__feedback {
  display: grid;
  gap: 8px;
}

.ai-assistant__choice-group {
  display: grid;
  gap: 6px;
}

.ai-assistant__choice-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  padding: 8px 10px;
  border: 1px solid var(--ai-border);
  border-radius: 8px;
  background: var(--ai-surface);
  cursor: pointer;
}

.ai-assistant__choice-option strong {
  display: block;
  color: var(--ai-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}

.ai-assistant__choice-option small {
  display: block;
  margin-top: 2px;
  color: var(--ai-text-tertiary);
  font-size: 11px;
  line-height: 16px;
}

.ai-assistant__form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px 12px;
}

.ai-assistant__form :deep(.ant-form-item) {
  margin-bottom: 0;
}

.ai-assistant__form :deep(.ant-form-item-label) {
  padding-bottom: 3px;
}

.ai-assistant__form :deep(.ant-form-item-label > label) {
  height: auto;
  color: var(--ai-text-secondary);
  font-size: 12px;
}

.ai-assistant__date-picker,
.ai-assistant__number-input {
  width: 100%;
}

.ai-assistant__interaction-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.ai-assistant__composer {
  flex-shrink: 0;
  padding: 10px 12px 12px;
  border-top: 1px solid var(--ai-border);
  background: var(--ai-surface);
}

.ai-assistant__sender {
  border-radius: 8px;
  box-shadow: none;
}

:deep(.ai-assistant__sender.ant-sender) {
  border-color: var(--ai-border);
}

:deep(.ai-assistant__sender .ant-sender-input) {
  font-size: 12px;
  line-height: 1.6;
}

:deep(.ant-tag) {
  border-radius: 6px;
  font-size: 11px;
  line-height: 18px;
}

:deep(.ant-actions-list) {
  gap: 4px;
}

:deep(.ant-actions-list-item) {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: var(--ai-text-secondary);
}

:deep(.ant-btn) {
  border-radius: 8px;
  font-size: 12px;
}

:deep(.ant-input),
:deep(.ant-input-number),
:deep(.ant-select-selector),
:deep(.ant-picker) {
  border-radius: 8px !important;
  font-size: 12px;
}

@media (max-width: 920px) {
  .ai-assistant__sidebar {
    width: 220px;
    min-width: 220px;
  }

  :deep(.ai-assistant__bubble .ant-bubble-content-wrapper) {
    max-width: 90%;
  }
}

@media (max-width: 720px) {
  .ai-assistant {
    flex-direction: column;
  }

  .ai-assistant__sidebar {
    width: 100%;
    min-width: 0;
    max-height: 188px;
    border-right: 0;
    border-bottom: 1px solid var(--ai-border);
  }

  .ai-assistant__conversation-body {
    padding: 6px;
  }

  .ai-assistant__bubble-list {
    padding: 12px;
  }

  .ai-assistant__form {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
