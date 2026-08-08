<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: { label?: string; config?: any } }>()
</script>

<template>
  <div class="wf-node wf-node--code">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <span class="wf-node__icon">💻</span>
      <span class="wf-node__title">{{ data.label || '代码脚本' }}</span>
    </div>
    <div class="wf-node__lang">
      <code>{{ data.config?.language || 'JavaScript' }}</code>
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--code {
  background: var(--app-content-surface-color);
  border: 1px solid color-mix(in srgb, #f97316 40%, var(--app-content-border-color));
  border-radius: 10px;
  padding: 10px 14px;
  min-width: 130px;
  box-shadow: 0 2px 10px color-mix(in srgb, #f97316 15%, transparent);
  transition: all 0.15s ease;
}
.wf-node--code:hover,
.wf-node--code.selected {
  border-color: #f97316;
  box-shadow: 0 0 0 3px color-mix(in srgb, #f97316 25%, transparent);
}
.wf-node__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.wf-node__icon { font-size: 15px; }
.wf-node__title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.wf-node__lang {
  font-size: 11px;
  color: #f97316;
}
</style>
