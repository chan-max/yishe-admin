<template>
  <ContentWrap>
    <div class="space-y-6" v-loading="loading">
      <section class="flex flex-col gap-4 rounded-3xl border border-[var(--el-border-color-light)] bg-[var(--el-bg-color)] p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--el-text-color-secondary)]">Statistics</p>
          <div class="space-y-1">
            <h1 class="text-3xl font-semibold text-[var(--el-text-color-primary)]">模块数据统计</h1>
            <p class="text-sm text-[var(--el-text-color-regular)]">统一查看各模块近阶段新增与修改情况，统计口径基于 createTime / updateTime。</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="rounded-2xl border border-[var(--el-border-color-light)] bg-[var(--el-fill-color-light)] p-1">
            <button
              v-for="option in dayOptions"
              :key="option"
              class="rounded-xl px-4 py-2 text-sm font-medium transition"
              :class="
                selectedDays === option
                  ? 'bg-[var(--el-color-primary)] text-white shadow-sm'
                  : 'text-[var(--el-text-color-regular)] hover:text-[var(--el-text-color-primary)]'
              "
              @click="changeDays(option)"
            >
              {{ option }} 天
            </button>
          </div>
          <el-button @click="loadStatistics">刷新</el-button>
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="card in summaryCards"
          :key="card.label"
          class="rounded-3xl border border-[var(--el-border-color-light)] bg-[var(--el-bg-color)] p-5 shadow-sm"
        >
          <p class="text-sm text-[var(--el-text-color-regular)]">{{ card.label }}</p>
          <div class="mt-3 flex items-end justify-between gap-3">
            <strong class="text-3xl font-semibold text-[var(--el-text-color-primary)]">{{ formatNumber(card.value) }}</strong>
            <span class="rounded-full px-3 py-1 text-xs font-medium" :class="card.badgeClass">
              {{ card.badge }}
            </span>
          </div>
        </article>
      </section>

      <section class="grid gap-5 xl:grid-cols-2">
        <article
          v-for="module in moduleCards"
          :key="module.key"
          class="overflow-hidden rounded-3xl border border-[var(--el-border-color-light)] bg-[var(--el-bg-color)] shadow-sm"
        >
          <div class="border-b border-[var(--el-border-color-lighter)] p-6">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="space-y-2">
                <div class="flex items-center gap-3">
                  <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold" :class="module.palette.badgeClass">
                    {{ module.label }}
                  </span>
                  <span class="text-xs uppercase tracking-[0.2em] text-[var(--el-text-color-secondary)]">{{ module.key }}</span>
                </div>
                <div>
                  <h2 class="text-xl font-semibold text-[var(--el-text-color-primary)]">{{ module.label }}</h2>
                  <p class="mt-1 text-sm text-[var(--el-text-color-regular)]">{{ module.description }}</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 text-right sm:grid-cols-3">
                <div class="rounded-2xl bg-[var(--el-fill-color-light)] px-4 py-3">
                  <p class="text-xs text-[var(--el-text-color-regular)]">总记录</p>
                  <p class="mt-1 text-2xl font-semibold text-[var(--el-text-color-primary)]">{{ formatNumber(module.total) }}</p>
                </div>
                <div class="rounded-2xl bg-[var(--el-fill-color-light)] px-4 py-3">
                  <p class="text-xs text-[var(--el-text-color-regular)]">累计修改</p>
                  <p class="mt-1 text-2xl font-semibold text-[var(--el-text-color-primary)]">{{ formatNumber(module.updatedTotal) }}</p>
                </div>
                <div class="col-span-2 rounded-2xl bg-[var(--el-fill-color-light)] px-4 py-3 sm:col-span-1">
                  <p class="text-xs text-[var(--el-text-color-regular)]">近 {{ selectedDays }} 天活跃</p>
                  <p class="mt-1 text-2xl font-semibold text-[var(--el-text-color-primary)]">
                    {{ formatNumber(module.period.created + module.period.updated) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-semibold text-[var(--el-text-color-primary)]">近 {{ selectedDays }} 天趋势</h3>
                  <p class="text-xs text-[var(--el-text-color-regular)]">使用系统默认主色和警告色显示新增与修改</p>
                </div>
                <div class="flex items-center gap-3 text-xs text-[var(--el-text-color-regular)]">
                  <span class="inline-flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full" :class="module.palette.createdClass"></span>
                    新增
                  </span>
                  <span class="inline-flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full" :class="module.palette.updatedClass"></span>
                    修改
                  </span>
                </div>
              </div>

              <div class="rounded-2xl border border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-lighter)] p-4">
                <Echart :options="module.chartOptions" height="240px" />
              </div>
            </div>

            <div class="space-y-3">
              <div
                v-for="item in module.metrics"
                :key="item.label"
                class="rounded-2xl border border-[var(--el-border-color-light)] p-4"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-[var(--el-text-color-primary)]">{{ item.label }}</p>
                    <p class="mt-1 text-xs text-[var(--el-text-color-regular)]">{{ item.description }}</p>
                  </div>
                  <span class="text-xs text-[var(--el-text-color-secondary)]">{{ item.window }}</span>
                </div>
                <div class="mt-4 grid grid-cols-2 gap-3">
                  <div class="rounded-2xl px-4 py-3" :class="module.palette.softCreatedClass">
                    <p class="text-xs text-[var(--el-text-color-regular)]">新增</p>
                    <p class="mt-1 text-2xl font-semibold text-[var(--el-text-color-primary)]">{{ formatNumber(item.created) }}</p>
                  </div>
                  <div class="rounded-2xl px-4 py-3" :class="module.palette.softUpdatedClass">
                    <p class="text-xs text-[var(--el-text-color-regular)]">修改</p>
                    <p class="mt-1 text-2xl font-semibold text-[var(--el-text-color-primary)]">{{ formatNumber(item.updated) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>
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

type Palette = {
  badgeClass: string
  createdClass: string
  updatedClass: string
  softCreatedClass: string
  softUpdatedClass: string
}

const dayOptions = [7, 30, 90]
const selectedDays = ref(30)
const loading = ref(false)
const statistics = ref<ModuleStatisticsResponse | null>(null)
const chartColors = ['#2563eb', '#dc2626']
const appStore = useAppStore()

const palette: Palette = {
  badgeClass: 'bg-[var(--el-fill-color-light)] text-[var(--el-text-color-primary)]',
  createdClass: 'bg-[var(--el-color-primary)]',
  updatedClass: 'bg-[var(--el-color-warning)]',
  softCreatedClass: 'bg-[var(--el-color-primary-light-9)]',
  softUpdatedClass: 'bg-[var(--el-color-warning-light-9)]'
}

const summaryCards = computed(() => {
  const summary = statistics.value?.summary
  if (!summary) return []

  return [
    {
      label: '统计模块数',
      value: summary.moduleCount,
      badge: 'Modules',
      badgeClass: 'bg-[var(--el-fill-color-light)] text-[var(--el-text-color-regular)]'
    },
    {
      label: '总记录数',
      value: summary.totalRecords,
      badge: 'Total',
      badgeClass: 'bg-[var(--el-fill-color-light)] text-[var(--el-text-color-primary)]'
    },
    {
      label: `近 ${selectedDays.value} 天新增`,
      value: summary.periodCreated,
      badge: 'Created',
      badgeClass: 'bg-[var(--el-color-primary-light-9)] text-[var(--el-color-primary)]'
    },
    {
      label: `近 ${selectedDays.value} 天修改`,
      value: summary.periodUpdated,
      badge: 'Updated',
      badgeClass: 'bg-[var(--el-color-warning-light-9)] text-[var(--el-color-warning)]'
    }
  ]
})

const moduleCards = computed(() =>
  (statistics.value?.modules || []).map((item) => {
    return {
      ...item,
      palette,
      chartOptions: buildTrendOptions(item.series),
      metrics: [
        {
          label: '今日',
          window: 'Today',
          description: '今天新增与修改的记录数',
          created: item.today.created,
          updated: item.today.updated
        },
        {
          label: '最近 7 天',
          window: '7 Days',
          description: '近 7 天累计活跃情况',
          created: item.last7Days.created,
          updated: item.last7Days.updated
        },
        {
          label: `最近 ${item.period.days} 天`,
          window: `${item.period.days} Days`,
          description: '当前筛选周期内的累计数据',
          created: item.period.created,
          updated: item.period.updated
        }
      ]
    }
  })
)

const getCssColor = (name: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

const buildTrendOptions = (series: ModuleStatisticsItem['series']): EChartsOption => {
  const axisTextColor = getCssColor('--el-text-color-secondary', appStore.getIsDark ? '#c0c4cc' : '#606266')
  const legendTextColor = getCssColor('--el-text-color-regular', appStore.getIsDark ? '#e5eaf3' : '#303133')
  const axisLineColor = getCssColor('--el-border-color', appStore.getIsDark ? '#4c4d4f' : '#d4d7de')
  const splitLineColor = getCssColor('--el-border-color-lighter', appStore.getIsDark ? '#414243' : '#ebeef5')

  return {
    color: chartColors,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: {
        color: legendTextColor,
        fontSize: 12
      }
    },
    grid: {
      top: 36,
      left: 12,
      right: 12,
      bottom: 12,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: series.map((point) => point.date.slice(5)),
      axisLine: {
        lineStyle: { color: axisLineColor }
      },
      axisLabel: {
        color: axisTextColor,
        fontSize: 11,
        interval: series.length > 14 ? Math.ceil(series.length / 7) - 1 : 0
      },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: { color: splitLineColor }
      },
      axisLabel: {
        color: axisTextColor,
        fontSize: 11
      }
    },
    series: [
      {
        name: '新增',
        type: 'bar',
        barMaxWidth: 10,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: chartColors[0]
        },
        emphasis: {
          itemStyle: {
            color: '#1d4ed8'
          }
        },
        data: series.map((point) => point.created)
      },
      {
        name: '修改',
        type: 'bar',
        barMaxWidth: 10,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: chartColors[1]
        },
        emphasis: {
          itemStyle: {
            color: '#b91c1c'
          }
        },
        data: series.map((point) => point.updated)
      }
    ]
  }
}

const loadStatistics = async () => {
  loading.value = true
  try {
    const response = await getModuleStatisticsApi(selectedDays.value)
    statistics.value = normalizeResponse(response)
  } catch (error: any) {
    console.error('加载统计数据失败:', error)
    ElMessage.error(error?.message || '加载统计数据失败')
  } finally {
    loading.value = false
  }
}

const changeDays = async (days: number) => {
  if (selectedDays.value === days) return
  selectedDays.value = days
  await loadStatistics()
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
      periodUpdated: Number(payload?.summary?.periodUpdated || 0)
    },
    modules: Array.isArray(payload?.modules) ? payload.modules.map(normalizeModule) : []
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
    updated: Number(item?.today?.updated || 0)
  },
  last7Days: {
    created: Number(item?.last7Days?.created || 0),
    updated: Number(item?.last7Days?.updated || 0)
  },
  last30Days: {
    created: Number(item?.last30Days?.created || 0),
    updated: Number(item?.last30Days?.updated || 0)
  },
  period: {
    days: Number(item?.period?.days || selectedDays.value),
    created: Number(item?.period?.created || 0),
    updated: Number(item?.period?.updated || 0)
  },
  series: Array.isArray(item?.series)
    ? item.series.map((point: any) => ({
        date: String(point?.date || ''),
        created: Number(point?.created || 0),
        updated: Number(point?.updated || 0)
      }))
    : []
})

const formatNumber = (value: number) => new Intl.NumberFormat('zh-CN').format(value || 0)

onMounted(() => {
  loadStatistics()
})
</script>
