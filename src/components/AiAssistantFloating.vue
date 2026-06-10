<script lang="ts" setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Icon } from "@/components/Icon";
import { AiAssistantApi } from "@/api/aiAssistant";

defineOptions({ name: "AiAssistantFloating" });

const router = useRouter();
const isMobile = computed(() => window.innerWidth < 768);
const visible = ref(false);
const loading = ref(false);
const inputText = ref("");
const messages = ref<Array<{ role: "user" | "assistant"; content: string }>>([]);
const messageContainer = ref<HTMLElement>();
const conversationId = ref<number | null>(null);

// 拖动状态
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const popperOffset = ref({ x: 0, y: 0 });

const clampOffset = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const openFull = () => {
  visible.value = false;
  router.push("/ai/assistant");
};

const toggle = () => {
  visible.value = !visible.value;
  if (visible.value && messages.value.length === 0) {
    initConversation();
  }
};

const initConversation = async () => {
  try {
    const conv = await AiAssistantApi.createConversation({ title: "快捷对话" });
    conversationId.value = conv.id;
    messages.value = [];
  } catch (e) {
    ElMessage.error("初始化会话失败");
  }
};

const handleSend = async () => {
  if (!inputText.value.trim() || loading.value) return;

  const userText = inputText.value.trim();
  inputText.value = "";
  messages.value.push({ role: "user", content: userText });

  // 先插入一条空的 assistant 消息，流式填充
  const assistantIdx = messages.value.length;
  messages.value.push({ role: "assistant", content: "" });
  loading.value = true;

  await nextTick();
  scrollToBottom();

  let gotAnyText = false;

  try {
    await AiAssistantApi.chatStream(
      {
        message: userText,
        conversationId: conversationId.value || undefined,
      },
      {
        onEvent: (event) => {
          const { event: type, data } = event;
          if (type === "assistant.answer.delta" && data?.text) {
            messages.value[assistantIdx].content += data.text;
            gotAnyText = true;
            scrollToBottom();
          } else if (type === "assistant.answer" && data?.text) {
            // 完整回复（非增量模式兜底）
            if (!gotAnyText) {
              messages.value[assistantIdx].content = data.text;
              gotAnyText = true;
            }
          } else if (type === "run.completed" && data?.conversationId) {
            conversationId.value = data.conversationId;
          }
        },
        onError: (err) => {
          if (!gotAnyText) {
            messages.value[assistantIdx].content =
              "请求失败: " + (err?.message || "未知错误");
          }
        },
        onDone: () => {
          if (!gotAnyText) {
            messages.value[assistantIdx].content = "暂无回复";
          }
        },
      },
    );
  } catch (e: any) {
    if (!gotAnyText) {
      messages.value[assistantIdx].content =
        "请求失败: " + (e?.message || "未知错误");
    }
  } finally {
    loading.value = false;
    await nextTick();
    scrollToBottom();
  }
};

const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};

// 拖动逻辑
const handleMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.closest("button")) return;

  isDragging.value = true;
  dragStart.value = { x: e.clientX, y: e.clientY };
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  const dx = e.clientX - dragStart.value.x;
  const dy = e.clientY - dragStart.value.y;
  const panelWidth = 380;
  const panelHeight = 560;
  popperOffset.value = {
    x: clampOffset(popperOffset.value.x + dx, -window.innerWidth + panelWidth + 16, 16),
    y: clampOffset(popperOffset.value.y + dy, -window.innerHeight + panelHeight + 64, 16),
  };
  dragStart.value = { x: e.clientX, y: e.clientY };
};

const handleMouseUp = () => {
  isDragging.value = false;
};

onMounted(() => {
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
});

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleMouseUp);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="!isMobile" class="ai-assistant-root">
      <!-- 弹出层 -->
      <div
        v-if="visible"
        class="ai-assistant-popper"
        :class="{ dragging: isDragging }"
        :style="{
          transform: `translate(${popperOffset.x}px, ${popperOffset.y}px)`,
        }"
      >
        <!-- 头部 -->
        <div class="popper-header" @mousedown="handleMouseDown">
          <span class="header-title">智能助手</span>
          <div class="header-actions">
            <button class="icon-btn" @click="openFull" title="完整模式">
              <Icon icon="ep:full-screen" />
            </button>
            <button class="icon-btn" @click="visible = false" title="关闭">
              <Icon icon="ep:close" />
            </button>
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="popper-messages" ref="messageContainer">
          <div v-if="messages.length === 0" class="empty-state">
            <Icon icon="ep:chat-line-round" class="empty-icon" />
            <p>开始对话吧</p>
          </div>
          <div v-for="(msg, idx) in messages" :key="idx" class="message" :class="msg.role">
            <div class="bubble">{{ msg.content }}</div>
          </div>
          <div v-if="loading" class="message assistant">
            <div class="bubble thinking">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        </div>

        <!-- 输入框 -->
        <div class="popper-input">
          <textarea
            v-model="inputText"
            placeholder="输入消息，Enter 发送"
            @keydown="handleKeydown"
            rows="1"
          ></textarea>
          <button class="send-btn" :disabled="!inputText.trim() || loading" @click="handleSend">
            <Icon icon="ep:promotion" />
          </button>
        </div>
      </div>

      <!-- 悬浮按钮 -->
      <div class="floating-btn" @click="toggle" title="智能助手">
        <Icon icon="ep:chat-dot-round" class="btn-icon" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ai-assistant-root {
  position: fixed;
  right: 0;
  bottom: 0;
  z-index: 2147483647 !important;
}

/* 弹出层 */
.ai-assistant-popper {
  position: absolute;
  right: 0;
  bottom: 30px;
  display: flex;
  flex-direction: column;
  width: min(380px, calc(100vw - 32px));
  height: min(560px, calc(100vh - 72px));
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter, #e5e7eb);
  border-radius: 8px;
  background: var(--el-bg-color, #fff);
  box-shadow:
    0 18px 44px rgba(31, 35, 41, 0.16),
    0 2px 8px rgba(31, 35, 41, 0.06);
  transition:
    box-shadow 0.2s ease,
    opacity 0.2s ease;
  animation: aiAssistantSlideUp 0.16s ease;
}

@keyframes aiAssistantSlideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-assistant-popper.dragging {
  opacity: 0.96;
  box-shadow:
    0 24px 54px rgba(31, 35, 41, 0.2),
    0 4px 12px rgba(31, 35, 41, 0.08);
  transition: none;
  user-select: none;
}

/* 头部 */
.popper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 0 12px;
  border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0);
  background: linear-gradient(180deg, #fff 0%, #fafcff 100%);
  cursor: move;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2329);
}

.header-title::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary, #1677ff);
  box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.12);
}

.header-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--el-text-color-secondary, #8f959e);
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-text-color-primary, #1f2329);
}

/* 消息列表 */
.popper-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 14px 12px;
  background: #f7f9fc;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--el-text-color-secondary, #8f959e);
}

.empty-icon {
  width: 42px;
  height: 42px;
  padding: 10px;
  border-radius: 8px;
  background: #fff;
  color: var(--el-color-primary, #1677ff);
  box-shadow: 0 8px 20px rgba(31, 35, 41, 0.06);
}

.empty-state p {
  margin: 0;
  font-size: 13px;
}

.message {
  display: flex;
  width: 100%;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.bubble {
  max-width: 82%;
  padding: 8px 11px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.55;
  word-break: break-word;
  white-space: pre-wrap;
  box-shadow: 0 1px 2px rgba(31, 35, 41, 0.04);
}

.message.user .bubble {
  background: var(--el-color-primary, #1677ff);
  color: #fff;
  border-bottom-right-radius: 2px;
}

.message.assistant .bubble {
  border: 1px solid var(--el-border-color-lighter, #edf0f5);
  background: #fff;
  color: var(--el-text-color-primary, #1f2329);
  border-bottom-left-radius: 2px;
}

.bubble.thinking {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #8f959e;
  animation: pulse 1.2s infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}
.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%,
  80%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 输入框 */
.popper-input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px 12px;
  border-top: 1px solid var(--el-border-color-lighter, #f0f0f0);
  background: var(--el-bg-color, #fff);
}

.popper-input textarea {
  flex: 1;
  min-height: 34px;
  max-height: 76px;
  padding: 7px 10px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 6px;
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-primary, #1f2329);
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.popper-input textarea:focus {
  border-color: var(--el-color-primary, #1677ff);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.12);
}

.popper-input textarea::placeholder {
  color: #b0b0b0;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 6px;
  background: var(--el-color-primary, #1677ff);
  color: #fff;
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.send-btn:hover:not(:disabled) {
  background: var(--el-color-primary-dark-2, #0958d9);
  transform: translateY(-1px);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 悬浮按钮 */
.floating-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  overflow: hidden;
  background: var(--el-color-primary, #1677ff);
  color: #fff;
  cursor: pointer;
  box-shadow:
    -2px -2px 8px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.floating-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, transparent 100%);
  pointer-events: none;
}

.floating-btn:hover {
  background: var(--el-color-primary-dark-2, #0958d9);
  box-shadow:
    -3px -3px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.btn-icon {
  width: 12px;
  height: 12px;
}
</style>
