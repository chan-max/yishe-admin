<script lang="ts" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import { useAppStore } from '@/store/modules/app'
import { Icon } from '@/components/Icon'
import { useFullscreen } from '@vueuse/core'

defineOptions({ name: 'AppView' })

const appStore = useAppStore()
const tagsViewStore = useTagsViewStore()

const footer = computed(() => appStore.getFooter)
const getCaches = computed((): string[] => tagsViewStore.getCachedViews)

// 全屏功能
const appViewRef = ref<HTMLElement | null>(null)
const { toggle: toggleFullscreen, isFullscreen } = useFullscreen(appViewRef)

// 无感刷新
const routerAlive = ref(true)
const reload = () => {
  routerAlive.value = false
  nextTick(() => (routerAlive.value = true))
}
provide('reload', reload)
</script>

<template>
  <section
    ref="appViewRef"
    :id="'app-view-main'"
    :class="[
      'p-[var(--app-content-padding)] w-full bg-[var(--app-content-bg-color)] relative',
      {
        '!min-h-[calc(100vh-var(--top-tool-height)-var(--tags-view-height)-var(--app-footer-height))] pb-0':
          footer
      }
    ]"
  >
    <!-- 全屏按钮 - 角标风格 -->
    <div class="absolute right-3 top-2 z-10">
      <button
        type="button"
        class="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--app-content-surface-color)] border border-[var(--app-content-border-color)] text-[var(--app-content-text-color)] hover:bg-[var(--app-content-surface-muted-color)] hover:border-[var(--ai-primary)] transition-all shadow-md hover:shadow-lg"
        @click.stop="toggleFullscreen"
        title="全屏"
      >
        <Icon :icon="isFullscreen ? 'zmdi:fullscreen-exit' : 'zmdi:fullscreen'" :size="10" />
      </button>
    </div>

    <router-view v-if="routerAlive">
      <template #default="{ Component, route }">
        <keep-alive :include="getCaches">
          <component :is="Component" :key="route.fullPath" />
        </keep-alive>
      </template>
    </router-view>
  </section>
</template>

<style lang="scss" scoped>
#app-view-main:fullscreen,
#app-view-main:-webkit-full-screen,
#app-view-main:-moz-full-screen,
#app-view-main:-ms-fullscreen {
  height: 100vh;
  padding: var(--app-content-padding);
  background-color: var(--app-content-bg-color);
}
</style>
