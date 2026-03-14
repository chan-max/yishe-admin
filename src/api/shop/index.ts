import request from '@/config/axios'

export interface Shop {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  carousel?: string[];
  createTime?: string;
  updateTime?: string;
}

export const getShopList = () => {
  return request.get({ url: '/operations/shop' })
}

export const getShopDetail = (id: number) => {
  return request.get({ url: `/operations/shop/${id}` })
}

export const createShop = (data: Partial<Shop>) => {
  return request.post({ url: '/operations/shop', data })
}

export const updateShop = (id: number, data: Partial<Shop>) => {
  return request.patch({ url: `/operations/shop/${id}`, data })
}

export const deleteShop = (id: number) => {
  return request.delete({ url: `/operations/shop/${id}` })
}

export const batchDeleteShop = (ids: number[]) => {
  return request.post({ url: '/operations/shop/batch-delete', data: { ids } })
}
