<template>
  <div
    ref="containerRef"
    class="split-pane"
    :class="[`split-pane--${direction}`, { 'split-pane--resizing': isResizing }]"
  >
    <!-- 左/上面板 -->
    <div
      class="split-pane__panel"
      :style="{ [sizeProp]: leftSize + '%' }"
    >
      <slot name="left" />
    </div>

    <!-- 拖拽分隔条 -->
    <div
      class="split-pane__divider"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
    >
      <div class="split-pane__divider-line" />
    </div>

    <!-- 右/下面板 -->
    <div
      class="split-pane__panel"
      :style="{ [sizeProp]: 100 - leftSize + '%' }"
    >
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'

interface Props {
  direction?: 'horizontal' | 'vertical'
  defaultSize?: number // 左侧占比 0-100
  minSize?: number // 最小占比
  maxSize?: number // 最大占比
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'horizontal',
  defaultSize: 50,
  minSize: 20,
  maxSize: 80,
})

const containerRef = ref<HTMLElement>()
const leftSize = ref(props.defaultSize)
const isResizing = ref(false)
const startPos = ref(0)
const startSize = ref(0)

const sizeProp = computed(() =>
  props.direction === 'horizontal' ? 'width' : 'height',
)

function handleMouseDown(e: MouseEvent) {
  e.preventDefault()
  startPos.value = props.direction === 'horizontal' ? e.clientX : e.clientY
  startSize.value = leftSize.value
  isResizing.value = true

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.body.style.cursor = props.direction === 'horizontal' ? 'col-resize' : 'row-resize'
  document.body.style.userSelect = 'none'
}

function handleMouseMove(e: MouseEvent) {
  if (!containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  const currentPos = props.direction === 'horizontal' ? e.clientX : e.clientY
  const containerSize = props.direction === 'horizontal' ? rect.width : rect.height
  const delta = currentPos - startPos.value
  const deltaPercent = (delta / containerSize) * 100

  let newSize = startSize.value + deltaPercent
  newSize = Math.max(props.minSize, Math.min(props.maxSize, newSize))
  leftSize.value = newSize
}

function handleMouseUp() {
  isResizing.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  startPos.value = props.direction === 'horizontal' ? touch.clientX : touch.clientY
  startSize.value = leftSize.value
  isResizing.value = true

  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd)
}

function handleTouchMove(e: TouchEvent) {
  e.preventDefault()
  if (!containerRef.value) return

  const touch = e.touches[0]
  const rect = containerRef.value.getBoundingClientRect()
  const currentPos = props.direction === 'horizontal' ? touch.clientX : touch.clientY
  const containerSize = props.direction === 'horizontal' ? rect.width : rect.height
  const delta = currentPos - startPos.value
  const deltaPercent = (delta / containerSize) * 100

  let newSize = startSize.value + deltaPercent
  newSize = Math.max(props.minSize, Math.min(props.maxSize, newSize))
  leftSize.value = newSize
}

function handleTouchEnd() {
  isResizing.value = false
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
})
</script>

<style scoped>
.split-pane {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.split-pane--vertical {
  flex-direction: column;
}

.split-pane__panel {
  position: relative;
  overflow: hidden;
  flex: 0 0 auto;
}

.split-pane__divider {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.split-pane--horizontal .split-pane__divider {
  width: 6px;
  margin: 0 -3px;
  cursor: col-resize;
}

.split-pane--vertical .split-pane__divider {
  height: 6px;
  margin: -3px 0;
  cursor: row-resize;
}

.split-pane__divider-line {
  background: var(--el-border-color);
  transition: background 0.15s;
}

.split-pane--horizontal .split-pane__divider-line {
  width: 1px;
  height: 100%;
}

.split-pane--vertical .split-pane__divider-line {
  width: 100%;
  height: 1px;
}

.split-pane__divider:hover .split-pane__divider-line,
.split-pane--resizing .split-pane__divider-line {
  background: var(--el-color-primary);
}

.split-pane--horizontal .split-pane__divider:hover .split-pane__divider-line,
.split-pane--horizontal.split-pane--resizing .split-pane__divider-line {
  width: 2px;
}

.split-pane--vertical .split-pane__divider:hover .split-pane__divider-line,
.split-pane--vertical.split-pane--resizing .split-pane__divider-line {
  height: 2px;
}

.split-pane--resizing {
  pointer-events: none;
}
</style>
