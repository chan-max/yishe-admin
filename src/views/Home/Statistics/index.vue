<template>
  <div class="statistics-page">
    <ContentWrap>
      <!-- 页面标题 -->
      <div class="page-header">
        <h2 class="page-title">数据统计</h2>
      </div>

      <!-- 爬图模块 -->
      <div class="module-section mb-24px">
        <div class="module-head">
          <div>
            <h3 class="module-title">爬图模块</h3>
            <p class="module-subtitle">抓取与上传数据概览</p>
          </div>
        </div>

        <div class="mirror-layout">
          <div class="stats-column">
            <div class="stat-row" v-for="item in crawlerLeftStats" :key="item.label">
              <span class="stat-label">{{ item.label }}</span>
              <span class="stat-value">{{ item.value }}</span>
            </div>
          </div>

          <div class="center-panel" v-loading="crawlerLoading">
            <div class="center-total">
              <span class="center-total__label">总上传</span>
              <span class="center-total__value">{{ crawlerTotal }}</span>
            </div>
            <div class="center-chart">
              <div class="chart-head">
                <span>趋势</span>
                <el-select v-model="crawlerDailyDays" size="small" @change="loadCrawlerDailyData">
                  <el-option label="7天" :value="7" />
                  <el-option label="30天" :value="30" />
                  <el-option label="60天" :value="60" />
                </el-select>
              </div>
              <div ref="crawlerChartRef" class="chart-canvas"></div>
            </div>
          </div>

          <div class="stats-column">
            <div class="stat-row" v-for="item in crawlerRightStats" :key="item.label">
              <span class="stat-label">{{ item.label }}</span>
              <span class="stat-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 图库模块 -->
      <div class="module-section">
        <div class="module-head">
          <div>
            <h3 class="module-title">图库模块</h3>
            <p class="module-subtitle">素材上传数据概览</p>
          </div>
        </div>

        <div class="mirror-layout">
          <div class="stats-column">
            <div class="stat-row" v-for="item in stickerLeftStats" :key="item.label">
              <span class="stat-label">{{ item.label }}</span>
              <span class="stat-value">{{ item.value }}</span>
            </div>
          </div>

          <div class="center-panel" v-loading="stickerLoading">
            <div class="center-total">
              <span class="center-total__label">总上传</span>
              <span class="center-total__value">{{ stickerTotal }}</span>
            </div>
            <div class="center-chart">
              <div class="chart-head">
                <span>趋势</span>
                <el-select v-model="stickerDailyDays" size="small" @change="loadStickerDailyData">
                  <el-option label="7天" :value="7" />
                  <el-option label="30天" :value="30" />
                  <el-option label="60天" :value="60" />
                </el-select>
              </div>
              <div ref="stickerChartRef" class="chart-canvas"></div>
            </div>
          </div>

          <div class="stats-column">
            <div class="stat-row" v-for="item in stickerRightStats" :key="item.label">
              <span class="stat-label">{{ item.label }}</span>
              <span class="stat-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </ContentWrap>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { ContentWrap } from '@/components/ContentWrap'
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

type StatItem = { label: string; value: number }

function mapStats(overview: StatisticsOverview | null, items: Array<{ key: keyof StatisticsOverview; label: string }>): StatItem[] {
  return items.map((item) => ({
    label: item.label,
    value: overview ? Number(overview[item.key] || 0) : 0
  }))
}

const stickerLeftStats = computed(() =>
  mapStats(stickerOverview.value, [
    { key: 'today', label: '今天上传' },
    { key: 'yesterday', label: '昨天上传' },
    { key: 'last7Days', label: '最近7天' }
  ])
)

const stickerRightStats = computed(() =>
  mapStats(stickerOverview.value, [
    { key: 'thisWeek', label: '本周上传' },
    { key: 'thisMonth', label: '本月上传' },
    { key: 'last30Days', label: '最近30天' }
  ])
)

const stickerTotal = computed(() => (stickerOverview.value ? Number(stickerOverview.value.total || 0) : 0))

const crawlerLeftStats = computed(() =>
  mapStats(crawlerOverview.value, [
    { key: 'today', label: '今天上传' },
    { key: 'yesterday', label: '昨天上传' },
    { key: 'last7Days', label: '最近7天' }
  ])
)

const crawlerRightStats = computed(() =>
  mapStats(crawlerOverview.value, [
    { key: 'thisWeek', label: '本周上传' },
    { key: 'thisMonth', label: '本月上传' },
    { key: 'last30Days', label: '最近30天' }
  ])
)

const crawlerTotal = computed(() => (crawlerOverview.value ? Number(crawlerOverview.value.total || 0) : 0))

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
  --stat-bg: #f6f7fb;
  --stat-border: rgba(15, 23, 42, 0.08);
  --stat-text: #0f172a;
  --stat-muted: #64748b;
  --stat-accent: #ff6b35;
  --stat-accent-2: #2563eb;
  --stat-surface: #ffffff;

  font-family: "Space Grotesk", "IBM Plex Sans", "Noto Sans SC", sans-serif;
  background:
    radial-gradient(1200px 600px at 10% -20%, rgba(255, 107, 53, 0.12), transparent 60%),
    radial-gradient(900px 500px at 90% 0%, rgba(37, 99, 235, 0.12), transparent 55%),
    linear-gradient(180deg, #f8fafc 0%, #ffffff 45%, #f8fafc 100%);
  padding: 8px 0 24px;

  .page-header {
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--stat-border);

    .page-title {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: var(--stat-text);
      letter-spacing: 0.02em;
    }
  }

  .module-section {
    margin-bottom: 24px;
    padding: 18px 20px 20px;
    border-radius: 18px;
    border: 1px solid var(--stat-border);
    background: var(--stat-surface);
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
    animation: slideUp 0.5s ease;

    &:last-child {
      margin-bottom: 0;
    }

    .module-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 16px;
    }

    .module-title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: var(--stat-text);
    }

    .module-subtitle {
      margin: 6px 0 0;
      font-size: 12px;
      color: var(--stat-muted);
    }
  }

  .mb-24px {
    margin-bottom: 24px;
  }

  .mirror-layout {
    display: grid;
    grid-template-columns: 1fr 1.6fr 1fr;
    gap: 16px;
  }

  .stats-column {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--stat-bg);
    border: 1px solid var(--stat-border);
  }

  .stat-label {
    font-size: 12px;
    color: var(--stat-muted);
  }

  .stat-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--stat-text);
  }

  .center-panel {
    border-radius: 16px;
    border: 1px solid var(--stat-border);
    background: linear-gradient(180deg, #ffffff, #f9fafb);
    padding: 14px 16px 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .center-total {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-bottom: 8px;
    border-bottom: 1px dashed var(--stat-border);
  }

  .center-total__label {
    font-size: 12px;
    color: var(--stat-muted);
  }

  .center-total__value {
    font-size: 24px;
    font-weight: 700;
    color: var(--stat-accent);
  }

  .center-chart {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .chart-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--stat-muted);
  }

  .chart-canvas {
    width: 100%;
    height: 260px;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 1200px) {
    .mirror-layout {
      grid-template-columns: 1fr;
    }

    .center-panel {
      order: -1;
    }
  }
}
</style>

