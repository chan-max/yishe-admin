<script setup lang="ts">
import NodeParameterSummary from "./NodeParameterSummary.vue";
import { Handle, Position } from "@vue-flow/core";
import { javaScriptIcon } from "@/assets/icons/apps";

defineProps<{ data: { label?: string; config?: any } }>();
</script>

<template>
  <div class="wf-node wf-node--jscode">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <img :src="javaScriptIcon" class="wf-node__icon" />
      <span class="wf-node__title">{{ data.label || "执行 JS 代码" }}</span>
    </div>
    <div class="wf-node__code-preview">
      <code>{{ (data.config?.code || "").slice(0, 40) }}...</code>
    </div>
    <NodeParameterSummary :data="data" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--jscode {
  position: relative;
  min-width: 140px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid color-mix(in srgb, #10b981 40%, var(--app-content-border-color));
  border-radius: 6px;
  transition: all 0.15s ease;
}

.wf-node--jscode:hover {
  border-color: #10b981;
  box-shadow: 0 0 0 2px color-mix(in srgb, #10b981 20%, transparent);
}

.wf-node__header {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 4px;
}

.wf-node__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.wf-node__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.wf-node__code-preview {
  font-size: 9px;
  color: var(--el-text-color-placeholder);
  background: var(--el-bg-color-page);
  padding: 2px 4px;
  border-radius: 3px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
