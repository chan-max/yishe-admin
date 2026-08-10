import { ref, type Ref } from 'vue'
import type { Node, Edge } from '@vue-flow/core'

/**
 * 画布清理：移除 VueFlow 运行时属性，只保留业务数据
 * 避免保存大量无用数据到服务器
 */
export function cleanCanvasData(nodes: Node[], edges: Edge[]) {
  const cleanNodes = nodes.map((node) => {
    // 移除 VueFlow 运行时属性
    const {
      selected: _selected,
      dragging: _dragging,
      positionAbsolute: _posAbs,
      computedWidth: _cWidth,
      computedHeight: _cHeight,
      handleBounds: _handleBounds,
      ...cleanNode
    } = node as any

    return cleanNode
  })

  const cleanEdges = edges.map((edge) => {
    const {
      selected: _selected,
      interactionWidth: _interactionWidth,
      ...cleanEdge
    } = edge as any

    return cleanEdge
  })

  return { nodes: cleanNodes, edges: cleanEdges }
}

/**
 * 智能保存管理
 * - 防抖保存（避免频繁请求）
 * - 只保存有意义的变更（内容未变不保存）
 * - 清理运行时数据
 */
export function useSmartSave(
  nodes: Ref<Node[]>,
  edges: Ref<Edge[]>,
  getViewport: () => { x: number; y: number; zoom: number },
  saveFn: (canvas: { nodes: any[]; edges: any[]; viewport: any }) => Promise<void>,
  options: {
    debounceMs?: number
    maxRetries?: number
  } = {}
) {
  const { debounceMs = 2000, maxRetries = 3 } = options

  const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')
  const lastSavedHash = ref('')
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let retryCount = 0

  /**
   * 生成画布内容的 hash 用于比对
   */
  const computeHash = (): string => {
    const { nodes: cleanNodes, edges: cleanEdges } = cleanCanvasData(nodes.value, edges.value)
    const viewport = getViewport()
    const data = JSON.stringify({
      nodes: cleanNodes.map((n) => ({ id: n.id, type: n.type, pos: n.position, data: n.data })),
      edges: cleanEdges.map((e) => ({ id: e.id, s: e.source, t: e.target })),
      vp: viewport,
    })
    // 简单 hash
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash + char) | 0
    }
    return hash.toString(36)
  }

  /**
   * 立即保存
   */
  const saveNow = async () => {
    if (saveStatus.value === 'saving') return

    const { nodes: cleanNodes, edges: cleanEdges } = cleanCanvasData(nodes.value, edges.value)
    const viewport = getViewport()

    saveStatus.value = 'saving'

    try {
      await saveFn({
        nodes: cleanNodes,
        edges: cleanEdges,
        viewport,
      })
      lastSavedHash.value = computeHash()
      retryCount = 0
      saveStatus.value = 'saved'
    } catch (err) {
      saveStatus.value = 'unsaved'
      throw err
    }
  }

  /**
   * 触发防抖保存
   * 只有内容真正变化时才发起保存
   */
  const triggerSave = () => {
    // 清除之前的定时器
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // 检查内容是否真的变化了
    const currentHash = computeHash()
    if (currentHash === lastSavedHash.value && saveStatus.value === 'saved') {
      return // 内容未变，跳过保存
    }

    saveStatus.value = 'unsaved'

    debounceTimer = setTimeout(async () => {
      try {
        await saveNow()
      } catch (err: any) {
        // 重试逻辑
        if (retryCount < maxRetries) {
          retryCount++
          setTimeout(() => triggerSave(), 1000 * retryCount)
        }
      }
    }, debounceMs)
  }

  /**
   * 取消待执行的保存
   */
  const cancelSave = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  return {
    saveStatus,
    saveNow,
    triggerSave,
    cancelSave,
    cleanCanvasData,
  }
}
