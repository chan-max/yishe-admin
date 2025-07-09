/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-01-20 10:00:00
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-01-20 10:00:00
 * @FilePath: /yishe-admin/src/api/productModel.ts
 * @Description: 商品模型模块 API
 */
import request from '@/config/axios'

export interface ProductModel {
  id: string
  name: string
  description?: string
  price?: string
  url?: string
  keywords?: string
  ref_count?: number
  like_count?: number
  save_count?: number
  link_count?: number
  thumbnail?: string
  meta?: any
  createTime: string
  updateTime: string
}

export interface UpdateProductModelDto {
  id: string
  name?: string
  description?: string
  price?: string
  url?: string
  keywords?: string
  thumbnail?: string
  meta?: any
}

export interface ProductModelPageParams {
  currentPage: number
  pageSize: number
  search?: string
}

export function getProductModelPage(data: ProductModelPageParams) {
  return request.post({
    url: '/product-model/page',
    data,
  });
}

export function getProductModelById(id: string) {
  return request.get({
    url: `/product-model/${id}`,
  });
}

export function updateProductModel(data: UpdateProductModelDto) {
  return request.post({
    url: '/product-model/update',
    data,
  });
}

export function deleteProductModel(id: string) {
  return request.post({
    url: '/product-model/delete',
    data: { id },
  });
} 