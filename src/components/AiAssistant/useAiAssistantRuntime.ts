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

const resolveErrorMessage = (error: any) => {
  return String(
    error?.message || error?.response?.data?.message || error?.response?.data?.msg || "发送失败",
  ).trim();
};

export type DisplayMessage = AiAssistantMessage & {
  loading?: boolean;
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
});

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
        const nextBatch = result.messages
          .filter((item) => item.role !== "user")
          .map((item) => toDisplayMessage(item));

        callbacks.onSuccess([
          nextBatch.length
            ? nextBatch
            : [
                createTempMessage(
                  "assistant",
                  result.reply || "已完成处理",
                  info.pageContext,
                  nextConversationId,
                ),
              ],
        ]);
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
      persistedMessages.value.map((item) => ({
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
