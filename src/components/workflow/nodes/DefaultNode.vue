<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: { label?: string; config?: any; selected?: boolean } }>()
</script>

<template>
  <div class="wf-node wf-node--default">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__body">
      <div class="wf-node__icon">⚙</div>
      <div class="wf-node__label">{{ data.label || '节点' }}</div>
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--default {
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
  border-radius: 8px;
  padding: 10px 16px;
  min-width: 120px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.15s ease;
}
.wf-node--default:hover,
.wf-node--default.selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}
.wf-node__body { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.wf-node__icon { font-size: 18px; color: var(--el-color-primary); }
.wf-node__label { font-size: 13px; font-weight: 500; color: var(--el-text-color-primary); }
</style>
