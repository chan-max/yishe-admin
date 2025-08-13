/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-05-19 05:55:18
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-05-26 08:26:17
 * @FilePath: /yishe-admin/src/api/fontTemplate/index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import request from '@/config/axios'

export const fontTemplateApi = {


  genImage: async (data: any) => {
    return await request.post({ url: `/font-template/gen-image`, data })
  },

  getFontTemplatePage: async (data: any) => {
    return await request.post({ url: `/font-template/page`, data })
  },

  // 查询YiShe 模板详情
  getShopTemplate: async (id: number) => {
    return await request.get({ url: `/shop/shop-template/get?id=` + id })
  },

  // 新增YiShe 模板
  createFontTemplate: async (data) => {
    return await request.post({
      url: `/font-template/create`, data, 
    })
  },

  // 修改YiShe 模板
  updateFontTemplate: async (data) => {
    return await request.post({ url: `/font-template/update`, data, })
  },

  // 删除YiShe 模板
  deleteShopTemplate: async (data) => {
    return await request.delete({ url: `/font-template/delete`,data })
  },

  // AI补全字体模板内容
  aiCompleteContent: async (id: string, prompt?: string) => {
    return await request.post({ 
      url: `/font-template/ai-complete/${id}`, 
      data: { prompt } 
    })
  },

  // 批量AI补全字体模板内容
  batchAiCompleteContent: async (data: { 
    ids: string[], 
    prompt?: string, 
    batchSize?: number 
  }) => {
    return await request.post({ 
      url: `/font-template/ai-complete-batch`, 
      data 
    })
  },

  // 生成字体模板缩略图
  generateThumbnail: async (id: string, data: {
    templateText?: string,
    options?: {
      fontSize?: number;
      textColor?: string;
    }
  }) => {
    return await request.post({ 
      url: `/font-template/generate-thumbnail/${id}`, 
      data 
    })
  },

  // 批量生成字体模板缩略图
  batchGenerateThumbnail: async (data: { 
    ids: string[], 
    templateText?: string,
    options?: {
      fontSize?: number;
      textColor?: string;
    },
    batchSize?: number
  }) => {
    return await request.post({ 
      url: `/font-template/batch-generate-thumbnails`, 
      data 
    })
  },
}
