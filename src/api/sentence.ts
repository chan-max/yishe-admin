/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-04 23:00:38
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-09 07:40:14
 * @FilePath: /design-server/Users/jackie/workspace/yishe-admin/src/api/sentence.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import request from '@/config/axios'

export function getSentenceList(data) {
  return request.post({
    url: '/sentences/page',
    data,
  });
}

export function createSentence(data) {
  return request.post({
    url: '/sentences',
    data,
  });
}

export function updateSentence(id: string, data) {
  return request.post({
    url: `/sentences/${id}`,
    method: 'patch',
    data,
  });
}

export function deleteSentence(id: string) {
  return request.delete({
    url: `/sentences/${id}`,
  });
}

export function aiAnalyzeSentence(id: number, prompt?: string) {
  return request.post({
    url: '/sentences/ai-analyze',
    data: { id, prompt }
  });
}

export function batchMoveSentence(data: { ids: number[]; folderId: string | null }) {
  return request.post({
    url: '/sentences/batch-move',
    data,
  });
} 