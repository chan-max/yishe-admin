<template>
  <div class="ai-assistant-panel">
    <div
      v-if="mobileSideVisible"
      class="ai-assistant-panel__mobile-mask"
      @click="closeMobileSide"
    />
    <div class="ai-assistant-panel__shell">
      <aside
        class="ai-assistant-panel__side"
        :class="{ 'is-mobile-visible': mobileSideVisible }"
      >
        <div class="ai-assistant-panel__side-head">
          <div class="ai-assistant-panel__side-brand">
            <div class="ai-assistant-panel__side-brand-mark">AI</div>
            <div class="ai-assistant-panel__side-brand-text">
              <div class="ai-assistant-panel__side-brand-title">智能助手</div>
              <div class="ai-assistant-panel__side-brand-meta">{{ conversationCountLabel }}</div>
            </div>
          </div>

          <Button type="text" size="small" :disabled="sending" @click="handleCreateConversation">
            <template #icon>
              <PlusOutlined />
            </template>
          </Button>
        </div>

        <Tabs v-model:activeKey="sideTab" size="small" class="ai-assistant-panel__side-tabs">
          <Tabs.TabPane key="conversations" tab="会话">
            <div
              v-loading="conversationsLoading"
              element-loading-text="正在加载会话"
              class="ai-assistant-panel__side-section"
            >
              <div
                v-if="!conversationItems.length && !conversationsLoading"
                class="ai-assistant-panel__side-empty"
              >
                暂无会话
              </div>

              <Conversations
                v-else
                :items="conversationItems"
                :active-key="activeConversationKey"
                :menu="buildConversationMenu"
                class="ai-assistant-panel__conversation-list"
                @active-change="handleConversationChange"
              />
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane key="workspace" tab="空间">
            <div class="ai-assistant-panel__side-stack">
              <section class="ai-assistant-panel__side-card">
                <div class="ai-assistant-panel__side-card-label">当前会话</div>
                <div class="ai-assistant-panel__side-card-title">{{ activeConversationTitle }}</div>
                <div class="ai-assistant-panel__side-card-text">
                  {{ activeConversationSubtitle }}
                </div>
              </section>

              <section class="ai-assistant-panel__side-card">
                <div class="ai-assistant-panel__side-card-label">能力</div>
                <div class="ai-assistant-panel__side-card-title">{{ capabilityCount }} 项</div>
                <div class="ai-assistant-panel__side-card-text">服务端可调用能力</div>
                <Button size="small" @click="openCapabilityDrawer">查看清单</Button>
              </section>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </aside>

      <section class="ai-assistant-panel__main">
        <header class="ai-assistant-panel__hero">
          <div class="ai-assistant-panel__hero-main">
            <div class="ai-assistant-panel__hero-title">{{ activeConversationTitle }}</div>
            <div class="ai-assistant-panel__hero-subtitle">{{ activeConversationSubtitle }}</div>
          </div>

          <div class="ai-assistant-panel__hero-actions">
            <Button class="ai-assistant-panel__mobile-side-trigger" size="small" @click="openMobileSide">
              会话
            </Button>

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
              <Button
                class="ai-assistant-panel__hero-icon-button"
                danger
                type="text"
                size="small"
                aria-label="清空记录"
                title="清空记录"
                :disabled="!activeConversationId || !messageCount"
              >
                <template #icon>
                  <DeleteOutlined />
                </template>
              </Button>
            </Popconfirm>
          </div>
        </header>

        <div
          ref="streamRef"
          v-loading="loadingHistory && !bubbleItems.length"
          element-loading-text="正在加载聊天记录"
          class="ai-assistant-panel__stream"
        >
          <template v-if="!(loadingHistory && !bubbleItems.length)">
            <div v-if="!bubbleItems.length" class="ai-assistant-panel__empty">
              <div class="ai-assistant-panel__empty-message">
                What do you want from me !!!
              </div>
            </div>

            <div v-else class="ai-assistant-panel__bubble-list-wrapper">
              <BubbleList
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

                  <div
                    v-else-if="isBubbleLoading(item)"
                    v-loading="true"
                    element-loading-text="正在处理中"
                    element-loading-background="transparent"
                    class="ai-assistant-panel__bubble-loading"
                  >
                    <span class="ai-assistant-panel__bubble-loading-placeholder">AI</span>
                  </div>

                  <div v-else class="ai-assistant-panel__message-text">
                    <template v-if="getBubbleItem(item).role === 'assistant'">
                      <MarkdownView :content="getBubbleContent(item)" />
                    </template>
                    <template v-else>
                      {{ getBubbleContent(item) }}
                    </template>
                  </div>
                </template>
              </BubbleList>
            </div>

            <div ref="chatEndRef" class="ai-assistant-panel__stream-anchor" />
          </template>
        </div>

        <div class="ai-assistant-panel__composer">
          <div class="ai-assistant-panel__composer-inner">
            <Sender
              :value="draft"
              :send-disabled="!draft.trim() || sending"
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
              <Tag v-if="selectedToolMeta?.riskLevel">
                风险 {{ formatRiskLevel(selectedToolMeta.riskLevel) }}
              </Tag>
              <Tag v-if="selectedToolMeta?.requiresBrowser">需要浏览器</Tag>
              <Tag v-if="selectedToolMeta?.confirmRequired" color="warning">需要确认</Tag>
              <Tag>{{ formatTime(selectedToolMessage.createdAt) }}</Tag>
            </div>
          </div>

          <Actions :items="detailActionItems" variant="border" @click="handleDetailAction" />
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
          <div class="ai-assistant-panel__detail-block-title">结构化结果</div>
          <AiAssistantStructuredResult :value="selectedToolMessage.toolResult || {}" />
        </div>

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
          <Tag>结构化能力目录</Tag>
        </div>
      </div>

      <div
        v-loading="capabilityCatalogLoading"
        element-loading-text="正在加载能力清单"
        class="ai-assistant-panel__capability-body"
      >
        <div
          v-if="!capabilityCatalogLoading && !capabilityGroups.length"
          class="ai-assistant-panel__capability-empty"
        >
          当前还没有可展示的 AI 能力
        </div>

        <div v-else-if="capabilityGroups.length" class="ai-assistant-panel__capability-groups">
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
                  <Tag :color="tool.riskLevel === 'high' ? 'error' : tool.riskLevel === 'medium' ? 'warning' : 'success'">
                    风险 {{ formatRiskLevel(tool.riskLevel) }}
                  </Tag>
                  <Tag v-if="tool.requiresBrowser">需要浏览器</Tag>
                  <Tag v-if="tool.confirmRequired" color="warning">需确认</Tag>
                  <Tag v-if="tool.idempotent">幂等</Tag>
                  <Tag>{{ summarizeInputSchema(tool.inputSchema) }}</Tag>
                  <Tag v-for="tag in tool.tags || []" :key="`${tool.name}:${tag}`">{{ tag }}</Tag>
                </div>

                <div
                  v-if="getToolInputFields(tool).length"
                  class="ai-assistant-panel__capability-item-section"
                >
                  <div class="ai-assistant-panel__capability-item-section-title">参数说明</div>

                  <div class="ai-assistant-panel__capability-param-list">
                    <div
                      v-for="item in getToolInputFields(tool)"
                      :key="`${tool.name}:${item.key}`"
                      class="ai-assistant-panel__capability-param-item"
                    >
                      <div class="ai-assistant-panel__capability-param-head">
                        <div class="ai-assistant-panel__capability-param-title">
                          <span>{{ item.field.label || item.key }}</span>
                          <code>{{ item.key }}</code>
                        </div>

                        <div class="ai-assistant-panel__capability-param-tags">
                          <Tag>{{ formatSchemaType(item.field.type) }}</Tag>
                          <Tag v-if="item.required" color="error">必填</Tag>
                        </div>
                      </div>

                      <div class="ai-assistant-panel__capability-param-desc">
                        {{ item.field.description || "无额外说明" }}
                      </div>

                      <div
                        v-if="
                          item.field.aliases?.length ||
                          item.field.enum?.length ||
                          item.field.default !== undefined ||
                          item.field.example !== undefined
                        "
                        class="ai-assistant-panel__capability-param-meta"
                      >
                        <span v-if="item.field.aliases?.length">
                          别名：{{ item.field.aliases.join(" / ") }}
                        </span>
                        <span v-if="item.field.enum?.length">
                          枚举：{{ formatSchemaEnum(item.field.enum) }}
                        </span>
                        <span v-if="item.field.default !== undefined">
                          默认值：{{ formatSchemaValue(item.field.default) }}
                        </span>
                        <span v-if="item.field.example !== undefined">
                          示例值：{{ formatSchemaValue(item.field.example) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-if="getToolExampleCases(tool).length"
                  class="ai-assistant-panel__capability-item-section"
                >
                  <div class="ai-assistant-panel__capability-item-section-title">使用案例</div>

                  <div class="ai-assistant-panel__capability-case-list">
                    <div
                      v-for="(caseItem, caseIndex) in getToolExampleCases(tool)"
                      :key="`${tool.name}:case:${caseIndex}`"
                      class="ai-assistant-panel__capability-case-item"
                    >
                      <div class="ai-assistant-panel__capability-case-title">
                        {{ caseItem.title || `示例 ${caseIndex + 1}` }}
                      </div>
                      <div class="ai-assistant-panel__capability-case-prompt">
                        {{ caseItem.prompt }}
                      </div>
                      <div
                        v-if="caseItem.description"
                        class="ai-assistant-panel__capability-case-desc"
                      >
                        {{ caseItem.description }}
                      </div>
                      <pre
                        v-if="caseItem.input && Object.keys(caseItem.input).length"
                        class="ai-assistant-panel__capability-case-input"
                        >{{ formatJson(caseItem.input) }}</pre
                      >
                      <Button size="small" type="text" @click="applyExamplePrompt(caseItem.prompt)">
                        使用此案例
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, h, nextTick, onActivated, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import dayjs from "dayjs";
import {
  ApiOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons-vue";
import { Avatar, Button, Drawer, Popconfirm, Tabs, Tag } from "ant-design-vue";
import {
  Actions,
  BubbleList,
  Conversations,
  Sender,
  ThoughtChain,
} from "ant-design-x-vue";
import type { ActionItem, ThoughtChainItem } from "ant-design-x-vue";
import { ElMessage } from "element-plus";
import type {
  AiAssistantPageContext,
  AiAssistantToolDefinition,
  AiAssistantToolExampleCase,
  AiAssistantToolSchemaProperty,
} from "@/api/aiAssistant";
import MarkdownView from "@/components/MarkdownView/index.vue";
import AiAssistantStructuredResult from "./AiAssistantStructuredResult.vue";
import {
  useAiAssistantRuntime,
  type AssistantBubbleItem,
  type DisplayMessage,
} from "./useAiAssistantRuntime";

defineOptions({ name: "AiAssistantPanel" });

const route = useRoute();
const {
  conversations,
  activeConversation,
  activeConversationId,
  loadingHistory,
  capabilityCatalog,
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
} = useAiAssistantRuntime();

const draft = ref("");
const sideTab = ref("conversations");
const streamRef = ref<HTMLDivElement | null>(null);
const chatEndRef = ref<HTMLDivElement | null>(null);
const capabilityDrawerOpen = ref(false);
const toolDetailOpen = ref(false);
const selectedToolMessage = ref<DisplayMessage | null>(null);
const mobileSideVisible = ref(false);
let scrollFrameId = 0;
let resizeCleanup: (() => void) | null = null;

const roleLabelMap: Record<"user" | "assistant" | "tool", string> = {
  user: "你",
  assistant: "助手",
  tool: "查询工具",
};

const currentRouteTitle = computed(() => {
  return String(route.meta?.title || route.name || route.path || "当前页面");
});

const conversationCountLabel = computed(() => {
  const count = conversations.value.length;
  return count ? `${count} 个上下文` : "暂无上下文";
});

const activeConversationTitle = computed(() => {
  return activeConversation.value?.title || "新会话";
});

const activeConversationSubtitle = computed(() => {
  if (activeConversation.value?.lastMessageAt) {
    return `最近更新 ${formatTime(activeConversation.value.lastMessageAt)}`;
  }
  return activeConversationId.value ? "当前会话尚未开始" : "可直接新建或发送消息";
});

const activeConversationKey = computed(() => {
  return activeConversationId.value ? String(activeConversationId.value) : "";
});

const conversationItems = computed(() => {
  return conversations.value.map((item) => ({
    key: String(item.id),
    label: item.title || "新会话",
  }));
});

const senderPlaceholder = computed(() => {
  return activeConversationId.value ? "输入问题后直接发送" : "输入问题后创建新会话";
});

const heroActionItems = computed<ActionItem[]>(() => {
  return [
    {
      key: "capabilities",
      label: "能力",
      icon: h(ApiOutlined),
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
  return capabilityCatalog.value?.summary || "这里展示的是当前 AI 助手已经接入并可调用的全部能力。";
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
      default: () => h("span", { class: "ai-assistant-panel__assistant-avatar-text" }, "AI"),
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
      default: () => h("span", { class: "ai-assistant-panel__user-avatar-text" }, "我"),
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
      variant: "borderless",
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

const selectedToolMeta = computed<AiAssistantToolDefinition | null>(() => {
  const toolKey = selectedToolMessage.value?.toolKey;
  if (!toolKey) {
    return null;
  }

  for (const group of capabilityGroups.value) {
    const matched = group.tools.find((tool) => tool.name === toolKey);
    if (matched) {
      return matched;
    }
  }

  return null;
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

const formatRiskLevel = (value?: AiAssistantToolDefinition["riskLevel"]) => {
  if (value === "high") {
    return "高";
  }
  if (value === "medium") {
    return "中";
  }
  return "低";
};

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
      const scrollTargets: HTMLElement[] = [];

      if (stream) {
        scrollTargets.push(stream);

        const nestedScrollableNodes = Array.from(
          stream.querySelectorAll<HTMLElement>("*"),
        ).filter((node) => {
          if (!(node instanceof HTMLElement)) {
            return false;
          }

          const style = window.getComputedStyle(node);
          const overflowY = style.overflowY;
          const canScroll =
            overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
          return canScroll && node.scrollHeight > node.clientHeight + 4;
        });

        nestedScrollableNodes.forEach((node) => {
          if (!scrollTargets.includes(node)) {
            scrollTargets.push(node);
          }
        });
      }

      if (anchor) {
        anchor.scrollIntoView({ block: "end", behavior });
      }

      scrollTargets.forEach((target) => {
        target.scrollTo({
          top: target.scrollHeight,
          behavior,
        });
      });
    });
  });
};

const refreshAll = async () => {
  await loadAll(true);
  await scrollToBottom();
};

const openMobileSide = () => {
  mobileSideVisible.value = true;
};

const closeMobileSide = () => {
  mobileSideVisible.value = false;
};

const openCapabilityDrawer = async () => {
  capabilityDrawerOpen.value = true;
  await loadCapabilityCatalog();
};

const handleDraftChange = (value: string) => {
  draft.value = value;
};

const clearChatHistory = async () => {
  if (!activeConversationId.value) {
    return;
  }

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

const handleCreateConversation = async () => {
  try {
    await createConversation();
    draft.value = "";
    selectedToolMessage.value = null;
    toolDetailOpen.value = false;
    sideTab.value = "conversations";
    closeMobileSide();
    await scrollToBottom();
  } catch (error: any) {
    console.error("创建 AI 助手会话失败:", error);
    ElMessage.error(error?.message || "创建会话失败");
  }
};

const handleDeleteConversation = async (conversationId: number) => {
  try {
    await deleteConversation(conversationId);
    selectedToolMessage.value = null;
    toolDetailOpen.value = false;
    ElMessage.success("会话已删除");
    await scrollToBottom();
  } catch (error: any) {
    console.error("删除 AI 助手会话失败:", error);
    ElMessage.error(error?.message || "删除会话失败");
  }
};

const buildConversationMenu = (conversation: { key: string }) => {
  return {
    items: [
      {
        key: `delete:${conversation.key}`,
        label: "删除会话",
        icon: h(DeleteOutlined),
        danger: true,
        onClick: () => {
          handleDeleteConversation(Number(conversation.key));
        },
      },
    ],
  };
};

const handleConversationChange = async (value: string) => {
  const conversationId = Number(value);
  if (!Number.isFinite(conversationId) || conversationId === activeConversationId.value) {
    return;
  }

  selectedToolMessage.value = null;
  toolDetailOpen.value = false;
  await switchConversation(conversationId);
  closeMobileSide();
  await scrollToBottom();
};

const handleHeroAction = async ({ key }: { key: string }) => {
  if (key === "capabilities") {
    await openCapabilityDrawer();
    return;
  }

  if (key === "refresh") {
    await refreshAll();
  }
};

type ToolInputFieldItem = {
  key: string;
  field: AiAssistantToolSchemaProperty;
  required: boolean;
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

const getToolInputFields = (tool: AiAssistantToolDefinition): ToolInputFieldItem[] => {
  const properties =
    tool.inputSchema &&
    typeof tool.inputSchema === "object" &&
    tool.inputSchema.properties &&
    typeof tool.inputSchema.properties === "object"
      ? tool.inputSchema.properties
      : {};
  const requiredSet = new Set(
    Array.isArray(tool.inputSchema?.required) ? tool.inputSchema.required : [],
  );

  return Object.entries(properties).map(([key, field]) => ({
    key,
    field: (field || {}) as AiAssistantToolSchemaProperty,
    required: requiredSet.has(key),
  }));
};

const formatSchemaType = (value: AiAssistantToolSchemaProperty["type"]) => {
  if (Array.isArray(value)) {
    return value.join(" / ");
  }
  return String(value || "any");
};

const formatSchemaValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.join(" / ");
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};

const formatSchemaEnum = (values: unknown[] | undefined) => {
  return Array.isArray(values) ? values.map((value) => formatSchemaValue(value)).join(" / ") : "";
};

const getToolExampleCases = (tool: AiAssistantToolDefinition): AiAssistantToolExampleCase[] => {
  if (Array.isArray(tool.exampleCases) && tool.exampleCases.length) {
    return tool.exampleCases;
  }

  if (Array.isArray(tool.examples) && tool.examples.length) {
    return tool.examples.map((prompt, index) => ({
      title: `示例 ${index + 1}`,
      prompt,
    }));
  }

  return [];
};

const applyExamplePrompt = (prompt: string) => {
  draft.value = String(prompt || "").trim();
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
  const handleResize = () => {
    if (window.innerWidth > 960) {
      mobileSideVisible.value = false;
    }
  };
  window.addEventListener("resize", handleResize);
  resizeCleanup = () => window.removeEventListener("resize", handleResize);

  await loadAll();
  await scrollToBottom();
});

onActivated(async () => {
  await scrollToBottom();
});

onBeforeUnmount(() => {
  if (scrollFrameId) {
    cancelAnimationFrame(scrollFrameId);
  }
  resizeCleanup?.();
  resizeCleanup = null;
});

watch(
  () => activeConversationId.value,
  async () => {
    selectedToolMessage.value = null;
    toolDetailOpen.value = false;
    await nextTick();
    await scrollToBottom();
  },
);

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

watch(
  () => ({
    loading: loadingHistory.value,
    count: bubbleItems.value.length,
  }),
  async (current, previous) => {
    if (!current.loading && current.count > 0) {
      await scrollToBottom();
      return;
    }

    if (previous?.loading && !current.loading) {
      await scrollToBottom();
    }
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

  &__mobile-mask {
    position: fixed;
    inset: 0;
    z-index: 29;
    background: rgba(15, 23, 42, 0.34);
    backdrop-filter: blur(2px);
  }

  &__shell {
    display: flex;
    gap: 24px;
    min-height: 0;
    height: 100%;
    background: transparent;
  }

  &__side {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: 240px;
    min-height: 0;
    height: 100%;
    padding-right: 4px;
    border-right: 1px solid var(--ai-border-color);
  }

  &__mobile-side-trigger {
    display: none;
  }

  &__side-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-shrink: 0;
    padding: 8px 0 10px;
  }

  &__side-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  &__side-brand-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 10px;
    background: var(--ai-primary-soft);
    color: var(--ai-primary);
    font-family: var(--ai-avatar-font);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    border: 1px solid color-mix(in srgb, var(--ai-primary) 16%, var(--ai-border-color) 84%);
  }

  &__side-brand-text {
    min-width: 0;
  }

  &__side-brand-title {
    color: var(--ai-text);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
  }

  &__side-brand-meta {
    margin-top: 2px;
    color: var(--ai-text-tertiary);
    font-size: 10px;
    line-height: 1.4;
  }

  &__side-tabs {
    display: flex;
    flex: 1;
    min-height: 0;
    flex-direction: column;
  }

  &__side-section {
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }

  &__side-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 160px;
    color: var(--ai-text-tertiary);
    font-size: 11px;
  }

  &__conversation-list {
    height: 100%;
    min-height: 0;
    padding-right: 2px;
  }

  &__side-stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__side-card {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 10px 0;
    border-top: 1px solid var(--ai-border-color);
  }

  &__side-card-label {
    color: var(--ai-text-tertiary);
    font-size: 10px;
    line-height: 1.4;
  }

  &__side-card-title {
    color: var(--ai-text);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
  }

  &__side-card-text {
    color: var(--ai-text-secondary);
    font-size: 11px;
    line-height: 1.6;
  }

  &__main {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    position: relative;
    overflow: hidden;
  }

  &__hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-shrink: 0;
    padding: 6px 0 4px;
    background: transparent;
  }

  &__hero-main {
    min-width: 0;
  }

  &__hero-title {
    color: var(--ai-text);
    font-size: 15px;
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.02em;
  }

  &__hero-subtitle {
    margin-top: 2px;
    color: var(--ai-text-tertiary);
    font-size: 11px;
    line-height: 1.5;
  }

  &__hero-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  &__hero-icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    min-width: 28px;
    height: 28px;
    padding: 0;
  }

  &__stream {
    flex: 1 1 auto;
    min-height: 0;
    padding: 6px 0 8px;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    display: flex;
    flex-direction: column;
  }

  &__bubble-list-wrapper {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  &__bubble-list {
    flex: 1;
    min-height: 0;
    width: 100%;
    margin: 0 auto;

    :deep(.ant-bubble-list) {
      max-height: 100%;
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 280px;
    width: 100%;
    flex: 1;
  }

  &__empty-message {
    font-size: 18px;
    font-weight: 600;
    color: var(--ai-text-secondary);
    letter-spacing: -0.02em;
  }

  &__stream-anchor {
    width: 100%;
    height: 1px;
    flex-shrink: 0;
  }

  &__bubble-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    font-size: 11px;
    color: var(--ai-text-tertiary);

    :deep(.ant-tag) {
      padding-inline: 5px;
      min-height: 16px;
      font-size: 9px;
      line-height: 14px;
      color: var(--ai-text-tertiary);
      background: color-mix(in srgb, var(--ai-primary) 4%, var(--ai-panel-bg) 96%);
      border-color: color-mix(in srgb, var(--ai-primary) 8%, var(--ai-border-color) 92%);
    }
  }

  &__message-text {
    font-size: 13px;
    line-height: 1.6;
    color: var(--ai-text);
    white-space: pre-wrap;
    word-break: break-word;

    :deep(.markdown-view) {
      font-size: 13px;
      line-height: 1.6;
    }
  }

  &__tool-message {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--ai-primary) 4%, transparent 96%);
  }

  &__tool-summary {
    font-size: 12px;
    line-height: 1.55;
    color: var(--ai-text-secondary);
    white-space: pre-wrap;
  }

  &__inline-actions {
    margin-left: -6px;

    :deep(.ant-btn) {
      font-size: 11px;
      color: var(--ai-text-tertiary);
    }
  }

  &__bubble-loading {
    position: relative;
    min-width: 152px;
    min-height: 64px;
    border-radius: 18px;
    overflow: hidden;

    :deep(.el-loading-mask) {
      border-radius: inherit;
      background: transparent;
      backdrop-filter: none;
    }

    :deep(.el-loading-spinner) {
      margin-top: -14px;
    }

    :deep(.el-loading-text) {
      margin-top: 8px;
      font-size: 12px;
      color: var(--ai-text-secondary);
      letter-spacing: 0.01em;
    }
  }

  &__bubble-loading-placeholder {
    display: inline-flex;
    width: 100%;
    min-height: 64px;
    opacity: 0;
    user-select: none;
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
    background: color-mix(in srgb, var(--ai-primary) 8%, transparent 92%);
    border-color: transparent;
    color: color-mix(in srgb, var(--ai-primary) 72%, var(--ai-text-secondary) 28%);
  }

  &__composer {
    position: relative;
    z-index: 10;
    flex-shrink: 0;
    padding: 8px 0 env(safe-area-inset-bottom, 0px);
    background: var(--ai-panel-bg);
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

  &__capability-body {
    position: relative;
    min-height: 260px;
  }

  &__capability-head {
    margin-bottom: 14px;
  }

  &__capability-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--ai-text);
    letter-spacing: -0.02em;
  }

  &__capability-summary {
    margin-top: 6px;
    max-width: 780px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--ai-text-secondary);
  }

  &__capability-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  &__capability-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 260px;
    color: var(--ai-text-secondary);
  }

  &__capability-groups {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__capability-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 14px 0;
    border-radius: 16px;
    border: 1px solid rgba(59, 130, 246, 0.18);
    border-left: 4px solid #3b82f6;
    background: rgba(59, 130, 246, 0.06);
  }

  &__capability-group-head {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__capability-group-title {
    font-size: 14px;
    font-weight: 600;
    color: #2563eb;
  }

  &__capability-group-desc {
    font-size: 11px;
    line-height: 1.55;
    color: var(--ai-text-secondary);
  }

  &__capability-list {
    border-top: 1px solid var(--ai-border-color);
  }

  &__capability-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 0;
    border-bottom: 1px dashed rgba(59, 130, 246, 0.18);
  }

  &__capability-item-main {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__capability-item-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--ai-text);
  }

  &__capability-item-key {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 10px;
    line-height: 1.45;
    color: #2563eb;
    word-break: break-all;
  }

  &__capability-item-desc {
    max-width: 820px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--ai-text-secondary);
  }

  &__capability-item-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__capability-item-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__capability-item-section-title {
    font-size: 11px;
    font-weight: 600;
    color: #2563eb;
  }

  &__capability-param-list,
  &__capability-case-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__capability-param-item,
  &__capability-case-item {
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(59, 130, 246, 0.16);
    background: rgba(59, 130, 246, 0.05);
  }

  &__capability-param-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  &__capability-param-title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
    color: var(--ai-text);
    font-size: 11px;
    font-weight: 600;

    code {
      padding: 1px 6px;
      border-radius: 999px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10px;
      line-height: 1.5;
      color: #1d4ed8;
      background: rgba(59, 130, 246, 0.1);
    }
  }

  &__capability-param-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: flex-end;
  }

  &__capability-param-desc,
  &__capability-case-desc {
    font-size: 11px;
    line-height: 1.6;
    color: var(--ai-text-secondary);
  }

  &__capability-param-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 11px;
    line-height: 1.55;
    color: var(--ai-text-secondary);
  }

  &__capability-case-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--ai-text);
  }

  &__capability-case-prompt {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--ai-text);
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__capability-case-input {
    margin: 8px 0 0;
    padding: 8px 10px;
    border-radius: 12px;
    background: rgba(59, 130, 246, 0.08);
    font-size: 10px;
    line-height: 1.6;
    color: var(--ai-text-secondary);
    white-space: pre-wrap;
    word-break: break-word;
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

:deep(.ai-assistant-panel__capability-drawer .ant-tag) {
  margin-inline-end: 0;
  padding-inline: 8px;
  min-height: 22px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 20px;
  border-color: rgba(59, 130, 246, 0.18);
  background: rgba(59, 130, 246, 0.08);
  color: #1d4ed8;
}

:deep(.ai-assistant-panel__welcome .ant-welcome-title) {
  font-size: 26px;
  line-height: 1.2;
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

:deep(.ant-tabs) {
  min-height: 0;
}

:deep(.ant-tabs-content-holder),
:deep(.ant-tabs-content),
:deep(.ant-tabs-tabpane) {
  height: 100%;
  min-height: 0;
}

:deep(.ant-tabs-nav) {
  margin-bottom: 8px;
}

:deep(.ant-tabs-tab) {
  padding-top: 0;
  padding-bottom: 6px;
  font-size: 12px;
}

:deep(.ai-assistant-panel__conversation-list.ant-conversations) {
  min-height: 0;
  height: 100%;
  padding: 0;
}

:deep(.ai-assistant-panel__conversation-list .ant-conversations-list) {
  padding-inline: 2px;
}

:deep(.ai-assistant-panel__conversation-list .ant-conversations-item) {
  min-height: 36px;
  padding-inline: 10px;
  border-radius: 10px;
}

:deep(.ai-assistant-panel__conversation-list .ant-conversations-label) {
  color: var(--ai-text);
  font-size: 12px;
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
  color: var(--ai-text);
}

:deep(.ant-bubble .ant-bubble-content-wrapper) {
  max-width: 100%;
}

:deep(.ant-bubble .ant-bubble-content-wrapper),
:deep(.ant-bubble .ant-bubble-content-wrapper *) {
  color: inherit;
}

:deep(.ant-bubble .ant-bubble-content) {
  max-width: 520px;
}

:deep(.ant-bubble .markdown-view img),
:deep(.ant-bubble .markdown-view__image) {
  max-width: 240px !important;
  max-height: 200px !important;
  width: auto !important;
  height: auto !important;
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

@media (max-width: 960px) {
  .ai-assistant-panel {
    min-height: 100%;

    &__shell {
      gap: 0;
    }

    &__side {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 30;
      width: min(320px, calc(100vw - 32px));
      padding: 16px 14px 14px;
      background: var(--ai-panel-bg);
      border-right: 1px solid var(--ai-border-color);
      box-shadow: 0 20px 48px rgba(15, 23, 42, 0.18);
      transform: translateX(calc(-100% - 20px));
      transition: transform 0.22s ease;
    }

    &__side.is-mobile-visible {
      transform: translateX(0);
    }

    &__side-section {
      max-height: none;
    }

    &__main {
      width: 100%;
    }

    &__mobile-side-trigger {
      display: inline-flex;
    }

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
    &__side-head {
      padding-bottom: 10px;
    }

    &__shell {
      gap: 0;
    }

    &__hero {
      align-items: flex-start;
      flex-direction: column;
    }

    &__hero-actions {
      width: 100%;
      justify-content: space-between;
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

    &__capability-param-head {
      flex-direction: column;
      align-items: flex-start;
    }

    &__capability-param-tags {
      justify-content: flex-start;
    }

    &__capability-item {
      padding: 14px 0;
    }
  }

  :deep(.ant-drawer-body) {
    padding: 12px;
  }

  :deep(.ai-assistant-panel__conversation-list) {
    max-height: none;
  }

  .ai-assistant-panel__empty {
    min-height: 200px;
    font-size: 22px;
  }
}
</style>
