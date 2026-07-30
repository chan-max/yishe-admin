import request from '@/config/axios'

/**
 * AI 图片分析
 */
export function analyzeImage(data: {
  prompt: string
  imageUrls: string[]
  systemPrompt?: string
}) {
  return request.post<{ result: string }>({
    url: '/ai/vision',
    data
  })
}

/**
 * AI 图片分析并保存记录
 */
export function analyzeImageAndRecord(data: {
  prompt: string
  imageUrls: string[]
  systemPrompt?: string
}) {
  return request.post<{ result: string; recordId: string }>({
    url: '/ai/vision/record',
    data
  })
}

/**
 * 获取分析记录列表
 */
export function getAnalysisRecords(params?: {
  currentPage?: number
  pageSize?: number
  searchText?: string
}) {
  return request.get({
    url: '/ai/vision/records',
    params
  })
}

/**
 * 删除分析记录
 */
export function deleteAnalysisRecord(id: string) {
  return request.delete({
    url: `/ai/vision/records/${id}`
  })
}

/**
 * 批量删除分析记录（同时清理 COS 文件）
 */
export function batchDeleteAnalysisRecords(ids: string[]) {
  return request.post({
    url: '/ai/vision/records/batch-delete',
    data: { ids }
  })
}
