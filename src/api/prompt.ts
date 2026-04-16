/*
 * @Description: AI提示词管理API
 */
import request from '@/config/axios'

export interface PromptPageParams {
  currentPage?: number
  pageSize?: number
  search?: string
  folderId?: string | null
}

export interface PromptSavePayload {
  title: string
  content: string
  description?: string
  tags?: string
  folderId?: string | null
}

export function getPromptList(data: PromptPageParams) {
  return request.post({
    url: '/prompts/page',
    data,
  });
}

export function createPrompt(data: PromptSavePayload) {
  return request.post({
    url: '/prompts',
    data,
  });
}

export function updatePrompt(id: string | number, data: Partial<PromptSavePayload>) {
  return request.post({
    url: `/prompts/${id}`,
    method: 'patch',
    data,
  });
}

export function deletePrompt(id: string | number) {
  return request.delete({
    url: `/prompts/${id}`,
  });
}

export function batchMovePrompt(data: { ids: number[]; folderId: string | null }) {
  return request.post({
    url: '/prompts/batch-move',
    data,
  });
}
