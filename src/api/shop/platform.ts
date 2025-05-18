import request from '@/config/axios'


// ERP 店铺所属平台 API
export const ShopPlatformApi = {
  // 查询ERP 店铺所属平台分页
  getShopPlatformPage: async (data: any) => {
    return await request.post({ url: `/shop/shop-platform/page`, data })
  },

  // 查询ERP 店铺所属平台详情
  getShopPlatform: async (id: number) => {
    return await request.get({ url: `/shop/shop-platform/get?id=` + id })
  },

  // 新增ERP 店铺所属平台
  createShopPlatform: async (data) => {
    return await request.post({ url: `/shop/shop-platform/create`, data })
  },

  // 修改ERP 店铺所属平台
  updateShopPlatform: async (data) => {
    return await request.put({ url: `/shop/shop-platform/update`, data })
  },

  // 删除ERP 店铺所属平台
  deleteShopPlatform: async (data) => {
    return await request.delete({ url: `/shop/shop-platform/delete`,data })
  },

  // 导出ERP 店铺所属平台 Excel
  exportShopPlatform: async (params) => {
    return await request.download({ url: `/shop/shop-platform/export-excel`, params })
  },
}
