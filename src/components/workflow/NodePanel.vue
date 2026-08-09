<script setup lang="ts">
// 左侧基础节点面板：只显示最基础的拖拽节点，保持极简
const NODE_GROUPS = [
  {
    title: '基础',
    items: [
      { type: 'start', label: '开始', color: '#22c55e' },
      { type: 'end', label: '结束', color: '#ef4444' },
      { type: 'default', label: '普通节点', color: '#3b82f6' },
      { type: 'condition', label: '条件分支', color: '#f59e0b' },
    ]
  },
  {
    title: '集成',
    items: [
      { type: 'llm', label: 'AI 大模型', color: '#8b5cf6' },
      { type: 'http', label: 'HTTP', color: '#06b6d4' },
      { type: 'code', label: '代码', color: '#f97316' },
    ]
  }
]

const onDragStart = (event: DragEvent, type: string, label: string) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow-node-type', type)
    event.dataTransfer.setData('application/vueflow-node-label', label)
    event.dataTransfer.effectAllowed = 'move'
  }
}
</script>

<template>
  <div class="node-panel">
    <div class="node-panel__header">组件库</div>

    <div class="node-panel__groups">
      <div v-for="group in NODE_GROUPS" :key="group.title" class="node-panel__group">
        <div class="node-panel__group-title">{{ group.title }}</div>
        <div class="node-panel__list">
          <div
            v-for="node in group.items"
            :key="node.type"
            class="node-panel__item"
            draggable="true"
            @dragstart="onDragStart($event, node.type, node.label)"
          >
            <span class="node-panel__dot" :style="{ background: node.color }" />
            <span class="node-panel__item-label">{{ node.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.node-panel {
  width: 120px;
  height: 100%;
  background: var(--app-content-surface-color);
  border-right: 1px solid var(--app-content-border-color);
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
  overflow: hidden;
}

.node-panel__header {
  font-size: 11px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  padding: 0 2px 6px;
  border-bottom: 1px solid var(--app-content-border-color);
}

.node-panel__groups {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-panel__group-title {
  font-size: 9px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
  margin-bottom: 3px;
  padding: 0 2px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.node-panel__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.node-panel__item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border-radius: 4px;
  cursor: grab;
  transition: background 0.12s ease;
  user-select: none;

  &:hover {
    background: var(--app-content-surface-muted-color, rgba(255,255,255,0.05));
  }

  &:active {
    cursor: grabbing;
  }
}

.node-panel__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.node-panel__item-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
