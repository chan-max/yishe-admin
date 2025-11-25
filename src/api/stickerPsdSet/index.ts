import request from '@/config/axios'

export const stickerPsdSetApi = {
  page: (data: any) => request.post({ url: '/sticker-psd-set/page', data }),
  create: (data: any) => request.post({ url: '/sticker-psd-set', data }),
  batchCreate: (data: any) => request.post({ url: '/sticker-psd-set/batch', data }),
  update: (id: string, data: any) => request.patch({ url: `/sticker-psd-set/${id}`, data }),
  updateStatus: (id: string, data: { status: string; statusMessage?: string }) =>
    request.post({ url: `/sticker-psd-set/${id}/status`, data }),
  remove: (id: string) => request.delete({ url: `/sticker-psd-set/${id}` }),
  removeBatch: (ids: string[]) => request.post({ url: `/sticker-psd-set/delete-batch`, data: { ids } })
}

