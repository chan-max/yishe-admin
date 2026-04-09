import type { PlatformConfig } from './types'

export const tiktokPlatformConfig: PlatformConfig = {
  platform: 'tiktok',
  label: 'TikTok',
  description: 'TikTok国际版配置',
  supportVideo: true,
  supportImage: false,
  titleMaxLength: 100,
  fields: [
    {
      key: 'privacy',
      label: '隐私设置',
      type: 'select',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Friends', value: 'friends' },
        { label: 'Private', value: 'private' }
      ],
      defaultValue: 'public',
      span: 8
    },
    {
      key: 'allowComments',
      label: 'Allow Comments',
      type: 'switch',
      defaultValue: true,
      span: 8
    },
    {
      key: 'allowDuet',
      label: 'Allow Duet',
      type: 'switch',
      defaultValue: true,
      span: 8
    }
  ]
}
