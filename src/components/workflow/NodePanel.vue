<script setup lang="ts">
import { Connection } from '@element-plus/icons-vue'
const emit = defineEmits<{
  (e: 'openNodePicker'): void
}>()

const NODE_GROUPS: Array<{ title: string; items: Array<{ type: string; label: string; color: string }> }> = [
  {
    title: '基础',
    items: [
      { type: 'start', label: '开始', color: '#22c55e' },
      { type: 'end', label: '结束', color: '#ef4444' },
      { type: 'default', label: '普通节点', color: '#3b82f6' },
      { type: 'condition', label: '条件分支', color: '#f59e0b' },
    ],
  },
  {
    title: '集成',
    items: [
      { type: 'llm', label: 'AI 大模型', color: '#8b5cf6' },
      { type: 'http', label: 'HTTP', color: '#06b6d4' },
      { type: 'code', label: '代码', color: '#f97316' },
    ],
  },
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
      <div v-if="NODE_GROUPS.length === 0" class="node-panel__empty">
        <div class="node-panel__empty-illustration">
          <el-icon class="node-panel__empty-icon"><Connection /></el-icon>
        </div>
        <p class="node-panel__empty-title">暂无节点</p>
        <p class="node-panel__empty-desc">点击下方按钮选择节点</p>
      </div>
    </div>

    <!-- 底部：打开全部节点 -->
    <div class="node-panel__footer">
      <button class="node-panel__all-btn" @click="emit('openNodePicker')">
        全部节点
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.node-panel {
  display: flex;
  width: 120px;
  height: 100%;
  padding: 8px 6px;
  overflow: hidden;
  background: var(--app-content-surface-color);
  border-right: 1px solid var(--app-content-border-color);
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.node-panel__header {
  padding: 0 2px 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  border-bottom: 1px solid var(--app-content-border-color);
}

.node-panel__groups {
  display: flex;
  overflow-y: auto;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.node-panel__group-title {
  padding: 0 2px;
  margin-bottom: 3px;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
}

.node-panel__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.node-panel__item {
  display: flex;
  padding: 5px 6px;
  cursor: grab;
  border-radius: 4px;
  transition: background 0.12s ease;
  user-select: none;
  align-items: center;
  gap: 6px;

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
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
  overflow: hidden;
  font-size: 11px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-panel__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 8px;
  text-align: center;
}

.node-panel__empty-illustration {
  display: flex;
  width: 40px;
  height: 40px;
  background: color-mix(in srgb, var(--el-text-color-secondary) 8%, transparent);
  border-radius: 10px;
  align-items: center;
  justify-content: center;
}

.node-panel__empty-icon {
  font-size: 18px;
  color: var(--el-text-color-secondary);
  opacity: 0.5;
}

.node-panel__empty-title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.node-panel__empty-desc {
  margin: 0;
  font-size: 10px;
  line-height: 1.4;
  color: var(--el-text-color-placeholder);
}

.node-panel__footer {
  padding-top: 8px;
  border-top: 1px solid var(--app-content-border-color);
  flex-shrink: 0;
}

.node-panel__all-btn {
  width: 100%;
  padding: 6px 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-color-primary);
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--el-color-primary);
  border-radius: 4px;
  transition: all 0.12s ease;

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  }

  &:active {
    background: color-mix(in srgb, var(--el-color-primary) 20%, transparent);
  }
}
</style>
