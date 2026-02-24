import request from '@/config/axios'

export const generateTts = (data: {
  text: string
  voice?: string
  model?: string
  format?: string
}) => {
  return request.post({
    url: '/ai/tts',
    data,
    responseType: 'blob' // Important for binary data
  })
}

export const getAvailableModels = () => {
  return request.get({ url: '/ai/models' })
}
