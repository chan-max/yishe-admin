<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="image-preview-overlay"
      @click="handleOverlayClick"
      @keydown.esc="close"
      tabindex="0"
    >
      <div class="image-preview-container">
        <!-- 关闭按钮 -->
        <button class="image-preview-close" @click.stop="close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <!-- 图片容器 -->
        <div class="image-preview-content">
          <img
            ref="imageRef"
            :src="currentImage"
            :alt="alt"
            class="image-preview-img"
            :style="imageStyle"
            @click="handleImageClick"
            @load="handleImageLoad"
            @error="handleImageError"
            @wheel="handleWheel"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseUp"
          />
        </div>

        <!-- 工具栏 -->
        <div class="image-preview-toolbar" @click.stop>
          <!-- 缩放控制 -->
          <button class="toolbar-btn" @click="zoomOut" title="缩小">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
              <path d="M8 11h6" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          
          <span class="zoom-text">{{ Math.round(scale * 100) }}%</span>
          
          <button class="toolbar-btn" @click="zoomIn" title="放大">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
              <path d="M11 8v6M8 11h6" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>

          <!-- 旋转控制 -->
          <button class="toolbar-btn" @click="rotateLeft" title="逆时针旋转">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
          
          <button class="toolbar-btn" @click="rotateRight" title="顺时针旋转">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>

          <!-- 重置 -->
          <button class="toolbar-btn" @click="reset" title="重置">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" stroke-width="2" fill="none"/>
              <path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" fill="none"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" stroke-width="2" fill="none"/>
              <path d="M8 16l-5 5v-5" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>

          <!-- 适应屏幕 -->
          <button class="toolbar-btn" @click="fitToScreen" title="适应屏幕">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
        </div>


      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

interface Props {
  visible: boolean
  imageUrl: string
  alt?: string
}

const props = withDefaults(defineProps<Props>(), {
  alt: '图片预览'
})

const emit = defineEmits<{
  close: []
}>()

// 状态管理
const scale = ref(1)
const rotation = ref(0)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const hasDragged = ref(false)
const imageRef = ref<HTMLImageElement>()

// 计算属性
const currentImage = computed(() => props.imageUrl)

const imageStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value}) rotate(${rotation.value}deg)`,
  cursor: isDragging.value ? 'grabbing' : 'grab'
}))

// 方法
const close = () => {
  emit('close')
}

const handleOverlayClick = (e: MouseEvent) => {
  console.log('handleOverlayClick',e)
  // close()
}

const handleImageClick = (e: MouseEvent) => {
  // 只有在没有拖动的情况下才关闭预览
  if (!hasDragged.value) {
    close()
  }
}

const zoomIn = () => {
  scale.value = Math.min(scale.value * 1.2, 5)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value / 1.2, 0.1)
}

const rotateLeft = () => {
  rotation.value -= 90
}

const rotateRight = () => {
  rotation.value += 90
}

const reset = () => {
  scale.value = 1
  rotation.value = 0
  translateX.value = 0
  translateY.value = 0
}

const fitToScreen = () => {
  if (!imageRef.value) return
  
  const img = imageRef.value
  const container = img.parentElement
  if (!container) return
  
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const imgWidth = img.naturalWidth
  const imgHeight = img.naturalHeight
  
  const scaleX = containerWidth / imgWidth
  const scaleY = containerHeight / imgHeight
  scale.value = Math.min(scaleX, scaleY, 1) * 0.9
  
  translateX.value = 0
  translateY.value = 0
}



const handleImageLoad = () => {
  nextTick(() => {
    fitToScreen()
  })
}

const handleImageError = () => {
  console.error('图片加载失败:', currentImage.value)
}

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  if (e.deltaY < 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

const handleMouseDown = (e: MouseEvent) => {
  isDragging.value = true
  hasDragged.value = false
  dragStart.value = { x: e.clientX - translateX.value, y: e.clientY - translateY.value }
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  hasDragged.value = true
  translateX.value = e.clientX - dragStart.value.x
  translateY.value = e.clientY - dragStart.value.y
}

const handleMouseUp = () => {
  isDragging.value = false
  // 延迟重置hasDragged，确保click事件能正确判断
  setTimeout(() => {
    hasDragged.value = false
  }, 100)
}

// 键盘事件处理
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.visible) return
  
  switch (e.key) {
    case 'Escape':
      close()
      break
    case '+':
    case '=':
      zoomIn()
      break
    case '-':
      zoomOut()
      break
    case '0':
      reset()
      break
  }
}

// 监听器

watch(() => props.visible, (visible) => {
  if (visible) {
    document.body.style.overflow = 'hidden'
    nextTick(() => {
      const overlay = document.querySelector('.image-preview-overlay') as HTMLElement
      overlay?.focus()
    })
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(240, 240, 240, 0.95);
  background-image: 
    linear-gradient(45deg, #b0b0b0 25%, transparent 25%), 
    linear-gradient(-45deg, #b0b0b0 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #b0b0b0 75%), 
    linear-gradient(-45deg, transparent 75%, #b0b0b0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  z-index: 99999999;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
}

.image-preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.image-preview-close:hover {
  background: rgba(0, 0, 0, 0.7);
}

.image-preview-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-preview-img {
  max-width: none;
  max-height: none;
  user-select: none;
  -webkit-user-drag: none;
}

.image-preview-toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.7);
  padding: 12px 16px;
  border-radius: 24px;
  z-index: 10;
}

.toolbar-btn {
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.zoom-text {
  color: white;
  font-size: 14px;
  min-width: 50px;
  text-align: center;
}


</style>
