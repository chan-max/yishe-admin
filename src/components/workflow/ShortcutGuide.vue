<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
const mod = isMac ? '⌘' : 'Ctrl'

const shortcuts = [
  { category: '通用操作', items: [
    { keys: ['S'], desc: '保存工作流', mod: true },
    { keys: ['Z'], desc: '撤销', mod: true },
    { keys: ['Y'], desc: '重做', mod: true },
    { keys: ['?'], desc: '显示快捷键帮助' },
  ]},
  { category: '节点操作', items: [
    { keys: ['Delete'], desc: '删除选中节点/连线' },
    { keys: ['Backspace'], desc: '删除选中节点/连线' },
    { keys: ['C'], desc: '复制选中节点', mod: true },
    { keys: ['V'], desc: '粘贴节点', mod: true },
    { keys: ['D'], desc: '复制选中节点（快速）', mod: true },
  ]},
  { category: '视图操作', items: [
    { keys: ['+'], desc: '放大画布', mod: true },
    { keys: ['-'], desc: '缩小画布', mod: true },
    { keys: ['0'], desc: '重置缩放', mod: true },
    { keys: ['F'], desc: '适应画布到视图' },
    { keys: ['Space'], desc: '拖拽画布（按住）' },
  ]},
  { category: '运行操作', items: [
    { keys: ['R'], desc: '运行工作流', mod: true },
    { keys: ['Esc'], desc: '取消选中 / 关闭弹窗' },
  ]},
]

const handleClose = () => {
  emit('update:visible', false)
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    handleClose()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <el-dialog
    :model-value="visible"
    :show-close="true"
    :close-on-click-modal="true"
    align-center
    @update:model-value="handleClose"
    class="shortcut-guide"
  >
    <div class="sg">
      <div class="sg__header">
        <div class="sg__title">键盘快捷键</div>
        <el-tag size="small" type="info">
          {{ isMac ? 'macOS' : 'Windows / Linux' }}
        </el-tag>
      </div>

      <div class="sg__grid">
        <div v-for="group in shortcuts" :key="group.category" class="sg__group">
          <div class="sg__group-title">{{ group.category }}</div>
          <div class="sg__list">
            <div v-for="(item, idx) in group.items" :key="idx" class="sg__item">
              <span class="sg__desc">{{ item.desc }}</span>
              <span class="sg__keys">
                <template v-if="item.mod">
                  <kbd class="sg__kbd">{{ mod }}</kbd>
                  <span class="sg__plus">+</span>
                </template>
                <kbd
                  v-for="(key, ki) in item.keys"
                  :key="ki"
                  class="sg__kbd"
                >{{ key }}</kbd>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
:deep(.el-dialog) {
  width: 100% !important;
  max-width: 100%;
  margin: 0;
  border-radius: 0;
}

:deep(.el-dialog__body) {
  padding: 32px;
}

:deep(.el-dialog__header) {
  padding: 24px 32px 0;
}

.sg {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sg__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sg__title {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.sg__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.sg__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sg__group-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--app-content-border-color, rgb(255 255 255 / 8%));
}

.sg__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sg__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.sg__desc {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.sg__keys {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sg__kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 24px;
  padding: 0 8px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  background: color-mix(in srgb, var(--el-text-color-secondary) 8%, transparent);
  border-radius: 4px;
}

.sg__plus {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
