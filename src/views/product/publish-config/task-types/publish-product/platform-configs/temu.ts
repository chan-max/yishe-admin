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
      tooltip: 'Temu 平台专属配置。支持 JSON 和合法 JS 对象字面量；图片字段建议通过下方“图片索引绑定”声明，由客户端发布时按规则回填。'
    },
    {
      key: 'templateImageBindings',
      label: '图片索引绑定',
      type: 'textarea',
      rows: 10,
      span: 24,
      defaultValue: JSON.stringify(
        {
          carouselImageUrls: [0, 1, 2, 3],
          materialImgUrl: 0,
          'productSkcReqs[].productSkuReqs[].thumbUrl': [0, 1, 2, 3],
          'productSkcReqs[].previewImgUrls': [0, 1, 2, 3],
        },
        null,
        2
      ),
      placeholder:
        '{\n  "carouselImageUrls": [0, 1, 2],\n  "materialImgUrl": 0,\n  "productSkcReqs[].productSkuReqs[].thumbUrl": [0, 1, 2, 3],\n  "productSkcReqs[].previewImgUrls": [0, 1]\n}',
      tooltip:
        '声明 productTemplate 中图片字段如何使用上传后的图片索引。支持的键：carouselImageUrls、materialImgUrl、productSkcReqs[].productSkuReqs[].thumbUrl、productSkcReqs[].previewImgUrls。'
    }
  ]
}
