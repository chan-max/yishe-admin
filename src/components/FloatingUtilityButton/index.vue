<template>
  <div class="floating-utility-button">
    <!-- 主悬浮按钮 -->
    <el-button
      :class="['main-fab', { 'is-open': isMenuOpen }]"
      type="primary"
      size="large"
      circle
      @click="toggleMenu"
    >
      <el-icon>
        <Tools v-if="!isMenuOpen" />
        <Close v-else />
      </el-icon>
    </el-button>

    <!-- 功能菜单 -->
    <transition name="menu-fade">
      <div v-if="isMenuOpen" class="utility-menu">
        <div class="menu-item" @click="openPhashComparison">
          <el-icon><Document /></el-icon>
          <span>Phash 对比</span>
        </div>
        <div class="menu-item" @click="openCalculator">
          <el-icon><DataAnalysis /></el-icon>
          <span>计算器</span>
        </div>
        <div class="menu-item" @click="openColorPicker">
          <el-icon><Brush /></el-icon>
          <span>颜色选择器</span>
        </div>
        <div class="menu-item" @click="openTextTools">
          <el-icon><EditPen /></el-icon>
          <span>文本工具</span>
        </div>
      </div>
    </transition>

    <!-- 功能组件 -->
    <PhashComparison v-model="phashDialogVisible" />
    <Calculator v-model="calculatorDialogVisible" />
    <ColorPicker v-model="colorPickerDialogVisible" />
    <TextTools v-model="textToolsDialogVisible" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Tools, Close, Document, DataAnalysis, Brush, EditPen } from '@element-plus/icons-vue'
import PhashComparison from './PhashComparison.vue'
import Calculator from './Calculator.vue'
import ColorPicker from './ColorPicker.vue'
import TextTools from './TextTools.vue'

defineOptions({ name: 'FloatingUtilityButton' })

// 菜单状态
const isMenuOpen = ref(false)

// 各功能组件的显示状态
const phashDialogVisible = ref(false)
const calculatorDialogVisible = ref(false)
const colorPickerDialogVisible = ref(false)
const textToolsDialogVisible = ref(false)

// 方法
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const openPhashComparison = () => {
  phashDialogVisible.value = true
  closeMenu()
}

const openCalculator = () => {
  calculatorDialogVisible.value = true
  closeMenu()
}

const openColorPicker = () => {
  colorPickerDialogVisible.value = true
  closeMenu()
}

const openTextTools = () => {
  textToolsDialogVisible.value = true
  closeMenu()
}

// 点击外部关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.floating-utility-button')) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.floating-utility-button {
  position: fixed;
  bottom: 60px; 
  left: 16px;
  z-index: 99999;

  .main-fab {
    width: 56px;
    height: 56px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    &.is-open {
      transform: rotate(45deg);
    }
  }

  .utility-menu {
    position: absolute;
    bottom: 70px;
    left: 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    padding: 8px;
    min-width: 160px;

    .menu-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      cursor: pointer;
      border-radius: 6px;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: #f5f7fa;
      }

      .el-icon {
        margin-right: 8px;
        font-size: 16px;
        color: #606266;
      }

      span {
        font-size: 14px;
        color: #303133;
      }
    }
  }
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.3s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}



// 暗色主题适配
.dark {
  .floating-utility-button {
    .utility-menu {
      background: #2d2d2d;
      border: 1px solid #414243;

      .menu-item {
        &:hover {
          background-color: #3a3a3a;
        }

        .el-icon {
          color: #a3a6ad;
        }

        span {
          color: #e5eaf3;
        }
      }
    }
  }


}
</style>
