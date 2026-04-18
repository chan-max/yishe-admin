import { defineStore } from 'pinia'
import {
  AiAssistantApi,
  type AiAssistantChatResult,
  type AiAssistantMessage,
  type AiAssistantPageContext,
  type AiAssistantToolDefinition
} from '@/api/aiAssistant'

const unwrapPayload = <T = any>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T
  }
  return payload as T
}

const normalizeMessages = (payload: any): AiAssistantMessage[] => {
  const data = unwrapPayload<any>(payload)
  return Array.isArray(data) ? data : []
}

const normalizeTools = (payload: any): AiAssistantToolDefinition[] => {
  const data = unwrapPayload<any>(payload)
  return Array.isArray(data?.tools) ? data.tools : []
}

const normalizeChatResult = (payload: any): AiAssistantChatResult | null => {
  const data = unwrapPayload<any>(payload)
  if (!data || typeof data !== 'object' || !Array.isArray(data.messages)) {
    return null
  }
  return data as AiAssistantChatResult
}

export const useAiAssistantStore = defineStore('aiAssistant', {
  state: () => ({
    messages: [] as AiAssistantMessage[],
    tools: [] as AiAssistantToolDefinition[],
    loadingHistory: false,
    toolsLoading: false,
    sending: false,
    loadedHistory: false,
    loadedTools: false
  }),
  getters: {
    messageCount: (state) => state.messages.length
  },
  actions: {
    mergeMessages(nextMessages: AiAssistantMessage[]) {
      const messageMap = new Map<number, AiAssistantMessage>()
      ;[...this.messages, ...nextMessages].forEach((item) => {
        if (!item || typeof item.id !== 'number') {
          return
        }
        messageMap.set(item.id, item)
      })
      this.messages = Array.from(messageMap.values()).sort((left, right) => left.id - right.id)
    },

    async loadMessages(force = false) {
      if (this.loadingHistory) {
        return
      }
      if (this.loadedHistory && !force) {
        return
      }

      this.loadingHistory = true
      try {
        const payload = await AiAssistantApi.getMessages()
        this.messages = normalizeMessages(payload)
        this.loadedHistory = true
      } finally {
        this.loadingHistory = false
      }
    },

    async loadTools(force = false) {
      if (this.toolsLoading) {
        return
      }
      if (this.loadedTools && !force) {
        return
      }

      this.toolsLoading = true
      try {
        const payload = await AiAssistantApi.getTools()
        this.tools = normalizeTools(payload)
        this.loadedTools = true
      } finally {
        this.toolsLoading = false
      }
    },

    async clearMessages() {
      await AiAssistantApi.clearMessages()
      this.messages = []
      this.loadedHistory = true
    },

    async sendMessage(message: string, pageContext?: AiAssistantPageContext) {
      this.sending = true
      try {
        const payload = await AiAssistantApi.chat(message, pageContext)
        const result = normalizeChatResult(payload)
        if (result?.messages?.length) {
          this.mergeMessages(result.messages)
        } else {
          await this.loadMessages(true)
        }
        this.loadedHistory = true
        return result
      } finally {
        this.sending = false
      }
    }
  }
})
