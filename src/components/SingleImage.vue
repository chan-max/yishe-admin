<template>
  <el-image
  v-bind="$attrs" style="width: 120px; object-fit: contain" :src="src"
    class="cursor-pointer" @click="doPreview(src)">
    <template #placeholder>
      <div class="img-loading" style="min-width: 120px;min-height:120px;">
      </div>
    </template>
    <template #error>
      <div class="flex items-center justify-center w-full h-full" style="color: red;min-height:80px;">
        加载失败
      </div>
    </template>
  </el-image>
</template>

<script setup>
import { api as viewerApi } from "v-viewer";
const props = defineProps({
  src:{
    default:''
  }
})

async function doPreview(url) {
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