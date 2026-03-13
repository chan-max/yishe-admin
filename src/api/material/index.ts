import request from '@/config/axios'
import { getPaginationMockData, toPromiseData } from '../mock'

/**
 * Upload material
 */

export function uploadMaterialFile(data) {
  return request.post({
    url: '/sticker/create',
    data
  })
}

/**
 * Upload material
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
 * Get crawler config
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
 * Get material list
 */

export const getMaterialList = async (data) => {
  return request.post({
    url: '/sticker/page',
    data
  })
}

/**
 * Get material detail
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

// Create picture set
export function materialCreatePictures(data) {
  return request.post({ url: '/publish/product/asset/generator', data })
}

// Distribute materials to shops
export function materialDistribute(data) {
  return request.put({ url: '/asset/material-management/updateList', data })
}

/**
 * Material pool APIs
 */
// Get material pool page
export const getMaterialRawList = async (data) => {
  return request.post({
    url: '/asset/material-management-reptile/page',
    data
  })
}

/**
 * Get crawler task status
 */
export const getCrawlingStatus = async () => {
  return request.get({
    url: '/asset/material-management-reptile/task-status'
  })
}

// Delete raw materials
export const deleteMaterialRaw = async (data) => {
  return request.post({
    url: '/asset/material-management-reptile/delete',
    data
  })
}

// Store raw materials
export const storageMaterialRaw = async (data) => {
  return request.post({
    url: '/asset/material-management-reptile/batch-storage',
    data
  })
}

/**
 * Get current user's max material order
 */

export const getMaterialMaxOrder = async (params) => {
  return request.get({
    url: '/asset/material-management/imageNum',
    params
  })
}

/**
 * AI generate material info
 */
export function aiAutoGenerateMaterialInfo(data) {
  return request.post({
    url: '/sticker/ai-generate-info',
    data
  })
}

/**
 * Generate image metadata (size, file size, color)
 */
export function generateImageInfo(data) {
  return request.post({
    url: '/sticker/generate-image-info',
    data
  })
}

/**
 * Generate unique sticker code
 */
export function generateStickerCode(data?: { prefix?: string }) {
  return request.post({
    url: '/sticker/generate-code',
    data: data || {}
  })
}

/**
 * Update material info
 */
export function updateAssetLibrary(data) {
  return request.post({
    url: '/sticker/update',
    data
  })
}

/**
 * Crawler material APIs
 */

// Get crawler material page
export const getCrawlerMaterialPage = (data) => {
  return request.post({
    url: '/crawler/material/page',
    data
  })
}

// Get single crawler material
export const getCrawlerMaterial = (params) => {
  return request.get({
    url: '/crawler/material',
    params
  })
}

// Update crawler material
export const updateCrawlerMaterial = (data) => {
  return request.post({
    url: '/crawler/material/update',
    data
  })
}

// Delete crawler material
export const deleteCrawlerMaterial = (data) => {
  return request.post({
    url: '/crawler/material/delete',
    data
  })
}

/**
 * Calculate image perceptual hash
 */
export function calculatePhash(data) {
  return request.post({
    url: '/sticker/phash',
    data
  })
}

// Removed: AI infringement check was merged into the ai-generate-info API
// /**
//  * AI check whether the sticker is infringing
//  */
// export function aiJudgeInfringement(data) {
//   return request.post({
//     url: '/sticker/ai-judge-infringement',
//     data
//   })
// }

/**
 * Get sticker detail by id
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
 * Copy stickers
 */
export function copyStickers(data: { ids: string[] | string }) {
  return request.post({
    url: '/sticker/copy',
    data
  })
}

/**
 * Trim transparent PNG borders (PNG only)
 */
export function trimPng(data: { id: string, threshold?: number }) {
  return request.post({
    url: '/sticker/trim-png',
    data
  })
}

/**
 * Convert SVG to PNG
 */
export function svgToPng(data: { id: string, width?: number, height?: number }) {
  return request.post({
    url: '/sticker/svg-to-png',
    data
  })
}

/**
 * Sticker folder APIs
 */

// Get sticker folder tree
export function getStickerFolderTree(params?: { parentId?: string; folderCategory?: string }) {
  return request.get({
    url: '/sticker/sticker-folder/tree',
    params
  })
}

// Get sticker folder list (flat)
export function getStickerFolderList(params?: { folderCategory?: string }) {
  return request.get({
    url: '/sticker/sticker-folder/list',
    params
  })
}

// Create sticker folder
export function createStickerFolder(data: { name: string; parentId?: string | null; folderCategory?: string }) {
  return request.post({
    url: '/sticker/sticker-folder/create',
    data
  })
}

// Rename sticker folder
export function renameStickerFolder(data: { id: string; name: string; folderCategory?: string }) {
  return request.post({
    url: '/sticker/sticker-folder/rename',
    data
  })
}

// Delete sticker folder
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

// Move sticker folder
export function moveStickerFolder(data: { id: string; parentId: string | null; folderCategory?: string }) {
  return request.post({
    url: '/sticker/sticker-folder/move',
    data
  })
}

// Batch move stickers to folder
export function batchMoveStickers(data: { ids: string[]; folderId: string | null }) {
  return request.post({
    url: '/sticker/batch-move',
    data
  })
}

export interface GenerateStickerStoryScriptDto {
  stickerId: string
  sceneType?: string
  stylePrompt?: string
  tonePrompt?: string
  lengthPrompt?: string
  extraPrompt?: string
}

export function generateStickerStoryScript(data: GenerateStickerStoryScriptDto) {
  return request.post({
    url: '/sticker/story-script/generate',
    data
  })
}

export function getStickerStoryScriptList(params: { stickerId: string }) {
  return request.get({
    url: '/sticker/story-script/list',
    params
  })
}

export function getStickerStoryScriptPage(params: {
  currentPage?: number
  pageSize?: number
  stickerId?: string
  keyword?: string
  sceneType?: string
}) {
  return request.get({
    url: '/sticker/story-script/page',
    params
  })
}

export function deleteStickerStoryScript(id: string) {
  return request.delete({
    url: `/sticker/story-script/${id}`
  })
}
export function batchDeleteStickerStoryScript(ids: string[]) {
  return request.post({
    url: '/sticker/story-script/batch-delete',
    data: { ids }
  })
}
export function getStickerStoryScriptDetail(id: string) {
  return request.get({
    url: `/sticker/story-script/${id}`
  })
}

