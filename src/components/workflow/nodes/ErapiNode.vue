<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { erapiIcon } from '@/assets/icons/utility'
const props = defineProps<{ data: { label?: string; config?: any } }>()
const keyword = computed(() => props.data.config?.base || props.data.config?.hex || '')
</script>
<template>
  <div class="wf-node wf-node--erapi">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header"><img :src="erapiIcon" class="wf-node__icon" /><span class="wf-node__title">{{ data.label || 'Erapi' }}</span></div>
    <div v-if="keyword" class="wf-node__subtitle">{{ keyword }}</div>
    <div class="wf-node__type">工具</div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>
<style scoped>
.wf-node--erapi { min-width: 120px; padding: 6px 10px; background: var(--app-content-surface-color); border: 1px solid var(--app-border-color); border-radius: 8px; font-size: 12px; }
.wf-node--erapi .wf-node__header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.wf-node--erapi .wf-node__icon { width: 16px; height: 16px; object-fit: contain; }
.wf-node--erapi .wf-node__title { font-weight: 600; color: var(--app-text-color); }
.wf-node--erapi .wf-node__subtitle { font-size: 11px; color: #0066CC; background: #E6F2FF; padding: 2px 6px; border-radius: 4px; margin: 4px 0; word-break: break-all; }
.wf-node--erapi .wf-node__type { font-size: 10px; color: var(--app-text-color-placeholder); }
</style>
