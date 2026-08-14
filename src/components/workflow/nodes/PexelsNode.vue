<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { pexelsIcon } from '@/assets/icons/apps'

const props = defineProps<{ data: { label?: string; config?: any } }>()

const keyword = computed(() => props.data.config?.keyword || props.data.config?.query || '')
const maxCount = computed(() => props.data.config?.maxCount || props.data.config?.limit || 10)
</script>

<template>
  <div class="wf-node wf-node--pexels">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <img :src="pexelsIcon" class="wf-node__icon" />
      <span class="wf-node__title">{{ data.label || 'Pexels 采集' }}</span>
    </div>
    <div v-if="keyword" class="wf-node__subtitle">{{ keyword }}</div>
    <div v-if="maxCount" class="wf-node__badge">Limit: {{ maxCount }}</div>
    <div class="wf-node__type">摄影图片</div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--pexels {
  min-width: 120px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid #05a08140;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(5, 160, 129, 0.1);
  transition: all 0.15s ease;
}

.wf-node--pexels:hover {
  box-shadow: 0 2px 6px rgba(5, 160, 129, 0.2);
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
  color: var(--el-text-color-regular);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wf-node__badge {
  font-size: 9px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 1px 4px;
  border-radius: 3px;
  margin-top: 3px;
  display: inline-block;
}

.wf-node__type {
  font-size: 9px;
  color: #05a081;
  font-weight: 500;
  margin-top: 2px;
}
</style>
