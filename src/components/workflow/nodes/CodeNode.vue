<script setup lang="ts">
import NodeParameterSummary from "./NodeParameterSummary.vue";
import { Handle, Position } from "@vue-flow/core";

defineProps<{ data: { label?: string; config?: any } }>();
</script>

<template>
  <div class="wf-node wf-node--code">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <span class="wf-node__dot" />
      <span class="wf-node__title">{{ data.label || "代码脚本" }}</span>
    </div>
    <NodeParameterSummary :data="data" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--code {
  min-width: 110px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid color-mix(in srgb, #f97316 40%, var(--app-content-border-color));
  border-radius: 6px;
  box-shadow: 0 1px 4px color-mix(in srgb, #f97316 10%, transparent);
  transition: all 0.15s ease;
}

.wf-node--code:hover,
.wf-node--code.selected {
  border-color: #f97316;
  box-shadow: 0 0 0 2px color-mix(in srgb, #f97316 25%, transparent);
}

.wf-node__header {
  display: flex;
  align-items: center;
  gap: 5px;
}

.wf-node__dot {
  width: 6px;
  height: 6px;
  background: #f97316;
  border-radius: 50%;
  flex-shrink: 0;
}

.wf-node__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
