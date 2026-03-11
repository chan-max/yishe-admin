import request from '@/config/axios'

export interface TtiRecordPageParams {
  page: number
  pageSize: number
  search?: string
}

export interface CreateTtiRecordDto {
  prompt: string
  negativePrompt?: string
  model?: string
  size?: string
  n?: number
  style?: string
}

export const getTtiRecordPage = (data: TtiRecordPageParams) => {
  return request.post({
    url: '/ai/tti-record/page',
    data
  })
}

export const createTtiRecord = (data: CreateTtiRecordDto) => {
  return request.post({
    url: '/ai/tti-record',
    data
  })
}

export const deleteTtiRecord = (id: string) => {
  return request.delete({
    url: `/ai/tti-record/${id}`
  })
}

export const getTtiRecordById = (id: string) => {
  return request.get({
    url: `/ai/tti-record/${id}`
  })
}
