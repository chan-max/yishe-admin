import type { PlatformConfig } from './types'

export const temuPlatformConfig: PlatformConfig = {
  platform: 'temu',
  label: 'Temu',
  description: 'Temu 跨境电商平台配置',
  supportVideo: false,
  supportImage: true,
  titleMaxLength: 230,
  fields: [
    {
      key: 'vendorId',
      label: '绑定厂家',
      type: 'select',
      placeholder: '请选择厂家',
      span: 24
    },
    {
      key: 'vendorProductMappings',
      label: 'SKU供应商商品',
      type: 'vendor-products',
      span: 24,
      tooltip: '按顺序选择供应商商品，对应 productSkcReqs[0].productSkuReqs 的 SKU 顺序；有商品编码时生成“素材码-供应商商品码”，无商品编码时使用素材码。'
    },
    {
      key: 'supId',
      label: 'Sup ID',
      type: 'input',
      placeholder: '请输入 Sup ID',
      span: 24,
      tooltip: '仅用于配置存储，当前发布流程暂不使用。'
    },
    {
      key: 'productTemplate',
      label: '商品模板',
      type: 'textarea',
      placeholder:
        '请输入 Temu 新建商品使用的 productTemplate，支持 JSON 或 JS 对象字面量，例如：{\n  productName: \"示例商品\",\n  productPropertyReqs: []\n}',
      rows: 24,
      span: 24,
      tooltip: 'Temu 平台专属配置。支持 JSON 和合法 JS 对象字面量；图片字段建议通过下方“套图图片序号绑定”声明，由客户端发布时按规则回填。'
    },
    {
      key: 'templateImageBindings',
      label: '套图图片序号绑定',
      type: 'textarea',
      rows: 10,
      span: 24,
      defaultValue: JSON.stringify(
        {
          carouselImageUrls: [1, 2, 3, 4],
          materialImgUrl: 1,
          'productSkcReqs[].productSkuReqs[].thumbUrl': [1, 2, 3, 4],
          'productSkcReqs[].previewImgUrls': [1, 2, 3, 4],
          'goodsLayerDecorationReqs[].contentList[].imageUrl': [1, 2, 3, 4],
        },
        null,
        2
      ),
      placeholder:
        '{\n  "carouselImageUrls": [1, 2, 3],\n  "materialImgUrl": 1,\n  "productSkcReqs[].productSkuReqs[].thumbUrl": [1, 2, 3, 4],\n  "productSkcReqs[].previewImgUrls": [1, 2],\n  "goodsLayerDecorationReqs[].contentList[].imageUrl": [1, 2, 3, 4]\n}',
      tooltip:
        '声明 productTemplate 中图片字段如何使用套图原图序号，从 1 开始：1 表示套图第 1 张图。支持的键：carouselImageUrls、materialImgUrl、productSkcReqs[].productSkuReqs[].thumbUrl、productSkcReqs[].previewImgUrls、goodsLayerDecorationReqs[].contentList[].imageUrl。'
    }
  ]
}
