import type { PlatformHandler } from './types'

export const xianyuHandler: PlatformHandler = {
  platform: 'xianyu',

  validateConfig(configData) {
    const errors: string[] = []

    if (!configData.price || configData.price <= 0) {
      errors.push('必须设置有效的商品价格')
    }

    if (configData.originalPrice && configData.originalPrice < configData.price) {
      errors.push('原价不能低于现价')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  },

  formatConfigForSubmit(configData) {
    const formatted = { ...configData }

    if (formatted.price) {
      formatted.price = Number(formatted.price)
    }
    if (formatted.originalPrice) {
      formatted.originalPrice = Number(formatted.originalPrice)
    }

    return formatted
  },

  getHints() {
    return [
      '咸鱼标题限制：最多50个字符',
      '必须设置商品价格',
      '支持1-9张图片',
      '建议上传清晰的商品图片'
    ]
  },

  beforeSubmit(formData) {
    if (!formData.configData?.price) {
      throw new Error('咸鱼平台必须设置商品价格')
    }
    return formData
  }
}
