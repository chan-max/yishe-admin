<template>
  <span style="height: 160px;" class="img-card relative" ref="imgCardRef" :class="{ imgIsChecked: isChecked }">
    <!-- 使用 el-image 替换原生 img -->
    <el-image style="height: 160px;min-width: 160px;" fit="contain" :src="info.ossObjectName" hide-on-click-modal
      @click="doCheck">
      <!-- 加载中的占位符 -->
      <template #placeholder>
        <div class="image-placeholder">
          <el-icon class="animate-spin">
            <Loading />
          </el-icon>
          <span>加载中...</span>
        </div>
      </template>

      <!-- 加载失败的占位符 -->
      <template #error>
        <div class="image-error">
          <el-icon>
            <Picture />
          </el-icon>
          <span>图片加载失败</span>
        </div>
      </template>
    </el-image>

    <!-- 分辨率信息 -->
    <div class="absolute top-2 left-2 text-xs font-bold text-resolution ">
      {{ info.resolutionWidth + '*' + info.resolutionHeight }}
    </div>

    <!-- 选中状态 -->
    <div v-if="isChecked" class="absolute top-2 right-2 text-xs font-bold text-resolution">
      <el-icon size="36" color="greenyellow">
        <CircleCheckFilled />
      </el-icon>
    </div>

    <!-- 文件名显示 -->
    <div class="absolute bottom-0 left-0 w-full p-2 text-white bg-gradient-to-t from-black/80 to-transparent">
      <span class="text-xs truncate">{{ info.imageName }}</span>
    </div>

    <!-- 鼠标悬停时的操作按钮 -->
    <transition name="fade">
      <div class="absolute bottom-0 left-0 w-full flex pb-6 gap-2 justify-center flex-wrap img-card-bottom"
        v-if="isHovered">
        <div>
          <el-button size="small" type="danger" round @click="doDelete">删除</el-button>
        </div>
        <div>
          <el-button size="small" type="primary" round @click="doPreview">预览</el-button>
        </div>
        <div>
          <el-button size="small" type="primary" round @click="doPicture">套图</el-button>
        </div>
      </div>
    </transition>
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElImage, ElButton, ElIcon } from 'element-plus';
import { Loading, Picture } from '@element-plus/icons-vue';
import { useElementHover } from '@vueuse/core';
import { api as viewerApi } from "v-viewer";
import { CircleCheckFilled } from '@element-plus/icons-vue';

const props = defineProps({
  isChecked: {
    type: Boolean,
    default: false,
  },
  info: {
    type: Object,
    default: () => ({
      ossObjectName: '',
      resolution: '',
      fileName: '',
      id: '',
    }),
  },
});

const isChecked = ref(props.isChecked);

// 监听外部传入的 isChecked 变化
watch(() => props.isChecked, (newVal) => {
  isChecked.value = newVal;
});


const emits = defineEmits(['delete', 'preview', 'check', 'picture']);

// 切换选中状态
function doCheck() {
  isChecked.value = !isChecked.value;
  emits('check', props.info.id, isChecked.value);
}

// 删除操作
function doDelete() {
  emits('delete', props.info);
}

function doPicture() {
  emits('picture', props.info);
}

// 预览操作
function doPreview() {
  viewerApi({
    images: [props.info.ossObjectName],
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

// 鼠标悬停状态
const imgCardRef = ref();
const isHovered = useElementHover(imgCardRef);
</script>

<style scoped>
.img-card {
  border-radius: 2px;
  overflow: hidden;
  position: relative;

  box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
}

.img-card:hover {
  transition: all 0.5s;
  transform: scale(1.01);
  z-index: 999;
}

.img-card-bottom {
  transition: all 1s;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.text-resolution {
  color: #333;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
}



.image-placeholder,
.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 12px;
}

.image-placeholder .el-icon,
.image-error .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

/* 文件名样式 */
.file-name {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 8px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
  color: white;
  font-size: 14px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.imgIsChecked {
  box-shadow: greenyellow 0px 2px 6px,
    greenyellow 0px 0px 0px 6px;
}
</style>