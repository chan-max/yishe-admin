<template>
  <el-dialog
    v-model="visible"
    title="文本工具"
    width="700px"
    :before-close="handleClose"
  >
    <div class="text-tools">
      <div class="input-section">
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="6"
          placeholder="请输入要处理的文本..."
          class="text-input"
        />
      </div>

      <div class="tools-section">
        <div class="tool-group">
          <h4>文本转换</h4>
          <div class="tool-buttons">
            <el-button @click="toUpperCase" size="small">转大写</el-button>
            <el-button @click="toLowerCase" size="small">转小写</el-button>
            <el-button @click="toTitleCase" size="small">首字母大写</el-button>
            <el-button @click="toCamelCase" size="small">驼峰命名</el-button>
            <el-button @click="toSnakeCase" size="small">下划线命名</el-button>
            <el-button @click="toKebabCase" size="small">短横线命名</el-button>
          </div>
        </div>

        <div class="tool-group">
          <h4>文本处理</h4>
          <div class="tool-buttons">
            <el-button @click="trimText" size="small">去除空格</el-button>
            <el-button @click="removeLineBreaks" size="small">去除换行</el-button>
            <el-button @click="removeExtraSpaces" size="small">去除多余空格</el-button>
            <el-button @click="reverseText" size="small">反转文本</el-button>
            <el-button @click="sortLines" size="small">行排序</el-button>
            <el-button @click="removeDuplicateLines" size="small">去重行</el-button>
          </div>
        </div>

        <div class="tool-group">
          <h4>编码转换</h4>
          <div class="tool-buttons">
            <el-button @click="encodeBase64" size="small">Base64 编码</el-button>
            <el-button @click="decodeBase64" size="small">Base64 解码</el-button>
            <el-button @click="encodeUrl" size="small">URL 编码</el-button>
            <el-button @click="decodeUrl" size="small">URL 解码</el-button>
            <el-button @click="encodeHtml" size="small">HTML 编码</el-button>
            <el-button @click="decodeHtml" size="small">HTML 解码</el-button>
          </div>
        </div>
      </div>

      <div class="output-section">
        <div class="output-header">
          <h4>处理结果</h4>
          <el-button @click="copyResult" size="small" type="primary">复制结果</el-button>
        </div>
        <el-input
          v-model="outputText"
          type="textarea"
          :rows="6"
          readonly
          class="text-output"
        />
      </div>

      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">字符数:</span>
            <span class="stat-value">{{ textStats.characters }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">字数:</span>
            <span class="stat-value">{{ textStats.words }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">行数:</span>
            <span class="stat-value">{{ textStats.lines }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">段落数:</span>
            <span class="stat-value">{{ textStats.paragraphs }}</span>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

defineOptions({ name: 'TextTools' })

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

const inputText = ref('')
const outputText = ref('')

const textStats = computed(() => {
  const text = inputText.value
  return {
    characters: text.length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text.split('\n').length,
    paragraphs: text.split(/\n\s*\n/).filter(p => p.trim()).length
  }
})

// 文本转换功能
const toUpperCase = () => {
  outputText.value = inputText.value.toUpperCase()
}

const toLowerCase = () => {
  outputText.value = inputText.value.toLowerCase()
}

const toTitleCase = () => {
  outputText.value = inputText.value.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

const toCamelCase = () => {
  outputText.value = inputText.value
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '')
}

const toSnakeCase = () => {
  outputText.value = inputText.value
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('_')
}

const toKebabCase = () => {
  outputText.value = inputText.value
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('-')
}

// 文本处理功能
const trimText = () => {
  outputText.value = inputText.value.trim()
}

const removeLineBreaks = () => {
  outputText.value = inputText.value.replace(/\n/g, ' ')
}

const removeExtraSpaces = () => {
  outputText.value = inputText.value.replace(/\s+/g, ' ').trim()
}

const reverseText = () => {
  outputText.value = inputText.value.split('').reverse().join('')
}

const sortLines = () => {
  outputText.value = inputText.value.split('\n').sort().join('\n')
}

const removeDuplicateLines = () => {
  const lines = inputText.value.split('\n')
  const uniqueLines = [...new Set(lines)]
  outputText.value = uniqueLines.join('\n')
}

// 编码转换功能
const encodeBase64 = () => {
  try {
    outputText.value = btoa(unescape(encodeURIComponent(inputText.value)))
  } catch (error) {
    ElMessage.error('Base64 编码失败')
  }
}

const decodeBase64 = () => {
  try {
    outputText.value = decodeURIComponent(escape(atob(inputText.value)))
  } catch (error) {
    ElMessage.error('Base64 解码失败')
  }
}

const encodeUrl = () => {
  outputText.value = encodeURIComponent(inputText.value)
}

const decodeUrl = () => {
  try {
    outputText.value = decodeURIComponent(inputText.value)
  } catch (error) {
    ElMessage.error('URL 解码失败')
  }
}

const encodeHtml = () => {
  const div = document.createElement('div')
  div.textContent = inputText.value
  outputText.value = div.innerHTML
}

const decodeHtml = () => {
  const div = document.createElement('div')
  div.innerHTML = inputText.value
  outputText.value = div.textContent || div.innerText || ''
}

const copyResult = async () => {
  if (!outputText.value) {
    ElMessage.warning('没有结果可复制')
    return
  }

  try {
    await navigator.clipboard.writeText(outputText.value)
    ElMessage.success('结果已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const handleClose = () => {
  visible.value = false
}
</script>

<style lang="scss" scoped>
.text-tools {
  .input-section,
  .output-section {
    margin-bottom: 20px;

    .text-input,
    .text-output {
      width: 100%;
    }
  }

  .output-section {
    .output-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      h4 {
        margin: 0;
        color: #303133;
      }
    }
  }

  .tools-section {
    margin-bottom: 20px;

    .tool-group {
      margin-bottom: 16px;

      h4 {
        margin: 0 0 8px;
        font-size: 14px;
        color: #303133;
      }

      .tool-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }
  }

  .stats-section {
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 6px;

      .stat-item {
        text-align: center;

        .stat-label {
          display: block;
          margin-bottom: 4px;
          font-size: 12px;
          color: #909399;
        }

        .stat-value {
          font-size: 18px;
          font-weight: bold;
          color: #303133;
        }
      }
    }
  }
}

// 暗色主题适配
.dark {
  .text-tools {
    .output-section {
      .output-header {
        h4 {
          color: #e5eaf3;
        }
      }
    }

    .tools-section {
      .tool-group {
        h4 {
          color: #e5eaf3;
        }
      }
    }

    .stats-section {
      .stats-grid {
        background-color: #2d2d2d;

        .stat-item {
          .stat-label {
            color: #a3a6ad;
          }

          .stat-value {
            color: #e5eaf3;
          }
        }
      }
    }
  }
}
</style>
