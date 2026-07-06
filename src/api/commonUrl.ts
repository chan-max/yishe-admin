/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-01-20 10:00:00
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-01-20 10:00:00
 * @FilePath: /yishe-admin/src/api/commonUrl.ts
 * @Description: 常用网址模块 API
 */
import request from '@/config/axios'

export interface CommonUrl {
  id: string
  name: string
  url: string
  description?: string
  keywords?: string
  category?: string
  icon?: string
  sort?: number
  isActive?: boolean
  folderId?: string | null
  userId?: string
  user?: {
    id: string
    name: string
  }
  createTime: string
  updateTime: string
}

export interface CreateCommonUrlDto {
  name: string
  url: string
  description?: string
  keywords?: string
  category?: string
  icon?: string
  sort?: number
  isActive?: boolean
  userId?: string
}

export interface UpdateCommonUrlDto {
  name?: string
  url?: string
  description?: string
  keywords?: string
  category?: string
  icon?: string
  sort?: number
  isActive?: boolean
  userId?: string
}

export interface CommonUrlPageParams {
  page: number
  pageSize: number
  folderId?: string | null
}

export function getCommonUrlList(data: CommonUrlPageParams) {
  return request.post({
    url: '/common-url/page',
    data,
  });
}

export function createCommonUrl(data: CreateCommonUrlDto) {
  return request.post({
    url: '/common-url',
    data,
  });
}

export function updateCommonUrl(id: string, data: UpdateCommonUrlDto) {
  return request.post({
    url: `/common-url/${id}`,
    method: 'patch',
    data,
  });
}

export function deleteCommonUrl(id: string) {
  return request.delete({
    url: `/common-url/${id}`,
  });
}

export function getCommonUrlById(id: string) {
  return request.get({
    url: `/common-url/${id}`,
  });
}

export function getCommonUrlByUser(userId: string, data: CommonUrlPageParams) {
  return request.get({
    url: `/common-url/user/${userId}`,
    params: data,
  });
}

export function getCommonUrlByCategory(category: string, data: CommonUrlPageParams) {
  return request.get({
    url: `/common-url/category/${category}`,
    params: data,
  });
}

export function batchMoveCommonUrl(data: { ids: string[]; folderId: string | null }) {
  return request.post({
    url: '/common-url/batch-move',
    data,
  });
}
