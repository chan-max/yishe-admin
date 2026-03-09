import request from '@/config/axios'

export interface TtsRecordPageParams {
  page: number
  pageSize: number
  search?: string
}

export interface CreateTtsRecordDto {
  text: string
  prompt?: string
  voice?: string
  model?: string
  format?: string
  instructions?: string
  sample_rate?: number
  speed?: number
  pitch?: number
}

export const generateTts = (data: {
  text: string
  voice?: string
  model?: string
  format?: string
  instructions?: string
}) => {
  return request.post({
    url: '/ai/tts',
    data
  })
}

export const getTtsRecordPage = (data: TtsRecordPageParams) => {
  return request.post({
    url: '/ai/tts-record/page',
    data
  })
}

export const createTtsRecord = (data: CreateTtsRecordDto) => {
  return request.post({
    url: '/ai/tts-record',
    data
  })
}

export const updateTtsRecord = (id: string, data: any) => {
  return request.post({
    url: `/ai/tts-record/${id}`,
    method: 'patch',
    data
  })
}

export const deleteTtsRecord = (id: string) => {
  return request.delete({
    url: `/ai/tts-record/${id}`
  })
}

export const getTtsRecordById = (id: string) => {
  return request.get({
    url: `/ai/tts-record/${id}`
  })
}

export const getAvailableModels = () => {
  return request.get({ url: '/ai/models' })
}
