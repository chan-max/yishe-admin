import request from '@/config/axios'
import { getPaginationMockData, toPromiseData } from '../mock';

export const getAutoPublishList = (data) => {
  // return getPaginationMockData(params)
  return request.post({ url: '/publish/product/list', data })
}


export const addAutoPublish = (data) => {
  return request.post({ url: '/publish/product/add', data })
}

export const updateAutoPublish = (data) => {
  return request.put({ url: '/publish/product/update', data })
}

export const updateMaterial = (data) => {
  return request.post({ url: '/api/ps-pic/upload-material', data })
}

export const updateAndPublish = (data) => {
  return request.post({ url: '/api/auto-publish/uploadAndPush', data })
}

export const updatePsTemplate = (data) => {
  return request.post({ url: '/picture/material/update-template', data })
}

export const getPsTemplates = (data) => {
  return request.get({ url: '/picture/material/templates', data })
}

export const getPsTemplatesName = (data) => {
  return request.post({ url: '/picture/material/templatesName', data })
}

// 制作套图
export const psSetOfImages = (data) => {
  return request.post({ url: '/picture/image/make', data })
}

export const deleteAutoPublish = (data) => {
  return request.post({
    url: '/publish/product/delete'
    , data
  })
}

/**
 * @标题模板
*/

export function getTitleTemplateList(data) {
  return request.post({ url: '/shop/title-template/page', data })
}

export function addTitleTemplate(data) {
  return request.post({ url: '/shop/title-template/create', data })
}

export function editTitleTemplate(data) {
  return request.put({ url: '/shop/title-template/update', data })
}

export function deleteTitleTemplate(data) {
  return request.delete({ url: `/shop/title-template/delete`, data })
}


/**
 * @发布模板
*/


export function getPublishTemplateList(data) {
  return request.post({ url: '/publish/template/page', data })
}

export function addPublishTemplate(data) {
  return request.post({ url: '/publish/template/create', data })
}

export function editPublishTemplate(data) {
  return request.put({ url: '/publish/template/update', data })
}

export function deletePublishTemplate(data) {
  return request.post({ url: `/publish/template/delete`, data })
}



/**
 * 重新制作标题和套图
*/ 

export function remakeTitleApi(data) {
  return request.post({ url: `/publish/product/asset/make-title`, data })
}

export function remakePictureApi(data) {
  return request.post({ url: `/publish/product/asset/make-image`, data })
}