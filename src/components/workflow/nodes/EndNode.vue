<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";

defineProps<{ data: { label?: string; config?: any } }>();
</script>

<template>
  <div class="wf-node wf-node--end">
    <Handle type="target" :position="Position.Top" />
    <span>{{ data.label || "结束" }}</span>
  </div>
</template>

<style scoped>
.wf-node--end {
  min-width: 80px;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  text-align: center;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgb(239 68 68 / 30%);
}
</style>
