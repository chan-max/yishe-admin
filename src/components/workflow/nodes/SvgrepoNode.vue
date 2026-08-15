<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { svgrepoIcon } from '@/assets/icons/apps'

const props = defineProps<{ data: { label?: string; config?: any } }>()

const keyword = computed(() => props.data.config?.keyword || props.data.config?.query || '')
const maxCount = computed(() => props.data.config?.maxCount || props.data.config?.limit || 12)
const style = computed(() => props.data.config?.style || 'all')
</script>

<template>
  <div class="wf-node wf-node--svgrepo">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <img :src="svgrepoIcon" class="wf-node__icon" />
      <span class="wf-node__title">{{ data.label || 'SVGRepo 采集' }}</span>
    </div>
    <div v-if="keyword" class="wf-node__subtitle">{{ keyword }}</div>
    <div v-if="maxCount" class="wf-node__badge">数量: {{ maxCount }}</div>
    <div v-if="style && style !== 'all'" class="wf-node__tag">{{ style }}</div>
    <div class="wf-node__type">50万+开源矢量图库</div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--svgrepo {
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
    flex-shrink: 0;
    object-fit: contain;
  }

  .wf-node__title {
    font-weight: 500;
    color: var(--app-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .wf-node__subtitle {
    font-size: 10px;
    color: var(--app-text-secondary);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .wf-node__badge {
    display: inline-block;
    font-size: 10px;
    color: var(--app-text-secondary);
    background: var(--app-fill-color-light);
    border-radius: 4px;
    padding: 1px 4px;
    margin-top: 2px;
  }

  .wf-node__tag {
    display: inline-block;
    font-size: 10px;
    color: #EB3654;
    background: rgba(235, 54, 84, 0.1);
    border-radius: 4px;
    padding: 1px 4px;
    margin-top: 2px;
    margin-left: 4px;
  }

  .wf-node__type {
    font-size: 10px;
    color: var(--app-text-muted, #909399);
    margin-top: 2px;
  }
}
</style>
