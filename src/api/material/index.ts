import request from '@/config/axios'
import { getPaginationMockData, toPromiseData } from '../mock';


/**
 * @api 上传素材
*/

export function uploadMaterialFile(data) {
  return request.post({
    url: '/sticker/create',
    data,
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
      'Content-Type': 'multipart/form-data',
    },
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
    url: '/sticker/page'
    , data
  })
}

/**
 * 查看素材图详情
*/

export function getMaterialDetail(params) {
  return request.get({
    url: '/asset/material-management/id'
    ,
    params
  })
}

export const deleteAssetLibrary = (data) => {
  return request.post({
    url: '/asset/material-management/delete'
    , data
  })
}

export const checkAssetLibrary = (params) => {
  return request.post({
    url: '/api/asset-library/checkByIdList'
    , params
  })
}

export const pullAsset = (data) => {
  return request.post({
    url: '/asset/material-management-reptile/pull'
    , data
  })
}


export const handleDropMaterial = (data) => {
  return request.post({
    url: '/asset/material-management/deprecated'
    , data
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
    url: '/asset/material-management-reptile/page'
    , data
  })
}

/**
 * @获取爬虫状态
*/
export const getCrawlingStatus = async () => {
  return request.get({
    url: '/asset/material-management-reptile/task-status'
    ,
  })
}


// 删除素材池
export const deleteMaterialRaw = async (data) => {
  return request.post({
    url: '/asset/material-management-reptile/delete'
    , data
  })
}

// 素材入库
export const storageMaterialRaw = async (data) => {
  return request.post({
    url: '/asset/material-management-reptile/batch-storage'
    , data
  })
}


/**
 * @获取当前用户素材最大序号
*/

export const getMaterialMaxOrder = async (params) => {
  return request.get({
    url: '/asset/material-management/imageNum'
    , params
  })
}
