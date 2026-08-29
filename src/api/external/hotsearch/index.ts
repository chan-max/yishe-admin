/**
 * 热搜采集 API
 * 支持服务端执行模式
 */
import request from '@/config/axios'

/**
 * 插件 Key → 服务端能力类型 映射
 * 热搜平台的 pluginKey 与服务端 node-capabilities 的 type 可能不一致，需要转换
 */
const PLUGIN_KEY_TO_CAPABILITY_TYPE: Record<string, string> = {
  douyin: 'hotsearch_douyin',
  // 未来可扩展其他平台，如：
  // weibo: 'hotsearch_weibo',
  // bilibili: 'hotsearch_bilibili',
}

/**
 * 服务端执行节点能力
 * 用于支持服务端执行的节点（如抖音热搜）
 */
export const executeNodeCapability = (pluginKey: string, params?: Record<string, any>) => {
  const capabilityType = PLUGIN_KEY_TO_CAPABILITY_TYPE[pluginKey] || pluginKey
  return request.post<{ success: boolean; data: any }>({
    url: `/workflow/node-capabilities/${capabilityType}/execute`,
    data: { params: params || {} },
  })
}

/**
 * 检查节点是否支持服务端执行
 */
export const supportsServerExecution = (pluginKey: string): boolean => {
  return pluginKey in PLUGIN_KEY_TO_CAPABILITY_TYPE
}
