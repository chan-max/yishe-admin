import request from '@/config/axios'

export interface Shop {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  carousel?: string[]; // JSON string or array depending on backend response, assuming array here if handled
  createTime?: string;
  updateTime?: string;
}

// Get Shop List
export const getShopList = () => {
  return request.get({ url: '/operations/shop' })
}

// Get Shop Detail
export const getShopDetail = (id: number) => {
  return request.get({ url: `/operations/shop/${id}` })
}

// Create Shop
export const createShop = (data: Partial<Shop>) => {
  return request.post({ url: '/operations/shop', data })
}

// Update Shop
export const updateShop = (id: number, data: Partial<Shop>) => {
  return request.patch({ url: `/operations/shop/${id}`, data })
}

// Delete Shop
export const deleteShop = (id: number) => {
  return request.delete({ url: `/operations/shop/${id}` })
}