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
  return request.get({ url: '/shop' })
}

// Get Shop Detail
export const getShopDetail = (id: number) => {
  return request.get({ url: `/shop/${id}` })
}

// Create Shop
export const createShop = (data: Partial<Shop>) => {
  return request.post({ url: '/shop', data })
}

// Update Shop
export const updateShop = (id: number, data: Partial<Shop>) => {
  return request.patch({ url: `/shop/${id}`, data })
}

// Delete Shop
export const deleteShop = (id: number) => {
  return request.delete({ url: `/shop/${id}` })
}