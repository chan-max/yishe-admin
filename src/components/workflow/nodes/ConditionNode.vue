<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";

const props = defineProps<{ data: { label?: string; config?: any } }>();

// 输出端口：根据配置动态生成，默认 True/False
const outputs = computed(() => {
  const conditions = props.data?.config?.conditions || [];
  if (conditions.length > 0) {
    return conditions.map((c: any, i: number) => ({
      id: c.handleId || `condition-${i}`,
      label: c.label || `条件${i + 1}`,
      color: c.color || "#f59e0b",
    }));
  }
  return [
    { id: "true", label: "满足", color: "#22c55e" },
    { id: "false", label: "不满足", color: "#ef4444" },
  ];
});
</script>

<template>
  <div class="wf-node wf-node--condition">
    <Handle type="target" :position="Position.Top" />
    <div class="wf-node__header">
      <span class="wf-node__dot" style="background: #f59e0b" />
      <span class="wf-node__title">{{ data.label || "条件分支" }}</span>
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
.wf-node--condition {
  position: relative;
  min-width: 130px;
  padding: 6px 10px;
  background: var(--app-content-surface-color);
  border: 1px solid color-mix(in srgb, #f59e0b 40%, var(--app-content-border-color));
  border-radius: 6px;
  transition: all 0.15s ease;
}

.wf-node--condition:hover {
  border-color: #f59e0b;
  box-shadow: 0 0 0 2px color-mix(in srgb, #f59e0b 20%, transparent);
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
