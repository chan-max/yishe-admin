/*
 * @Description: AI提示词管理API
 */
import request from '@/config/axios'

export function getPromptList(data) {
  return request.post({
    url: '/prompts/page',
    data,
  });
}

export function createPrompt(data) {
  return request.post({
    url: '/prompts',
    data,
  });
}

export function updatePrompt(id: string, data) {
  return request.post({
    url: `/prompts/${id}`,
    method: 'patch',
    data,
  });
}

export function deletePrompt(id: string) {
  return request.delete({
    url: `/prompts/${id}`,
  });
}

