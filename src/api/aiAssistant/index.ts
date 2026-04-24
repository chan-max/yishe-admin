import request from "@/config/axios";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { getAccessToken } from "@/utils/auth";
import { config } from "@/config/axios/config";

export interface AiAssistantPageContext {
  routePath?: string;
  fullPath?: string;
  routeName?: string;
  routeTitle?: string;
  query?: Record<string, any>;
  params?: Record<string, any>;
}

export interface AiAssistantPersona {
  key: string;
  name: string;
  description: string;
  isDefault: boolean;
}

export interface AiAssistantConversation {
  id: number;
  title: string;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  persona: AiAssistantPersona;
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
  plannerEnabled?: boolean;
  executionMode?: "read_only" | "safe_write" | "confirm_required";
  riskLevel?: "low" | "medium" | "high";
  requiresBrowser?: boolean;
  confirmRequired?: boolean;
  idempotent?: boolean;
  tags?: string[];
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

export interface AiAssistantAttachment {
  kind: "image" | "file";
  name: string;
  url: string;
  mimeType?: string | null;
  size?: number | null;
}

export interface AiAssistantUploadTarget {
  key: string;
  bucket: string;
  region: string;
  url: string;
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
  attachments: AiAssistantAttachment[];
  routePath: string | null;
  routeTitle: string | null;
  pageContext: AiAssistantPageContext | null;
  toolKey: string | null;
  toolLabel: string | null;
  toolInput: Record<string, any> | null;
  toolResult: Record<string, any> | null;
  runTrace?: {
    status?: string;
    startedAt?: string;
    finishedAt?: string;
    events?: Array<{
      event: string;
      label: string;
      time: string;
      summary: string;
      payload?: Record<string, any> | null;
    }>;
  } | null;
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

export interface AiAssistantChatStreamEvent {
  event: string;
  data: any;
}

export const AiAssistantApi = {
  getConversations: async () => {
    return request.get<AiAssistantConversation[]>({
      url: "/ai-assistant/conversations",
    });
  },

  getPersonas: async () => {
    return request.get<AiAssistantPersona[]>({
      url: "/ai-assistant/personas",
    });
  },

  createConversation: async (title?: string, personaKey?: string) => {
    return request.post<AiAssistantConversation>({
      url: "/ai-assistant/conversations",
      data: {
        title,
        personaKey,
      },
    });
  },

  updateConversationPersona: async (conversationId: number, personaKey: string) => {
    return request.patch<AiAssistantConversation>({
      url: `/ai-assistant/conversations/${conversationId}/persona`,
      data: {
        personaKey,
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

  createAttachmentUploadTarget: async (filename: string) => {
    return request.post<AiAssistantUploadTarget>({
      url: "/ai-assistant/attachments/upload-target",
      data: {
        filename,
      },
    });
  },

  chat: async (
    message: string,
    attachments?: AiAssistantAttachment[],
    pageContext?: AiAssistantPageContext,
    conversationId?: number | null,
  ) => {
    return request.post<AiAssistantChatResult>({
      url: "/ai-assistant/chat",
      data: {
        message,
        attachments,
        pageContext,
        conversationId: conversationId || undefined,
      },
    });
  },

  chatStream: async (
    message: string,
    attachments: AiAssistantAttachment[] | undefined,
    pageContext: AiAssistantPageContext | undefined,
    conversationId: number | null | undefined,
    options: {
      enableThinking?: boolean;
      thinkingBudget?: number;
      includeUsage?: boolean;
      signal: AbortSignal;
      onEvent: (event: AiAssistantChatStreamEvent) => void;
      onError?: (error: any) => void;
      onClose?: () => void;
    },
  ) => {
    const token = getAccessToken();
    return fetchEventSource(`${config.base_url}/ai-assistant/chat-stream`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      openWhenHidden: true,
      signal: options.signal,
      body: JSON.stringify({
        message,
        attachments,
        pageContext,
        conversationId: conversationId || undefined,
        enableThinking: options.enableThinking,
        thinkingBudget: options.thinkingBudget,
        includeUsage: options.includeUsage !== false,
      }),
      onmessage(event) {
        let parsed: any = {};
        try {
          parsed = event.data ? JSON.parse(event.data) : {};
        } catch {
          parsed = {};
        }
        options.onEvent({
          event: event.event || "message",
          data: parsed,
        });
      },
      onerror(error) {
        options.onError?.(error);
        throw error;
      },
      onclose() {
        options.onClose?.();
      },
    });
  },

  executeTool: async (
    tool: string,
    input?: Record<string, any>,
    pageContext?: AiAssistantPageContext,
    conversationId?: number | null,
    reason?: string,
    confirmed?: boolean,
  ) => {
    return request.post<AiAssistantChatResult>({
      url: "/ai-assistant/tools/execute",
      data: {
        tool,
        input,
        pageContext,
        conversationId: conversationId || undefined,
        reason,
        confirmed,
      },
    });
  },
};
