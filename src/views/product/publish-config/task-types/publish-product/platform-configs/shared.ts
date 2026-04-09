import type { FieldConfig } from './types'

export const HIDDEN_TASK_CONFIG_PLATFORMS = new Set(['douyin', 'kuaishou'])

export const videoCommonFields: FieldConfig[] = [
  {
    key: 'privacy',
    label: '隐私设置',
    type: 'select',
    options: [
      { label: '公开', value: 'public' },
      { label: '私密', value: 'private' },
      { label: '仅粉丝', value: 'friends' }
    ],
    defaultValue: 'public',
    span: 8,
    required: true
  },
  {
    key: 'allowComment',
    label: '允许评论',
    type: 'switch',
    defaultValue: true,
    span: 8
  },
  {
    key: 'allowShare',
    label: '允许分享',
    type: 'switch',
    defaultValue: true,
    span: 8
  }
]

export const imageTextCommonFields: FieldConfig[] = [
  {
    key: 'topic',
    label: '话题标签',
    type: 'input',
    placeholder: '多个话题用逗号分隔',
    span: 12
  },
  {
    key: 'location',
    label: '地理位置',
    type: 'input',
    placeholder: '可选，例如：北京市朝阳区',
    span: 12
  }
]
