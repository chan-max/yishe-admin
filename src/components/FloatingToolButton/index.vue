<script setup lang="ts">
import { ref } from 'vue'
import ToolPanel from './ToolPanel.vue'
import ToolContainer from './ToolContainer.vue'

defineOptions({ name: 'FloatingToolButton' })

const isPanelOpen = ref(false)
const activeTools = ref<string[]>([])

const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value
}

const closePanel = () => {
  isPanelOpen.value = false
}

const handleOpenTool = (toolId: string) => {
  if (!activeTools.value.includes(toolId)) {
    activeTools.value.push(toolId)
  }
  closePanel()
}

const handleCloseTool = (toolId: string) => {
  activeTools.value = activeTools.value.filter(id => id !== toolId)
}
</script>

<template>
  <teleport to="body">
    <div
      class="floating-tool-btn"
      :class="{ 'is-open': isPanelOpen }"
      @click="togglePanel"
      title="工具箱"
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
      </svg>
    </div>

    <ToolPanel
      :visible="isPanelOpen"
      @close="closePanel"
      @open-tool="handleOpenTool"
    />

    <ToolContainer
      v-for="toolId in activeTools"
      :key="toolId"
      :tool-id="toolId"
      @close="handleCloseTool"
    />
  </teleport>
</template>

<style scoped lang="scss">
.floating-tool-btn {
  position: fixed;
  left: 18px;
  bottom: 18px;
  z-index: 9999999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #1d1d1f;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #000;
    color: #fff;
  }

  &.is-open {
    background: #555;
  }

  svg {
    width: 16px;
    height: 16px;
  }
}
</style>
