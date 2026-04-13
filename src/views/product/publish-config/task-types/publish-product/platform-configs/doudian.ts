import type { PlatformConfig } from './types'

export const doudianPlatformConfig: PlatformConfig = {
  platform: 'doudian',
  label: '抖店',
  description: '抖店平台配置',
  supportVideo: true,
  supportImage: true,
  titleMaxLength: 60,
  fields: [
    {
      key: 'copyId',
      label: '复制模板 ID',
      type: 'input',
      placeholder: '请输入抖店 create?copyid=... 中的 copyid',
      span: 24,
      tooltip: '发布端会基于这个 copyId 打开抖店模板创建页'
    },
    {
      key: 'vendorId',
      label: '绑定厂家',
      type: 'select',
      placeholder: '请选择厂家',
      span: 24
    },
    {
      key: 'appendImageUrls',
      label: '附加图片',
      type: 'url-list',
      placeholder: '请输入 http/https 图片 URL',
      defaultValue: [],
      span: 24,
      tooltip: '适合材质图、说明图等固定复用图片'
    }
  ]
}
