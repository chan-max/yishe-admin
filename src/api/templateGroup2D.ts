import request from '@/config/axios'

export interface TemplateGroup2D {
  id: string
  name: string
  description?: string
  keywords?: string
  image1?: string
  image2?: string
  image3?: string
  image4?: string
  image5?: string
  image6?: string
  image7?: string
  image8?: string
  image9?: string
  image10?: string
  imageOption1?: any
  imageOption2?: any
  imageOption3?: any
  imageOption4?: any
  imageOption5?: any
  imageOption6?: any
  imageOption7?: any
  imageOption8?: any
  imageOption9?: any
  imageOption10?: any
  createTime: string
  updateTime: string
}

export interface CreateTemplateGroup2DDto {
  name: string
  description?: string
  keywords?: string
  image1?: string
  image2?: string
  image3?: string
  image4?: string
  image5?: string
  image6?: string
  image7?: string
  image8?: string
  image9?: string
  image10?: string
  imageOption1?: any
  imageOption2?: any
  imageOption3?: any
  imageOption4?: any
  imageOption5?: any
  imageOption6?: any
  imageOption7?: any
  imageOption8?: any
  imageOption9?: any
  imageOption10?: any
}

export type UpdateTemplateGroup2DDto = Partial<CreateTemplateGroup2DDto>

export function pageTemplateGroup2D(data: { page: number; pageSize: number }) {
  return request.post({ url: '/template-group-2d/page', data })
}

export function createTemplateGroup2D(data: CreateTemplateGroup2DDto) {
  return request.post({ url: '/template-group-2d', data })
}

export function updateTemplateGroup2D(id: string, data: UpdateTemplateGroup2DDto) {
  return request.post({ url: `/template-group-2d/${id}`, method: 'patch', data })
}

export function deleteTemplateGroup2D(id: string) {
  return request.delete({ url: `/template-group-2d/${id}` })
}


