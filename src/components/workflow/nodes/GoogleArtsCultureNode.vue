<script setup lang="ts">
import NodeParameterSummary from "./NodeParameterSummary.vue";
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { googleArtsCultureIcon } from "@/assets/icons/apps";

const props = defineProps<{ data: { label?: string; config?: any } }>();

const keyword = computed(() => props.data.config?.keyword || props.data.config?.query || "");
const maxCount = computed(() => props.data.config?.maxCount || props.data.config?.limit || 10);
</script>

<template>
  <div class="wf-node wf-node--google-arts">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <img :src="googleArtsCultureIcon" class="wf-node__icon" />
      <span class="wf-node__title">{{ data.label || "Google 艺术与文化" }}</span>
    </div>
    <div v-if="keyword" class="wf-node__subtitle">{{ keyword }}</div>
    <NodeParameterSummary :data="data" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--google-arts {
  min-width: 120px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid #4285f440;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(66, 133, 244, 0.1);
  transition: all 0.15s ease;
}

.wf-node--google-arts:hover {
  box-shadow: 0 2px 6px rgba(66, 133, 244, 0.2);
}

.wf-node__header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.wf-node__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.wf-node__title {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wf-node__subtitle {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wf-node__badge {
  display: inline-block;
  margin-top: 4px;
  padding: 1px 6px;
  font-size: 9px;
  font-weight: 500;
  color: #4285f4;
  background: rgba(66, 133, 244, 0.1);
  border-radius: 3px;
}
</style>
