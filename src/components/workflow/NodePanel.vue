<script setup lang="ts">
import { Connection } from '@element-plus/icons-vue'
const props = defineProps<{
  aiPanelVisible?: boolean
}>()

const emit = defineEmits<{
  (e: 'openNodePicker'): void
  (e: 'toggleAiPanel'): void
}>()

const NODE_GROUPS: Array<{ title: string; items: Array<{ type: string; label: string; color: string }> }> = [
  {
    title: '基础',
    items: [
      { type: 'start', label: '开始', color: '#22c55e' },
      { type: 'end', label: '结束', color: '#ef4444' },
      { type: 'default', label: '普通节点', color: '#3b82f6' },
      { type: 'ai_call', label: 'AI 调用', color: '#6366f1' },
      { type: 'condition', label: '条件分支', color: '#f59e0b' },
    ],
  },
  {
    title: '集成',
    items: [
      { type: 'http', label: 'HTTP', color: '#06b6d4' },
      { type: 'code', label: '代码', color: '#f97316' },
    ],
  },
  {
    title: '素材',
    items: [
      { type: 'google_arts_culture', label: 'Google 艺术', color: '#4285f4' },
      { type: 'pinterest_culture', label: 'Pinterest 采集', color: '#e60023' },
      { type: 'wikimedia_culture', label: 'Wikimedia 采集', color: '#5f7d8c' },
      { type: 'pexels_search', label: 'Pexels 采集', color: '#05a081' },
      { type: 'pixabay_search', label: 'Pixabay 采集', color: '#02be6e' },
      { type: 'rawpixel_search', label: 'Rawpixel 采集', color: '#e65100' },
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

    <!-- 底部：AI 生成 + 全部节点 -->
    <div class="node-panel__footer">
      <button class="node-panel__ai-btn" :class="{ 'node-panel__ai-btn--active': props.aiPanelVisible }" @click="emit('toggleAiPanel')">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L14.5 9.5 22 12 14.5 14.5 12 22 9.5 14.5 2 12 9.5 9.5z"/>
        </svg>
        AI 生成
      </button>
      <button class="node-panel__all-btn" @click="emit('openNodePicker')">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
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
  padding: 0 4px 6px;
  font-size: 11px;
  font-weight: 600;
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
  padding: 0 4px;
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
  padding: 5px 8px;
  cursor: grab;
  border-radius: 4px;
  transition: background 0.12s ease;
  user-select: none;
  align-items: center;
  gap: 4px;

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
  padding-top: 6px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.node-panel__ai-btn,
.node-panel__all-btn {
  display: flex;
  width: 100%;
  padding: 5px 0 5px 10px;
  font-size: 11px;
  font-weight: 400;
  text-align: left;
  cursor: pointer;
  transition: color 0.1s ease;
  align-items: center;
  gap: 5px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: none;
  border-radius: 4px;

  &:hover {
    color: var(--el-text-color-primary);
  }
}

.node-panel__ai-btn--active {
  color: var(--el-text-color-primary);
}
</style>
