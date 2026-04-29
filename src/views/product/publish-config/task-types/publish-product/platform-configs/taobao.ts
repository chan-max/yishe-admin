import type { PlatformConfig } from './types'

export const taobaoPlatformConfig: PlatformConfig = {
  platform: 'taobao',
  label: '淘宝',
  description: '淘宝商品发布配置',
  supportVideo: false,
  supportImage: true,
  titleMaxLength: 60,
  fields: [
    {
      key: 'itemId',
      label: '复制商品 itemId',
      type: 'input',
      placeholder: '请输入淘宝 publish.htm 链接中的 itemId',
      required: true,
      span: 24,
      tooltip: '会基于这个 itemId 打开淘宝复制发布页'
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
      key: 'psdImageIndexes',
      label: '套图图片序号',
      type: 'input',
      placeholder: '留空使用全部，例如：1 或 1,3 或 2-5',
      span: 24,
      tooltip: '按套图成品图片顺序选择要发布的主图，序号从 1 开始'
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
