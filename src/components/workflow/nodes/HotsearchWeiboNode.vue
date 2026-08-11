<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { weiboIcon } from '@/assets/icons/apps'

const props = defineProps<{ data: { label?: string; config?: any } }>()
</script>

<template>
  <div class="wf-node wf-node--hotsearch-weibo">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <img :src="weiboIcon" class="wf-node__icon" />
      <span class="wf-node__title">{{ data.label || '微博热搜采集' }}</span>
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--hotsearch-weibo {
  min-width: 120px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid color-mix(in srgb, #e6162d 40%, var(--app-content-border-color));
  border-radius: 6px;
  box-shadow: 0 1px 4px color-mix(in srgb, #e6162d 10%, transparent);
  transition: all 0.15s ease;
}

.wf-node--hotsearch-weibo:hover,
.wf-node--hotsearch-weibo.selected {
  border-color: #e6162d;
  box-shadow: 0 0 0 2px color-mix(in srgb, #e6162d 25%, transparent);
}

.wf-node__header {
  display: flex;
  align-items: center;
  gap: 5px;
}

.wf-node__icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.wf-node__title { font-size: 12px; font-weight: 600; color: var(--el-text-color-primary); }
</style>
