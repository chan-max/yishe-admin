/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-01-20 10:00:00
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-01-20 10:00:00
 * @FilePath: /yishe-admin/src/api/designRequest.ts
 * @Description: 设计请求模块 API
 */
import request from '@/config/axios'

export interface DesignRequest {
  id: string
  name: string
  description?: string
  phoneNumber?: string
  email?: string
  userId?: string
  user?: {
    id: string
    name: string
  }
  createTime: string
  updateTime: string
}

export interface CreateDesignRequestDto {
  name: string
  description?: string
  phoneNumber?: string
  email?: string
  userId?: string
}

export interface UpdateDesignRequestDto {
  name?: string
  description?: string
  phoneNumber?: string
  email?: string
  userId?: string
}

export interface DesignRequestPageParams {
  page: number
  pageSize: number
}

export function getDesignRequestList(data: DesignRequestPageParams) {
  return request.post({
    url: '/design-request/page',
    data,
  });
}

export function createDesignRequest(data: CreateDesignRequestDto) {
  return request.post({
    url: '/design-request',
    data,
  });
}

export function updateDesignRequest(id: string, data: UpdateDesignRequestDto) {
  return request.post({
    url: `/design-request/${id}`,
    method: 'patch',
    data,
  });
}

export function deleteDesignRequest(id: string) {
  return request.delete({
    url: `/design-request/${id}`,
  });
}

export function getDesignRequestById(id: string) {
  return request.get({
    url: `/design-request/${id}`,
  });
}

export function getDesignRequestByUser(userId: string, data: DesignRequestPageParams) {
  return request.get({
    url: `/design-request/user/${userId}`,
    params: data,
  });
} 