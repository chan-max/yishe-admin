/**
 * 任务类型配置（任务队列）
 * 固定所有任务类型，方便查询和维护，后续有需要再添加
 */
export const TASK_TYPE_OPTIONS = [
  // 发布商品 - 各平台
  { label: '发布商品-抖音', value: 'publish-product-douyin' },
  { label: '发布商品-小红书', value: 'publish-product-xiaohongshu' },
  { label: '发布商品-微博', value: 'publish-product-weibo' },
  { label: '发布商品-快手', value: 'publish-product-kuaishou' },
  { label: '发布商品-B站', value: 'publish-product-bilibili' },
  { label: '发布商品-知乎', value: 'publish-product-zhihu' },
  { label: '发布商品-TikTok', value: 'publish-product-tiktok' },
  { label: '发布商品-Temu', value: 'publish-product-temu' },
  { label: '发布商品-淘宝', value: 'publish-product-taobao' },
  // 后续可在此添加更多任务类型
] as const

export type TaskTypeValue = (typeof TASK_TYPE_OPTIONS)[number]['value']
