import request from '@/config/axios'

export interface ModuleStatisticsSeriesPoint {
  date: string
  created: number
  updated: number
}

export interface ModuleStatisticsItem {
  key: string
  label: string
  description: string
  total: number
  updatedTotal: number
  today: {
    created: number
    updated: number
  }
  last7Days: {
    created: number
    updated: number
  }
  last30Days: {
    created: number
    updated: number
  }
  period: {
    days: number
    created: number
    updated: number
  }
  series: ModuleStatisticsSeriesPoint[]
}

export interface ModuleStatisticsResponse {
  generatedAt: string
  summary: {
    moduleCount: number
    totalRecords: number
    updatedRecords: number
    periodDays: number
    periodCreated: number
    periodUpdated: number
  }
  modules: ModuleStatisticsItem[]
}

export const getModuleStatisticsApi = (days = 30) => {
  return request.post<ModuleStatisticsResponse>({
    url: '/statistics/modules',
    data: { days }
  })
}
