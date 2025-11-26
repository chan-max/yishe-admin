/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-05-19 05:55:18
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-05-25 08:37:41
 * @FilePath: /yishe-admin/src/api/psdTemplate/index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import request from '@/config/axios'

export const psdTemplateApi = {

  getPsdTemplatePage: async (data: any) => {
    return await request.post({ url: `/psd-template/page`, data })
  },

  // 查询YiShe 模板详情
  getShopTemplate: async (id: number) => {
    return await request.get({ url: `/shop/shop-template/get?id=` + id })
  },

  // 新增YiShe 模板
  createPsdTemplate: async (data) => {
    return await request.post({
      url: `/psd-template/create`, data, 
    })
  },

  // 修改YiShe 模板
  updatePsdTemplate: async (data) => {
    return await request.post({ url: `/psd-template/update`, data, })
  },

  // 删除YiShe 模板
  deleteShopTemplate: async (data) => {
    return await request.delete({ url: `/psd-template/delete`,data })
  },
}
