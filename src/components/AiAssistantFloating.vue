<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@/components/Icon";
import { useAiAssistantStore } from "@/store/modules/aiAssistant";
import type { InteractionSubmitResult } from "./AiAssistant/interactions/types";
import AssistantChat from "./AiAssistant/AssistantChat.vue";

defineOptions({ name: "AiAssistantFloating" });

const router = useRouter();
const store = useAiAssistantStore();

const isMobile = computed(() => window.innerWidth < 768);
const visible = ref(false);
const assistantChatRef = ref<InstanceType<typeof AssistantChat> | null>(null);

// 拖动状态
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const popperOffset = ref({ x: 0, y: 0 });

const clampOffset = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const promptItems = [
  { key: "page", label: "分析当前页面" },
  { key: "help", label: "你能做什么" },
];

const openFull = () => {
  visible.value = false;
  router.push("/ai/assistant");
};

const toggle = () => {
  visible.value = !visible.value;
};

function handleSendMessage(message: string) {
  store.sendMessage(message);
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
    result.reason || "用户取消",
  );
}

function handlePromptClick(key: string) {
  const textMap: Record<string, string> = {
    page: "请结合当前页面上下文，帮我分析我下一步可以做什么。",
    help: "你能帮我做什么？列出你所有的能力。",
  };
  const text = textMap[key] || key;
  if (text) store.sendMessage(text);
}

// ========== 拖动逻辑 ==========

const handleMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.closest("button") || target.closest("textarea") || target.closest(".interaction-wrapper")) return;
  isDragging.value = true;
  dragStart.value = { x: e.clientX, y: e.clientY };
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  const dx = e.clientX - dragStart.value.x;
  const dy = e.clientY - dragStart.value.y;
  const panelWidth = 400;
  const panelHeight = 600;
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
  store.initialize();
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
        :style="{ transform: `translate(${popperOffset.x}px, ${popperOffset.y}px)` }"
      >
        <!-- 头部（拖动区域） -->
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

        <!-- 复用 AssistantChat 组件 -->
        <AssistantChat
          ref="assistantChatRef"
          :messages="store.messages"
          :loading="store.loading"
          :pending-interaction="store.pendingInteraction"
          input-placeholder="输入消息，Enter 发送"
          input-hint="Enter 发送，Shift+Enter 换行"
          :can-send="store.canSend"
          :prompt-items="promptItems"
          :has-pending-assistant-message="store.hasPendingAssistantMessage"
          compact
          @send="handleSendMessage"
          @interaction-submit="handleInteractionSubmit"
          @interaction-reject="handleInteractionReject"
          @prompt-click="handlePromptClick"
        />
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

.ai-assistant-popper {
  position: absolute;
  right: 0;
  bottom: 30px;
  display: flex;
  flex-direction: column;
  width: min(400px, calc(100vw - 32px));
  height: min(600px, calc(100vh - 72px));
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
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.ai-assistant-popper.dragging {
  opacity: 0.96;
  box-shadow:
    0 24px 54px rgba(31, 35, 41, 0.2),
    0 4px 12px rgba(31, 35, 41, 0.08);
  transition: none;
  user-select: none;
}

.popper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 0 12px;
  border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0);
  background: linear-gradient(180deg, #fff 0%, #fafcff 100%);
  cursor: move;
  flex-shrink: 0;
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
