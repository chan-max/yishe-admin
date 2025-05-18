import request from '@/config/axios'
import { getPaginationMockData } from '../mock'
import { getAutoPublishList } from '../publish'

/**
 * @店铺 类目管理
*/

export function getShopProductCategoryList(params) {

  return getPaginationMockData(params)

  return request.get({ url: '/api/label', params })
}

export function addShopProductCategory(data) {
  return request.post({ url: '/api/label/insert', data })
}

export function deleteShopProductCategory(data) {
  return request.post({ url: `/api/label/delete`, data })
}

export function editShopProductCategory(data) {
  return request.post({ url: `/api/label/delete`, data })
}

/**
 * @店铺 店铺管理
*/


export function getShopList(params) {
  return getPaginationMockData(params)
  return request.get({ url: '/api/label', params })
}



/**
 * @店铺 类目管理
*/

export function getPsdTemplateList(params) {

  return getAutoPublishList(params)

  return request.get({ url: '/api/label', params })
}

export function addPsdTemplate(data) {
  return request.post({ url: '/api/label/insert', data })
}

export function deletePsdTemplate(data) {
  return request.post({ url: `/api/label/delete`, data })
}

export function editPsdTemplate(data) {
  return request.post({ url: `/api/label/delete`, data })
}


/**
 * @平台
*/

export function getShopPlatformList(params) {

  return getPaginationMockData(params)

  return request.get({ url: '/api/label', params })
}

export function addShopPlatformList(data) {
  return request.post({ url: '/api/label/insert', data })
}

export function deleteShopPlatformList(data) {
  return request.post({ url: `/api/label/delete`, data })
}

export function editShopPlatformList(data) {
  return request.post({ url: `/api/label/delete`, data })
}