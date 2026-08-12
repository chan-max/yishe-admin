<template>
  <div class="split-layout">
    <!-- 分屏模式 -->
    <SplitPane
      v-if="splitStore.enabled"
      :size="splitStore.splitPercent"
      :min-size="20"
      :max-size="80"
      @update:size="splitStore.setSplitPercent"
    >
      <template #left>
        <SplitPaneView side="left" />
      </template>
      <template #right>
        <SplitPaneView side="right" />
      </template>
    </SplitPane>

    <!-- 单屏模式 -->
    <router-view v-else v-slot="{ Component, route }">
      <keep-alive :max="keepAliveMax">
        <component
          :is="Component"
          v-if="shouldCacheRoute(route)"
          :key="getComponentKey(route)"
        />
      </keep-alive>
      <component
        :is="Component"
        v-if="!shouldCacheRoute(route)"
        :key="getComponentKey(route)"
      />
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { watch } from "vue"
import { useRouter } from "vue-router"
import { useSplitStore } from "@/store/modules/split"
import SplitPane from "@/components/SplitPane/index.vue"
import SplitPaneView from "./SplitPaneView.vue"

const props = defineProps<{
  keepAliveMax: number
  shouldCacheRoute: (route: any) => boolean
  getComponentKey: (route: any) => string
}>()

const router = useRouter()
const splitStore = useSplitStore()

// 保证「活动面板的当前标签」始终与地址栏 URL 一致。
// 标签/菜单点击等由 UI 主动发起的跳转会通过 suspendSync 临时挂起，
// 因此这里的同步只处理浏览器前进后退、外部 push、URL 变更等场景，
// 同时兜底分屏开启时用当前路由初始化活动面板。
function syncLivePane() {
  if (!splitStore.enabled || splitStore.syncSuspended) return
  const side = splitStore.activePane
  const fullPath = router.currentRoute.value.fullPath
  const existing = splitStore.findTab(side, fullPath)
  if (existing) {
    splitStore.setActiveTab(side, existing.id)
  } else {
    const metaTitle = router.currentRoute.value.meta?.title
    const title =
      (typeof metaTitle === "string" && metaTitle) ||
      fullPath.split("/").filter(Boolean).pop() ||
      fullPath
    splitStore.openInPane(side, {
      fullPath,
      title,
      name: String(router.currentRoute.value.name ?? ""),
    })
  }
}

watch(() => router.currentRoute.value.fullPath, syncLivePane)
watch(() => splitStore.enabled, syncLivePane, { immediate: true })
watch(() => splitStore.activePane, syncLivePane)
</script>

<style scoped>
.split-layout {
  width: 100%;
  height: 100%;
}
</style>