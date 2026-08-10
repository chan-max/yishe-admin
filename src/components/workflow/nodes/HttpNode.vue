<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: { label?: string; config?: any } }>()
</script>

<template>
  <div class="wf-node wf-node--http">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <span class="wf-node__dot" />
      <span class="wf-node__title">{{ data.label || 'HTTP 请求' }}</span>
      <span class="wf-node__method">{{ data.config?.method || 'POST' }}</span>
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--http {
  min-width: 120px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid color-mix(in srgb, #06b6d4 40%, var(--app-content-border-color));
  border-radius: 6px;
  box-shadow: 0 1px 4px color-mix(in srgb, #06b6d4 10%, transparent);
  transition: all 0.15s ease;
}

.wf-node--http:hover,
.wf-node--http.selected {
  border-color: #06b6d4;
  box-shadow: 0 0 0 2px color-mix(in srgb, #06b6d4 25%, transparent);
}

.wf-node__header { display: flex; align-items: center; gap: 5px; }

.wf-node__dot { width: 6px; height: 6px; background: #06b6d4; border-radius: 50%; flex-shrink: 0; }

.wf-node__title { font-size: 12px; font-weight: 600; color: var(--el-text-color-primary); }

.wf-node__method {
  padding: 1px 4px; margin-left: auto;
  font-size: 10px; font-weight: 700; color: #06b6d4;
  background: color-mix(in srgb, #06b6d4 12%, transparent); border-radius: 3px;
}
</style>
