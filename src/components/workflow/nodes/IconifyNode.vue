<script setup lang="ts">
import NodeParameterSummary from "./NodeParameterSummary.vue";
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { iconifyIcon } from "@/assets/icons/apps";

const props = defineProps<{ data: { label?: string; config?: any } }>();

const keyword = computed(() => props.data.config?.keyword || props.data.config?.query || "");
const maxCount = computed(() => props.data.config?.maxCount || props.data.config?.limit || 10);
const prefix = computed(() => props.data.config?.prefix || "");
const color = computed(() => props.data.config?.color || "#000000");
</script>

<template>
  <div class="wf-node wf-node--iconify">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <img :src="iconifyIcon" class="wf-node__icon" />
      <span class="wf-node__title">{{ data.label || "Iconify 采集" }}</span>
    </div>
    <div v-if="keyword" class="wf-node__subtitle">{{ keyword }}</div>
    <div v-if="color" class="wf-node__color-dot" :style="{ backgroundColor: color }" />
    <div class="wf-node__type">200,000+ 开源图标聚合</div>
    <NodeParameterSummary :data="data" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--iconify {
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
    color: #6c63ff;
    background: #ede9fe;
    padding: 2px 6px;
    border-radius: 4px;
    margin: 4px 0;
    word-break: break-all;
  }

  .wf-node__badge {
    font-size: 10px;
    color: var(--app-text-color-secondary);
    background: var(--app-fill-color);
    padding: 1px 4px;
    border-radius: 3px;
    display: inline-block;
    margin-bottom: 2px;
  }

  .wf-node__color-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-left: 4px;
    border: 1px solid var(--app-border-color);
    vertical-align: middle;
  }

  .wf-node__type {
    font-size: 10px;
    color: var(--app-text-color-placeholder);
  }
}
</style>
