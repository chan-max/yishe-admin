<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-10 08:47:00
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-10 18:45:37
 * @FilePath: /design-server/Users/jackie/workspace/yishe-admin/src/views/crm/product/SocialMediaDialog.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
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