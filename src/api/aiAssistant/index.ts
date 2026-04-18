import request from '@/config/axios'

export interface AiAssistantPageContext {
  routePath?: string
  fullPath?: string
  routeName?: string
  routeTitle?: string
  query?: Record<string, any>
  params?: Record<string, any>
}

export interface AiAssistantToolDefinition {
  name: string
  label: string
  description: string
  category: string
  readOnly: boolean
  runtime: string
  inputSchema: Record<string, any>
  examples?: string[]
}

export interface AiAssistantMessage {
  id: number
  role: 'user' | 'assistant' | 'tool'
  content: string
  routePath: string | null
  routeTitle: string | null
  pageContext: AiAssistantPageContext | null
  toolKey: string | null
  toolLabel: string | null
  toolInput: Record<string, any> | null
  toolResult: Record<string, any> | null
  createdAt: string
}

export interface AiAssistantChatResult {
  reply: string
  toolCalls: Array<{
    tool: string
    reason: string
    input: Record<string, any>
  }>
  messages: AiAssistantMessage[]
}

export const AiAssistantApi = {
  getMessages: async (limit = 80) => {
    return request.get<AiAssistantMessage[]>({
      url: '/ai-assistant/messages',
      params: {
        limit
      }
    })
  },

  clearMessages: async () => {
    return request.delete({
      url: '/ai-assistant/messages'
    })
  },

  getTools: async () => {
    return request.get<{
      tools: AiAssistantToolDefinition[]
    }>({
      url: '/ai-assistant/tools'
    })
  },

  chat: async (message: string, pageContext?: AiAssistantPageContext) => {
    return request.post<AiAssistantChatResult>({
      url: '/ai-assistant/chat',
      data: {
        message,
        pageContext
      }
    })
  }
}
