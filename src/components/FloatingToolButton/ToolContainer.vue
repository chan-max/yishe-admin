<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import Calculator from './tools/Calculator.vue'

defineOptions({ name: 'ToolContainer' })

const props = defineProps<{
  toolId: string
}>()

const emit = defineEmits<{
  close: [toolId: string]
}>()

const toolRegistry: Record<string, { name: string; component: any }> = {
  calculator: { name: '计算器', component: markRaw(Calculator) },
}

const tool = computed(() => toolRegistry[props.toolId])

const x = ref(window.innerWidth - 320)
const y = ref(window.innerHeight - 380)

// 拖拽逻辑
let dragging = false
let startX = 0
let startY = 0
let startLeft = 0
let startTop = 0

const el = ref<HTMLElement | null>(null)
const headerRef = ref<HTMLElement | null>(null)

const onMouseDown = (e: MouseEvent) => {
  dragging = true
  startX = e.clientX
  startY = e.clientY
  startLeft = x.value
  startTop = y.value
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

const onMouseMove = (e: MouseEvent) => {
  if (!dragging) return
  x.value = startLeft + (e.clientX - startX)
  y.value = startTop + (e.clientY - startY)
}

const onMouseUp = () => {
  dragging = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

const containerStyle = computed(() => ({
  left: `${x.value}px`,
  top: `${y.value}px`,
}))

const handleClose = () => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  emit('close', props.toolId)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="tool"
      ref="el"
      class="tool-container"
      :style="containerStyle"
    >
      <div ref="headerRef" class="tool-container__header" @mousedown="onMouseDown">
        <span class="tool-container__title">{{ tool.name }}</span>
        <button class="tool-container__close" @click="handleClose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="tool-container__content">
        <component :is="tool.component" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.tool-container {
  position: fixed;
  z-index: 9999999;
  width: 280px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.tool-container__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: grab;
  user-select: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);

  &:active {
    cursor: grabbing;
  }
}

.tool-container__title {
  font-size: 12px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.5);
}

.tool-container__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: rgba(0, 0, 0, 0.25);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: rgba(0, 0, 0, 0.6);
  }

  svg {
    width: 11px;
    height: 11px;
  }
}

.tool-container__content {
  padding: 12px;
}

:root.dark .tool-container {
  background: #1e1e1e;
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

:root.dark .tool-container__header {
  border-bottom-color: rgba(255, 255, 255, 0.04);
}

:root.dark .tool-container__title {
  color: rgba(255, 255, 255, 0.45);
}

:root.dark .tool-container__close {
  color: rgba(255, 255, 255, 0.25);

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.6);
  }
}
</style>
