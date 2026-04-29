import { resolveTaskTypePlatform } from '../platform-configs'
import type { PlatformHandler } from './types'
import { douyinHandler } from './douyin'
import { kuaishouHandler } from './kuaishou'
import { xiaohongshuHandler } from './xiaohongshu'
import { weiboHandler } from './weibo'
import { youtubeHandler } from './youtube'
import { tiktokHandler } from './tiktok'
import { xianyuHandler } from './xianyu'
import { doudianHandler } from './doudian'
import { kuaishouShopHandler } from './kuaishou-shop'
import { temuHandler } from './temu'
import { taobaoHandler } from './taobao'

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
  temu: temuHandler,
  taobao: taobaoHandler
}

export type { PlatformHandler } from './types'
export { douyinHandler } from './douyin'
export { kuaishouHandler } from './kuaishou'
export { xiaohongshuHandler } from './xiaohongshu'
export { weiboHandler } from './weibo'
export { youtubeHandler } from './youtube'
export { tiktokHandler } from './tiktok'
export { xianyuHandler } from './xianyu'
export { doudianHandler } from './doudian'
export { kuaishouShopHandler } from './kuaishou-shop'
export { temuHandler } from './temu'
export { taobaoHandler } from './taobao'

export function getPlatformHandler(platform: string): PlatformHandler | null {
  return PLATFORM_HANDLERS[platform] || null
}

export function validatePlatformConfig(platform: string, configData: Record<string, any>) {
  const handler = getPlatformHandler(platform)
  if (!handler || !handler.validateConfig) {
    return { valid: true, errors: [] }
  }
  return handler.validateConfig(configData)
}

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

export function getPlatformHints(platform: string): string[] {
  const handler = getPlatformHandler(platform)
  if (!handler || !handler.getHints) {
    return []
  }
  return handler.getHints()
}

export function executePlatformBeforeSubmit(platform: string, formData: any) {
  const handler = getPlatformHandler(platform)
  if (!handler || !handler.beforeSubmit) {
    return formData
  }
  return handler.beforeSubmit(formData)
}

function resolveHandlerTaskPlatform(taskType: string): string {
  return resolveTaskTypePlatform(taskType)
}

export function validateTaskTypeConfig(taskType: string, configData: Record<string, any>) {
  return validatePlatformConfig(resolveHandlerTaskPlatform(taskType), configData)
}

export function formatTaskTypeConfigForSubmit(taskType: string, configData: Record<string, any>) {
  return formatConfigForSubmit(resolveHandlerTaskPlatform(taskType), configData)
}

export function formatTaskTypeConfigForEdit(taskType: string, configData: Record<string, any>) {
  return formatConfigForEdit(resolveHandlerTaskPlatform(taskType), configData)
}

export function executeTaskTypeBeforeSubmit(taskType: string, formData: any) {
  return executePlatformBeforeSubmit(resolveHandlerTaskPlatform(taskType), formData)
}

export function getTaskTypeHints(taskType: string): string[] {
  return getPlatformHints(resolveHandlerTaskPlatform(taskType))
}
