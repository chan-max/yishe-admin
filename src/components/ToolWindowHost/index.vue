<script setup lang="ts">
import {
  CircleCloseFilled,
  CloseBold,
  FullScreen,
  Rank,
  RefreshRight,
  TopRight,
} from '@element-plus/icons-vue'
import type { ToolWindowInstance } from '@/types/toolWindow'
import { useToolWindowStore } from '@/store/modules/toolWindow'
import { defineAsyncComponent, markRaw, h, resolveDynamicComponent, type Component } from 'vue'

defineOptions({ name: 'ToolWindowHost' })

type ResizeDirection =
  | 'n'
  | 's'
  | 'e'
  | 'w'
  | 'ne'
  | 'nw'
  | 'se'
  | 'sw'

const WINDOW_PADDING = 12
const resizeDirections: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

const toolWindowStore = useToolWindowStore()
const windows = computed(() => [...toolWindowStore.windows].sort((a, b) => a.zIndex - b.zIndex))
const activeWindowId = computed(() => toolWindowStore.activeId)

const interactionState = reactive({
  active: false,
  type: 'idle' as 'idle' | 'drag' | 'resize',
  windowId: '',
  direction: '' as ResizeDirection | '',
  startX: 0,
  startY: 0,
  originRect: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  },
})

const getViewportBounds = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
})

const stopInteraction = () => {
  if (!interactionState.active) return
  interactionState.active = false
  interactionState.type = 'idle'
  interactionState.windowId = ''
  interactionState.direction = ''
  window.removeEventListener('mousemove', handlePointerMove)
  window.removeEventListener('mouseup', stopInteraction)
}

const handleDragMove = (event: MouseEvent) => {
  toolWindowStore.updateWindowRect(interactionState.windowId, {
    x: interactionState.originRect.x + (event.clientX - interactionState.startX),
    y: interactionState.originRect.y + (event.clientY - interactionState.startY),
  })
}

const startDrag = (windowItem: ToolWindowInstance, event: MouseEvent) => {
  if (windowItem.mode !== 'window') return

  const target = event.target as HTMLElement | null
  if (target?.closest('.tool-window-host__actions')) {
    return
  }

  toolWindowStore.focusWindow(windowItem.id)
  interactionState.active = true
  interactionState.type = 'drag'
  interactionState.windowId = windowItem.id
  interactionState.direction = ''
  interactionState.startX = event.clientX
  interactionState.startY = event.clientY
  interactionState.originRect = {
    x: windowItem.x,
    y: windowItem.y,
    width: windowItem.width,
    height: windowItem.height,
  }
  window.addEventListener('mousemove', handlePointerMove)
  window.addEventListener('mouseup', stopInteraction)
}

const startResize = (windowItem: ToolWindowInstance, direction: ResizeDirection, event: MouseEvent) => {
  if (windowItem.mode !== 'window') return

  toolWindowStore.focusWindow(windowItem.id)
  interactionState.active = true
  interactionState.type = 'resize'
  interactionState.windowId = windowItem.id
  interactionState.direction = direction
  interactionState.startX = event.clientX
  interactionState.startY = event.clientY
  interactionState.originRect = {
    x: windowItem.x,
    y: windowItem.y,
    width: windowItem.width,
    height: windowItem.height,
  }
  window.addEventListener('mousemove', handlePointerMove)
  window.addEventListener('mouseup', stopInteraction)
}

const handleResizeMove = (event: MouseEvent) => {
  const windowItem = toolWindowStore.windows.find((item) => item.id === interactionState.windowId)
  if (!windowItem) return

  const direction = interactionState.direction
  const deltaX = event.clientX - interactionState.startX
  const deltaY = event.clientY - interactionState.startY
  const viewport = getViewportBounds()
  const minWidth = windowItem.minWidth || 920
  const minHeight = windowItem.minHeight || 600
  const origin = interactionState.originRect
  const right = origin.x + origin.width
  const bottom = origin.y + origin.height

  let nextX = origin.x
  let nextY = origin.y
  let nextWidth = origin.width
  let nextHeight = origin.height

  if (direction.includes('e')) {
    nextWidth = Math.min(
      Math.max(origin.width + deltaX, minWidth),
      viewport.width - origin.x - WINDOW_PADDING
    )
  }

  if (direction.includes('s')) {
    nextHeight = Math.min(
      Math.max(origin.height + deltaY, minHeight),
      viewport.height - origin.y - WINDOW_PADDING
    )
  }

  if (direction.includes('w')) {
    const maxWidthFromLeft = right - WINDOW_PADDING
    nextWidth = Math.min(Math.max(origin.width - deltaX, minWidth), maxWidthFromLeft)
    nextX = right - nextWidth
  }

  if (direction.includes('n')) {
    const maxHeightFromTop = bottom - WINDOW_PADDING
    nextHeight = Math.min(Math.max(origin.height - deltaY, minHeight), maxHeightFromTop)
    nextY = bottom - nextHeight
  }

  toolWindowStore.updateWindowRect(windowItem.id, {
    x: nextX,
    y: nextY,
    width: nextWidth,
    height: nextHeight,
  })
}

const handlePointerMove = (event: MouseEvent) => {
  if (!interactionState.active || !interactionState.windowId) return

  if (interactionState.type === 'drag') {
    handleDragMove(event)
    return
  }

  if (interactionState.type === 'resize') {
    handleResizeMove(event)
  }
}

const onWindowMouseDown = (windowItem: ToolWindowInstance) => {
  toolWindowStore.focusWindow(windowItem.id)
}

const getWindowStyle = (windowItem: ToolWindowInstance) => {
  if (windowItem.mode === 'fullscreen') {
    return {
      zIndex: windowItem.zIndex,
    }
  }

  return {
    zIndex: windowItem.zIndex,
    left: `${windowItem.x}px`,
    top: `${windowItem.y}px`,
    width: `${windowItem.width}px`,
    height: `${windowItem.height}px`,
  }
}

const syncViewport = () => {
  toolWindowStore.syncViewport()
}

const getWindowHostLabel = (windowItem: ToolWindowInstance) => {
  if (windowItem.component) return ''

  if (!windowItem.src) return 'NO TARGET'

  try {
    return new URL(windowItem.src, window.location.origin).host
  } catch (error) {
    return 'INVALID TARGET'
  }
}

const toolComponentCache = new Map<string, Component>()

const resolveToolComponent = (windowItem: ToolWindowInstance) => {
  if (!windowItem.component) return null
  if (toolComponentCache.has(windowItem.key)) return toolComponentCache.get(windowItem.key)!

  const comp = typeof windowItem.component === 'function'
    ? defineAsyncComponent(windowItem.component)
    : resolveDynamicComponent(windowItem.component) as Component

  toolComponentCache.set(windowItem.key, markRaw(comp))
  return comp
}

const isDraggingWindow = (id: string) =>
  interactionState.active && interactionState.type === 'drag' && interactionState.windowId === id

const isResizingWindow = (id: string) =>
  interactionState.active && interactionState.type === 'resize' && interactionState.windowId === id

onMounted(() => {
  window.addEventListener('resize', syncViewport)
})

onBeforeUnmount(() => {
  stopInteraction()
  window.removeEventListener('resize', syncViewport)
})
</script>

<template>
  <teleport to="body">
    <div class="tool-window-host">
      <div
        v-for="windowItem in windows"
        :key="windowItem.id"
        class="tool-window-host__window"
        :class="{
          'is-fullscreen': windowItem.mode === 'fullscreen',
          'is-hidden': windowItem.hidden,
          'is-active': activeWindowId === windowItem.id,
          'is-dragging': isDraggingWindow(windowItem.id),
          'is-resizing': isResizingWindow(windowItem.id),
        }"
        :style="getWindowStyle(windowItem)"
        @mousedown="onWindowMouseDown(windowItem)"
        v-show="!windowItem.hidden"
      >
        <div v-if="windowItem.mode === 'fullscreen'" class="tool-window-host__backdrop" />

        <section class="tool-window-host__panel">
          <header class="tool-window-host__header" @mousedown="startDrag(windowItem, $event)">
            <div class="tool-window-host__title">
              <Icon :icon="windowItem.icon || 'ep:monitor'" class="tool-window-host__title-icon" />
              <span class="tool-window-host__title-text">{{ windowItem.title }}</span>
              <span class="tool-window-host__title-host">{{ getWindowHostLabel(windowItem) }}</span>
            </div>

            <div class="tool-window-host__actions">
              <div class="tool-window-host__actions-group">
                <button
                  type="button"
                  class="tool-window-host__action is-danger-soft"
                  title="彻底关闭"
                  aria-label="彻底关闭"
                  @click="toolWindowStore.closeWindow(windowItem.id)"
                >
                  <el-icon><CircleCloseFilled /></el-icon>
                </button>

                <button
                  type="button"
                  class="tool-window-host__action"
                  title="刷新"
                  aria-label="刷新"
                  @click="toolWindowStore.refreshWindow(windowItem.id)"
                >
                  <el-icon><RefreshRight /></el-icon>
                </button>

                <button
                  v-if="windowItem.allowFullscreen !== false"
                  type="button"
                  class="tool-window-host__action"
                  :title="windowItem.mode === 'fullscreen' ? '切换为浮窗' : '切换为全屏'"
                  :aria-label="windowItem.mode === 'fullscreen' ? '切换为浮窗' : '切换为全屏'"
                  @click="toolWindowStore.toggleWindowMode(windowItem.id)"
                >
                  <el-icon>
                    <component :is="windowItem.mode === 'fullscreen' ? Rank : FullScreen" />
                  </el-icon>
                </button>

                <button
                  v-if="windowItem.allowNewTab !== false && !windowItem.component"
                  type="button"
                  class="tool-window-host__action"
                  title="新窗口打开"
                  aria-label="新窗口打开"
                  @click="toolWindowStore.openWindowInNewTab(windowItem.id)"
                >
                  <el-icon><TopRight /></el-icon>
                </button>
              </div>

              <div class="tool-window-host__actions-group tool-window-host__actions-group--edge">
                <button
                  type="button"
                  class="tool-window-host__action is-danger"
                  title="隐藏"
                  aria-label="隐藏"
                  @click="toolWindowStore.hideWindow(windowItem.id)"
                >
                  <el-icon><CloseBold /></el-icon>
                </button>
              </div>
            </div>
          </header>

          <div class="tool-window-host__body">
            <!-- Vue 组件工具 -->
            <div v-if="windowItem.component" class="tool-window-host__component-wrap">
              <component :is="resolveToolComponent(windowItem)" :key="`${windowItem.id}-${windowItem.refreshKey}`" />
            </div>

            <!-- iframe 工具 -->
            <iframe
              v-else-if="windowItem.src"
              :key="`${windowItem.id}-${windowItem.refreshKey}`"
              class="tool-window-host__iframe"
              :src="windowItem.src"
              frameborder="0"
              allowfullscreen="true"
              webkitallowfullscreen="true"
              mozallowfullscreen="true"
            />
            <div v-else class="tool-window-host__empty">
              <Icon icon="ep:monitor" class="tool-window-host__empty-icon" />
              <div class="tool-window-host__empty-title">TARGET NOT CONFIGURED</div>
              <div class="tool-window-host__empty-desc">请先在环境变量中配置工具地址后再打开</div>
            </div>

            <div
              v-if="interactionState.active && interactionState.windowId === windowItem.id"
              class="tool-window-host__drag-mask"
              :class="{
                'is-resize-mask': isResizingWindow(windowItem.id),
              }"
            />
          </div>

          <template v-if="windowItem.mode === 'window'">
            <div
              v-for="direction in resizeDirections"
              :key="direction"
              class="tool-window-host__resize-handle"
              :class="`is-${direction}`"
              @mousedown.stop.prevent="startResize(windowItem, direction, $event)"
            />
          </template>
        </section>
      </div>
    </div>
  </teleport>
</template>

<style scoped lang="scss">
.tool-window-host {
  position: fixed;
  inset: 0;
  z-index: 4000;
  pointer-events: none;
}

.tool-window-host__window {
  position: fixed;
  pointer-events: auto;
}

.tool-window-host__window.is-hidden {
  pointer-events: none;
}

.tool-window-host__window.is-fullscreen {
  inset: 0;
}

.tool-window-host__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(3, 7, 18, 0.66);
}

.tool-window-host__panel {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #0a0f16;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.tool-window-host__window.is-fullscreen .tool-window-host__panel {
  border-radius: 0;
  border: none;
  box-shadow: none;
}

.tool-window-host__window:not(.is-fullscreen) .tool-window-host__panel {
  border-radius: 8px;
}

.tool-window-host__window.is-active .tool-window-host__panel {
  border-color: rgba(255, 255, 255, 0.15);
}

.tool-window-host__window.is-dragging .tool-window-host__panel,
.tool-window-host__window.is-resizing .tool-window-host__panel {
  transition: none;
}

.tool-window-host__header {
  display: flex;
  min-height: 32px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 6px 0 8px;
  border-bottom: 1px solid #16202d;
  background: #0c121a;
  user-select: none;
}

.tool-window-host__window:not(.is-fullscreen) .tool-window-host__header {
  cursor: move;
}

.tool-window-host__title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
}

.tool-window-host__title-icon {
  flex-shrink: 0;
  font-size: 9px;
  color: #5ebf87;
  opacity: 0.9;
}

.tool-window-host__title-text {
  overflow: hidden;
  font-family:
    'Cascadia Code',
    'Consolas',
    'Courier New',
    monospace;
  font-size: 9px;
  font-weight: 400;
  color: #dce5f2;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-window-host__title-host {
  overflow: hidden;
  flex-shrink: 1;
  max-width: min(22vw, 180px);
  font-family:
    'Cascadia Code',
    'Consolas',
    'Courier New',
    monospace;
  font-size: 7px;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.02em;
  color: #67788f;
}

.tool-window-host__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
}

.tool-window-host__actions-group {
  display: flex;
  align-items: center;
  gap: 1px;
}

.tool-window-host__actions-group--edge {
  position: relative;
  margin-left: 2px;
  padding-left: 6px;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 1px;
    background: rgba(76, 92, 114, 0.38);
  }
}

.tool-window-host__action {
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  color: #8ea5bf;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;

  :deep(.el-icon) {
    font-size: 11px;
  }

  &:hover {
    border-color: rgba(103, 214, 151, 0.14);
    background: #101824;
    color: #dce8f7;
  }

  &.is-danger:hover {
    border-color: rgba(239, 68, 68, 0.18);
    background: #241217;
    color: #ff8f8f;
  }

  &.is-danger-soft:hover {
    border-color: rgba(244, 114, 182, 0.18);
    background: #23131d;
    color: #ffb0d5;
  }
}

.tool-window-host__body {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 2px;
  background: #080d14;
}

.tool-window-host__window.is-fullscreen .tool-window-host__body {
  padding: 0;
}

.tool-window-host__component-wrap {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.tool-window-host__iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
  border-radius: 2px;
}

.tool-window-host__window.is-fullscreen .tool-window-host__iframe {
  border-radius: 0;
}

.tool-window-host__empty {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background:
    radial-gradient(circle at top, rgba(57, 173, 111, 0.1), transparent 34%),
    #0b1119;
  border-radius: 4px;
  text-align: center;
}

.tool-window-host__empty-icon {
  font-size: 24px;
  color: #67d697;
}

.tool-window-host__empty-title {
  font-size: 14px;
  font-weight: 600;
  color: #eef5ff;
}

.tool-window-host__empty-desc {
  font-size: 12px;
  color: #7d92ab;
}

.tool-window-host__drag-mask {
  position: absolute;
  inset: 0;
  z-index: 2;
  cursor: move;
}

.tool-window-host__drag-mask.is-resize-mask {
  cursor: default;
}

.tool-window-host__resize-handle {
  position: absolute;
  z-index: 4;
}

.tool-window-host__resize-handle.is-n,
.tool-window-host__resize-handle.is-s {
  left: 10px;
  right: 10px;
  height: 6px;
}

.tool-window-host__resize-handle.is-e,
.tool-window-host__resize-handle.is-w {
  top: 10px;
  bottom: 10px;
  width: 6px;
}

.tool-window-host__resize-handle.is-n {
  top: -3px;
  cursor: ns-resize;
}

.tool-window-host__resize-handle.is-s {
  bottom: -3px;
  cursor: ns-resize;
}

.tool-window-host__resize-handle.is-e {
  right: -3px;
  cursor: ew-resize;
}

.tool-window-host__resize-handle.is-w {
  left: -3px;
  cursor: ew-resize;
}

.tool-window-host__resize-handle.is-ne,
.tool-window-host__resize-handle.is-nw,
.tool-window-host__resize-handle.is-se,
.tool-window-host__resize-handle.is-sw {
  width: 10px;
  height: 10px;
}

.tool-window-host__resize-handle.is-ne {
  top: -3px;
  right: -3px;
  cursor: nesw-resize;
}

.tool-window-host__resize-handle.is-nw {
  top: -3px;
  left: -3px;
  cursor: nwse-resize;
}

.tool-window-host__resize-handle.is-se {
  right: -3px;
  bottom: -3px;
  cursor: nwse-resize;
}

.tool-window-host__resize-handle.is-sw {
  left: -3px;
  bottom: -3px;
  cursor: nesw-resize;
}

@media (max-width: 900px) {
  .tool-window-host__title-host {
    display: none;
  }
}
</style>
