import request from '@/config/axios'
import type {
  TranslateRequest,
  TranslateResult,
  TranslateBatchRequest,
  TranslateBatchResult,
  SupportedLanguagesResponse,
} from './index'

/**
 * 单文本翻译
 */
export const translateText = (data: TranslateRequest) => {
  return request.post<TranslateResult>({
    url: '/translate/text',
    data,
  })
}

/**
 * 批量翻译
 */
export const batchTranslateText = (data: TranslateBatchRequest) => {
  return request.post<TranslateBatchResult>({
    url: '/translate/batch',
    data,
  })
}

/**
 * 获取支持的语言列表
 */
export const getSupportedLanguages = () => {
  return request.get<SupportedLanguagesResponse>({
    url: '/translate/languages',
    data: null,
  })
}
