import request from '@/config/axios'

export type OperateLogVO = {
  id: string
  userId?: number
  userName?: string
  action: string
  timestamp: string
  ip?: string
  userAgent?: string
  extra?: any
}

// 查询操作日志列表（POST）
export const getOperateLogPage = (params: PageParam & {
  userId?: number
  userName?: string
  action?: string
  startTime?: string
  endTime?: string
}) => {
  return request.post({ url: '/system/operate-log/page', data: params })
}

// 查询操作日志列表（GET）
export const getOperateLogPageByQuery = (params: {
  currentPage?: number
  pageSize?: number
  userId?: number
  userName?: string
  action?: string
  startTime?: string
  endTime?: string
}) => {
  return request.get({ url: '/system/operate-log/page', params })
}

// 清空操作日志
export const clearOperateLog = () => {
  return request.post({ url: '/system/operate-log/clear' })
}
