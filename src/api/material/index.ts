import request from '@/config/axios'
import { getPaginationMockData, toPromiseData } from '../mock'

/**
 * @api 上传素材
 */

export function uploadMaterialFile(data) {
  return request.post({
    url: '/sticker/create',
    data
  })
}

/**
 * @api 上传素材
 */

export function uploadMaterial(data) {
  return request.post({
    url: '/picture/material/upload',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * @api 素材库爬虫配置
 */

export const getMaterialConfigApi = (params) => {
  // return toPromiseData({
  //   "crawlerWebsite": [
  //     {
  //       "label": "pinterest",
  //       "value": 1,
  //       "operation": {
  //         "searchContent": true,
  //         "downloadCount": true
  //       }
  //     },
  //     {
  //       "label": "deviantrat",
  //       "value": 2,
  //       "operation": {
  //         "searchContent": true,
  //         "downloadCount": false
  //       }
  //     },
  //     {
  //       "label": "pexels",
  //       "value": 3,
  //       "operation": {
  //         "searchContent": true,
  //         "downloadCount": false
  //       }
  //     },
  //     {
  //       "label": "alphacoders",
  //       "value": 4,
  //       "operation": {
  //         "searchContent": true,
  //         "downloadCount": false
  //       }
  //     }
  //   ],
  //   "hotSellers": []
  // })

  return request.get({ url: '/asset/material-management-reptile/getPictureParams', params })
}

export function getLabelList(params) {
  return getPaginationMockData(params)

  return request.get({ url: '/api/label', params })
}

export function addLabel(data) {
  return request.post({ url: '/api/label/insert', data })
}

export function editLabel(data) {
  return request.post({ url: '/api/label/update', data })
}

export function deleteLabel(data) {
  return request.post({ url: `/api/label/delete`, data })
}

/**
 * @api 获取素材库资源
 */

export const getMaterialList = async (data) => {
  return request.post({
    url: '/sticker/page',
    data
  })
}

/**
 * 查看素材图详情
 */

export function getMaterialDetail(params) {
  return request.get({
    url: '/asset/material-management/id',
    params
  })
}

export const deleteAssetLibrary = (data) => {
  return request.post({
    url: '/sticker/delete',
    data
  })
}

export const checkAssetLibrary = (params) => {
  return request.post({
    url: '/api/asset-library/checkByIdList',
    params
  })
}

export const pullAsset = (data) => {
  return request.post({
    url: '/asset/material-management-reptile/pull',
    data
  })
}

export const handleDropMaterial = (data) => {
  return request.post({
    url: '/asset/material-management/deprecated',
    data
  })
}

/**
 * @genpictures
 */

// 创建套图
export function materialCreatePictures(data) {
  return request.post({ url: '/publish/product/asset/generator', data })
}

// 素材分配店铺
export function materialDistribute(data) {
  return request.put({ url: '/asset/material-management/updateList', data })
}

/**
 * @素材池相关
 */
// 获取素材池分页
export const getMaterialRawList = async (data) => {
  return request.post({
    url: '/asset/material-management-reptile/page',
    data
  })
}

/**
 * @获取爬虫状态
 */
export const getCrawlingStatus = async () => {
  return request.get({
    url: '/asset/material-management-reptile/task-status'
  })
}

// 删除素材池
export const deleteMaterialRaw = async (data) => {
  return request.post({
    url: '/asset/material-management-reptile/delete',
    data
  })
}

// 素材入库
export const storageMaterialRaw = async (data) => {
  return request.post({
    url: '/asset/material-management-reptile/batch-storage',
    data
  })
}

/**
 * @获取当前用户素材最大序号
 */

export const getMaterialMaxOrder = async (params) => {
  return request.get({
    url: '/asset/material-management/imageNum',
    params
  })
}

/**
 * AI自动生成素材内容
 */
export function aiAutoGenerateMaterialInfo(data) {
  return request.post({
    url: '/sticker/ai-generate-info',
    data
  })
}

/**
 * 生成图片信息（宽高、文件大小、色系）
 */
export function generateImageInfo(data) {
  return request.post({
    url: '/sticker/generate-image-info',
    data
  })
}

/**
 * 生成唯一素材编码
 */
export function generateStickerCode(data?: { prefix?: string }) {
  return request.post({
    url: '/sticker/generate-code',
    data: data || {}
  })
}

/**
 * 编辑素材信息
 */
export function updateAssetLibrary(data) {
  return request.post({
    url: '/sticker/update',
    data
  })
}

/**
 * @api 爬图素材相关
 */

// 分页获取爬图素材
export const getCrawlerMaterialPage = (data) => {
  return request.post({
    url: '/crawler/material/page',
    data
  })
}

// 获取单个素材
export const getCrawlerMaterial = (params) => {
  return request.get({
    url: '/crawler/material',
    params
  })
}

// 更新素材
export const updateCrawlerMaterial = (data) => {
  return request.post({
    url: '/crawler/material/update',
    data
  })
}

// 删除素材
export const deleteCrawlerMaterial = (data) => {
  return request.post({
    url: '/crawler/material/delete',
    data
  })
}

/**
 * 计算图片感知哈希
 */
export function calculatePhash(data) {
  return request.post({
    url: '/sticker/phash',
    data
  })
}

// 已移除：AI判断侵权功能已整合到 ai-generate-info 接口中
// /**
//  * AI判断贴纸是否侵权
//  */
// export function aiJudgeInfringement(data) {
//   return request.post({
//     url: '/sticker/ai-judge-infringement',
//     data
//   })
// }

/**
 * 根据ID查询单个贴纸详情
 */
export function getStickerById(id) {
  return request.post({
    url: `/sticker/page`,
    data: {
      id: id,
      currentPage: 1,
      pageSize: 1
    }
  })
}

/**
 * 复制素材（贴纸）
 */
export function copyStickers(data: { ids: string[] | string }) {
  return request.post({
    url: '/sticker/copy',
    data
  })
}

/**
 * 生成无空白PNG（仅支持 PNG 后缀）
 */
export function trimPng(data: { id: string, threshold?: number }) {
  return request.post({
    url: '/sticker/trim-png',
    data
  })
}

/**
 * @api SVG转PNG
 */
export function svgToPng(data: { id: string, width?: number, height?: number }) {
  return request.post({
    url: '/sticker/svg-to-png',
    data
  })
}

/**
 * 文件夹相关 API
 */

// 获取文件夹树
export function getStickerFolderTree(params?: { parentId?: string; folderCategory?: string }) {
  return request.get({
    url: '/sticker/sticker-folder/tree',
    params
  })
}

// 获取文件夹列表（扁平结构）
export function getStickerFolderList(params?: { folderCategory?: string }) {
  return request.get({
    url: '/sticker/sticker-folder/list',
    params
  })
}

// 创建文件夹
export function createStickerFolder(data: { name: string; parentId?: string | null; folderCategory?: string }) {
  return request.post({
    url: '/sticker/sticker-folder/create',
    data
  })
}

// 重命名文件夹
export function renameStickerFolder(data: { id: string; name: string; folderCategory?: string }) {
  return request.post({
    url: '/sticker/sticker-folder/rename',
    data
  })
}

// 删除文件夹
export function deleteStickerFolder(
  id: string,
  moveStickersToRoot: boolean = true,
  params?: { folderCategory?: string }
) {
  return request.delete({
    url: `/sticker/sticker-folder/${id}`,
    params: { moveStickersToRoot, ...(params || {}) }
  })
}

// 移动文件夹
export function moveStickerFolder(data: { id: string; parentId: string | null; folderCategory?: string }) {
  return request.post({
    url: '/sticker/sticker-folder/move',
    data
  })
}

// 批量移动素材到文件夹
export function batchMoveStickers(data: { ids: string[]; folderId: string | null }) {
  return request.post({
    url: '/sticker/batch-move',
    data
  })
}
