<template>
  <div class="statistics-page">
    <ContentWrap>
      <!-- 页面标题 -->
      <div class="page-header">
        <h2 class="page-title">数据统计</h2>
      </div>

      <!-- 爬图模块 -->
      <div class="module-section module-section--external mb-24px">
        <h3 class="module-title">爬图模块</h3>
        <el-row :gutter="20">
          <!-- 左侧：统计卡片 -->
          <el-col :xs="24" :sm="24" :md="10" :lg="9" :xl="8">
            <el-row :gutter="12">
              <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12" v-if="crawlerTodayCard">
                <el-card class="statistics-card statistics-card--small" shadow="hover">
                  <div class="statistics-card__content">
                    <div class="statistics-card__label">{{ crawlerTodayCard.label }}</div>
                    <div class="statistics-card__value">{{ crawlerTodayCard.value }}</div>
                    <div v-if="crawlerTodayCard.trend !== undefined && crawlerTodayCard.trend !== null" class="statistics-card__trend">
                      <el-icon :class="crawlerTodayCard.trend >= 0 ? 'trend-up' : 'trend-down'" :size="12">
                        <ArrowUp v-if="crawlerTodayCard.trend >= 0" />
                        <ArrowDown v-else />
                      </el-icon>
                      <span :class="crawlerTodayCard.trend >= 0 ? 'trend-up' : 'trend-down'">
                        {{ Math.abs(crawlerTodayCard.trend) }}%
                      </span>
                    </div>
                  </div>
                  <div class="statistics-card__icon" :style="{ background: crawlerTodayCard.color }">
                    <Icon :icon="crawlerTodayCard.icon" :size="16" />
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12" v-for="(item, index) in crawlerOtherCards" :key="index">
                <el-card class="statistics-card statistics-card--small" shadow="hover">
                  <div class="statistics-card__content">
                    <div class="statistics-card__label">{{ item.label }}</div>
                    <div class="statistics-card__value">{{ item.value }}</div>
                    <div v-if="item.trend !== undefined && item.trend !== null" class="statistics-card__trend">
                      <el-icon :class="item.trend >= 0 ? 'trend-up' : 'trend-down'" :size="12">
                        <ArrowUp v-if="item.trend >= 0" />
                        <ArrowDown v-else />
                      </el-icon>
                      <span :class="item.trend >= 0 ? 'trend-up' : 'trend-down'">
                        {{ Math.abs(item.trend) }}%
                      </span>
                    </div>
                  </div>
                  <div class="statistics-card__icon" :style="{ background: item.color }">
                    <Icon :icon="item.icon" :size="16" />
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-col>

          <!-- 右侧：柱状图 -->
          <el-col :xs="24" :sm="24" :md="14" :lg="15" :xl="16">
            <el-card v-loading="crawlerLoading" class="chart-card">
              <template #header>
                <div class="card-header">
                  <span>爬图上传趋势统计</span>
                  <el-select v-model="crawlerDailyDays" size="small" style="width: 120px" @change="loadCrawlerDailyData">
                    <el-option label="最近7天" :value="7" />
                    <el-option label="最近30天" :value="30" />
                    <el-option label="最近60天" :value="60" />
                  </el-select>
                </div>
              </template>
              <div ref="crawlerChartRef" style="width: 100%; height: 350px"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 图库模块 -->
      <div class="module-section">
        <h3 class="module-title">图库模块</h3>
        <el-row :gutter="20">
          <!-- 左侧：统计卡片 -->
          <el-col :xs="24" :sm="24" :md="10" :lg="9" :xl="8">
            <el-row :gutter="12">
              <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12" v-if="stickerTodayCard">
                <el-card class="statistics-card statistics-card--small" shadow="hover">
                  <div class="statistics-card__content">
                    <div class="statistics-card__label">{{ stickerTodayCard.label }}</div>
                    <div class="statistics-card__value">{{ stickerTodayCard.value }}</div>
                    <div v-if="stickerTodayCard.trend !== undefined && stickerTodayCard.trend !== null" class="statistics-card__trend">
                      <el-icon :class="stickerTodayCard.trend >= 0 ? 'trend-up' : 'trend-down'" :size="12">
                        <ArrowUp v-if="stickerTodayCard.trend >= 0" />
                        <ArrowDown v-else />
                      </el-icon>
                      <span :class="stickerTodayCard.trend >= 0 ? 'trend-up' : 'trend-down'">
                        {{ Math.abs(stickerTodayCard.trend) }}%
                      </span>
                    </div>
                  </div>
                  <div class="statistics-card__icon" :style="{ background: stickerTodayCard.color }">
                    <Icon :icon="stickerTodayCard.icon" :size="16" />
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12" v-for="(item, index) in stickerOtherCards" :key="index">
                <el-card class="statistics-card statistics-card--small" shadow="hover">
                  <div class="statistics-card__content">
                    <div class="statistics-card__label">{{ item.label }}</div>
                    <div class="statistics-card__value">{{ item.value }}</div>
                    <div v-if="item.trend !== undefined && item.trend !== null" class="statistics-card__trend">
                      <el-icon :class="item.trend >= 0 ? 'trend-up' : 'trend-down'" :size="12">
                        <ArrowUp v-if="item.trend >= 0" />
                        <ArrowDown v-else />
                      </el-icon>
                      <span :class="item.trend >= 0 ? 'trend-up' : 'trend-down'">
                        {{ Math.abs(item.trend) }}%
                      </span>
                    </div>
                  </div>
                  <div class="statistics-card__icon" :style="{ background: item.color }">
                    <Icon :icon="item.icon" :size="16" />
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-col>

          <!-- 右侧：柱状图 -->
          <el-col :xs="24" :sm="24" :md="14" :lg="15" :xl="16">
            <el-card v-loading="stickerLoading" class="chart-card">
              <template #header>
                <div class="card-header">
                  <span>图库上传趋势统计</span>
                  <el-select v-model="stickerDailyDays" size="small" style="width: 120px" @change="loadStickerDailyData">
                    <el-option label="最近7天" :value="7" />
                    <el-option label="最近30天" :value="30" />
                    <el-option label="最近60天" :value="60" />
                  </el-select>
                </div>
              </template>
              <div ref="stickerChartRef" style="width: 100%; height: 350px"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </ContentWrap>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { ContentWrap } from '@/components/ContentWrap'
import { Icon } from '@/components/Icon'
import {
  getStatisticsOverview,
  getDailyStatistics,
  getCrawlerStatisticsOverview,
  getCrawlerDailyStatistics,
  type StatisticsOverview,
  type DailyStatistics
} from '@/api/statistics'

defineOptions({ name: 'Statistics' })

// 图库模块数据
const stickerOverview = ref<StatisticsOverview | null>(null)
const stickerLoading = ref(false)
const stickerDailyDays = ref(30)
const stickerChartRef = ref<HTMLDivElement>()
let stickerChart: echarts.ECharts | null = null

// 爬图模块数据
const crawlerOverview = ref<StatisticsOverview | null>(null)
const crawlerLoading = ref(false)
const crawlerDailyDays = ref(30)
const crawlerChartRef = ref<HTMLDivElement>()
let crawlerChart: echarts.ECharts | null = null

// 计算图库"今天上传"卡片
const stickerTodayCard = computed(() => {
  if (!stickerOverview.value) {
    return null
  }

  const ov = stickerOverview.value
  return {
    label: '今天上传',
    value: ov.today || 0,
    icon: 'ep:upload-filled',
    color: '#409EFF',
    trend: undefined
  }
})

// 计算图库其他概览卡片数据
const stickerOtherCards = computed(() => {
  if (!stickerOverview.value) {
    return []
  }

  const ov = stickerOverview.value
  const cards = [
    {
      label: '昨天上传',
      value: ov.yesterday || 0,
      icon: 'ep:clock',
      color: '#67C23A',
      trend: undefined
    },
    {
      label: '本周上传',
      value: ov.thisWeek || 0,
      icon: 'ep:calendar',
      color: '#E6A23C',
      trend: (ov.lastWeek || 0) > 0
        ? Math.round(((ov.thisWeek || 0) - (ov.lastWeek || 0)) / (ov.lastWeek || 1) * 100)
        : undefined
    },
    {
      label: '本月上传',
      value: ov.thisMonth || 0,
      icon: 'ep:data-line',
      color: '#F56C6C',
      trend: (ov.lastMonth || 0) > 0
        ? Math.round(((ov.thisMonth || 0) - (ov.lastMonth || 0)) / (ov.lastMonth || 1) * 100)
        : undefined
    },
    {
      label: '最近7天',
      value: ov.last7Days || 0,
      icon: 'ep:pie-chart',
      color: '#909399',
      trend: undefined
    },
    {
      label: '最近30天',
      value: ov.last30Days || 0,
      icon: 'ep:trend-charts',
      color: '#606266',
      trend: undefined
    },
    {
      label: '总上传数',
      value: ov.total || 0,
      icon: 'ep:collection',
      color: '#303133',
      trend: undefined
    }
  ]
  return cards
})

// 计算爬图"今天上传"卡片
const crawlerTodayCard = computed(() => {
  if (!crawlerOverview.value) {
    return null
  }

  const ov = crawlerOverview.value
  return {
    label: '今天上传',
    value: ov.today || 0,
    icon: 'ep:upload-filled',
    color: '#409EFF',
    trend: undefined
  }
})

// 计算爬图其他概览卡片数据
const crawlerOtherCards = computed(() => {
  if (!crawlerOverview.value) {
    return []
  }

  const ov = crawlerOverview.value
  const cards = [
    {
      label: '昨天上传',
      value: ov.yesterday || 0,
      icon: 'ep:clock',
      color: '#67C23A',
      trend: undefined
    },
    {
      label: '本周上传',
      value: ov.thisWeek || 0,
      icon: 'ep:calendar',
      color: '#E6A23C',
      trend: (ov.lastWeek || 0) > 0
        ? Math.round(((ov.thisWeek || 0) - (ov.lastWeek || 0)) / (ov.lastWeek || 1) * 100)
        : undefined
    },
    {
      label: '本月上传',
      value: ov.thisMonth || 0,
      icon: 'ep:data-line',
      color: '#F56C6C',
      trend: (ov.lastMonth || 0) > 0
        ? Math.round(((ov.thisMonth || 0) - (ov.lastMonth || 0)) / (ov.lastMonth || 1) * 100)
        : undefined
    },
    {
      label: '最近7天',
      value: ov.last7Days || 0,
      icon: 'ep:pie-chart',
      color: '#909399',
      trend: undefined
    },
    {
      label: '最近30天',
      value: ov.last30Days || 0,
      icon: 'ep:trend-charts',
      color: '#606266',
      trend: undefined
    },
    {
      label: '总上传数',
      value: ov.total || 0,
      icon: 'ep:collection',
      color: '#303133',
      trend: undefined
    }
  ]
  return cards
})

// 加载图库概览数据
const loadStickerOverview = async () => {
  try {
    stickerLoading.value = true
    const response = await getStatisticsOverview()
    const data = response?.data || response
    if (data && typeof data === 'object' && 'today' in data) {
      stickerOverview.value = data as StatisticsOverview
    } else {
      stickerOverview.value = {
        today: 0,
        yesterday: 0,
        thisWeek: 0,
        lastWeek: 0,
        thisMonth: 0,
        lastMonth: 0,
        last7Days: 0,
        last30Days: 0,
        total: 0
      }
    }
  } catch (error: any) {
    console.error('加载图库概览数据失败:', error)
    ElMessage.error(error?.message || '加载图库概览数据失败')
    stickerOverview.value = {
      today: 0,
      yesterday: 0,
      thisWeek: 0,
      lastWeek: 0,
      thisMonth: 0,
      lastMonth: 0,
      last7Days: 0,
      last30Days: 0,
      total: 0
    }
  } finally {
    stickerLoading.value = false
  }
}

// 加载爬图概览数据
const loadCrawlerOverview = async () => {
  try {
    crawlerLoading.value = true
    const response = await getCrawlerStatisticsOverview()
    const data = response?.data || response
    if (data && typeof data === 'object' && 'today' in data) {
      crawlerOverview.value = data as StatisticsOverview
    } else {
      crawlerOverview.value = {
        today: 0,
        yesterday: 0,
        thisWeek: 0,
        lastWeek: 0,
        thisMonth: 0,
        lastMonth: 0,
        last7Days: 0,
        last30Days: 0,
        total: 0
      }
    }
  } catch (error: any) {
    console.error('加载爬图概览数据失败:', error)
    ElMessage.error(error?.message || '加载爬图概览数据失败')
    crawlerOverview.value = {
      today: 0,
      yesterday: 0,
      thisWeek: 0,
      lastWeek: 0,
      thisMonth: 0,
      lastMonth: 0,
      last7Days: 0,
      last30Days: 0,
      total: 0
    }
  } finally {
    crawlerLoading.value = false
  }
}

// 加载图库每日统计数据 - 使用柱状图
const loadStickerDailyData = async () => {
  if (!stickerChartRef.value) return

  try {
    stickerLoading.value = true
    const response = await getDailyStatistics(stickerDailyDays.value)
    const data = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : [])
    
    if (!stickerChart) {
      stickerChart = echarts.init(stickerChartRef.value)
    }

    const option: EChartsOption = {
      title: {
        text: '图库每日上传趋势',
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const param = params[0]
          return `${param.name}<br/>${param.seriesName}: ${param.value}`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.date || ''),
        axisLabel: {
          rotate: 45,
          interval: data.length > 30 ? Math.max(0, Math.floor(data.length / 10)) : 0
        }
      },
      yAxis: {
        type: 'value',
        name: '上传数量',
        nameLocation: 'middle',
        nameGap: 50
      },
      series: [
        {
          name: '上传数量',
          type: 'bar',
          data: data.map((item) => item.count || 0),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#409EFF' },
              { offset: 1, color: '#66B1FF' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#66B1FF' },
                { offset: 1, color: '#409EFF' }
              ])
            }
          }
        }
      ]
    }

    stickerChart.setOption(option)
  } catch (error: any) {
    console.error('加载图库每日统计数据失败:', error)
    ElMessage.error(error?.message || '加载图库统计数据失败')
  } finally {
    stickerLoading.value = false
  }
}

// 加载爬图每日统计数据 - 使用柱状图
const loadCrawlerDailyData = async () => {
  if (!crawlerChartRef.value) return

  try {
    crawlerLoading.value = true
    const response = await getCrawlerDailyStatistics(crawlerDailyDays.value)
    const data = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : [])
    
    if (!crawlerChart) {
      crawlerChart = echarts.init(crawlerChartRef.value)
    }

    const option: EChartsOption = {
      title: {
        text: '爬图每日上传趋势',
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const param = params[0]
          return `${param.name}<br/>${param.seriesName}: ${param.value}`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.date || ''),
        axisLabel: {
          rotate: 45,
          interval: data.length > 30 ? Math.max(0, Math.floor(data.length / 10)) : 0
        }
      },
      yAxis: {
        type: 'value',
        name: '上传数量',
        nameLocation: 'middle',
        nameGap: 50
      },
      series: [
        {
          name: '上传数量',
          type: 'bar',
          data: data.map((item) => item.count || 0),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#67C23A' },
              { offset: 1, color: '#95D475' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#95D475' },
                { offset: 1, color: '#67C23A' }
              ])
            }
          }
        }
      ]
    }

    crawlerChart.setOption(option)
  } catch (error: any) {
    console.error('加载爬图每日统计数据失败:', error)
    ElMessage.error(error?.message || '加载爬图统计数据失败')
  } finally {
    crawlerLoading.value = false
  }
}

// 组件挂载
onMounted(async () => {
  // 并行加载两个模块的数据
  await Promise.all([
    loadStickerOverview(),
    loadCrawlerOverview()
  ])
  
  await nextTick()
  
  // 并行加载两个模块的图表
  await Promise.all([
    loadStickerDailyData(),
    loadCrawlerDailyData()
  ])

  // 监听窗口大小变化，自动调整图表大小
  window.addEventListener('resize', () => {
    stickerChart?.resize()
    crawlerChart?.resize()
  })
})
</script>

<style lang="scss" scoped>
.statistics-page {
  .page-header {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter, #EBEEF5);

    .page-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary, #303133);
    }
  }

  .module-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .module-title {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary, #303133);
      padding-bottom: 12px;
      border-bottom: 1px solid var(--el-border-color-lighter, #EBEEF5);
    }

    // 外部资源模块：半透明黄色背景（参考 crawler-material.vue 中外部资源 el-tag warning 类型的样式）
    &--external {
      padding: 20px !important;
      border-radius: 8px !important;
      // 使用 Element Plus warning 颜色（与 crawler-material.vue 中外部资源 el-tag warning 类型一致）
      // Element Plus warning 颜色为 #E6A23C (rgb(230, 162, 60))
      background-color: rgba(230, 162, 60, 0.08) !important;
      border-left: 3px solid rgba(230, 162, 60, 0.3) !important;
    }

    // 统计卡片区域，确保在左侧显示时卡片排列正确
    .el-col:first-child {
      .el-row {
        .el-col {
          margin-bottom: 12px;
          
          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    // 图表卡片区域，确保高度自适应
    .chart-card {
      height: 100%;
      min-height: 400px;
      
      :deep(.el-card__body) {
        height: calc(100% - 57px);
        min-height: 350px;
      }
    }
  }

  .mb-24px {
    margin-bottom: 24px;
  }

  .statistics-card {
    position: relative;
    overflow: hidden;
    margin-bottom: 0;

    &--small {
      :deep(.el-card__body) {
        padding: 12px;
      }
    }

    &__content {
      position: relative;
      z-index: 1;
    }

    &__label {
      font-size: 12px;
      color: var(--el-text-color-secondary, #909399);
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__value {
      font-size: 20px;
      font-weight: bold;
      color: var(--el-text-color-primary, #303133);
      margin-bottom: 4px;
      line-height: 1.2;
    }

    &__trend {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 11px;

      .trend-up {
        color: var(--el-color-success, #67C23A);
      }

      .trend-down {
        color: var(--el-color-danger, #F56C6C);
      }
    }

    &__icon {
      position: absolute;
      right: 8px;
      top: 8px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.15;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: var(--el-text-color-primary, #303133);
  }

  .mb-16px {
    margin-bottom: 16px;
  }
}
</style>

