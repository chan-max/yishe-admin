<template>
  <div class="product-video-upload">
    <div class="video-list">
      <div v-for="(file, index) in localFiles" :key="index" class="video-item">
        <video
          v-if="getPreviewUrl(file)"
          :src="getPreviewUrl(file)"
          controls
          class="preview-video"
          style="width: 120px; height: 120px; object-fit: cover; border-radius: 4px; background: #000;"
        />
        <div class="video-actions">
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
        accept="video/*"
        class="upload-btn"
      >
        <el-button type="primary" :icon="Plus">
          添加视频
        </el-button>
        <template #tip>
          <div class="upload-tip">
            最多上传 {{ maxCount }} 个视频 ({{ localFiles.length }}/{{ maxCount }})
          </div>
        </template>
      </el-upload>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { Plus, Delete, Top } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  maxCount: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['update:modelValue', 'files-change'])

const localFiles = ref([])

const getPreviewUrl = (file) => {
  if (file.url) {
    return file.url
  }
  if (file.raw) {
    return window.URL.createObjectURL(file.raw)
  }
  return ''
}

const handleChange = (file) => {
  if (!file.raw.type.startsWith('video/')) {
    ElMessage.error('请上传视频文件')
    return
  }
  if (localFiles.value.length >= props.maxCount) {
    ElMessage.warning(`最多只能上传 ${props.maxCount} 个视频`)
    return
  }
  localFiles.value.push({
    raw: file.raw,
    url: null
  })
  emit('files-change', localFiles.value)
}

const removeFile = (index) => {
  const file = localFiles.value[index]
  if (file.raw && !file.url) {
    window.URL.revokeObjectURL(getPreviewUrl(file))
  }
  localFiles.value.splice(index, 1)
  const urls = localFiles.value.filter(file => file.url).map(file => file.url)
  emit('update:modelValue', urls)
  emit('files-change', localFiles.value)
}

const moveUp = (index) => {
  [localFiles.value[index], localFiles.value[index - 1]] = [localFiles.value[index - 1], localFiles.value[index]]
  const urls = localFiles.value.filter(file => file.url).map(file => file.url)
  emit('update:modelValue', urls)
  emit('files-change', localFiles.value)
}

const updateLocalFiles = (newValue) => {
  const existingFiles = localFiles.value.filter(file => file.raw)
  const urlFiles = newValue.map(url => ({ url, raw: null }))
  localFiles.value = [...urlFiles, ...existingFiles]
}

updateLocalFiles(props.modelValue)
watch(() => props.modelValue, updateLocalFiles)

onUnmounted(() => {
  localFiles.value.forEach(file => {
    if (file.raw && !file.url) {
      window.URL.revokeObjectURL(getPreviewUrl(file))
    }
  })
})

const reset = () => {
  localFiles.value.forEach(file => {
    if (file.raw && !file.url) {
      window.URL.revokeObjectURL(getPreviewUrl(file))
    }
  })
  localFiles.value = []
  emit('update:modelValue', [])
  emit('files-change', [])
}

defineExpose({
  reset
})
</script>

<style scoped>
.product-video-upload {
  width: 100%;
}

.video-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.video-item {
  position: relative;
  width: 120px;
  height: 120px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.video-actions {
  position: absolute;
  right: 4px;
  top: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upload-btn {
  align-self: flex-start;
}

.upload-tip {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  background: #000;
}
</style> 