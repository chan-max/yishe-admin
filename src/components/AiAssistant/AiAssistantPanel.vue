<template>
  <div class="ai-assistant-panel" :class="[`is-${mode}`]">
    <div class="ai-assistant-panel__header">
      <div class="ai-assistant-panel__header-main">
        <div class="ai-assistant-panel__eyebrow">AI 智能助手</div>
        <div class="ai-assistant-panel__title">系统查询助手</div>
        <div class="ai-assistant-panel__subtitle">
          先支持任务、客户端、服务状态、Temu 记录、素材和 PSD 模板查询。
        </div>
      </div>

      <div class="ai-assistant-panel__header-actions">
        <el-button text size="small" @click="refreshAll" :loading="loadingHistory || toolsLoading">
          刷新
        </el-button>
        <el-button text size="small" @click="clearChatHistory" :disabled="!messages.length">
          清空记录
        </el-button>
        <el-button v-if="mode === 'drawer'" text size="small" @click="$emit('open-page')">
          打开页面
        </el-button>
      </div>
    </div>

    <div class="ai-assistant-panel__layout">
      <aside class="ai-assistant-panel__sidebar">
        <div class="ai-assistant-card">
          <div class="ai-assistant-card__title">快捷提问</div>
          <div class="ai-assistant-card__chips">
            <button
              v-for="item in quickPrompts"
              :key="item"
              type="button"
              class="ai-assistant-chip"
              @click="applyPrompt(item)"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <div class="ai-assistant-card">
          <div class="ai-assistant-card__title">当前上下文</div>
          <div class="ai-assistant-card__context">
            <div class="ai-assistant-card__context-title">
              {{ currentRouteTitle }}
            </div>
            <div class="ai-assistant-card__context-path">{{ route.fullPath }}</div>
          </div>
        </div>

        <div class="ai-assistant-card">
          <div class="ai-assistant-card__title">当前能力</div>
          <div v-loading="toolsLoading" class="ai-assistant-card__tools">
            <div
              v-for="tool in tools"
              :key="tool.name"
              class="ai-assistant-tool"
            >
              <div class="ai-assistant-tool__title">{{ tool.label }}</div>
              <div class="ai-assistant-tool__key">{{ tool.name }}</div>
              <div class="ai-assistant-tool__desc">{{ tool.description }}</div>
            </div>
          </div>
        </div>
      </aside>

      <section class="ai-assistant-chat">
        <div ref="messageListRef" class="ai-assistant-chat__messages">
          <div v-if="loadingHistory && !messages.length" class="ai-assistant-chat__empty">
            正在加载聊天记录...
          </div>

          <div v-else-if="!messages.length" class="ai-assistant-chat__empty">
            <div class="ai-assistant-chat__empty-title">从一个查询开始</div>
            <div class="ai-assistant-chat__empty-desc">
              例如问我“我有哪些任务正在执行”或“图片处理服务可用吗”。
            </div>
          </div>

          <div
            v-for="message in messages"
            :key="message.id"
            class="ai-assistant-message"
            :class="[`is-${message.role}`]"
          >
            <div class="ai-assistant-message__meta">
              <span>{{ roleLabelMap[message.role] }}</span>
              <span>{{ formatTime(message.createdAt) }}</span>
              <span v-if="message.toolLabel">{{ message.toolLabel }}</span>
            </div>

            <div class="ai-assistant-message__bubble">
              <div class="ai-assistant-message__content">{{ message.content }}</div>

              <div v-if="message.role === 'tool'" class="ai-assistant-message__tool-actions">
                <el-button
                  text
                  size="small"
                  @click="toggleToolDetail(message.id)"
                >
                  {{ expandedToolIds.has(message.id) ? '收起详情' : '查看详情' }}
                </el-button>
              </div>

              <div
                v-if="message.role === 'tool' && expandedToolIds.has(message.id)"
                class="ai-assistant-message__tool-detail"
              >
                <div v-if="message.toolInput" class="ai-assistant-message__tool-block">
                  <div class="ai-assistant-message__tool-title">工具入参</div>
                  <pre>{{ formatJson(message.toolInput) }}</pre>
                </div>
                <div v-if="message.toolResult" class="ai-assistant-message__tool-block">
                  <div class="ai-assistant-message__tool-title">工具结果</div>
                  <pre>{{ formatJson(message.toolResult) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="ai-assistant-chat__composer">
          <el-input
            v-model="draft"
            type="textarea"
            resize="none"
            :autosize="{ minRows: 2, maxRows: 5 }"
            placeholder="输入一个查询，例如：我有哪些任务正在执行？"
            @keydown.enter.exact.prevent="handleSubmit"
          />

          <div class="ai-assistant-chat__composer-footer">
            <div class="ai-assistant-chat__composer-hint">
              当前会自动带入页面路由上下文，只保留最近几轮对话参与推理。
            </div>
            <el-button type="primary" :loading="sending" @click="handleSubmit">
              发送
            </el-button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useAiAssistantStore } from '@/store/modules/aiAssistant'

const props = withDefaults(
  defineProps<{
    mode?: 'page' | 'drawer'
  }>(),
  {
    mode: 'page'
  }
)

defineEmits<{
  (event: 'open-page'): void
}>()

const route = useRoute()
const aiAssistantStore = useAiAssistantStore()
const { messages, tools, sending, loadingHistory, toolsLoading } = storeToRefs(aiAssistantStore)

const draft = ref('')
const messageListRef = ref<HTMLDivElement>()
const expandedToolIds = ref(new Set<number>())

const roleLabelMap: Record<'user' | 'assistant' | 'tool', string> = {
  user: '你',
  assistant: '助手',
  tool: '查询工具'
}

const quickPrompts = [
  '我有哪些任务正在执行',
  '图片处理服务可用吗',
  '我现在有哪些在线客户端',
  '看看最近的 Temu 执行记录',
  '帮我找 4 张春季素材图',
  '找几个可用的 PSD 模板'
]

const currentRouteTitle = computed(() => {
  return String(route.meta?.title || route.name || route.path || '当前页面')
})

const buildPageContext = () => {
  return {
    routePath: route.path,
    fullPath: route.fullPath,
    routeName: route.name ? String(route.name) : '',
    routeTitle: currentRouteTitle.value,
    query: route.query,
    params: route.params
  }
}

const formatTime = (value: string) => dayjs(value).format('MM-DD HH:mm')
const formatJson = (value: unknown) => JSON.stringify(value ?? {}, null, 2)

const scrollToBottom = async () => {
  await nextTick()
  const container = messageListRef.value
  if (!container) {
    return
  }
  container.scrollTop = container.scrollHeight
}

const refreshAll = async () => {
  await Promise.all([aiAssistantStore.loadMessages(true), aiAssistantStore.loadTools(true)])
  await scrollToBottom()
}

const applyPrompt = (value: string) => {
  draft.value = value
}

const toggleToolDetail = (id: number) => {
  const nextSet = new Set(expandedToolIds.value)
  if (nextSet.has(id)) {
    nextSet.delete(id)
  } else {
    nextSet.add(id)
  }
  expandedToolIds.value = nextSet
}

const clearChatHistory = async () => {
  try {
    await ElMessageBox.confirm('确定清空当前聊天记录吗？', '提示', {
      type: 'warning'
    })
    await aiAssistantStore.clearMessages()
    expandedToolIds.value = new Set()
    ElMessage.success('聊天记录已清空')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空 AI 助手聊天记录失败:', error)
    }
  }
}

const handleSubmit = async () => {
  const message = draft.value.trim()
  if (!message) {
    ElMessage.warning('请输入查询内容')
    return
  }

  try {
    draft.value = ''
    await aiAssistantStore.sendMessage(message, buildPageContext())
    await scrollToBottom()
  } catch (error: any) {
    console.error('发送 AI 助手消息失败:', error)
    draft.value = message
    ElMessage.error(error?.message || '发送失败')
  }
}

onMounted(async () => {
  await Promise.all([aiAssistantStore.loadMessages(), aiAssistantStore.loadTools()])
  await scrollToBottom()
})

watch(
  () => messages.value.length,
  async () => {
    await scrollToBottom()
  }
)
</script>

<style lang="scss" scoped>
.ai-assistant-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: var(--el-text-color-primary);

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 18px 14px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  &__eyebrow {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--el-color-primary);
    text-transform: uppercase;
  }

  &__title {
    margin-top: 4px;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.2;
  }

  &__subtitle {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  &__layout {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    min-height: 0;
    flex: 1;
  }

  &__sidebar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-right: 1px solid var(--el-border-color-light);
    overflow: auto;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--el-fill-color-light) 78%, transparent 22%) 0%, transparent 100%);
  }
}

.ai-assistant-card {
  padding: 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  background: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-fill-color-light) 8%);

  &__title {
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 600;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__context-title {
    font-size: 13px;
    font-weight: 600;
  }

  &__context-path {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
    word-break: break-all;
  }

  &__tools {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 80px;
  }
}

.ai-assistant-tool {
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--el-fill-color-light);

  &__title {
    font-size: 13px;
    font-weight: 600;
  }

  &__key {
    margin-top: 4px;
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    word-break: break-all;
  }

  &__desc {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }
}

.ai-assistant-chip {
  padding: 8px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  background: transparent;
  font-size: 12px;
  line-height: 1.2;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary-light-9) 78%, transparent 22%);
  }
}

.ai-assistant-chat {
  display: flex;
  flex-direction: column;
  min-height: 0;

  &__messages {
    flex: 1;
    min-height: 0;
    padding: 18px;
    overflow: auto;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 220px;
    padding: 24px;
    text-align: center;
    color: var(--el-text-color-secondary);
  }

  &__empty-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__empty-desc {
    margin-top: 8px;
    font-size: 13px;
    line-height: 1.6;
  }

  &__composer {
    padding: 14px 18px 18px;
    border-top: 1px solid var(--el-border-color-light);
    background: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-fill-color-light) 8%);
  }

  &__composer-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 10px;
  }

  &__composer-hint {
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }
}

.ai-assistant-message {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;

  &.is-user {
    align-items: flex-end;
  }

  &__meta {
    display: flex;
    gap: 10px;
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }

  &__bubble {
    width: min(780px, 100%);
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
  }

  &.is-user &__bubble {
    background: color-mix(in srgb, var(--el-color-primary-light-9) 72%, var(--el-bg-color) 28%);
    border-color: color-mix(in srgb, var(--el-color-primary-light-5) 60%, var(--el-border-color-light) 40%);
  }

  &.is-tool &__bubble {
    background: color-mix(in srgb, var(--el-fill-color-light) 82%, var(--el-bg-color) 18%);
  }

  &__content {
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 13px;
    line-height: 1.7;
  }

  &__tool-actions {
    margin-top: 8px;
  }

  &__tool-detail {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed var(--el-border-color);
  }

  &__tool-block + &__tool-block {
    margin-top: 10px;
  }

  &__tool-title {
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
  }

  &__tool-detail pre {
    margin: 0;
    padding: 10px 12px;
    overflow: auto;
    border-radius: 10px;
    background: var(--el-fill-color-light);
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-regular);
  }
}

.is-drawer {
  height: 100%;
}

@media (max-width: 960px) {
  .ai-assistant-panel {
    &__layout {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr);
    }

    &__sidebar {
      max-height: 240px;
      border-right: 0;
      border-bottom: 1px solid var(--el-border-color-light);
    }

    &__header {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .ai-assistant-chat {
    &__composer-footer {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .ai-assistant-message {
    &__bubble {
      width: 100%;
    }
  }
}
</style>
