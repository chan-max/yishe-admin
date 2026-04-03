<template>
  <div class="multi-image-upload-container">
    <!-- 左侧：图片预览区域 -->
    <div class="image-preview-container">
      <div class="image-preview-list">
        <div v-for="(file, index) in fileList" :key="file.uid" class="image-preview-item">
          <el-image
            :src="usePreview ? file.url : 'empty'"
            alt="preview"
            :lazy="true"
            class="preview-image"
            loading="lazy"
            fit="contain"
          >
            <template #error>
              <div class="w-full h-full flex items-center justify-center">
                <el-icon style="z-index: 0" size="24" color="#999">
                  <PictureFilled />
                </el-icon>
              </div>
            </template>
          </el-image>

          <div class="preview-placeholder">
            <div>
              <el-input
                v-model="file.name"
                size="small"
                placeholder="图片名称"
                class="mt-1 white-input"
              />
              <el-input
                v-model="file.nameEn"
                size="small"
                placeholder="英文名称"
                class="mt-1 white-input"
              />
              <el-input
                v-model="file.description"
                size="small"
                type="textarea"
                :rows="2"
                placeholder="图片描述"
                class="mt-1 white-input"
              />
              <el-input
                v-model="file.descriptionEn"
                size="small"
                type="textarea"
                :rows="2"
                placeholder="英文描述"
                class="mt-1 white-input"
              />
              <el-input
                v-model="file.keywords"
                size="small"
                placeholder="关键词（用英文逗号分隔）"
                class="mt-1 white-input"
              />
              <el-input
                v-model="file.keywordsEn"
                size="small"
                placeholder="英文关键词（用英文逗号分隔）"
                class="mt-1 white-input"
              />
            </div>
            <!-- 重命名标签 -->
            <div v-if="file.rename" class="rename-tag">
              <el-tag round size="small" link type="primary">
                重命名: {{ file.rename }}
              </el-tag>
            </div>
            <!-- 尺寸与信息标签 -->
            <div class="file-info-tags">
              <el-tag link round size="small" type="primary">
                {{ (file.size / 1024 / 1024).toFixed(2) + 'Mb' }}
              </el-tag>
              <el-tag v-if="file.width > 0 && file.height > 0" round size="small" link type="primary">
                {{ file.width }} x {{ file.height }}
              </el-tag>
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
      <div class="font-bold py-2" style="color: #bbb; border-bottom: 1px solid #ddd">
        上传路径 : <span style="font-size: 0.8em">{{ currentUploadInfo.path }}</span>
      </div>
      <div class="stats">
        <span>
          选择
          <span class="stats-num" style="color: var(--el-color-primary)">{{ totalCount }}</span>
          张</span
        >
        <span
          >成功
          <span class="stats-num" style="color: var(--el-color-success)">{{ successCount }}</span>
          张</span
        >
        <span
          >失败 <span class="stats-num" style="color: var(--el-color-danger)">{{ failCount }}</span
          >张</span
        >

        <span
          >上传中
          <span class="stats-num" style="color: var(--el-color-warning)">{{ loadingCount }}</span
          >张</span
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
          accept="image/*"
          list-type="text"
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="false"
          multiple
        >
          <el-button type="primary" plain :icon="UploadFilled">选择图片</el-button>
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
      <div class="flex items-center gap-2">
        <el-switch
          v-model="usePreview"
          size="small"
          active-text="开启图片预览(预览会占用大量资源)"
        ></el-switch>
        <!-- <el-alert  size="small" type="warning"  description=" " /> -->
      </div>
      <div class="flex items-center gap-2">
        <el-switch
          v-model="useAiGenerate"
          size="small"
          active-text="使用AI自动生成补全内容"
        ></el-switch>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import {
  Close,
  Loading,
  UploadFilled,
  PictureFilled
} from '@element-plus/icons-vue'
import { uploadMaterialFile } from '@/api/material'
import { uploadToCOS } from '@/api/cos'
import { useUserStore } from '@/store/modules/user'
import { generateUUID } from '@/utils'

const userStore = useUserStore()

defineProps({
  currentUploadInfo: {
    type: Object,
    default: () => ({ path: '' })
  }
})

// 文件列表
const fileList = ref([])

const emits = defineEmits(['single-file-uploaded'])

const usePreview = ref(true)
const useAiGenerate = ref(false) // 是否使用AI生成补全内容

// 统计信息
const totalCount = computed(() => fileList.value.length)
const successCount = computed(
  () => fileList.value.filter((file) => file.status === 'success').length
)

const loadingCount = computed(
  () => fileList.value.filter((file) => file.status === 'uploading').length
)
const failCount = computed(() => fileList.value.filter((file) => file.status === 'fail').length)

// 任意图片正在上传
const someLoading = computed(() => {
  return fileList.value.some((item) => item.status == 'uploading')
})

// 获取图片尺寸
const getImageDimensions = (file): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      })
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
    }
    img.src = URL.createObjectURL(file)
  })
}

const handleFileChange = async (file) => {
  const url = URL.createObjectURL(file.raw) // 生成 Blob URL
  
  // 获取图片尺寸
  const info = await getImageDimensions(file.raw)

    fileList.value.push({
    uid: file.uid,
    name: file.name,
    url, // 使用 Blob URL
    size: file.size,
    raw: file.raw,
    width: info.width,
    height: info.height,
    rename: '', // 该图片的重命名
    status: 'waiting', // waiting, uploading, success, fail
    description: '', // 描述
    descriptionEn: '', // 英文描述
    keywords: '', // 关键字
    keywordsEn: '' // 英文关键字
  })
}

// 移除图片
const handleRemove = (index) => {
  fileList.value.splice(index, 1)
}

// 重试上传
const handleRetry = async (index) => {
  const file = fileList.value[index]
  file.status = 'uploading'
  await uploadFile(file)
}

// 上传所有图片
const handleUpload = async () => {
  if (fileList.value.length && successCount.value == fileList.value.length) {
    return ElNotification.success('图片都上传成功了，请再选择新素材吧~')
  }

  for (let i = 0; i < fileList.value.length; i++) {
    const file = fileList.value[i]
    if (file.status === 'waiting' || file.status === 'fail') {
      file.status = 'uploading'
      //   await uploadFile(file, i);
      uploadFile(file)
    }
  }
}

// 清空所有图片
const handleClear = () => {
  if (fileList.value.length && failCount.value) {
    return ElNotification.error('有上传失败的图片，请上传成功后再清空')
  }
  fileList.value = []
}

// 上传单个文件
const uploadFile = async (file) => {
  try {
    // 自动识别文件后缀
    let suffix = ''
    if (file.raw && file.raw.name) {
      const match = file.raw.name.match(/\.([a-zA-Z0-9]+)$/)
      if (match) {
        suffix = match[1].toLowerCase()
      }
    }
    
    // 获取用户账号（使用已定义的 userStore）
    const userAccount = (userStore.user as any)?.account || userStore.user?.shortName || userStore.user?.name || 'anonymous'
    const userId = (userStore.user as any)?.id || (userStore as any).userInfo?.id
    
    const cos = await uploadToCOS({
      file: file.raw,
      category: 'sticker', // 素材上传到 sticker 分类
      account: userAccount,
      userId
    })
    const { url } = cos
    const width = file.width || 0
    const height = file.height || 0
    const aspectRatio = width && height ? width / height : undefined

    await uploadMaterialFile({
      url,
      name: file.name,
      nameEn: file.nameEn || '',
      description: file.description || '',
      descriptionEn: file.descriptionEn || '',
      keywords: file.keywords || '',
      keywordsEn: file.keywordsEn || '',
      suffix, // 图片类型后缀
      width,
      height,
      aspectRatio,
      userId: userStore.user?.id,
      useAiGenerate: useAiGenerate.value // 是否使用AI生成补全内容
    })
    file.status = 'success'
    emits('single-file-uploaded')
  } catch (error) {
    file.status = 'fail'
    console.error('上传文件失败:', error)
    const errorMessage = error?.message || error?.toString() || '未知错误'
    ElMessage.error(`文件 ${file.name} 上传失败: ${errorMessage}`)
  }
}
</script>

<style scoped>
.multi-image-upload-container {
  display: flex;
  height: calc(100vh - 100px);
  max-height: calc(100vh - 100px);
  width: 100%;
  gap: 20px;
  /* 左右两侧间距 */
}

.image-preview-container {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  height: 100%;
  min-height: 0;
}

.image-preview-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: start;
  gap: 10px;
  align-content: flex-start;
}

.image-preview-item {
  position: relative;
  width: 200px;
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.preview-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  flex-shrink: 0;
}

.actions {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  gap: 5px;
  cursor: pointer;
}

.actions .el-icon {
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  padding: 4px;

  &:hover {
    transform: scale(1.1);
  }
}

.status {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  text-align: center;
  font-size: 12px;
  padding: 4px;
}

.uploading {
  background: rgba(0, 0, 0, 0.7);
}

.fail {
  cursor: pointer;
  background: rgba(255, 0, 0, 0.7);

  &:hover {
    transform: scale(1.02);
  }
}

.success {
  background: rgba(0, 128, 0, 0.7);
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.operation-container {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* 操作按钮间距 */
}

.stats {
  justify-content: space-around;
  display: flex;
  gap: 12px;
  padding: 16px 0;
}

.stats span {
  font-size: 11px;
  color: #bbb;
  font-weight: bold;
}

.stats-num {
  font-size: 2em !important;
}

.preview-placeholder {
  padding: 12px;
  font-size: 11px;
  width: 100%;
  height: 280px;
  overflow-y: auto;
  text-overflow: ellipsis;
  display: flex;
  flex-direction: column;
  background: #000;
  border-radius: 0 0 4px 4px;
  flex: 1;
}

.preview-placeholder > div:first-child {
  flex: 1;
  overflow-y: auto;
}

.rename-tag {
  margin-top: 8px;
  margin-bottom: 4px;
  display: flex;
  justify-content: center;
}

.file-info-tags {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 8px;
  margin-bottom: 0;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.white-input .el-input__inner,
.white-input .el-textarea__inner {
  color: #fff;
  background: rgba(255,255,255,0.1);
  border-color: #666;
  font-weight: normal;
  font-size: 12px;
}
</style>

<style lang="less">
.local-select {
  .el-upload,
  .el-button {
    width: 100%;
  }
}
</style>
