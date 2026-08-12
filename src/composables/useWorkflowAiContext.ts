import { ref, computed } from 'vue'

/** 当前工作流 AI 上下文 */
const workflowContext = ref<{
  workflowId: string
  workflowName?: string
  canvas: { nodes: any[]; edges: any[] }
} | null>(null)

/**
 * 工作流 AI 上下文 composable
 * - 工作流编辑器设置当前上下文
 * - AI 助手读取上下文并随消息发送
 */
export function useWorkflowAiContext() {
  /** 设置当前工作流上下文（由编辑器调用） */
  function setWorkflowContext(ctx: typeof workflowContext.value) {
    workflowContext.value = ctx
  }

  /** 清除工作流上下文 */
  function clearWorkflowContext() {
    workflowContext.value = null
  }

  /** 当前是否有工作流上下文 */
  const hasWorkflowContext = computed(() => !!workflowContext.value)

  return {
    workflowContext,
    setWorkflowContext,
    clearWorkflowContext,
    hasWorkflowContext,
  }
}
