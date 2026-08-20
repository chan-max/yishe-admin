<template>
  <div class="collect-page">
    <div class="collect-layout">
      <aside class="collect-menu">
        <div class="menu-header">新闻资讯采集</div>
        <nav class="menu-list">
          <div
            v-for="group in menuGroups"
            :key="group.label"
            class="menu-group"
          >
            <div class="menu-group__label">{{ group.label }}</div>
            <div
              v-for="item in group.items"
              :key="item.key"
              class="menu-item"
              :class="{ 'is-active': activeKey === item.key }"
              @click="switchTab(item.key)"
            >
              <span class="menu-item-text">{{ item.label }}</span>
            </div>
          </div>
        </nav>
      </aside>

      <main class="collect-body">
        <KeepAlive :max="6">
          <ServicePanel
            v-if="activeSource"
            :key="activeSource.key"
            :plugin-key="activeSource.key"
            :title="activeSource.label"
            :subtitle="activeSource.desc"
            :fields="activeSource.fields"
          />
        </KeepAlive>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ServicePanel from '../components/ServicePanel.vue'
import { NEWS_SOURCES } from '@/api/external/news/config'

defineOptions({ name: 'ExternalNewsCollect' })

const route = useRoute()
const router = useRouter()

const activeKey = ref<string>('hackernews')

const activeSource = computed(() =>
  NEWS_SOURCES.find((s) => s.key === activeKey.value),
)

const menuGroups = [
  {
    label: '国外新闻',
    items: NEWS_SOURCES.filter((s) => s.category === '国外新闻'),
  },
  {
    label: '国内新闻',
    items: NEWS_SOURCES.filter((s) => s.category === '国内新闻'),
  },
  {
    label: '娱乐影视',
    items: NEWS_SOURCES.filter((s) => s.category === '娱乐影视'),
  },
  {
    label: '体育',
    items: NEWS_SOURCES.filter((s) => s.category === '体育'),
  },
  {
    label: '招聘',
    items: NEWS_SOURCES.filter((s) => s.category === '招聘'),
  },
  {
    label: '政府数据',
    items: NEWS_SOURCES.filter((s) => s.category === '政府数据'),
  },
]

const switchTab = (key: string) => {
  if (activeKey.value === key) return
  activeKey.value = key
  router.replace({ query: { ...route.query, tab: key } })
}

watch(
  () => route.query.tab,
  (tab) => {
    if (tab && NEWS_SOURCES.some((s) => s.key === tab)) {
      activeKey.value = tab as string
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.collect-page {
  width: 100%;
  height: 100%;
}

.collect-layout {
  display: flex;
  gap: 16px;
  min-height: calc(100vh - 110px);
}

.collect-menu {
  width: 210px;
  flex-shrink: 0;
  background: var(--el-bg-color, #ffffff);
  border: 1px solid var(--el-border-color-lighter, #e5e7eb);
  border-radius: 8px;
  padding: 14px 8px;
  overflow: auto;
  max-height: calc(100vh - 130px);
}

.menu-header {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary, #9ca3af);
  padding: 0 10px 10px 10px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color-extra-light, #f3f4f6);
}

.menu-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 8px;
}

.menu-group__label {
  font-size: 11px;
  color: var(--el-text-color-placeholder, #c0c4cc);
  padding: 0 10px 4px 10px;
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

.menu-item-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

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