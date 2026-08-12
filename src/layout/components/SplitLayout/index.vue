<template>
  <div class="split-layout">
    <!-- 分屏模式 -->
    <SplitPane
      v-if="splitStore.isEnabled"
      :default-size="splitStore.splitPercent"
      direction="horizontal"
    >
      <template #left>
        <SplitPaneTabs side="left" />
      </template>
      <template #right>
        <SplitPaneTabs side="right" />
      </template>
    </SplitPane>

    <!-- 单屏模式 -->
    <router-view v-else>
      <template #default="{ Component, route }">
        <keep-alive :max="keepAliveMax">
          <component :is="Component" v-if="shouldCacheRoute(route)" :key="getComponentKey(route)" />
        </keep-alive>
        <component :is="Component" v-if="!shouldCacheRoute(route)" :key="getComponentKey(route)" />
      </template>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { useSplitStore } from '@/store/modules/split'
import SplitPane from '@/components/SplitPane/index.vue'
import SplitPaneTabs from './SplitPaneTabs.vue'

defineProps<{
  keepAliveMax: number
  shouldCacheRoute: (route: any) => boolean
  getComponentKey: (route: any) => string
}>()

const splitStore = useSplitStore()
</script>

<style scoped>
.split-layout {
  width: 100%;
  height: 100%;
}
</style>
