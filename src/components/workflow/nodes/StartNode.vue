<script setup lang="ts">
import NodeParameterSummary from "./NodeParameterSummary.vue";
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";

const props = defineProps<{ data: { label?: string; config?: any } }>();

const triggerLabel = computed(() => {
  const triggerType = props.data.config?.triggerType;
  if (triggerType === "cron") return "定时";
  if (triggerType === "webhook") return "Webhook";
  return "手动";
});

const paramCount = computed(() => {
  const params = props.data.config?.inputParams;
  return Array.isArray(params) ? params.length : 0;
});
</script>

<template>
  <div class="wf-node wf-node--start">
    <div class="wf-start-title">{{ data.label || "开始" }}</div>
    <div class="wf-start-badge">
      <span>{{ triggerLabel }}</span>
      <span v-if="paramCount > 0" class="wf-param-tag">{{ paramCount }}个变量</span>
    </div>
    <NodeParameterSummary :data="data" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--start {
  display: flex;
  min-width: 100px;
  padding: 6px 12px;
  font-size: 12px;
  color: #fff;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgb(16 185 129 / 25%);
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.wf-start-title {
  font-weight: 600;
}

.wf-start-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  opacity: 0.9;
}

.wf-param-tag {
  padding: 0 4px;
  background: rgb(255 255 255 / 25%);
  border-radius: 3px;
}
</style>
