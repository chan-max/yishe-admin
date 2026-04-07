export type ToolWindowMode = 'fullscreen' | 'window'

export interface ToolWindowRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ToolWindowDefinition {
  key: string
  title: string
  src: string
  buildSrc?: (baseSrc: string, definition: ToolWindowDefinition) => string
  icon?: string
  singleton?: boolean
  defaultMode?: ToolWindowMode
  defaultWidth?: number
  defaultHeight?: number
  minWidth?: number
  minHeight?: number
  allowFullscreen?: boolean
  allowNewTab?: boolean
}

export interface OpenToolWindowOptions {
  title?: string
  src?: string
  mode?: ToolWindowMode
  width?: number
  height?: number
}

export interface ToolWindowInstance extends ToolWindowDefinition, ToolWindowRect {
  id: string
  hidden: boolean
  mode: ToolWindowMode
  zIndex: number
  refreshKey: number
  lastWindowRect: ToolWindowRect
}
