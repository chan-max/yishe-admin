import type { PlatformHandler } from './types'

export const weiboHandler: PlatformHandler = {
  platform: 'weibo',

  validateConfig() {
    return {
      valid: true,
      errors: []
    }
  },

  getHints() {
    return [
      '微博标题限制：最多140个字符',
      '支持1-9张图片',
      '视频时长：5分钟以内'
    ]
  }
}
