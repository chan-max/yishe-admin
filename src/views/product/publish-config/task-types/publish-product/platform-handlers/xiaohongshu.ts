import type { PlatformHandler } from './types'

export const xiaohongshuHandler: PlatformHandler = {
  platform: 'xiaohongshu',

  validateConfig(configData) {
    const errors: string[] = []

    if (configData.noteType === 'video' && !configData.topic) {
      errors.push('视频笔记建议添加话题标签')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  },

  formatConfigForSubmit(configData) {
    const formatted = { ...configData }

    if (formatted.topic && typeof formatted.topic === 'string') {
      formatted.topic = formatted.topic.trim()
    }

    return formatted
  },

  getHints() {
    return [
      '小红书标题限制：最多100个字符',
      '支持1-9张图片或1个视频',
      '建议添加话题标签提高曝光',
      '图片建议尺寸：3:4 或 1:1'
    ]
  }
}
