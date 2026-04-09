import { PUBLISH_TASK_TYPE_PREFIX, derivePublishTaskTypeByPlatform, getTaskTypeLabel } from '@/config/task-types'
import { HIDDEN_TASK_CONFIG_PLATFORMS } from './shared'
import { douyinPlatformConfig } from './douyin'
import { kuaishouPlatformConfig } from './kuaishou'
import { xiaohongshuPlatformConfig } from './xiaohongshu'
import { weiboPlatformConfig } from './weibo'
import { youtubePlatformConfig } from './youtube'
import { tiktokPlatformConfig } from './tiktok'
import { doudianPlatformConfig } from './doudian'
import { kuaishouShopPlatformConfig } from './kuaishou-shop'
import { xianyuPlatformConfig } from './xianyu'
import { temuPlatformConfig } from './temu'
import type { PlatformConfig, TaskTypeConfig } from './types'

export type { FieldConfig, PlatformConfig, TaskTypeConfig } from './types'
export { HIDDEN_TASK_CONFIG_PLATFORMS } from './shared'
export { douyinPlatformConfig } from './douyin'
export { kuaishouPlatformConfig } from './kuaishou'
export { xiaohongshuPlatformConfig } from './xiaohongshu'
export { weiboPlatformConfig } from './weibo'
export { youtubePlatformConfig } from './youtube'
export { tiktokPlatformConfig } from './tiktok'
export { doudianPlatformConfig } from './doudian'
export { kuaishouShopPlatformConfig } from './kuaishou-shop'
export { xianyuPlatformConfig } from './xianyu'
export { temuPlatformConfig } from './temu'

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  douyin: douyinPlatformConfig,
  kuaishou: kuaishouPlatformConfig,
  xiaohongshu: xiaohongshuPlatformConfig,
  weibo: weiboPlatformConfig,
  youtube: youtubePlatformConfig,
  tiktok: tiktokPlatformConfig,
  doudian: doudianPlatformConfig,
  kuaishou_shop: kuaishouShopPlatformConfig,
  xianyu: xianyuPlatformConfig,
  temu: temuPlatformConfig
}

export function getPlatformConfig(platform: string): PlatformConfig | null {
  return PLATFORM_CONFIGS[platform] || null
}

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

export function resolveTaskTypePlatform(taskType: string): string {
  const normalizedTaskType = String(taskType || '').trim()
  if (!normalizedTaskType.startsWith(PUBLISH_TASK_TYPE_PREFIX)) {
    return ''
  }
  return normalizedTaskType.slice(PUBLISH_TASK_TYPE_PREFIX.length)
}

export function getTaskTypeConfig(taskType: string): TaskTypeConfig | null {
  const platform = resolveTaskTypePlatform(taskType)
  const platformConfig = getPlatformConfig(platform)
  if (!platformConfig) {
    return null
  }

  return {
    ...platformConfig,
    taskType,
    taskKind: 'publish-product',
    label: getTaskTypeLabel(taskType, platform),
    platformLabel: platformConfig.label
  }
}

export function getTaskTypeDefaultData(taskType: string): Record<string, any> {
  const platform = resolveTaskTypePlatform(taskType)
  return getPlatformDefaultData(platform)
}

export function getAllTaskTypes() {
  return Object.values(PLATFORM_CONFIGS)
    .filter((config) => !HIDDEN_TASK_CONFIG_PLATFORMS.has(config.platform))
    .map((config) => {
      const taskType = derivePublishTaskTypeByPlatform(config.platform)
      return {
        label: getTaskTypeLabel(taskType, config.platform),
        value: taskType,
        platform: config.platform,
        taskKind: 'publish-product' as const
      }
    })
}
