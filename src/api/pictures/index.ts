import request from '@/config/axios'


// 套图发布
export function picturesPublish(data) {
  return request.post({ url: '/publish/upload/platform', data })
}
// 编辑套图
export function picturesUpdate(data) {
  return request.post({ url: '/material/', data })
}