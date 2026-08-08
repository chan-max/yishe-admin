<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: { label?: string; config?: any } }>()
</script>

<template>
  <div class="wf-node wf-node--start">
    <span>{{ data.label || '开始' }}</span>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.wf-node--start {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
  border-radius: 20px;
  padding: 6px 16px;
  min-width: 80px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
}
</style>
