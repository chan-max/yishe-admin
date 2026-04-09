import type { PlatformConfig } from './types'
import { imageTextCommonFields } from './shared'

export const xiaohongshuPlatformConfig: PlatformConfig = {
  platform: 'xiaohongshu',
  label: '小红书',
  description: '小红书图文/视频平台配置',
  supportVideo: true,
  supportImage: true,
  titleMaxLength: 100,
  fields: [
    ...imageTextCommonFields,
    {
      key: 'noteType',
      label: '笔记类型',
      type: 'select',
      options: [
        { label: '普通笔记', value: 'normal' },
        { label: '视频笔记', value: 'video' }
      ],
      defaultValue: 'normal',
      span: 8
    },
    {
      key: 'allowSave',
      label: '允许保存',
      type: 'switch',
      defaultValue: true,
      span: 8
    },
    {
      key: 'postTime',
      label: '发布时间',
      type: 'select',
      options: [
        { label: '立即发布', value: 'now' },
        { label: '定时发布', value: 'scheduled' }
      ],
      defaultValue: 'now',
      span: 8
    }
  ]
}
