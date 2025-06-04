/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-04 23:00:38
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-04 23:01:59
 * @FilePath: /design-server/Users/jackie/workspace/yishe-admin/src/api/product.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import request from '@/config/axios'
export function getProductList(data) {
  return request.post({
    url: '/product/page',
    method: 'post',
    data,
  });
}

export function createProduct(data) {
  return request.post({
    url: '/product/create',
    method: 'post',
    data,
  });
}

export function updateProduct(data) {
  return request.post({
    url: '/product/update',
    method: 'post',
    data,
  });
}

export function deleteProduct(ids: string[]) {
  return request.post({
    url: '/product/delete',
    method: 'post',
    data: { ids },
  });
} 