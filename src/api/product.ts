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

export function updatePublishStatus(data: { id: string; isPublish: boolean }) {
  return request.post({
    url: '/product/updatePublish',
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

export function generateProductVideo(data: {
  id: string;
  replace?: boolean;
  // 直接传递 yishe-videos 格式的参数（音频已包含在 resources 中）
  resources: Array<{
    type: 'image' | 'video' | 'audio';
    url: string;
    duration?: number;
    transition?: 'none' | 'fade' | 'directional-left' | 'directional-right' | string;
    transitionDuration?: number;
    position?: string;
    scaleMode?: 'fit' | 'fill' | 'crop';
    startTime?: number;
    volume?: number;
  }>;
  options: {
    width?: number;
    height?: number;
    fps?: number;
    videoCodec?: string;
    audioCodec?: string;
    backgroundColor?: string;
    videoPreset?: string;
    videoCrf?: number;
    videoBitrate?: string;
    audioBitrate?: string;
    audioSampleRate?: number;
    audioChannels?: number;
  };
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