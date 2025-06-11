<template>
  <el-dialog
    v-model="dialogVisible"
    title="发布到社交媒体"
    fullscreen
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="social-media-container">
      <h2>选择要发布的平台</h2>
      <!-- 这里后续可以添加具体的社交媒体平台选择等内容 -->
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const dialogVisible = ref(false)

// 打开弹窗
const open = () => {
  dialogVisible.value = true
}

// 关闭弹窗
const close = () => {
  dialogVisible.value = false
}

// 暴露方法给父组件
defineExpose({
  open,
  close
})
</script>

<style scoped>
.social-media-container {
  padding: 20px;
}
</style> 