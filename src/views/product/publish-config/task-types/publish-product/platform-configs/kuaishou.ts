import type { PlatformConfig } from './types'
import { videoCommonFields } from './shared'

export const kuaishouPlatformConfig: PlatformConfig = {
  platform: 'kuaishou',
  label: '快手',
  description: '快手短视频平台配置',
  supportVideo: true,
  supportImage: false,
  titleMaxLength: 30,
  fields: [
    ...videoCommonFields,
    {
      key: 'photoType',
      label: '作品类型',
      type: 'select',
      options: [
        { label: '普通视频', value: 'normal' },
        { label: '长视频', value: 'long' }
      ],
      defaultValue: 'normal',
      span: 12
    }
  ]
}
