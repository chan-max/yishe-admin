import request from '@/config/axios'

// 获取剪辑素材列表
export function getClipMaterialList(params: any) {
  return request.post({
    url: '/clip-material/page',
    data: params
  })
}

// 创建剪辑素材
export function createClipMaterial(data: any) {
  return request.post({
    url: '/clip-material/create',
    data: data
  })
}

// 更新剪辑素材
export function updateClipMaterial(data: any) {
  return request.post({
    url: '/clip-material/update',
    data: data
  })
}

// 删除剪辑素材
export function deleteClipMaterial(data: { ids: string | string[] }) {
  return request.post({
    url: '/clip-material/delete',
    data: data
  })
}

// 获取单个剪辑素材
export function getClipMaterialById(id: string) {
  return request.get({
    url: `/clip-material/${id}`
  })
}

// 获取所有剪辑素材
export function getAllClipMaterials() {
  return request.get({
    url: '/clip-material'
  })
}

// 批量移动剪辑素材到文件夹
export function batchMoveClipMaterial(data: { ids: string[]; folderId: string | null }) {
  return request.post({
    url: '/clip-material/batch-move',
    data
  })
}
