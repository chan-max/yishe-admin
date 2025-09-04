<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`文件预览 - ${videoName}`"
    width="80%"
    :destroy-on-close="true"
    align-center
    @close="handleClose"
  >
    <div class="video-preview-container">
      <video
        v-if="videoUrl"
        :src="videoUrl"
        controls
        autoplay
        class="preview-video"
        @error="handleVideoError"
      >
        您的浏览器不支持视频播放
      </video>
      <div v-else class="no-video">
        <el-icon size="48" color="#999">
          <VideoPlay />
        </el-icon>
        <p class="text-gray-500 mt-2">暂无视频</p>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="handleDownload" v-if="videoUrl">下载</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay } from '@element-plus/icons-vue'
import { downloadFileByElement } from '@/common/download'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  videoUrl: {
    type: String,
    default: ''
  },
  videoName: {
    type: String,
    default: '剪辑素材'
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
  if (!props.videoUrl) {
    ElMessage.error('没有可下载的视频')
    return
  }
  
  try {
    const fileName = props.videoName || 'clip-material.mp4'
    downloadFileByElement(props.videoUrl, fileName)
    ElMessage.success('开始下载视频')
  } catch (error) {
    ElMessage.error('下载失败')
  }
}

function handleVideoError(event: Event) {
  const video = event.target as HTMLVideoElement
  console.warn('视频加载失败:', video.src)
  ElMessage.error('视频加载失败')
}
</script>

<style scoped>
.video-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.preview-video {
  width: 100%;
  height: 100%;
  max-height: 600px;
  object-fit: contain;
}

.no-video {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-preview-container {
    min-height: 300px;
  }
  
  .preview-video {
    max-height: 400px;
  }
}
</style>
