import { computed } from "vue";
import { storeToRefs } from "pinia";
import { ElMessage } from "element-plus";
import { useXAgent, useXChat } from "ant-design-x-vue";
import type {
  AiAssistantChatResult,
  AiAssistantMessage,
  AiAssistantPageContext,
} from "@/api/aiAssistant";
import { useAiAssistantStore } from "@/store/modules/aiAssistant";

type AssistantToolCall = AiAssistantChatResult["toolCalls"][number];

const resolveErrorMessage = (error: any) => {
  return String(
    error?.message || error?.response?.data?.message || error?.response?.data?.msg || "发送失败",
  ).trim();
};

export type DisplayMessage = AiAssistantMessage & {
  loading?: boolean;
  toolCalls?: AssistantToolCall[];
};

export type AssistantMessageBatch = DisplayMessage[];

export type AssistantBubbleItem = {
  key: string;
  role: DisplayMessage["role"];
  content: string;
  createdAt: string;
  toolLabel: string | null;
  toolKey: string | null;
  toolInput: DisplayMessage["toolInput"];
  toolResult: DisplayMessage["toolResult"];
  toolCalls?: AssistantToolCall[];
  routeTitle: string | null;
  routePath: string | null;
  loading: boolean;
  rawMessage: DisplayMessage;
  status: "local" | "loading" | "success" | "error";
};

type AiAssistantRequestPayload = {
  message: AssistantMessageBatch;
  plainText: string;
  pageContext: AiAssistantPageContext;
  conversationId: number | null;
};

const toDisplayMessage = (message: AiAssistantMessage | DisplayMessage): DisplayMessage => ({
  ...message,
  toolCalls: Array.isArray((message as DisplayMessage).toolCalls)
    ? (message as DisplayMessage).toolCalls
    : [],
});

const buildToolCallSummaryContent = (toolCalls: AssistantToolCall[]) => {
  if (!toolCalls.length) {
    return "无";
  }

  return toolCalls
    .map((item) => {
      const tool = String(item.tool || "").trim() || "unknown.tool";
      const reason = String(item.reason || "").trim();
      return reason ? `${tool}\n${reason}` : tool;
    })
    .join("\n\n");
};

const createLocalMessage = (
  id: number,
  role: AiAssistantMessage["role"],
  content: string,
  pageContext: AiAssistantPageContext,
  conversationId: number | null,
  extra: Partial<DisplayMessage> = {},
): DisplayMessage => ({
  id,
  conversationId,
  role,
  content,
  routePath: pageContext.routePath || null,
  routeTitle: pageContext.routeTitle || null,
  pageContext: pageContext || null,
  toolKey: null,
  toolLabel: null,
  toolInput: null,
  toolResult: null,
  createdAt: new Date().toISOString(),
  ...extra,
});

export const useAiAssistantRuntime = () => {
  const aiAssistantStore = useAiAssistantStore();
  const {
    conversations,
    activeConversation,
    activeConversationId,
    messages: persistedMessages,
    capabilityCatalog,
    loadingHistory,
    capabilityCatalogLoading,
    conversationsLoading,
  } = storeToRefs(aiAssistantStore);

  let tempMessageId = -1;
  const createTempMessage = (
    role: AiAssistantMessage["role"],
    content: string,
    pageContext: AiAssistantPageContext,
    conversationId: number | null,
    extra: Partial<DisplayMessage> = {},
  ) => {
    tempMessageId -= 1;
    return createLocalMessage(tempMessageId, role, content, pageContext, conversationId, extra);
  };

  const createToolCallSummaryMessage = (
    toolCalls: AssistantToolCall[],
    pageContext: AiAssistantPageContext,
    conversationId: number | null,
    createdAt?: string,
  ) =>
    createTempMessage("tool", buildToolCallSummaryContent(toolCalls), pageContext, conversationId, {
      createdAt: createdAt || new Date().toISOString(),
      toolKey: "__tool_call_summary__",
      toolLabel: "工具调用",
      toolCalls,
    });

  const buildDisplayMessages = (
    messages: Array<AiAssistantMessage | DisplayMessage>,
    pageContext: AiAssistantPageContext,
    conversationId: number | null,
    fallbackToolCalls: AssistantToolCall[] = [],
  ) => {
    const normalizedMessages = messages.map((item) => toDisplayMessage(item));
    const displayMessages: DisplayMessage[] = [];
    let pendingToolMessages: DisplayMessage[] = [];

    const flushToolSummary = (
      assistantMessage?: DisplayMessage | null,
      explicitToolCalls: AssistantToolCall[] = [],
    ) => {
      const derivedToolCalls = pendingToolMessages
        .map((item) => {
          const tool = String(item.toolKey || item.toolLabel || "").trim();
          if (!tool) {
            return null;
          }
          return {
            tool,
            reason: String(item.content || "").trim(),
            input: item.toolInput || {},
          };
        })
        .filter(Boolean) as AssistantToolCall[];

      const toolCalls = explicitToolCalls.length
        ? explicitToolCalls
        : derivedToolCalls.length
          ? derivedToolCalls
          : [];

      displayMessages.push(
        createToolCallSummaryMessage(
          toolCalls,
          assistantMessage?.pageContext || pageContext,
          assistantMessage?.conversationId ?? conversationId,
          assistantMessage?.createdAt,
        ),
      );
      pendingToolMessages = [];
    };

    normalizedMessages.forEach((item) => {
      if (item.role === "user") {
        pendingToolMessages = [];
        displayMessages.push(item);
        return;
      }

      if (item.role === "tool") {
        pendingToolMessages.push(item);
        return;
      }

      if (item.role === "assistant") {
        flushToolSummary(item, item.toolCalls || fallbackToolCalls);
        displayMessages.push(item);
        return;
      }

      displayMessages.push(item);
    });

    return displayMessages;
  };

  const [agent] = useXAgent<
    AssistantMessageBatch,
    AiAssistantRequestPayload,
    AssistantMessageBatch
  >({
    request: async (info, callbacks) => {
      try {
        const result = (await aiAssistantStore.sendMessage(
          info.plainText,
          info.pageContext,
          info.conversationId,
        )) as AiAssistantChatResult | null;

        if (!result) {
          throw new Error("AI 助手返回格式异常");
        }

        const nextConversationId =
          Number(result.conversation?.id || info.conversationId || 0) || null;
        const nextBatch = buildDisplayMessages(
          result.messages,
          info.pageContext,
          nextConversationId,
          result.toolCalls || [],
        ).filter((item) => item.role !== "user");

        callbacks.onSuccess(
          nextBatch.length
            ? nextBatch.map((item) => [item])
            : [
                [
                  createTempMessage(
                    "assistant",
                    result.reply || "已完成处理",
                    info.pageContext,
                    nextConversationId,
                  ),
                ],
              ],
        );
      } catch (error: any) {
        const message = resolveErrorMessage(error);
        ElMessage.error(message);
        callbacks.onError(new Error(message));
      }
    },
  });

  const { onRequest, parsedMessages, setMessages } = useXChat<
    AssistantMessageBatch,
    AssistantBubbleItem,
    AiAssistantRequestPayload,
    AssistantMessageBatch
  >({
    agent: agent.value,
    parser: (batch) =>
      batch.map((item) => ({
        key: String(item.id),
        role: item.role,
        content: item.content,
        createdAt: item.createdAt,
        toolLabel: item.toolLabel,
        toolKey: item.toolKey,
        toolInput: item.toolInput,
        toolResult: item.toolResult,
        toolCalls: item.toolCalls || [],
        routeTitle: item.routeTitle,
        routePath: item.routePath,
        loading: !!item.loading,
        rawMessage: item,
        status: "success",
      })),
    requestPlaceholder: (batch) => {
      const pageContext = batch[0]?.pageContext || {};
      const conversationId = batch[0]?.conversationId || null;
      return [
        createTempMessage("assistant", "", pageContext, conversationId, {
          loading: true,
        }),
      ];
    },
    requestFallback: (batch, info) => {
      const pageContext = batch[0]?.pageContext || {};
      const conversationId = batch[0]?.conversationId || null;
      return [
        createTempMessage(
          "assistant",
          resolveErrorMessage(info.error),
          pageContext,
          conversationId,
        ),
      ];
    },
  });

  const bubbleItems = computed<AssistantBubbleItem[]>(() => {
    return parsedMessages.value.map((item) => ({
      ...item.message,
      status: item.status,
      loading: item.status === "loading" || !!item.message.loading,
    }));
  });

  const messageCount = computed(() => bubbleItems.value.length);
  const sending = computed(() => agent.value.isRequesting());

  const syncHistoryMessages = () => {
    setMessages(
      buildDisplayMessages(
        persistedMessages.value,
        {},
        activeConversationId.value,
      ).map((item) => ({
        id: `history_${item.id}`,
        message: [toDisplayMessage(item)],
        status: "success" as const,
      })),
    );
  };

  const loadAll = async (force = false) => {
    await aiAssistantStore.loadConversations(force);
    if (!activeConversationId.value) {
      setMessages([]);
      return;
    }

    await aiAssistantStore.loadMessages(activeConversationId.value, force);
    syncHistoryMessages();
  };

  const switchConversation = async (conversationId: number | null) => {
    await aiAssistantStore.activateConversation(conversationId, true);
    if (!aiAssistantStore.activeConversationId) {
      setMessages([]);
      return;
    }
    syncHistoryMessages();
  };

  const createConversation = async (title?: string) => {
    const conversation = await aiAssistantStore.createConversation(title);
    setMessages([]);
    return conversation;
  };

  const deleteConversation = async (conversationId: number) => {
    await aiAssistantStore.deleteConversation(conversationId);
    if (!aiAssistantStore.activeConversationId) {
      setMessages([]);
      return;
    }
    syncHistoryMessages();
  };

  const loadCapabilityCatalog = async (force = false) => {
    await aiAssistantStore.loadCapabilityCatalog(force);
  };

  const clearHistory = async () => {
    await aiAssistantStore.clearMessages(activeConversationId.value);
    setMessages([]);
  };

  const sendMessage = (plainText: string, pageContext: AiAssistantPageContext) => {
    const normalizedText = String(plainText || "").trim();
    if (!normalizedText || sending.value) {
      return;
    }

    onRequest({
      plainText: normalizedText,
      pageContext,
      conversationId: activeConversationId.value,
      message: [createTempMessage("user", normalizedText, pageContext, activeConversationId.value)],
    });
  };

  return {
    conversations,
    activeConversation,
    activeConversationId,
    capabilityCatalog,
    loadingHistory,
    capabilityCatalogLoading,
    conversationsLoading,
    bubbleItems,
    messageCount,
    sending,
    loadAll,
    loadCapabilityCatalog,
    switchConversation,
    createConversation,
    deleteConversation,
    clearHistory,
    sendMessage,
    syncHistoryMessages,
  };
};
