/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-08 21:41:00
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-09 06:54:44
 * @FilePath: /design-server/Users/jackie/workspace/yishe-admin/src/api/designModel/index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
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
export const getDesignModel = (data) => {
  return request.post({
    url: `/custom-model`,
    data
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
export const deleteDesignModel = (ids: string | string[]) => {
  return request.post({
    url: '/custom-model/delete',
    data: { ids }
  })
} 