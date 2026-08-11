import request from '@/config/axios'

export interface WorkflowCanvas {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  viewport?: { x: number; y: number; zoom: number }
}

export interface WorkflowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, any>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  type?: string
}

export interface WorkflowItem {
  id: string
  name: string
  description?: string
  status: 'draft' | 'published' | 'archived'
  isEnabled: boolean
  isRunning: boolean
  userId: number
  canvas?: WorkflowCanvas
  createTime: string
  updateTime: string
  /** 触发器列表（定时/手动/webhook） */
  triggers?: WorkflowTrigger[]
}

export interface WorkflowTrigger {
  id: string
  type: 'manual' | 'cron' | 'webhook'
  enabled: boolean
  config?: {
    expression?: string
    name?: string
  }
  nextRunTime?: string
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
  isEnabled?: boolean
  canvas?: WorkflowCanvas
}) => request.post({ url: '/workflow/update', data })

// 删除工作流
export const deleteWorkflowApi = (ids: string | string[]) =>
  request.post({ url: '/workflow/delete', data: { ids } })

// 切换工作流启用状态
export const toggleEnabledApi = (id: string) =>
  request.put({ url: `/workflow/${id}/toggle-enabled` })

// 🚀 手动运行工作流
export const runWorkflowApi = (id: string, input?: Record<string, any>) =>
  request.post({ url: `/workflow/${id}/run`, data: { input } })

// 获取工作流关联的触发器列表
export const getWorkflowTriggersApi = (id: string) =>
  request.get({ url: `/workflow/${id}/triggers` })

// 保存/新增/更新工作流触发器
export const saveWorkflowTriggerApi = (
  id: string,
  data: { type: string; config?: Record<string, any>; enabled?: boolean }
) => request.post({ url: `/workflow/${id}/triggers`, data })

// 删除触发器
export const deleteWorkflowTriggerApi = (triggerId: string) =>
  request.delete({ url: `/workflow/triggers/${triggerId}` })

// 获取工作流运行历史日志列表
export const getWorkflowExecutionsApi = (
  id: string,
  data?: { currentPage?: number; pageSize?: number }
) => request.post({ url: `/workflow/${id}/executions`, data })

// 删除单条执行记录
export const deleteWorkflowExecutionApi = (executionId: string) =>
  request.delete({ url: `/workflow/executions/${executionId}` })

// 清空工作流执行记录
export const clearWorkflowExecutionsApi = (workflowId: string) =>
  request.delete({ url: `/workflow/${workflowId}/executions` })

// ✨ AI 生成工作流
export const aiGenerateWorkflowApi = (data: {
  description: string
  currentCanvas?: { nodes: any[]; edges: any[]; viewport?: any }
}) => request.post({ url: '/workflow/ai-generate', data })
