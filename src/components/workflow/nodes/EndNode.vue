<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: { label?: string; config?: any } }>()
</script>

<template>
  <div class="wf-node wf-node--end">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__icon">⏹</div>
    <div class="wf-node__label">{{ data.label || '结束' }}</div>
  </div>
</template>

<style scoped>
.wf-node--end {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  border-radius: 50px;
  padding: 10px 20px;
  min-width: 100px;
  text-align: center;
  border: 2px solid rgba(255,255,255,0.3);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.35);
}
.wf-node__icon { font-size: 14px; margin-bottom: 2px; }
.wf-node__label { font-size: 13px; font-weight: 600; }
</style>
