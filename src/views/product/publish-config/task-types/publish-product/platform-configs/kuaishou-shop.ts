import type { PlatformConfig } from './types'

export const kuaishouShopPlatformConfig: PlatformConfig = {
  platform: 'kuaishou_shop',
  label: '快手小店',
  description: '快手小店商品发布骨架配置',
  supportVideo: true,
  supportImage: true,
  titleMaxLength: 60,
  fields: [
    {
      key: 'sameId',
      label: '模板 sameId',
      type: 'input',
      placeholder: '请输入快手小店 add?sameId=... 中的 sameId',
      span: 24,
      tooltip: '发布端会基于这个 sameId 打开快手小店模板创建页'
    },
    {
      key: 'vendorId',
      label: '绑定厂家',
      type: 'select',
      placeholder: '请选择厂家',
      span: 24
    }
  ]
}
