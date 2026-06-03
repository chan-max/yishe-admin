import request from '@/config/axios'

export interface AmazonCrawlerTask {
  id: number
  userId: number
  asin: string
  crawlDate: string
  keywordReverse: string
  keywordReverseOther: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped'
  forceCrawl: boolean
  errorMsg: string
  excelUrl: string
  excelKey: string
  startedAt: string
  completedAt: string
  createTime: string
  updateTime: string
}

export interface CreateAmazonCrawlerTaskDto {
  asins: string[]
  crawlDate?: string
  forceCrawl?: boolean
}

export interface ExportAmazonCrawlerTaskDto {
  taskIds: number[]
}

// 提交任务
export const createTasks = (data: CreateAmazonCrawlerTaskDto) => {
  return request.post({ url: '/amazon-crawler/tasks', data })
}

// 查询任务列表
export const getTasks = (params: { status?: string; page?: number; limit?: number }) => {
  return request.get({ url: '/amazon-crawler/tasks', params })
}

// 停止任务
export const stopTask = (id: number) => {
  return request.post({ url: `/amazon-crawler/tasks/${id}/stop` })
}

// 执行任务
export const executeTasks = (taskIds: number[]) => {
  return request.post({ url: '/amazon-crawler/tasks/execute', data: { taskIds } })
}

// 合并导出
export const mergeExport = (taskIds: number[]) => {
  return request.post({ url: '/amazon-crawler/tasks/merge-export', data: { taskIds } })
}

// 更新账号
export const updateAccount = (data: { email: string; password: string }) => {
  return request.post({ url: '/amazon-crawler/account', data })
}

// 获取账号信息
export const getAccount = () => {
  return request.get({ url: '/amazon-crawler/account' })
}

// 手动登录
export const loginAccount = () => {
  return request.post({ url: '/amazon-crawler/account/login' })
}

// 获取爬虫状态
export const getStatus = () => {
  return request.get({ url: '/amazon-crawler/status' })
}
