export interface LoadingTemplate {
  key: string
  name: string
  desc: string
}

// 内置加载动画模版（写死在代码里，新增模版在此注册即可，
// 样式需在 src/styles/_loading.scss 中对应添加 @include）。
export const LOADING_TEMPLATES: LoadingTemplate[] = [
  { key: 'ring', name: '环形', desc: '单环旋转，简洁默认' },
  { key: 'dual-ring', name: '双环', desc: '内外双环反向旋转' },
  { key: 'ripple', name: '涟漪', desc: '脉冲圆环扩散' },
  { key: 'dots', name: '三点', desc: '三点跳动' },
  { key: 'bars', name: '跳动条', desc: '等宽竖条起伏' },
]

export const DEFAULT_LOADING_STYLE = 'ring'

export const isValidLoadingStyle = (key: string): boolean =>
  LOADING_TEMPLATES.some((t) => t.key === key)
