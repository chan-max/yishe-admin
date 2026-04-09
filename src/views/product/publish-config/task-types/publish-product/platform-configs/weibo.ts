import type { PlatformConfig } from './types'

export const weiboPlatformConfig: PlatformConfig = {
  platform: 'weibo',
  label: '微博',
  description: '微博平台配置',
  supportVideo: true,
  supportImage: true,
  titleMaxLength: 140,
  fields: [
    {
      key: 'visible',
      label: '可见范围',
      type: 'select',
      options: [
        { label: '公开', value: 'public' },
        { label: '仅好友', value: 'friends' },
        { label: '仅自己', value: 'private' }
      ],
      defaultValue: 'public',
      span: 12
    },
    {
      key: 'allowComment',
      label: '允许评论',
      type: 'switch',
      defaultValue: true,
      span: 12
    }
  ]
}
