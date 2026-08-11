<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { aiGenerateWorkflowApi } from '@/api/workflow'

const props = defineProps<{
  modelValue: boolean
  currentCanvas?: { nodes: any[]; edges: any[]; viewport?: any }
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'generated', data: { nodes: any[]; edges: any[]; description: string }): void
}>()

const inputRef = ref<HTMLTextAreaElement | null>(null)
const prompt = ref('')
const loading = ref(false)

watch(() => props.modelValue, (val) => {
  if (val) {
    nextTick(() => inputRef.value?.focus())
  } else {
    prompt.value = ''
    loading.value = false
  }
})

const handleGenerate = async () => {
  const desc = prompt.value.trim()
  if (!desc || loading.value) return
  loading.value = true
  try {
    const res: any = await aiGenerateWorkflowApi({
      description: desc,
      currentCanvas: props.currentCanvas,
    })
    if (res?.success && res?.nodes?.length) {
      emit('generated', {
        nodes: res.nodes,
        edges: res.edges || [],
        description: res.description || desc,
      })
      emit('update:modelValue', false)
    }
  } catch (err: any) {
    console.error('[AiGenerateDialog]', err)
  } finally {
    loading.value = false
  }
}

const handleClose = () => emit('update:modelValue', false)
</script>

<template>
  <transition name="ai-fade">
    <div v-if="modelValue" class="ai-overlay" @click.self="handleClose">
      <div class="ai-panel">
        <div class="ai-panel__header">
          <span class="ai-panel__title">AI 生成工作流</span>
          <button class="ai-panel__close" @click="handleClose">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="ai-panel__body">
          <textarea
            ref="inputRef"
            v-model="prompt"
            class="ai-panel__textarea"
            :placeholder="loading ? '正在生成...' : '描述你想要的工作流'"
            :disabled="loading"
            rows="3"
            @keydown.enter.exact.prevent="handleGenerate"
          />
        </div>

        <div class="ai-panel__footer">
          <button class="ai-panel__btn" @click="handleClose" :disabled="loading">取消</button>
          <button class="ai-panel__btn ai-panel__btn--primary" :loading="loading" :disabled="!prompt.trim()" @click="handleGenerate">
            {{ loading ? '生成中...' : '生成' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.ai-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2000;
}

.ai-panel {
  width: 380px;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
}

.ai-panel__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.ai-panel__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 3px;
}

.ai-panel__close:hover {
  background: var(--app-content-surface-muted-color);
  color: var(--el-text-color-primary);
}

.ai-panel__body {
  padding: 0 14px 10px;
}

.ai-panel__textarea {
  width: 100%;
  padding: 7px 9px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  outline: none;
  resize: none;
  font-family: inherit;
}

.ai-panel__textarea:focus {
  border-color: var(--el-text-color-placeholder);
  background: var(--app-content-surface-color);
}

.ai-panel__textarea:disabled {
  opacity: 0.5;
}

.ai-panel__footer {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 8px 14px 12px;
  border-top: 1px solid var(--app-content-border-color);
}

.ai-panel__btn {
  padding: 4px 14px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  transition: all 0.1s ease;
}

.ai-panel__btn:hover:not(:disabled) {
  color: var(--el-text-color-primary);
  border-color: var(--el-text-color-placeholder);
}

.ai-panel__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ai-panel__btn--primary {
  color: var(--app-content-surface-color);
  background: var(--el-text-color-primary);
  border-color: var(--el-text-color-primary);
}

.ai-panel__btn--primary:hover:not(:disabled) {
  color: var(--app-content-surface-color);
  background: var(--el-text-color-regular);
  border-color: var(--el-text-color-regular);
}

.ai-fade-enter-active,
.ai-fade-leave-active {
  transition: opacity 0.12s ease;
}

.ai-fade-enter-from,
.ai-fade-leave-to {
  opacity: 0;
}
</style>
