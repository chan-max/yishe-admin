/**
 * 平台配置定义 - 平铺结构，方便处理
 * 每个平台定义自己需要的字段配置
 */

export interface FieldConfig {
  key: string
  label: string
  type: 'input' | 'textarea' | 'select' | 'switch' | 'number' | 'radio'
  placeholder?: string
  options?: Array<{ label: string; value: any }>
  defaultValue?: any
  rows?: number
  span?: number // 栅格占位（基于24列）
  required?: boolean
  tooltip?: string
}

export interface PlatformConfig {
  platform: string
  label: string
  description: string
  fields: FieldConfig[]
  supportVideo: boolean
  supportImage: boolean
  titleMaxLength?: number
}

// 视频平台通用字段
const videoCommonFields: FieldConfig[] = [
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

// 图文平台通用字段
const imageTextCommonFields: FieldConfig[] = [
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

// 平台配置映射
export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  douyin: {
    platform: 'douyin',
    label: '抖音',
    description: '抖音短视频平台配置',
    supportVideo: true,
    supportImage: false,
    titleMaxLength: 30,
    fields: [
      {
        key: 'tagPrompt',
        label: 'Tag 提示词',
        type: 'textarea',
        placeholder: '例如：分析其tag，要求可爱风，三个即可',
        rows: 3,
        span: 24
      }
    ]
  },
  
  kuaishou: {
    platform: 'kuaishou',
    label: '快手',
    description: '快手短视频平台配置',
    supportVideo: true,
    supportImage: false,
    titleMaxLength: 30,
    fields: [
      ...videoCommonFields,
      {
        key: 'photoType',
        label: '作品类型',
        type: 'select',
        options: [
          { label: '普通视频', value: 'normal' },
          { label: '长视频', value: 'long' }
        ],
        defaultValue: 'normal',
        span: 12
      }
    ]
  },

  xiaohongshu: {
    platform: 'xiaohongshu',
    label: '小红书',
    description: '小红书图文/视频平台配置',
    supportVideo: true,
    supportImage: true,
    titleMaxLength: 100,
    fields: [
      ...imageTextCommonFields,
      {
        key: 'noteType',
        label: '笔记类型',
        type: 'select',
        options: [
          { label: '普通笔记', value: 'normal' },
          { label: '视频笔记', value: 'video' }
        ],
        defaultValue: 'normal',
        span: 8
      },
      {
        key: 'allowSave',
        label: '允许保存',
        type: 'switch',
        defaultValue: true,
        span: 8
      },
      {
        key: 'postTime',
        label: '发布时间',
        type: 'select',
        options: [
          { label: '立即发布', value: 'now' },
          { label: '定时发布', value: 'scheduled' }
        ],
        defaultValue: 'now',
        span: 8
      }
    ]
  },

  weibo: {
    platform: 'weibo',
    label: '微博',
    description: '微博平台配置',
    supportVideo: true,
    supportImage: true,
    titleMaxLength: 140,
    fields: [
      {
        key: 'visible',
        label: '可见范围',
        type: 'select',
        options: [
          { label: '公开', value: 'public' },
          { label: '仅好友', value: 'friends' },
          { label: '仅自己', value: 'private' }
        ],
        defaultValue: 'public',
        span: 12
      },
      {
        key: 'allowComment',
        label: '允许评论',
        type: 'switch',
        defaultValue: true,
        span: 12
      }
    ]
  },

  youtube: {
    platform: 'youtube',
    label: 'YouTube',
    description: 'YouTube视频平台配置',
    supportVideo: true,
    supportImage: false,
    titleMaxLength: 60,
    fields: [
      {
        key: 'privacy',
        label: '隐私设置',
        type: 'select',
        options: [
          { label: '公开', value: 'public' },
          { label: '不公开', value: 'unlisted' },
          { label: '私密', value: 'private' }
        ],
        defaultValue: 'public',
        span: 8,
        required: true
      },
      {
        key: 'category',
        label: '视频分类',
        type: 'select',
        options: [
          { label: '娱乐', value: '24' },
          { label: '教育', value: '27' },
          { label: '科技', value: '28' },
          { label: '音乐', value: '10' },
          { label: '游戏', value: '20' }
        ],
        defaultValue: '24',
        span: 8
      },
      {
        key: 'madeForKids',
        label: '儿童内容',
        type: 'switch',
        defaultValue: false,
        span: 8,
        tooltip: '是否为儿童制作的内容'
      },
      {
        key: 'language',
        label: '视频语言',
        type: 'input',
        placeholder: '例如：zh-CN',
        defaultValue: 'zh-CN',
        span: 12
      }
    ]
  },

  tiktok: {
    platform: 'tiktok',
    label: 'TikTok',
    description: 'TikTok国际版配置',
    supportVideo: true,
    supportImage: false,
    titleMaxLength: 100,
    fields: [
      {
        key: 'privacy',
        label: '隐私设置',
        type: 'select',
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Friends', value: 'friends' },
          { label: 'Private', value: 'private' }
        ],
        defaultValue: 'public',
        span: 8
      },
      {
        key: 'allowComments',
        label: 'Allow Comments',
        type: 'switch',
        defaultValue: true,
        span: 8
      },
      {
        key: 'allowDuet',
        label: 'Allow Duet',
        type: 'switch',
        defaultValue: true,
        span: 8
      }
    ]
  },

  doudian: {
    platform: 'doudian',
    label: '抖店',
    description: '抖店商品发布骨架配置',
    supportVideo: true,
    supportImage: true,
    titleMaxLength: 60,
    fields: [
      {
        key: 'draftOnly',
        label: '仅保存草稿',
        type: 'switch',
        defaultValue: true,
        span: 8,
        tooltip: '基础支持阶段默认建议仅保存草稿，不直接点击最终发布'
      },
      {
        key: 'price',
        label: '商品价格',
        type: 'number',
        placeholder: '可选，后续完善价格映射',
        span: 8
      },
      {
        key: 'stock',
        label: '库存',
        type: 'number',
        placeholder: '可选，后续完善库存映射',
        span: 8
      },
      {
        key: 'categoryId',
        label: '类目ID',
        type: 'input',
        placeholder: '可选，后续补充类目映射',
        span: 12
      },
      {
        key: 'shopId',
        label: '店铺ID',
        type: 'input',
        placeholder: '可选，抖店店铺标识',
        span: 12
      },
      {
        key: 'deliveryTemplate',
        label: '运费模板',
        type: 'input',
        placeholder: '可选，后续补充模板映射',
        span: 12
      },
      {
        key: 'productType',
        label: '商品类型',
        type: 'select',
        options: [
          { label: '普通商品', value: 'normal' },
          { label: '预售商品', value: 'presale' }
        ],
        defaultValue: 'normal',
        span: 12
      }
    ]
  },

  kuaishou_shop: {
    platform: 'kuaishou_shop',
    label: '快手小店',
    description: '快手小店商品发布骨架配置',
    supportVideo: true,
    supportImage: true,
    titleMaxLength: 60,
    fields: [
      {
        key: 'draftOnly',
        label: '仅保存草稿',
        type: 'switch',
        defaultValue: true,
        span: 8,
        tooltip: '基础支持阶段默认建议仅保存草稿，不直接点击最终发布'
      },
      {
        key: 'price',
        label: '商品价格',
        type: 'number',
        placeholder: '可选，后续完善价格映射',
        span: 8
      },
      {
        key: 'stock',
        label: '库存',
        type: 'number',
        placeholder: '可选，后续完善库存映射',
        span: 8
      },
      {
        key: 'categoryId',
        label: '类目ID',
        type: 'input',
        placeholder: '可选，后续补充类目映射',
        span: 12
      },
      {
        key: 'shopId',
        label: '店铺ID',
        type: 'input',
        placeholder: '可选，快手小店店铺标识',
        span: 12
      },
      {
        key: 'deliveryTemplate',
        label: '运费模板',
        type: 'input',
        placeholder: '可选，后续补充模板映射',
        span: 12
      },
      {
        key: 'productType',
        label: '商品类型',
        type: 'select',
        options: [
          { label: '普通商品', value: 'normal' },
          { label: '预售商品', value: 'presale' }
        ],
        defaultValue: 'normal',
        span: 12
      }
    ]
  },

  xianyu: {
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
  },

  temu: {
    platform: 'temu',
    label: 'Temu',
    description: 'Temu 跨境电商平台配置',
    supportVideo: false,
    supportImage: true,
    titleMaxLength: 60,
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
        key: 'stock',
        label: '库存',
        type: 'number',
        placeholder: '可选，库存数量',
        span: 8
      },
      {
        key: 'categoryId',
        label: '类目ID',
        type: 'input',
        placeholder: '可选，Temu类目ID',
        span: 8
      },
      {
        key: 'shippingTemplate',
        label: '运费模板',
        type: 'input',
        placeholder: '可选，运费模板名称/ID',
        span: 12
      },
      {
        key: 'brand',
        label: '品牌',
        type: 'input',
        placeholder: '可选，品牌名称',
        span: 12
      }
    ]
  }
}

// 获取平台配置
export function getPlatformConfig(platform: string): PlatformConfig | null {
  return PLATFORM_CONFIGS[platform] || null
}

// 获取平台默认配置数据
export function getPlatformDefaultData(platform: string): Record<string, any> {
  const config = getPlatformConfig(platform)
  if (!config) return {}
  
  const defaultData: Record<string, any> = {}
  config.fields.forEach(field => {
    if (field.defaultValue !== undefined) {
      defaultData[field.key] = field.defaultValue
    }
  })
  return defaultData
}

// 获取所有支持的平台列表
export function getAllPlatforms() {
  return Object.values(PLATFORM_CONFIGS).map(config => ({
    label: config.label,
    value: config.platform
  }))
}
