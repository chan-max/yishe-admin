<template>
  <div class="api-image-upload">
    <!-- 已上传图片预览 -->
    <div class="image-list">
      <div v-for="(item, index) in modelValue" :key="index" class="image-item">
        <el-image :src="item.imageUrl" fit="cover" class="preview-image" :preview-src-list="previewSrcList"
          :initial-index="index" hide-on-click-modal>
          <template #error>
            <div class="image-slot">
              <el-icon>
                <Picture />
              </el-icon>
            </div>
          </template>
        </el-image>
        <div class="image-actions">
          <div>
            <el-button type="danger" size="small" :icon="Delete" circle @click="removeImage(index)"
              :loading="deletingIndex === index" :disabled="deletingIndex !== null" />
          </div>
          <div>
            <el-button v-if="index > 0" type="primary" size="small" :icon="Top" circle @click="moveUp(index)"
              :disabled="uploading || deletingIndex !== null" />
          </div>
          <div>
            <el-button v-if="uploadingIndex === index" type="info" size="small" :icon="Loading" circle
              :loading="true" />
          </div>
        </div>
      </div>

      <!-- 上传按钮 -->
      <el-upload v-if="modelValue.length < maxCount" action="#" :auto-upload="false" :show-file-list="false"
        :on-change="handleChange" :multiple="multiple" :disabled="uploading || deletingIndex !== null" accept="image/*"
        class="upload-btn">
        <el-button type="primary" :icon="Plus" :loading="uploading">
          {{ uploading ? '上传中...' : '添加图片' }}
        </el-button>
        <template #tip>
          <div class="upload-tip">
            最多上传 {{ maxCount }} 张图片 ({{ modelValue.length }}/{{ maxCount }})
          </div>
        </template>
      </el-upload>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, Delete, Picture, Top, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { uploadOSSFile, deleteOSSFile } from '@/api/oss'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  maxCount: {
    type: Number,
    default: 6
  },
  multiple: {
    type: Boolean,
    default: true
  },
  // OSS上传目录
  uploadPath: {
    type: String,
    default: 'dev/outerpackage/'
  }
})

const emit = defineEmits(['update:modelValue'])

const uploading = ref(false)
const uploadingIndex = ref(-1)
const deletingIndex = ref(null)

// 计算属性，用于图片预览组件
const previewSrcList = computed(() => {
  return props.modelValue.map(item => item.imageUrl)
})

// 处理文件变化
const handleChange = async (file) => {
  if (!file.raw.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件')
    return
  }

  if (props.modelValue?.length >= props.maxCount) {
    ElMessage.warning(`最多只能上传 ${props.maxCount} 张图片`)
    return
  }

  try {
    uploading.value = true
    uploadingIndex.value = props.modelValue.length

    // 调用上传API
    const response = await uploadOSSFile(file.raw, props.uploadPath)
    const url = response.url
    // const key = response.key // 假设返回中包含文件的key/路径
    const newImages = [...props.modelValue, {
      imageUrl: url,
      // fileKey: key // 保存文件的key用于后续删除
    }]
    emit('update:modelValue', newImages)

  } catch (error) {
    console.error('上传出错:', error)
    ElMessage.error('上传出错，请重试')
  } finally {
    uploading.value = false
    uploadingIndex.value = -1
  }
}

// 删除图片
const removeImage = async (index) => {
  try {
    const item = props.modelValue[index]

    await ElMessageBox.confirm('确定要删除这张图片吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    deletingIndex.value = index

    // 调用删除API
    let key = props.uploadPath + item.imageUrl.split(props.uploadPath)[1]
    await deleteOSSFile(key)

    // 从数组中移除
    emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))

    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除出错:', error)
      ElMessage.error('删除失败，请重试')
    }
  } finally {
    deletingIndex.value = null
  }
}

// 上移图片
const moveUp = (index) => {
  const newImages = [...(props.modelValue || [])]
    ;[newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]]
  emit('update:modelValue', newImages)
}
</script>

<style scoped>
.api-image-upload {
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