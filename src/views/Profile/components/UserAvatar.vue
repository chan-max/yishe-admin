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
  align-items: center;
  justify-content: center;
  width: 92px;
  height: 92px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
}
</style>
