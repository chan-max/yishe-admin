<script setup lang="ts">
import { useAttrs, useSlots } from 'vue'
import { ElEmpty as ElEmptyBase } from 'element-plus'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  description?: string
  image?: string
  imageSize?: number | string
}>()

const attrs = useAttrs()
const slots = useSlots()
</script>

<template>
  <ElEmptyBase
    v-bind="attrs"
    class="app-empty"
    :description="props.description"
    :image="props.image"
    :image-size="props.imageSize"
  >
    <template v-if="$slots.image" #image>
      <slot name="image" />
    </template>

    <template v-if="slots.description" #description>
      <slot name="description" />
    </template>

    <slot />
  </ElEmptyBase>
</template>

<style scoped lang="scss">
.app-empty {
  :deep(.el-empty__image) {
    display: none;
  }

  :deep(.el-empty__description) {
    margin-top: 0;
  }

  :deep(.el-empty__description p) {
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-placeholder);
  }

  :deep(.el-empty__bottom) {
    margin-top: 12px;
  }
}
</style>
