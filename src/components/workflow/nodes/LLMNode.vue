<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: { label?: string; config?: any } }>()
</script>

<template>
  <div class="wf-node wf-node--llm">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <span class="wf-node__icon">✨</span>
      <span class="wf-node__title">{{ data.label || 'AI 大模型' }}</span>
    </div>
    <div class="wf-node__content">
      <span class="wf-node__model">{{ data.config?.model || 'DeepSeek-R1' }}</span>
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--llm {
  background: var(--app-content-surface-color);
  border: 1px solid color-mix(in srgb, #8b5cf6 40%, var(--app-content-border-color));
  border-radius: 10px;
  padding: 10px 14px;
  min-width: 140px;
  box-shadow: 0 2px 10px color-mix(in srgb, #8b5cf6 15%, transparent);
  transition: all 0.15s ease;
}
.wf-node--llm:hover,
.wf-node--llm.selected {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px color-mix(in srgb, #8b5cf6 25%, transparent);
}
.wf-node__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.wf-node__icon { font-size: 15px; }
.wf-node__title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.wf-node__content {
  font-size: 11px;
  color: #8b5cf6;
  background: color-mix(in srgb, #8b5cf6 12%, transparent);
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}
</style>
