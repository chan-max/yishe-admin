<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: { label?: string; config?: any } }>()
</script>

<template>
  <div class="wf-node wf-node--http">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <span class="wf-node__icon">🌐</span>
      <span class="wf-node__title">{{ data.label || 'HTTP 请求' }}</span>
    </div>
    <div class="wf-node__details">
      <span class="wf-node__method">{{ data.config?.method || 'POST' }}</span>
      <span class="wf-node__url">{{ data.config?.url || '/api/v1/webhook' }}</span>
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--http {
  background: var(--app-content-surface-color);
  border: 1px solid color-mix(in srgb, #06b6d4 40%, var(--app-content-border-color));
  border-radius: 10px;
  padding: 10px 14px;
  min-width: 150px;
  box-shadow: 0 2px 10px color-mix(in srgb, #06b6d4 15%, transparent);
  transition: all 0.15s ease;
}
.wf-node--http:hover,
.wf-node--http.selected {
  border-color: #06b6d4;
  box-shadow: 0 0 0 3px color-mix(in srgb, #06b6d4 25%, transparent);
}
.wf-node__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.wf-node__icon { font-size: 15px; }
.wf-node__title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.wf-node__details {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}
.wf-node__method {
  font-weight: 700;
  color: #06b6d4;
  background: color-mix(in srgb, #06b6d4 12%, transparent);
  padding: 1px 4px;
  border-radius: 3px;
}
.wf-node__url {
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100px;
}
</style>
