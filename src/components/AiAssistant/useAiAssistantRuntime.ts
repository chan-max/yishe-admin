import { computed } from "vue";
import { storeToRefs } from "pinia";
import { ElMessage } from "element-plus";
import { useXAgent, useXChat } from "ant-design-x-vue";
import {
  AiAssistantApi,
  type AiAssistantChatResult,
  type AiAssistantMessage,
  type AiAssistantPageContext,
} from "@/api/aiAssistant";
import { useAiAssistantStore } from "@/store/modules/aiAssistant";

const unwrapPayload = <T = any>(payload: any): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data as T;
  }
  return payload as T;
};

const normalizeChatResult = (payload: any): AiAssistantChatResult | null => {
  const data = unwrapPayload<any>(payload);
  if (!data || typeof data !== "object" || !Array.isArray(data.messages)) {
    return null;
  }
  return data as AiAssistantChatResult;
};

const resolveErrorMessage = (error: any) => {
  return String(
    error?.message ||
      error?.response?.data?.message ||
      error?.response?.data?.msg ||
      "发送失败",
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
};

const toDisplayMessage = (message: AiAssistantMessage | DisplayMessage): DisplayMessage => ({
  ...message,
});

const createLocalMessage = (
  id: number,
  role: AiAssistantMessage["role"],
  content: string,
  pageContext: AiAssistantPageContext,
  extra: Partial<DisplayMessage> = {},
): DisplayMessage => ({
  id,
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
    messages: persistedMessages,
    capabilityCatalog,
    loadingHistory,
    capabilityCatalogLoading,
  } = storeToRefs(aiAssistantStore);

  let tempMessageId = -1;
  const createTempMessage = (
    role: AiAssistantMessage["role"],
    content: string,
    pageContext: AiAssistantPageContext,
    extra: Partial<DisplayMessage> = {},
  ) => {
    tempMessageId -= 1;
    return createLocalMessage(tempMessageId, role, content, pageContext, extra);
  };

  const [agent] = useXAgent<
    AssistantMessageBatch,
    AiAssistantRequestPayload,
    AssistantMessageBatch
  >({
    request: async (info, callbacks) => {
      try {
        const payload = await AiAssistantApi.chat(info.plainText, info.pageContext);
        const result = normalizeChatResult(payload);
        if (!result) {
          throw new Error("AI 助手返回格式异常");
        }

        aiAssistantStore.mergeMessages(result.messages);

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

  const {
    onRequest,
    parsedMessages,
    setMessages,
  } = useXChat<
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
      return [
        createTempMessage("assistant", "", pageContext, {
          loading: true,
        }),
      ];
    },
    requestFallback: (batch, info) => {
      const pageContext = batch[0]?.pageContext || {};
      return [
        createTempMessage(
          "assistant",
          resolveErrorMessage(info.error),
          pageContext,
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
    await aiAssistantStore.loadMessages(force);
    syncHistoryMessages();
  };

  const loadCapabilityCatalog = async (force = false) => {
    await aiAssistantStore.loadCapabilityCatalog(force);
  };

  const clearHistory = async () => {
    await aiAssistantStore.clearMessages();
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
      message: [createTempMessage("user", normalizedText, pageContext)],
    });
  };

  return {
    capabilityCatalog,
    loadingHistory,
    capabilityCatalogLoading,
    bubbleItems,
    messageCount,
    sending,
    loadAll,
    loadCapabilityCatalog,
    clearHistory,
    sendMessage,
    syncHistoryMessages,
  };
};
