import type { PlatformConfig } from './types'

export const temuPlatformConfig: PlatformConfig = {
  platform: 'temu',
  label: 'Temu',
  description: 'Temu 跨境电商平台配置',
  supportVideo: false,
  supportImage: true,
  titleMaxLength: 60,
  fields: [
    {
      key: 'productTemplate',
      label: '商品模板',
      type: 'textarea',
      placeholder:
        '请输入 Temu 新建商品使用的 productTemplate，支持 JSON 或 JS 对象字面量，例如：{\n  productName: \"示例商品\",\n  productPropertyReqs: []\n}',
      rows: 24,
      span: 24,
      tooltip: 'Temu 平台专属配置。支持 JSON 和合法 JS 对象字面量，保存后会统一转成标准对象。'
    }
  ]
}
