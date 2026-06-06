/**
 * 支持的语言代码类型
 */
export type SupportedLanguage =
  | 'zh'  // 中文
  | 'en'  // 英语
  | 'ja'  // 日语
  | 'de'  // 德语
  | 'fr'  // 法语
  | 'es'  // 西班牙语
  | 'ko'  // 韩语
  | 'ru'  // 俄语
  | 'pt'  // 葡萄牙语
  | 'it'  // 意大利语
  | 'ar'  // 阿拉伯语
  | 'hi'  // 印地语
  | 'th'  // 泰语
  | 'vi'; // 越南语

/**
 * 支持的语言列表
 */
export const SUPPORTED_LANGUAGES: Array<{ code: SupportedLanguage; name: string }> = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'ko', name: '한국어' },
  { code: 'ru', name: 'Русский' },
  { code: 'pt', name: 'Português' },
  { code: 'it', name: 'Italiano' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'th', name: 'ไทย' },
  { code: 'vi', name: 'Tiếng Việt' },
];

/**
 * 单文本翻译请求参数
 */
export interface TranslateRequest {
  /** 需要翻译的文本 */
  text: string;
  /** 源语言代码 */
  sourceLang: SupportedLanguage;
  /** 目标语言代码 */
  targetLang: SupportedLanguage;
  /** 翻译上下文(可选) */
  context?: string;
}

/**
 * 单文本翻译结果
 */
export interface TranslateResult {
  /** 原文 */
  originalText: string;
  /** 译文 */
  translatedText: string;
  /** 源语言 */
  sourceLang: SupportedLanguage;
  /** 目标语言 */
  targetLang: SupportedLanguage;
}

/**
 * 批量翻译请求项
 */
export interface TranslateBatchItem {
  /** 需要翻译的文本 */
  text: string;
  /** 源语言代码 */
  sourceLang: SupportedLanguage;
  /** 目标语言代码 */
  targetLang: SupportedLanguage;
  /** 单条翻译的上下文(可选) */
  context?: string;
}

/**
 * 批量翻译请求参数
 */
export interface TranslateBatchRequest {
  /** 翻译项列表 */
  items: TranslateBatchItem[];
  /** 全局翻译上下文(可选) */
  context?: string;
}

/**
 * 批量翻译错误项
 */
export interface TranslateBatchError {
  /** 失败项在列表中的索引 */
  index: number;
  /** 失败项的原文 */
  text: string;
  /** 错误信息 */
  error: string;
}

/**
 * 批量翻译结果
 */
export interface TranslateBatchResult {
  /** 成功翻译的结果列表 */
  results: TranslateResult[];
  /** 失败的错误列表 */
  errors: TranslateBatchError[];
  /** 总请求数 */
  total: number;
  /** 成功数 */
  successCount: number;
  /** 失败数 */
  failureCount: number;
}

/**
 * 支持的语言列表响应
 */
export interface SupportedLanguagesResponse {
  languages: Array<{ code: SupportedLanguage; name: string }>;
}
