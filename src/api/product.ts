/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-04 23:00:38
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-04 23:01:59
 * @FilePath: /design-server/Users/jackie/workspace/yishe-admin/src/api/product.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import request from '@/config/axios'
export function getProductList(data) {
  return request.post({
    url: '/product/page',
    method: 'post',
    data,
  });
}

export function createProduct(data) {
  return request.post({
    url: '/product/create',
    method: 'post',
    data,
  });
}

export function updateProduct(data) {
  return request.post({
    url: '/product/update',
    method: 'post',
    data,
  });
}

export function deleteProduct(ids: string[]) {
  return request.post({
    url: '/product/delete',
    method: 'post',
    data: { ids },
  });
}

export function aiGenerateProductInfo(data: { id: string; prompt?: string }) {
  return request.post({
    url: '/product/ai-generate-info',
    method: 'post',
    data,
  });
}

export function generateProductCode(data: { id: string }) {
  return request.post({
    url: '/product/generate-code',
    method: 'post',
    data,
  });
}

export function copyImagesFromProductImage2D(data: { 
  id: string;
  watermark?: {
    enabled?: boolean;
    text?: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    fontSize?: number;
    fontSizePercent?: number;
    fontColor?: string;
    opacity?: number;
  };
  copyBasicInfo?: {
    enabled?: boolean;
    copyName?: boolean;
    copyDescription?: boolean;
    copyKeywords?: boolean;
  };
  imageOptions?: {
    replace?: boolean;
  };
}) {
  return request.post({
    url: '/product/copy-images-from-2d',
    method: 'post',
    data,
  });
}

export function copyImagesFromSticker(data: { 
  id: string;
  watermark?: {
    enabled?: boolean;
    text?: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    fontSize?: number;
    fontSizePercent?: number;
    fontColor?: string;
    opacity?: number;
  };
  copyBasicInfo?: {
    enabled?: boolean;
    copyName?: boolean;
    copyDescription?: boolean;
    copyKeywords?: boolean;
  };
  imageOptions?: {
    replace?: boolean;
  };
}) {
  return request.post({
    url: '/product/copy-images-from-sticker',
    method: 'post',
    data,
  });
}

export function copyImagesFromCustomModel(data: { 
  id: string;
  watermark?: {
    enabled?: boolean;
    text?: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    fontSize?: number;
    fontSizePercent?: number;
    fontColor?: string;
    opacity?: number;
  };
  copyBasicInfo?: {
    enabled?: boolean;
    copyName?: boolean;
    copyDescription?: boolean;
    copyKeywords?: boolean;
  };
  imageOptions?: {
    replace?: boolean;
  };
}) {
  return request.post({
    url: '/product/copy-images-from-custom-model',
    method: 'post',
    data,
  });
} 

export function generateProductVideo(data: {
  id: string;
  fps?: number;
  images?: string[];
  replace?: boolean;
  // ffmpeg 配置（后端会基于商品图片生成视频）
  ffmpeg?: {
    width?: number;
    height?: number;
    fps?: number;
    clipDuration?: number;
    transition?: 'none' | 'fade' | 'directional-left' | 'directional-right' | string;
    audioUrl?: string;
    loopAudio?: boolean;
    titleText?: string;
  };
  // 兼容字段（旧前端可能仍传 editly）
  editly?: any;
  // 兼容旧参数：duration 作为每张图片展示时长（秒）
  duration?: number;
  transition?: 'fade' | 'slide' | 'zoom' | 'none';
}) {
  return request.post({
    url: '/product/generate-video',
    method: 'post',
    data,
  });
}

// 导出社交媒体发布数据结构（GET）
export function getProductSocialMediaExport(id: string) {
  return request.get({
    url: `/product/social-media-export/${id}`,
    method: 'get',
  });
}