<template>
  <el-image
    v-bind="$attrs"
    :style="imageStyle"
    :src="src"
    :fit="fit"
    class="single-image cursor-pointer"
    @click="doPreview(src)">
    <template #placeholder>
      <div class="img-loading" :style="placeholderStyle">
      </div>
    </template>
    <template #error>
      <div class="single-image-error" :style="placeholderStyle">
        加载失败
      </div>
    </template>
  </el-image>
</template>

<script setup>
import { computed } from 'vue'
import { api as viewerApi } from "v-viewer";
const props = defineProps({
  src:{
    default:''
  },
  width: {
    type: [String, Number],
    default: 120
  },
  height: {
    type: [String, Number],
    default: 120
  },
  fit: {
    type: String,
    default: 'contain'
  }
})

const normalizeSize = (value) => {
  if (value === undefined || value === null || value === '') return undefined
  return typeof value === 'number' ? `${value}px` : value
}

const imageStyle = computed(() => ({
  width: normalizeSize(props.width),
  height: normalizeSize(props.height)
}))

const placeholderStyle = computed(() => ({
  minWidth: normalizeSize(props.width),
  minHeight: normalizeSize(props.height),
  width: '100%',
  height: '100%'
}))

async function doPreview(url) {
  if (!url) return
  viewerApi({
    images: [url],
    options: {
      toolbar: {
        flipHorizontal: {
          show: true,
        },
        flipVertical: {
          show: true,
        },
        next: {
          show: false,
        },
        oneToOne: {
          show: true,
        },
        play: {
          show: false,
        },
        prev: {
          show: false,
        },
        reset: {
          show: true,
        },
        rotateLeft: {
          show: true,
        },
        rotateRight: {
          show: true,
        },
        zoomIn: {
          show: true,
        },
        zoomOut: {
          show: true,
        },
      },
    },
  });
}

</script>

<style lang="less">
.single-image {
  display: block;
}

.img-loading {
  width: 100%;
  height: 100%;
  list-style: none;
  background-image: linear-gradient(100deg, #fafafa 25%, #eaeaea 37%, #fafafa 63%);
  background-size: 400% 100%;
  background-position: 100% 50%;
  animation: skeleton-loading 1.4s ease infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0 50%;
  }
}


.cursor-pointer{

}

.single-image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f56c6c;
  background: #fafafa;
  font-size: 12px;
}

// .cursor-pointer,
.viewer-canvas {
  img {
    background-image: linear-gradient(45deg, rgba(240, 240, 240, 0.8) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(240, 240, 240, 0.8) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(240, 240, 240, 0.8) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(240, 240, 240, 0.8) 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    background-color: rgba(245, 245, 245, 0.5);
  }
}
</style>
