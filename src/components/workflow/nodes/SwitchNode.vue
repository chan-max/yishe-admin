<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";

const props = defineProps<{ data: { label?: string; config?: any } }>();

// 输出端口：根据 cases 动态生成 + 默认
const outputs = computed(() => {
  const cases = props.data?.config?.cases || [];
  const result = cases.map((c: any, i: number) => ({
    id: `case-${i}`,
    label: c.label || c.value || `情况${i + 1}`,
    color: "#64748b",
  }));
  result.push({ id: "default", label: "默认", color: "#94a3b8" });
  return result;
});
</script>

<template>
  <div class="wf-node wf-node--switch">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <span class="wf-node__dot" style="background: #06b6d4" />
      <span class="wf-node__title">{{ data.label || "多路切换" }}</span>
    </div>
    <div class="wf-node__handles">
      <div
        v-for="out in outputs"
        :key="out.id"
        class="wf-handle-label"
        :style="{ color: out.color }"
      >
        <span>{{ out.label }}</span>
        <Handle
          :id="out.id"
          type="source"
          :position="Position.Bottom"
          class="wf-node__handle-dot"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.wf-node--switch {
  position: relative;
  min-width: 130px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid color-mix(in srgb, #06b6d4 40%, var(--app-content-border-color));
  border-radius: 6px;
  transition: all 0.15s ease;
}

.wf-node--switch:hover {
  border-color: #06b6d4;
  box-shadow: 0 0 0 2px color-mix(in srgb, #06b6d4 20%, transparent);
}

.wf-node__header {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 4px;
}

.wf-node__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.wf-node__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.wf-node__handles {
  display: flex;
  padding-top: 4px;
  font-size: 10px;
  font-weight: 600;
  border-top: 1px dashed var(--app-content-border-color);
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 4px;
}

.wf-handle-label {
  position: relative;
  display: flex;
  align-items: center;
  gap: 3px;
}

.wf-node__handle-dot {
  width: 8px !important;
  height: 8px !important;
  min-width: 8px !important;
  min-height: 8px !important;
}
</style>
