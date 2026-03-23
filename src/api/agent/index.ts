import request from '@/config/axios'

export interface AgentToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, any>
}

export interface AgentAssetResultItem {
  id: string
  title: string
  description: string
  imageUrl: string
  originUrl?: string
  sourceType: 'sticker'
  sourceLabel: string
  sourcePlatform?: string
  suffix?: string
  keywords?: string
  width?: number | null
  height?: number | null
  createdAt?: string
}

export interface AgentExecutionPlan {
  stepId?: string
  tool: string
  confidence: number
  reason: string
  message?: string
  input?: Record<string, any>
}

export interface AgentToolExecutionResult {
  stepId: string
  tool: string
  success: boolean
  reason?: string
  input?: Record<string, any>
  data: Record<string, any> | null
  error?: string
}

export interface AgentExecuteResponse {
  success: boolean
  status?: string
  executable?: boolean
  plans: AgentExecutionPlan[]
  reply: string
  toolResults: AgentToolExecutionResult[]
}

export interface AgentToolsResponse {
  success: boolean
  tools: AgentToolDefinition[]
}

export interface AgentExecuteToolResponse {
  success: boolean
  tool: string
  toolResult: Record<string, any> | null
}

export const AgentApi = {
  executeInstruction: async (instruction: string, context?: Record<string, any>) => {
    return request.post<AgentExecuteResponse>({
      url: '/agent/execute',
      data: {
        instruction,
        context
      }
    })
  },

  getTools: async () => {
    return request.get<AgentToolsResponse>({
      url: '/agent/tools'
    })
  },

  executeTool: async (tool: string, input: Record<string, any>) => {
    return request.post<AgentExecuteToolResponse>({
      url: '/agent/tools/execute',
      data: {
        tool,
        input
      }
    })
  }
}
