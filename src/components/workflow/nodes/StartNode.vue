<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: { label?: string; config?: any } }>()
</script>

<template>
  <div class="wf-node wf-node--start">
    <Handle type="source" :position="Position.Bottom" />
    <div class="wf-node__icon">▶</div>
    <div class="wf-node__label">{{ data.label || '开始' }}</div>
  </div>
</template>

<style scoped>
.wf-node--start {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
  border-radius: 50px;
  padding: 10px 20px;
  min-width: 100px;
  text-align: center;
  border: 2px solid rgba(255,255,255,0.3);
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.35);
}
.wf-node__icon { font-size: 14px; margin-bottom: 2px; }
.wf-node__label { font-size: 13px; font-weight: 600; }
</style>
