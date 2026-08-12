<template>
  <div
    ref="containerRef"
    class="split-pane"
    :class="[direction, { 'is-resizing': dragging }]"
    @pointermove="onDividerPointerMove"
    @pointerup="onDividerPointerUp"
    @pointercancel="onDividerPointerUp"
  >
    <div class="split-pane__item" :style="{ [sizeProp]: displaySize + '%' }">
      <slot name="left" />
    </div>

    <div class="split-pane__divider" @pointerdown="onDividerPointerDown" />

    <div class="split-pane__item" :style="{ [sizeProp]: 100 - displaySize + '%' }">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"

const props = withDefaults(
  defineProps<{
    direction?: "horizontal" | "vertical"
    /** 左/上面板占比 0-100 */
    size?: number
    minSize?: number
    maxSize?: number
  }>(),
  {
    direction: "horizontal",
    size: 50,
    minSize: 20,
    maxSize: 80,
  },
)

const emit = defineEmits<{ (e: "update:size", size: number): void }>()

const containerRef = ref<HTMLElement>()
const displaySize = ref(props.size)
const dragging = ref(false)

let pointerId = -1
let startPos = 0
let startSize = 0

const sizeProp = computed(() =>
  props.direction === "horizontal" ? "width" : "height",
)

watch(
  () => props.size,
  (value) => {
    if (!dragging.value) displaySize.value = value
  },
)

const clamp = (value: number) =>
  Math.max(props.minSize, Math.min(props.maxSize, value))

function onDividerPointerDown(e: PointerEvent) {
  if (!containerRef.value) return
  e.preventDefault()
  dragging.value = true
  pointerId = e.pointerId
  startPos = props.direction === "horizontal" ? e.clientX : e.clientY
  startSize = displaySize.value
  // 捕获指针，后续 move/up 事件重定向到容器，拖动到容器外也不会丢失
  containerRef.value.setPointerCapture(pointerId)
}

function onDividerPointerMove(e: PointerEvent) {
  if (!dragging.value || pointerId !== e.pointerId || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const containerSize = props.direction === "horizontal" ? rect.width : rect.height
  if (containerSize === 0) return
  const currentPos = props.direction === "horizontal" ? e.clientX : e.clientY
  const next = clamp(startSize + ((currentPos - startPos) / containerSize) * 100)
  displaySize.value = next
  emit("update:size", next)
}

function onDividerPointerUp(e: PointerEvent) {
  if (pointerId !== e.pointerId) return
  dragging.value = false
  pointerId = -1
  displaySize.value = props.size
}
</script>

<style scoped>
.split-pane {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.split-pane.vertical {
  flex-direction: column;
}

.split-pane__item {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  flex: 0 0 auto;
}

.split-pane__divider {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  background: var(--el-border-color);
  transition: background 0.15s;
}

.split-pane.horizontal .split-pane__divider {
  width: 5px;
  cursor: col-resize;
  margin: 0 -2px;
}

.split-pane.vertical .split-pane__divider {
  height: 5px;
  cursor: row-resize;
  margin: -2px 0;
}

.split-pane__divider:hover {
  background: var(--el-color-primary);
}

.split-pane.is-resizing,
.split-pane.is-resizing * {
  cursor: col-resize;
}

.split-pane.is-resizing {
  user-select: none;
}

.split-pane.is-resizing .split-pane__divider {
  background: var(--el-color-primary);
}
</style>
