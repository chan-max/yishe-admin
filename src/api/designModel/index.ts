import request from '@/config/axios'

// 设计模型 VO
export interface DesignModelVO {
  id: string
  name: string
  description?: string
  url?: string
  creatorName?: string
  createTime?: Date
  updateTime?: Date
  // 可根据后端返回字段补充
}

// 获取设计模型分页列表
export const getDesignModelList = (data) => {
  return request.post({
    url: '/custom-model/page',
    data
  })
}

// 获取设计模型详情
export const getDesignModel = (id: string) => {
  return request.get({
    url: `/custom-model?id=${id}`
  })
}

// 更新设计模型
export const updateDesignModel = (data: DesignModelVO) => {
  return request.post({
    url: '/custom-model/update',
    data
  })
}

// 删除设计模型
export const deleteDesignModel = (ids: string[]) => {
  return request.post({
    url: '/custom-model/delete',
    data: { id: ids[0] } // 后端只接收单个id
  })
} 