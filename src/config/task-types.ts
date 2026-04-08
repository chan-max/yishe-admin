/**
 * 任务类型配置（任务队列）
 * 固定所有任务类型，方便查询和维护，后续有需要再添加
 */
export const TASK_TYPE_OPTIONS = [
  // 发布商品 - 各平台
  { label: '发布商品-抖音', value: 'publish-product-douyin' },
  { label: '发布商品-小红书', value: 'publish-product-xiaohongshu' },
  { label: '发布商品-微博', value: 'publish-product-weibo' },
  { label: '发布商品-YouTube', value: 'publish-product-youtube' },
  { label: '发布商品-快手', value: 'publish-product-kuaishou' },
  { label: '发布商品-咸鱼', value: 'publish-product-xianyu' },
  { label: '发布商品-抖店', value: 'publish-product-doudian' },
  { label: '发布商品-快手小店', value: 'publish-product-kuaishou_shop' },
  { label: '发布商品-B站', value: 'publish-product-bilibili' },
  { label: '发布商品-知乎', value: 'publish-product-zhihu' },
  { label: '发布商品-TikTok', value: 'publish-product-tiktok' },
  { label: '发布商品-Temu', value: 'publish-product-temu' },
  { label: '发布商品-淘宝', value: 'publish-product-taobao' },
  // 后续可在此添加更多任务类型
] as const

export type TaskTypeValue = (typeof TASK_TYPE_OPTIONS)[number]['value']

export const PUBLISH_TASK_TYPE_PREFIX = 'publish-product-'

export const TASK_TYPE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  TASK_TYPE_OPTIONS.map((item) => [item.value, item.label])
)

export const PLATFORM_LABEL_MAP: Record<string, string> = {
  douyin: '抖音',
  kuaishou: '快手',
  xiaohongshu: '小红书',
  weibo: '微博',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  doudian: '抖店',
  kuaishou_shop: '快手小店',
  xianyu: '咸鱼',
  bilibili: 'B站',
  zhihu: '知乎',
  temu: 'Temu',
  taobao: '淘宝'
}

export function resolveTaskTypePlatform(taskType?: string): string {
  const normalizedTaskType = String(taskType || '').trim()
  if (!normalizedTaskType.startsWith(PUBLISH_TASK_TYPE_PREFIX)) {
    return ''
  }
  return normalizedTaskType.slice(PUBLISH_TASK_TYPE_PREFIX.length)
}

export function derivePublishTaskTypeByPlatform(platform?: string): string {
  const normalizedPlatform = String(platform || '').trim()
  if (!normalizedPlatform) {
    return ''
  }
  return `${PUBLISH_TASK_TYPE_PREFIX}${normalizedPlatform}`
}

export function getTaskTypeLabel(taskType?: string, fallbackPlatform?: string): string {
  const normalizedTaskType = String(taskType || '').trim()
  if (normalizedTaskType && TASK_TYPE_LABEL_MAP[normalizedTaskType]) {
    return TASK_TYPE_LABEL_MAP[normalizedTaskType]
  }

  const resolvedPlatform = resolveTaskTypePlatform(normalizedTaskType) || String(fallbackPlatform || '').trim()
  if (!resolvedPlatform) {
    return normalizedTaskType || '-'
  }

  return `发布商品-${PLATFORM_LABEL_MAP[resolvedPlatform] || resolvedPlatform}`
}
