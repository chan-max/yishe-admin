<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`文件预览 - ${fileName}`"
    width="80%"
    :destroy-on-close="true"
    align-center
    @close="handleClose"
  >
    <div class="file-preview-container" :class="`file-preview-container--${previewType}`">
      <video
        v-if="previewType === 'video' && fileUrl"
        :src="fileUrl"
        controls
        autoplay
        class="preview-video"
        @error="handleMediaError"
      >
        您的浏览器不支持视频播放
      </video>

      <div v-else-if="previewType === 'audio' && fileUrl" class="preview-audio-shell">
        <el-icon size="56" color="var(--el-color-primary)">
          <Headset />
        </el-icon>
        <div class="preview-audio-meta">
          <div class="preview-audio-name">{{ fileName }}</div>
          <div class="preview-audio-tip">音频资源预览</div>
        </div>
        <audio
          :src="fileUrl"
          controls
          autoplay
          preload="metadata"
          class="preview-audio"
          @error="handleMediaError"
        />
      </div>

      <img
        v-else-if="previewType === 'image' && fileUrl"
        :src="fileUrl"
        :alt="fileName"
        class="preview-image"
        @error="handleImageError"
      />

      <iframe
        v-else-if="previewType === 'pdf' && fileUrl"
        :src="pdfPreviewUrl"
        class="preview-pdf"
        title="PDF 文件预览"
      />

      <div v-else class="file-preview-empty">
        <el-icon size="48" color="var(--el-text-color-secondary)">
          <component :is="fallbackIcon" />
        </el-icon>
        <p class="file-preview-empty__title">当前文件暂不支持在线预览</p>
        <p class="file-preview-empty__tip">可以直接下载或在新窗口中打开查看</p>
      </div>
    </div>

    <div v-if="previewType === 'pdf' && fileUrl" class="preview-tip">
      如果浏览器未正常展示 PDF，可尝试“新窗口打开”或“下载”。
    </div>
    
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button v-if="fileUrl" @click="handleOpenInNewTab">新窗口打开</el-button>
      <el-button type="primary" @click="handleDownload" v-if="fileUrl">下载</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, Headset, Document, Picture, Folder } from '@element-plus/icons-vue'
import { downloadFileByElement } from '@/common/download'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  fileUrl: {
    type: String,
    default: ''
  },
  fileName: {
    type: String,
    default: '文件资源'
  },
  fileSuffix: {
    type: String,
    default: ''
  }
})

const emits = defineEmits(['close'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => {
    if (!value) {
      emits('close')
    }
  }
})

function handleClose() {
  emits('close')
}

function handleDownload() {
  if (!props.fileUrl) {
    ElMessage.error('没有可下载的文件')
    return
  }
  
  try {
    const fileName = props.fileName || `file-resource.${normalizedSuffix.value || 'bin'}`
    downloadFileByElement(props.fileUrl, fileName)
    ElMessage.success('开始下载文件')
  } catch (error) {
    ElMessage.error('下载失败')
  }
}

function handleOpenInNewTab() {
  if (!props.fileUrl) return
  window.open(props.fileUrl, '_blank', 'noopener,noreferrer')
}

const normalizedSuffix = computed(() =>
  String(props.fileSuffix || '')
    .trim()
    .toLowerCase()
)

const previewType = computed<'video' | 'audio' | 'image' | 'pdf' | 'unknown'>(() => {
  const suffix = normalizedSuffix.value
  if (['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm', 'm4v', '3gp', 'ogv'].includes(suffix)) {
    return 'video'
  }
  if (['mp3', 'wav', 'aac', 'ogg', 'oga', 'm4a', 'flac', 'wma', 'opus', 'amr'].includes(suffix)) {
    return 'audio'
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'].includes(suffix)) {
    return 'image'
  }
  if (suffix === 'pdf') {
    return 'pdf'
  }
  return 'unknown'
})

const pdfPreviewUrl = computed(() => {
  if (!props.fileUrl) return ''
  return `${props.fileUrl}#toolbar=1&navpanes=0&scrollbar=1`
})

const fallbackIcon = computed(() => {
  switch (previewType.value) {
    case 'image':
      return Picture
    case 'pdf':
      return Document
    case 'audio':
      return Headset
    case 'video':
      return VideoPlay
    default:
      return Folder
  }
})

function handleMediaError(event: Event) {
  const media = event.target as HTMLMediaElement
  console.warn('媒体加载失败:', media.src)
  ElMessage.error('文件加载失败')
}

function handleImageError(event: Event) {
  const image = event.target as HTMLImageElement
  console.warn('图片加载失败:', image.src)
  ElMessage.error('图片加载失败')
}
</script>

<style scoped>
.file-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  overflow: hidden;
}

.file-preview-container--video,
.file-preview-container--image,
.file-preview-container--pdf {
  background: var(--el-bg-color-page);
}

.preview-video {
  width: 100%;
  height: 100%;
  max-height: 600px;
  object-fit: contain;
  background: #000;
}

.preview-image {
  max-width: 100%;
  max-height: 600px;
  object-fit: contain;
  background: var(--el-fill-color-blank);
}

.preview-pdf {
  width: 100%;
  min-height: 72vh;
  border: 0;
  background: #fff;
}

.preview-audio-shell {
  width: min(720px, 100%);
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--el-text-color-secondary);
  background: linear-gradient(180deg, var(--el-color-primary-light-9) 0%, var(--el-fill-color-blank) 100%);
}

.preview-audio-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.preview-audio-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.preview-audio-tip {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.preview-audio {
  width: min(560px, 100%);
  min-width: 280px;
  height: 42px;
  display: block;
}

.file-preview-empty {
  min-height: 320px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
}

.file-preview-empty__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.file-preview-empty__tip {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.preview-tip {
  padding: 10px 4px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-preview-container {
    min-height: 300px;
  }
  
  .preview-video {
    max-height: 400px;
  }

  .preview-pdf {
    min-height: 56vh;
  }

  .preview-audio-shell {
    padding: 20px 16px;
  }

  .preview-audio {
    min-width: 0;
    width: 100%;
  }
}
</style>
