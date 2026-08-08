<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: { label?: string; config?: any } }>()
</script>

<template>
  <div class="wf-node wf-node--condition">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <span class="wf-node__icon">🔀</span>
      <span class="wf-node__title">{{ data.label || '条件判断' }}</span>
    </div>
    <div class="wf-node__condition">
      {{ data.config?.expression || '如果满足条件' }}
    </div>
    <div class="wf-node__handles">
      <div class="wf-handle-label wf-handle-label--true">
        <span>True</span>
        <Handle id="true" type="source" :position="Position.Bottom" class="handle--true" />
      </div>
      <div class="wf-handle-label wf-handle-label--false">
        <span>False</span>
        <Handle id="false" type="source" :position="Position.Bottom" class="handle--false" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.wf-node--condition {
  background: var(--app-content-surface-color);
  border: 1px solid color-mix(in srgb, #f59e0b 40%, var(--app-content-border-color));
  border-radius: 10px;
  padding: 10px 14px;
  min-width: 150px;
  box-shadow: 0 2px 10px color-mix(in srgb, #f59e0b 15%, transparent);
  transition: all 0.15s ease;
  position: relative;
}
.wf-node--condition:hover,
.wf-node--condition.selected {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px color-mix(in srgb, #f59e0b 25%, transparent);
}
.wf-node__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.wf-node__icon { font-size: 15px; }
.wf-node__title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.wf-node__condition {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}
.wf-node__handles {
  display: flex;
  justify-content: space-between;
  padding-top: 4px;
  border-top: 1px dashed var(--app-content-border-color);
  font-size: 10px;
  font-weight: 600;
}
.wf-handle-label--true { color: #22c55e; position: relative; }
.wf-handle-label--false { color: #ef4444; position: relative; }
.handle--true { left: 50% !important; background: #22c55e !important; }
.handle--false { left: 50% !important; background: #ef4444 !important; }
</style>
