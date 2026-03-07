import request from '@/config/axios'

export type PublishConfig = {
  id: string
  name: string
  platform: string
  configData: any
  description: string
  isActive: boolean
  createTime: string
  updateTime: string
}

export const getPublishConfigListApi = () => {
  return request.get({ url: '/publish-config' })
}

export const getPublishConfigApi = (id: string) => {
  return request.get({ url: '/publish-config/' + id })
}

export const createPublishConfigApi = (data: any) => {
  return request.post({ url: '/publish-config', data })
}

export const updatePublishConfigApi = (id: string, data: any) => {
  return request.patch({ url: '/publish-config/' + id, data })
}

export const deletePublishConfigApi = (id: string) => {
  return request.delete({ url: '/publish-config/' + id })
}

// 创建发布任务（服务端自动生成标题并写入任务数据）
export const createPublishTaskApi = (data: {
  productId: string
  platform: string
  publishConfigId: string
  publishOptions?: any
  description?: string
  metadata?: Record<string, any>
}) => {
  return request.post({ url: '/publish-config/create-publish-task', data })
}
