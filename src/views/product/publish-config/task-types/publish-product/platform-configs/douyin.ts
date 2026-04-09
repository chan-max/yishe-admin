import type { PlatformConfig } from './types'

export const douyinPlatformConfig: PlatformConfig = {
  platform: 'douyin',
  label: '抖音',
  description: '抖音短视频平台配置',
  supportVideo: true,
  supportImage: false,
  titleMaxLength: 30,
  fields: [
    {
      key: 'tagPrompt',
      label: 'Tag 提示词',
      type: 'textarea',
      placeholder: '例如：分析其tag，要求可爱风，三个即可',
      rows: 3,
      span: 24
    }
  ]
}
