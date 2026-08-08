<script setup lang="ts">
// 左侧节点面板：从这里拖拽节点到画布
const NODE_GROUPS = [
  {
    title: '基础流程',
    items: [
      { type: 'start', label: '开始', icon: '▶', color: '#22c55e', desc: '流程入口' },
      { type: 'default', label: '普通节点', icon: '⚙', color: '#3b82f6', desc: '逻辑处理' },
      { type: 'end', label: '结束', icon: '⏹', color: '#ef4444', desc: '流程出口' }
    ]
  },
  {
    title: '逻辑分支',
    items: [
      { type: 'condition', label: '条件判断', icon: '🔀', color: '#f59e0b', desc: 'True/False 分支' }
    ]
  },
  {
    title: 'AI 与服务',
    items: [
      { type: 'llm', label: 'AI 大模型', icon: '✨', color: '#8b5cf6', desc: '生成与对话' },
      { type: 'http', label: 'HTTP 请求', icon: '🌐', color: '#06b6d4', desc: 'API / Webhook' },
      { type: 'code', label: '代码脚本', icon: '💻', color: '#f97316', desc: 'JS 脚本逻辑' }
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
    <div class="node-panel__title">组件库</div>
    <p class="node-panel__hint">按住拖拽节点到画布</p>

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
            <div class="node-panel__item-icon" :style="{ background: node.color + '20', color: node.color }">
              {{ node.icon }}
            </div>
            <div class="node-panel__item-info">
              <span class="node-panel__item-label">{{ node.label }}</span>
              <span class="node-panel__item-desc">{{ node.desc }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.node-panel {
  width: 200px;
  height: 100%;
  background: var(--app-content-surface-color);
  border-right: 1px solid var(--app-content-border-color);
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
  overflow: hidden;
}

.node-panel__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.node-panel__hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin: 0 0 4px;
}

.node-panel__groups {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-right: 2px;
}

.node-panel__group-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
  letter-spacing: 0.02em;
}

.node-panel__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.node-panel__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: grab;
  background: var(--app-content-surface-muted-color);
  transition: all 0.15s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
    transform: translateX(2px);
  }

  &:active {
    cursor: grabbing;
  }
}

.node-panel__item-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.node-panel__item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.node-panel__item-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.node-panel__item-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
</style>
