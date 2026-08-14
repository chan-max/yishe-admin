<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps<{ data: { label?: string; config?: any } }>()

const method = computed(() => props.data.config?.method || 'POST')

const methodColor = computed(() => {
  const colors: Record<string, string> = {
    POST: '#10b981',
    GET: '#3b82f6',
    PUT: '#f59e0b',
  }
  return colors[method.value] || '#8b5cf6'
})
</script>

<template>
  <div class="wf-node wf-node--webhook">
    <div class="wf-webhook-icon">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    </div>
    <div class="wf-webhook-content">
      <div class="wf-webhook-title">{{ data.label || 'Webhook' }}</div>
      <div class="wf-webhook-method" :style="{ background: methodColor }">{{ method }}</div>
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--webhook {
  display: flex;
  min-width: 110px;
  padding: 6px 10px;
  font-size: 12px;
  color: #fff;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgb(139 92 246 / 25%);
  align-items: center;
  gap: 8px;
}

.wf-webhook-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: rgb(255 255 255 / 20%);
  border-radius: 6px;
  flex-shrink: 0;
}

.wf-webhook-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.wf-webhook-title {
  font-weight: 600;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wf-webhook-method {
  display: inline-flex;
  padding: 0 5px;
  font-size: 9px;
  font-weight: 600;
  border-radius: 3px;
  align-self: flex-start;
}
</style>
