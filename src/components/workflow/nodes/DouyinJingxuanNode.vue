<script setup lang="ts">
import NodeParameterSummary from "./NodeParameterSummary.vue";
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { douyinJingxuanIcon } from "@/assets/icons/apps";

const props = defineProps<{ data: { label?: string; config?: any } }>();

const category = computed(() => props.data.config?.category || "全部");
const maxCount = computed(() => props.data.config?.maxCount || props.data.config?.limit || 20);
</script>

<template>
  <div class="wf-node wf-node--douyin-jingxuan">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <img :src="douyinJingxuanIcon" class="wf-node__icon" />
      <span class="wf-node__title">{{ data.label || "抖音精选采集" }}</span>
    </div>
    <div v-if="category !== '全部'" class="wf-node__subtitle">{{ category }}</div>
    <div class="wf-node__type">浏览器自动化</div>
    <NodeParameterSummary :data="data" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--douyin-jingxuan {
  min-width: 120px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-border-color);
  border-radius: 8px;
  font-size: 12px;

  .wf-node__header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }

  .wf-node__icon {
    width: 16px;
    height: 16px;
    object-fit: contain;
  }

  .wf-node__title {
    font-weight: 600;
    color: var(--app-text-color);
  }

  .wf-node__subtitle {
    font-size: 11px;
    color: var(--el-color-warning);
    background: var(--el-color-warning-light-9);
    padding: 2px 6px;
    border-radius: 4px;
    margin: 4px 0;
    word-break: break-all;
  }

  .wf-node__type {
    font-size: 10px;
    color: var(--app-text-muted);
    margin-top: 2px;
  }
}
</style>
