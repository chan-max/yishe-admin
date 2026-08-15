<template>
  <div class="data-collect-page">
    <!-- 主体左右分栏 -->
    <div class="data-collect-layout">
      <!-- 左侧极简菜单栏 -->
      <aside class="collect-menu">
        <div class="menu-header">数据采集</div>
        <nav class="menu-list">
          <div
            v-for="item in menuItems"
            :key="item.key"
            class="menu-item"
            :class="{ 'is-active': activeTab === item.key }"
            @click="switchTab(item.key)"
          >
            <span class="menu-item-text">{{ item.name }}</span>
          </div>
        </nav>
      </aside>

      <!-- 右侧主体内容 -->
      <main class="collect-body">
        <keep-alive>
          <component :is="activeComponent" :key="activeTab" />
        </keep-alive>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GoogleArtView from '../google-art/index.vue'
import PinterestView from '../pinterest/index.vue'
import WikimediaView from '../wikimedia/index.vue'
import PexelsView from '../pexels/index.vue'
import PixabayView from '../pixabay/index.vue'
import RawpixelView from '../rawpixel/index.vue'
import StockSnapView from '../stocksnap/index.vue'
import OpenverseView from '../openverse/index.vue'
import KaboompicsView from '../kaboompics/index.vue'
import OpenclipartView from '../openclipart/index.vue'

defineOptions({
  name: 'ExternalDataCollect',
})

const route = useRoute()
const router = useRouter()

type TabKey = 'google-art' | 'pinterest' | 'wikimedia' | 'pexels' | 'pixabay' | 'rawpixel' | 'stocksnap' | 'openverse' | 'kaboompics' | 'openclipart'

const activeTab = ref<TabKey>('google-art')

const menuItems = [
  {
    key: 'google-art' as TabKey,
    name: 'Google Arts & Culture',
    component: markRaw(GoogleArtView),
  },
  {
    key: 'pinterest' as TabKey,
    name: 'Pinterest',
    component: markRaw(PinterestView),
  },
  {
    key: 'wikimedia' as TabKey,
    name: 'Wikimedia Commons',
    component: markRaw(WikimediaView),
  },
  {
    key: 'pexels' as TabKey,
    name: 'Pexels 高清摄影',
    component: markRaw(PexelsView),
  },
  {
    key: 'pixabay' as TabKey,
    name: 'Pixabay 免费图库',
    component: markRaw(PixabayView),
  },
  {
    key: 'rawpixel' as TabKey,
    name: 'Rawpixel 艺术图库',
    component: markRaw(RawpixelView),
  },
  {
    key: 'stocksnap' as TabKey,
    name: 'StockSnap 免版权图库',
    component: markRaw(StockSnapView),
  },
  {
    key: 'openverse' as TabKey,
    name: 'Openverse 开放图库',
    component: markRaw(OpenverseView),
  },
  {
    key: 'kaboompics' as TabKey,
    name: 'Kaboompics 免费高清图库',
    component: markRaw(KaboompicsView),
  },
  {
    key: 'openclipart' as TabKey,
    name: 'Openclipart 免费矢量插画',
    component: markRaw(OpenclipartView),
  },
]

const activeComponent = computed(() => {
  const target = menuItems.find((m) => m.key === activeTab.value)
  return target ? target.component : GoogleArtView
})

const switchTab = (key: TabKey) => {
  if (activeTab.value === key) return
  activeTab.value = key
  router.replace({
    query: {
      ...route.query,
      tab: key,
    },
  })
}

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && menuItems.some((m) => m.key === newTab)) {
      if (activeTab.value !== newTab) {
        activeTab.value = newTab as TabKey
      }
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.data-collect-page {
  width: 100%;
  height: 100%;
}

.data-collect-layout {
  display: flex;
  gap: 16px;
  min-height: calc(100vh - 110px);
}

/* 左侧极简菜单 */
.collect-menu {
  width: 160px;
  flex-shrink: 0;
  background: var(--el-bg-color, #ffffff);
  border: 1px solid var(--el-border-color-lighter, #e5e7eb);
  border-radius: 8px;
  padding: 14px 8px;
}

.menu-header {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary, #9ca3af);
  padding: 0 10px 10px 10px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color-extra-light, #f3f4f6);
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--el-text-color-primary, #374151);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  user-select: none;
}

.menu-item:hover {
  background: var(--el-fill-color-light, #f9fafb);
}

.menu-item.is-active {
  background: var(--el-fill-color, #f3f4f6);
  color: var(--el-color-primary, #4f46e5);
  font-weight: 600;
}

/* 右侧内容容器 */
.collect-body {
  flex: 1;
  min-width: 0;
  background: var(--el-bg-color, #ffffff);
  border: 1px solid var(--el-border-color-lighter, #e5e7eb);
  border-radius: 8px;
  padding: 24px;
  overflow: auto;
}
</style>
