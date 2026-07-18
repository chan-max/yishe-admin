import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  AiAssistantApi,
  type AiAssistantConversation,
  type AiAssistantMessage,
  type AiAssistantPageContext,
} from "@/api/aiAssistant";
import type {
  InteractionPayload,
  InteractionSubmitResult,
} from "@/components/AiAssistant/interactions/types";
import {
  markAiAssistantRuntimeIdle,
  markAiAssistantRuntimeRunning,
} from "@/services/aiAssistantRuntimeState";

// ========== Internal Types ==========

interface StreamContext {
  fullReply: string;
  assistantMsg: AiAssistantMessage | null;
}

// ========== Store ==========

export const useAiAssistantStore = defineStore("ai-assistant", () => {
  const route = useRoute();

  // ========== State ==========

  const conversations = ref<AiAssistantConversation[]>([]);
  const messages = ref<AiAssistantMessage[]>([]);
  const currentConversationId = ref<number | null>(null);
  const loading = ref(false);
  const runtimeStatus = ref("idle");
  const thinkingText = ref("");
  const currentRunId = ref("");
  const pendingInteraction = ref<InteractionPayload | null>(null);

  // ========== Computed ==========

  const activeConversation = computed(() =>
    conversations.value.find((item) => item.id === currentConversationId.value),
  );

  const activePersonaName = computed(
    () => activeConversation.value?.persona?.name || "",
  );

  const activeConversationTitle = computed(
    () => activeConversation.value?.title || "智能助手",
  );

  const statusText = computed(() => {
    if (pendingInteraction.value) return "等待用户参与";
    if (loading.value) {
      return runtimeStatus.value === "tool_calling"
        ? "工具执行中"
        : "流式响应中";
    }
    if (activeConversation.value?.lastMessageAt) {
      const d = activeConversation.value.lastMessageAt;
      return `最近更新 ${formatRelativeTime(d)}`;
    }
    return "准备就绪";
  });

  const senderPlaceholder = computed(() => {
    if (pendingInteraction.value)
      return "可以先输入下一条消息，完成上方交互后再发送";
    if (loading.value) return "智能助手正在处理";
    return "输入你的目标或问题";
  });

  const inputHintText = computed(() => {
    if (pendingInteraction.value) return "当前需先完成上方交互，输入内容会保留";
    if (loading.value) return "正在处理，请稍候";
    return "Enter 发送，Shift+Enter 换行";
  });

  const canSend = computed(() => !loading.value && !pendingInteraction.value);

  const hasPendingAssistantMessage = computed(() =>
    messages.value.some(
      (msg) =>
        msg.role === "assistant" &&
        !msg.content &&
        msg.runTrace?.runId === currentRunId.value,
    ),
  );

  const promptItems = [
    { key: "page", label: "分析当前页面" },
    { key: "plan", label: "先拆解任务" },
    { key: "confirm", label: "先问我问题" },
  ];

  // ========== Internal Helpers ==========

  function formatRelativeTime(value?: string | null) {
    if (!value) return "";
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return "";
      const now = new Date();
      const sameDay =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      if (sameDay) return `${hh}:${mm}`;
      const MM = String(d.getMonth() + 1).padStart(2, "0");
      const DD = String(d.getDate()).padStart(2, "0");
      return `${MM}-${DD} ${hh}:${mm}`;
    } catch {
      return "";
    }
  }

  function buildPageContext(): AiAssistantPageContext {
    return {
      routePath: route.path,
      fullPath: route.fullPath,
      routeName: String(route.name || ""),
      routeTitle: String(route.meta?.title || ""),
      query: route.query,
      params: route.params,
    };
  }

  function createLocalMessage(
    partial: Partial<AiAssistantMessage>,
  ): AiAssistantMessage {
    return {
      id: Date.now() + Math.random(),
      conversationId: currentConversationId.value,
      role: partial.role || "assistant",
      content: partial.content || "",
      attachments: partial.attachments || [],
      pageContext: partial.pageContext || null,
      toolKey: partial.toolKey || null,
      toolLabel: partial.toolLabel || null,
      toolInput: partial.toolInput || null,
      toolResult: partial.toolResult || null,
      runTrace: partial.runTrace || null,
      createdAt: new Date().toISOString(),
    };
  }

  function normalizeInteractionType(type: string): string {
    const normalized = String(type || "").trim();
    const valid = [
      "confirm",
      "input",
      "choice",
      "form",
      "feedback",
      "clarify",
      "impact_preview",
      "plan_edit",
      "compare",
      "step_form",
    ];
    if (valid.includes(normalized)) return normalized;
    return "input";
  }

  // ========== Conversation Actions ==========

  async function loadConversations() {
    try {
      conversations.value = await AiAssistantApi.getConversations();
    } catch (error) {
      console.error("加载会话列表失败:", error);
      ElMessage.error("加载会话失败");
    }
  }

  async function loadMessages() {
    try {
      messages.value = await AiAssistantApi.getMessages({
        conversationId: currentConversationId.value || undefined,
      });
    } catch (error) {
      console.error("加载消息失败:", error);
      ElMessage.error("加载消息失败");
    }
  }

  async function selectConversation(id: number) {
    if (currentConversationId.value === id) return;
    currentConversationId.value = id;
    pendingInteraction.value = null;
    await loadMessages();
  }

  async function createConversation() {
    try {
      const result = await AiAssistantApi.createConversation({
        title: "新会话",
      });
      conversations.value.unshift(result);
      currentConversationId.value = result.id;
      messages.value = [];
      pendingInteraction.value = null;
    } catch (error) {
      ElMessage.error("创建会话失败");
    }
  }

  async function deleteConversation(id: number) {
    try {
      await ElMessageBox.confirm("确认删除此会话？", "提示", {
        type: "warning",
      });
      await AiAssistantApi.deleteConversation(id);
      conversations.value = conversations.value.filter((c) => c.id !== id);
      if (currentConversationId.value === id) {
        currentConversationId.value = conversations.value[0]?.id || null;
        messages.value = [];
        if (currentConversationId.value) {
          await loadMessages();
        }
      }
      ElMessage.success("已删除");
    } catch (error) {
      if (error !== "cancel") ElMessage.error("删除失败");
    }
  }

  // ========== Stream Handling ==========

  function ensureAssistantMessage(context: StreamContext) {
    if (context.assistantMsg) return context.assistantMsg;
    context.assistantMsg = createLocalMessage({
      role: "assistant",
      content: "",
      runTrace: { runId: currentRunId.value },
    });
    messages.value.push(context.assistantMsg);
    return context.assistantMsg;
  }

  function appendAssistantDelta(content: string, context: StreamContext) {
    if (!content) return;
    const assistantMessage = ensureAssistantMessage(context);
    context.fullReply += content;
    assistantMessage.content = context.fullReply;
  }

  function buildToolResultSummary(data: any): string {
    const result = data?.data;
    if (!result) return data?.summary || "执行完成";

    const total = result.total;
    const count = result.count;
    const label = result.label || data?.label || "";

    if (typeof total === "number") {
      const prefix = label ? `${label}：` : "";
      if (typeof count === "number" && count !== total) {
        return `${prefix}共 ${total} 条，当前页 ${count} 条`;
      }
      return `${prefix}共 ${total} 条`;
    }

    if (Array.isArray(result.items)) {
      return `${label || "结果"}：返回 ${result.items.length} 条`;
    }

    if (result.success === true && result.message) {
      return result.message;
    }

    return data?.summary || "执行完成";
  }

  function upsertToolMessage(
    toolKey: string,
    label: string,
    content: string,
    payload: Record<string, any>,
  ) {
    const runId = payload?.runId || currentRunId.value;
    const existing = [...messages.value]
      .reverse()
      .find(
        (msg) =>
          msg.role === "tool" &&
          msg.toolKey === toolKey &&
          msg.runTrace?.runId === runId,
      );

    if (existing) {
      existing.content = content;
      existing.toolResult = payload.toolResult || existing.toolResult;
      return;
    }

    messages.value.push(
      createLocalMessage({
        role: "tool",
        content,
        toolKey,
        toolLabel: label || toolKey,
        toolInput: payload.input || null,
        toolResult: payload.toolResult || null,
        runTrace: { runId },
      }),
    );
  }

  function applyInterrupt(payload: any) {
    const interrupt = payload || {};
    const runId = interrupt.runId || currentRunId.value;
    const question = interrupt.question || "需要你确认后继续。";

    if (
      pendingInteraction.value &&
      pendingInteraction.value.runId === runId &&
      pendingInteraction.value.question === question
    ) {
      return;
    }

    pendingInteraction.value = {
      type: normalizeInteractionType(interrupt.type),
      runId,
      question,
      tool: interrupt.tool,
      toolName: interrupt.toolName,
      label: interrupt.label,
      input: interrupt.input || {},
      options: interrupt.options || [],
      multiple: interrupt.multiple === true,
      fields: interrupt.fields || [],
      placeholder: interrupt.placeholder || "",
      defaultValue: interrupt.defaultValue,
      riskLevel: interrupt.riskLevel,
      preview: interrupt.preview,
      plan: interrupt.plan,
      compare: interrupt.compare,
      steps: interrupt.steps,
    } as InteractionPayload;

    const alreadyInserted = [...messages.value].reverse().some((msg) => {
      const traceInterrupt = msg.runTrace?.interrupt;
      return (
        msg.role === "assistant" &&
        msg.content === question &&
        (traceInterrupt?.runId || msg.runTrace?.runId) === runId
      );
    });
    if (alreadyInserted) return;

    messages.value.push(
      createLocalMessage({
        role: "assistant",
        content: question,
        runTrace: { interrupt, runId },
      }),
    );
  }

  function handleStreamEvent(event: string, data: any, context: StreamContext) {
    if (data?.runId) currentRunId.value = data.runId;
    if (data?.conversationId) {
      currentConversationId.value = Number(data.conversationId);
    }

    switch (event) {
      case "run.started":
      case "run.resumed":
        runtimeStatus.value = "thinking";
        thinkingText.value = "正在分析你的需求...";
        ensureAssistantMessage(context);
        break;
      case "assistant.status":
        runtimeStatus.value = data?.status || "thinking";
        if (data?.status === "thinking") thinkingText.value = "正在思考...";
        if (data?.status === "tool_calling")
          thinkingText.value = "正在准备调用工具...";
        break;
      case "assistant.plan":
        runtimeStatus.value = "tool_calling";
        (data?.toolCalls || []).forEach((toolCall: any) => {
          thinkingText.value = `正在调用：${toolCall.label || toolCall.tool}`;
          upsertToolMessage(
            toolCall.tool,
            toolCall.label,
            `准备调用：${toolCall.label || toolCall.tool}`,
            data,
          );
        });
        break;
      case "tool.pending":
        runtimeStatus.value = "tool_calling";
        thinkingText.value = `正在执行：${data.label || data.tool}`;
        upsertToolMessage(data.tool, data.label, "执行中...", data);
        break;
      case "tool.completed": {
        thinkingText.value = `${data.label || data.tool} 执行完成，正在整理结果...`;
        const resultSummary = buildToolResultSummary(data);
        upsertToolMessage(data.tool, data.label, resultSummary, {
          ...data,
          toolResult: {
            success: true,
            summary: resultSummary,
            data: data.data,
          },
        });
        break;
      }
      case "tool.error":
        thinkingText.value = `${data.label || data.tool} 执行出错，正在处理...`;
        upsertToolMessage(data.tool, data.label, data.error || "执行失败", {
          ...data,
          toolResult: { success: false, error: data.error },
        });
        break;
      case "assistant.answer.delta":
        thinkingText.value = "正在回复...";
        appendAssistantDelta(data?.content || data?.delta || "", context);
        break;
      case "interrupt":
      case "run.waiting":
        applyInterrupt(data?.interrupt || data);
        loading.value = false;
        runtimeStatus.value = "waiting_user";
        break;
      case "run.completed":
        if (data?.reply) {
          if (context.assistantMsg && !context.assistantMsg.content) {
            context.assistantMsg.content = data.reply;
          } else if (!context.assistantMsg) {
            messages.value.push(
              createLocalMessage({ role: "assistant", content: data.reply }),
            );
          }
        }
        runtimeStatus.value = "idle";
        break;
      case "run.error":
      case "error":
        ElMessage.error(data?.error || "智能助手执行失败");
        runtimeStatus.value = "idle";
        break;
    }
  }

  async function consumeStream(
    start: (handlers: {
      onEvent: (event: { event: string; data: any }) => void;
      onError: (error: Error) => void;
      onDone: () => void;
    }) => Promise<void>,
  ) {
    const context: StreamContext = { fullReply: "", assistantMsg: null };
    try {
      await start({
        onEvent(event) {
          handleStreamEvent(event.event, event.data, context);
        },
        onError(error) {
          console.error("流式请求失败:", error);
          ElMessage.error("请求失败，请重试");
        },
        onDone() {
          loading.value = false;
        },
      });
    } catch (error) {
      console.error("发送失败:", error);
      ElMessage.error("发送失败");
    } finally {
      loading.value = false;
      if (!pendingInteraction.value) {
        runtimeStatus.value = "idle";
        thinkingText.value = "";
      }
      markAiAssistantRuntimeIdle();
      await loadConversations();
      if (currentConversationId.value) await loadMessages();
    }
  }

  // ========== Public Actions ==========

  async function sendMessage(
    message: string,
    pageContext?: AiAssistantPageContext,
  ) {
    if (!message || loading.value || pendingInteraction.value) return;

    loading.value = true;
    runtimeStatus.value = "thinking";
    thinkingText.value = "正在连接...";
    currentRunId.value = "";
    pendingInteraction.value = null;
    markAiAssistantRuntimeRunning();

    messages.value.push(createLocalMessage({ role: "user", content: message }));

    await consumeStream((handlers) =>
      AiAssistantApi.chatStream(
        {
          message,
          conversationId: currentConversationId.value || undefined,
          pageContext,
        },
        handlers,
      ),
    );
  }

  async function resumeInteraction(
    confirmed: boolean,
    resumeInput: Record<string, any>,
    reason: string,
  ) {
    const runId = currentRunId.value;
    if (!runId || loading.value) return;

    loading.value = true;
    runtimeStatus.value = "thinking";
    markAiAssistantRuntimeRunning();

    await consumeStream((handlers) =>
      AiAssistantApi.resumeRunStream(
        runId,
        {
          conversationId: currentConversationId.value || undefined,
          confirmed,
          input: resumeInput,
          reason,
        },
        handlers,
      ),
    );
  }

  async function clearMessages() {
    try {
      await ElMessageBox.confirm("确认清空当前会话的所有消息？", "提示", {
        type: "warning",
      });
      await AiAssistantApi.clearMessages({
        conversationId: currentConversationId.value || undefined,
      });
      messages.value = [];
      pendingInteraction.value = null;
      ElMessage.success("已清空");
    } catch (error) {
      if (error !== "cancel") ElMessage.error("清空失败");
    }
  }

  /** Initialize store — load conversations & select first one if needed */
  async function initialize() {
    await loadConversations();
    if (conversations.value.length && !currentConversationId.value) {
      currentConversationId.value = conversations.value[0].id;
      await loadMessages();
    }
  }

  return {
    // State
    conversations,
    messages,
    currentConversationId,
    loading,
    runtimeStatus,
    thinkingText,
    currentRunId,
    pendingInteraction,
    // Computed
    activeConversation,
    activePersonaName,
    activeConversationTitle,
    statusText,
    senderPlaceholder,
    inputHintText,
    canSend,
    hasPendingAssistantMessage,
    promptItems,
    // Actions
    initialize,
    loadConversations,
    loadMessages,
    selectConversation,
    createConversation,
    deleteConversation,
    sendMessage,
    resumeInteraction,
    clearMessages,
  };
});
