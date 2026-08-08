<script setup lang="ts">
// 左侧节点面板：高密度极简面板
const NODE_GROUPS = [
  {
    title: '基础节点',
    items: [
      { type: 'start', label: '开始', color: '#22c55e' },
      { type: 'default', label: '普通处理', color: '#3b82f6' },
      { type: 'end', label: '结束出口', color: '#ef4444' }
    ]
  },
  {
    title: '逻辑分支',
    items: [
      { type: 'condition', label: '条件分支', color: '#f59e0b' }
    ]
  },
  {
    title: '服务集成',
    items: [
      { type: 'llm', label: 'AI 大模型', color: '#8b5cf6' },
      { type: 'http', label: 'HTTP 请求', color: '#06b6d4' },
      { type: 'code', label: '代码脚本', color: '#f97316' }
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
    <div class="node-panel__header">
      <span class="node-panel__title">组件库</span>
    </div>

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
  width: 150px;
  height: 100%;
  background: var(--app-content-surface-color);
  border-right: 1px solid var(--app-content-border-color);
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  overflow: hidden;
}

.node-panel__header {
  padding: 0 4px 4px;
  border-bottom: 1px solid var(--app-content-border-color);
}

.node-panel__title {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.node-panel__groups {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.node-panel__group-title {
  font-size: 10px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
  margin: 0 0 4px 4px;
  text-transform: uppercase;
}

.node-panel__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-panel__item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: grab;
  background: var(--app-content-surface-muted-color);
  transition: all 0.15s ease;
  user-select: none;

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 10%, var(--app-content-surface-color));
    color: var(--el-color-primary);
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
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
