import { defineStore } from "pinia"
import { ref } from "vue"

export type SplitPaneSide = "left" | "right"

export interface SplitTab {
  id: string
  fullPath: string
  title: string
  name?: string
}

export interface SplitPaneState {
  tabs: SplitTab[]
  activeTabId: string | null
}

const createPane = (): SplitPaneState => ({ tabs: [], activeTabId: null })

export const useSplitStore = defineStore("split", () => {
  // 是否启用分屏
  const enabled = ref(false)

  // 分屏比例（左面板占比 0-100）
  const splitPercent = ref(50)

  // 当前激活的面板：新页面、菜单点击落入该面板
  const activePane = ref<SplitPaneSide>("left")

  const leftPane = ref<SplitPaneState>(createPane())
  const rightPane = ref<SplitPaneState>(createPane())

  // 路由同步挂起标记：标签/菜单等由 UI 主动发起的跳转期间，
  // 临时禁止 SplitLayout 根据 URL 自动同步，避免产生幽灵标签
  const syncSuspended = ref(false)
  let syncSuspendCount = 0

  const paneOf = (side: SplitPaneSide): SplitPaneState =>
    side === "left" ? leftPane.value : rightPane.value

  function suspendSync() {
    syncSuspendCount += 1
    syncSuspended.value = true
  }

  function resumeSync() {
    syncSuspendCount = Math.max(0, syncSuspendCount - 1)
    if (syncSuspendCount === 0) {
      syncSuspended.value = false
    }
  }

  function enable() {
    enabled.value = true
    activePane.value = "left"
  }

  function disable() {
    enabled.value = false
  }

  function setActivePane(side: SplitPaneSide) {
    activePane.value = side
  }

  function findTab(side: SplitPaneSide, fullPath: string): SplitTab | undefined {
    return paneOf(side).tabs.find((t) => t.fullPath === fullPath)
  }

  function openInPane(side: SplitPaneSide, tab: Omit<SplitTab, "id">) {
    const pane = paneOf(side)
    const existing = pane.tabs.find((t) => t.fullPath === tab.fullPath)
    if (existing) {
      pane.activeTabId = existing.id
    } else {
      const id = `${side}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      pane.tabs.push({ ...tab, id })
      pane.activeTabId = id
    }
    activePane.value = side
  }

  function setActiveTab(side: SplitPaneSide, tabId: string) {
    const pane = paneOf(side)
    if (pane.tabs.some((t) => t.id === tabId)) {
      pane.activeTabId = tabId
    }
  }

  function closeTab(
    side: SplitPaneSide,
    tabId: string,
  ): { closedActive: boolean; nextTab: SplitTab | null } {
    const pane = paneOf(side)
    const index = pane.tabs.findIndex((t) => t.id === tabId)
    if (index === -1) {
      return { closedActive: false, nextTab: null }
    }
    const closedActive = pane.activeTabId === tabId
    pane.tabs.splice(index, 1)
    if (closedActive) {
      const next = pane.tabs[Math.min(index, pane.tabs.length - 1)]
      pane.activeTabId = next?.id ?? null
    }
    return {
      closedActive,
      nextTab: pane.tabs.find((t) => t.id === pane.activeTabId) ?? null,
    }
  }

  function setSplitPercent(percent: number) {
    splitPercent.value = Math.max(20, Math.min(80, percent))
  }

  return {
    enabled,
    splitPercent,
    activePane,
    leftPane,
    rightPane,
    syncSuspended,
    enable,
    disable,
    setActivePane,
    findTab,
    openInPane,
    setActiveTab,
    closeTab,
    setSplitPercent,
    suspendSync,
    resumeSync,
  }
})
