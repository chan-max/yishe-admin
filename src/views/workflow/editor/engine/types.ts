export type NodeRunStatus = 'idle' | 'running' | 'success' | 'error' | 'skipped'

export interface ExecutionLog {
  nodeId: string
  nodeLabel: string
  status: NodeRunStatus
  startTime: number
  endTime?: number
  durationMs?: number
  inputs?: Record<string, any>
  outputs?: Record<string, any>
  error?: string
}

export interface WorkflowExecutionContext {
  workflowId: string
  workflowName: string
  nodes: any[]
  edges: any[]
  // 已计算完成节点的输出 Map: nodeId -> { fieldName: value }
  nodeOutputs: Map<string, Record<string, any>>
  // 运行日志记录
  logs: ExecutionLog[]
  // 全局可访问触发变量
  globalInputs: Record<string, any>
}

export interface NodeExecutionResult {
  success: boolean
  outputs?: Record<string, any>
  error?: string
}
