<template>
  <el-dialog
    v-model="dialogVisible"
    title="字体预览"
    width="800px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="font-preview-container">
      <div v-if="loading" class="loading-container">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>字体加载中...</span>
      </div>
      <template v-else>
        <div class="preview-text" :style="{ fontFamily: fontFamily }">
          预览文本 - 这是一段用于预览字体的示例文本
        </div>
        <div class="preview-text" :style="{ fontFamily: fontFamily }">
          ABCDEFGHIJKLMNOPQRSTUVWXYZ
        </div>
        <div class="preview-text" :style="{ fontFamily: fontFamily }">
          abcdefghijklmnopqrstuvwxyz
        </div>
        <div class="preview-text" :style="{ fontFamily: fontFamily }">
          0123456789
        </div>
      </template>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps<{
  modelValue: boolean
  fontUrl: string
}>()

const emit = defineEmits(['update:modelValue'])

const dialogVisible = ref(false)
const fontFamily = ref('')
const loading = ref(true)

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

watch(() => dialogVisible.value, (val) => {
  emit('update:modelValue', val)
})

watch(() => props.fontUrl, (url) => {
  if (url) {
    loading.value = true
    // 创建字体名称
    const fontName = `CustomFont-${Date.now()}`
    
    // 创建 @font-face 规则
    const style = document.createElement('style')
    style.textContent = `
      @font-face {
        font-family: '${fontName}';
        src: url('${url}') format('woff2'),
             url('${url}') format('woff'),
             url('${url}') format('truetype'),
             url('${url}') format('opentype');
      }
    `
    document.head.appendChild(style)
    
    // 创建字体加载检测
    const font = new FontFace(fontName, `url(${url})`)
    font.load().then(() => {
      // 字体加载完成
      fontFamily.value = fontName
      loading.value = false
    }).catch((error) => {
      console.error('字体加载失败:', error)
      loading.value = false
      ElMessage.error('字体加载失败')
    })
  }
}, { immediate: true })
</script>

<style scoped>
.font-preview-container {
  padding: 20px;
  min-height: 200px;
}

.preview-text {
  font-size: 24px;
  line-height: 1.5;
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 10px;
}

.loading-container .el-icon {
  font-size: 24px;
}
</style> 