import request from '@/config/axios'

export const stickerPsdSetApi = {
  page: (data: any) => request.post({ url: '/sticker-psd-set/page', data }),
  create: (data: any) => request.post({ url: '/sticker-psd-set', data }),
  batchCreate: (data: any) => request.post({ url: '/sticker-psd-set/batch', data }),
  update: (id: string, data: any) => request.patch({ url: `/sticker-psd-set/${id}`, data }),
  updateStatus: (id: string, data: { status: string; statusMessage?: string }) =>
    request.post({ url: `/sticker-psd-set/${id}/status`, data }),
  remove: (id: string) => request.delete({ url: `/sticker-psd-set/${id}` }),
  removeBatch: (ids: string[]) => request.post({ url: `/sticker-psd-set/delete-batch`, data: { ids } }),
  // 根据ID查询贴纸详情
  getStickerById: (id: string) => request.get({ url: `/sticker/${id}` }),
  // 开始制作（发送到客户端）
  startProduction: (id: string) => request.post({ url: `/sticker-psd-set/${id}/start-production` }),
  // 根据ID查询PSD模板详情
  getPsdTemplateById: (id: string) => request.get({ url: `/psd-template/${id}` })
}

