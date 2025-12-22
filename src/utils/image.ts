/**
 * 图片URL处理工具函数
 * 用于处理腾讯云COS图片，生成压缩、缩略图等优化后的URL
 */

export interface ImageUrlOptions {
  /** 图片宽度（像素），默认不设置 */
  width?: number
  /** 图片高度（像素），默认不设置 */
  height?: number
  /** 图片质量（1-100） */
  quality?: number
  /** 图片格式 */
  format?: 'webp' | 'jpg' | 'jpeg' | 'png' | 'gif'
  /** 是否使用缩略图模式（保持宽高比），默认true */
  thumbnail?: boolean
}

/**
 * 获取预览/缩略图优化后的图片URL
 * 使用腾讯云COS的imageMogr2接口进行图片处理
 * 
 * @param url 原始图片URL
 * @param options 图片处理选项
 * @returns 处理后的图片URL
 * 
 * @example
 * getPreviewImageUrl('https://example.com/image.jpg', { width: 500, quality: 80, format: 'webp' })
 * // 返回: 'https://example.com/image.jpg?imageMogr2/thumbnail/x500/quality/80/format/webp'
 */
export function getPreviewImageUrl(url: string | null | undefined, options: ImageUrlOptions = {}): string | null {
  // 如果URL为空，直接返回null
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return null
  }

  // 如果URL不是有效的HTTP(S)链接，直接返回原URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url
  }

  // 解构选项，不设置默认值，让用户明确控制
  const {
    width,
    height,
    quality,
    format,
    thumbnail = true
  } = options

  // 构建imageMogr2参数
  const params: string[] = []

  // 处理尺寸（缩略图或直接缩放）
  if (width || height) {
    if (thumbnail) {
      // 缩略图模式：保持宽高比，按指定尺寸缩放
      if (width && height) {
        params.push(`thumbnail/${width}x${height}`)
      } else if (width) {
        params.push(`thumbnail/x${width}`)
      } else if (height) {
        params.push(`thumbnail/${height}x`)
      }
    } else {
      // 直接缩放模式
      if (width && height) {
        params.push(`scrop/${width}x${height}`)
      } else if (width) {
        params.push(`resize/w_${width}`)
      } else if (height) {
        params.push(`resize/h_${height}`)
      }
    }
  }

  // 质量参数（仅在明确指定时添加）
  if (quality !== undefined && quality > 0 && quality <= 100) {
    params.push(`quality/${quality}`)
  }

  // 格式转换（仅在明确指定时添加）
  if (format) {
    params.push(`format/${format}`)
  }

  // 如果没有任何参数，返回原URL
  if (params.length === 0) {
    return url
  }

  // 拼接参数：检查URL是否已有查询参数
  const separator = url.includes('?') ? '&' : '?'
  const imageMogr2Params = params.join('/')
  
  return `${url}${separator}imageMogr2/${imageMogr2Params}`
}
