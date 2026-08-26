<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { isDark } from '@/utils/is'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'
import routerSearch from '@/components/RouterSearch/index.vue'
import ToolWindowHost from '@/components/ToolWindowHost/index.vue'
import GlobalUploadTaskPanel from '@/components/GlobalUploadTaskPanel.vue'
import GlobalTemuBatchProgress from '@/components/GlobalTemuBatchProgress.vue'
import AiAssistantFloating from '@/components/AiAssistantFloating.vue'

defineOptions({ name: 'APP' })

const route = useRoute()
const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('app')
const appStore = useAppStore()
const currentSize = computed(() => appStore.getCurrentSize)
const greyMode = computed(() => appStore.getGreyMode)
const { wsCache } = useCache()

// 是否是项目介绍页面
const isIntroPage = computed(() => route.name === 'Intro')

// 控制 intro 页面滚动
watch(isIntroPage, (isIntro) => {
  if (isIntro) {
    document.documentElement.style.overflow = 'auto'
    document.body.style.overflow = 'auto'
  } else {
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
  }
}, { immediate: true })

// 根据浏览器当前主题设置系统主题色
const setDefaultTheme = () => {
  let isDarkTheme = wsCache.get(CACHE_KEY.IS_DARK)
  if (isDarkTheme === null) {
    isDarkTheme = isDark()
  }
  appStore.setIsDark(isDarkTheme)
}
setDefaultTheme()
</script>
<template>
  <ConfigGlobal :size="currentSize">
    <RouterView :class="greyMode ? `${prefixCls}-grey-mode` : ''" />
    <routerSearch v-if="!isIntroPage" />
    <ToolWindowHost v-if="!isIntroPage" />
    <AiAssistantFloating v-if="!isIntroPage" />
    <GlobalUploadTaskPanel v-if="!isIntroPage" />
    <GlobalTemuBatchProgress v-if="!isIntroPage" />
  </ConfigGlobal>
</template>
<style lang="scss">
$prefix-cls: #{$namespace}-app;

.size {
  width: 100%;
  height: 100%;
}

html,
body {
  @extend .size;

  padding: 0 !important;
  margin: 0;
  overflow: hidden;

  #app {
    @extend .size;
  }
}

.#{$prefix-cls}-grey-mode {
  filter: grayscale(100%);
}
</style>
