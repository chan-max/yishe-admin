<template>
  <div class="hot-search-page">
    <ContentWrap plain>
      <div class="hot-search-page__header">
        <div class="hot-search-page__title-wrap">
          <div class="hot-search-page__title">热搜</div>
          <div v-if="lastUpdateTime" class="hot-search-page__meta">
            最近更新 {{ formatUpdateTime(lastUpdateTime) }}
          </div>
        </div>
        <el-button :loading="loading" size="small" @click="refreshData">
          刷新
        </el-button>
      </div>
    </ContentWrap>

    <div v-loading="loading" class="hot-search-page__content">
      <template v-if="platformSections.length">
        <section
          v-for="platform in platformSections"
          :key="platform.key"
          class="platform-block"
        >
          <header class="platform-block__header">
            <div class="platform-block__title-wrap">
              <div class="platform-block__title">{{ platform.label }}</div>
              <div class="platform-block__sub">
                {{ platform.items.length }} 条
                <span v-if="platform.timestamp">
                  · {{ formatUpdateTime(platform.timestamp) }}
                </span>
              </div>
            </div>
          </header>

          <div class="platform-block__list">
            <a
              v-for="(item, index) in platform.items"
              :key="`${platform.key}-${index}-${item.title}`"
              class="hot-item"
              :class="{ 'is-top': index < 3 }"
              :href="item.url || undefined"
              :target="item.url ? '_blank' : undefined"
              :rel="item.url ? 'noreferrer noopener' : undefined"
            >
              <div class="hot-item__rank">{{ item.rank }}</div>
              <div class="hot-item__content">
                <div class="hot-item__title-row">
                  <div class="hot-item__title">{{ item.title }}</div>
                  <span v-if="item.tag" class="hot-item__tag">{{ item.tag }}</span>
                </div>
                <div v-if="item.hotText || item.subText" class="hot-item__meta">
                  <span v-if="item.hotText" class="hot-item__hot">{{ item.hotText }}</span>
                  <span v-if="item.subText" class="hot-item__sub">{{ item.subText }}</span>
                </div>
              </div>
            </a>
          </div>
        </section>
      </template>

      <el-empty
        v-else
        :image-size="88"
        description="暂无热搜数据"
        class="hot-search-page__empty"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import ContentWrap from '@/components/ContentWrap/src/ContentWrap.vue'
import { getAllHotsearch, refreshHotsearch } from '@/api/hotsearch'
import type { HotsearchData, HotsearchItem, HotsearchResponse } from '@/api/hotsearch'

defineOptions({ name: 'HotSearch' })

interface PlatformConfig {
  key: string
  label: string
  limit?: number
}

interface NormalizedHotItem {
  title: string
  rank: number
  hotText: string
  subText: string
  tag: string
  url: string
}

interface PlatformSection {
  key: string
  label: string
  timestamp: string
  items: NormalizedHotItem[]
}

const platformConfigs: PlatformConfig[] = [
  { key: 'weibo', label: '微博', limit: 10 },
  { key: 'douyin', label: '抖音', limit: 16 },
  { key: 'ks', label: '快手', limit: 16 },
  { key: 'toutiao', label: '今日头条', limit: 16 },
  { key: 'bilibili', label: '哔哩哔哩', limit: 16 },
  { key: 'zhihu', label: '知乎', limit: 16 },
  { key: 'douban', label: '豆瓣', limit: 16 },
  { key: 'music', label: '酷狗音乐', limit: 16 }
]

const loading = ref(false)
const hotsearchData = ref<Record<string, HotsearchData>>({})
const lastUpdateTime = ref('')

const platformSections = computed<PlatformSection[]>(() => {
  return platformConfigs
    .map((platform) => {
      const data = hotsearchData.value[platform.key]
      const items = Array.isArray(data?.data) ? data.data : []
      const normalizedItems = items
        .map((item, index) => normalizeItem(item, index))
        .filter((item) => item.title)
        .slice(0, platform.limit ?? items.length)

      return {
        key: platform.key,
        label: data?.name || platform.label,
        timestamp: data?.timestamp || '',
        items: normalizedItems
      }
    })
    .filter((platform) => platform.items.length > 0)
})

const normalizeResponseData = (payload: HotsearchResponse | Record<string, any> | undefined) => {
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  const source = 'data' in payload && payload.data && typeof payload.data === 'object'
    ? payload.data
    : payload

  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return {}
  }

  return Object.entries(source).reduce<Record<string, HotsearchData>>((result, [key, value]) => {
    if (!value || typeof value !== 'object') {
      return result
    }

    const current = value as Record<string, any>
    const items = Array.isArray(current.data)
      ? current.data
      : Array.isArray(current.list)
        ? current.list
        : []

    result[key] = {
      key: String(current.key || key),
      data: items,
      timestamp: String(current.timestamp || current.updatedAt || ''),
      expireAt: String(current.expireAt || ''),
      category: current.category,
      platform: String(current.platform || key),
      name: String(current.name || current.label || key),
      platformIndex: String(current.platformIndex || '')
    }
    return result
  }, {})
}

const normalizeItem = (item: HotsearchItem, index: number): NormalizedHotItem => {
  const title = String(
    item.title ||
      item.word ||
      item.name ||
      item.songName ||
      item.keyword ||
      item.desc ||
      ''
  ).trim()

  const hotText = formatHot(item)
  const subText = String(item.subtitle || item.note || item.artist || item.icon_desc || '').trim()
  const tag = String(item.label || item.tag || item.type || item.flag || '').trim()
  const url = String(item.url || item.scheme || item.word_scheme || '').trim()
  const rank = Number(item.rank || index + 1)

  return {
    title,
    rank: Number.isFinite(rank) && rank > 0 ? rank : index + 1,
    hotText,
    subText,
    tag,
    url
  }
}

const formatHot = (item: HotsearchItem) => {
  if (item.subtitle) {
    return ''
  }

  const value = item.hot ?? item.hotValue ?? item.num ?? item.video_count ?? ''
  if (value === null || value === undefined || value === '') {
    return ''
  }

  if (typeof value === 'number') {
    return `热度 ${value.toLocaleString()}`
  }

  const text = String(value).trim()
  if (!text) {
    return ''
  }

  if (/^\d+$/.test(text)) {
    return `热度 ${Number(text).toLocaleString()}`
  }

  return text
}

const refreshLastUpdateTime = (data: Record<string, HotsearchData>) => {
  const timestamps = Object.values(data)
    .map((item) => item.timestamp)
    .filter(Boolean)
    .sort()

  lastUpdateTime.value = timestamps.at(-1) || ''
}

const fetchData = async (options?: { silent?: boolean; keepLoading?: boolean }) => {
  if (!options?.keepLoading) {
    loading.value = true
  }

  try {
    const response = await getAllHotsearch()
    const normalized = normalizeResponseData(response)
    hotsearchData.value = normalized
    refreshLastUpdateTime(normalized)

    if (!options?.silent) {
      ElMessage.success('热搜数据已更新')
    }
  } catch (error) {
    console.error('获取热搜数据失败:', error)
    if (!options?.silent) {
      ElMessage.error('获取热搜数据失败')
    }
  } finally {
    if (!options?.keepLoading) {
      loading.value = false
    }
  }
}

const refreshData = async () => {
  loading.value = true
  try {
    await refreshHotsearch()
    await fetchData({ silent: true, keepLoading: true })
    ElMessage.success('热搜数据已刷新')
  } catch (error) {
    console.error('刷新热搜数据失败:', error)
    ElMessage.error('刷新热搜数据失败')
  } finally {
    loading.value = false
  }
}

const formatUpdateTime = (timestamp: string) => {
  if (!timestamp) {
    return ''
  }

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return timestamp
  }

  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) {
    return '刚刚'
  }
  if (minutes < 60) {
    return `${minutes} 分钟前`
  }
  if (hours < 24) {
    return `${hours} 小时前`
  }
  if (days < 7) {
    return `${days} 天前`
  }

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.hot-search-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100%;
}

.hot-search-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 0 2px;
}

.hot-search-page__title-wrap {
  min-width: 0;
}

.hot-search-page__title {
  color: var(--el-text-color-primary);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.hot-search-page__meta {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.hot-search-page__content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 14px;
  align-items: start;
}

.platform-block {
  overflow: hidden;
  border: 1px solid var(--app-content-border-color);
  border-radius: 18px;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--app-content-surface-muted-color) 72%, transparent 28%) 0%,
      var(--app-content-surface-color) 100%
    );
  box-shadow: var(--app-content-shadow);
}

.platform-block__header {
  padding: 16px 18px 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--app-content-border-color) 78%, transparent 22%);
}

.platform-block__title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 700;
}

.platform-block__sub {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.platform-block__list {
  display: flex;
  flex-direction: column;
  padding: 6px 10px 10px;
}

.hot-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 11px 10px;
  border-radius: 12px;
  color: inherit;
  text-decoration: none;
  transition:
    background-color var(--el-transition-duration-fast),
    transform var(--el-transition-duration-fast);

  &:hover {
    background: color-mix(in srgb, var(--el-fill-color-light) 82%, transparent 18%);
  }
}

.hot-item__rank {
  display: flex;
  width: 24px;
  min-width: 24px;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.8;
}

.hot-item.is-top .hot-item__rank {
  color: var(--el-color-primary);
}

.hot-item__content {
  min-width: 0;
  flex: 1;
}

.hot-item__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.hot-item__title {
  min-width: 0;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.55;
  word-break: break-word;
}

.hot-item__tag {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-primary-light-9) 88%, transparent 12%);
  color: var(--el-color-primary);
  font-size: 11px;
  line-height: 1.6;
}

.hot-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.hot-item__hot {
  color: var(--el-color-danger);
}

.hot-search-page__empty {
  grid-column: 1 / -1;
  padding: 48px 0 18px;
  border: 1px dashed var(--app-content-border-color);
  border-radius: 18px;
  background: color-mix(in srgb, var(--app-content-surface-muted-color) 65%, transparent 35%);
}

@media (max-width: 768px) {
  .hot-search-page__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .hot-search-page__content {
    grid-template-columns: 1fr;
  }

  .platform-block {
    border-radius: 16px;
  }

  .platform-block__header {
    padding: 14px 14px 10px;
  }

  .platform-block__list {
    padding: 4px 8px 8px;
  }
}
</style>
