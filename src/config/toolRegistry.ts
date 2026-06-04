import type { ToolWindowDefinition } from '@/types/toolWindow'
import { getAccessToken, getTenantId } from '@/utils/auth'

const normalizeEmbeddedToken = (tokenValue: unknown) => {
  const normalizedValue = String(tokenValue || '').trim()
  if (!normalizedValue) {
    return ''
  }

  return normalizedValue.replace(/^Bearer\s+/i, '').trim()
}

const resolveDesignToolUrl = () => {
  const configuredUrl = String(import.meta.env.VITE_YISHE_TOOL_URL || '').trim()
  if (configuredUrl) {
    return configuredUrl
  }

  return import.meta.env.DEV ? 'http://localhost:1522' : ''
}

const buildEmbeddedToolUrl = (baseSrc: string) => {
  if (!baseSrc) {
    return ''
  }

  const token = normalizeEmbeddedToken(getAccessToken())
  const tenantId = String(getTenantId() || '').trim()

  try {
    const parsedUrl = new URL(baseSrc, window.location.origin)
    parsedUrl.searchParams.set('embed', 'admin')
    if (token) {
      parsedUrl.searchParams.set('token', token)
    }
    if (tenantId) {
      parsedUrl.searchParams.set('tenantId', tenantId)
    }
    return parsedUrl.toString()
  } catch (error) {
    console.warn('构建工具地址失败，回退到原始地址', error)
    return baseSrc
  }
}

export const toolRegistry: Record<string, ToolWindowDefinition> = {
  designTool: {
    key: 'designTool',
    title: '设计工具',
    icon: 'ep:monitor',
    src: resolveDesignToolUrl(),
    buildSrc: buildEmbeddedToolUrl,
    singleton: true,
    defaultMode: 'fullscreen',
    defaultWidth: 1220,
    defaultHeight: 760,
    minWidth: 820,
    minHeight: 520,
    allowFullscreen: true,
    allowNewTab: true,
  },
  // === 内置组件工具 ===
  calculator: {
    key: 'calculator',
    title: '计算器',
    icon: 'ep:document-copy',
    component: () => import('@/components/ToolWindowHost/tools/Calculator.vue'),
    defaultMode: 'window',
    defaultWidth: 280,
    defaultHeight: 460,
    minWidth: 260,
    minHeight: 360,
    allowFullscreen: false,
    allowNewTab: false,
    singleton: true,
  },
}

export const toolRegistryList = Object.values(toolRegistry)

export const getToolDefinition = (key: string) => toolRegistry[key]
