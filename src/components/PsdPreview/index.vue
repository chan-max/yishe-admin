<template>
  <div class="psd-preview">
    <el-dialog
      v-model="visible"
      title="PSD 预览"
      width="80%"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      destroy-on-close
    >
      <div class="psd-preview-content" v-loading="loading">
        <div v-if="!loading && psdData" class="psd-layers">
          <div class="psd-layers-tree">
            <div class="layer-item" v-for="(layer, index) in psdData.layers" :key="index">
              <div class="layer-info">
                <span class="layer-name">{{ layer.name }}</span>
                <span class="layer-size">{{ layer.width }}x{{ layer.height }}</span>
              </div>
            </div>
          </div>
          <div class="psd-preview-image">
            <img :src="previewImage" alt="PSD Preview" />
          </div>
        </div>
        <div v-else-if="!loading && !psdData" class="no-data">
          无法加载 PSD 文件
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import * as agPsd from 'ag-psd'

const props = defineProps<{
  modelValue: boolean
  psdUrl: string
}>()

const emit = defineEmits(['update:modelValue'])

const visible = ref(props.modelValue)
const loading = ref(false)
const psdData = ref(null)
const previewImage = ref('')

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(() => visible.value, (val) => {
  emit('update:modelValue', val)
})

const loadPsd = async () => {
  await nextTick()


  if (!props.psdUrl) return
  
  loading.value = true
  try {
    const response = await fetch(props.psdUrl)
    const arrayBuffer = await response.arrayBuffer()
    const psd = await agPsd.readPsd(arrayBuffer)
    psdData.value = psd
    
    // 创建预览图
    const canvas = document.createElement('canvas')
    canvas.width = psd.width
    canvas.height = psd.height
    const ctx = canvas.getContext('2d')
    
    // 绘制所有可见图层
    psd.layers.forEach(layer => {
      if (layer.visible) {
        const imageData = new ImageData(
          new Uint8ClampedArray(layer.imageData),
          layer.width,
          layer.height
        )
        ctx.putImageData(imageData, layer.left, layer.top)
      }
    })
    
    previewImage.value = canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Failed to load PSD:', error)
    psdData.value = null
  } finally {
    loading.value = false
  }
}

watch(() => props.psdUrl, () => {

  if (visible.value) {
    loadPsd()
  }
})

onMounted(() => {
  if (visible.value) {
    loadPsd()
  }
})
</script>

<style lang="less" scoped>
.psd-preview {
  &-content {
    min-height: 400px;
    display: flex;
    gap: 20px;
  }
  
  .psd-layers {
    display: flex;
    gap: 20px;
    width: 100%;
    
    &-tree {
      width: 300px;
      border-right: 1px solid #eee;
      padding-right: 20px;
      overflow-y: auto;
      max-height: 600px;
    }
    
    .layer-item {
      padding: 8px;
      border-bottom: 1px solid #eee;
      
      .layer-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .layer-name {
          font-size: 14px;
        }
        
        .layer-size {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }
  
  .psd-preview-image {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    
    img {
      max-width: 100%;
      max-height: 600px;
      object-fit: contain;
    }
  }
  
  .no-data {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 400px;
    color: #999;
  }
}
</style> 