<template>
  <div class="product-image-upload">
    <div class="image-list">
      <div v-for="(file, index) in localFiles" :key="index" class="image-item">
        <el-image 
          :src="getPreviewUrl(file)" 
          fit="cover" 
          class="preview-image" 
          :preview-src-list="previewList" 
          :initial-index="index"
        >
          <template #error>
            <div class="image-slot">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>
        <div class="image-actions">
          <el-button type="danger" size="small" :icon="Delete" circle @click="removeFile(index)" />
          <el-button v-if="index > 0" type="primary" size="small" :icon="Top" circle @click="moveUp(index)" />
        </div>
      </div>

      <el-upload
        v-if="localFiles.length < maxCount"
        action="#"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleChange"
        :multiple="true"
        accept="image/*"
        class="upload-btn"
      >
        <el-button type="primary" :icon="Plus">
          添加图片
        </el-button>
        <template #tip>
          <div class="upload-tip">
            最多上传 {{ maxCount }} 张图片 ({{ localFiles.length }}/{{ maxCount }})
          </div>
        </template>
      </el-upload>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { Plus, Delete, Picture, Top } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  maxCount: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['update:modelValue', 'files-change'])

// 本地文件列表，包含已上传的URL和新选择的文件
const localFiles = ref([])

// 获取预览URL
const getPreviewUrl = (file) => {
  if (file.url) {
    return file.url
  }
  if (file.raw) {
    return window.URL.createObjectURL(file.raw)
  }
  return ''
}

// 计算预览列表
const previewList = computed(() => {
  return localFiles.value.map(file => getPreviewUrl(file))
})

// 处理文件变化
const handleChange = (file) => {
  if (!file.raw.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件')
    return
  }

  if (localFiles.value.length >= props.maxCount) {
    ElMessage.warning(`最多只能上传 ${props.maxCount} 张图片`)
    return
  }

  // 添加新文件到本地列表
  localFiles.value.push({
    raw: file.raw,
    url: null
  })

  // 通知父组件文件列表已更新
  emit('files-change', localFiles.value)
}

// 删除文件
const removeFile = (index) => {
  const file = localFiles.value[index]
  // 如果是本地预览的图片，需要释放URL
  if (file.raw && !file.url) {
    window.URL.revokeObjectURL(getPreviewUrl(file))
  }
  localFiles.value.splice(index, 1)
  
  // 更新 modelValue，只保留已上传的图片URL
  const urls = localFiles.value
    .filter(file => file.url)
    .map(file => file.url)
  emit('update:modelValue', urls)
  
  // 通知父组件文件列表已更新
  emit('files-change', localFiles.value)
}

// 上移文件
const moveUp = (index) => {
  [localFiles.value[index], localFiles.value[index - 1]] = [localFiles.value[index - 1], localFiles.value[index]]
  
  // 更新 modelValue，保持已上传图片的顺序
  const urls = localFiles.value
    .filter(file => file.url)
    .map(file => file.url)
  emit('update:modelValue', urls)
  
  // 通知父组件文件列表已更新
  emit('files-change', localFiles.value)
}

// 监听 modelValue 变化，更新本地文件列表
const updateLocalFiles = (newValue) => {
  // 保持原有文件的顺序
  const existingFiles = localFiles.value.filter(file => file.raw)
  const urlFiles = newValue.map(url => ({ url, raw: null }))
  localFiles.value = [...urlFiles, ...existingFiles]
}

// 初始化时设置本地文件列表
updateLocalFiles(props.modelValue)

// 监听 modelValue 变化
watch(() => props.modelValue, updateLocalFiles)

// 组件卸载时清理所有创建的URL
onUnmounted(() => {
  localFiles.value.forEach(file => {
    if (file.raw && !file.url) {
      window.URL.revokeObjectURL(getPreviewUrl(file))
    }
  })
})
</script>

<style scoped>
.product-image-upload {
  width: 100%;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item {
  position: relative;
  width: 120px;
  height: 120px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-actions {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.upload-btn {
  width: 120px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
}
</style> 