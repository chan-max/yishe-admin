<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: { label?: string; config?: any } }>()
</script>

<template>
  <div class="wf-node wf-node--condition">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <span class="wf-node__dot" />
      <span class="wf-node__title">{{ data.label || '条件判断' }}</span>
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
  position: relative;
  min-width: 120px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid color-mix(in srgb, #f59e0b 40%, var(--app-content-border-color));
  border-radius: 6px;
  box-shadow: 0 1px 4px color-mix(in srgb, #f59e0b 10%, transparent);
  transition: all 0.15s ease;
}

.wf-node--condition:hover,
.wf-node--condition.selected {
  border-color: #f59e0b;
  box-shadow: 0 0 0 2px color-mix(in srgb, #f59e0b 25%, transparent);
}

.wf-node__header { display: flex; align-items: center; gap: 5px; margin-bottom: 4px; }

.wf-node__dot { width: 6px; height: 6px; background: #f59e0b; border-radius: 50%; flex-shrink: 0; }

.wf-node__title { font-size: 12px; font-weight: 600; color: var(--el-text-color-primary); }

.wf-node__handles {
  display: flex; padding-top: 4px;
  font-size: 10px; font-weight: 600;
  border-top: 1px dashed var(--app-content-border-color); justify-content: space-between;
}

.wf-handle-label--true { position: relative; color: #22c55e; }

.wf-handle-label--false { position: relative; color: #ef4444; }

.handle--true { left: 50% !important; background: #22c55e !important; }

.handle--false { left: 50% !important; background: #ef4444 !important; }
</style>
