import { ElMessage } from 'element-plus'
import type { OpenToolWindowOptions, ToolWindowDefinition } from '@/types/toolWindow'
import { getToolDefinition, toolRegistryList } from '@/config/toolRegistry'
import { useToolWindowStoreWithOut } from '@/store/modules/toolWindow'

const hasUsableToolSrc = (src?: string) => !!String(src || '').trim()

export const getAvailableToolRegistryList = () => toolRegistryList

export const openToolWindow = (
  tool: string | ToolWindowDefinition,
  options?: OpenToolWindowOptions
) => {
  const resolved = typeof tool === 'string' ? getToolDefinition(tool) : tool
  if (!resolved) {
    ElMessage.warning('未找到对应的工具配置')
    return null
  }

  // 组件工具不需要 src，直接打开
  if (resolved.component) {
    const store = useToolWindowStoreWithOut()
    return store.openWindow(resolved, options)
  }

  const nextSrc = options?.src || resolved.src
  if (!hasUsableToolSrc(nextSrc)) {
    ElMessage.warning(`工具"${resolved.title}"尚未配置地址`)
    return null
  }

  const store = useToolWindowStoreWithOut()
  return store.openWindow(resolved, options)
}

export const closeToolWindow = (id: string) => {
  useToolWindowStoreWithOut().hideWindow(id)
}
