import request from '@/config/axios'

// ERP 店铺 API
export const ShopApi = {
  // 查询ERP 店铺分页
  getShopPage: async (data: any) => {
    return await request.post({ url: `/shop/page`, data })
  },

  // 查询ERP 店铺详情
  getShop: async (id: number) => {
    return await request.get({ url: `/shop/get?id=` + id })
  },

  // 新增ERP 店铺
  createShop: async (data) => {
    return await request.post({ url: `/shop/create`, data })
  },

  // 修改ERP 店铺
  updateShop: async (data) => {
    return await request.put({ url: `/shop/update`, data })
  },

  // 删除ERP 店铺
  deleteShop: async (data) => {
    return await request.delete({ url: `/shop/delete`, data })
  },

  // 导出ERP 店铺 Excel
  exportShop: async (params) => {
    return await request.download({ url: `/shop/export-excel`, params })
  },
}
