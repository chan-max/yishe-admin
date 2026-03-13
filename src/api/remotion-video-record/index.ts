import request from '@/config/axios'

export function getRemotionTemplateList() {
  return request.get({
    url: '/remotion-video-record/templates'
  })
}

export function generateRemotionVideoRecord(data: {
  templateId: string
  title?: string
  timeoutMs?: number
  inputProps?: Record<string, any>
}) {
  return request.post({
    url: '/remotion-video-record/generate',
    data
  })
}

export function getRemotionVideoRecordPage(params: {
  currentPage?: number
  pageSize?: number
  keyword?: string
  status?: string
}) {
  return request.get({
    url: '/remotion-video-record/page',
    params
  })
}

export function getRemotionVideoRecordDetail(id: string) {
  return request.get({
    url: `/remotion-video-record/${id}`
  })
}

export function deleteRemotionVideoRecord(id: string) {
  return request.delete({
    url: `/remotion-video-record/${id}`
  })
}
