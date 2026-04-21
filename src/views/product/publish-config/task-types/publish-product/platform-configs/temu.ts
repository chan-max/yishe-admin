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
      key: 'vendorId',
      label: '绑定厂家',
      type: 'select',
      placeholder: '请选择厂家',
      span: 24
    },
    {
      key: 'productTemplate',
      label: '商品模板',
      type: 'textarea',
      placeholder:
        '请输入 Temu 新建商品使用的 productTemplate，支持 JSON 或 JS 对象字面量，例如：{\n  productName: \"示例商品\",\n  productPropertyReqs: []\n}',
      rows: 24,
      span: 24,
      tooltip: 'Temu 平台专属配置。支持 JSON 和合法 JS 对象字面量；模板中可使用 $productCode、$image[0] 这类变量，最终由客户端在发布时替换。'
    }
  ]
}
