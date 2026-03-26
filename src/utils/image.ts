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
  /** 图片体积限制，例如 200k!、500k! */
  sizeLimit?: string
  /** 是否忽略 COS 处理错误，默认 false */
  ignoreError?: boolean
  /** 是否使用缩略图模式（保持宽高比），默认 true */
  thumbnail?: boolean
}

/**
 * 获取预览/缩略图优化后的图片URL
 * 使用腾讯云COS的 imageMogr2 接口进行图片处理
 *
 * 注意：SVG 格式的图片不会被处理，直接返回原 URL
 */
export function getPreviewImageUrl(url: string | null | undefined, options: ImageUrlOptions = {}): string | null {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return null
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url
  }

  try {
    const urlObj = new URL(url)
    if (urlObj.pathname.toLowerCase().endsWith('.svg')) {
      return url
    }
  } catch {
    const pathPart = url.toLowerCase().split('?')[0].split('#')[0]
    if (pathPart.endsWith('.svg')) {
      return url
    }
  }

  const {
    width,
    height,
    quality,
    format,
    sizeLimit,
    ignoreError = false,
    thumbnail = true
  } = options

  const params: string[] = []

  if (width || height) {
    if (thumbnail) {
      if (width && height) {
        params.push(`thumbnail/${width}x${height}`)
      } else if (width) {
        params.push(`thumbnail/x${width}`)
      } else if (height) {
        params.push(`thumbnail/${height}x`)
      }
    } else {
      if (width && height) {
        params.push(`scrop/${width}x${height}`)
      } else if (width) {
        params.push(`resize/w_${width}`)
      } else if (height) {
        params.push(`resize/h_${height}`)
      }
    }
  }

  if (quality !== undefined && quality > 0 && quality <= 100) {
    params.push(`quality/${quality}`)
  }

  if (format) {
    params.push(`format/${format}`)
  }

  if (sizeLimit) {
    params.push(`size-limit/${sizeLimit}`)
  }

  if (ignoreError) {
    params.push('ignore-error/1')
  }

  if (params.length === 0) {
    return url
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}imageMogr2/${params.join('/')}`
}

/**
 * 获取更激进压缩的快速预览图 URL，适合列表、弹窗缩略图等场景。
 * 默认产出类似：?imageMogr2/thumbnail/x200/quality/80/format/webp/size-limit/200k!/ignore-error/1
 */
export function getFastPreviewImageUrl(
  url: string | null | undefined,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpg' | 'jpeg' | 'png' | 'gif'
    sizeLimit?: string
  } = {}
): string | null {
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    sizeLimit = '200k!'
  } = options

  return getPreviewImageUrl(url, {
    width,
    height,
    quality,
    format,
    sizeLimit,
    ignoreError: true,
    thumbnail: true
  })
}