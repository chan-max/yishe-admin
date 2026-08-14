<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { wikimediaIcon } from '@/assets/icons/apps'

const props = defineProps<{ data: { label?: string; config?: any } }>()

const keyword = computed(() => props.data.config?.keyword || props.data.config?.query || '')
const maxCount = computed(() => props.data.config?.maxCount || props.data.config?.limit || 10)
const typeLabel = computed(() => (props.data.config?.type === 'image' || !props.data.config?.type ? '图片' : '图片'))
</script>

<template>
  <div class="wf-node wf-node--wikimedia">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <img :src="wikimediaIcon" class="wf-node__icon" />
      <span class="wf-node__title">{{ data.label || 'Wikimedia 采集' }}</span>
    </div>
    <div v-if="keyword" class="wf-node__subtitle">{{ keyword }}</div>
    <div v-if="maxCount" class="wf-node__badge">Limit: {{ maxCount }}</div>
    <div class="wf-node__type">{{ typeLabel }}</div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--wikimedia {
  min-width: 120px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid #93a7b140;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(147, 167, 177, 0.1);
  transition: all 0.15s ease;
}

.wf-node--wikimedia:hover {
  box-shadow: 0 2px 6px rgba(147, 167, 177, 0.2);
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
  color: #5f7d8c;
  background: rgba(147, 167, 177, 0.15);
  border-radius: 3px;
}

.wf-node__type {
  margin-top: 2px;
  font-size: 9px;
  color: var(--el-text-color-placeholder);
}
</style>