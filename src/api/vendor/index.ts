import request from '@/config/axios'

export interface Vendor {
  id?: number
  name: string
  description?: string
  contactName?: string
  contactPhone?: string
  address?: string
  images?: string[]
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
