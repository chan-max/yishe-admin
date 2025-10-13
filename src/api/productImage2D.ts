import request from '@/config/axios'

export function createProductImage2D(data: { materialId: string; templateGroup2DId: string }) {
  return request.post({ url: '/product-image-2d', data })
}

export function batchCreateProductImage2D(data: { materialIds: string[]; templateGroup2DId: string }) {
  return request.post({ url: '/product-image-2d/batch', data })
}


