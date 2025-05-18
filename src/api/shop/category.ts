import request from '@/config/axios'

// ERP 店铺 API
export const ShopCategoryApi = {
  // 查询ERP 店铺分页
  getShopCategoryPage: async (data: any) => {
    return await request.post({ url: `/shop/shop-category/page`, data })
  },

  // 查询ERP 店铺详情
  getShopCategory: async (id: number) => {
    return await request.get({ url: `/shop/shop-category/get?id=` + id })
  },

  // 新增ERP 店铺
  createShopCategory: async (data) => {
    return await request.post({ url: `/shop/shop-category/create`, data })
  },

  // 修改ERP 店铺
  updateShopCategory: async (data) => {
    return await request.put({ url: `/shop/shop-category/update`, data })
  },

  // 删除ERP 店铺
  deleteShopCategory: async (data) => {
    return await request.delete({ url: `/shop/shop-category/delete`, data })
  },

  // 导出ERP 店铺 Excel
  exportShopCategory: async (params) => {
    return await request.download({ url: `/shop/shop-category/export-excel`, params })
  },
}
