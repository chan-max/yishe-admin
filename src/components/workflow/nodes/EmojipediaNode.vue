<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { emojipediaIcon } from '@/assets/icons/apps'
const props = defineProps<{ data: { label?: string; config?: any } }>()
const keyword = computed(() => props.data.config?.keyword || props.data.config?.query || '')
const maxCount = computed(() => props.data.config?.maxCount || props.data.config?.limit || 10)
const category = computed(() => props.data.config?.category || 'stickers')
</script>
<template>
  <div class="wf-node wf-node--emojipedia">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header"><img :src="emojipediaIcon" class="wf-node__icon" /><span class="wf-node__title">{{ data.label || 'Emojipedia 采集' }}</span></div>
    <div v-if="keyword" class="wf-node__subtitle">{{ keyword }}</div>
    <div v-if="maxCount" class="wf-node__badge">Limit: {{ maxCount }} ({{ category }})</div>
    <div class="wf-node__type">Emoji/Sticker 百科</div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>
<style scoped>
.wf-node--emojipedia { min-width: 120px; padding: 6px 10px; background: var(--app-content-surface-color); border: 1px solid var(--app-border-color); border-radius: 8px; font-size: 12px; }
.wf-node--emojipedia .wf-node__header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.wf-node--emojipedia .wf-node__icon { width: 16px; height: 16px; object-fit: contain; }
.wf-node--emojipedia .wf-node__title { font-weight: 600; color: var(--app-text-color); }
.wf-node--emojipedia .wf-node__subtitle { font-size: 11px; color: #E67E22; background: #FEF5E7; padding: 2px 6px; border-radius: 4px; margin: 4px 0; word-break: break-all; }
.wf-node--emojipedia .wf-node__badge { font-size: 10px; color: var(--app-text-color-secondary); background: var(--app-fill-color); padding: 1px 4px; border-radius: 3px; display: inline-block; margin-bottom: 2px; }
.wf-node--emojipedia .wf-node__type { font-size: 10px; color: var(--app-text-color-placeholder); }
</style>
