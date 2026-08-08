import request from '@/config/axios'

export interface WorkflowCanvas {
  nodes: any[]
  edges: any[]
  viewport?: { x: number; y: number; zoom: number }
}

export interface WorkflowItem {
  id: string
  name: string
  description?: string
  status: 'draft' | 'published' | 'archived'
  version: number
  userId: number
  canvas?: WorkflowCanvas
  createTime: string
  updateTime: string
}

export interface WorkflowPageParams {
  currentPage?: number
  pageSize?: number
  name?: string
  status?: string
}

// 创建工作流
export const createWorkflowApi = (data: { name: string; description?: string }) =>
  request.post({ url: '/workflow/create', data })

// 分页查询工作流列表
export const getWorkflowPageApi = (data: WorkflowPageParams) =>
  request.post({ url: '/workflow/page', data })

// 获取工作流详情（含画布）
export const getWorkflowDetailApi = (id: string) =>
  request.get({ url: `/workflow/${id}` })

// 更新工作流（支持局部更新：名称 / 画布 / 状态）
export const updateWorkflowApi = (data: {
  id: string
  name?: string
  description?: string
  status?: string
  canvas?: WorkflowCanvas
}) => request.post({ url: '/workflow/update', data })

// 删除工作流
export const deleteWorkflowApi = (ids: string | string[]) =>
  request.post({ url: '/workflow/delete', data: { ids } })
