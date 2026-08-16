<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { govcnIcon } from '@/assets/icons/news'

const props = defineProps<{ data: { label?: string; config?: any } }>()
const keyword = computed(() => props.data.config?.keyword || props.data.config?.query || props.data.config?.category || props.data.config?.type || '')
</script>

<template>
  <div class="wf-node wf-node--govcn">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <img :src="govcnIcon" class="wf-node__icon" />
      <span class="wf-node__title">{{ data.label || '中国政府网' }}</span>
    </div>
    <div v-if="keyword" class="wf-node__subtitle">{{ keyword }}</div>
    <div class="wf-node__type">新闻数据</div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--govcn {
  min-width: 120px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-border-color);
  border-radius: 8px;
  font-size: 12px;
}
.wf-node--govcn .wf-node__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.wf-node--govcn .wf-node__icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
.wf-node--govcn .wf-node__title {
  font-weight: 600;
  color: var(--app-text-color);
}
.wf-node--govcn .wf-node__subtitle {
  font-size: 11px;
  color: #DE2910;
  background: #FDE9E7;
  padding: 2px 6px;
  border-radius: 4px;
  margin: 4px 0;
  word-break: break-all;
}
.wf-node--govcn .wf-node__type {
  font-size: 10px;
  color: var(--app-text-color-placeholder);
}
</style>
