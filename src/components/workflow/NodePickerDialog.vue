<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Close } from '@element-plus/icons-vue'
import {
  SYSTEM_NODE_REGISTRY,
  NODE_CATEGORIES,
  type SystemNodeCapability
} from '@/views/workflow/editor/config/nodeRegistry'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'select', capability: SystemNodeCapability): void
}>()

const searchQuery = ref('')
const activeCategory = ref('all')

const filteredCapabilities = computed(() => {
  return SYSTEM_NODE_REGISTRY.filter((item) => {
    const matchCategory = activeCategory.value === 'all' || item.category === activeCategory.value
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return matchCategory
    return matchCategory && (
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query) ||
      (item.badge?.toLowerCase().includes(query) ?? false)
    )
  })
})

const getCategoryCount = (key: string) => {
  if (key === 'all') return SYSTEM_NODE_REGISTRY.length
  return SYSTEM_NODE_REGISTRY.filter(n => n.category === key).length
}

const handleSelect = (cap: SystemNodeCapability) => {
  emit('select', cap)
  emit('update:modelValue', false)
  searchQuery.value = ''
  activeCategory.value = 'all'
}

const handleClose = () => {
  emit('update:modelValue', false)
  searchQuery.value = ''
  activeCategory.value = 'all'
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :show-close="false"
    fullscreen
    class="node-picker-dialog"
    @close="handleClose"
  >
    <div class="np-layout">
      <!-- 顶部栏 -->
      <div class="np-header">
        <div class="np-header__left">
          <span class="np-header__title">选择功能节点</span>
          <span class="np-header__count">{{ SYSTEM_NODE_REGISTRY.length }} 个能力已集成</span>
        </div>
        <div class="np-header__center">
          <el-input
            v-model="searchQuery"
            placeholder="搜索节点..."
            size="default"
            clearable
            autofocus
            class="np-search"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="np-header__right">
          <el-button text :icon="Close" @click="handleClose">关闭</el-button>
        </div>
      </div>

      <!-- 主体 -->
      <div class="np-body">
        <!-- 左侧分类 -->
        <div class="np-sidebar">
          <div
            v-for="cat in NODE_CATEGORIES"
            :key="cat.key"
            class="np-sidebar__item"
            :class="{ 'is-active': activeCategory === cat.key }"
            @click="activeCategory = cat.key"
          >
            <span class="np-sidebar__label">{{ cat.label }}</span>
            <span class="np-sidebar__count">{{ getCategoryCount(cat.key) }}</span>
          </div>
        </div>

        <!-- 右侧节点网格 -->
        <div class="np-grid-wrap">
          <div v-if="filteredCapabilities.length === 0" class="np-empty">
            <el-empty description="未找到匹配的节点" :image-size="60" />
          </div>
          <div v-else class="np-grid">
            <div
              v-for="cap in filteredCapabilities"
              :key="cap.type"
              class="np-card"
              @click="handleSelect(cap)"
            >
              <div class="np-card__icon" :style="{ background: cap.color }">
                <Icon :icon="cap.icon" />
              </div>
              <div class="np-card__body">
                <div class="np-card__name">
                  {{ cap.name }}
                  <span v-if="cap.badge" class="np-card__badge" :style="{ color: cap.color, borderColor: cap.color }">{{ cap.badge }}</span>
                </div>
                <div class="np-card__desc">{{ cap.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style lang="scss">
/* 全局覆盖 dialog 默认样式，去掉 padding/header */
.node-picker-dialog {
  .el-dialog__header {
    display: none;
  }
  .el-dialog__body {
    padding: 0;
    height: 100vh;
    overflow: hidden;
  }
}
</style>

<style scoped lang="scss">
.np-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--el-bg-color);
  overflow: hidden;
}

/* 顶部栏 */
.np-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  height: 52px;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.np-header__left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.np-header__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.np-header__count {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.np-header__center {
  flex: 1;
  max-width: 400px;
}

.np-search {
  width: 100%;
}

.np-header__right {
  flex-shrink: 0;
  margin-left: auto;
}

/* 主体 */
.np-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧分类列表 */
.np-sidebar {
  width: 160px;
  flex-shrink: 0;
  border-right: 1px solid var(--el-border-color-light);
  padding: 10px 0;
  overflow-y: auto;
}

.np-sidebar__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 16px;
  cursor: pointer;
  font-size: 12px;
  color: var(--el-text-color-regular);
  transition: all 0.12s ease;

  &:hover {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
  }

  &.is-active {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    font-weight: 600;

    .np-sidebar__count {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-7);
    }
  }
}

.np-sidebar__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.np-sidebar__count {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 999px;
  background: var(--el-fill-color);
  color: var(--el-text-color-placeholder);
  margin-left: 4px;
  flex-shrink: 0;
}

/* 右侧网格 */
.np-grid-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.np-empty {
  padding: 60px 0;
  display: flex;
  justify-content: center;
}

.np-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}

/* 节点卡片 */
.np-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-light);
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--el-bg-color);

  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
  }
}

.np-card__icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  flex-shrink: 0;
}

.np-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.np-card__name {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 5px;
}

.np-card__badge {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  border: 1px solid currentColor;
  font-weight: 600;
  line-height: 1.3;
}

.np-card__desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
