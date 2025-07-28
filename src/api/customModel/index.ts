import request from '@/config/axios'

export function getCustomModelById(id: string) {
  return request.post({
    url: '/custom-model',
    data: { id }
  })
} 