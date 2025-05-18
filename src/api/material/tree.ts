import request from '@/config/axios'

export const MaterialCategoryApi = {
  getMaterialCategoryPage: async (data: any) => {
    return await request.post({ url: `/asset/material-classification/list`, data })
  },

  getMaterialCategory: async (id: number) => {
    return await request.get({ url: `/shop-category/get?id=` + id })
  },

  createMaterialCategory: async (data) => {
    return await request.post({ url: `/asset/material-classification/create`, data })
  },

  updateMaterialCategory: async (data) => {
    return await request.put({ url: `/asset/material-classification/update`, data })
  },

  deleteMaterialCategory: async (data) => {
    return await request.post({ url: `/asset/material-classification/delete`, data })
  },
  exportMaterialCategory: async (params) => {
    return await request.download({ url: `/shop-category/export-excel`, params })
  },
}
