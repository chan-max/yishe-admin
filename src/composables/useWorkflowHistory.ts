import { ref, type Ref } from 'vue'
import type { Node, Edge } from '@vue-flow/core'

/**
 * 画布快照
 */
interface CanvasSnapshot {
  nodes: Node[]
  edges: Edge[]
  timestamp: number
}

/**
 * 工作流编辑器撤销/重做历史管理
 * 使用快照栈实现，最多保留 50 步历史
 */
export function useWorkflowHistory(
  nodes: Ref<Node[]>,
  edges: Ref<Edge[]>,
  setNodes: (nodes: Node[]) => void,
  setEdges: (edges: Edge[]) => void
) {
  const undoStack = ref<CanvasSnapshot[]>([])
  const redoStack = ref<CanvasSnapshot[]>([])
  const maxHistory = 50
  const isInternalChange = ref(false)

  /**
   * 保存当前状态到历史栈（撤销前调用）
   */
  const pushHistory = () => {
    // 内部操作（撤销/重做）不记录历史
    if (isInternalChange.value) return

    const snapshot: CanvasSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
      timestamp: Date.now(),
    }

    undoStack.value.push(snapshot)

    // 超出限制时丢弃最旧的历史
    if (undoStack.value.length > maxHistory) {
      undoStack.value.shift()
    }

    // 新的操作会清空重做栈
    redoStack.value = []
  }

  /**
   * 撤销操作
   */
  const undo = () => {
    if (undoStack.value.length === 0) return

    // 保存当前状态到重做栈
    const currentSnapshot: CanvasSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
      timestamp: Date.now(),
    }
    redoStack.value.push(currentSnapshot)

    // 恢复到上一个历史状态
    const prevSnapshot = undoStack.value.pop()!
    isInternalChange.value = true
    setNodes(JSON.parse(JSON.stringify(prevSnapshot.nodes)))
    setEdges(JSON.parse(JSON.stringify(prevSnapshot.edges)))

    // 延迟重置标志，确保 VueFlow 完成更新
    setTimeout(() => {
      isInternalChange.value = false
    }, 50)
  }

  /**
   * 重做操作
   */
  const redo = () => {
    if (redoStack.value.length === 0) return

    // 保存当前状态到撤销栈
    const currentSnapshot: CanvasSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
      timestamp: Date.now(),
    }
    undoStack.value.push(currentSnapshot)

    // 恢复到下一个历史状态
    const nextSnapshot = redoStack.value.pop()!
    isInternalChange.value = true
    setNodes(JSON.parse(JSON.stringify(nextSnapshot.nodes)))
    setEdges(JSON.parse(JSON.stringify(nextSnapshot.edges)))

    setTimeout(() => {
      isInternalChange.value = false
    }, 50)
  }

  /**
   * 清空历史
   */
  const clearHistory = () => {
    undoStack.value = []
    redoStack.value = []
  }

  return {
    undo,
    redo,
    pushHistory,
    clearHistory,
    canUndo: () => undoStack.value.length > 0,
    canRedo: () => redoStack.value.length > 0,
    undoStack,
    redoStack,
  }
}
