import request from '@/config/axios'

export type ResourceLibraryType =
  | 'sticker'
  | 'psd_template'
  | 'font_template'
  | 'asset_3d'
  | 'file_resource'
  | 'sentence'
  | 'ai_skill'
  | 'prompt'
  | 'design_prompt';

export interface ResourceLibraryItem {
  id: string
  resourceType: ResourceLibraryType
  resourceId?: string
  name: string
  description?: string
  category: string
  tags?: string[]
  coverUrl?: string
  authorId?: number
  authorName?: string
  importCount: number
  publishedAt?: string
  createTime?: string
}

export interface ResourceLibraryPageParams {
  currentPage?: number
  pageSize?: number
  resourceType?: ResourceLibraryType | ''
  category?: string
  keyword?: string
}

export interface BatchPublishResourcePayload {
  resourceType: ResourceLibraryType
  ids: Array<string | number>
  category?: string
  description?: string
}

export const ResourceLibraryApi = {
  // 管理员批量发布
  batchPublish: async (data: BatchPublishResourcePayload) => {
    return await request.post({ url: '/resource-library/publish', data })
  },

  // 广场只读分页查询
  getPage: async (data: ResourceLibraryPageParams) => {
    return await request.post<{ list: ResourceLibraryItem[]; total: number }>({
      url: '/resource-library/page',
      data,
    })
  },

  // 一键导入到个人空间
  importToUser: async (id: string) => {
    return await request.post<{ success: boolean; message: string; recordId?: any; resourceType: string }>({
      url: `/resource-library/import/${id}`,
    })
  },

  // 更新
  update: async (data: Partial<ResourceLibraryItem> & { id: string }) => {
    return await request.post({ url: '/resource-library/update', data })
  },

  // 管理员下架/删除
  remove: async (id: string) => {
    return await request.delete({ url: `/resource-library/${id}` })
  },

  // 获取资源广场各类型的最新发布时间（用于菜单"新"标签）
  getMenuUpdates: async () => {
    return await request.get<Record<string, string | null>>({
      url: '/resource-library/menu-updates',
    })
  },
}
