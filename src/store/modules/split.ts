import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface SplitTab {
  id: string
  path: string
  title: string
  icon?: string
  query?: Record<string, any>
  params?: Record<string, any>
}

export interface SplitPaneState {
  tabs: SplitTab[]
  activeTabId: string | null
}

export const useSplitStore = defineStore('split', () => {
  // 是否启用分屏
  const isEnabled = ref(false)

  // 左侧面板
  const leftPane = ref<SplitPaneState>({
    tabs: [],
    activeTabId: null,
  })

  // 右侧面板
  const rightPane = ref<SplitPaneState>({
    tabs: [],
    activeTabId: null,
  })

  // 分屏比例
  const splitPercent = ref(50)

  // 当前激活的面板
  const activePane = ref<'left' | 'right'>('left')

  const leftActiveTab = computed(() =>
    leftPane.value.tabs.find((t) => t.id === leftPane.value.activeTabId),
  )

  const rightActiveTab = computed(() =>
    rightPane.value.tabs.find((t) => t.id === rightPane.value.activeTabId),
  )

  function enableSplit() {
    isEnabled.value = true
    if (!rightPane.value.tabs.length && leftPane.value.tabs.length > 1) {
      // 把左侧最后一个标签移到右侧
      const tab = leftPane.value.tabs.pop()!
      rightPane.value.tabs.push(tab)
      rightPane.value.activeTabId = tab.id
    }
  }

  function disableSplit() {
    isEnabled.value = false
    // 把右侧所有标签合并到左侧
    if (rightPane.value.tabs.length) {
      leftPane.value.tabs.push(...rightPane.value.tabs)
      rightPane.value.tabs = []
      rightPane.value.activeTabId = null
    }
  }

  function toggleSplit() {
    if (isEnabled.value) {
      disableSplit()
    } else {
      enableSplit()
    }
  }

  function openInLeft(tab: SplitTab) {
    const existing = leftPane.value.tabs.find((t) => t.path === tab.path)
    if (existing) {
      leftPane.value.activeTabId = existing.id
    } else {
      leftPane.value.tabs.push(tab)
      leftPane.value.activeTabId = tab.id
    }
    activePane.value = 'left'
  }

  function openInRight(tab: SplitTab) {
    if (!isEnabled.value) {
      enableSplit()
    }
    const existing = rightPane.value.tabs.find((t) => t.path === tab.path)
    if (existing) {
      rightPane.value.activeTabId = existing.id
    } else {
      rightPane.value.tabs.push(tab)
      rightPane.value.activeTabId = tab.id
    }
    activePane.value = 'right'
  }

  function closeLeftTab(tabId: string) {
    const idx = leftPane.value.tabs.findIndex((t) => t.id === tabId)
    if (idx === -1) return
    leftPane.value.tabs.splice(idx, 1)
    if (leftPane.value.activeTabId === tabId) {
      leftPane.value.activeTabId = leftPane.value.tabs[Math.min(idx, leftPane.value.tabs.length - 1)]?.id || null
    }
  }

  function closeRightTab(tabId: string) {
    const idx = rightPane.value.tabs.findIndex((t) => t.id === tabId)
    if (idx === -1) return
    rightPane.value.tabs.splice(idx, 1)
    if (rightPane.value.activeTabId === tabId) {
      rightPane.value.activeTabId = rightPane.value.tabs[Math.min(idx, rightPane.value.tabs.length - 1)]?.id || null
    }
    // 如果右侧没有标签了，自动关闭分屏
    if (!rightPane.value.tabs.length) {
      disableSplit()
    }
  }

  function setSplitPercent(percent: number) {
    splitPercent.value = Math.max(20, Math.min(80, percent))
  }

  return {
    isEnabled,
    leftPane,
    rightPane,
    splitPercent,
    activePane,
    leftActiveTab,
    rightActiveTab,
    enableSplit,
    disableSplit,
    toggleSplit,
    openInLeft,
    openInRight,
    closeLeftTab,
    closeRightTab,
    setSplitPercent,
  }
})
