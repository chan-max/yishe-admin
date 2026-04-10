<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue'
import { ElEmpty as ElEmptyBase } from 'element-plus'

defineOptions({
  inheritAttrs: false
})

const props = defineProps<{
  description?: string
  image?: string
  imageSize?: number | string
}>()

const attrs = useAttrs()
const slots = useSlots()

const resolvedImageSize = computed(() => {
  const normalized = Number(props.imageSize)
  return Number.isFinite(normalized) && normalized > 0 ? normalized : 64
})

const iconStyle = computed(() => ({
  '--app-empty-size': `${resolvedImageSize.value}px`
}))
</script>

<template>
  <ElEmptyBase
    v-bind="attrs"
    class="app-empty"
    :description="props.description"
    :image="props.image"
    :image-size="resolvedImageSize"
  >
    <template v-if="$slots.image" #image>
      <slot name="image" />
    </template>

    <template v-else-if="!props.image" #image>
      <div class="app-empty__icon" :style="iconStyle" aria-hidden="true">
        <svg
          t="1775812523352"
          class="app-empty__icon-svg"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
        >
          <path d="M512 113.777778C290.133333 113.777778 113.777778 290.133333 113.777778 512s179.2 398.222222 398.222222 398.222222 398.222222-179.2 398.222222-398.222222S733.866667 113.777778 512 113.777778z m170.666667 514.844444L628.622222 682.666667 512 566.044444 395.377778 682.666667 341.333333 628.622222l116.622223-116.622222-116.622223-116.622222 54.044445-54.044445 116.622222 116.622223 116.622222-116.622223 54.044445 54.044445-116.622223 116.622222 116.622223 116.622222z" fill="#666666" fill-opacity=".598" />
        </svg>
      </div>
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
    width: var(--app-empty-size, 116px);
    height: var(--app-empty-size, 116px);
    margin-bottom: 10px;
    overflow: visible;
  }

  :deep(.el-empty__description) {
    margin-top: 2px;
  }

  :deep(.el-empty__description p) {
    font-size: 13px;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.01em;
  }

  :deep(.el-empty__bottom) {
    margin-top: 14px;
  }
}

.app-empty__icon {
  width: var(--app-empty-size, 116px);
  height: var(--app-empty-size, 116px);
}

.app-empty__icon-svg {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
