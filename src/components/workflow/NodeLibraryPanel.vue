<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import {
  SYSTEM_NODE_REGISTRY,
  NODE_CATEGORIES,
  type SystemNodeCapability
} from '@/views/workflow/editor/config/nodeRegistry'

const emit = defineEmits<{
  (e: 'add-node', nodeCapability: SystemNodeCapability): void
}>()

const searchQuery = ref('')
const activeCategory = ref<string>('all')

const filteredCapabilities = computed(() => {
  return SYSTEM_NODE_REGISTRY.filter((item) => {
    // 1. 分类匹配
    const matchCategory =
      activeCategory.value === 'all' || item.category === activeCategory.value

    // 2. 检索关键字匹配
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return matchCategory

    const matchName = item.name.toLowerCase().includes(query)
    const matchDesc = item.description.toLowerCase().includes(query)
    const matchType = item.type.toLowerCase().includes(query)
    const matchBadge = item.badge?.toLowerCase().includes(query)

    return matchCategory && (matchName || matchDesc || matchType || matchBadge)
  })
})

const getCategoryCount = (categoryKey: string) => {
  if (categoryKey === 'all') return SYSTEM_NODE_REGISTRY.length
  return SYSTEM_NODE_REGISTRY.filter((item) => item.category === categoryKey).length
}

const onDragStart = (event: DragEvent, capability: SystemNodeCapability) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow-node-type', capability.type)
    event.dataTransfer.setData('application/vueflow-node-label', capability.name)
    event.dataTransfer.setData('application/vueflow-node-data', JSON.stringify(capability.defaultData))
    event.dataTransfer.effectAllowed = 'move'
  }
}

const handleQuickAdd = (capability: SystemNodeCapability) => {
  emit('add-node', capability)
}
</script>

<template>
  <div class="node-library-panel">
    <!-- 面板标题与检索框 -->
    <div class="node-library-panel__header">
      <div class="node-library-panel__title-bar">
        <span class="node-library-panel__title">系统能力库</span>
        <span class="node-library-panel__badge">{{ SYSTEM_NODE_REGISTRY.length }} 项已集成</span>
      </div>
      <el-input
        v-model="searchQuery"
        placeholder="检索 AI抠图 / PSD渲染 / HTTP..."
        size="small"
        clearable
        class="node-library-panel__search"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 分类 Pills 切换 -->
    <div class="node-library-panel__categories">
      <div
        v-for="cat in NODE_CATEGORIES"
        :key="cat.key"
        class="node-library-panel__category-pill"
        :class="{ 'is-active': activeCategory === cat.key }"
        @click="activeCategory = cat.key"
      >
        <span>{{ cat.label }}</span>
        <span class="node-library-panel__count-badge">{{ getCategoryCount(cat.key) }}</span>
      </div>
    </div>

    <!-- 能力卡片列表 -->
    <div class="node-library-panel__list">
      <div
        v-for="cap in filteredCapabilities"
        :key="cap.type"
        class="node-library-card"
        draggable="true"
        @dragstart="onDragStart($event, cap)"
      >
        <div class="node-library-card__icon-box" :style="{ background: cap.color }">
          <Icon :icon="cap.icon" class="node-library-card__icon" />
        </div>

        <div class="node-library-card__content">
          <div class="node-library-card__title-row">
            <span class="node-library-card__name">{{ cap.name }}</span>
            <span v-if="cap.badge" class="node-library-card__badge" :style="{ borderColor: cap.color, color: cap.color }">
              {{ cap.badge }}
            </span>
          </div>
          <p class="node-library-card__desc">{{ cap.description }}</p>
        </div>

        <button
          type="button"
          class="node-library-card__add-btn"
          title="点击直接添加至画布"
          @click.stop="handleQuickAdd(cap)"
        >
          <el-icon><Plus /></el-icon>
        </button>
      </div>

      <div v-if="filteredCapabilities.length === 0" class="node-library-panel__empty">
        <el-empty description="未找到匹配的系统能力节点" :image-size="60" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.node-library-panel {
  width: 240px;
  height: 100%;
  background: var(--app-content-surface-color, #141518);
  border-right: 1px solid var(--app-content-border-color, rgba(255, 255, 255, 0.08));
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  user-select: none;
  overflow: hidden;
}

.node-library-panel__header {
  padding: 10px 10px 8px;
  border-bottom: 1px solid var(--app-content-border-color, rgba(255, 255, 255, 0.06));
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-library-panel__title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.node-library-panel__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.node-library-panel__badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
  font-weight: 600;
}

.node-library-panel__categories {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--app-content-border-color, rgba(255, 255, 255, 0.04));
  background: rgba(0, 0, 0, 0.02);
}

.node-library-panel__category-pill {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 4px;
  color: var(--el-text-color-secondary);
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s ease;

  &:hover {
    color: var(--el-text-color-primary);
    background: rgba(255, 255, 255, 0.06);
  }

  &.is-active {
    color: #ffffff;
    background: var(--el-color-primary);
    font-weight: 600;

    .node-library-panel__count-badge {
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
    }
  }
}

.node-library-panel__count-badge {
  font-size: 9px;
  padding: 0 4px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.15);
  color: var(--el-text-color-secondary);
}

.node-library-panel__list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-library-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 8px 9px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--app-content-surface-color) 92%, #ffffff 8%);
  border: 1px solid var(--app-content-border-color, rgba(255, 255, 255, 0.06));
  cursor: grab;
  transition: all 0.18s cubic-bezier(0.22, 1, 0.36, 1);

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 40%, transparent);
    background: color-mix(in srgb, var(--el-color-primary) 6%, var(--app-content-surface-color));
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

    .node-library-card__add-btn {
      opacity: 1;
      transform: scale(1);
    }
  }

  &:active {
    cursor: grabbing;
    transform: translateY(0);
  }
}

.node-library-card__icon-box {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
}

.node-library-card__icon {
  font-size: 14px;
}

.node-library-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.node-library-card__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.node-library-card__name {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-library-card__badge {
  font-size: 9px;
  padding: 0 4px;
  border-radius: 3px;
  border: 1px solid currentColor;
  font-weight: 600;
  line-height: 1.2;
}

.node-library-card__desc {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  line-height: 1.35;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.node-library-card__add-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: none;
  background: var(--el-color-primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.85);
  transition: all 0.15s ease;

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 85%, #000000 15%);
  }
}

.node-library-panel__empty {
  padding: 30px 0;
  text-align: center;
}
</style>
