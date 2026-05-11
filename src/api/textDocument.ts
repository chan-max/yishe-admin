import request from '@/config/axios'

export type TextDocumentContentType = 'plain' | 'markdown' | 'latex' | 'html'
export type TextDocumentStatus = 'draft' | 'published' | 'archived'

export interface TextDocument {
  id: string
  title: string
  content: string
  contentType: TextDocumentContentType
  summary?: string
  category?: string
  tags?: string
  status: TextDocumentStatus
  sort?: number
  userId?: string
  uploader?: {
    id: string
    account?: string
    name?: string
  }
  createTime: string
  updateTime: string
}

export interface TextDocumentPageParams {
  page: number
  pageSize: number
  keyword?: string
  category?: string
  contentType?: string
  status?: string
}

export interface CreateTextDocumentDto {
  title: string
  content: string
  contentType?: TextDocumentContentType
  summary?: string
  category?: string
  tags?: string
  status?: TextDocumentStatus
  sort?: number
  userId?: string
}

export type UpdateTextDocumentDto = Partial<CreateTextDocumentDto>

export function getTextDocumentList(data: TextDocumentPageParams) {
  return request.post({
    url: '/text-document/page',
    data,
  })
}

export function createTextDocument(data: CreateTextDocumentDto) {
  return request.post({
    url: '/text-document',
    data,
  })
}

export function updateTextDocument(id: string, data: UpdateTextDocumentDto) {
  return request.post({
    url: `/text-document/${id}`,
    method: 'patch',
    data,
  })
}

export function deleteTextDocument(id: string) {
  return request.delete({
    url: `/text-document/${id}`,
  })
}

export function getTextDocumentById(id: string) {
  return request.get({
    url: `/text-document/${id}`,
  })
}
