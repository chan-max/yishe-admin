<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
import NodeParameterSummary from "./NodeParameterSummary.vue";

defineProps<{ data: { label?: string; config?: any; selected?: boolean } }>();
</script>

<template>
  <div class="wf-node wf-node--default">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__label">{{ data.label || "节点" }}</div>
    <NodeParameterSummary :data="data" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--default {
  min-width: 100px;
  padding: 6px 12px;
  text-align: center;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
  border-radius: 6px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 4%);
  transition: all 0.15s ease;
}

.wf-node--default:hover,
.wf-node--default.selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}

.wf-node__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}
</style>
