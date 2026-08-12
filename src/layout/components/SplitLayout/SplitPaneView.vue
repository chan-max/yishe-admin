<template>
  <div class="split-pane-view">
    <div class="split-pane-view__tabs" @click.stop>
      <div
        v-for="tab in pane.tabs"
        :key="tab.id"
        class="split-pane-view__tab"
        :class="{ 'is-active': tab.id === pane.activeTabId }"
        :title="tab.title"
        @click="onTabClick(tab)"
        @click.middle.prevent="onTabClose(tab)"
      >
        <span class="split-pane-view__tab-title">{{ tab.title }}</span>
        <button
          v-if="pane.tabs.length > 1"
          class="split-pane-view__tab-close"
          :title="t('layout.split.tabClose')"
          @click.stop="onTabClose(tab)"
        >
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
            <line x1="3" y1="3" x2="9" y2="9" />
            <line x1="9" y1="3" x2="3" y2="9" />
          </svg>
        </button>
      </div>

      <div class="split-pane-view__spacer" />

      <button
        class="split-pane-view__exit"
        :title="t('layout.split.disableSplit')"
        @click="splitStore.disable()"
      >
        <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" />
          <line x1="1.5" y1="4.5" x2="10.5" y2="4.5" />
          <line x1="4.5" y1="1.5" x2="4.5" y2="10.5" />
        </svg>
      </button>
    </div>

    <div class="split-pane-view__content" @click="onContentClick">
      <SplitPaneContent :side="side" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useRouter } from "vue-router"
import { useSplitStore, type SplitTab } from "@/store/modules/split"
import SplitPaneContent from "./SplitPaneContent.vue"

const props = defineProps<{ side: "left" | "right" }>()

const router = useRouter()
const splitStore = useSplitStore()
const { t } = useI18n()

const pane = computed(() =>
  props.side === "left" ? splitStore.leftPane : splitStore.rightPane,
)
const activeTab = computed(
  () => pane.value.tabs.find((t) => t.id === pane.value.activeTabId) ?? null,
)
const isActivePane = computed(() => splitStore.activePane === props.side)

// 点击标签：切换该面板标签，并把 URL 同步到该标签（面板随之成为活动面板）
async function onTabClick(tab: SplitTab) {
  splitStore.suspendSync()
  try {
    splitStore.setActiveTab(props.side, tab.id)
    splitStore.setActivePane(props.side)
    if (tab.fullPath !== router.currentRoute.value.fullPath) {
      await router.push(tab.fullPath)
    }
  } finally {
    await nextTick()
    splitStore.resumeSync()
  }
}

async function onTabClose(tab: SplitTab) {
  const result = splitStore.closeTab(props.side, tab.id)
  if (!result.closedActive) return
  splitStore.suspendSync()
  try {
    if (result.nextTab) {
      splitStore.setActivePane(props.side)
      if (result.nextTab.fullPath !== router.currentRoute.value.fullPath) {
        await router.push(result.nextTab.fullPath)
      }
    } else if (isActivePane.value) {
      // 活动面板标签全部关闭 -> 退出分屏，回到单屏模式
      splitStore.disable()
    }
  } finally {
    await nextTick()
    splitStore.resumeSync()
  }
}

// 点击内容区：激活该面板。镜像/空面板被激活时，
// 把地址栏当前路由纳入该面板并让地址栏跟随其当前标签
async function onContentClick() {
  if (isActivePane.value) {
    splitStore.setActivePane(props.side)
    return
  }
  splitStore.suspendSync()
  try {
    splitStore.setActivePane(props.side)
    let tab = activeTab.value
    if (!tab) {
      // 空面板被激活：直接接管当前 URL 作为该面板的第一个标签
      const fullPath = router.currentRoute.value.fullPath
      const metaTitle = router.currentRoute.value.meta?.title
      splitStore.openInPane(props.side, {
        fullPath,
        title:
          (typeof metaTitle === "string" && metaTitle) ||
          fullPath.split("/").filter(Boolean).pop() ||
          fullPath,
        name: String(router.currentRoute.value.name ?? ""),
      })
      tab = activeTab.value
    }
    if (tab && tab.fullPath !== router.currentRoute.value.fullPath) {
      await router.push(tab.fullPath)
    }
  } finally {
    await nextTick()
    splitStore.resumeSync()
  }
}
</script>

<style scoped>
.split-pane-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--app-content-bg-color);
  overflow: hidden;
}

.split-pane-view__tabs {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 32px;
  overflow: hidden;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.split-pane-view__tab {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  padding: 0 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}

.split-pane-view__tab:hover {
  color: var(--el-text-color-primary);
}

.split-pane-view__tab.is-active {
  color: var(--el-color-primary);
  border-bottom-color: var(--el-color-primary);
}

.split-pane-view__tab-title {
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.split-pane-view__tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
}

.split-pane-view__tab:hover .split-pane-view__tab-close {
  opacity: 1;
}

.split-pane-view__tab-close:hover {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

.split-pane-view__spacer {
  flex: 1;
}

.split-pane-view__exit {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  margin: 0 6px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: color 0.15s, background 0.15s;
}

.split-pane-view__exit:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color);
}

.split-pane-view__content {
  position: relative;
  flex: 1;
  overflow: hidden;
}
</style>