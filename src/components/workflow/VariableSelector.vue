<script setup lang="ts">
import { ref, computed } from "vue";
import type { Node } from "@vue-flow/core";
import {
  getNodeLabel,
  getNodeColor,
  getNodeOutputSchema,
} from "@/views/workflow/editor/config/node-manifest";
import { getWorkflowVariableKey } from "@/views/workflow/editor/config/workflowVariableKey";

const props = defineProps<{
  visible: boolean;
  currentNodeId: string;
  allNodes: Node[];
  allEdges: any[];
}>();

const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "select", variablePath: string, label: string): void;
}>();

const searchKeyword = ref("");

/** 上游节点：有连线连接到当前节点的节点 */
const upstreamNodes = computed(() => {
  const upstreamIds = new Set(
    props.allEdges.filter((e) => e.target === props.currentNodeId).map((e) => e.source),
  );
  return props.allNodes.filter((n) => upstreamIds.has(n.id));
});

/** 过滤后的节点列表（按搜索词过滤） */
const filteredNodes = computed(() => {
  if (!searchKeyword.value.trim()) return upstreamNodes.value;
  const kw = searchKeyword.value.trim().toLowerCase();
  return upstreamNodes.value.filter((n) => {
    const label = getNodeLabel(n).toLowerCase();
    const outputs = getNodeOutputSchema(n);
    const fieldMatch = outputs.some(
      (o: any) => o.field.toLowerCase().includes(kw) || o.label.toLowerCase().includes(kw),
    );
    return label.includes(kw) || fieldMatch;
  });
});

const handleSelect = (node: Node, field: any) => {
  const variableKey = getWorkflowVariableKey(node, props.allNodes);
  const path = `${variableKey}.${field.field}`;
  const label = field.label || field.field;
  emit("select", path, label);
  emit("update:visible", false);
};

const handleClose = () => {
  emit("update:visible", false);
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="插入变量"
    width="420px"
    align-center
    :close-on-click-modal="true"
    @update:model-value="handleClose"
    class="variable-selector"
  >
    <div class="vs">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索节点或字段..."
        clearable
        class="vs__search"
      />

      <div class="vs__content">
        <!-- 空状态：无上游节点 -->
        <div v-if="!filteredNodes.length && !searchKeyword.trim()" class="vs__empty">
          <div class="vs__empty-icon">⚡</div>
          <p class="vs__empty-text">暂无可用的上游变量</p>
          <p class="vs__empty-hint">请将其他节点通过连线连接到当前节点</p>
        </div>

        <!-- 空状态：搜索无结果 -->
        <div v-else-if="!filteredNodes.length" class="vs__empty">
          <div class="vs__empty-icon">🔍</div>
          <p class="vs__empty-text">未找到匹配的变量</p>
        </div>

        <!-- 变量列表 -->
        <div v-else class="vs__list">
          <div v-for="node in filteredNodes" :key="node.id" class="vs__group">
            <div class="vs__group-header">
              <span class="vs__group-dot" :style="{ background: getNodeColor(node) }" />
              <span class="vs__group-name">{{ getNodeLabel(node) }}</span>
              <span class="vs__group-id">{{ getWorkflowVariableKey(node, allNodes) }}</span>
            </div>
            <div
              v-for="field in getNodeOutputSchema(node)"
              :key="field.field"
              class="vs__field"
              @click="handleSelect(node, field)"
            >
              <div class="vs__field-main">
                <span class="vs__field-name">{{ field.field }}</span>
                <span class="vs__field-type">{{ field.type }}</span>
              </div>
              <span class="vs__field-label">{{ field.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
.vs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vs__search {
  width: 100%;
}

.vs__content {
  max-height: 360px;
  overflow-y: auto;
}

.vs__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  text-align: center;
}

.vs__empty-icon {
  font-size: 28px;
  opacity: 0.5;
}

.vs__empty-text {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.vs__empty-hint {
  margin: 0;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.vs__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vs__group {
  border: 1px solid var(--app-content-border-color, rgb(255 255 255 / 8%));
  border-radius: 6px;
  overflow: hidden;
}

.vs__group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: color-mix(in srgb, var(--el-text-color-secondary) 5%, transparent);
}

.vs__group-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.vs__group-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vs__group-id {
  font-family: monospace;
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}

.vs__field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  cursor: pointer;
  transition: background 0.12s ease;
  border-top: 1px solid var(--app-content-border-color, rgb(255 255 255 / 4%));

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  }
}

.vs__field-main {
  display: flex;
  align-items: center;
  gap: 6px;
}

.vs__field-name {
  font-family: monospace;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.vs__field-type {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--el-text-color-secondary) 12%, transparent);
  color: var(--el-text-color-secondary);
}

.vs__field-label {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}
</style>
