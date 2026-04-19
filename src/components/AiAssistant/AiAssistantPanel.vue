<template>
  <div class="ai-assistant-panel">
    <div class="ai-assistant-panel__shell">
      <section class="ai-assistant-panel__main">
        <header class="ai-assistant-panel__hero">
          <div class="ai-assistant-panel__hero-actions">
            <Actions
              v-if="heroActionItems.length"
              :items="heroActionItems"
              variant="borderless"
              @click="handleHeroAction"
            />

            <Popconfirm
              title="确定清空当前聊天记录吗？"
              ok-text="清空"
              cancel-text="取消"
              @confirm="clearChatHistory"
            >
              <Button danger type="text" size="small" :disabled="!messageCount">
                清空记录
              </Button>
            </Popconfirm>
          </div>
        </header>

        <div ref="streamRef" class="ai-assistant-panel__stream">
          <div v-if="loadingHistory && !bubbleItems.length" class="ai-assistant-panel__loading">
            <Spin />
            <span>正在加载聊天记录...</span>
          </div>

          <template v-else>
            <div v-if="!bubbleItems.length" class="ai-assistant-panel__empty">
              开始对话
            </div>

            <BubbleList
              v-else
              class="ai-assistant-panel__bubble-list"
              :items="bubbleItems"
              :roles="bubbleRoles"
              :auto-scroll="false"
            >
              <template #header="{ item }">
                <div class="ai-assistant-panel__bubble-meta">
                  <span>{{ roleLabelMap[getBubbleItem(item).role] }}</span>
                  <span>{{ getBubbleTime(item) }}</span>
                  <Tag v-if="getBubbleToolLabel(item)">{{ getBubbleToolLabel(item) }}</Tag>
                </div>
              </template>

              <template #message="{ item }">
                <div v-if="isToolBubble(item)" class="ai-assistant-panel__tool-message">
                  <div class="ai-assistant-panel__tool-summary">
                    {{ getBubbleContent(item) }}
                  </div>
                  <Actions
                    class="ai-assistant-panel__inline-actions"
                    :items="buildToolBubbleActions(item)"
                    variant="borderless"
                    @click="handleToolBubbleAction"
                  />
                </div>

                <div v-else-if="isBubbleLoading(item)" class="ai-assistant-panel__typing">
                  <span class="ai-assistant-panel__typing-dot" />
                  <span class="ai-assistant-panel__typing-dot" />
                  <span class="ai-assistant-panel__typing-dot" />
                  <span class="ai-assistant-panel__typing-text">正在分析你的问题</span>
                </div>

                <div v-else class="ai-assistant-panel__message-text">
                  {{ getBubbleContent(item) }}
                </div>
              </template>
            </BubbleList>

            <div ref="chatEndRef" class="ai-assistant-panel__stream-anchor" />
          </template>
        </div>

        <div class="ai-assistant-panel__composer">
          <div class="ai-assistant-panel__composer-inner">
            <Sender
              :value="draft"
              :loading="sending"
              :send-disabled="!draft.trim()"
              :placeholder="senderPlaceholder"
              :auto-size="{ minRows: 3, maxRows: 6 }"
              @change="handleDraftChange"
              @submit="handleSubmit"
            />
          </div>
        </div>
      </section>
    </div>

    <Drawer
      v-model:open="toolDetailOpen"
      placement="right"
      width="100%"
      title="执行详情"
      class="ai-assistant-panel__detail-drawer"
    >
      <template v-if="selectedToolMessage">
        <div class="ai-assistant-panel__detail-head">
          <div>
            <div class="ai-assistant-panel__detail-title">
              {{ selectedToolMessage.toolLabel || "工具执行详情" }}
            </div>
            <div class="ai-assistant-panel__detail-meta">
              <Tag :color="selectedToolHasError ? 'error' : 'processing'">
                {{ selectedToolHasError ? "执行异常" : "执行完成" }}
              </Tag>
              <Tag>{{ formatTime(selectedToolMessage.createdAt) }}</Tag>
            </div>
          </div>

          <Actions
            :items="detailActionItems"
            variant="border"
            @click="handleDetailAction"
          />
        </div>

        <p class="ai-assistant-panel__detail-summary">
          {{ selectedToolMessage.content }}
        </p>

        <ThoughtChain
          class="ai-assistant-panel__detail-chain"
          :items="toolThoughtItems"
          :collapsible="{ expandedKeys: ['summary'] }"
        />

        <div class="ai-assistant-panel__detail-block">
          <div class="ai-assistant-panel__detail-block-title">工具入参</div>
          <pre>{{ formatJson(selectedToolMessage.toolInput) }}</pre>
        </div>

        <div class="ai-assistant-panel__detail-block">
          <div class="ai-assistant-panel__detail-block-title">工具结果</div>
          <pre>{{ formatJson(selectedToolMessage.toolResult) }}</pre>
        </div>
      </template>
    </Drawer>

    <Drawer
      v-model:open="capabilityDrawerOpen"
      placement="right"
      width="100%"
      title="AI 能力清单"
      class="ai-assistant-panel__capability-drawer"
    >
      <div class="ai-assistant-panel__capability-head">
        <div class="ai-assistant-panel__capability-title">AI 能力清单</div>
        <div class="ai-assistant-panel__capability-summary">
          {{ capabilitySummary }}
        </div>
        <div class="ai-assistant-panel__capability-meta">
          <Tag>{{ capabilityCount }} 项能力</Tag>
          <Tag>服务端执行</Tag>
          <Tag>只读能力</Tag>
        </div>
      </div>

      <div
        v-if="capabilityCatalogLoading && !capabilityGroups.length"
        class="ai-assistant-panel__capability-loading"
      >
        <Spin />
        <span>正在加载能力清单...</span>
      </div>

      <div v-else-if="!capabilityGroups.length" class="ai-assistant-panel__capability-empty">
        当前还没有可展示的 AI 能力
      </div>

      <div v-else class="ai-assistant-panel__capability-groups">
        <section
          v-for="group in capabilityGroups"
          :key="group.key"
          class="ai-assistant-panel__capability-group"
        >
          <div class="ai-assistant-panel__capability-group-head">
            <div class="ai-assistant-panel__capability-group-title">{{ group.label }}</div>
            <div class="ai-assistant-panel__capability-group-desc">{{ group.description }}</div>
          </div>

          <div class="ai-assistant-panel__capability-list">
            <article
              v-for="tool in group.tools"
              :key="tool.name"
              class="ai-assistant-panel__capability-item"
            >
              <div class="ai-assistant-panel__capability-item-main">
                <div class="ai-assistant-panel__capability-item-title">{{ tool.label }}</div>
                <div class="ai-assistant-panel__capability-item-key">{{ tool.name }}</div>
                <div class="ai-assistant-panel__capability-item-desc">{{ tool.description }}</div>
              </div>

              <div class="ai-assistant-panel__capability-item-tags">
                <Tag>{{ tool.runtime === "server" ? "服务端" : tool.runtime }}</Tag>
                <Tag>{{ tool.readOnly ? "只读" : "可执行" }}</Tag>
                <Tag>{{ summarizeInputSchema(tool.inputSchema) }}</Tag>
              </div>

              <div v-if="tool.examples?.length" class="ai-assistant-panel__capability-item-examples">
                <span>示例提问</span>
                <span>{{ tool.examples.join(" / ") }}</span>
              </div>
            </article>
          </div>
        </section>
      </div>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useRoute } from "vue-router";
import dayjs from "dayjs";
import {
  ApiOutlined,
  AppstoreOutlined,
  CopyOutlined,
  ReloadOutlined,
} from "@ant-design/icons-vue";
import {
  Avatar,
  Button,
  Drawer,
  Popconfirm,
  Spin,
  Tag,
} from "ant-design-vue";
import {
  Actions,
  BubbleList,
  Sender,
  ThoughtChain,
} from "ant-design-x-vue";
import type { ActionItem, ThoughtChainItem } from "ant-design-x-vue";
import { ElMessage } from "element-plus";
import type { AiAssistantPageContext } from "@/api/aiAssistant";
import {
  useAiAssistantRuntime,
  type AssistantBubbleItem,
  type DisplayMessage,
} from "./useAiAssistantRuntime";

defineOptions({ name: "AiAssistantPanel" });

const route = useRoute();
const {
  loadingHistory,
  capabilityCatalog,
  capabilityCatalogLoading,
  bubbleItems,
  messageCount,
  sending,
  loadAll,
  loadCapabilityCatalog,
  clearHistory,
  sendMessage,
} = useAiAssistantRuntime();

const draft = ref("");
const streamRef = ref<HTMLDivElement | null>(null);
const chatEndRef = ref<HTMLDivElement | null>(null);
const capabilityDrawerOpen = ref(false);
const toolDetailOpen = ref(false);
const selectedToolMessage = ref<DisplayMessage | null>(null);
let scrollFrameId = 0;

const roleLabelMap: Record<"user" | "assistant" | "tool", string> = {
  user: "你",
  assistant: "助手",
  tool: "查询工具",
};

const currentRouteTitle = computed(() => {
  return String(route.meta?.title || route.name || route.path || "当前页面");
});

const senderPlaceholder = computed(() => {
  return "输入问题后直接发送";
});

const heroActionItems = computed<ActionItem[]>(() => {
  return [
    {
      key: "capabilities",
      label: "能力",
      icon: h(AppstoreOutlined),
    },
    {
      key: "refresh",
      label: "刷新",
      icon: h(ReloadOutlined),
    },
  ];
});

const capabilityGroups = computed(() => capabilityCatalog.value?.groups || []);

const capabilitySummary = computed(() => {
  return (
    capabilityCatalog.value?.summary ||
    "这里展示的是当前 AI 助手已经接入并可调用的全部能力。"
  );
});

const capabilityCount = computed(() => capabilityCatalog.value?.total || 0);

const renderAssistantAvatar = () =>
  h(
    Avatar,
    {
      class: "ai-assistant-panel__assistant-avatar",
      shape: "circle",
    },
    {
      default: () =>
        h(
          "span",
          { class: "ai-assistant-panel__assistant-avatar-text" },
          "AI",
        ),
    },
  );

const renderUserAvatar = () =>
  h(
    Avatar,
    {
      class: "ai-assistant-panel__user-avatar",
      shape: "circle",
    },
    {
      default: () =>
        h(
          "span",
          { class: "ai-assistant-panel__user-avatar-text" },
          "我",
        ),
    },
  );

const bubbleRoles = computed<Record<string, any>>(() => {
  return {
    assistant: {
      placement: "start",
      variant: "shadow",
      avatar: renderAssistantAvatar,
    },
    user: {
      placement: "end",
      variant: "filled",
      avatar: renderUserAvatar,
    },
    tool: {
      placement: "start",
      variant: "outlined",
      shape: "corner",
      avatar: () =>
        h(
          Avatar,
          {
            class: "ai-assistant-panel__tool-avatar",
            shape: "circle",
          },
          { default: () => h(ApiOutlined) },
        ),
    },
  };
});

const selectedToolHasError = computed(() => {
  const result = selectedToolMessage.value?.toolResult;
  if (!result || typeof result !== "object") {
    return false;
  }
  return !!String((result as Record<string, any>).error || "").trim();
});

const toolThoughtItems = computed<ThoughtChainItem[]>(() => {
  const current = selectedToolMessage.value;
  if (!current) {
    return [];
  }

  const items: ThoughtChainItem[] = [
    {
      key: "summary",
      title: current.toolLabel || "工具执行",
      description: current.content,
      status: selectedToolHasError.value ? "error" : "success",
    },
  ];

  if (current.toolInput) {
    items.push({
      key: "input",
      title: "工具入参",
      description: summarizeJson(current.toolInput),
      content: formatJson(current.toolInput),
      status: "success",
    });
  }

  if (current.toolResult) {
    items.push({
      key: "result",
      title: "工具结果",
      description: selectedToolHasError.value
        ? "检测到错误字段"
        : summarizeJson(current.toolResult),
      content: formatJson(current.toolResult),
      status: selectedToolHasError.value ? "error" : "success",
    });
  }

  return items;
});

const detailActionItems = computed<ActionItem[]>(() => {
  return [
    {
      key: "copy-summary",
      label: "复制摘要",
      icon: h(CopyOutlined),
    },
    {
      key: "copy-input",
      label: "复制入参",
      icon: h(CopyOutlined),
    },
    {
      key: "copy-result",
      label: "复制结果",
      icon: h(CopyOutlined),
    },
  ];
});

const buildPageContext = (): AiAssistantPageContext => {
  return {
    routePath: route.path,
    fullPath: route.fullPath,
    routeName: route.name ? String(route.name) : "",
    routeTitle: currentRouteTitle.value,
    query: route.query,
    params: route.params,
  };
};

const formatTime = (value: string) => dayjs(value).format("MM-DD HH:mm");

const formatJson = (value: unknown) => {
  return JSON.stringify(value ?? {}, null, 2);
};

const getBubbleItem = (item: unknown) => item as AssistantBubbleItem;

const getBubbleContent = (item: unknown) => getBubbleItem(item).content;

const getBubbleToolLabel = (item: unknown) => getBubbleItem(item).toolLabel;

const getBubbleTime = (item: unknown) => formatTime(getBubbleItem(item).createdAt);

const isToolBubble = (item: unknown) => getBubbleItem(item).role === "tool";

const isBubbleLoading = (item: unknown) => !!getBubbleItem(item).loading;

const summarizeJson = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return "无结构化内容";
  }

  const keys = Object.keys(value as Record<string, any>);
  if (!keys.length) {
    return "空对象";
  }

  return `包含 ${keys.length} 个字段：${keys.slice(0, 5).join("、")}${keys.length > 5 ? " 等" : ""}`;
};

const scrollToBottom = async (behavior: ScrollBehavior = "auto") => {
  await nextTick();
  if (scrollFrameId) {
    cancelAnimationFrame(scrollFrameId);
  }

  scrollFrameId = requestAnimationFrame(() => {
    scrollFrameId = requestAnimationFrame(() => {
      const anchor = chatEndRef.value;
      const stream = streamRef.value;
      if (anchor) {
        anchor.scrollIntoView({ block: "end", behavior });
      }
      if (stream) {
        stream.scrollTo({
          top: stream.scrollHeight,
          behavior,
        });
      }
    });
  });
};

const refreshAll = async () => {
  await loadAll(true);
  await scrollToBottom();
};

const handleDraftChange = (value: string) => {
  draft.value = value;
};

const clearChatHistory = async () => {
  try {
    await clearHistory();
    selectedToolMessage.value = null;
    toolDetailOpen.value = false;
    ElMessage.success("聊天记录已清空");
  } catch (error: any) {
    console.error("清空 AI 助手聊天记录失败:", error);
    ElMessage.error(error?.message || "清空失败");
  }
};

const openToolDetail = (item: AssistantBubbleItem | DisplayMessage) => {
  selectedToolMessage.value = "rawMessage" in item ? item.rawMessage : item;
  toolDetailOpen.value = true;
};

const handleSubmit = async () => {
  const message = draft.value.trim();
  if (!message) {
    ElMessage.warning("请输入查询内容");
    return;
  }

  draft.value = "";
  sendMessage(message, buildPageContext());
  await scrollToBottom("smooth");
};

const handleHeroAction = async ({ key }: { key: string }) => {
  if (key === "capabilities") {
    capabilityDrawerOpen.value = true;
    await loadCapabilityCatalog();
    return;
  }

  if (key === "refresh") {
    await refreshAll();
  }
};

const summarizeInputSchema = (value: Record<string, any> | null | undefined) => {
  const properties =
    value && typeof value === "object" && value.properties && typeof value.properties === "object"
      ? Object.keys(value.properties)
      : [];

  if (!properties.length) {
    return "无需额外参数";
  }

  return `参数：${properties.join("、")}`;
};

const buildToolBubbleActions = (item: unknown): ActionItem[] => {
  const bubbleItem = getBubbleItem(item);
  return [
    {
      key: `detail:${bubbleItem.key}`,
      label: "查看详情",
    },
    {
      key: `copy:${bubbleItem.key}`,
      label: "复制摘要",
    },
  ];
};

const handleToolBubbleAction = async ({ key }: { key: string }) => {
  if (key.startsWith("detail:")) {
    const targetKey = key.slice("detail:".length);
    const target = bubbleItems.value.find((item) => item.key === targetKey);
    if (target) {
      openToolDetail(target);
    }
    return;
  }

  if (key.startsWith("copy:")) {
    const targetKey = key.slice("copy:".length);
    const target = bubbleItems.value.find((item) => item.key === targetKey);
    if (target) {
      await copyText(target.content, "摘要已复制");
    }
  }
};

const handleDetailAction = async ({ key }: { key: string }) => {
  const current = selectedToolMessage.value;
  if (!current) {
    return;
  }

  if (key === "copy-summary") {
    await copyText(current.content, "摘要已复制");
    return;
  }

  if (key === "copy-input") {
    await copyText(formatJson(current.toolInput), "工具入参已复制");
    return;
  }

  if (key === "copy-result") {
    await copyText(formatJson(current.toolResult), "工具结果已复制");
  }
};

const copyText = async (value: string, successMessage: string) => {
  try {
    await navigator.clipboard.writeText(value);
    ElMessage.success(successMessage);
  } catch (error) {
    console.error("复制失败:", error);
    ElMessage.error("复制失败");
  }
};

onMounted(async () => {
  await loadAll();
  await scrollToBottom();
});

onBeforeUnmount(() => {
  if (scrollFrameId) {
    cancelAnimationFrame(scrollFrameId);
  }
});

watch(
  () =>
    bubbleItems.value
      .map((item) => `${item.key}:${item.status}:${item.loading}:${item.content.length}`)
      .join("|"),
  async () => {
    await scrollToBottom();
  },
  {
    flush: "post",
  },
);
</script>

<style lang="scss" scoped>
.ai-assistant-panel {
  height: 100%;
  min-height: 0;
  color: var(--ai-text);
  background: transparent;

  &__shell {
    display: flex;
    min-height: 0;
    height: 100%;
    background: transparent;
    overflow: hidden;
  }

  &__main {
    display: flex;
    flex-direction: column;
    min-height: 0;
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  &__hero {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    flex-shrink: 0;
    padding: 6px 0 4px;
    background: transparent;
  }

  &__hero-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  &__stream {
    flex: 1;
    min-height: 0;
    padding: 6px 0 18px;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    scroll-padding-bottom: 120px;
  }

  &__loading,
  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 240px;
    width: 100%;
    margin: 0 auto;
  }

  &__loading {
    flex-direction: column;
    gap: 10px;
    color: var(--ai-text-secondary);
  }

  &__empty {
    color: var(--ai-text-secondary);
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  &__bubble-list {
    height: auto;
    min-height: 100%;
    width: 100%;
    margin: 0 auto;
  }

  &__stream-anchor {
    width: 100%;
    height: 1px;
  }

  &__bubble-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    font-size: 11px;
    color: var(--ai-text-tertiary);
  }

  &__message-text {
    font-size: 13px;
    line-height: 1.75;
    color: var(--ai-text);
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__tool-message {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  &__tool-summary {
    font-size: 13px;
    line-height: 1.7;
    color: var(--ai-text);
    white-space: pre-wrap;
  }

  &__inline-actions {
    margin-left: -6px;
  }

  &__typing {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 24px;
    color: var(--ai-text-secondary);
  }

  &__typing-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--ai-primary);
    animation: ai-assistant-bounce 1s infinite ease-in-out;

    &:nth-child(2) {
      animation-delay: 0.15s;
    }

    &:nth-child(3) {
      animation-delay: 0.3s;
    }
  }

  &__typing-text {
    margin-left: 2px;
    font-size: 12px;
  }

  &__assistant-avatar,
  &__user-avatar,
  &__tool-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid transparent;
  }

  &__assistant-avatar {
    position: relative;
    background:
      radial-gradient(
        circle at 32% 28%,
        color-mix(in srgb, #ffffff 54%, transparent 46%) 0%,
        transparent 54%
      ),
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--ai-primary) 24%, var(--app-content-surface-color) 76%) 0%,
        var(--ai-assistant-avatar-bg) 100%
      );
    border-color: var(--ai-assistant-avatar-border);
    color: var(--ai-assistant-avatar-text);
  }

  &__assistant-avatar-text,
  &__user-avatar-text {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-family: var(--ai-avatar-font);
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    text-align: center;
    letter-spacing: 0.04em;
  }

  &__assistant-avatar-text {
    text-transform: uppercase;
  }

  &__user-avatar {
    background: var(--ai-user-avatar-bg);
    border-color: var(--ai-user-avatar-border);
    color: var(--ai-user-avatar-text);
  }

  &__user-avatar-text {
    letter-spacing: 0;
  }

  &__tool-avatar {
    background: var(--ai-primary-soft);
    border-color: color-mix(in srgb, var(--ai-primary) 14%, var(--ai-border-color) 86%);
    color: var(--ai-primary);
  }

  &__composer {
    position: sticky;
    bottom: 0;
    z-index: 1;
    margin-top: auto;
    flex-shrink: 0;
    padding: 10px 0 env(safe-area-inset-bottom, 0px);
    background: linear-gradient(180deg, transparent 0%, var(--ai-panel-bg) 22%);
  }

  &__composer-inner {
    width: 100%;
    margin: 0 auto;
  }

  &__detail-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  &__detail-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--ai-text);
  }

  &__detail-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  &__detail-summary {
    margin: 0 0 14px;
    font-size: 13px;
    line-height: 1.7;
    color: var(--ai-text-secondary);
  }

  &__detail-chain {
    margin-bottom: 16px;
  }

  &__detail-block {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--ai-border-color);

    pre {
      margin: 0;
      font-size: 12px;
      line-height: 1.65;
      color: var(--ai-text);
      white-space: pre-wrap;
      word-break: break-word;
    }
  }

  &__detail-block-title {
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--ai-text);
  }

  &__capability-head {
    margin-bottom: 20px;
  }

  &__capability-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--ai-text);
    letter-spacing: -0.02em;
  }

  &__capability-summary {
    margin-top: 8px;
    max-width: 780px;
    font-size: 13px;
    line-height: 1.7;
    color: var(--ai-text-secondary);
  }

  &__capability-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  &__capability-loading,
  &__capability-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 260px;
    color: var(--ai-text-secondary);
  }

  &__capability-loading {
    flex-direction: column;
    gap: 10px;
  }

  &__capability-groups {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  &__capability-group {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__capability-group-head {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__capability-group-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--ai-text);
  }

  &__capability-group-desc {
    font-size: 12px;
    line-height: 1.7;
    color: var(--ai-text-secondary);
  }

  &__capability-list {
    border-top: 1px solid var(--ai-border-color);
  }

  &__capability-item {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px 0;
    border-bottom: 1px solid var(--ai-border-color);
  }

  &__capability-item-main {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__capability-item-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--ai-text);
  }

  &__capability-item-key {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
    line-height: 1.6;
    color: var(--ai-text-tertiary);
    word-break: break-all;
  }

  &__capability-item-desc {
    max-width: 820px;
    font-size: 13px;
    line-height: 1.75;
    color: var(--ai-text-secondary);
  }

  &__capability-item-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__capability-item-examples {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    font-size: 12px;
    line-height: 1.7;
    color: var(--ai-text-secondary);

    span:first-child {
      color: var(--ai-text-tertiary);
    }
  }
}

:deep(.ant-drawer-content),
:deep(.ant-drawer-header) {
  background: var(--ai-panel-bg);
}

:deep(.ai-assistant-panel__detail-drawer .ant-drawer-content-wrapper) {
  width: 100% !important;
  max-width: 100% !important;
}

:deep(.ai-assistant-panel__capability-drawer .ant-drawer-content-wrapper) {
  width: 100% !important;
  max-width: 100% !important;
}

:deep(.ant-drawer-body) {
  padding: 16px;
  color: var(--ai-text);
  background: var(--ai-panel-bg);
}

:deep(.ant-drawer-header) {
  padding: 14px 16px;
  border-bottom-color: var(--ai-border-color);
}

:deep(.ant-drawer-title),
:deep(.ant-drawer-close) {
  color: var(--ai-text);
}

:deep(.ant-btn-default) {
  border-color: var(--ai-border-strong-color);
}

:deep(.ant-btn) {
  height: 32px;
  padding: 0 12px;
  border-radius: var(--ai-radius-sm);
  font-size: 12px;
  box-shadow: none;
}

:deep(.ant-float-btn-body) {
  box-shadow: none;
}

:deep(.ant-bubble) {
  max-width: 100%;
}

:deep(.ant-bubble-content) {
  border-radius: 16px;
  padding: 12px 14px;
}

:deep(.ant-bubble-end .ant-bubble-content) {
  background: var(--ai-user-bubble-bg);
  border: 1px solid color-mix(in srgb, var(--ai-primary) 16%, var(--ai-border-color) 84%);
}

:deep(.ant-bubble:not(.ant-bubble-end) .ant-bubble-content) {
  background: var(--ai-assistant-bubble-bg);
}

:deep(.ant-bubble .ant-bubble-content) {
  border: 0;
  box-shadow: none;
}

:deep(.ant-bubble .ant-bubble-content-wrapper) {
  max-width: 100%;
}

:deep(.ant-bubble .ant-avatar) {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
}

:deep(.ant-bubble .ant-bubble-avatar) {
  display: inline-flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 2px;
}

:deep(.ant-bubble-list) {
  padding-right: 2px;
  min-height: 100%;
}

:deep(.ant-sender) {
  width: 100%;
  flex-shrink: 0;
  border: 1px solid var(--ai-border-color);
  border-radius: 20px;
  background: var(--ai-composer-bg);
  box-shadow: none;
}

:deep(.ant-sender-content) {
  padding: 12px 14px;
  gap: 10px;
  align-items: flex-end;
}

:deep(.ant-sender-input) {
  display: flex;
  align-items: flex-start;
  min-height: 44px;
}

:deep(.ant-sender-input textarea) {
  min-height: 44px;
  max-height: 132px;
  padding: 10px 0 !important;
  overflow-y: auto !important;
  box-sizing: border-box;
  color: var(--ai-text) !important;
  font-size: 13px;
  line-height: 24px;
}

:deep(.ant-sender-input textarea::placeholder) {
  color: var(--ai-text-tertiary) !important;
}

:deep(.ant-sender-actions-list) {
  align-items: center;
}

:deep(.ant-sender-actions) {
  align-self: flex-end;
  padding-bottom: 4px;
}

:deep(.ant-sender-actions .ant-btn) {
  width: 34px;
  min-width: 34px;
  height: 34px;
  padding: 0;
}

:deep(.ant-sender-actions .ant-btn-primary) {
  background: var(--ai-primary);
}

:deep(.ant-tag) {
  margin-inline-end: 0;
  border-radius: 999px;
  font-size: 12px;
  line-height: 20px;
  color: var(--ai-text);
  background: color-mix(in srgb, var(--ai-primary) 8%, var(--ai-panel-bg) 92%);
  border-color: color-mix(in srgb, var(--ai-primary) 16%, var(--ai-border-color) 84%);
}

:deep(.ant-actions) {
  color: var(--ai-text-secondary);
}

:deep(.ant-actions-item) {
  color: inherit;
}

:deep(.ant-actions-item:hover) {
  color: var(--ai-text);
}

:deep(.ant-thought-chain-item-header),
:deep(.ant-thought-chain-item-content-box),
:deep(.ant-thought-chain-item-footer) {
  border-color: var(--ai-border-color);
  background: var(--ai-panel-soft-bg);
  box-shadow: none;
}

:deep(.ant-thought-chain-item-header),
:deep(.ant-thought-chain-item-content-box) {
  border-radius: var(--ai-radius-md);
}

:deep(.ant-thought-chain-item-title),
:deep(.ant-thought-chain-item-desc),
:deep(.ant-thought-chain-item-content),
:deep(.ant-thought-chain-item-extra) {
  color: var(--ai-text);
}

:deep(.ant-thought-chain-item-desc) {
  color: var(--ai-text-secondary);
}

@keyframes ai-assistant-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.85);
    opacity: 0.45;
  }

  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 960px) {
  .ai-assistant-panel {
    min-height: 100%;

    &__hero {
      padding: 6px 0 4px;
    }

    &__stream {
      padding: 6px 0 16px;
    }

    &__composer {
      padding: 10px 0 env(safe-area-inset-bottom, 0px);
    }
  }
}

@media (max-width: 640px) {
  .ai-assistant-panel {
    &__hero-actions {
      width: auto;
      justify-content: flex-end;
    }

    &__stream {
      padding: 4px 0 14px;
    }

    &__composer {
      padding: 10px 0 env(safe-area-inset-bottom, 0px);
    }

    &__detail-head {
      flex-direction: column;
      align-items: flex-start;
    }

    &__detail-block {
      margin-top: 14px;
      padding-top: 12px;
    }

    &__capability-item {
      padding: 14px 0;
    }
  }

  :deep(.ant-drawer-body) {
    padding: 12px;
  }

  .ai-assistant-panel__empty {
    min-height: 200px;
    font-size: 22px;
  }
}
</style>
