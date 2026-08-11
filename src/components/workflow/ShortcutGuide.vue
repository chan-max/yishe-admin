<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

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
    title="键盘快捷键"
    width="520px"
    align-center
    :close-on-click-modal="true"
    @update:model-value="handleClose"
    class="shortcut-guide"
  >
    <div class="sg">
      <div class="sg__platform">
        <el-tag size="small" :type="isMac ? 'primary' : 'info'">
          {{ isMac ? 'macOS' : 'Windows / Linux' }}
        </el-tag>
        <span class="sg__platform-hint">自动检测当前系统</span>
      </div>

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
  </el-dialog>
</template>

<style scoped lang="scss">
.sg {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sg__platform {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sg__platform-hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.sg__group {
  border: 1px solid var(--app-content-border-color, rgb(255 255 255 / 8%));
  border-radius: 6px;
  overflow: hidden;
}

.sg__group-title {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  background: color-mix(in srgb, var(--el-text-color-secondary) 5%, transparent);
  border-bottom: 1px solid var(--app-content-border-color, rgb(255 255 255 / 4%));
}

.sg__list {
  display: flex;
  flex-direction: column;
}

.sg__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--app-content-border-color, rgb(255 255 255 / 4%));

  &:last-child {
    border-bottom: none;
  }
}

.sg__desc {
  font-size: 12px;
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
  min-width: 24px;
  height: 22px;
  padding: 0 6px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  background: color-mix(in srgb, var(--el-text-color-secondary) 10%, transparent);
  border: 1px solid var(--app-content-border-color, rgb(255 255 255 / 12%));
  border-radius: 4px;
  box-shadow: 0 1px 0 color-mix(in srgb, var(--el-text-color-secondary) 15%, transparent);
}

.sg__plus {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}
</style>
