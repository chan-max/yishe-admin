import type { PlatformHandler } from './types'

export const youtubeHandler: PlatformHandler = {
  platform: 'youtube',

  validateConfig(configData) {
    const errors: string[] = []

    if (!configData.privacy) {
      errors.push('必须设置隐私选项')
    }

    if (!configData.category) {
      errors.push('必须选择视频分类')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  },

  formatConfigForSubmit(configData) {
    const formatted = { ...configData }

    if (formatted.category) {
      formatted.category = String(formatted.category)
    }

    return formatted
  },

  getHints() {
    return [
      'YouTube标题限制：最多100个字符',
      '描述限制：最多5000个字符',
      '标签：最多500个字符',
      '视频时长：最长12小时'
    ]
  }
}
