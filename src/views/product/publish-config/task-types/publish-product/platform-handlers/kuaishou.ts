import type { PlatformHandler } from './types'

export const kuaishouHandler: PlatformHandler = {
  platform: 'kuaishou',

  validateConfig(configData) {
    const errors: string[] = []

    if (configData.photoType === 'long' && configData.privacy === 'private') {
      errors.push('长视频不支持私密模式')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  },

  getHints() {
    return [
      '快手标题限制：最多30个字符',
      '普通视频：最长57秒',
      '长视频：1-10分钟'
    ]
  }
}
