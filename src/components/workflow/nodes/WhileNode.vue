<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: { label?: string; config?: any } }>()
</script>

<template>
  <div class="wf-node wf-node--while">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <span class="wf-node__dot" style="background: #ec4899" />
      <span class="wf-node__title">{{ data.label || 'While 循环' }}</span>
    </div>
    <div class="wf-node__handles">
      <div class="wf-handle-label wf-handle-label--loop">
        <span>循环体</span>
        <Handle id="body" type="source" :position="Position.Bottom" class="wf-node__handle-dot" style="background: #ec4899" />
      </div>
      <div class="wf-handle-label wf-handle-label--done">
        <span>完成</span>
        <Handle id="done" type="source" :position="Position.Bottom" class="wf-node__handle-dot" style="background: #64748b" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.wf-node--while {
  position: relative;
  min-width: 120px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid color-mix(in srgb, #ec4899 40%, var(--app-content-border-color));
  border-radius: 6px;
  transition: all 0.15s ease;
}

.wf-node--while:hover {
  border-color: #ec4899;
  box-shadow: 0 0 0 2px color-mix(in srgb, #ec4899 20%, transparent);
}

.wf-node__header { display: flex; align-items: center; gap: 5px; margin-bottom: 4px; }

.wf-node__dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

.wf-node__title { font-size: 12px; font-weight: 600; color: var(--el-text-color-primary); }

.wf-node__handles {
  display: flex;
  padding-top: 4px;
  font-size: 10px;
  font-weight: 600;
  border-top: 1px dashed var(--app-content-border-color);
  justify-content: space-between;
}

.wf-handle-label {
  position: relative;
  display: flex;
  align-items: center;
  gap: 3px;
}

.wf-handle-label--loop { color: #ec4899; }

.wf-handle-label--done { color: #64748b; }

.wf-node__handle-dot {
  width: 8px !important;
  height: 8px !important;
  min-width: 8px !important;
  min-height: 8px !important;
}
</style>
