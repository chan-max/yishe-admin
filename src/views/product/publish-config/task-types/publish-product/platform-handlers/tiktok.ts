import type { PlatformHandler } from './types'

export const tiktokHandler: PlatformHandler = {
  platform: 'tiktok',

  validateConfig() {
    return {
      valid: true,
      errors: []
    }
  },

  getHints() {
    return [
      'TikTok标题限制：最多100个字符',
      '视频时长：15秒-10分钟',
      '支持Duet和Stitch功能'
    ]
  }
}
