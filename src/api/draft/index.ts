import request from '@/config/axios'

/**
 * @api 获取草稿库资源
 */
export const getDraftList = async (data) => {
  return request.post({
    url: '/draft/page',
    data
  })
}

/**
 * 查看草稿图详情
 */
export function getDraftDetail(params) {
  return request.get({
    url: '/asset/draft-management/id',
    params
  })
}

/**
 * @api 删除草稿
 */
export function deleteDraft(ids) {
  return request.post({
    url: '/draft/delete',
    data: { ids }
  })
}

/**
 * @api 上传草稿
 */
export function uploadDraft(data) {
  return request.post({
    url: '/draft/upload',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * @api 更新草稿
 */
export function updateDraft(data) {
  return request.post({
    url: '/draft/update',
    data
  })
}

/**
 * @api 创建草稿
 */
export function createDraft(data) {
  return request.post({
    url: '/draft/create',
    data
  })
}

/**
 * @获取当前用户草稿最大序号
 */
export const getDraftMaxOrder = async (params) => {
  return request.get({
    url: '/asset/draft-management/imageNum',
    params
  })
}

/**
 * @批量下载草稿
 */
export function batchDownloadDraft(ids) {
  return request.post({
    url: '/draft/batch-download',
    data: { ids }
  })
}

/**
 * @草稿入库
 */
export function draftToMaterial(ids) {
  return request.post({
    url: '/draft/to-material',
    data: { ids }
  })
} 