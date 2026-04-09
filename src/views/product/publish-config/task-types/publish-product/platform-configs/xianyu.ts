import type { PlatformConfig } from './types'

export const xianyuPlatformConfig: PlatformConfig = {
  platform: 'xianyu',
  label: '咸鱼',
  description: '咸鱼二手交易平台配置',
  supportVideo: true,
  supportImage: true,
  titleMaxLength: 50,
  fields: [
    {
      key: 'price',
      label: '商品价格',
      type: 'number',
      placeholder: '输入价格',
      span: 8,
      required: true
    },
    {
      key: 'originalPrice',
      label: '原价',
      type: 'number',
      placeholder: '可选，原价',
      span: 8
    }
  ]
}
