<script setup lang="ts">
import NodeParameterSummary from "./NodeParameterSummary.vue";
import { Handle, Position } from "@vue-flow/core";
import { wecomIcon } from "@/assets/icons/apps";

const props = defineProps<{ data: { label?: string; config?: any } }>();
</script>

<template>
  <div class="wf-node wf-node--wecom">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <img :src="wecomIcon" class="wf-node__icon" />
      <span class="wf-node__title">{{ props.data.label || "企微推送" }}</span>
    </div>
    <div class="wf-node__badge">{{ props.data.config?.channelName || "未选择渠道" }}</div>
    <NodeParameterSummary :data="data" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--wecom {
  min-width: 120px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid color-mix(in srgb, #07c160 40%, var(--app-content-border-color));
  border-radius: 6px;
  transition: all 0.15s ease;
}
.wf-node--wecom:hover,
.wf-node--wecom.selected {
  border-color: #07c160;
  box-shadow: 0 0 0 2px color-mix(in srgb, #07c160 25%, transparent);
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
.wf-node__badge {
  display: inline-block;
  max-width: 100%;
  padding: 1px 5px;
  overflow: hidden;
  font-size: 10px;
  color: #07c160;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: color-mix(in srgb, #07c160 12%, transparent);
  border-radius: 3px;
}
</style>
