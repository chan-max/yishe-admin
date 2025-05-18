import request from '@/config/axios'
import { toPromiseData } from '../mock'

/**
 * @标题模板
*/

export function getConfigTemplateList(data) {
  return request.post({ url: '/shop/gen-template/page', data })
}

export function addConfigTemplate(data) {
  return request.post({ url: '/shop/gen-template/create', data })
}

export function updateConfigTemplate(data) {
  return request.put({ url: '/shop/gen-template/update', data })
}

export function deleteConfigTemplate(data) {
  return request.delete({ url: `/shop/gen-template/delete`, data })
}