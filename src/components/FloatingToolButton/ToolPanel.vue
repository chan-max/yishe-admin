<script setup lang="ts">
import { ref, markRaw } from 'vue'
import Calculator from './tools/Calculator.vue'

defineOptions({ name: 'ToolPanel' })

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  openTool: [toolId: string]
}>()

interface ToolItem {
  id: string
  name: string
  icon: string
  component: any
}

const tools: ToolItem[] = [
  {
    id: 'calculator',
    name: '计算器',
    icon: '⊞',
    component: markRaw(Calculator),
  },
]

const handleClose = () => {
  emit('close')
}

const handleOpen = (tool: ToolItem) => {
  emit('openTool', tool.id)
}
</script>

<template>
  <Transition name="tool-panel">
    <div v-if="visible" class="tool-panel" @click.self="handleClose">
      <div class="tool-panel__inner">
        <div
          v-for="tool in tools"
          :key="tool.id"
          class="tool-item"
          @click="handleOpen(tool)"
        >
          <span class="tool-item__icon">{{ tool.icon }}</span>
          <span class="tool-item__name">{{ tool.name }}</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.tool-panel {
  position: fixed;
  left: 16px;
  bottom: 56px;
  z-index: 999999;
}

.tool-panel__inner {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06);
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  &__icon {
    font-size: 16px;
    line-height: 1;
    opacity: 0.7;
  }

  &__name {
    font-size: 13px;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.8);
    letter-spacing: -0.01em;
  }
}

.tool-panel-enter-active,
.tool-panel-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.tool-panel-enter-from,
.tool-panel-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

// 暗色主题
:root.dark .tool-panel__inner {
  background: rgba(30, 30, 30, 0.95);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.3);
}

:root.dark .tool-item {
  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  &__name {
    color: rgba(255, 255, 255, 0.85);
  }
}
</style>
