import { defineStore } from "pinia";
import {
  AiAssistantApi,
  type AiAssistantCapabilityCatalog,
  type AiAssistantChatResult,
  type AiAssistantConversation,
  type AiAssistantAttachment,
  type AiAssistantMessage,
  type AiAssistantPageContext,
  type AiAssistantPersona,
  type AiAssistantToolDefinition,
} from "@/api/aiAssistant";

const unwrapPayload = <T = any>(payload: any): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data as T;
  }
  return payload as T;
};

const toConversationId = (value: unknown) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized > 0 ? Math.floor(normalized) : null;
};

const sortConversations = (items: AiAssistantConversation[]) => {
  return [...items].sort((left, right) => {
    const leftTime = new Date(
      left.lastMessageAt || left.updatedAt || left.createdAt || 0,
    ).getTime();
    const rightTime = new Date(
      right.lastMessageAt || right.updatedAt || right.createdAt || 0,
    ).getTime();
    return rightTime - leftTime || right.id - left.id;
  });
};

const normalizeConversation = (payload: any): AiAssistantConversation | null => {
  const data = unwrapPayload<any>(payload);
  if (!data || typeof data !== "object" || typeof data.id !== "number") {
    return null;
  }
  return data as AiAssistantConversation;
};

const normalizeConversations = (payload: any): AiAssistantConversation[] => {
  const data = unwrapPayload<any>(payload);
  return Array.isArray(data) ? (data as AiAssistantConversation[]) : [];
};

const normalizeMessages = (payload: any): AiAssistantMessage[] => {
  const data = unwrapPayload<any>(payload);
  return Array.isArray(data) ? (data as AiAssistantMessage[]) : [];
};

const normalizePersonas = (payload: any): AiAssistantPersona[] => {
  const data = unwrapPayload<any>(payload);
  return Array.isArray(data) ? (data as AiAssistantPersona[]) : [];
};

const normalizeTools = (payload: any): AiAssistantToolDefinition[] => {
  const data = unwrapPayload<any>(payload);
  return Array.isArray(data?.tools) ? data.tools : [];
};

const normalizeCapabilityCatalog = (payload: any): AiAssistantCapabilityCatalog | null => {
  const data = unwrapPayload<any>(payload);
  if (!data || typeof data !== "object" || !Array.isArray(data.groups)) {
    return null;
  }
  return data as AiAssistantCapabilityCatalog;
};

const normalizeChatResult = (payload: any): AiAssistantChatResult | null => {
  const data = unwrapPayload<any>(payload);
  if (!data || typeof data !== "object" || !Array.isArray(data.messages)) {
    return null;
  }
  return data as AiAssistantChatResult;
};

export const useAiAssistantStore = defineStore("aiAssistant", {
  state: () => ({
    conversations: [] as AiAssistantConversation[],
    personas: [] as AiAssistantPersona[],
    activeConversationId: null as number | null,
    messages: [] as AiAssistantMessage[],
    tools: [] as AiAssistantToolDefinition[],
    capabilityCatalog: null as AiAssistantCapabilityCatalog | null,
    conversationsLoading: false,
    personasLoading: false,
    loadingHistory: false,
    toolsLoading: false,
    capabilityCatalogLoading: false,
    sending: false,
    loadedConversations: false,
    loadedPersonas: false,
    loadedHistoryConversationId: null as number | null,
    loadedTools: false,
    loadedCapabilityCatalog: false,
  }),
  getters: {
    messageCount: (state) => state.messages.length,
    activeConversation: (state) =>
      state.conversations.find((item) => item.id === state.activeConversationId) || null,
  },
  actions: {
    mergeMessages(nextMessages: AiAssistantMessage[]) {
      const messageMap = new Map<number, AiAssistantMessage>();
      [...this.messages, ...nextMessages].forEach((item) => {
        if (!item || typeof item.id !== "number") {
          return;
        }
        messageMap.set(item.id, item);
      });
      this.messages = Array.from(messageMap.values()).sort((left, right) => left.id - right.id);
    },

    upsertConversation(conversation: AiAssistantConversation) {
      const next = this.conversations.filter((item) => item.id !== conversation.id);
      next.unshift(conversation);
      this.conversations = sortConversations(next);
    },

    setActiveConversation(conversationId?: number | null) {
      const normalizedId = toConversationId(conversationId);
      if (this.activeConversationId === normalizedId) {
        return;
      }
      this.activeConversationId = normalizedId;
      this.messages = [];
      this.loadedHistoryConversationId = null;
    },

    async loadConversations(force = false) {
      if (this.conversationsLoading) {
        return;
      }
      if (this.loadedConversations && !force) {
        return;
      }

      this.conversationsLoading = true;
      try {
        const payload = await AiAssistantApi.getConversations();
        this.conversations = sortConversations(normalizeConversations(payload));
        this.loadedConversations = true;

        const activeExists = this.conversations.some(
          (item) => item.id === this.activeConversationId,
        );
        if (!activeExists) {
          this.activeConversationId = this.conversations[0]?.id || null;
          this.messages = [];
          this.loadedHistoryConversationId = null;
        }
      } finally {
        this.conversationsLoading = false;
      }
    },

    async loadPersonas(force = false) {
      if (this.personasLoading) {
        return;
      }
      if (this.loadedPersonas && !force) {
        return;
      }

      this.personasLoading = true;
      try {
        const payload = await AiAssistantApi.getPersonas();
        this.personas = normalizePersonas(payload);
        this.loadedPersonas = true;
      } finally {
        this.personasLoading = false;
      }
    },

    async loadMessages(conversationId?: number | null, force = false) {
      const targetConversationId = toConversationId(conversationId ?? this.activeConversationId);
      if (!targetConversationId) {
        this.messages = [];
        this.loadedHistoryConversationId = null;
        return;
      }
      if (this.loadingHistory) {
        return;
      }
      if (this.loadedHistoryConversationId === targetConversationId && !force) {
        return;
      }

      this.loadingHistory = true;
      this.activeConversationId = targetConversationId;
      this.messages = [];
      try {
        const payload = await AiAssistantApi.getMessages(80, targetConversationId);
        this.messages = normalizeMessages(payload);
        this.loadedHistoryConversationId = targetConversationId;
      } finally {
        this.loadingHistory = false;
      }
    },

    async activateConversation(conversationId?: number | null, force = false) {
      const targetConversationId = toConversationId(conversationId);
      this.setActiveConversation(targetConversationId);
      await this.loadMessages(targetConversationId, force);
    },

    async createConversation(title?: string, personaKey?: string) {
      const payload = await AiAssistantApi.createConversation(title, personaKey);
      const conversation = normalizeConversation(payload);
      if (!conversation) {
        return null;
      }

      this.upsertConversation(conversation);
      this.activeConversationId = conversation.id;
      this.messages = [];
      this.loadedHistoryConversationId = conversation.id;
      return conversation;
    },

    async updateConversationPersona(conversationId: number, personaKey: string) {
      const targetConversationId = toConversationId(conversationId);
      if (!targetConversationId) {
        return null;
      }

      const payload = await AiAssistantApi.updateConversationPersona(
        targetConversationId,
        personaKey,
      );
      const conversation = normalizeConversation(payload);
      if (!conversation) {
        return null;
      }

      this.upsertConversation(conversation);
      if (this.activeConversationId === conversation.id) {
        this.activeConversationId = conversation.id;
      }
      return conversation;
    },

    async deleteConversation(conversationId: number) {
      const targetConversationId = toConversationId(conversationId);
      if (!targetConversationId) {
        return;
      }

      await AiAssistantApi.deleteConversation(targetConversationId);
      this.conversations = this.conversations.filter((item) => item.id !== targetConversationId);

      if (this.activeConversationId === targetConversationId) {
        const nextConversationId = this.conversations[0]?.id || null;
        this.activeConversationId = nextConversationId;
        this.messages = [];
        this.loadedHistoryConversationId = null;
        if (nextConversationId) {
          await this.loadMessages(nextConversationId, true);
        }
      }
    },

    async loadTools(force = false) {
      if (this.toolsLoading) {
        return;
      }
      if (this.loadedTools && !force) {
        return;
      }

      this.toolsLoading = true;
      try {
        const payload = await AiAssistantApi.getTools();
        this.tools = normalizeTools(payload);
        this.loadedTools = true;
      } finally {
        this.toolsLoading = false;
      }
    },

    async loadCapabilityCatalog(force = false) {
      if (this.capabilityCatalogLoading) {
        return;
      }
      if (this.loadedCapabilityCatalog && !force) {
        return;
      }

      this.capabilityCatalogLoading = true;
      try {
        const payload = await AiAssistantApi.getCapabilityCatalog();
        this.capabilityCatalog = normalizeCapabilityCatalog(payload);
        this.loadedCapabilityCatalog = true;
      } finally {
        this.capabilityCatalogLoading = false;
      }
    },

    async clearMessages(conversationId?: number | null) {
      const targetConversationId = toConversationId(conversationId ?? this.activeConversationId);
      await AiAssistantApi.clearMessages(targetConversationId);

      if (targetConversationId) {
        if (this.activeConversationId === targetConversationId) {
          this.messages = [];
          this.loadedHistoryConversationId = targetConversationId;
        }

        this.conversations = sortConversations(
          this.conversations.map((item) =>
            item.id === targetConversationId
              ? {
                  ...item,
                  messageCount: 0,
                  lastMessageAt: null,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        );
        return;
      }

      this.messages = [];
      this.loadedHistoryConversationId = this.activeConversationId;
      this.conversations = this.conversations.map((item) => ({
        ...item,
        messageCount: 0,
        lastMessageAt: null,
        updatedAt: new Date().toISOString(),
      }));
    },

    async sendMessage(
      message: string,
      attachments?: AiAssistantAttachment[],
      pageContext?: AiAssistantPageContext,
      conversationId?: number | null,
    ) {
      this.sending = true;
      try {
        const targetConversationId = toConversationId(conversationId ?? this.activeConversationId);
        const payload = await AiAssistantApi.chat(
          message,
          attachments || [],
          pageContext,
          targetConversationId,
        );
        const result = normalizeChatResult(payload);

        if (result?.conversation) {
          this.upsertConversation(result.conversation);
          this.activeConversationId = result.conversation.id;
        }

        if (result?.messages?.length) {
          const resultConversationId = toConversationId(
            result.conversation?.id ?? targetConversationId ?? this.activeConversationId,
          );

          if (
            resultConversationId &&
            this.activeConversationId === resultConversationId &&
            this.loadedHistoryConversationId === resultConversationId
          ) {
            this.mergeMessages(result.messages);
          } else {
            this.messages = [...result.messages].sort((left, right) => left.id - right.id);
          }

          this.loadedHistoryConversationId = resultConversationId;
        } else {
          await this.loadMessages(result?.conversation?.id || targetConversationId, true);
        }

        return result;
      } finally {
        this.sending = false;
      }
    },

    async executeTool(
      tool: string,
      input?: Record<string, any> | null,
      pageContext?: AiAssistantPageContext,
      conversationId?: number | null,
      reason?: string,
      confirmed?: boolean,
    ) {
      this.sending = true;
      try {
        const targetConversationId = toConversationId(conversationId ?? this.activeConversationId);
        const payload = await AiAssistantApi.executeTool(
          tool,
          input || {},
          pageContext,
          targetConversationId,
          reason,
          confirmed,
        );
        const result = normalizeChatResult(payload);

        if (result?.conversation) {
          this.upsertConversation(result.conversation);
          this.activeConversationId = result.conversation.id;
        }

        if (result?.messages?.length) {
          const resultConversationId = toConversationId(
            result.conversation?.id ?? targetConversationId ?? this.activeConversationId,
          );

          if (
            resultConversationId &&
            this.activeConversationId === resultConversationId &&
            this.loadedHistoryConversationId === resultConversationId
          ) {
            this.mergeMessages(result.messages);
          } else {
            this.messages = [...result.messages].sort((left, right) => left.id - right.id);
          }

          this.loadedHistoryConversationId = resultConversationId;
        } else {
          await this.loadMessages(result?.conversation?.id || targetConversationId, true);
        }

        return result;
      } finally {
        this.sending = false;
      }
    },

    async confirmRunTool(
      runId: string,
      tool?: string,
      input?: Record<string, any> | null,
      pageContext?: AiAssistantPageContext,
      conversationId?: number | null,
      reason?: string,
    ) {
      this.sending = true;
      try {
        const targetConversationId = toConversationId(conversationId ?? this.activeConversationId);
        const payload = await AiAssistantApi.confirmRunTool(
          runId,
          tool,
          input || {},
          pageContext,
          targetConversationId,
          reason,
        );
        const result = normalizeChatResult(payload);

        if (result?.conversation) {
          this.upsertConversation(result.conversation);
          this.activeConversationId = result.conversation.id;
        }

        if (result?.messages?.length) {
          const resultConversationId = toConversationId(
            result.conversation?.id ?? targetConversationId ?? this.activeConversationId,
          );

          if (
            resultConversationId &&
            this.activeConversationId === resultConversationId &&
            this.loadedHistoryConversationId === resultConversationId
          ) {
            this.mergeMessages(result.messages);
          } else {
            this.messages = [...result.messages].sort((left, right) => left.id - right.id);
          }

          this.loadedHistoryConversationId = resultConversationId;
        } else {
          await this.loadMessages(result?.conversation?.id || targetConversationId, true);
        }

        return result;
      } finally {
        this.sending = false;
      }
    },
  },
});
