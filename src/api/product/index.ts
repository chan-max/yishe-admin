import request from '@/config/axios'

// 商品 VO
export interface ProductVO {
  id: string
  name: string
  description: string
  type: string
  images: string
  price: number
  salePrice: number
  stock: number
  specifications: string
  tags: string
  isActive: boolean
  createTime: Date
  updateTime: Date
}

// 创建商品
export const createProduct = (data: ProductVO) => {
  return request.post({
    url: '/product/create',
    data
  })
}

// 获取商品列表
export const getProductList = (data) => {
  return request.post({
    url: '/product/page',
    data
  })
}

// 获取商品详情
export const getProduct = (id: string) => {
  return request.get({
    url: `/product/${id}`
  })
}

// 更新商品
export const updateProduct = (data: ProductVO) => {
  return request.post({
    url: '/product/update',
    data
  })
}

// 删除商品
export const deleteProduct = (id: string) => {
  return request.post({
    url: '/product/delete',
    data: { id }
  })
}
