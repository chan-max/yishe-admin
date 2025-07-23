<template>
  <el-dialog
    v-model="visible"
    title="Phash 相似度对比"
    width="600px"
    :before-close="handleClose"
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
        <el-button @click="clearInputs">清空</el-button>
        <el-button type="primary" @click="comparePhash" :disabled="!canCompare">
          对比
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import leven from './leven'

defineOptions({ name: 'PhashComparison' })

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const phash1 = ref('')
const phash2 = ref('')
const comparisonResult = ref<{
  distance: number
  similarity: number
} | null>(null)

const canCompare = computed(() => {
  return phash1.value.trim() !== '' && phash2.value.trim() !== ''
})

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

const clearInputs = () => {
  phash1.value = ''
  phash2.value = ''
  comparisonResult.value = null
}

const handleClose = () => {
  visible.value = false
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
</script>

<style lang="scss" scoped>
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
