<template>
  <div class="multi-video-upload-container">
    <!-- 左侧：视频预览区域 -->
    <div class="video-preview-container">
      <div class="video-preview-list">
        <div v-for="(file, index) in fileList" :key="file.uid" class="video-preview-item">
          <video
            v-if="file.url && isVideoFile(file.suffix)"
            :src="file.url"
            class="preview-video"
            controls
            preload="metadata"
          />
          <div v-else class="preview-placeholder">
            <el-icon size="48" color="var(--el-text-color-secondary)">
              <component :is="getFileIcon(file.suffix)" />
            </el-icon>
            <div class="text-secondary mt-2 font-medium">{{ file.name }}</div>
            <div class="text-secondary text-xs mt-1">{{ formatFileSize(file.size) }}</div>
            <div class="text-secondary text-xs mt-1" style="padding: 2px 8px; background: rgba(0,0,0,0.05); border-radius: 4px;">
              {{ file.suffix.toUpperCase() }}
            </div>
          </div>

          <div class="preview-info">
            <div>
              <el-input
                v-model="file.name"
                size="small"
                placeholder="文件名称"
                class="mt-1"
              />
              <el-input
                v-model="file.description"
                size="small"
                type="textarea"
                :rows="2"
                placeholder="文件描述"
                class="mt-1"
              />
              <el-input
                v-model="file.keywords"
                size="small"
                placeholder="关键词（用英文逗号分隔）"
                class="mt-1"
              />
              <el-select
                v-model="file.category"
                size="small"
                placeholder="选择分类"
                class="mt-1"
              >
                <el-option label="风景" value="风景" />
                <el-option label="人物" value="人物" />
                <el-option label="动物" value="动物" />
                <el-option label="建筑" value="建筑" />
                <el-option label="动画" value="动画" />
                <el-option label="其他" value="其他" />
              </el-select>
              <el-input
                v-model="file.tags"
                size="small"
                placeholder="标签（用英文逗号分隔）"
                class="mt-1"
              />
            </div>
          </div>

          <div class="actions">
            <el-icon v-if="file.status !== 'uploading'" size="20" @click="handleRemove(index)">
              <Close />
            </el-icon>
          </div>
          
          <!-- 上传状态 -->
          <div v-if="file.status === 'uploading'" class="status uploading">
            <el-icon class="loading-icon">
              <Loading />
            </el-icon>
            上传中...
          </div>
          <div v-if="file.status === 'fail'" class="status fail" @click="handleRetry(index)">
            上传失败，点击重试
          </div>
          <div v-if="file.status === 'success'" class="status success">上传成功</div>
        </div>
      </div>
    </div>

    <div class="operation-container">
      <div class="font-bold py-2 text-secondary border-bottom">
        上传路径 : <span class="text-xs">{{ currentUploadInfo.path || 'clip-material' }}</span>
      </div>
      <div class="stats">
        <span>
          选择
          <span class="stats-num text-primary">{{ totalCount }}</span>
          个</span
        >
        <span
          >成功
          <span class="stats-num text-success">{{ successCount }}</span>
          个</span
        >
        <span
          >失败 <span class="stats-num text-danger">{{ failCount }}</span
          >个</span
        >
        <span
          >上传中
          <span class="stats-num text-warning">{{ loadingCount }}</span
          >个</span
        >
      </div>

      <el-progress
        :format="() => `${successCount}/${totalCount}`"
        :text-inside="true"
        :stroke-width="24"
        :percentage="totalCount ? (successCount / totalCount) * 100 : totalCount"
        :striped-flow="someLoading"
        :striped="someLoading"
        :status="totalCount == successCount ? 'success' : 'warning'"
      />

      <div class="local-select">
        <el-upload
          action="#"
          :accept="acceptAllFiles"
          list-type="text"
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="false"
          multiple
        >
          <el-button type="primary" plain :icon="UploadFilled">选择文件</el-button>
        </el-upload>
      </div>

      <div>
        <el-button class="w-full" type="primary" :disabled="totalCount === 0" @click="handleUpload">
          上传
        </el-button>
      </div>

      <!-- 清空按钮 -->
      <div>
        <el-button class="w-full" type="danger" :disabled="totalCount === 0" @click="handleClear">
          清空
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import {
  Plus,
  Close,
  Loading,
  Upload,
  UploadFilled,
  VideoPlay,
  Document,
  Picture,
  Folder,
  TopRight
} from '@element-plus/icons-vue'
import { useDebounceFn } from '@vueuse/core'
import { throttleLoop, throttleLoopWithRAF } from '@/common/render'
import { createClipMaterial } from '@/api/clip-material'
import { useUserStore } from '@/store/modules/user'
import { uploadToCOS, initCOS } from '@/api/cos'

const props = defineProps({
  currentUploadInfo: {
    default: {}
  }
})

const userStore = useUserStore()

// 文件列表
const fileList = ref([])

const emits = defineEmits(['single-file-uploaded'])

enum UploadStatus {
  Waiting = 'waiting',
  Uploading = 'uploading',
  Success = 'success',
  Fail = 'fail'
}

// 统计信息
const totalCount = computed(() => fileList.value.length)
const successCount = computed(() => fileList.value.filter(file => file.status === UploadStatus.Success).length)
const failCount = computed(() => fileList.value.filter(file => file.status === UploadStatus.Fail).length)
const loadingCount = computed(() => fileList.value.filter(file => file.status === UploadStatus.Uploading).length)
const someLoading = computed(() => loadingCount.value > 0)

// 接受所有文件格式
const acceptAllFiles = '*'

// 判断是否为视频文件
function isVideoFile(suffix: string): boolean {
  const videoSuffixes = ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm', 'm4v', '3gp', 'ogv']
  return videoSuffixes.includes(suffix.toLowerCase())
}

// 获取文件图标
function getFileIcon(suffix: string) {
  const videoSuffixes = ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm', 'm4v', '3gp', 'ogv']
  const imageSuffixes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif']
  const documentSuffixes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf']
  
  if (videoSuffixes.includes(suffix.toLowerCase())) {
    return VideoPlay
  } else if (imageSuffixes.includes(suffix.toLowerCase())) {
    return Picture
  } else if (documentSuffixes.includes(suffix.toLowerCase())) {
    return Document
  } else {
    return Folder
  }
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 处理文件选择
function handleFileChange(file: any) {
  // 获取实际的File对象
  const actualFile = file.raw || file
  
  // 检查文件大小（限制为1GB）
  const maxSize = 1024 * 1024 * 1024
  if (actualFile.size > maxSize) {
    ElMessage.error('文件大小不能超过1GB')
    return
  }

  // 获取文件后缀
  const suffix = actualFile.name.split('.').pop()?.toLowerCase() || 'unknown'

  const fileItem = {
    uid: Date.now() + Math.random(),
    name: actualFile.name.replace(/\.[^/.]+$/, ''), // 移除扩展名
    description: '',
    keywords: '',
    category: '',
    tags: '',
    suffix: suffix,
    size: actualFile.size,
    status: UploadStatus.Waiting,
    file: actualFile,
    url: ''
  }

  fileList.value.push(fileItem)
}

// 处理文件移除
function handleRemove(index: number) {
  fileList.value.splice(index, 1)
}

// 处理重试
function handleRetry(index: number) {
  const file = fileList.value[index]
  if (file) {
    file.status = UploadStatus.Waiting
    handleUpload()
  }
}

// 处理清空
function handleClear() {
  fileList.value = []
}

// 处理上传
async function handleUpload() {
  if (totalCount.value === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  const waitingFiles = fileList.value.filter(file => file.status === UploadStatus.Waiting)
  if (waitingFiles.length === 0) {
    ElMessage.warning('没有待上传的文件')
    return
  }

  // 开始上传
  for (let i = 0; i < waitingFiles.length; i++) {
    const file = waitingFiles[i]
    await uploadSingleFile(file)
  }
}

// 上传单个文件
async function uploadSingleFile(fileItem: any) {
  try {
    fileItem.status = UploadStatus.Uploading

    // 确保COS已初始化
    await initCOS()

    // 调试信息
    console.log('准备上传文件:', fileItem)
    console.log('文件对象:', fileItem.file)
    console.log('文件大小:', fileItem.file?.size)
    console.log('文件名称:', fileItem.file?.name)

    // 上传到COS
    const cosResult = await uploadToCOS({ 
      file: fileItem.file,
      key: `clip-material/${new Date().getTime()}_${fileItem.name}.${fileItem.suffix}`
    })
    
    if (!cosResult.url) {
      throw new Error('上传到COS失败')
    }

    fileItem.url = cosResult.url

    // 保存到数据库
    const materialData = {
      name: fileItem.name,
      description: fileItem.description,
      keywords: fileItem.keywords,
      suffix: fileItem.suffix,
      category: fileItem.category,
      tags: fileItem.tags,
      url: cosResult.url,
      isPublic: true,
      userId: userStore.userInfo?.id
    }

    const result = await createClipMaterial(materialData)
    
    if (result) {
      fileItem.status = UploadStatus.Success
      fileItem.id = result.id
      ElNotification.success(`文件 ${fileItem.name} 上传成功`)
      emits('single-file-uploaded')
    } else {
      throw new Error('保存到数据库失败')
    }

  } catch (error) {
    console.error('上传失败:', error)
    fileItem.status = UploadStatus.Fail
    ElMessage.error(`文件 ${fileItem.name} 上传失败: ${error.message}`)
  }
}

// 监听文件列表变化
watch(fileList, (newList) => {
  // 可以在这里添加一些逻辑
}, { deep: true })
</script>

<style scoped>
.multi-video-upload-container {
  display: flex;
  height: 100%;
  gap: 20px;
}

.video-preview-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
}

.video-preview-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.video-preview-item {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: relative;
  min-height: 200px;
  transition: all 0.3s ease;
}

.video-preview-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--el-color-primary-light-7);
}

.preview-video {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 16px;
  background: var(--el-fill-color-darker);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.preview-video:hover {
  transform: scale(1.02);
}

.preview-placeholder {
  width: 100%;
  height: 180px;
  background: linear-gradient(135deg, var(--el-fill-color-light) 0%, var(--el-fill-color-lighter) 100%);
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.preview-placeholder:hover {
  border-color: var(--el-color-primary);
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-fill-color-light) 100%);
}

.preview-info {
  margin-bottom: 12px;
}

.preview-info :deep(.el-input),
.preview-info :deep(.el-textarea),
.preview-info :deep(.el-select) {
  margin-bottom: 8px;
}

.preview-info :deep(.el-input__inner),
.preview-info :deep(.el-textarea__inner) {
  border-radius: 6px;
  transition: all 0.2s ease;
}

.preview-info :deep(.el-input__inner):focus,
.preview-info :deep(.el-textarea__inner):focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.text-secondary {
  color: var(--el-text-color-secondary);
}

.text-primary {
  color: var(--el-color-primary);
}

.text-success {
  color: var(--el-color-success);
}

.text-danger {
  color: var(--el-color-danger);
}

.text-warning {
  color: var(--el-color-warning);
}

.border-bottom {
  border-bottom: 1px solid var(--el-border-color-light);
}

.actions {
  position: absolute;
  top: 12px;
  right: 12px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.actions:hover {
  color: var(--el-color-danger);
  background: rgba(245, 101, 101, 0.1);
  transform: scale(1.1);
}

.status {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status.uploading {
  background: linear-gradient(135deg, var(--el-color-primary-light-8) 0%, var(--el-color-primary-light-9) 100%);
  color: var(--el-color-primary);
  border: 1px solid var(--el-color-primary-light-7);
}

.status.success {
  background: linear-gradient(135deg, var(--el-color-success-light-8) 0%, var(--el-color-success-light-9) 100%);
  color: var(--el-color-success);
  border: 1px solid var(--el-color-success-light-7);
}

.status.fail {
  background: linear-gradient(135deg, var(--el-color-danger-light-8) 0%, var(--el-color-danger-light-9) 100%);
  color: var(--el-color-danger);
  border: 1px solid var(--el-color-danger-light-7);
}

.status.fail:hover {
  background: linear-gradient(135deg, var(--el-color-danger-light-7) 0%, var(--el-color-danger-light-8) 100%);
}

.loading-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.operation-container {
  width: 300px;
  padding: 20px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.stats-num {
  font-weight: bold;
}

.local-select {
  text-align: left;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .multi-video-upload-container {
    flex-direction: column;
  }
  
  .operation-container {
    width: 100%;
  }
  
  .video-preview-list {
    grid-template-columns: 1fr;
  }
}
</style>
