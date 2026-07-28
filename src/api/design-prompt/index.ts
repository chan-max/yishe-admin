import request from '@/config/axios'

export interface DesignPrompt {
  id?: string
  userId?: string
  title: string
  content: string
  category?: string
  tags?: string[]
  isFavorite?: boolean
  usageCount?: number
  createTime?: string
  updateTime?: string
}

export interface DesignPromptPageParams {
  currentPage?: number
  pageSize?: number
  keyword?: string
  category?: string
  isFavorite?: boolean
}

// 创建
export const createDesignPrompt = (data: DesignPrompt) =>
  request.post({ url: '/design-prompt/create', data })

// 更新
export const updateDesignPrompt = (data: DesignPrompt) =>
  request.post({ url: '/design-prompt/update', data })

// 删除
export const deleteDesignPrompt = (ids: string | string[]) =>
  request.post({ url: '/design-prompt/delete', data: { ids: Array.isArray(ids) ? ids : [ids] } })

// 分页查询
export const getDesignPromptPage = (data: DesignPromptPageParams) =>
  request.post({ url: '/design-prompt/page', data })

// 收藏
export const favoriteDesignPrompt = (id: string) =>
  request.post({ url: '/design-prompt/favorite', data: { id } })

// 取消收藏
export const unfavoriteDesignPrompt = (id: string) =>
  request.post({ url: '/design-prompt/unfavorite', data: { id } })
