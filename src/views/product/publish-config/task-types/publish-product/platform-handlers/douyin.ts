import type { PlatformHandler } from './types'

export const douyinHandler: PlatformHandler = {
  platform: 'douyin',

  validateConfig(_configData) {
    return {
      valid: true,
      errors: []
    }
  },

  formatConfigForSubmit(configData) {
    return { ...configData }
  },

  getHints() {
    return [
      '抖音标题限制：最多30个字符',
      '视频时长：15秒-5分钟'
    ]
  }
}
