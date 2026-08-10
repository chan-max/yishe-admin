<template>
  <div class="change-avatar">
    <el-avatar :src="img" :size="92">
      <Icon icon="ep:user" />
    </el-avatar>
  </div>
</template>

<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'UserAvatar' })

defineProps({
  img: propTypes.string.def('')
})
</script>

<style lang="scss" scoped>
.change-avatar {
  display: flex;
  width: 92px;
  height: 92px;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 999px;
  align-items: center;
  justify-content: center;
}
</style>
