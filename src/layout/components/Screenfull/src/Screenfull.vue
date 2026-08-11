<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { Icon } from '@/components/Icon'
import { useFullscreen } from '@vueuse/core'
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'ScreenFull' })

const { t } = useI18n();

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
  <div
    :class="prefixCls"
    role="button"
    tabindex="0"
    :aria-label="isFullscreen ? t('layout.screenfull.exitFullscreen') : t('layout.screenfull.fullscreen')"
    @click="toggleFullscreen"
    @keydown.enter="toggleFullscreen"
  >
    <span class="th-action-icon">
      <Icon
        :color="color"
        :icon="isFullscreen ? 'zmdi:fullscreen-exit' : 'zmdi:fullscreen'"
        :size="18"
      />
    </span>
    <span class="th-action-label">{{ t("layout.screenfull.fullscreen") }}</span>
  </div>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-screenfull;

.#{$prefix-cls} {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: none;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;

  &:active {
    transform: scale(0.94);
  }
}
</style>
