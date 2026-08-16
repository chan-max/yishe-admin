<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { shopifyIcon } from '@/assets/icons/utility'
const props = defineProps<{ data: { label?: string; config?: any } }>()
const storeUrl = computed(() => props.data.config?.storeUrl || props.data.config?.keyword || '')
</script>
<template>
  <div class="wf-node wf-node--shopify">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <img :src="shopifyIcon" class="wf-node__icon" />
      <span class="wf-node__title">{{ data.label || 'Shopify 独立站' }}</span>
    </div>
    <div v-if="storeUrl" class="wf-node__subtitle">{{ storeUrl }}</div>
    <div class="wf-node__type">电商</div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>
<style scoped>
.wf-node--shopify {
  min-width: 120px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-border-color);
  border-radius: 8px;
  font-size: 12px;
}
.wf-node--shopify .wf-node__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.wf-node--shopify .wf-node__icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
.wf-node--shopify .wf-node__title {
  font-weight: 600;
  color: var(--app-text-color);
}
.wf-node--shopify .wf-node__subtitle {
  font-size: 11px;
  color: #16a34a;
  background: #f0fdf4;
  padding: 2px 6px;
  border-radius: 4px;
  margin: 4px 0;
  word-break: break-all;
}
.wf-node--shopify .wf-node__type {
  font-size: 10px;
  color: var(--app-text-color-placeholder);
}
</style>
