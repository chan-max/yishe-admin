import request from '@/config/axios'

export interface ApiEnvelope<T> {
  data: T
  code: number
  message: string
  status: boolean
}

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
  tool: string
  confidence: number
  reason: string
  message?: string
  input?: Record<string, any>
}

export interface AgentExecuteResponse {
  success: boolean
  plan: AgentExecutionPlan
  reply: string
  toolResult: null | {
    items: AgentAssetResultItem[]
    count: number
    query: string
  }
}

export interface AgentToolsResponse {
  success: boolean
  tools: AgentToolDefinition[]
}

export interface AgentExecuteToolResponse {
  success: boolean
  tool: string
  toolResult: null | {
    items: AgentAssetResultItem[]
    count: number
    query: string
  }
}

export const AgentApi = {
  executeInstruction: async (instruction: string, context?: Record<string, any>) => {
    const response = await request.post<ApiEnvelope<AgentExecuteResponse>>({
      url: '/agent/execute',
      data: {
        instruction,
        context
      }
    })
    return response.data
  },

  getTools: async () => {
    const response = await request.get<ApiEnvelope<AgentToolsResponse>>({
      url: '/agent/tools'
    })
    return response.data
  },

  executeTool: async (tool: string, input: Record<string, any>) => {
    const response = await request.post<ApiEnvelope<AgentExecuteToolResponse>>({
      url: '/agent/tools/execute',
      data: {
        tool,
        input
      }
    })
    return response.data
  }
}
