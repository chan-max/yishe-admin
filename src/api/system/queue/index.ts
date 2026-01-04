import request from '@/config/axios'

export interface QueueMessage {
  id: string
  queue: string
  type: string
  data: any
  description?: string
  priority?: number
  delay?: number
  maxAttempts?: number
  attempts?: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  updatedAt?: string
  processedAt?: string
  error?: string
  metadata?: Record<string, any>
}

export interface QueueStats {
  queue: string
  pending: number
  processing: number
  delayed: number
  completed: number
  failed: number
  total: number
}

export interface CreateTaskDto {
  queue?: string  // 队列名称（可选，如果未提供则使用 type 作为 queue）
  type: string    // 任务类型（必需，如果未提供 queue 则同时作为队列名称）
  data: any
  description?: string
  priority?: number
  delay?: number
  maxAttempts?: number
  metadata?: Record<string, any>
}

// 创建任务
export const createTask = (data: CreateTaskDto) => {
  return request.post({ url: '/queue/produce', data })
}

// 批量创建任务
export const createTaskBatch = (data: { queue: string; tasks: Array<{ type: string; data: any; priority?: number; delay?: number }> }) => {
  return request.post({ url: '/queue/produce/batch', data })
}

// 获取任务列表（根据状态分页查询）
export const getTaskList = (params: {
  queue?: string  // 队列名称（可选，不传则查询所有队列）
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  type?: string    // 任务类型（可选，不传则查询所有类型）
  limit?: number
  offset?: number
}) => {
  // 如果 queue 为空字符串，不传该参数
  const queryParams: any = { ...params }
  if (!queryParams.queue || !queryParams.queue.trim()) {
    delete queryParams.queue
  }
  // 如果 type 为空字符串，不传该参数
  if (!queryParams.type || !queryParams.type.trim()) {
    delete queryParams.type
  }
  return request.get({ url: `/queue/messages`, params: queryParams })
}

// 获取任务详情
export const getTaskDetail = (queue: string, messageId: string) => {
  return request.get({ url: `/queue/message`, params: { queue, messageId } })
}

// 删除任务
export const deleteTask = (queue: string, messageId: string) => {
  return request.delete({ url: `/queue/message`, params: { queue, messageId } })
}

// 获取队列统计信息
export const getQueueStats = (queue?: string) => {
  // 如果 queue 为空字符串，不传该参数（查询所有队列的统计）
  const params: any = {}
  if (queue && queue.trim()) {
    params.queue = queue.trim()
  }
  return request.get({ url: `/queue/stats`, params })
}

// 确认任务成功（ACK）
export const ackTask = (queue: string, messageId: string) => {
  return request.post({ url: `/queue/ack`, data: { queue, messageId } })
}

// 确认任务失败（NACK）
export const nackTask = (queue: string, messageId: string, error?: string, requeue?: boolean) => {
  return request.post({ url: `/queue/nack`, data: { queue, messageId, error, requeue } })
}

// 重新入队失败的任务
export const requeueTask = (queue: string, messageId: string) => {
  return request.post({ url: `/queue/requeue`, data: { queue, messageId } })
}

// 更新任务元数据
export const updateTaskMetadata = (queue: string, messageId: string, metadata: Record<string, any>) => {
  return request.post({ url: `/queue/message/metadata`, data: { queue, messageId, metadata } })
}

// 更新任务数据
export const updateTaskData = (queue: string, messageId: string, data: any) => {
  return request.post({ url: `/queue/message/data`, data: { queue, messageId, data } })
}

// 更新任务状态（使用 type 字段而不是 queue）
export const updateTaskStatus = (type: string, messageId: string, status: 'pending' | 'processing' | 'completed' | 'failed') => {
  return request.post({ url: '/queue/message/status', data: { type, messageId, status } })
}

// 清空队列
export const clearQueue = (queue: string) => {
  return request.delete({ url: `/queue/clear`, params: { queue } })
}

// 获取失败任务列表
export const getFailedTasks = (queue: string, limit?: number) => {
  return request.get({ url: `/queue/failed`, params: { queue, limit } })
}

