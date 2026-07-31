import request from '@/config/axios'

export function getFileResourceList(params: any) {
  return request.post({
    url: '/file-resource/page',
    data: params
  })
}

export function createFileResource(data: any) {
  return request.post({
    url: '/file-resource/create',
    data
  })
}

export function updateFileResource(data: any) {
  return request.post({
    url: '/file-resource/update',
    data
  })
}

export function deleteFileResource(data: { ids: string | string[] }) {
  return request.post({
    url: '/file-resource/delete',
    data
  })
}

export function getFileResourceById(id: string) {
  return request.get({
    url: `/file-resource/${id}`
  })
}

export function getAllFileResources() {
  return request.get({
    url: '/file-resource'
  })
}

export function batchMoveFileResource(data: { ids: string[]; folderId: string | null }) {
  return request.post({
    url: '/file-resource/batch-move',
    data
  })
}

export function copyFileResourceToUser(data: { ids: string[] | string; targetUserId: string }) {
  return request.post({
    url: '/file-resource/copy-to-user',
    data
  })
}

export function shareFileResourceToUser(data: { ids: string[] | string; targetUserId: string }) {
  return request.post({
    url: '/file-resource/share-to-user',
    data
  })
}

export function getFileResourceSharedRecords(id: string) {
  return request.get({
    url: `/file-resource/${id}/shared-records`
  })
}

export function moveFileResourceToUser(data: { ids: string[] | string; targetUserId: string }) {
  return request.post({
    url: '/file-resource/move-to-user',
    data
  })
}
