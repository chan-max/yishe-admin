import request from '@/config/axios'

export interface QueueMessage {
  id: string
  queue: string
  type: string
  data: any
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
  queue: string
  type: string
  data: any
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
  queue: string
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  limit?: number
  offset?: number
}) => {
  return request.get({ url: `/queue/messages/${params.queue}`, params })
}

// 获取任务详情
export const getTaskDetail = (queue: string, messageId: string) => {
  return request.get({ url: `/queue/message/${queue}/${messageId}` })
}

// 删除任务
export const deleteTask = (queue: string, messageId: string) => {
  return request.delete({ url: `/queue/message/${queue}/${messageId}` })
}

// 获取队列统计信息
export const getQueueStats = (queue: string) => {
  return request.get({ url: `/queue/stats/${queue}` })
}

// 确认任务成功（ACK）
export const ackTask = (queue: string, messageId: string) => {
  return request.post({ url: `/queue/ack/${queue}`, data: { messageId } })
}

// 确认任务失败（NACK）
export const nackTask = (queue: string, messageId: string, error?: string, requeue?: boolean) => {
  return request.post({ url: `/queue/nack/${queue}`, data: { messageId, error, requeue } })
}

// 重新入队失败的任务
export const requeueTask = (queue: string, messageId: string) => {
  return request.post({ url: `/queue/requeue/${queue}/${messageId}` })
}

// 更新任务元数据
export const updateTaskMetadata = (queue: string, messageId: string, metadata: Record<string, any>) => {
  return request.post({ url: `/queue/message/${queue}/${messageId}/metadata`, data: { metadata } })
}

// 清空队列
export const clearQueue = (queue: string) => {
  return request.delete({ url: `/queue/clear/${queue}` })
}

// 获取失败任务列表
export const getFailedTasks = (queue: string, limit?: number) => {
  return request.get({ url: `/queue/failed/${queue}`, params: { limit } })
}

