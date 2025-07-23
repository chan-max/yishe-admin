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
        <Plus v-if="!isMenuOpen" />
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

    <!-- Phash 对比弹窗 -->
    <el-dialog
      v-model="phashDialogVisible"
      title="Phash 相似度对比"
      width="600px"
      :before-close="handlePhashDialogClose"
    >
      <div class="phash-comparison">
        <div class="input-group">
          <label>Phash 1:</label>
          <el-input
            v-model="phash1"
            placeholder="请输入第一个 phash 值"
            type="textarea"
            :rows="3"
          />
        </div>
        <div class="input-group">
          <label>Phash 2:</label>
          <el-input
            v-model="phash2"
            placeholder="请输入第二个 phash 值"
            type="textarea"
            :rows="3"
          />
        </div>
        <div class="comparison-result" v-if="comparisonResult !== null">
          <h4>对比结果:</h4>
          <p>编辑距离: <strong>{{ comparisonResult.distance }}</strong></p>
          <p>相似度: <strong>{{ comparisonResult.similarity }}%</strong></p>
          <p>
            相似程度: 
            <el-tag :type="getSimilarityTagType(comparisonResult.similarity)">
              {{ getSimilarityLevel(comparisonResult.similarity) }}
            </el-tag>
          </p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="clearPhashInputs">清空</el-button>
          <el-button type="primary" @click="comparePhash" :disabled="!canCompare">
            对比
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Close, Document, DataAnalysis, Brush, EditPen } from '@element-plus/icons-vue'
// import leven from 'leven'

defineOptions({ name: 'FloatingUtilityButton' })

// 菜单状态
const isMenuOpen = ref(false)

// Phash 对比相关
const phashDialogVisible = ref(false)
const phash1 = ref('')
const phash2 = ref('')
const comparisonResult = ref<{
  distance: number
  similarity: number
} | null>(null)

// 计算属性
const canCompare = computed(() => {
  return phash1.value.trim() !== '' && phash2.value.trim() !== ''
})

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
  ElMessage.info('计算器功能开发中...')
  closeMenu()
}

const openColorPicker = () => {
  ElMessage.info('颜色选择器功能开发中...')
  closeMenu()
}

const openTextTools = () => {
  ElMessage.info('文本工具功能开发中...')
  closeMenu()
}

const comparePhash = () => {
  if (!canCompare.value) return

  const hash1 = phash1.value.trim()
  const hash2 = phash2.value.trim()

  try {
    // 使用 leven 计算编辑距离
    const distance = leven(hash1, hash2)
    
    // 计算相似度百分比
    const maxLength = Math.max(hash1.length, hash2.length)
    const similarity = Math.round(((maxLength - distance) / maxLength) * 100)

    comparisonResult.value = {
      distance,
      similarity
    }

    ElMessage.success('对比完成！')
  } catch (error) {
    ElMessage.error('对比过程中出现错误')
    console.error('Phash comparison error:', error)
  }
}

const clearPhashInputs = () => {
  phash1.value = ''
  phash2.value = ''
  comparisonResult.value = null
}

const handlePhashDialogClose = () => {
  phashDialogVisible.value = false
}

const getSimilarityTagType = (similarity: number) => {
  if (similarity >= 90) return 'success'
  if (similarity >= 70) return 'warning'
  return 'danger'
}

const getSimilarityLevel = (similarity: number) => {
  if (similarity >= 95) return '极高相似'
  if (similarity >= 90) return '高度相似'
  if (similarity >= 70) return '中等相似'
  if (similarity >= 50) return '低度相似'
  return '差异较大'
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
  bottom: 30px;
  right: 30px;
  z-index: 9999;

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
    right: 0;
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

.phash-comparison {
  .input-group {
    margin-bottom: 20px;

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #303133;
    }
  }

  .comparison-result {
    margin-top: 20px;
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 6px;

    h4 {
      margin: 0 0 12px 0;
      color: #303133;
    }

    p {
      margin: 8px 0;
      color: #606266;

      strong {
        color: #303133;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

  .phash-comparison {
    .input-group {
      label {
        color: #e5eaf3;
      }
    }

    .comparison-result {
      background-color: #2d2d2d;

      h4 {
        color: #e5eaf3;
      }

      p {
        color: #a3a6ad;

        strong {
          color: #e5eaf3;
        }
      }
    }
  }
}
</style>
