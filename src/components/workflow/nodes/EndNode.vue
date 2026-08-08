<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: { label?: string; config?: any } }>()
</script>

<template>
  <div class="wf-node wf-node--end">
    <Handle type="target" :position="Position.Top" />
    <span>{{ data.label || '结束' }}</span>
  </div>
</template>

<style scoped>
.wf-node--end {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  border-radius: 20px;
  padding: 6px 16px;
  min-width: 80px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}
</style>
