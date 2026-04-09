import type { PlatformConfig } from './types'

export const youtubePlatformConfig: PlatformConfig = {
  platform: 'youtube',
  label: 'YouTube',
  description: 'YouTube视频平台配置',
  supportVideo: true,
  supportImage: false,
  titleMaxLength: 60,
  fields: [
    {
      key: 'privacy',
      label: '隐私设置',
      type: 'select',
      options: [
        { label: '公开', value: 'public' },
        { label: '不公开', value: 'unlisted' },
        { label: '私密', value: 'private' }
      ],
      defaultValue: 'public',
      span: 8,
      required: true
    },
    {
      key: 'category',
      label: '视频分类',
      type: 'select',
      options: [
        { label: '娱乐', value: '24' },
        { label: '教育', value: '27' },
        { label: '科技', value: '28' },
        { label: '音乐', value: '10' },
        { label: '游戏', value: '20' }
      ],
      defaultValue: '24',
      span: 8
    },
    {
      key: 'madeForKids',
      label: '儿童内容',
      type: 'switch',
      defaultValue: false,
      span: 8,
      tooltip: '是否为儿童制作的内容'
    },
    {
      key: 'language',
      label: '视频语言',
      type: 'input',
      placeholder: '例如：zh-CN',
      defaultValue: 'zh-CN',
      span: 12
    }
  ]
}
