<template>
  <div class="split-pane-tabs">
    <!-- 标签栏 -->
    <div class="split-pane-tabs__header">
      <div class="split-pane-tabs__tabs">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="split-pane-tabs__tab"
          :class="{ 'is-active': tab.id === activeTabId }"
          @click="activeTabId = tab.id"
          @click.middle="closeTab(tab.id)"
          @contextmenu.prevent="handleContextMenu(tab, $event)"
        >
          <span v-if="tab.icon" class="split-pane-tabs__tab-icon">
            <el-icon><component :is="tab.icon" /></el-icon>
          </span>
          <span class="split-pane-tabs__tab-title">{{ tab.title }}</span>
          <button
            v-if="tabs.length > 1"
            class="split-pane-tabs__tab-close"
            @click.stop="closeTab(tab.id)"
          >
            ×
          </button>
        </div>
      </div>
      <div class="split-pane-tabs__actions">
        <el-tooltip content="关闭分屏" placement="top" :show-after="300">
          <button class="split-pane-tabs__close-split" @click="handleCloseSplit">
            <el-icon><Close /></el-icon>
          </button>
        </el-tooltip>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="split-pane-tabs__content">
      <router-view :name="side === 'left' ? 'left' : 'right'" v-slot="{ Component, route }">
        <keep-alive :max="5">
          <component :is="Component" v-if="route" :key="route.fullPath" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSplitStore, type SplitTab } from '@/store/modules/split'
import { Close } from '@element-plus/icons-vue'

const props = defineProps<{
  side: 'left' | 'right'
}>()

const splitStore = useSplitStore()

const tabs = computed(() =>
  props.side === 'left' ? splitStore.leftPane.tabs : splitStore.rightPane.tabs,
)

const activeTabId = computed({
  get: () => props.side === 'left' ? splitStore.leftPane.activeTabId : splitStore.rightPane.activeTabId,
  set: (val) => {
    if (props.side === 'left') {
      splitStore.leftPane.activeTabId = val
    } else {
      splitStore.rightPane.activeTabId = val
    }
  },
})

function closeTab(tabId: string) {
  if (props.side === 'left') {
    splitStore.closeLeftTab(tabId)
  } else {
    splitStore.closeRightTab(tabId)
  }
}

function handleCloseSplit() {
  splitStore.disableSplit()
}

function handleContextMenu(tab: SplitTab, event: MouseEvent) {
  // TODO: 右键菜单 - 移动到其他面板
}
</script>

<style scoped>
.split-pane-tabs {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--app-content-bg-color);
}

.split-pane-tabs__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: var(--app-content-surface-color, #f5f5f5);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.split-pane-tabs__tabs {
  display: flex;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
}

.split-pane-tabs__tabs::-webkit-scrollbar {
  display: none;
}

.split-pane-tabs__tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  border-right: 1px solid var(--el-border-color-lighter);
  white-space: nowrap;
  transition: all 0.15s;
}

.split-pane-tabs__tab:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.split-pane-tabs__tab.is-active {
  background: var(--app-content-bg-color);
  color: var(--el-color-primary);
}

.split-pane-tabs__tab-icon {
  display: flex;
  font-size: 14px;
}

.split-pane-tabs__tab-title {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.split-pane-tabs__tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  margin-left: 2px;
  font-size: 12px;
  border: none;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
}

.split-pane-tabs__tab:hover .split-pane-tabs__tab-close,
.split-pane-tabs__tab.is-active .split-pane-tabs__tab-close {
  opacity: 1;
}

.split-pane-tabs__tab-close:hover {
  background: var(--el-fill-color);
}

.split-pane-tabs__actions {
  flex-shrink: 0;
  padding: 0 4px;
}

.split-pane-tabs__close-split {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: all 0.15s;
}

.split-pane-tabs__close-split:hover {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

.split-pane-tabs__content {
  flex: 1;
  overflow: hidden;
}
</style>
