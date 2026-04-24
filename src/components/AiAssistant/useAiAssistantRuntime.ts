import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { ElMessage } from "element-plus";
import { useXAgent, useXChat } from "ant-design-x-vue";
import type {
  AiAssistantAttachment,
  AiAssistantChatResult,
  AiAssistantChatStreamEvent,
  AiAssistantMessage,
  AiAssistantPageContext,
} from "@/api/aiAssistant";
import { AiAssistantApi } from "@/api/aiAssistant";
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
  reasoning?: string;
  streamStage?: string;
  usage?: Record<string, any> | null;
  eventTrail?: Array<{
    event: string;
    label: string;
    time: string;
    summary: string;
    payload?: Record<string, any> | null;
  }>;
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
  attachments: AiAssistantAttachment[];
  toolCalls?: AssistantToolCall[];
  routeTitle: string | null;
  routePath: string | null;
  reasoning?: string;
  streamStage?: string;
  usage?: Record<string, any> | null;
  eventTrail?: DisplayMessage["eventTrail"];
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
  reasoning: String((message as DisplayMessage).reasoning || ""),
  streamStage: String((message as DisplayMessage).streamStage || ""),
  usage:
    (message as DisplayMessage).usage &&
    typeof (message as DisplayMessage).usage === "object"
      ? ((message as DisplayMessage).usage as Record<string, any>)
      : null,
  eventTrail: Array.isArray((message as DisplayMessage).eventTrail)
    ? (message as DisplayMessage).eventTrail
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
  attachments: [],
  createdAt: new Date().toISOString(),
  ...extra,
});

const summarizeStreamEvent = (event: string, data: Record<string, any>) => {
  if (event === "conversation.updated") {
    return `会话 #${data?.conversation?.id || "-"} 已更新`;
  }
  if (event === "assistant.status") {
    return String(data?.message || data?.stage || "状态更新");
  }
  if (event === "assistant.plan") {
    const count = Array.isArray(data?.toolCalls) ? data.toolCalls.length : 0;
    return count > 0
      ? `已生成 ${count} 个工具计划`
      : String(data?.reply || "无需调用工具，准备直接回答");
  }
  if (event === "assistant.reasoning.delta") {
    return `收到思考增量 ${String(data?.delta || "").length} 字`;
  }
  if (event === "assistant.answer.delta") {
    return `收到回复增量 ${String(data?.delta || "").length} 字`;
  }
  if (event === "assistant.usage") {
    return `Token 合计 ${Number(data?.usage?.total_tokens || 0) || "-"}`;
  }
  if (event === "tool.pending") {
    return `准备执行工具 ${String(data?.toolCall?.tool || "")}`;
  }
  if (event === "tool.completed") {
    return `工具 ${String(data?.toolCall?.tool || "")} 已完成`;
  }
  if (event === "chat.result") {
    return "最终结果已返回";
  }
  if (event === "done") {
    return "流式输出结束";
  }
  return "收到事件";
};

const labelStreamEvent = (event: string) => {
  const map: Record<string, string> = {
    "conversation.updated": "会话更新",
    "assistant.status": "助手状态",
    "assistant.plan": "规划结果",
    "assistant.reasoning.delta": "思考增量",
    "assistant.answer.delta": "回复增量",
    "assistant.usage": "用量统计",
    "tool.pending": "工具准备",
    "tool.completed": "工具完成",
    "chat.result": "最终结果",
    done: "完成",
  };
  return map[event] || event;
};

export const useAiAssistantRuntime = () => {
  const aiAssistantStore = useAiAssistantStore();
  const {
    conversations,
    personas,
    activeConversation,
    activeConversationId,
    messages: persistedMessages,
    capabilityCatalog,
    loadingHistory,
    personasLoading,
    capabilityCatalogLoading,
    conversationsLoading,
    sending: storeSending,
  } = storeToRefs(aiAssistantStore);
  const liveEventTrail = ref<
    Array<{
      event: string;
      label: string;
      time: string;
      summary: string;
      payload?: Record<string, any> | null;
    }>
  >([]);

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
      if (pendingToolMessages.length) {
        displayMessages.push(...pendingToolMessages);
        pendingToolMessages = [];
        return;
      }

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

      if (!toolCalls.length) {
        return;
      }

      displayMessages.push(
        createToolCallSummaryMessage(
          toolCalls,
          assistantMessage?.pageContext || pageContext,
          assistantMessage?.conversationId ?? conversationId,
          assistantMessage?.createdAt,
        ),
      );
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
      const ctrl = new AbortController();
      callbacks.onStream?.(ctrl);
      try {
        let currentConversationId = info.conversationId ?? null;
        let finalResult: AiAssistantChatResult | null = null;
        let assistantMessage = createTempMessage(
          "assistant",
          "",
          info.pageContext,
          currentConversationId,
          {
            loading: true,
            streamStage: "planning",
          },
        );
        let streamedMessages: DisplayMessage[] = [assistantMessage];

        const emitBatch = () => {
          callbacks.onUpdate(streamedMessages.map((item) => toDisplayMessage(item)));
        };

        const appendTrail = (event: string, data: Record<string, any> = {}) => {
          const nextTrail = [
            ...(assistantMessage.eventTrail || []),
            {
              event,
              label: labelStreamEvent(event),
              time: new Date().toISOString(),
              summary: summarizeStreamEvent(event, data),
              payload: data,
            },
          ].slice(-40);
          assistantMessage = {
            ...assistantMessage,
            eventTrail: nextTrail,
          };
          liveEventTrail.value = [...nextTrail];
        };

        const applyResultToStore = (result: AiAssistantChatResult) => {
          if (result?.conversation) {
            aiAssistantStore.upsertConversation(result.conversation);
            aiAssistantStore.activeConversationId = result.conversation.id;
            currentConversationId = result.conversation.id;
          }

          if (result?.messages?.length) {
            const resultConversationId =
              Number(result.conversation?.id || currentConversationId || 0) || null;
            if (
              resultConversationId &&
              aiAssistantStore.activeConversationId === resultConversationId &&
              aiAssistantStore.loadedHistoryConversationId === resultConversationId
            ) {
              aiAssistantStore.mergeMessages(result.messages);
            } else {
              aiAssistantStore.messages = [...result.messages].sort((left, right) => left.id - right.id);
            }
            aiAssistantStore.loadedHistoryConversationId = resultConversationId;
          }
        };

        await AiAssistantApi.chatStream(
          info.plainText,
          info.message[0]?.attachments || [],
          info.pageContext,
          currentConversationId,
          {
            signal: ctrl.signal,
            includeUsage: true,
            onEvent: (payload: AiAssistantChatStreamEvent) => {
              const event = payload.event;
              const data = payload.data || {};
              appendTrail(event, data);

              const syncAssistantBubble = () => {
                streamedMessages = [
                  ...streamedMessages.filter((item) => item.role !== "assistant"),
                  assistantMessage,
                ];
              };

              if (event === "conversation.updated" && data.conversation) {
                aiAssistantStore.upsertConversation(data.conversation);
                aiAssistantStore.activeConversationId = data.conversation.id;
                currentConversationId = data.conversation.id;
                assistantMessage = {
                  ...assistantMessage,
                  conversationId: currentConversationId,
                };
                streamedMessages = streamedMessages.map((item) =>
                  item.role === "assistant"
                    ? {
                        ...item,
                        conversationId: currentConversationId,
                        eventTrail: assistantMessage.eventTrail || [],
                      }
                    : item,
                );
                emitBatch();
                return;
              }

              if (event === "assistant.status") {
                assistantMessage = {
                  ...assistantMessage,
                  loading: true,
                  streamStage: String(data.stage || ""),
                  content: assistantMessage.content || String(data.message || ""),
                };
                syncAssistantBubble();
                emitBatch();
                return;
              }

              if (event === "assistant.plan") {
                assistantMessage = {
                  ...assistantMessage,
                  loading: true,
                  streamStage: assistantMessage.streamStage || "planning",
                };
                syncAssistantBubble();
                emitBatch();
                return;
              }

              if (event === "assistant.reasoning.delta") {
                assistantMessage = {
                  ...assistantMessage,
                  reasoning: `${assistantMessage.reasoning || ""}${String(data.delta || "")}`,
                  loading: true,
                  streamStage: "reasoning",
                };
                syncAssistantBubble();
                emitBatch();
                return;
              }

              if (event === "assistant.answer.delta") {
                assistantMessage = {
                  ...assistantMessage,
                  content: `${assistantMessage.content || ""}${String(data.delta || "")}`,
                  loading: true,
                  streamStage: "answering",
                };
                syncAssistantBubble();
                emitBatch();
                return;
              }

              if (event === "assistant.usage") {
                assistantMessage = {
                  ...assistantMessage,
                  usage:
                    data.usage && typeof data.usage === "object"
                      ? data.usage
                      : null,
                };
                syncAssistantBubble();
                emitBatch();
                return;
              }

              if (event === "done") {
                assistantMessage = {
                  ...assistantMessage,
                  loading: false,
                };
                syncAssistantBubble();
                emitBatch();
                return;
              }

              if (event === "tool.completed" && data.execution?.message) {
                streamedMessages = [
                  ...streamedMessages.filter((item) => item.role !== "assistant"),
                  toDisplayMessage(data.execution.message as AiAssistantMessage),
                  assistantMessage,
                ];
                emitBatch();
                return;
              }

              if (event === "chat.result" && data.result) {
                finalResult = data.result as AiAssistantChatResult;
                applyResultToStore(finalResult);
                syncAssistantBubble();
                emitBatch();
                return;
              }

              syncAssistantBubble();
              emitBatch();
            },
          },
        );

        if (!finalResult) {
          throw new Error("AI 助手流式返回格式异常");
        }

        const nextConversationId =
          Number(finalResult.conversation?.id || currentConversationId || 0) || null;
        const nextBatch = buildDisplayMessages(
          finalResult.messages,
          info.pageContext,
          nextConversationId,
          finalResult.toolCalls || [],
        ).filter((item) => item.role !== "user");
        const finalBatch = nextBatch.length
          ? nextBatch.map((item) => ({
              ...item,
              loading: false,
              streamStage: "",
              eventTrail:
                item.role === "assistant" ? assistantMessage.eventTrail || [] : item.eventTrail || [],
            }))
          : [{ ...assistantMessage, loading: false, streamStage: "" }];

        callbacks.onUpdate(finalBatch);
        callbacks.onSuccess([]);
        liveEventTrail.value = [];
      } catch (error: any) {
        const message = resolveErrorMessage(error);
        ElMessage.error(message);
        callbacks.onError(new Error(message));
        liveEventTrail.value = [];
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
        attachments: item.attachments || [],
        toolCalls: item.toolCalls || [],
        routeTitle: item.routeTitle,
        routePath: item.routePath,
        reasoning: item.reasoning || "",
        streamStage: item.streamStage || "",
        usage: item.usage || null,
        eventTrail: item.eventTrail || [],
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
  const sending = computed(() => agent.value.isRequesting() || storeSending.value);

  const syncHistoryMessages = () => {
    setMessages(
      buildDisplayMessages(persistedMessages.value, {}, activeConversationId.value).map((item) => ({
        id: `history_${item.id}`,
        message: [toDisplayMessage(item)],
        status: "success" as const,
      })),
    );
  };

  const loadAll = async (force = false) => {
    await aiAssistantStore.loadPersonas(force);
    await aiAssistantStore.loadConversations(force);
    if (!activeConversationId.value) {
      setMessages([]);
      return;
    }

    await aiAssistantStore.loadMessages(activeConversationId.value, force);
    syncHistoryMessages();
    liveEventTrail.value = [];
  };

  const switchConversation = async (conversationId: number | null) => {
    await aiAssistantStore.activateConversation(conversationId, true);
    if (!aiAssistantStore.activeConversationId) {
      setMessages([]);
      liveEventTrail.value = [];
      return;
    }
    syncHistoryMessages();
    liveEventTrail.value = [];
  };

  const createConversationWithPersona = async (title?: string, personaKey?: string) => {
    const conversation = await aiAssistantStore.createConversation(title, personaKey);
    setMessages([]);
    liveEventTrail.value = [];
    return conversation;
  };

  const deleteConversation = async (conversationId: number) => {
    await aiAssistantStore.deleteConversation(conversationId);
    if (!aiAssistantStore.activeConversationId) {
      setMessages([]);
      liveEventTrail.value = [];
      return;
    }
    syncHistoryMessages();
    liveEventTrail.value = [];
  };

  const loadCapabilityCatalog = async (force = false) => {
    await aiAssistantStore.loadCapabilityCatalog(force);
  };

  const clearHistory = async () => {
    await aiAssistantStore.clearMessages(activeConversationId.value);
    setMessages([]);
    liveEventTrail.value = [];
  };

  const loadPersonas = async (force = false) => {
    await aiAssistantStore.loadPersonas(force);
  };

  const updateConversationPersona = async (conversationId: number, personaKey: string) => {
    return aiAssistantStore.updateConversationPersona(conversationId, personaKey);
  };

  const sendMessage = (
    plainText: string,
    attachments: AiAssistantAttachment[] = [],
    pageContext: AiAssistantPageContext,
    conversationId?: number | null,
  ) => {
    const normalizedText = String(plainText || "").trim();
    if ((!normalizedText && !attachments.length) || sending.value) {
      return;
    }

    const targetConversationId = conversationId ?? activeConversationId.value;

    onRequest({
      plainText: normalizedText,
      pageContext,
      conversationId: targetConversationId,
      message: [
        createTempMessage("user", normalizedText, pageContext, targetConversationId, {
          attachments,
        }),
      ],
    });
  };

  const executeTool = async (
    tool: string,
    input?: Record<string, any> | null,
    pageContext: AiAssistantPageContext = {},
    conversationId?: number | null,
    options?: {
      reason?: string;
      confirmed?: boolean;
    },
  ) => {
    const normalizedTool = String(tool || "").trim();
    if (!normalizedTool || sending.value) {
      return null;
    }

    const result = await aiAssistantStore.executeTool(
      normalizedTool,
      input || {},
      pageContext,
      conversationId ?? activeConversationId.value,
      options?.reason,
      options?.confirmed,
    );

    if (!aiAssistantStore.activeConversationId) {
      setMessages([]);
      liveEventTrail.value = [];
      return result || null;
    }

    syncHistoryMessages();
    liveEventTrail.value = [];
    return result || null;
  };

  return {
    conversations,
    personas,
    activeConversation,
    activeConversationId,
    capabilityCatalog,
    loadingHistory,
    personasLoading,
    capabilityCatalogLoading,
    conversationsLoading,
    bubbleItems,
    liveEventTrail,
    messageCount,
    sending,
    loadAll,
    loadPersonas,
    loadCapabilityCatalog,
    switchConversation,
    createConversation: createConversationWithPersona,
    deleteConversation,
    updateConversationPersona,
    clearHistory,
    sendMessage,
    executeTool,
    syncHistoryMessages,
  };
};
