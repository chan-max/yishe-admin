import { defineStore } from 'pinia'
import { store } from '@/store'
import type {
  OpenToolWindowOptions,
  ToolWindowDefinition,
  ToolWindowInstance,
  ToolWindowMode,
  ToolWindowRect,
} from '@/types/toolWindow'
import { getToolDefinition } from '@/config/toolRegistry'

const BASE_Z_INDEX = 4000
const VIEWPORT_PADDING = 12
const MIN_VISIBLE_EDGE = 72
const MIN_VISIBLE_HEADER = 28

const getViewportSize = () => {
  if (typeof window === 'undefined') {
    return {
      width: 1440,
      height: 900,
    }
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

const clampRect = (
  rect: ToolWindowRect,
  minWidth: number,
  minHeight: number,
  mode: 'strict' | 'floating' = 'floating'
): ToolWindowRect => {
  const viewport = getViewportSize()
  const maxWidth = Math.max(viewport.width - VIEWPORT_PADDING * 2, 320)
  const maxHeight = Math.max(viewport.height - VIEWPORT_PADDING * 2, 240)
  const width = Math.min(Math.max(rect.width, minWidth), maxWidth)
  const height = Math.min(Math.max(rect.height, minHeight), maxHeight)

  if (mode === 'strict') {
    const maxX = Math.max(VIEWPORT_PADDING, viewport.width - width - VIEWPORT_PADDING)
    const maxY = Math.max(VIEWPORT_PADDING, viewport.height - height - VIEWPORT_PADDING)

    return {
      width,
      height,
      x: Math.min(Math.max(rect.x, VIEWPORT_PADDING), maxX),
      y: Math.min(Math.max(rect.y, VIEWPORT_PADDING), maxY),
    }
  }

  const minX = MIN_VISIBLE_EDGE - width
  const maxX = viewport.width - MIN_VISIBLE_EDGE
  const minY = MIN_VISIBLE_HEADER - height
  const maxY = viewport.height - MIN_VISIBLE_HEADER

  return {
    width,
    height,
    x: Math.min(Math.max(rect.x, minX), maxX),
    y: Math.min(Math.max(rect.y, minY), maxY),
  }
}

const createCenteredRect = (
  width = 1280,
  height = 820,
  minWidth = 920,
  minHeight = 600
): ToolWindowRect => {
  const viewport = getViewportSize()
  const rect = clampRect(
    {
      width: Math.min(width, viewport.width - VIEWPORT_PADDING * 2),
      height: Math.min(height, viewport.height - VIEWPORT_PADDING * 2),
      x: Math.round((viewport.width - width) / 2),
      y: Math.round((viewport.height - height) / 2),
    },
    minWidth,
    minHeight,
    'strict'
  )

  return rect
}

const toRuntimeDefinition = (
  source: ToolWindowDefinition,
  options?: OpenToolWindowOptions
): ToolWindowDefinition => ({
  ...source,
  title: options?.title || source.title,
  src: source.buildSrc
    ? source.buildSrc(options?.src || source.src, source)
    : options?.src || source.src,
  defaultMode: options?.mode || source.defaultMode || 'fullscreen',
  defaultWidth: options?.width || source.defaultWidth || 1280,
  defaultHeight: options?.height || source.defaultHeight || 820,
  minWidth: source.minWidth || 920,
  minHeight: source.minHeight || 600,
  singleton: source.singleton !== false,
  allowFullscreen: source.allowFullscreen !== false,
  allowNewTab: source.allowNewTab !== false,
})

export const useToolWindowStore = defineStore('tool-window', {
  state: () => ({
    windows: [] as ToolWindowInstance[],
    activeId: '' as string,
    zIndexSeed: BASE_Z_INDEX,
  }),
  getters: {
    activeWindow: (state) => state.windows.find((item) => item.id === state.activeId) || null,
  },
  actions: {
    getTopVisibleWindow() {
      return [...this.windows]
        .filter((item) => !item.hidden)
        .sort((a, b) => b.zIndex - a.zIndex)[0]
    },
    resolveDefinition(target: string | ToolWindowDefinition, options?: OpenToolWindowOptions) {
      const baseDefinition =
        typeof target === 'string' ? getToolDefinition(target) : target

      if (!baseDefinition) {
        return null
      }

      return toRuntimeDefinition(baseDefinition, options)
    },
    focusWindow(id: string) {
      const target = this.windows.find((item) => item.id === id)
      if (!target || target.hidden) return

      this.zIndexSeed += 1
      target.zIndex = this.zIndexSeed
      this.activeId = id
    },
    openWindow(target: string | ToolWindowDefinition, options?: OpenToolWindowOptions) {
      const definition = this.resolveDefinition(target, options)
      if (!definition) {
        return null
      }

      const existing = definition.singleton
        ? this.windows.find((item) => item.key === definition.key)
        : undefined

      if (existing) {
        existing.title = definition.title
        if (definition.src && definition.src !== existing.src) {
          existing.src = definition.src
        }
        existing.hidden = false
        if (options?.mode && options.mode !== existing.mode) {
          this.setWindowMode(existing.id, options.mode)
        }
        this.focusWindow(existing.id)
        return existing.id
      }

      const windowRect = createCenteredRect(
        definition.defaultWidth,
        definition.defaultHeight,
        definition.minWidth,
        definition.minHeight
      )

      this.zIndexSeed += 1
      const id = `${definition.key}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const mode = definition.defaultMode || 'fullscreen'
      const instance: ToolWindowInstance = {
        ...definition,
        id,
        hidden: false,
        mode,
        zIndex: this.zIndexSeed,
        refreshKey: 0,
        lastWindowRect: windowRect,
        ...(mode === 'fullscreen'
          ? {
              x: 0,
              y: 0,
              width: getViewportSize().width,
              height: getViewportSize().height,
            }
          : windowRect),
      }

      this.windows.push(instance)
      this.activeId = id
      return id
    },
    hideWindow(id: string) {
      const target = this.windows.find((item) => item.id === id)
      if (!target || target.hidden) return

      target.hidden = true
      if (this.activeId === id) {
        this.activeId = this.getTopVisibleWindow()?.id || ''
      }
    },
    closeWindow(id: string) {
      const index = this.windows.findIndex((item) => item.id === id)
      if (index === -1) return

      this.windows.splice(index, 1)
      if (this.activeId === id) {
        this.activeId = this.getTopVisibleWindow()?.id || ''
      }
    },
    closeAllWindows() {
      this.windows = []
      this.activeId = ''
    },
    refreshWindow(id: string) {
      const target = this.windows.find((item) => item.id === id)
      if (!target) return
      target.refreshKey += 1
    },
    setWindowMode(id: string, mode: ToolWindowMode) {
      const target = this.windows.find((item) => item.id === id)
      if (!target || target.mode === mode) return

      if (mode === 'fullscreen') {
        target.lastWindowRect = clampRect(
          {
            x: target.x,
            y: target.y,
            width: target.width,
            height: target.height,
          },
          target.minWidth || 920,
          target.minHeight || 600
        )
        const viewport = getViewportSize()
        target.mode = 'fullscreen'
        target.x = 0
        target.y = 0
        target.width = viewport.width
        target.height = viewport.height
      } else {
        const nextRect = clampRect(
          target.lastWindowRect ||
            createCenteredRect(
              target.defaultWidth,
              target.defaultHeight,
              target.minWidth,
              target.minHeight
            ),
          target.minWidth || 920,
          target.minHeight || 600
        )
        target.mode = 'window'
        target.x = nextRect.x
        target.y = nextRect.y
        target.width = nextRect.width
        target.height = nextRect.height
      }

      this.focusWindow(id)
    },
    toggleWindowMode(id: string) {
      const target = this.windows.find((item) => item.id === id)
      if (!target) return
      this.setWindowMode(id, target.mode === 'fullscreen' ? 'window' : 'fullscreen')
    },
    updateWindowRect(id: string, rectPatch: Partial<ToolWindowRect>) {
      const target = this.windows.find((item) => item.id === id)
      if (!target || target.mode !== 'window') return

      const nextRect = clampRect(
        {
          x: rectPatch.x ?? target.x,
          y: rectPatch.y ?? target.y,
          width: rectPatch.width ?? target.width,
          height: rectPatch.height ?? target.height,
        },
        target.minWidth || 920,
        target.minHeight || 600
      )

      target.x = nextRect.x
      target.y = nextRect.y
      target.width = nextRect.width
      target.height = nextRect.height
      target.lastWindowRect = nextRect
    },
    syncViewport() {
      const viewport = getViewportSize()
      this.windows.forEach((item) => {
        if (item.mode === 'fullscreen') {
          item.x = 0
          item.y = 0
          item.width = viewport.width
          item.height = viewport.height
          return
        }

        const nextRect = clampRect(
          item.lastWindowRect || {
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
          },
          item.minWidth || 920,
          item.minHeight || 600
        )

        item.x = nextRect.x
        item.y = nextRect.y
        item.width = nextRect.width
        item.height = nextRect.height
        item.lastWindowRect = nextRect
      })
    },
    openWindowInNewTab(id: string) {
      const target = this.windows.find((item) => item.id === id)
      if (!target?.src) return
      window.open(target.src, '_blank', 'noopener,noreferrer')
    },
  },
})

export const useToolWindowStoreWithOut = () => useToolWindowStore(store)
