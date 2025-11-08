<template>
  <div class="product-image-upload">
    <div class="image-list">
      <draggable
        v-model="localFiles"
        :animation="200"
        handle=".drag-handle"
        ghost-class="ghost-item"
        chosen-class="chosen-item"
        @start="onDragStart"
        @end="onDragEnd"
        item-key="id"
        class="draggable-container"
      >
        <template #item="{ element: file, index }">
          <div class="image-item" :class="{ 'dragging': isDragging }">
            <div class="drag-handle">
              <el-icon class="drag-icon"><Rank /></el-icon>
            </div>
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
            </div>
            <div class="image-index">{{ index + 1 }}</div>
          </div>
        </template>
      </draggable>

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
import { Plus, Delete, Picture, Rank } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import draggable from 'vuedraggable'

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
const isDragging = ref(false)

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

  // 添加新文件到本地列表，添加唯一ID
  localFiles.value.push({
    id: `file-${Date.now()}-${Math.random()}`,
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

// 拖拽开始处理
const onDragStart = () => {
  isDragging.value = true
}

// 拖拽结束处理
const onDragEnd = () => {
  isDragging.value = false
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
  // 保持原有文件的顺序和新上传的文件
  const existingFiles = localFiles.value.filter(file => file.raw)
  
  // 为URL文件添加唯一ID，如果已有相同URL的文件，保留其ID
  const urlFiles = newValue.map((url, idx) => {
    // 查找是否已有相同URL的文件
    const existingFile = localFiles.value.find(f => f.url === url)
    return { 
      id: existingFile?.id || `url-${url}-${idx}-${Date.now()}`,
      url, 
      raw: null
    }
  })
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

// 添加 reset 方法
const reset = () => {
  // 清理所有本地预览URL
  localFiles.value.forEach(file => {
    if (file.raw && !file.url) {
      window.URL.revokeObjectURL(getPreviewUrl(file))
    }
  })
  // 重置本地文件列表
  localFiles.value = []
  // 重置父组件的值
  emit('update:modelValue', [])
  emit('files-change', [])
}

// 暴露方法给父组件
defineExpose({
  reset
})
</script>

<style scoped>
.product-image-upload {
  width: 100%;
}

.image-list {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 8px;
  width: 100%;
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

.draggable-container {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: flex-start !important;
  gap: 12px !important;
  width: auto !important;
  min-width: fit-content;
}

.image-list::-webkit-scrollbar {
  height: 8px;
}

.image-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.image-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.image-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.image-item {
  position: relative;
  width: 120px;
  height: 120px;
  min-width: 120px;
  flex-shrink: 0;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  cursor: move;
  transition: all 0.3s ease;
}

.image-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.image-item.dragging {
  opacity: 0.5;
}

.drag-handle {
  position: absolute;
  top: 5px;
  left: 5px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  z-index: 10;
  transition: background 0.2s;
}

.drag-handle:hover {
  background: rgba(0, 0, 0, 0.7);
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-icon {
  color: #fff;
  font-size: 14px;
}

.image-index {
  position: absolute;
  bottom: 5px;
  left: 5px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 5;
}

.ghost-item {
  opacity: 0.4;
  background: #f0f0f0;
}

.chosen-item {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3);
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
  min-width: 120px;
  flex-shrink: 0;
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