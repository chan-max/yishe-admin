import request from '@/config/axios'

export interface HotSearchItem {
  rank: number
  title: string
  hot?: string | number
  url?: string
  tag?: string
  subtitle?: string
  [key: string]: any
}

export interface PlatformResult {
  name: string
  success: boolean
  items: HotSearchItem[]
  error?: string | null
  duration?: number | null
  itemCount: number
}

export interface HotSearchCollectRecord {
  id: number
  platforms: string[]
  platformCount: number
  itemCount: number
  successCount: number
  failCount: number
  status: 'running' | 'success' | 'partial' | 'failed'
  data: Record<string, PlatformResult>
  summary: any
  triggeredBy: string
  duration: number | null
  fetchedAt: string
  analysisStatus: 'pending' | 'analyzing' | 'done' | 'failed'
  analysis: {
    summary?: string
    trends?: { title: string; platform: string; significance: string; description: string }[]
    podRecommendations?: { element: string; source: string; targetProducts: string[]; reason: string; designSuggestion: string; estimatedAppeal: string }[]
    marketInsights?: string
  } | null
  createTime: string
}

export const getLatestHotsearch = () => {
  return request.get<{ success: boolean; data: HotSearchCollectRecord | null }>({ url: '/hotsearch-data/latest' })
}

export const getHotsearchById = (id: number) => {
  return request.get<{ success: boolean; data: HotSearchCollectRecord }>({ url: `/hotsearch-data/detail/${id}` })
}

export const pageHotsearch = (data: {
  currentPage?: number
  pageSize?: number
  status?: string
  platform?: string
  triggeredBy?: string
  startDate?: string
  endDate?: string
}) => {
  return request.post<{ list: HotSearchCollectRecord[]; total: number }>({ url: '/hotsearch-data/page', data })
}

export const deleteHotsearch = (id: number) => {
  return request.delete({ url: `/hotsearch-data/${id}` })
}

export const cleanupHotsearch = (keepDays?: number) => {
  return request.post({ url: '/hotsearch-data/cleanup', data: { keepDays } })
}

export const getHotsearchPlatforms = () => {
  return request.get<string[]>({ url: '/hotsearch-data/platforms' })
}

// ==================== 定时任务 ====================

export interface HotsearchSchedule {
  id: number
  clientId: string
  platforms: string[]
  intervalMinutes: number
  enabled: boolean
  environment: string
  autoAnalyze: boolean
  analysisPrompt: string | null
  analysisStyle: string
  lastRunAt: string | null
  nextRunAt: string | null
  runStatus: string
  lastError: string | null
  createTime: string
}

export const getSchedules = (clientId?: string) => {
  return request.get<HotsearchSchedule[]>({
    url: '/hotsearch-data/schedules',
    params: clientId ? { clientId } : {},
  })
}

export const saveSchedule = (data: {
  id?: number
  clientId: string
  platforms: string[]
  intervalMinutes?: number
  enabled?: boolean
  environment?: string
  autoAnalyze?: boolean
  analysisPrompt?: string
  analysisStyle?: string
}) => {
  return request.post<{ success: boolean; data: HotsearchSchedule }>({ url: '/hotsearch-data/schedule', data })
}

export const toggleSchedule = (id: number, enabled: boolean) => {
  return request.post({ url: `/hotsearch-data/schedule/${id}/toggle`, data: { enabled } })
}

export const deleteSchedule = (id: number) => {
  return request.delete({ url: `/hotsearch-data/schedule/${id}` })
}

// ==================== AI 分析 ====================

export const triggerAnalysis = (id: number) => {
  return request.post({ url: `/hotsearch-data/analyze/${id}` })
}
