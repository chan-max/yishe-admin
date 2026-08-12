<template>
  <template v-if="activeComponent">
    <keep-alive v-if="!noCache" :max="20">
      <component :is="activeComponent" :key="tabKey" />
    </keep-alive>
    <component :is="activeComponent" v-else :key="tabKey" />
  </template>
  <div v-else class="split-pane-content__empty">{{ t("layout.split.emptyPane") }}</div>
</template>

<script setup lang="ts">
import { computed, provide, reactive, watch } from "vue"
import { routeLocationKey, useRouter } from "vue-router"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import { useSplitStore } from "@/store/modules/split"

const props = defineProps<{ side: "left" | "right" }>()

const router = useRouter()
const splitStore = useSplitStore()
const { t } = useI18n()

const pane = computed(() =>
  props.side === "left" ? splitStore.leftPane : splitStore.rightPane,
)
const activeTab = computed(
  () => pane.value.tabs.find((t) => t.id === pane.value.activeTabId) ?? null,
)
const tabKey = computed(() => activeTab.value?.id ?? "")

// 为面板注入与当前标签匹配的路由上下文，
// 使面板内页面通过 useRoute() 读到的是该标签的路由而非地址栏路由，
// 即使该面板当前不是活动面板也能读到正确数据
const fakeRoute = reactive(
  router.resolve(
    activeTab.value?.fullPath || router.currentRoute.value.fullPath,
  ),
)
watch(
  () => activeTab.value?.fullPath,
  (fullPath) => {
    Object.assign(
      fakeRoute,
      fullPath ? router.resolve(fullPath) : router.currentRoute.value,
    )
  },
  { immediate: true },
)
provide(
  routeLocationKey,
  fakeRoute as unknown as RouteLocationNormalizedLoaded,
)

const activeComponent = computed(() => {
  const fullPath = activeTab.value?.fullPath
  if (!fullPath) return null
  try {
    const resolved = router.resolve(fullPath)
    const record = resolved.matched[resolved.matched.length - 1]
    return record?.components?.default ?? null
  } catch {
    return null
  }
})

const noCache = computed(() => {
  try {
    return router.resolve(activeTab.value?.fullPath || "").meta?.noCache === true
  } catch {
    return false
  }
})
</script>

<style scoped>
.split-pane-content__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;
  cursor: pointer;
}
</style>