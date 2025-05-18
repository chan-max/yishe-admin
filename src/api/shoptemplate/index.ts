import request from '@/config/axios'


// ERP 模板 API
export const ShopTemplateApi = {
  // 查询ERP 模板分页
  getShopTemplatePage: async (data: any) => {
    return await request.post({ url: `/shop/shop-template/page`, data })
  },

  // 查询ERP 模板详情
  getShopTemplate: async (id: number) => {
    return await request.get({ url: `/shop/shop-template/get?id=` + id })
  },

  // 新增ERP 模板
  createShopTemplate: async (data) => {
    return await request.post({
      url: `/shop/shop-template/create`, data, 
      // headers: {
      //   'Content-Type': 'multipart/form-data',
      // },
    })
  },

  // 修改ERP 模板
  updateShopTemplate: async (data) => {
    return await request.put({ url: `/shop/shop-template/update`, data })
  },

  // 删除ERP 模板
  deleteShopTemplate: async (data) => {
    return await request.delete({ url: `/shop/shop-template/delete`,data })
  },

  // 导出ERP 模板 Excel
  exportShopTemplate: async (params) => {
    return await request.download({ url: `/shop/shop-template/export-excel`, params })
  },
}
