<script setup lang="ts">
import NodeParameterSummary from "./NodeParameterSummary.vue";
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { feishuIcon, wecomIcon } from "@/assets/icons/apps";

const props = defineProps<{ data: { label?: string; config?: any } }>();

// 根据渠道名称检测平台类型
const platformIcon = computed(() => {
  const name = props.data.config?.channelName || "";
  return name.includes("飞书") ? feishuIcon : wecomIcon;
});
</script>

<template>
  <div class="wf-node wf-node--message-push">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <img :src="platformIcon" class="wf-node__platform-icon" />
      <span class="wf-node__title">{{ data.label || "消息推送" }}</span>
    </div>
    <div class="wf-node__badge">{{ data.config?.channelName || "未选择渠道" }}</div>
    <NodeParameterSummary :data="data" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--message-push {
  min-width: 120px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid color-mix(in srgb, #0ea5e9 40%, var(--app-content-border-color));
  border-radius: 6px;
  box-shadow: 0 1px 4px color-mix(in srgb, #0ea5e9 10%, transparent);
  transition: all 0.15s ease;
}

.wf-node--message-push:hover,
.wf-node--message-push.selected {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 2px color-mix(in srgb, #0ea5e9 25%, transparent);
}

.wf-node__header {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 4px;
}

.wf-node__platform-icon {
  width: 28px;
  height: 28px;
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
  color: #0ea5e9;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: color-mix(in srgb, #0ea5e9 12%, transparent);
  border-radius: 3px;
}
</style>
