<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps<{ data: { label?: string; config?: any } }>()

const triggerLabel = computed(() => {
  return props.data.config?.triggerType === 'cron' ? '定时' : '手动'
})

const paramCount = computed(() => {
  const params = props.data.config?.inputParams
  return Array.isArray(params) ? params.length : 0
})
</script>

<template>
  <div class="wf-node wf-node--start">
    <div class="wf-start-title">{{ data.label || '开始' }}</div>
    <div class="wf-start-badge">
      <span>{{ triggerLabel }}</span>
      <span v-if="paramCount > 0" class="wf-param-tag">{{ paramCount }}个变量</span>
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--start {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  border-radius: 12px;
  padding: 6px 12px;
  min-width: 100px;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.wf-start-title {
  font-weight: 600;
}
.wf-start-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  opacity: 0.9;
}
.wf-param-tag {
  background: rgba(255, 255, 255, 0.25);
  padding: 0 4px;
  border-radius: 3px;
}
</style>
