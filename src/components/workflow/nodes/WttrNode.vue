<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { wttrIcon } from '@/assets/icons/utility'
const props = defineProps<{ data: { label?: string; config?: any } }>()
const city = computed(() => props.data.config?.city || 'Beijing')
</script>
<template>
  <div class="wf-node wf-node--wttr">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <img :src="wttrIcon" class="wf-node__icon" />
      <span class="wf-node__title">{{ data.label || 'wttr.in 天气' }}</span>
    </div>
    <div v-if="city" class="wf-node__subtitle">{{ city }}</div>
    <div class="wf-node__type">工具</div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>
<style scoped>
.wf-node--wttr {
  min-width: 120px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-border-color);
  border-radius: 8px;
  font-size: 12px;
}
.wf-node--wttr .wf-node__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.wf-node--wttr .wf-node__icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
.wf-node--wttr .wf-node__title {
  font-weight: 600;
  color: var(--app-text-color);
}
.wf-node--wttr .wf-node__subtitle {
  font-size: 11px;
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 4px;
  margin: 4px 0;
  word-break: break-all;
}
.wf-node--wttr .wf-node__type {
  font-size: 10px;
  color: var(--app-text-color-placeholder);
}
</style>
