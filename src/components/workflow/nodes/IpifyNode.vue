<script setup lang="ts">
import NodeParameterSummary from "./NodeParameterSummary.vue";
import { Handle, Position } from "@vue-flow/core";
import { ipifyIcon } from "@/assets/icons/utility";
defineProps<{ data: { label?: string; config?: any } }>();
</script>
<template>
  <div class="wf-node wf-node--ipify">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <img :src="ipifyIcon" class="wf-node__icon" />
      <span class="wf-node__title">{{ data.label || "ipify 公网IP" }}</span>
    </div>
    <div class="wf-node__type">工具</div>
    <NodeParameterSummary :data="data" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>
<style scoped>
.wf-node--ipify {
  min-width: 120px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-border-color);
  border-radius: 8px;
  font-size: 12px;
}
.wf-node--ipify .wf-node__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.wf-node--ipify .wf-node__icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
.wf-node--ipify .wf-node__title {
  font-weight: 600;
  color: var(--app-text-color);
}
.wf-node--ipify .wf-node__type {
  font-size: 10px;
  color: var(--app-text-color-placeholder);
}
</style>
