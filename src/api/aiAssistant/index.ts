import request from "@/config/axios";

export interface AiAssistantPageContext {
  routePath?: string;
  fullPath?: string;
  routeName?: string;
  routeTitle?: string;
  query?: Record<string, any>;
  params?: Record<string, any>;
}

export interface AiAssistantConversation {
  id: number;
  title: string;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiAssistantToolSchemaProperty {
  type?: string | string[];
  label?: string;
  description?: string;
  enum?: any[];
  default?: any;
  example?: any;
  aliases?: string[];
  items?: Record<string, any>;
}

export interface AiAssistantToolExampleCase {
  title: string;
  prompt: string;
  description?: string;
  input?: Record<string, any>;
}

export interface AiAssistantToolInputSchema {
  type?: string;
  required?: string[];
  properties?: Record<string, AiAssistantToolSchemaProperty>;
}

export interface AiAssistantToolDefinition {
  name: string;
  label: string;
  description: string;
  category: string;
  readOnly: boolean;
  runtime: string;
  inputSchema: AiAssistantToolInputSchema;
  examples?: string[];
  exampleCases?: AiAssistantToolExampleCase[];
}

export interface AiAssistantCapabilityGroup {
  key: string;
  label: string;
  description: string;
  tools: AiAssistantToolDefinition[];
}

export interface AiAssistantCapabilityCatalog {
  total: number;
  summary: string;
  groups: AiAssistantCapabilityGroup[];
}

export interface AiAssistantMessage {
  id: number;
  conversationId: number | null;
  role: "user" | "assistant" | "tool";
  content: string;
  routePath: string | null;
  routeTitle: string | null;
  pageContext: AiAssistantPageContext | null;
  toolKey: string | null;
  toolLabel: string | null;
  toolInput: Record<string, any> | null;
  toolResult: Record<string, any> | null;
  createdAt: string;
}

export interface AiAssistantChatResult {
  conversation: AiAssistantConversation;
  reply: string;
  toolCalls: Array<{
    tool: string;
    reason: string;
    input: Record<string, any>;
  }>;
  messages: AiAssistantMessage[];
}

export const AiAssistantApi = {
  getConversations: async () => {
    return request.get<AiAssistantConversation[]>({
      url: "/ai-assistant/conversations",
    });
  },

  createConversation: async (title?: string) => {
    return request.post<AiAssistantConversation>({
      url: "/ai-assistant/conversations",
      data: {
        title,
      },
    });
  },

  deleteConversation: async (conversationId: number) => {
    return request.delete({
      url: `/ai-assistant/conversations/${conversationId}`,
    });
  },

  getMessages: async (limit = 80, conversationId?: number | null) => {
    return request.get<AiAssistantMessage[]>({
      url: "/ai-assistant/messages",
      params: {
        limit,
        conversationId: conversationId || undefined,
      },
    });
  },

  clearMessages: async (conversationId?: number | null) => {
    return request.delete({
      url: "/ai-assistant/messages",
      params: {
        conversationId: conversationId || undefined,
      },
    });
  },

  getTools: async () => {
    return request.get<{
      tools: AiAssistantToolDefinition[];
    }>({
      url: "/ai-assistant/tools",
    });
  },

  getCapabilityCatalog: async () => {
    return request.get<AiAssistantCapabilityCatalog>({
      url: "/ai-assistant/capabilities",
    });
  },

  chat: async (
    message: string,
    pageContext?: AiAssistantPageContext,
    conversationId?: number | null,
  ) => {
    return request.post<AiAssistantChatResult>({
      url: "/ai-assistant/chat",
      data: {
        message,
        pageContext,
        conversationId: conversationId || undefined,
      },
    });
  },
};
