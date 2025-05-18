import request from '@/config/axios'


// 获取 temu 分类列表
export const getTemuTemplateCategoryList = (params) => {
  return request.get({ url: '/publish/temp/category/list', params })
}

// 获取 temu 分类选择后的商品属性
export const getTemuTemplateGoodsAttr = (params) => {
  return request.get({ url: '/publish/temp/goods/attr', params })
}

// 获取 temu 尺码表
export const getTemuTemplateGoodsSize= (params) => {
  return request.get({ url: '/publish/temp/goods-size/info', params })
}


// 获取 temu 简化属性
export const getTemuTemplateInitCategory = (params) => {
  return request.get({ url: '/publish/temp/init/category', params })
}


// 获取 temu 父规格
export const getTemuTemplateParentSpec = (params?) => {
  return request.get({ url: '/publish/temp/getParentSpec', params })
}

// 获取 temu 产地
export const getTemuTemplateAreaCountries = (params?) => {
  return request.get({ url: '/publish/area/countries-list', params })
}



// 商品模板增删改查
export function getProductTemplateList(data) {
  return request.post({ url: '/publish/product/template/page', data })
}

export function addProductTemplate(data) {
  return request.post({ url: '/publish/product/template/create', data })
}

export function updateProductTemplate(data) {
  return request.put({ url: '/publish/product/template/update', data })
}

export function deleteProductTemplate(data) {
  return request.delete({ url: `/publish/product/template/delete`, data })
}

export function getProductTemplateDetail(params) {
  return request.get({ url: '/publish/product/template/detail', params })
}
