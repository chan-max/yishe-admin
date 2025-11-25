<template>
  <div class="psd-preview">
    <el-dialog
      v-model="visible"
      title="PSD 预览"
      width="90%"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      destroy-on-close
      @closed="handleDialogClosed"
    >
      <div class="psd-preview-content" v-loading="loading">
        <iframe
          ref="photopeaIframe"
          src="https://www.photopea.com"
          class="photopea-iframe"
          frameborder="0"
          @load="handleIframeLoad"
        ></iframe>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: boolean
  psdUrl: string
}>()

const emit = defineEmits(['update:modelValue'])

const visible = ref(props.modelValue)
const loading = ref(false)
const photopeaIframe = ref<HTMLIFrameElement | null>(null)
const iframeLoaded = ref(false)

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    nextTick(() => {
      loadPsd()
    })
  }
})

watch(() => visible.value, (val) => {
  emit('update:modelValue', val)
})

// 监听 iframe 加载完成
const handleIframeLoad = () => {
  // 等待一小段时间，确保 Photopea 完全初始化
  setTimeout(() => {
    iframeLoaded.value = true
    // iframe 加载完成后，如果有 PSD URL，则加载
    if (visible.value && props.psdUrl) {
      loadPsd()
    }
  }, 1000) // 等待 1 秒确保 Photopea 完全加载
}

// 加载 PSD 文件到 Photopea
const loadPsd = async () => {
  if (!props.psdUrl || !photopeaIframe.value) {
    return
  }

  // 如果 iframe 还没加载完成，等待
  if (!iframeLoaded.value) {
    // 延迟重试
    setTimeout(() => {
      if (visible.value && props.psdUrl) {
        loadPsd()
      }
    }, 500)
    return
  }

  loading.value = true
  try {
    // 获取 PSD 文件的 ArrayBuffer
    const response = await fetch(props.psdUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PSD file: ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    
    // 通过 postMessage 发送 PSD 文件到 Photopea
    // Photopea 支持通过 postMessage 接收文件数据
    if (photopeaIframe.value?.contentWindow) {
      // 等待一小段时间确保 Photopea 准备好接收消息
      setTimeout(() => {
        if (photopeaIframe.value?.contentWindow) {
          // 使用 Transferable 对象提高大文件传输性能
          photopeaIframe.value.contentWindow.postMessage(
            {
              file: arrayBuffer
            },
            '*',
            [arrayBuffer] // Transferable 对象，提高性能
          )
          loading.value = false
        }
      }, 500)
    }
  } catch (error) {
    console.error('Failed to load PSD:', error)
    loading.value = false
  }
}

// 对话框关闭时的处理
const handleDialogClosed = () => {
  iframeLoaded.value = false
}

// 监听 psdUrl 变化
watch(() => props.psdUrl, () => {
  if (visible.value && iframeLoaded.value) {
    loadPsd()
  }
})

onUnmounted(() => {
  // 清理
  iframeLoaded.value = false
})
</script>

<style lang="less" scoped>
.psd-preview {
  &-content {
    min-height: 600px;
    width: 100%;
    position: relative;
  }
  
  .photopea-iframe {
    width: 100%;
    height: 80vh;
    min-height: 600px;
    border: none;
  }
}
</style> 