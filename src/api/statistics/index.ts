import request from '@/config/axios'

export interface StatisticsOverview {
  today: number
  yesterday: number
  thisWeek: number
  lastWeek: number
  thisMonth: number
  lastMonth: number
  last7Days: number
  last30Days: number
  total: number
}

export interface DailyStatistics {
  date: string
  count: number
}

export interface WeeklyStatistics {
  yearWeek: number
  weekStart: string
  count: number
}

export interface MonthlyStatistics {
  month: string
  count: number
}

export interface StatisticsData {
  overview: StatisticsOverview
  daily: DailyStatistics[]
  weekly: WeeklyStatistics[]
  monthly: MonthlyStatistics[]
}

// 获取统计概览
export const getStatisticsOverview = () => {
  return request.post<StatisticsOverview>({ url: '/statistics/overview' })
}

// 按日期统计
export const getDailyStatistics = (days?: number) => {
  return request.post<DailyStatistics[]>({ 
    url: '/statistics/daily',
    data: days ? { days } : {}
  })
}

// 按周统计
export const getWeeklyStatistics = (weeks?: number) => {
  return request.post<WeeklyStatistics[]>({ 
    url: '/statistics/weekly',
    data: weeks ? { weeks } : {}
  })
}

// 按月统计
export const getMonthlyStatistics = (months?: number) => {
  return request.post<MonthlyStatistics[]>({ 
    url: '/statistics/monthly',
    data: months ? { months } : {}
  })
}

// 获取综合统计数据
export const getAllStatistics = (params?: { days?: number; weeks?: number; months?: number }) => {
  return request.post<StatisticsData>({ 
    url: '/statistics/all',
    data: params || {}
  })
}

// 获取爬图统计概览
export const getCrawlerStatisticsOverview = () => {
  return request.post<StatisticsOverview>({ url: '/statistics/crawler/overview' })
}

// 按日期统计爬图
export const getCrawlerDailyStatistics = (days?: number) => {
  return request.post<DailyStatistics[]>({ 
    url: '/statistics/crawler/daily',
    data: days ? { days } : {}
  })
}

