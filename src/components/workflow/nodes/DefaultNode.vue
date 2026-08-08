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
  border: 1.5px solid var(--app-content-border-color);
  border-radius: 10px;
  padding: 12px 18px;
  min-width: 130px;
  text-align: center;
  box-shadow: var(--app-content-shadow);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.wf-node--default:hover,
.wf-node--default.selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 25%, transparent);
}
.wf-node__body { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.wf-node__icon { font-size: 18px; color: var(--el-color-primary); }
.wf-node__label { font-size: 13px; font-weight: 500; color: var(--el-text-color-primary); }
</style>
