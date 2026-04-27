import request from '@/config/axios'

export interface Vendor {
  id?: number
  code?: string
  name: string
  description?: string
  contactName?: string
  contactPhone?: string
  address?: string
  images?: string[]
  products?: VendorProductItem[]
  createTime?: string
  updateTime?: string
}

export interface VendorProductItem {
  id?: number
  code?: string | null
  vendorId?: number
  name: string
  model?: string
  size?: string
  productSize?: string
  packageSize?: string
  price?: number | null
  images?: string[]
  unit?: string
  remark?: string
  vendor?: Vendor
  createTime?: string
  updateTime?: string
}

export const getVendorList = () => request.get({ url: '/operations/vendor' })

export const getVendorDetail = (id: number) => request.get({ url: `/operations/vendor/${id}` })

export const createVendor = (data: Vendor) => request.post({ url: '/operations/vendor', data })

export const updateVendor = (id: number, data: Vendor) =>
  request.patch({ url: `/operations/vendor/${id}`, data })

export const deleteVendor = (id: number) => request.delete({ url: `/operations/vendor/${id}` })

export const batchDeleteVendor = (ids: number[]) =>
  request.post({ url: '/operations/vendor/batch-delete', data: { ids } })

export const getVendorProductList = () => request.get({ url: '/operations/vendor/products/list' })

export const getVendorProductsByVendor = (vendorId: number) =>
  request.get({ url: `/operations/vendor/${vendorId}/products` })

export const createVendorProduct = (data: VendorProductItem) =>
  request.post({ url: '/operations/vendor/products', data })

export const updateVendorProduct = (id: number, data: VendorProductItem) =>
  request.patch({ url: `/operations/vendor/products/${id}`, data })

export const deleteVendorProduct = (id: number) =>
  request.delete({ url: `/operations/vendor/products/${id}` })

export const batchDeleteVendorProduct = (ids: number[]) =>
  request.post({ url: '/operations/vendor/products/batch-delete', data: { ids } })
