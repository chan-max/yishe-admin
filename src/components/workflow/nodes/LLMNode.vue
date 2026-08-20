<script setup lang="ts">
import NodeParameterSummary from "./NodeParameterSummary.vue";
import { Handle, Position } from "@vue-flow/core";

defineProps<{ data: { label?: string; config?: any } }>();
</script>

<template>
  <div class="wf-node wf-node--llm">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <span class="wf-node__dot" />
      <span class="wf-node__title">{{ data.label || "AI 大模型" }}</span>
    </div>
    <div class="wf-node__badge">{{ data.config?.model || "DeepSeek-R1" }}</div>
    <NodeParameterSummary :data="data" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--llm {
  min-width: 120px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid color-mix(in srgb, #8b5cf6 40%, var(--app-content-border-color));
  border-radius: 6px;
  box-shadow: 0 1px 4px color-mix(in srgb, #8b5cf6 10%, transparent);
  transition: all 0.15s ease;
}

.wf-node--llm:hover,
.wf-node--llm.selected {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 2px color-mix(in srgb, #8b5cf6 25%, transparent);
}

.wf-node__header {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 4px;
}

.wf-node__dot {
  width: 6px;
  height: 6px;
  background: #8b5cf6;
  border-radius: 50%;
  flex-shrink: 0;
}

.wf-node__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.wf-node__badge {
  display: inline-block;
  padding: 1px 5px;
  font-size: 10px;
  color: #8b5cf6;
  background: color-mix(in srgb, #8b5cf6 12%, transparent);
  border-radius: 3px;
}
</style>
