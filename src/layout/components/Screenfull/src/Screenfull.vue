<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { Icon } from '@/components/Icon'
import { useFullscreen } from '@vueuse/core'
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'ScreenFull' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('screenfull')

const props = defineProps({
  color: propTypes.string.def(''),
  target: propTypes.string.def('') // 全屏目标选择器，为空时全屏整个文档
})

const emit = defineEmits(['change'])

// 全屏整个文档
const { toggle: toggleDoc, isFullscreen: isDocFullscreen } = useFullscreen()

// 全屏指定元素
const targetElement = ref<HTMLElement | null>(null)
const { toggle: toggleElement, isFullscreen: isElementFullscreen } = useFullscreen(targetElement)

const isFullscreen = computed(() => {
  return props.target ? isElementFullscreen.value : isDocFullscreen.value
})

const toggleFullscreen = async () => {
  if (props.target) {
    // 元素全屏模式
    const targetEl = document.querySelector(props.target)
    if (targetEl) {
      targetElement.value = targetEl
      await toggleElement(targetEl)
      emit('change', isElementFullscreen.value)
    }
  } else {
    // 文档全屏模式
    await toggleDoc()
    emit('change', isDocFullscreen.value)
  }
}

watch(isFullscreen, (val) => {
  emit('change', val)
})
</script>

<template>
  <div :class="prefixCls" @click="toggleFullscreen">
    <Icon
      :color="color"
      :icon="isFullscreen ? 'zmdi:fullscreen-exit' : 'zmdi:fullscreen'"
      :size="18"
    />
  </div>
</template>
