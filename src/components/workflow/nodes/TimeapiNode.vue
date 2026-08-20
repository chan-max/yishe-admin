<script setup lang="ts">
import NodeParameterSummary from "./NodeParameterSummary.vue";
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { timeapiIcon } from "@/assets/icons/utility";
const props = defineProps<{ data: { label?: string; config?: any } }>();
const keyword = computed(
  () => props.data.config?.timezone || props.data.config?.zipCode || props.data.config?.ip || "",
);
</script>
<template>
  <div class="wf-node wf-node--timeapi">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <img :src="timeapiIcon" class="wf-node__icon" /><span class="wf-node__title">{{
        data.label || "Timeapi"
      }}</span>
    </div>
    <div v-if="keyword" class="wf-node__subtitle">{{ keyword }}</div>
    <div class="wf-node__type">工具</div>
    <NodeParameterSummary :data="data" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>
<style scoped>
.wf-node--timeapi {
  min-width: 120px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-border-color);
  border-radius: 8px;
  font-size: 12px;
}
.wf-node--timeapi .wf-node__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.wf-node--timeapi .wf-node__icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
.wf-node--timeapi .wf-node__title {
  font-weight: 600;
  color: var(--app-text-color);
}
.wf-node--timeapi .wf-node__subtitle {
  font-size: 11px;
  color: #0066cc;
  background: #e6f2ff;
  padding: 2px 6px;
  border-radius: 4px;
  margin: 4px 0;
  word-break: break-all;
}
.wf-node--timeapi .wf-node__type {
  font-size: 10px;
  color: var(--app-text-color-placeholder);
}
</style>
