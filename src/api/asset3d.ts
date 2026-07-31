/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-01-20 10:00:00
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-01-20 10:00:00
 * @FilePath: /yishe-admin/src/api/asset3d.ts
 * @Description: 3D资源模块 API
 */
import request from "@/config/axios";

export interface Asset3d {
  id: string;
  name: string;
  description?: string;
  url?: string;
  keywords?: string;
  thumbnail?: string;
  meta?: any;
  createTime: string;
  updateTime: string;
}

export interface SaveAsset3dDto {
  id?: string;
  name?: string;
  description?: string;
  url?: string;
  keywords?: string;
  thumbnail?: string;
  meta?: any;
}

export type CreateAsset3dDto = Omit<SaveAsset3dDto, "id">;
export type UpdateAsset3dDto = SaveAsset3dDto & { id: string };

export interface Asset3dPageParams {
  currentPage: number;
  pageSize: number;
  search?: string;
}

export function getAsset3dPage(data: Asset3dPageParams) {
  return request.post({
    url: "/asset-3d/page",
    data,
  });
}

export function getAsset3dById(id: string) {
  return request.get({
    url: `/asset-3d/${id}`,
  });
}

export function createAsset3d(data: CreateAsset3dDto) {
  return request.post({
    url: "/asset-3d/create",
    data,
  });
}

export function updateAsset3d(data: UpdateAsset3dDto) {
  return request.post({
    url: "/asset-3d/update",
    data,
  });
}

export function deleteAsset3d(id: string) {
  return request.post({
    url: "/asset-3d/delete",
    data: { id },
  });
}

export function batchDeleteAsset3d(ids: string[]) {
  return request.post({
    url: "/asset-3d/batch-delete",
    data: { ids },
  });
}

export function shareAsset3dToUser(data: { ids: string[]; targetUserId: number | string }) {
  return request.post({
    url: "/asset-3d/share-to-user",
    data,
  });
}

export function getAsset3dSharedRecords(id: string) {
  return request.get({
    url: `/asset-3d/${id}/shared-records`,
  });
}

export function copyAsset3dToUser(data: { ids: string[]; targetUserId: number | string }) {
  return request.post({
    url: "/asset-3d/copy-to-user",
    data,
  });
}

export function moveAsset3dToUser(data: { ids: string[]; targetUserId: number | string }) {
  return request.post({
    url: "/asset-3d/move-to-user",
    data,
  });
}
