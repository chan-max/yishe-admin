<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: { label?: string; config?: any } }>()
</script>

<template>
  <div class="wf-node wf-node--ai">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <span class="wf-node__dot" style="background: #6366f1" />
      <span class="wf-node__title">{{ data.label || 'AI 调用' }}</span>
    </div>
    <div class="wf-node__ai-preview">
      <span v-if="data.config?.userPrompt">{{ data.config.userPrompt.slice(0, 30) }}...</span>
      <span v-else class="wf-node__ai-placeholder">点击配置提示词</span>
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--ai {
  position: relative;
  min-width: 140px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid color-mix(in srgb, #6366f1 40%, var(--app-content-border-color));
  border-radius: 6px;
  transition: all 0.15s ease;
}

.wf-node--ai:hover {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px color-mix(in srgb, #6366f1 20%, transparent);
}

.wf-node__header { display: flex; align-items: center; gap: 5px; margin-bottom: 4px; }

.wf-node__dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

.wf-node__title { font-size: 12px; font-weight: 600; color: var(--el-text-color-primary); }

.wf-node__ai-preview {
  font-size: 9px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.wf-node__ai-placeholder {
  font-style: italic;
  opacity: 0.6;
}
</style>
