import type { PlatformConfig } from './types'

export const pddPlatformConfig: PlatformConfig = {
  platform: 'pdd',
  label: '拼多多',
  description: '拼多多商品发布配置',
  supportVideo: false,
  supportImage: true,
  titleMaxLength: 60,
  fields: [
    {
      key: 'goodsId',
      label: '相似商品 goodsId',
      type: 'input',
      placeholder: '请输入商品 ID，例如 950241010535',
      required: true,
      span: 24,
      tooltip: '发布端会进入商品列表，按商品 ID 查询后点击发布相似品'
    },
    {
      key: 'vendorId',
      label: '绑定厂家',
      type: 'select',
      placeholder: '请选择厂家',
      span: 24,
      tooltip: '生成 productCode 时会按“素材码-厂家码”拼接'
    },
    {
      key: 'stock',
      label: '库存',
      type: 'number',
      placeholder: '请输入库存',
      span: 24
    },
    {
      key: 'psdImageIndexes',
      label: '套图图片序号',
      type: 'input',
      placeholder: '留空使用全部，例如：1 或 1,3 或 2-5',
      span: 24,
      tooltip: '按套图成品图片顺序选择要发布的商品主图，序号从 1 开始，最多 10 张'
    },
    {
      key: 'skuImageIndexes',
      label: 'SKU 图片序号',
      type: 'input',
      placeholder: '例如：2,3,4,5，表示第 1 个 SKU 用第 2 张图',
      span: 24,
      tooltip: '按 SKU 顺序映射套图图片，只支持逗号分隔的正整数，例如 2,3,4,5'
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
