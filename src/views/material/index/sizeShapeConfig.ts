/**
 * 图片尺寸形状配置
 * 用于素材搜索、展示等场景
 */

export type SizeShapeGroup = 'square' | 'landscape' | 'portrait'

export interface SizeShapeConfig {
  key: string // 后端对应的key值
  label: string // 中文名称
  ratio: string // 比例描述
  ratioMin: number // 最小宽高比
  ratioMax: number // 最大宽高比
  group: SizeShapeGroup // 分组
  thumbWidth: number // 缩略图宽度（px）
  thumbHeight: number // 缩略图高度（px）
}

/**
 * 所有尺寸形状配置
 * 按照后端 sticker.service.ts 中的定义保持一致
 */
export const SIZE_SHAPE_CONFIGS: SizeShapeConfig[] = [
  // 正方形
  {
    key: 'square',
    label: '正方图',
    ratio: '0.95:1 - 1.05:1',
    ratioMin: 0.95,
    ratioMax: 1.05,
    group: 'square',
    thumbWidth: 24,
    thumbHeight: 24,
  },
  
  // 横图（宽>高）
  {
    key: 'slightly-wide',
    label: '微宽图',
    ratio: '1.05:1 - 1.3:1',
    ratioMin: 1.05,
    ratioMax: 1.3,
    group: 'landscape',
    thumbWidth: 50,
    thumbHeight: 42, // 约1.2:1
  },
  {
    key: 'wide',
    label: '宽图',
    ratio: '1.3:1 - 1.6:1',
    ratioMin: 1.3,
    ratioMax: 1.6,
    group: 'landscape',
    thumbWidth: 54,
    thumbHeight: 38, // 约1.42:1
  },
  {
    key: 'very-wide',
    label: '很宽图',
    ratio: '1.6:1 - 2:1',
    ratioMin: 1.6,
    ratioMax: 2.0,
    group: 'landscape',
    thumbWidth: 56,
    thumbHeight: 31, // 约1.8:1
  },
  {
    key: 'ultra-wide',
    label: '超宽图',
    ratio: '2:1 - 3:1',
    ratioMin: 2.0,
    ratioMax: 3.0,
    group: 'landscape',
    thumbWidth: 60,
    thumbHeight: 24, // 约2.5:1
  },
  {
    key: 'extreme-wide',
    label: '极宽图',
    ratio: '≥3:1',
    ratioMin: 3.0,
    ratioMax: Infinity,
    group: 'landscape',
    thumbWidth: 64,
    thumbHeight: 18, // 约3.5:1
  },
  
  // 竖图（高>宽）
  {
    key: 'slightly-long',
    label: '微长图',
    ratio: '1:1.05 - 1:1.3',
    ratioMin: 1 / 1.3,
    ratioMax: 1 / 1.05,
    group: 'portrait',
    thumbWidth: 42,
    thumbHeight: 50, // 约1:1.2
  },
  {
    key: 'long',
    label: '长图',
    ratio: '1:1.3 - 1:1.6',
    ratioMin: 1 / 1.6,
    ratioMax: 1 / 1.3,
    group: 'portrait',
    thumbWidth: 38,
    thumbHeight: 54, // 约1:1.42
  },
  {
    key: 'very-long',
    label: '很长图',
    ratio: '1:1.6 - 1:2',
    ratioMin: 1 / 2.0,
    ratioMax: 1 / 1.6,
    group: 'portrait',
    thumbWidth: 31,
    thumbHeight: 56, // 约1:1.8
  },
  {
    key: 'ultra-long',
    label: '超长图',
    ratio: '1:2 - 1:3',
    ratioMin: 1 / 3.0,
    ratioMax: 1 / 2.0,
    group: 'portrait',
    thumbWidth: 24,
    thumbHeight: 60, // 约1:2.5
  },
  {
    key: 'extreme-long',
    label: '极长图',
    ratio: '≤1:3',
    ratioMin: 0,
    ratioMax: 1 / 3.0,
    group: 'portrait',
    thumbWidth: 18,
    thumbHeight: 64, // 约1:3.5
  },
]

/**
 * 按分组获取尺寸配置
 */
export const SIZE_SHAPE_GROUPS = {
  square: SIZE_SHAPE_CONFIGS.filter(c => c.group === 'square'),
  landscape: SIZE_SHAPE_CONFIGS.filter(c => c.group === 'landscape'),
  portrait: SIZE_SHAPE_CONFIGS.filter(c => c.group === 'portrait'),
}

/**
 * UI 扩展：按分组定义颜色
 * 可用于前端不同页面（素材、PSD 模板等）的统一展示
 */
export const SIZE_SHAPE_GROUP_COLORS: Record<SizeShapeGroup, string> = {
  square: '#409EFF',
  landscape: '#67C23A',
  portrait: '#E6A23C',
}

export interface SizeShapeUiConfig extends SizeShapeConfig {
  color: string
  shape: SizeShapeGroup
}

function mapToUiConfig(c: SizeShapeConfig): SizeShapeUiConfig {
  return {
    ...c,
    color: SIZE_SHAPE_GROUP_COLORS[c.group],
    shape: c.group,
  }
}

export const SIZE_SHAPE_UI_CONFIGS: SizeShapeUiConfig[] = SIZE_SHAPE_CONFIGS.map(mapToUiConfig)

export const SIZE_SHAPE_UI_GROUPS = {
  square: SIZE_SHAPE_GROUPS.square.map(mapToUiConfig),
  landscape: SIZE_SHAPE_GROUPS.landscape.map(mapToUiConfig),
  portrait: SIZE_SHAPE_GROUPS.portrait.map(mapToUiConfig),
}

/**
 * 根据key获取配置
 */
export function getSizeShapeConfig(key: string): SizeShapeConfig | undefined {
  return SIZE_SHAPE_CONFIGS.find(c => c.key === key)
}

/**
 * 根据 key 获取 UI 扩展配置
 */
export function getSizeShapeUiConfig(key: string): SizeShapeUiConfig | undefined {
  return SIZE_SHAPE_UI_CONFIGS.find(c => c.key === key)
}

/**
 * 根据宽高比获取最匹配的尺寸形状
 */
export function getSizeShapeByRatio(aspectRatio: number): SizeShapeConfig | undefined {
  return SIZE_SHAPE_CONFIGS.find(c => 
    aspectRatio >= c.ratioMin && aspectRatio <= c.ratioMax
  )
}

/**
 * 生成完整的label（包含比例和key）
 */
export function getFullLabel(config: SizeShapeConfig): string {
  return `${config.label} (${config.ratio}) [${config.key}]`
}
