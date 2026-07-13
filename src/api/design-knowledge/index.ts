import request from '@/config/axios'

export interface DesignKnowledge {
  id?: string
  userId?: string
  title: string
  content: string
  category?: string
  tags?: string[]
  extras?: Record<string, any>
  isPublic?: boolean
  createTime?: string
  updateTime?: string
}

export interface DesignKnowledgePageParams {
  currentPage?: number
  pageSize?: number
  keyword?: string
  category?: string
}

export interface DesignKnowledgeSearchParams {
  query: string
  limit?: number
  category?: string
}

// 创建知识条目
export const createDesignKnowledge = (data: DesignKnowledge) =>
  request.post({ url: '/design-knowledge/create', data })

// 更新知识条目
export const updateDesignKnowledge = (data: DesignKnowledge) =>
  request.post({ url: '/design-knowledge/update', data })

// 删除知识条目
export const deleteDesignKnowledge = (ids: string | string[]) =>
  request.post({ url: '/design-knowledge/delete', data: { ids: Array.isArray(ids) ? ids : [ids] } })

// 分页查询
export const getDesignKnowledgePage = (data: DesignKnowledgePageParams) =>
  request.post({ url: '/design-knowledge/page', data })

// 获取详情
export const getDesignKnowledgeDetail = (id: string) =>
  request.get({ url: `/design-knowledge/${id}` })

// 向量语义搜索
export const searchDesignKnowledge = (data: DesignKnowledgeSearchParams) =>
  request.post({ url: '/design-knowledge/search', data })

// 批量重建向量索引
export const reindexDesignKnowledge = () =>
  request.post({ url: '/design-knowledge/reindex' })
