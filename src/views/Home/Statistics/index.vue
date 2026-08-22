<template>
  <div class="statistics-page" v-loading="loading">
    <!-- Top Bar -->
    <header class="statistics-header">
      <div class="statistics-header__left">
        <h1 class="statistics-header__title">{{ t('home.stat.title') }}</h1>
        <span class="statistics-header__hint">{{ t('home.stat.hint') }}</span>
      </div>
      <div class="statistics-header__actions">
        <el-radio-group v-model="selectedDays" size="small" @change="handleDaysChange">
          <el-radio-button v-for="option in dayOptions" :key="option" :value="option">
            {{ option }}{{ t('home.stat.days') }}
          </el-radio-button>
        </el-radio-group>
        <el-button link type="primary" @click="sortDialogVisible = true">{{ t('home.stat.sort') }}</el-button>
        <el-button link type="primary" @click="loadStatistics">{{ t('home.stat.refresh') }}</el-button>
      </div>
    </header>

    <!-- Summary Cards -->
    <div class="statistics-summary-grid">
      <div class="stat-card stat-card--primary">
        <div class="stat-card__icon"><Icon icon="ep:magic-stick" /></div>
        <div class="stat-card__body">
          <div class="stat-card__value"><CountTo :duration="1200" :end-val="summary.moduleCount" :start-val="0" /></div>
          <div class="stat-card__label">{{ t('home.stat.moduleCount') }}</div>
        </div>
      </div>
      <div class="stat-card stat-card--success">
        <div class="stat-card__icon"><Icon icon="ep:collection" /></div>
        <div class="stat-card__body">
          <div class="stat-card__value"><CountTo :duration="1200" :end-val="summary.totalRecords" :start-val="0" /></div>
          <div class="stat-card__label">{{ t('home.stat.totalRecords') }}</div>
        </div>
      </div>
      <div class="stat-card stat-card--info">
        <div class="stat-card__icon"><Icon icon="ep:plus" /></div>
        <div class="stat-card__body">
          <div class="stat-card__value"><CountTo :duration="1200" :end-val="summary.periodCreated" :start-val="0" /></div>
          <div class="stat-card__label">{{ t('home.stat.created') }} ({{ selectedDays }}{{ t('home.stat.days') }})</div>
        </div>
      </div>
      <div class="stat-card stat-card--warning">
        <div class="stat-card__icon"><Icon icon="ep:refresh" /></div>
        <div class="stat-card__body">
          <div class="stat-card__value"><CountTo :duration="1200" :end-val="summary.periodUpdated" :start-val="0" /></div>
          <div class="stat-card__label">{{ t('home.stat.updated') }} ({{ selectedDays }}{{ t('home.stat.days') }})</div>
        </div>
      </div>
    </div>

    <!-- Module Cards -->
    <div class="statistics-modules-grid">
      <article v-for="module in moduleCards" :key="module.key" class="module-card">
        <div class="module-card__header">
          <div class="module-card__info">
            <span class="module-card__name">{{ module.label }}</span>
            <span class="module-card__key">{{ module.key }}</span>
          </div>
          <div class="module-card__pills">
            <span class="module-card__pill">
              <span class="module-card__pill-label">{{ t('home.stat.total') }}</span>
              <strong class="module-card__pill-value">{{ formatNumber(module.total) }}</strong>
            </span>
            <span class="module-card__pill module-card__pill--created">
              <span class="module-card__pill-label">{{ t('home.stat.today') }}</span>
              <strong class="module-card__pill-value">+{{ formatNumber(module.today.created) }}</strong>
            </span>
            <span class="module-card__pill module-card__pill--updated">
              <span class="module-card__pill-label">{{ t('home.stat.updated') }}</span>
              <strong class="module-card__pill-value">~{{ formatNumber(module.today.updated) }}</strong>
            </span>
          </div>
        </div>

        <div class="module-card__chart">
          <Echart :options="module.chartOptions" height="180px" />
        </div>

        <div class="module-card__metrics">
          <span class="module-card__metric">
            <span class="module-card__metric-dot module-card__metric-dot--created"></span>
            {{ t('home.stat.created') }}: <strong>{{ formatNumber(module.period.created) }}</strong>
          </span>
          <span class="module-card__metric">
            <span class="module-card__metric-dot module-card__metric-dot--updated"></span>
            {{ t('home.stat.updated') }}: <strong>{{ formatNumber(module.period.updated) }}</strong>
          </span>
        </div>
      </article>
    </div>

    <!-- Sort Dialog -->
    <el-dialog v-model="sortDialogVisible" :title="t('home.stat.sortDialog.title')" width="420px">
      <div class="sort-list">
        <div v-for="(module, index) in orderedModules" :key="module.key" class="sort-item">
          <div class="sort-item__info">
            <span class="sort-item__name">{{ module.label }}</span>
            <span class="sort-item__key">{{ module.key }}</span>
          </div>
          <div class="sort-item__actions">
            <el-button link type="primary" :disabled="index === 0" @click="moveModuleToTop(module.key)">
              {{ t('home.stat.sortDialog.top') }}
            </el-button>
            <el-button link type="primary" :disabled="index === 0" @click="moveModule(module.key, -1)">
              {{ t('home.stat.sortDialog.up') }}
            </el-button>
            <el-button link type="primary" :disabled="index === orderedModules.length - 1" @click="moveModule(module.key, 1)">
              {{ t('home.stat.sortDialog.down') }}
            </el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="resetModuleOrder">{{ t('home.stat.sortDialog.reset') }}</el-button>
        <el-button type="primary" @click="sortDialogVisible = false">{{ t('home.stat.sortDialog.done') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EChartsOption } from 'echarts'
import { ElMessage } from 'element-plus'
import { Echart } from '@/components/Echart'
import { getModuleStatisticsApi, type ModuleStatisticsItem, type ModuleStatisticsResponse } from '@/api/statistics'
import { useAppStore } from '@/store/modules/app'

defineOptions({ name: 'Statistics' })

const { t } = useI18n()

const dayOptions = [7, 30, 90]
const selectedDays = ref(30)
const loading = ref(false)
const statistics = ref<ModuleStatisticsResponse | null>(null)
const appStore = useAppStore()
const sortDialogVisible = ref(false)
const moduleOrderStorageKey = 'module-statistics-order'
const moduleOrder = ref<string[]>([])

const summary = computed(() => statistics.value?.summary || {
  moduleCount: 0,
  totalRecords: 0,
  updatedRecords: 0,
  periodDays: 30,
  periodCreated: 0,
  periodUpdated: 0,
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
  const axisTextColor = getCssColor('--el-text-color-secondary', appStore.getIsDark ? '#94a3b8' : '#64748b')
  const splitLineColor = getCssColor('--el-border-color-extra-light', appStore.getIsDark ? '#334155' : '#f1f5f9')
  const createdColor = '#6366F1'
  const updatedColor = '#06B6D4'

  return {
    color: [createdColor, updatedColor],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--el-bg-color-overlay)',
      borderColor: 'var(--el-border-color-lighter)',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: 'var(--el-text-color-primary)', fontSize: 12 },
      extraCssText: 'box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12); border-radius: 8px;',
      axisPointer: { type: 'line', lineStyle: { color: 'rgba(99, 102, 241, 0.3)', type: 'dashed' } },
    },
    legend: { show: false },
    grid: { top: 20, left: 0, right: 6, bottom: 0, containLabel: true },
    xAxis: {
      type: 'category',
      data: series.map((point) => point.date.slice(5)),
      boundaryGap: false,
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
      splitNumber: 3,
      splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
      axisLabel: { color: axisTextColor, fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: t('home.stat.created'),
        type: 'line',
        smooth: 0.35,
        symbol: 'circle',
        symbolSize: 5,
        showSymbol: false,
        lineStyle: { width: 2, color: createdColor },
        itemStyle: { color: createdColor, borderColor: '#fff', borderWidth: 1.5 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(99, 102, 241, 0.22)' },
              { offset: 1, color: 'rgba(99, 102, 241, 0.01)' },
            ],
          },
        },
        data: series.map((point) => point.created),
      },
      {
        name: t('home.stat.updated'),
        type: 'line',
        smooth: 0.35,
        symbol: 'circle',
        symbolSize: 5,
        showSymbol: false,
        lineStyle: { width: 2, color: updatedColor },
        itemStyle: { color: updatedColor, borderColor: '#fff', borderWidth: 1.5 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(6, 182, 212, 0.18)' },
              { offset: 1, color: 'rgba(6, 182, 212, 0.01)' },
            ],
          },
        },
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
    console.error(t('home.stat.loadStatsFail'), error)
    ElMessage.error(error?.message || t('home.stat.loadStatsFail'))
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
  today: { created: Number(item?.today?.created || 0), updated: Number(item?.today?.updated || 0) },
  last7Days: { created: Number(item?.last7Days?.created || 0), updated: Number(item?.last7Days?.updated || 0) },
  last30Days: { created: Number(item?.last30Days?.created || 0), updated: Number(item?.last30Days?.updated || 0) },
  period: { days: Number(item?.period?.days || selectedDays.value), created: Number(item?.period?.created || 0), updated: Number(item?.period?.updated || 0) },
  series: Array.isArray(item?.series)
    ? item.series.map((point: any) => ({ date: String(point?.date || ''), created: Number(point?.created || 0), updated: Number(point?.updated || 0) }))
    : [],
})

const formatNumber = (value: number) => new Intl.NumberFormat('zh-CN').format(value || 0)

onMounted(() => {
  loadModuleOrder()
  loadStatistics()
})
</script>

<style scoped lang="scss">
.statistics-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 24px 24px;
}

// ── Header ──────────────────────────────────────────────
.statistics-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.statistics-header__left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.statistics-header__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.statistics-header__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.statistics-header__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;

  :deep(.el-radio-button__inner) {
    padding: 4px 10px;
  }
}

// ── Summary Cards Grid ──────────────────────────────────
.statistics-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 14px;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--el-bg-color) 96%, transparent 4%) 0%,
    color-mix(in srgb, var(--el-bg-color) 92%, transparent 8%) 100%
  );
  border: 1px solid color-mix(in srgb, var(--el-border-color) 35%, transparent 65%);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color) 80%);
    box-shadow: 0 8px 24px rgb(15 23 42 / 8%);
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    font-size: 19px;
    border-radius: 12px;
    flex-shrink: 0;
    color: #fff;
  }

  &__body { flex: 1; min-width: 0; }

  &__value {
    font-size: 26px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
  }

  &__label {
    margin-top: 4px;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
  }

  &--primary &__icon { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
  &--success &__icon { background: linear-gradient(135deg, #10b981, #06b6d4); }
  &--info &__icon { background: linear-gradient(135deg, #3b82f6, #06b6d4); }
  &--warning &__icon { background: linear-gradient(135deg, #f59e0b, #ef4444); }
}

// ── Module Cards Grid ───────────────────────────────────
.statistics-modules-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.module-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 20px;
  border-radius: 14px;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--el-bg-color) 96%, transparent 4%) 0%,
    color-mix(in srgb, var(--el-bg-color) 92%, transparent 8%) 100%
  );
  border: 1px solid color-mix(in srgb, var(--el-border-color) 35%, transparent 65%);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color) 80%);
    box-shadow: 0 8px 24px rgb(15 23 42 / 8%);
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__name {
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1.3;
  }

  &__key {
    font-size: 10px;
    color: var(--el-text-color-placeholder);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__pills {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  &__pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px 8px;
    font-size: 10px;
    border-radius: 20px;
    background: color-mix(in srgb, var(--el-text-color-secondary) 8%, transparent);
    white-space: nowrap;

    &-label {
      color: var(--el-text-color-placeholder);
      font-weight: 500;
    }

    &-value {
      color: var(--el-text-color-primary);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    &--created {
      background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
      .module-card__pill-value { color: var(--el-color-primary); }
    }

    &--updated {
      background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
      .module-card__pill-value { color: var(--el-color-warning); }
    }
  }

  &__chart {
    margin-top: 2px;
  }

  &__metrics {
    display: flex;
    gap: 14px;
    font-size: 11px;
    color: var(--el-text-color-secondary);
    border-top: 1px solid color-mix(in srgb, var(--el-border-color) 50%, transparent 50%);
    padding-top: 10px;

    strong {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--el-text-color-primary);
    }
  }

  &__metric {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  &__metric-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;

    &--created { background: var(--el-color-primary); }
    &--updated { background: var(--el-color-warning); }
  }
}

// ── Sort Dialog ─────────────────────────────────────────
.sort-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 58vh;
  overflow: auto;
}

.sort-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--el-border-color) 50%, transparent 50%);

  &:last-child { border-bottom: none; }

  &__info { display: flex; flex-direction: column; min-width: 0; }

  &__name { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }

  &__key {
    overflow: hidden;
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__actions {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    gap: 2px;
  }
}

// ── Dark Mode: shadow instead of border ─────────────────
html.dark {
  .stat-card {
    border: 1px solid transparent;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.06);

    &:hover {
      border-color: transparent;
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.5),
        0 0 0 1px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
    }
  }

  .module-card {
    border: 1px solid transparent;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.06);

    &:hover {
      border-color: transparent;
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.5),
        0 0 0 1px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
    }
  }
}

// ── Responsive ──────────────────────────────────────────
@media (width <= 1400px) {
  .statistics-summary-grid { grid-template-columns: repeat(2, 1fr); }
  .statistics-modules-grid { grid-template-columns: 1fr; }
}

@media (width <= 767px) {
  .statistics-page { padding: 16px; }
  .statistics-summary-grid { grid-template-columns: 1fr; }
  .statistics-modules-grid { grid-template-columns: 1fr; }

  .stat-card { padding: 14px 16px; }
  .stat-card__value { font-size: 22px; }
  .module-card { padding: 14px 16px; }
}
</style>
