/**
 * 前端平台处理器 - 每个平台独立的业务逻辑
 * 用于处理平台特定的数据转换、校验、格式化等
 */

/**
 * 平台处理器接口
 */
export interface PlatformHandler {
  platform: string
  
  /**
   * 校验配置数据
   */
  validateConfig?: (configData: Record<string, any>) => { valid: boolean; errors: string[] }
  
  /**
   * 格式化配置数据（提交前）
   */
  formatConfigForSubmit?: (configData: Record<string, any>) => Record<string, any>
  
  /**
   * 格式化配置数据（编辑时）
   */
  formatConfigForEdit?: (configData: Record<string, any>) => Record<string, any>
  
  /**
   * 获取平台特定的提示信息
   */
  getHints?: () => string[]
  
  /**
   * 数据转换钩子（在提交前）
   */
  beforeSubmit?: (formData: any) => any
}

function normalizeHttpUrlList(input: unknown): string[] {
  const values = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(/\r?\n/)
      : [];

  return Array.from(
    new Set(
      values
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .filter((item) => /^https?:\/\//i.test(item))
    )
  );
}

/**
 * 抖音平台处理器
 */
const douyinHandler: PlatformHandler = {
  platform: 'douyin',
  
  validateConfig(_configData) {
    return {
      valid: true,
      errors: []
    }
  },
  
  formatConfigForSubmit(configData) {
    // 抖音特定格式化
    return { ...configData }
  },
  
  getHints() {
    return [
      '抖音标题限制：最多30个字符',
      '视频时长：15秒-5分钟'
    ]
  }
}

/**
 * 快手平台处理器
 */
const kuaishouHandler: PlatformHandler = {
  platform: 'kuaishou',
  
  validateConfig(configData) {
    const errors: string[] = []
    
    if (configData.photoType === 'long' && configData.privacy === 'private') {
      errors.push('长视频不支持私密模式')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },
  
  getHints() {
    return [
      '快手标题限制：最多30个字符',
      '普通视频：最长57秒',
      '长视频：1-10分钟'
    ]
  }
}

/**
 * 小红书平台处理器
 */
const xiaohongshuHandler: PlatformHandler = {
  platform: 'xiaohongshu',
  
  validateConfig(configData) {
    const errors: string[] = []
    
    // 小红书特定校验
    if (configData.noteType === 'video' && !configData.topic) {
      errors.push('视频笔记建议添加话题标签')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },
  
  formatConfigForSubmit(configData) {
    const formatted = { ...configData }
    
    // 话题标签处理
    if (formatted.topic && typeof formatted.topic === 'string') {
      formatted.topic = formatted.topic.trim()
    }
    
    return formatted
  },
  
  getHints() {
    return [
      '小红书标题限制：最多100个字符',
      '支持1-9张图片或1个视频',
      '建议添加话题标签提高曝光',
      '图片建议尺寸：3:4 或 1:1'
    ]
  }
}

/**
 * 微博平台处理器
 */
const weiboHandler: PlatformHandler = {
  platform: 'weibo',
  
  validateConfig() {
    return {
      valid: true,
      errors: []
    }
  },
  
  getHints() {
    return [
      '微博标题限制：最多140个字符',
      '支持1-9张图片',
      '视频时长：5分钟以内'
    ]
  }
}

/**
 * YouTube平台处理器
 */
const youtubeHandler: PlatformHandler = {
  platform: 'youtube',
  
  validateConfig(configData) {
    const errors: string[] = []
    
    if (!configData.privacy) {
      errors.push('必须设置隐私选项')
    }
    
    if (!configData.category) {
      errors.push('必须选择视频分类')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },
  
  formatConfigForSubmit(configData) {
    const formatted = { ...configData }
    
    // 确保分类是字符串
    if (formatted.category) {
      formatted.category = String(formatted.category)
    }
    
    return formatted
  },
  
  getHints() {
    return [
      'YouTube标题限制：最多100个字符',
      '描述限制：最多5000个字符',
      '标签：最多500个字符',
      '视频时长：最长12小时'
    ]
  }
}

/**
 * TikTok平台处理器
 */
const tiktokHandler: PlatformHandler = {
  platform: 'tiktok',
  
  validateConfig() {
    return {
      valid: true,
      errors: []
    }
  },
  
  getHints() {
    return [
      'TikTok标题限制：最多100个字符',
      '视频时长：15秒-10分钟',
      '支持Duet和Stitch功能'
    ]
  }
}

/**
 * 咸鱼平台处理器
 */
const xianyuHandler: PlatformHandler = {
  platform: 'xianyu',
  
  validateConfig(configData) {
    const errors: string[] = []
    
    if (!configData.price || configData.price <= 0) {
      errors.push('必须设置有效的商品价格')
    }
    
    if (configData.originalPrice && configData.originalPrice < configData.price) {
      errors.push('原价不能低于现价')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },
  
  formatConfigForSubmit(configData) {
    const formatted = { ...configData }
    
    // 价格转换为数字
    if (formatted.price) {
      formatted.price = Number(formatted.price)
    }
    if (formatted.originalPrice) {
      formatted.originalPrice = Number(formatted.originalPrice)
    }
    
    return formatted
  },
  
  getHints() {
    return [
      '咸鱼标题限制：最多50个字符',
      '必须设置商品价格',
      '支持1-9张图片',
      '建议上传清晰的商品图片'
    ]
  },
  
  beforeSubmit(formData) {
    // 咸鱼必须有价格
    if (!formData.configData?.price) {
      throw new Error('咸鱼平台必须设置商品价格')
    }
    return formData
  }
}

/**
 * 抖店平台处理器
 */
const doudianHandler: PlatformHandler = {
  platform: 'doudian',

  validateConfig(configData) {
    const errors: string[] = []
    const copyId = typeof configData?.copyId === 'string' ? configData.copyId.trim() : ''
    const rawValue = configData?.appendImageUrls
    const vendorId = configData?.vendorId

    if (copyId && !/^\d+$/.test(copyId)) {
      errors.push('复制模板 ID 必须是数字')
    }

    if (vendorId !== undefined && vendorId !== null && vendorId !== '' && !Number.isFinite(Number(vendorId))) {
      errors.push('绑定厂家无效')
    }

    if (typeof rawValue === 'string' && rawValue.trim()) {
      const lines = rawValue
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)

      const invalidLines = lines.filter((item) => !/^https?:\/\//i.test(item))
      if (invalidLines.length > 0) {
        errors.push('附加图片只支持 http/https URL，且每行一条')
      }
    } else if (Array.isArray(rawValue)) {
      const invalidItems = rawValue
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .filter((item) => !/^https?:\/\//i.test(item))

      if (invalidItems.length > 0) {
        errors.push('附加图片只支持 http/https URL')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  },

  formatConfigForSubmit(configData) {
    const formatted = { ...configData }

    if (formatted.copyId !== undefined && formatted.copyId !== null) {
      formatted.copyId = String(formatted.copyId).trim()
    }
    if (formatted.vendorId !== undefined && formatted.vendorId !== null && formatted.vendorId !== '') {
      formatted.vendorId = Number(formatted.vendorId)
    } else {
      formatted.vendorId = undefined
    }
    if (formatted.price !== undefined && formatted.price !== null && formatted.price !== '') {
      formatted.price = Number(formatted.price)
    }
    if (formatted.stock !== undefined && formatted.stock !== null && formatted.stock !== '') {
      formatted.stock = Number(formatted.stock)
    }
    formatted.appendImageUrls = normalizeHttpUrlList(formatted.appendImageUrls)

    return formatted
  },

  formatConfigForEdit(configData) {
    const formatted = { ...configData }
    if (formatted.copyId !== undefined && formatted.copyId !== null) {
      formatted.copyId = String(formatted.copyId).trim()
    }
    if (formatted.vendorId !== undefined && formatted.vendorId !== null && formatted.vendorId !== '') {
      formatted.vendorId = Number(formatted.vendorId)
    }
    const urls = normalizeHttpUrlList(formatted.appendImageUrls)
    formatted.appendImageUrls = urls
    return formatted
  },

  getHints() {
    return [
      '支持配置抖店模板 copyId，发布端会优先进入 create?copyid=... 页面',
      '支持绑定厂家，生成商家编码时会按“素材码-厂家码”拼接',
      '当前先支持标题、描述、图片和少量可选参数透传',
      '支持附加图片，会在生成发布任务时追加到商品图片后面',
      '类目、SKU、物流模板等详细字段后续再补充'
    ]
  }
}

/**
 * 快手小店平台处理器
 */
const kuaishouShopHandler: PlatformHandler = {
  platform: 'kuaishou_shop',

  validateConfig(_configData) {
    return {
      valid: true,
      errors: []
    }
  },

  formatConfigForSubmit(configData) {
    const formatted = { ...configData }

    if (formatted.price !== undefined && formatted.price !== null && formatted.price !== '') {
      formatted.price = Number(formatted.price)
    }
    if (formatted.stock !== undefined && formatted.stock !== null && formatted.stock !== '') {
      formatted.stock = Number(formatted.stock)
    }

    return formatted
  },

  getHints() {
    return [
      '快手小店已接入基础骨架支持',
      '当前先支持标题、描述、图片和少量可选参数透传',
      '类目、SKU、物流模板等详细字段后续再补充'
    ]
  }
}

/**
 * Temu 平台处理器
 */
const temuHandler: PlatformHandler = {
  platform: 'temu',

  validateConfig(configData) {
    const errors: string[] = []

    if (!configData.price || Number(configData.price) <= 0) {
      errors.push('必须设置有效的商品价格')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  },

  formatConfigForSubmit(configData) {
    const formatted = { ...configData }

    if (formatted.price) {
      formatted.price = Number(formatted.price)
    }
    if (formatted.stock) {
      formatted.stock = Number(formatted.stock)
    }

    return formatted
  },

  getHints() {
    return [
      'Temu 标题建议：不超过60字符',
      '主图清晰、白底更佳',
      '请确保价格与库存填写准确'
    ]
  }
}

/**
 * 平台处理器注册表
 */
const PLATFORM_HANDLERS: Record<string, PlatformHandler> = {
  douyin: douyinHandler,
  kuaishou: kuaishouHandler,
  xiaohongshu: xiaohongshuHandler,
  weibo: weiboHandler,
  youtube: youtubeHandler,
  tiktok: tiktokHandler,
  xianyu: xianyuHandler,
  doudian: doudianHandler,
  kuaishou_shop: kuaishouShopHandler,
  temu: temuHandler
}

/**
 * 获取平台处理器
 */
export function getPlatformHandler(platform: string): PlatformHandler | null {
  return PLATFORM_HANDLERS[platform] || null
}

/**
 * 校验平台配置数据
 */
export function validatePlatformConfig(platform: string, configData: Record<string, any>) {
  const handler = getPlatformHandler(platform)
  if (!handler || !handler.validateConfig) {
    return { valid: true, errors: [] }
  }
  return handler.validateConfig(configData)
}

/**
 * 格式化配置数据（提交前）
 */
export function formatConfigForSubmit(platform: string, configData: Record<string, any>) {
  const handler = getPlatformHandler(platform)
  if (!handler || !handler.formatConfigForSubmit) {
    return configData
  }
  return handler.formatConfigForSubmit(configData)
}

export function formatConfigForEdit(platform: string, configData: Record<string, any>) {
  const handler = getPlatformHandler(platform)
  if (!handler || !handler.formatConfigForEdit) {
    return configData
  }
  return handler.formatConfigForEdit(configData)
}

/**
 * 获取平台提示信息
 */
export function getPlatformHints(platform: string): string[] {
  const handler = getPlatformHandler(platform)
  if (!handler || !handler.getHints) {
    return []
  }
  return handler.getHints()
}

/**
 * 执行提交前钩子
 */
export function executePlatformBeforeSubmit(platform: string, formData: any) {
  const handler = getPlatformHandler(platform)
  if (!handler || !handler.beforeSubmit) {
    return formData
  }
  return handler.beforeSubmit(formData)
}
