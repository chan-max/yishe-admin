<script lang="ts" setup>
import { ref, computed, nextTick, watch, onMounted } from "vue";
import type { ScrollbarInstance } from "element-plus";
import { Promotion } from "@element-plus/icons-vue";
import type { AiAssistantMessage } from "@/api/aiAssistant";
import { AiAssistantApi } from "@/api/aiAssistant";
import MarkdownView from "@/components/MarkdownView/index.vue";
import InteractionRenderer from "./interactions/InteractionRenderer.vue";
import CommandPopup from "./CommandPopup.vue";
import type { CommandItem } from "./CommandPopup.vue";
import type { InteractionPayload, InteractionSubmitResult } from "./interactions/types";

defineOptions({ name: "AssistantChat" });

const props = withDefaults(
  defineProps<{
    messages: AiAssistantMessage[];
    loading: boolean;
    pendingInteraction: InteractionPayload | null;
    thinkingText?: string;
    inputPlaceholder?: string;
    inputHint?: string;
    canSend?: boolean;
    promptItems?: Array<{ key: string; label: string }>;
    hasPendingAssistantMessage?: boolean;
    compact?: boolean;
  }>(),
  {
    inputPlaceholder: "输入你的目标或问题",
    inputHint: "Enter 发送，Shift+Enter 换行",
    canSend: false,
    thinkingText: "",
    promptItems: () => [],
    hasPendingAssistantMessage: false,
    compact: false,
  },
);

const emit = defineEmits<{
  send: [message: string];
  "interaction-submit": [result: InteractionSubmitResult];
  "interaction-reject": [result: InteractionSubmitResult];
  "prompt-click": [key: string];
}>();

const inputMessage = ref("");
const messageListRef = ref<HTMLElement>();
const messageScrollbarRef = ref<ScrollbarInstance>();
const inputRef = ref<{ focus?: () => void }>();
const commandPopupRef = ref<InstanceType<typeof CommandPopup>>();

// ── Slash Command Popup ──
const slashCommands = ref<CommandItem[]>([]);
const cmdPopupVisible = ref(false);
const cmdFilter = ref("");
const cmdTrigger = ref<"/" | "@" | null>(null);
const cmdTriggerIndex = ref(-1); // position of / or @ in inputMessage
const cmdAnchorRect = ref<{ left: number; top: number; width: number } | null>(null);

onMounted(async () => {
  try {
    const res = await AiAssistantApi.getCommands();
    slashCommands.value = (res.commands || []).map((c) => ({
      name: c.name,
      aliases: c.aliases,
      category: c.category,
      description: c.description,
    }));
  } catch {
    slashCommands.value = [];
  }
});

function detectCommandTrigger(text: string, cursorPos: number) {
  // Scan backward from cursor to find / or @ at start of a word
  for (let i = cursorPos - 1; i >= 0; i--) {
    const ch = text[i];
    if (ch === " " || ch === "\n") break; // word boundary
    if (ch === "/" || ch === "@") {
      // Must be at start of input or preceded by whitespace/newline
      if (i === 0 || /[\s\n]/.test(text[i - 1])) {
        cmdTrigger.value = ch;
        cmdTriggerIndex.value = i;
        cmdFilter.value = text.slice(i + 1, cursorPos);
        cmdPopupVisible.value = true;
        return;
      }
    }
  }
  cmdPopupVisible.value = false;
  cmdTrigger.value = null;
}

function handleInputChange() {
  const el = (inputRef.value as any)?.$el?.querySelector("textarea");
  const cursorPos = el?.selectionStart ?? inputMessage.value.length;
  // Compute anchor rect from textarea
  if (el) {
    const rect = el.getBoundingClientRect();
    cmdAnchorRect.value = { left: rect.left, top: rect.top, width: rect.width };
  }
  detectCommandTrigger(inputMessage.value, cursorPos);
}

function handleCommandSelect(cmd: CommandItem) {
  const alias = cmd.aliases[0] || `/${cmd.name}`;
  const before = inputMessage.value.slice(0, cmdTriggerIndex.value);
  const after = inputMessage.value.slice(
    cmdTriggerIndex.value + 1 + cmdFilter.value.length,
  );
  inputMessage.value = `${before}${alias} ${after}`.trimEnd() + " ";
  cmdPopupVisible.value = false;
  cmdTrigger.value = null;
  nextTick(() => {
    const el = (inputRef.value as any)?.$el?.querySelector("textarea");
    el?.focus();
  });
}

function handleCommandClose() {
  cmdPopupVisible.value = false;
  cmdTrigger.value = null;
}

const canSendComputed = computed(
  () => Boolean(inputMessage.value.trim()) && !props.loading && !props.pendingInteraction && props.canSend !== false,
);

function handleSend() {
  const message = inputMessage.value.trim();
  if (!message || !canSendComputed.value) return;
  inputMessage.value = "";
  cmdPopupVisible.value = false;
  emit("send", message);
}

function handleKeydown(e: KeyboardEvent) {
  // Forward to command popup first
  if (cmdPopupVisible.value && commandPopupRef.value?.handleKeydown(e)) {
    return;
  }
  if (e.key === "Enter" && !e.shiftKey) {
    if (!canSendComputed.value) return;
    e.preventDefault();
    handleSend();
  }
}

function handleInteractionSubmit(result: InteractionSubmitResult) {
  emit("interaction-submit", result);
}

function handleInteractionReject(result: InteractionSubmitResult) {
  emit("interaction-reject", result);
}

function handlePromptClick(key: string) {
  emit("prompt-click", key);
}

function toolMessageClass(message: AiAssistantMessage) {
  if (message.toolResult?.success === false) return "is-error";
  if (message.content === "执行中..." || message.content.startsWith("准备调用")) {
    return "is-running";
  }
  return "is-done";
}

function scrollToBottom() {
  nextTick(() => {
    const height = messageListRef.value?.scrollHeight || 0;
    if (messageScrollbarRef.value) {
      messageScrollbarRef.value.setScrollTop(height);
    }
  });
}

watch(
  () => props.messages.length,
  () => nextTick(() => scrollToBottom()),
);

watch(
  () => props.messages[props.messages.length - 1]?.content,
  () => nextTick(() => scrollToBottom()),
);

defineExpose({ scrollToBottom, focusInput: () => inputRef.value?.focus?.() });
</script>

<template>
  <div class="assistant-chat" :class="{ 'assistant-chat--compact': compact }">
    <el-scrollbar ref="messageScrollbarRef" class="chat-scrollbar">
      <div ref="messageListRef" class="message-list">
        <!-- 空状态 -->
        <div v-if="!messages.length && !loading" class="empty-state">
          <div class="empty-state__title">智能助手</div>
          <div class="empty-state__desc">告诉我你要完成的事，我会结合当前页面和工具能力来处理。</div>
          <div v-if="promptItems.length" class="prompt-list">
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

        <!-- 消息列表 -->
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message-item"
          :class="[`message-${msg.role}`]"
        >
          <!-- 用户消息 -->
          <div v-if="msg.role === 'user'" class="message-content message-content--user">
            <div class="message-text">{{ msg.content }}</div>
          </div>

          <!-- 助手消息 -->
          <div v-else-if="msg.role === 'assistant'" class="message-content message-content--assistant">
            <div class="message-body">
              <div class="message-text">
                <MarkdownView v-if="msg.content" :content="msg.content" />
                <span v-else class="message-pending">正在整理回复...</span>
              </div>
            </div>
          </div>

          <!-- 工具消息 -->
          <div v-else class="message-content message-content--tool">
            <div class="message-tool" :class="toolMessageClass(msg)">
              <span class="tool-dot" />
              <span class="tool-title">{{ msg.toolLabel || msg.toolKey || "工具" }}</span>
              <span class="tool-result">{{ msg.content }}</span>
            </div>
          </div>
        </div>

        <!-- 输入中指示器 -->
        <div v-if="loading && !hasPendingAssistantMessage" class="message-item message-assistant">
          <div class="message-content message-content--assistant">
            <div class="message-body">
              <div class="message-text message-text--typing">
                <span class="typing-dot" />
                <span class="typing-dot" />
                <span class="typing-dot" />
                <span>{{ thinkingText || "正在思考" }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>

    <!-- 交互区域 -->
    <section v-if="pendingInteraction" class="interaction-wrapper">
      <InteractionRenderer
        :payload="pendingInteraction"
        :loading="loading"
        @submit="handleInteractionSubmit"
        @reject="handleInteractionReject"
      />
    </section>

    <!-- 输入区域 -->
    <footer class="input-area">
      <CommandPopup
        ref="commandPopupRef"
        :visible="cmdPopupVisible"
        :commands="slashCommands"
        :filter="cmdFilter"
        :trigger="cmdTrigger"
        :anchor-rect="cmdAnchorRect"
        @select="handleCommandSelect"
        @close="handleCommandClose"
      />
      <el-input
        ref="inputRef"
        v-model="inputMessage"
        type="textarea"
        :rows="compact ? 2 : 3"
        :placeholder="inputPlaceholder"
        @keydown="handleKeydown"
        @input="handleInputChange"
      />
      <div class="input-actions">
        <span class="input-hint">{{ inputHint }} · 输入 / 触发命令</span>
        <el-button
          type="primary"
          :icon="Promotion"
          :loading="loading"
          :disabled="!canSendComputed"
          @click="handleSend"
        >
          {{ loading ? "处理中" : "发送" }}
        </el-button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.assistant-chat {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  min-width: 0;
}

.chat-scrollbar {
  flex: 1;
  min-height: 0;
  background: transparent;
}

.message-list {
  position: relative;
  min-height: 100%;
  padding: 16px 22px 18px;
}

.assistant-chat--compact .message-list {
  padding: 12px 14px 14px;
}

/* 空状态 */
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

.assistant-chat--compact .empty-state__title {
  font-size: 16px;
  line-height: 22px;
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

/* 消息 */
.message-item {
  margin-bottom: 16px;
}

.assistant-chat--compact .message-item {
  margin-bottom: 12px;
}

.message-content {
  display: flex;
  min-width: 0;
}

.message-content--user {
  justify-content: flex-end;
}

.message-content--user .message-text {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-radius: 8px 8px 2px 8px;
  max-width: min(640px, 72%);
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.55;
  word-break: break-word;
  white-space: pre-wrap;
}

.message-content--assistant {
  align-items: flex-start;
}

.message-content--assistant .message-body {
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 2px 10px 10px 10px;
  padding: 10px 14px;
  max-width: min(720px, 85%);
}

.message-body {
  min-width: 0;
  flex: 1;
}

.message-body .message-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.message-pending {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

.message-text--typing {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--el-text-color-secondary);
}

.typing-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
  animation: typingPulse 1.2s infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingPulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

/* 工具消息 */
.message-content--tool {
  padding-left: 36px;
}

.message-tool {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  line-height: 1.5;
  max-width: min(640px, 85%);
}

.message-tool.is-running {
  background: var(--el-color-warning-light-9);
}

.message-tool.is-running .tool-dot {
  background: var(--el-color-warning);
  animation: toolPulse 1s infinite;
}

.message-tool.is-done .tool-dot {
  background: var(--el-color-success);
}

.message-tool.is-error .tool-dot {
  background: var(--el-color-danger);
}

.message-tool.is-error .tool-result {
  color: var(--el-color-danger);
}

.tool-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}

@keyframes toolPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.tool-title {
  font-weight: 500;
  color: var(--el-text-color-regular);
  flex-shrink: 0;
}

.tool-result {
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

/* 交互区域 */
.interaction-wrapper {
  flex-shrink: 0;
  padding: 0 18px 8px;
}

/* 输入区域 */
.input-area {
  flex-shrink: 0;
  padding: 10px 18px 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.assistant-chat--compact .input-area {
  padding: 8px 12px 10px;
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
}

.input-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
