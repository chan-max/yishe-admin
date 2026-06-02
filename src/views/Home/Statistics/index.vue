<template>
  <ContentWrap :plain="true" :body-style="{ padding: '10px 12px' }">
    <div class="module-statistics" v-loading="loading">
      <header class="module-statistics__top">
        <div class="module-statistics__top-left">
          <h1 class="module-statistics__title">模块数据统计</h1>
          <span class="module-statistics__hint">createTime / updateTime</span>
          <template v-if="summaryItems.length">
            <span class="module-statistics__top-dot" />
            <div class="module-statistics__summary">
              <span
                v-for="(item, index) in summaryItems"
                :key="item.label"
                class="module-statistics__summary-item"
              >
                <span v-if="index > 0" class="module-statistics__summary-sep">·</span>
                <span class="module-statistics__summary-label">{{ item.label }}</span>
                <strong class="module-statistics__summary-value" :class="item.tone">{{
                  formatNumber(item.value)
                }}</strong>
              </span>
            </div>
          </template>
        </div>
        <div class="module-statistics__top-actions">
          <el-radio-group v-model="selectedDays" size="small" @change="handleDaysChange">
            <el-radio-button v-for="option in dayOptions" :key="option" :value="option">
              {{ option }}天
            </el-radio-button>
          </el-radio-group>
          <el-button link type="primary" @click="sortDialogVisible = true">排序</el-button>
          <el-button link type="primary" @click="loadStatistics">刷新</el-button>
        </div>
      </header>

      <section class="module-statistics__modules">
        <article v-for="module in moduleCards" :key="module.key" class="module-statistics__module">
          <div class="module-statistics__module-head">
            <span class="module-statistics__module-name">{{ module.label }}</span>
            <span class="module-statistics__module-key">{{ module.key }}</span>
            <span class="module-statistics__module-meta">
              总 <em>{{ formatNumber(module.total) }}</em>
              <span class="module-statistics__module-meta-sep">/</span>
              改 <em>{{ formatNumber(module.updatedTotal) }}</em>
              <span class="module-statistics__module-meta-sep">/</span>
              活跃 <em>{{ formatNumber(module.period.created + module.period.updated) }}</em>
            </span>
          </div>

          <div class="module-statistics__module-body">
            <div class="module-statistics__chart">
              <div class="module-statistics__chart-head">
                <span>{{ selectedDays }}天趋势</span>
                <span class="module-statistics__legend">
                  <i class="is-created" />增<i class="is-updated" />改
                </span>
              </div>
              <Echart :options="module.chartOptions" height="150px" />
            </div>

            <table class="module-statistics__metrics">
              <thead>
                <tr>
                  <th />
                  <th>今日</th>
                  <th v-if="selectedDays >= 7">7天</th>
                  <th v-if="selectedDays >= 30">30天</th>
                  <th>{{ selectedDays }}天</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>增</th>
                  <td class="is-created">{{ formatNumber(module.today.created) }}</td>
                  <td v-if="selectedDays >= 7" class="is-created">{{ formatNumber(module.last7Days.created) }}</td>
                  <td v-if="selectedDays >= 30" class="is-created">{{ formatNumber(module.last30Days.created) }}</td>
                  <td class="is-created">{{ formatNumber(module.period.created) }}</td>
                </tr>
                <tr>
                  <th>改</th>
                  <td class="is-updated">{{ formatNumber(module.today.updated) }}</td>
                  <td v-if="selectedDays >= 7" class="is-updated">{{ formatNumber(module.last7Days.updated) }}</td>
                  <td v-if="selectedDays >= 30" class="is-updated">{{ formatNumber(module.last30Days.updated) }}</td>
                  <td class="is-updated">{{ formatNumber(module.period.updated) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <el-dialog v-model="sortDialogVisible" title="模块排序" width="420px">
        <div class="module-statistics__sort-list">
          <div v-for="(module, index) in orderedModules" :key="module.key" class="module-statistics__sort-item">
            <div class="module-statistics__sort-info">
              <span class="module-statistics__sort-name">{{ module.label }}</span>
              <span class="module-statistics__sort-key">{{ module.key }}</span>
            </div>
            <div class="module-statistics__sort-actions">
              <el-button link type="primary" :disabled="index === 0" @click="moveModuleToTop(module.key)">
                置顶
              </el-button>
              <el-button link type="primary" :disabled="index === 0" @click="moveModule(module.key, -1)">
                上移
              </el-button>
              <el-button
                link
                type="primary"
                :disabled="index === orderedModules.length - 1"
                @click="moveModule(module.key, 1)"
              >
                下移
              </el-button>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="resetModuleOrder">恢复默认</el-button>
          <el-button type="primary" @click="sortDialogVisible = false">完成</el-button>
        </template>
      </el-dialog>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { EChartsOption } from 'echarts'
import { ElMessage } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Echart } from '@/components/Echart'
import { getModuleStatisticsApi, type ModuleStatisticsItem, type ModuleStatisticsResponse } from '@/api/statistics'
import { useAppStore } from '@/store/modules/app'

defineOptions({ name: 'Statistics' })

const dayOptions = [7, 30, 90]
const selectedDays = ref(30)
const loading = ref(false)
const statistics = ref<ModuleStatisticsResponse | null>(null)
const appStore = useAppStore()
const sortDialogVisible = ref(false)
const moduleOrderStorageKey = 'module-statistics-order'
const moduleOrder = ref<string[]>([])

const summaryItems = computed(() => {
  const summary = statistics.value?.summary
  if (!summary) return []

  return [
    { label: '模块', value: summary.moduleCount, tone: '' },
    { label: '总记录', value: summary.totalRecords, tone: '' },
    { label: '新增', value: summary.periodCreated, tone: 'is-created' },
    { label: '修改', value: summary.periodUpdated, tone: 'is-updated' },
  ]
})

const orderedModules = computed(() => {
  const modules = statistics.value?.modules || []
  const orderIndex = new Map(moduleOrder.value.map((key, index) => [key, index]))

  return [...modules].sort((left, right) => {
    const leftIndex = orderIndex.get(left.key)
    const rightIndex = orderIndex.get(right.key)

    if (leftIndex !== undefined && rightIndex !== undefined) return leftIndex - rightIndex
    if (leftIndex !== undefined) return -1
    if (rightIndex !== undefined) return 1
    return 0
  })
})

const moduleCards = computed(() =>
  orderedModules.value.map((item) => ({
    ...item,
    chartOptions: buildTrendOptions(item.series),
  })),
)

const getCssColor = (name: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

const buildTrendOptions = (series: ModuleStatisticsItem['series']): EChartsOption => {
  const axisTextColor = getCssColor('--el-text-color-secondary', appStore.getIsDark ? '#c0c4cc' : '#606266')
  const splitLineColor = getCssColor('--el-border-color-extra-light', appStore.getIsDark ? '#414243' : '#f0f2f5')
  const createdColor = getCssColor('--el-color-primary', '#409eff')
  const updatedColor = getCssColor('--el-color-warning', '#e6a23c')

  return {
    color: [createdColor, updatedColor],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
        shadowStyle: { color: 'rgba(148, 163, 184, 0.12)' },
      },
    },
    legend: { show: false },
    grid: { top: 18, left: 0, right: 6, bottom: 2, containLabel: true },
    xAxis: {
      type: 'category',
      data: series.map((point) => point.date.slice(5)),
      axisLine: { show: false },
      axisLabel: {
        color: axisTextColor,
        fontSize: 10,
        hideOverlap: true,
        interval: series.length > 45 ? 8 : series.length > 30 ? 5 : series.length > 14 ? 2 : 0,
        rotate: series.length > 30 ? 35 : 0,
        margin: 10,
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitNumber: 4,
      splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
      axisLabel: { color: axisTextColor, fontSize: 10 },
      axisLine: { show: false },
    },
    series: [
      {
        name: '新增',
        type: 'bar',
        barMaxWidth: 8,
        barGap: '30%',
        barCategoryGap: '42%',
        itemStyle: { color: createdColor, opacity: 0.86 },
        emphasis: { itemStyle: { opacity: 1 } },
        data: series.map((point) => point.created),
      },
      {
        name: '修改',
        type: 'bar',
        barMaxWidth: 8,
        itemStyle: { color: updatedColor, opacity: 0.86 },
        emphasis: { itemStyle: { opacity: 1 } },
        data: series.map((point) => point.updated),
      },
    ],
  }
}

const loadStatistics = async () => {
  loading.value = true
  try {
    const response = await getModuleStatisticsApi(selectedDays.value)
    statistics.value = normalizeResponse(response)
    syncModuleOrder()
  } catch (error: any) {
    console.error('加载统计数据失败:', error)
    ElMessage.error(error?.message || '加载统计数据失败')
  } finally {
    loading.value = false
  }
}

const loadModuleOrder = () => {
  if (typeof window === 'undefined') return

  try {
    const value = window.localStorage.getItem(moduleOrderStorageKey)
    const parsed = value ? JSON.parse(value) : []
    moduleOrder.value = Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    moduleOrder.value = []
  }
}

const handleDaysChange = async (days: number) => {
  if (!days) return
  selectedDays.value = days
  await loadStatistics()
}

const saveModuleOrder = () => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(moduleOrderStorageKey, JSON.stringify(moduleOrder.value))
}

const syncModuleOrder = () => {
  const keys = (statistics.value?.modules || []).map((module) => module.key)
  const knownKeys = new Set(keys)
  const orderedKnownKeys = moduleOrder.value.filter((key) => knownKeys.has(key))
  const newKeys = keys.filter((key) => !orderedKnownKeys.includes(key))
  moduleOrder.value = [...orderedKnownKeys, ...newKeys]
  saveModuleOrder()
}

const moveModule = (key: string, direction: -1 | 1) => {
  syncModuleOrder()
  const index = moduleOrder.value.indexOf(key)
  const nextIndex = index + direction
  if (index < 0 || nextIndex < 0 || nextIndex >= moduleOrder.value.length) return

  const nextOrder = [...moduleOrder.value]
  const [item] = nextOrder.splice(index, 1)
  nextOrder.splice(nextIndex, 0, item)
  moduleOrder.value = nextOrder
  saveModuleOrder()
}

const moveModuleToTop = (key: string) => {
  syncModuleOrder()
  moduleOrder.value = [key, ...moduleOrder.value.filter((item) => item !== key)]
  saveModuleOrder()
}

const resetModuleOrder = () => {
  moduleOrder.value = (statistics.value?.modules || []).map((module) => module.key)
  saveModuleOrder()
}

const normalizeResponse = (response: any): ModuleStatisticsResponse => {
  const payload = response?.data || response
  return {
    generatedAt: payload?.generatedAt || '',
    summary: {
      moduleCount: Number(payload?.summary?.moduleCount || 0),
      totalRecords: Number(payload?.summary?.totalRecords || 0),
      updatedRecords: Number(payload?.summary?.updatedRecords || 0),
      periodDays: Number(payload?.summary?.periodDays || selectedDays.value),
      periodCreated: Number(payload?.summary?.periodCreated || 0),
      periodUpdated: Number(payload?.summary?.periodUpdated || 0),
    },
    modules: Array.isArray(payload?.modules) ? payload.modules.map(normalizeModule) : [],
  }
}

const normalizeModule = (item: any): ModuleStatisticsItem => ({
  key: String(item?.key || ''),
  label: String(item?.label || ''),
  description: String(item?.description || ''),
  total: Number(item?.total || 0),
  updatedTotal: Number(item?.updatedTotal || 0),
  today: {
    created: Number(item?.today?.created || 0),
    updated: Number(item?.today?.updated || 0),
  },
  last7Days: {
    created: Number(item?.last7Days?.created || 0),
    updated: Number(item?.last7Days?.updated || 0),
  },
  last30Days: {
    created: Number(item?.last30Days?.created || 0),
    updated: Number(item?.last30Days?.updated || 0),
  },
  period: {
    days: Number(item?.period?.days || selectedDays.value),
    created: Number(item?.period?.created || 0),
    updated: Number(item?.period?.updated || 0),
  },
  series: Array.isArray(item?.series)
    ? item.series.map((point: any) => ({
        date: String(point?.date || ''),
        created: Number(point?.created || 0),
        updated: Number(point?.updated || 0),
      }))
    : [],
})

const formatNumber = (value: number) => new Intl.NumberFormat('zh-CN').format(value || 0)

onMounted(() => {
  loadModuleOrder()
  loadStatistics()
})
</script>

<style scoped lang="scss">
.module-statistics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.module-statistics__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.module-statistics__top-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
  min-width: 0;
}

.module-statistics__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.module-statistics__hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.module-statistics__top-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
}

.module-statistics__summary {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px;
  font-size: 12px;
}

.module-statistics__summary-item {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}

.module-statistics__summary-sep {
  margin: 0 2px;
  color: var(--el-text-color-placeholder);
}

.module-statistics__summary-label {
  color: var(--el-text-color-secondary);
}

.module-statistics__summary-value {
  font-size: 13px;
  font-weight: 600;
  font-style: normal;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;

  &.is-created {
    color: var(--el-color-primary);
  }

  &.is-updated {
    color: var(--el-color-warning);
  }
}

.module-statistics__top-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;

  :deep(.el-radio-button__inner) {
    padding: 4px 10px;
  }
}

.module-statistics__modules {
  display: grid;
  row-gap: 36px;
  grid-template-columns: 1fr;

  @media (width >= 1400px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 38px 34px;
  }
}

.module-statistics__module {
  padding: 14px 0 22px;
  border-bottom: 1px solid var(--el-border-color-extra-light);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.module-statistics__module-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
  margin-bottom: 8px;
  font-size: 12px;
  line-height: 1.3;
}

.module-statistics__module-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.module-statistics__module-key {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.module-statistics__module-meta {
  margin-left: auto;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;

  em {
    font-style: normal;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--el-text-color-primary);
  }
}

.module-statistics__module-meta-sep {
  margin: 0 3px;
  color: var(--el-text-color-placeholder);
}

.module-statistics__module-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: end;

  @media (width < 760px) {
    grid-template-columns: 1fr;
  }
}

.module-statistics__chart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.module-statistics__legend {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  i {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-right: 2px;
    vertical-align: 1px;

    &.is-created {
      background: var(--el-color-primary);
    }

    &.is-updated {
      background: var(--el-color-warning);
    }
  }
}

.module-statistics__metrics {
  border-collapse: collapse;
  font-size: 11px;

  th,
  td {
    padding: 2px 8px;
    text-align: right;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  thead th {
    font-weight: 400;
    color: var(--el-text-color-placeholder);
  }

  tbody th {
    padding-left: 0;
    text-align: left;
    font-weight: 500;
    color: var(--el-text-color-secondary);
  }

  tbody td {
    font-weight: 600;
    color: var(--el-text-color-primary);

    &.is-created {
      color: var(--el-color-primary);
    }

    &.is-updated {
      color: var(--el-color-warning);
    }
  }
}

.module-statistics__sort-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 58vh;
  overflow: auto;
}

.module-statistics__sort-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);

  &:last-child {
    border-bottom: none;
  }
}

.module-statistics__sort-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.module-statistics__sort-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.module-statistics__sort-key {
  overflow: hidden;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-statistics__sort-actions {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 2px;
}
</style>
