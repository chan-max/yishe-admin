<template>
  <div class="ai-assistant-panel">
    <div
      v-if="mobileSideVisible"
      class="ai-assistant-panel__mobile-mask"
      @click="closeMobileSide"
    />
    <div class="ai-assistant-panel__shell">
      <aside class="ai-assistant-panel__side" :class="{ 'is-mobile-visible': mobileSideVisible }">
        <div class="ai-assistant-panel__side-head">
          <div class="ai-assistant-panel__side-brand">
            <div class="ai-assistant-panel__side-brand-mark">AI</div>
            <div class="ai-assistant-panel__side-brand-text">
              <div class="ai-assistant-panel__side-brand-title">智能助手</div>
              <div class="ai-assistant-panel__side-brand-meta">{{ conversationCountLabel }}</div>
            </div>
          </div>

          <el-button text size="small" :disabled="sending" @click="handleCreateConversation">
            <el-icon><PlusOutlined /></el-icon>
          </el-button>
        </div>

        <el-tabs v-model="sideTab" class="ai-assistant-panel__side-tabs">
          <el-tab-pane label="会话" name="conversations">
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
                class="ai-assistant-panel__conversation-list"
                @active-change="handleConversationChange"
              />
            </div>
          </el-tab-pane>

          <el-tab-pane label="空间" name="workspace">
            <div class="ai-assistant-panel__side-stack">
              <section class="ai-assistant-panel__side-card">
                <div class="ai-assistant-panel__side-card-label">当前会话</div>
                <div class="ai-assistant-panel__side-card-title">{{ activeConversationTitle }}</div>
                <div class="ai-assistant-panel__side-card-text">
                  {{ activeConversationSubtitle }}
                </div>
              </section>

              <section class="ai-assistant-panel__side-card">
                <div class="ai-assistant-panel__side-card-label">
                  {{ activeConversationId ? "当前角色" : "新会话默认角色" }}
                </div>
                <div class="ai-assistant-panel__side-card-title">
                  {{ selectedPersona?.name || "默认助手" }}
                </div>
                <div class="ai-assistant-panel__side-card-text">
                  {{ selectedPersona?.description || "服务端内置通用助手" }}
                </div>

                <el-button
                  size="small"
                  :loading="personasLoading && !selectedPersona"
                  @click="openPersonaDialog"
                >
                  切换角色
                </el-button>
              </section>

              <section class="ai-assistant-panel__side-card">
                <div class="ai-assistant-panel__side-card-label">能力</div>
                <div class="ai-assistant-panel__side-card-title">{{ capabilityCount }} 项</div>
                <div class="ai-assistant-panel__side-card-text">服务端可调用能力</div>
                <el-button size="small" @click="openCapabilityDrawer">查看清单</el-button>
              </section>
            </div>
          </el-tab-pane>
        </el-tabs>
      </aside>

      <section class="ai-assistant-panel__main">
        <header class="ai-assistant-panel__hero">
          <div class="ai-assistant-panel__hero-main">
            <div class="ai-assistant-panel__hero-title-row">
              <div class="ai-assistant-panel__hero-title">{{ activeConversationTitle }}</div>
              <el-tag v-if="selectedPersona?.name" effect="plain" round>{{
                selectedPersona.name
              }}</el-tag>
            </div>
            <div class="ai-assistant-panel__hero-subtitle">{{ activeConversationSubtitle }}</div>
          </div>

          <div class="ai-assistant-panel__hero-actions">
            <el-button
              class="ai-assistant-panel__mobile-side-trigger"
              size="small"
              @click="openMobileSide"
            >
              会话
            </el-button>

            <Actions
              v-if="heroActionItems.length"
              :items="heroActionItems"
              variant="borderless"
              @click="handleHeroAction"
            />

            <el-button
              class="ai-assistant-panel__hero-icon-button"
              text
              size="small"
              aria-label="清空记录"
              title="清空记录"
              :disabled="!activeConversationId || !messageCount"
              @click="confirmClearChatHistory"
            >
              <el-icon><DeleteOutlined /></el-icon>
            </el-button>
          </div>
        </header>

        <div
          ref="streamRef"
          v-loading="loadingHistory && !bubbleItems.length"
          element-loading-text="正在加载聊天记录"
          class="ai-assistant-panel__stream"
          @scroll.passive="handleStreamScroll"
        >
          <template v-if="!(loadingHistory && !bubbleItems.length)">
            <div v-if="!bubbleItems.length" class="ai-assistant-panel__empty">
              <div class="ai-assistant-panel__empty-message">done is better than perfect</div>
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
                    <el-tag v-if="getBubbleToolLabel(item)" effect="plain" round>{{
                      getBubbleToolLabel(item)
                    }}</el-tag>
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
                    v-else-if="isBubblePureLoading(item)"
                    v-loading="true"
                    element-loading-text="正在处理中"
                    element-loading-background="transparent"
                    class="ai-assistant-panel__bubble-loading"
                  >
                    <span class="ai-assistant-panel__bubble-loading-placeholder">AI</span>
                  </div>

                  <div v-else class="ai-assistant-panel__message-text">
                    <div
                      v-if="getBubbleAttachments(item).length"
                      class="ai-assistant-panel__message-attachments"
                    >
                      <div
                        v-for="(attachment, index) in getBubbleAttachments(item)"
                        :key="`${getBubbleItem(item).key}:${attachment.url}:${index}`"
                        class="ai-assistant-panel__message-attachment"
                        :class="{ 'is-image': attachment.kind === 'image' }"
                      >
                        <template v-if="attachment.kind === 'image'">
                          <img :src="attachment.url" :alt="attachment.name" />
                          <a :href="attachment.url" target="_blank" rel="noreferrer">
                            {{ attachment.name }}
                          </a>
                        </template>
                        <template v-else>
                          <a :href="attachment.url" target="_blank" rel="noreferrer">
                            {{ attachment.name }}
                          </a>
                        </template>
                      </div>
                    </div>
                    <template v-if="getBubbleItem(item).role === 'assistant'">
                      <details
                        v-if="shouldShowReasoning(item)"
                        class="ai-assistant-panel__reasoning-block"
                        :open="isReasoningExpanded(item)"
                        @toggle="handleReasoningToggle(item, $event)"
                      >
                        <summary class="ai-assistant-panel__reasoning-summary">
                          <span class="ai-assistant-panel__reasoning-title">
                            {{ getBubbleStageLabel(item) }}
                          </span>
                          <span class="ai-assistant-panel__reasoning-meta">
                            {{ getReasoningMetaText(item) }}
                          </span>
                        </summary>
                        <div class="ai-assistant-panel__reasoning-text">
                          {{ getBubbleReasoning(item) }}
                        </div>
                      </details>
                      <div
                        v-if="shouldUseLightweightRender(item)"
                        class="ai-assistant-panel__message-text-streaming"
                      >
                        {{ getBubbleContent(item) }}
                      </div>
                      <MarkdownView v-else :content="getBubbleContent(item)" />
                      <div
                        v-if="getBubbleUsageText(item)"
                        class="ai-assistant-panel__usage-text"
                      >
                        {{ getBubbleUsageText(item) }}
                      </div>
                      <div
                        v-if="shouldShowLiveEventStrip(item)"
                        class="ai-assistant-panel__event-strip"
                      >
                        <div class="ai-assistant-panel__event-strip-head">
                          <span class="ai-assistant-panel__event-strip-title">
                            {{ getLiveEventStripTitle(item) }}
                          </span>
                          <span class="ai-assistant-panel__event-strip-meta">
                            {{ getBubbleEventTrail(item).length }} 条
                          </span>
                        </div>
                        <div class="ai-assistant-panel__event-strip-list">
                          <div
                            v-for="(eventItem, index) in getVisibleLiveEvents(item)"
                            :key="`${getBubbleItem(item).key}:live:${index}`"
                            class="ai-assistant-panel__event-strip-item"
                          >
                            <span class="ai-assistant-panel__event-strip-item-label">
                              {{ eventItem.label }}
                            </span>
                            <span class="ai-assistant-panel__event-strip-item-summary">
                              {{ eventItem.summary }}
                            </span>
                          </div>
                        </div>
                      </div>
                      <details
                        v-if="shouldShowCollapsedEventTrail(item)"
                        class="ai-assistant-panel__event-trail"
                      >
                        <summary class="ai-assistant-panel__event-trail-summary">
                          <span class="ai-assistant-panel__event-trail-summary-main">
                            <span class="ai-assistant-panel__event-trail-summary-title">
                              运行轨迹
                            </span>
                            <span class="ai-assistant-panel__event-trail-summary-meta">
                              {{ getBubbleEventTrail(item).length }} 条事件
                            </span>
                          </span>
                          <span class="ai-assistant-panel__event-trail-summary-hint">
                            展开
                          </span>
                        </summary>
                        <div class="ai-assistant-panel__event-trail-list">
                          <div
                            v-for="(eventItem, index) in getBubbleEventTrail(item)"
                            :key="`${getBubbleItem(item).key}:event:${index}`"
                            class="ai-assistant-panel__event-trail-item"
                          >
                            <div class="ai-assistant-panel__event-trail-item-head">
                              <span class="ai-assistant-panel__event-trail-item-label">
                                {{ eventItem.label }}
                              </span>
                              <span class="ai-assistant-panel__event-trail-item-time">
                                {{ formatEventTime(eventItem.time) }}
                              </span>
                            </div>
                            <div class="ai-assistant-panel__event-trail-item-summary">
                              {{ eventItem.summary }}
                            </div>
                            <pre
                              v-if="shouldShowEventPayload(eventItem.event)"
                              class="ai-assistant-panel__event-trail-item-payload"
                              >{{ formatJson(eventItem.payload || {}) }}</pre
                            >
                          </div>
                        </div>
                      </details>
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

        <button
          v-if="showScrollToBottomButton"
          type="button"
          class="ai-assistant-panel__scroll-to-bottom"
          @click="handleScrollToBottomClick"
        >
          回到底部
        </button>

        <div class="ai-assistant-panel__composer">
          <div class="ai-assistant-panel__composer-inner">
            <div v-if="pendingAttachments.length" class="ai-assistant-panel__composer-attachments">
              <div
                v-for="(attachment, index) in pendingAttachments"
                :key="`${attachment.url}:${index}`"
                class="ai-assistant-panel__composer-attachment"
              >
                <img
                  v-if="attachment.kind === 'image'"
                  :src="attachment.url"
                  :alt="attachment.name"
                />
                <span>{{ attachment.name }}</span>
                <button type="button" @click="removePendingAttachment(index)">×</button>
              </div>
            </div>

            <Sender
              :value="draft"
              :send-disabled="
                (!draft.trim() && !pendingAttachments.length) || sending || attachmentUploading
              "
              :placeholder="senderPlaceholder"
              :auto-size="{ minRows: 3, maxRows: 6 }"
              @change="handleDraftChange"
              @submit="handleSubmit"
            >
              <template #prefix>
                <button
                  type="button"
                  class="ai-assistant-panel__sender-prefix-button"
                  :disabled="sending || attachmentUploading"
                  @click="openAttachmentPicker"
                >
                  <LoadingOutlined
                    v-if="attachmentUploading"
                    class="ai-assistant-panel__spin-icon"
                  />
                  <PaperClipOutlined v-else />
                </button>
              </template>

              <template #actions>
                <button
                  type="button"
                  class="ai-assistant-panel__sender-submit-button"
                  :disabled="
                    (!draft.trim() && !pendingAttachments.length) || sending || attachmentUploading
                  "
                  @click="handleSubmit"
                >
                  发送
                </button>
              </template>
            </Sender>
          </div>
        </div>
      </section>
    </div>

    <input
      ref="attachmentInputRef"
      class="ai-assistant-panel__attachment-input"
      type="file"
      multiple
      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.json,.zip"
      @change="handleAttachmentChange"
    />

    <el-drawer
      v-model="toolDetailOpen"
      direction="rtl"
      size="100%"
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
              <el-tag
                :type="
                  selectedToolPendingConfirmation
                    ? 'warning'
                    : selectedToolHasError
                      ? 'danger'
                      : 'primary'
                "
                effect="plain"
                round
              >
                {{
                  selectedToolPendingConfirmation
                    ? "等待确认"
                    : selectedToolHasError
                      ? "执行异常"
                      : "执行完成"
                }}
              </el-tag>
              <el-tag v-if="selectedToolMeta?.riskLevel" effect="plain" round>
                风险 {{ formatRiskLevel(selectedToolMeta.riskLevel) }}
              </el-tag>
              <el-tag v-if="selectedToolMeta?.requiresBrowser" effect="plain" round
                >需要浏览器</el-tag
              >
              <el-tag v-if="selectedToolMeta?.confirmRequired" type="warning" effect="plain" round
                >需要确认</el-tag
              >
              <el-tag effect="plain" round>{{ formatTime(selectedToolMessage.createdAt) }}</el-tag>
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
    </el-drawer>

    <el-drawer
      v-model="capabilityDrawerOpen"
      direction="rtl"
      size="100%"
      title="AI 能力清单"
      class="ai-assistant-panel__capability-drawer"
    >
      <div class="ai-assistant-panel__capability-head">
        <div class="ai-assistant-panel__capability-title-row">
          <div class="ai-assistant-panel__capability-title-block">
            <div class="ai-assistant-panel__capability-title">AI 能力清单</div>
            <div class="ai-assistant-panel__capability-summary">
              {{ capabilitySummary }}
            </div>
          </div>

          <div class="ai-assistant-panel__capability-meta">
            <span class="ai-assistant-panel__capability-meta-item">
              <strong>{{ capabilityCount }}</strong>
              <span>项能力</span>
            </span>
            <span class="ai-assistant-panel__capability-meta-item">服务端执行</span>
            <span class="ai-assistant-panel__capability-meta-item">结构化能力目录</span>
          </div>
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
              <div class="ai-assistant-panel__capability-group-main">
                <div class="ai-assistant-panel__capability-group-title">{{ group.label }}</div>
                <div class="ai-assistant-panel__capability-group-desc">{{ group.description }}</div>
              </div>
              <div class="ai-assistant-panel__capability-group-meta">
                {{ group.tools.length }} 项
              </div>
            </div>

            <div class="ai-assistant-panel__capability-list">
              <article
                v-for="tool in group.tools"
                :key="tool.name"
                class="ai-assistant-panel__capability-item"
              >
                <div class="ai-assistant-panel__capability-item-head">
                  <div class="ai-assistant-panel__capability-item-main">
                    <div class="ai-assistant-panel__capability-item-title">{{ tool.label }}</div>
                    <div class="ai-assistant-panel__capability-item-key">{{ tool.name }}</div>
                    <div class="ai-assistant-panel__capability-item-desc">
                      {{ tool.description }}
                    </div>
                  </div>

                  <div class="ai-assistant-panel__capability-item-tags">
                    <el-tag effect="plain" round>{{
                      tool.runtime === "server" ? "服务端" : tool.runtime
                    }}</el-tag>
                    <el-tag effect="plain" round>{{ tool.readOnly ? "只读" : "可执行" }}</el-tag>
                    <el-tag
                      :type="
                        tool.riskLevel === 'high'
                          ? 'danger'
                          : tool.riskLevel === 'medium'
                            ? 'warning'
                            : 'success'
                      "
                      effect="plain"
                      round
                    >
                      风险 {{ formatRiskLevel(tool.riskLevel) }}
                    </el-tag>
                    <el-tag v-if="tool.requiresBrowser" effect="plain" round>需要浏览器</el-tag>
                    <el-tag v-if="tool.confirmRequired" type="warning" effect="plain" round
                      >需确认</el-tag
                    >
                    <el-tag v-if="tool.idempotent" effect="plain" round>幂等</el-tag>
                    <el-tag effect="plain" round>{{
                      summarizeInputSchema(tool.inputSchema)
                    }}</el-tag>
                    <el-tag
                      v-for="tag in tool.tags || []"
                      :key="`${tool.name}:${tag}`"
                      effect="plain"
                      round
                      >{{ tag }}</el-tag
                    >
                  </div>
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
                          <el-tag effect="plain" round>{{
                            formatSchemaType(item.field.type)
                          }}</el-tag>
                          <el-tag v-if="item.required" type="danger" effect="plain" round
                            >必填</el-tag
                          >
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
                      <el-button size="small" text @click="applyExamplePrompt(caseItem.prompt)">
                        使用此案例
                      </el-button>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      v-model="personaDialogOpen"
      title="选择对话角色"
      width="100vw"
      :show-close="true"
      :close-on-click-modal="true"
      class="ai-assistant-panel__persona-modal"
    >
      <div
        v-loading="personasLoading && !personas.length"
        element-loading-text="正在加载角色"
        class="ai-assistant-panel__persona-modal-body"
      >
        <div class="ai-assistant-panel__persona-modal-hero">
          <div class="ai-assistant-panel__persona-modal-summary">
            {{ activeConversationId ? "切换当前会话角色" : "设置新会话默认角色" }}
          </div>
          <div class="ai-assistant-panel__persona-modal-current">
            <span class="ai-assistant-panel__persona-modal-current-label">当前选择</span>
            <span class="ai-assistant-panel__persona-modal-current-name">
              {{ selectedPersona?.name || "默认助手" }}
            </span>
            <span class="ai-assistant-panel__persona-modal-current-desc">
              {{ selectedPersona?.description || "服务端内置通用助手" }}
            </span>
          </div>
        </div>

        <div v-if="personas.length" class="ai-assistant-panel__persona-list">
          <button
            v-for="persona in personas"
            :key="persona.key"
            type="button"
            class="ai-assistant-panel__persona-option"
            :class="{
              'is-active': selectedPersonaKey === persona.key,
              'is-loading': updatingPersonaKey === persona.key,
            }"
            :disabled="updatingPersonaKey === persona.key"
            @click="handlePersonaSelect(persona.key)"
          >
            <span class="ai-assistant-panel__persona-option-main">
              <span class="ai-assistant-panel__persona-option-head">
                <span class="ai-assistant-panel__persona-option-name">
                  {{ persona.name }}
                </span>
                <span v-if="persona.isDefault" class="ai-assistant-panel__persona-option-badge">
                  默认
                </span>
              </span>
              <span class="ai-assistant-panel__persona-option-desc">
                {{ persona.description }}
              </span>
            </span>
          </button>
        </div>
      </div>
    </el-dialog>
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
  LoadingOutlined,
  PaperClipOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons-vue";
import { Actions, BubbleList, Conversations, Sender, ThoughtChain } from "ant-design-x-vue";
import type { ActionItem, ThoughtChainItem } from "ant-design-x-vue";
import { Avatar, Modal } from "ant-design-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type {
  AiAssistantAttachment,
  AiAssistantPageContext,
  AiAssistantPersona,
  AiAssistantToolDefinition,
  AiAssistantToolExampleCase,
  AiAssistantToolSchemaProperty,
} from "@/api/aiAssistant";
import { AiAssistantApi } from "@/api/aiAssistant";
import { uploadToCOS } from "@/api/cos";
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
  personas,
  activeConversation,
  activeConversationId,
  loadingHistory,
  personasLoading,
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
  updateConversationPersona,
  clearHistory,
  sendMessage,
  executeTool,
} = useAiAssistantRuntime();

const draft = ref("");
const pendingAttachments = ref<AiAssistantAttachment[]>([]);
const attachmentUploading = ref(false);
const attachmentInputRef = ref<HTMLInputElement | null>(null);
const sideTab = ref("conversations");
const preferredPersonaKey = ref("");
const updatingPersonaKey = ref("");
const personaDialogOpen = ref(false);
const streamRef = ref<HTMLDivElement | null>(null);
const chatEndRef = ref<HTMLDivElement | null>(null);
const capabilityDrawerOpen = ref(false);
const toolDetailOpen = ref(false);
const selectedToolMessage = ref<DisplayMessage | null>(null);
const mobileSideVisible = ref(false);
const autoScrollPinned = ref(true);
const showScrollToBottomButton = ref(false);
const expandedReasoningKeys = ref<string[]>([]);
let scrollFrameId = 0;
let resizeCleanup: (() => void) | null = null;
const STREAM_FOLLOW_THRESHOLD = 80;

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
  const personaName = activeConversation.value?.persona?.name || selectedPersona.value?.name || "";
  if (activeConversation.value?.lastMessageAt) {
    return personaName
      ? `${personaName} · 最近更新 ${formatTime(activeConversation.value.lastMessageAt)}`
      : `最近更新 ${formatTime(activeConversation.value.lastMessageAt)}`;
  }
  if (activeConversationId.value) {
    return personaName ? `${personaName} · 当前会话尚未开始` : "当前会话尚未开始";
  }
  return personaName ? `${personaName} · 可直接新建或发送消息` : "可直接新建或发送消息";
});

const activeConversationKey = computed(() => {
  return activeConversationId.value ? String(activeConversationId.value) : "";
});

const buildConversationLabel = (item: { id: number; title?: string | null }) => {
  const title = item.title || "新会话";

  return h("span", { class: "ai-assistant-panel__conversation-label-row" }, [
    h(
      "span",
      {
        class: "ai-assistant-panel__conversation-label-text",
        title,
      },
      title,
    ),
    h(
      "button",
      {
        type: "button",
        class: "ai-assistant-panel__conversation-delete-button",
        title: "删除会话",
        "aria-label": "删除会话",
        onClick: async (event: MouseEvent) => {
          event.stopPropagation();
          await confirmDeleteConversation(item.id);
        },
        onMousedown: (event: MouseEvent) => {
          event.stopPropagation();
        },
      },
      [h(DeleteOutlined)],
    ),
  ]);
};

const conversationItems = computed(() => {
  return conversations.value.map((item) => ({
    key: String(item.id),
    label: buildConversationLabel(item),
  }));
});

const defaultPersona = computed<AiAssistantPersona | null>(() => {
  return personas.value.find((item) => item.isDefault) || personas.value[0] || null;
});

const selectedPersonaKey = computed(() => {
  return (
    activeConversation.value?.persona?.key ||
    preferredPersonaKey.value ||
    defaultPersona.value?.key ||
    ""
  );
});

const selectedPersona = computed<AiAssistantPersona | null>(() => {
  const targetKey = selectedPersonaKey.value;
  return personas.value.find((item) => item.key === targetKey) || defaultPersona.value;
});

const senderPlaceholder = computed(() => {
  const personaName = selectedPersona.value?.name || "默认助手";
  return activeConversationId.value
    ? `以「${personaName}」身份发送消息`
    : `以「${personaName}」创建新会话并发送`;
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

const capabilityCount = computed(() => {
  const explicitTotal = Number(capabilityCatalog.value?.total || 0);
  if (explicitTotal > 0) {
    return explicitTotal;
  }

  return capabilityGroups.value.reduce((sum, group) => sum + (group.tools?.length || 0), 0);
});

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

const isToolPendingConfirmation = (toolResult: unknown) => {
  if (!toolResult || typeof toolResult !== "object") {
    return false;
  }
  return (toolResult as Record<string, any>).pendingConfirmation === true;
};

const isToolExecutionError = (toolResult: unknown) => {
  if (!toolResult || typeof toolResult !== "object") {
    return false;
  }

  const source = toolResult as Record<string, any>;
  if (source.pendingConfirmation === true) {
    return false;
  }

  if (source.success === false) {
    return true;
  }

  return !!String(source.error || "").trim();
};

const selectedToolPendingConfirmation = computed(() => {
  return isToolPendingConfirmation(selectedToolMessage.value?.toolResult);
});

const selectedToolHasError = computed(() => {
  return isToolExecutionError(selectedToolMessage.value?.toolResult);
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
      status: selectedToolPendingConfirmation.value
        ? "pending"
        : selectedToolHasError.value
          ? "error"
          : "success",
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
      description: selectedToolPendingConfirmation.value
        ? "等待用户确认后才能继续执行"
        : selectedToolHasError.value
          ? "检测到错误字段"
          : summarizeJson(current.toolResult),
      content: formatJson(current.toolResult),
      status: selectedToolPendingConfirmation.value
        ? "pending"
        : selectedToolHasError.value
          ? "error"
          : "success",
    });
  }

  return items;
});

const detailActionItems = computed<ActionItem[]>(() => {
  const items: ActionItem[] = [
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

  if (
    selectedToolPendingConfirmation.value &&
    selectedToolMessage.value?.toolKey &&
    selectedToolMessage.value?.toolInput
  ) {
    items.unshift({
      key: "confirm-execute",
      label: sending.value ? "执行中..." : "确认执行",
    });
  }

  return items;
});

const buildPageContext = (): AiAssistantPageContext => ({});

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

const getBubbleAttachments = (item: unknown) => getBubbleItem(item).attachments || [];

const getBubbleToolLabel = (item: unknown) => getBubbleItem(item).toolLabel;

const getBubbleTime = (item: unknown) => formatTime(getBubbleItem(item).createdAt);

const getBubbleReasoning = (item: unknown) => String(getBubbleItem(item).reasoning || "");

const getBubbleStageLabel = (item: unknown) => {
  const stage = String(getBubbleItem(item).streamStage || "");
  if (stage === "planning") {
    return "正在规划";
  }
  if (stage === "reasoning") {
    return "思考过程";
  }
  if (stage === "answering") {
    return "正在回答";
  }
  if (stage === "fallback") {
    return "兜底回复";
  }
  return "处理中";
};

const getBubbleUsageText = (item: unknown) => {
  const usage = getBubbleItem(item).usage;
  if (!usage || typeof usage !== "object") {
    return "";
  }

  const total = Number((usage as Record<string, any>).total_tokens || 0);
  const prompt = Number((usage as Record<string, any>).prompt_tokens || 0);
  const completion = Number((usage as Record<string, any>).completion_tokens || 0);
  const reasoning = Number(
    (usage as Record<string, any>).completion_tokens_details?.reasoning_tokens || 0,
  );

  const parts = [
    prompt > 0 ? `输入 ${prompt}` : "",
    completion > 0 ? `输出 ${completion}` : "",
    total > 0 ? `合计 ${total}` : "",
    reasoning > 0 ? `思考 ${reasoning}` : "",
  ].filter(Boolean);

  return parts.length ? `Token：${parts.join(" · ")}` : "";
};

const getBubbleEventTrail = (item: unknown) => getBubbleItem(item).eventTrail || [];
const getVisibleLiveEvents = (item: unknown) => getBubbleEventTrail(item).slice(-3);

const getBubbleKey = (item: unknown) => getBubbleItem(item).key;

const formatEventTime = (value: string) => dayjs(value).format("HH:mm:ss");

const shouldShowEventPayload = (event: string) => {
  return [
    "assistant.plan",
    "assistant.usage",
    "tool.pending",
    "tool.completed",
    "chat.result",
  ].includes(String(event || ""));
};

const isToolBubble = (item: unknown) => getBubbleItem(item).role === "tool";

const isBubbleLoading = (item: unknown) => !!getBubbleItem(item).loading;

const isBubblePureLoading = (item: unknown) => {
  if (!isBubbleLoading(item)) {
    return false;
  }

  const bubbleItem = getBubbleItem(item);
  return !String(bubbleItem.content || "").trim() &&
    !String(bubbleItem.reasoning || "").trim() &&
    !(bubbleItem.eventTrail?.length || 0);
};

const shouldShowReasoning = (item: unknown) => {
  return !!String(getBubbleItem(item).reasoning || "").trim();
};

const shouldShowLiveEventStrip = (item: unknown) => {
  const bubbleItem = getBubbleItem(item);
  return bubbleItem.role === "assistant" && !!bubbleItem.loading && getBubbleEventTrail(item).length > 0;
};

const shouldShowCollapsedEventTrail = (item: unknown) => {
  const bubbleItem = getBubbleItem(item);
  return (
    bubbleItem.role === "assistant" &&
    !bubbleItem.loading &&
    getBubbleEventTrail(item).length > 0
  );
};

const getLiveEventStripTitle = (item: unknown) => {
  const events = getBubbleEventTrail(item);
  const latest = events[events.length - 1];
  return latest?.label || "处理中";
};

const isReasoningExpanded = (item: unknown) => {
  return expandedReasoningKeys.value.includes(getBubbleKey(item));
};

const getReasoningMetaText = (item: unknown) => {
  const reasoning = getBubbleReasoning(item).trim();
  const stage = getBubbleStageLabel(item);
  if (!reasoning) {
    return stage;
  }

  return `${stage} · ${reasoning.length} 字`;
};

const shouldUseLightweightRender = (item: unknown) => {
  const bubbleItem = getBubbleItem(item);
  return bubbleItem.role === "assistant" && !!bubbleItem.loading;
};

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

const updateScrollFollowState = () => {
  const target = streamRef.value;
  if (!target) {
    autoScrollPinned.value = true;
    showScrollToBottomButton.value = false;
    return;
  }

  const distanceToBottom = Math.max(0, target.scrollHeight - target.scrollTop - target.clientHeight);
  const isNearBottom = distanceToBottom <= STREAM_FOLLOW_THRESHOLD;
  autoScrollPinned.value = isNearBottom;
  showScrollToBottomButton.value = !isNearBottom;
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

        const nestedScrollableNodes = Array.from(stream.querySelectorAll<HTMLElement>("*")).filter(
          (node) => {
            if (!(node instanceof HTMLElement)) {
              return false;
            }

            const style = window.getComputedStyle(node);
            const overflowY = style.overflowY;
            const canScroll =
              overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
            return canScroll && node.scrollHeight > node.clientHeight + 4;
          },
        );

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
      updateScrollFollowState();
    });
  });
};

const handleStreamScroll = () => {
  updateScrollFollowState();
};

const handleScrollToBottomClick = async () => {
  autoScrollPinned.value = true;
  showScrollToBottomButton.value = false;
  await scrollToBottom("smooth");
};

const handleReasoningToggle = (item: unknown, event: Event) => {
  const target = event.target as HTMLDetailsElement | null;
  const key = getBubbleKey(item);
  if (!key || !target) {
    return;
  }

  if (target.open) {
    if (!expandedReasoningKeys.value.includes(key)) {
      expandedReasoningKeys.value = [...expandedReasoningKeys.value, key];
    }
    return;
  }

  expandedReasoningKeys.value = expandedReasoningKeys.value.filter((itemKey) => itemKey !== key);
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

const openPersonaDialog = () => {
  personaDialogOpen.value = true;
};

const handleDraftChange = (value: string) => {
  draft.value = value;
};

const openAttachmentPicker = () => {
  if (sending.value || attachmentUploading.value) {
    return;
  }
  attachmentInputRef.value?.click();
};

const removePendingAttachment = (index: number) => {
  pendingAttachments.value.splice(index, 1);
};

const uploadAttachmentFile = async (file: File): Promise<AiAssistantAttachment> => {
  const normalizedType = String(file.type || "").toLowerCase();
  const isImage = normalizedType.startsWith("image/");
  const uploadTargetPayload = await AiAssistantApi.createAttachmentUploadTarget(
    file.name || "file",
  );
  const uploadTarget = (uploadTargetPayload as any)?.data || uploadTargetPayload;
  const uploaded = await uploadToCOS({
    file,
    key: uploadTarget.key,
  });

  return {
    kind: isImage ? "image" : "file",
    name: file.name || "未命名附件",
    url: uploaded.url,
    mimeType: normalizedType || null,
    size: Number.isFinite(file.size) ? file.size : null,
  };
};

const handleAttachmentChange = async (event: Event) => {
  const input = event.target as HTMLInputElement | null;
  const files = Array.from(input?.files || []);
  if (!files.length) {
    return;
  }

  attachmentUploading.value = true;
  try {
    const uploadedList: AiAssistantAttachment[] = [];
    for (const file of files.slice(0, 8)) {
      if (file.size > 20 * 1024 * 1024) {
        ElMessage.warning(`${file.name} 超过 20MB，已跳过`);
        continue;
      }
      uploadedList.push(await uploadAttachmentFile(file));
    }

    pendingAttachments.value = [...pendingAttachments.value, ...uploadedList].slice(0, 8);
    if (uploadedList.length) {
      ElMessage.success(`已添加 ${uploadedList.length} 个附件`);
    }
  } catch (error: any) {
    console.error("上传 AI 助手附件失败:", error);
    ElMessage.error(error?.message || "附件上传失败");
  } finally {
    attachmentUploading.value = false;
    if (input) {
      input.value = "";
    }
  }
};

const confirmDeleteConversation = async (conversationId: number) => {
  try {
    await ElMessageBox.confirm("确定删除该会话吗？", "删除确认", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return;
  }

  await handleDeleteConversation(conversationId);
};

const confirmClearChatHistory = async () => {
  try {
    await ElMessageBox.confirm("确定清空当前聊天记录吗？", "清空确认", {
      confirmButtonText: "清空",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return;
  }

  await clearChatHistory();
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

const handlePersonaSelect = async (personaKey: string) => {
  if (!personaKey || personaKey === selectedPersonaKey.value) {
    return;
  }

  preferredPersonaKey.value = personaKey;
  if (!activeConversationId.value) {
    ElMessage.success("新会话默认角色已更新");
    return;
  }

  try {
    updatingPersonaKey.value = personaKey;
    await updateConversationPersona(activeConversationId.value, personaKey);
    personaDialogOpen.value = false;
    ElMessage.success("当前会话角色已切换");
  } catch (error: any) {
    console.error("切换 AI 助手会话角色失败:", error);
    ElMessage.error(error?.message || "切换角色失败");
  } finally {
    updatingPersonaKey.value = "";
  }
};

const handleSubmit = async () => {
  const message = draft.value.trim();
  const attachments = [...pendingAttachments.value];
  if (!message && !attachments.length) {
    ElMessage.warning("请输入内容或添加附件");
    return;
  }

  const pageContext = buildPageContext();
  draft.value = "";
  pendingAttachments.value = [];

  try {
    let targetConversationId = activeConversationId.value;
    if (!targetConversationId) {
      const conversation = await createConversation(
        undefined,
        selectedPersonaKey.value || defaultPersona.value?.key,
      );
      targetConversationId = conversation?.id || null;
      if (!targetConversationId) {
        throw new Error("创建会话失败");
      }
      sideTab.value = "conversations";
      closeMobileSide();
    }

    sendMessage(message, attachments, pageContext, targetConversationId);
    await scrollToBottom("smooth");
  } catch (error: any) {
    draft.value = message;
    pendingAttachments.value = attachments;
    console.error("发送 AI 助手消息失败:", error);
    ElMessage.error(error?.message || "发送失败");
  }
};

const handleCreateConversation = async () => {
  try {
    await createConversation(undefined, selectedPersonaKey.value || defaultPersona.value?.key);
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
  const items: ActionItem[] = [
    {
      key: `detail:${bubbleItem.key}`,
      label: "查看详情",
    },
    {
      key: `copy:${bubbleItem.key}`,
      label: "复制摘要",
    },
  ];

  if (
    isToolPendingConfirmation(bubbleItem.toolResult) &&
    bubbleItem.toolKey &&
    bubbleItem.toolInput
  ) {
    items.unshift({
      key: `confirm:${bubbleItem.key}`,
      label: sending.value ? "执行中..." : "确认执行",
    });
  }

  return items;
};

const handleToolBubbleAction = async ({ key }: { key: string }) => {
  if (key.startsWith("confirm:")) {
    const targetKey = key.slice("confirm:".length);
    const target = bubbleItems.value.find((item) => item.key === targetKey);
    if (target) {
      await confirmToolExecution(target.rawMessage);
    }
    return;
  }

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

const confirmToolExecution = async (message?: DisplayMessage | null) => {
  const current = message || selectedToolMessage.value;
  const toolKey = String(current?.toolKey || "").trim();
  if (sending.value) {
    return;
  }
  if (
    !current ||
    !toolKey ||
    !current.toolInput ||
    !isToolPendingConfirmation(current.toolResult)
  ) {
    return;
  }

  const toolLabel = current.toolLabel || toolKey;
  const runExecution = async () => {
    const result = await executeTool(
      toolKey,
      current.toolInput,
      buildPageContext(),
      current.conversationId ?? activeConversationId.value,
      {
        reason: `用户确认执行 ${toolLabel}`,
        confirmed: true,
      },
    );

    const latestToolMessage =
      result?.messages
        ?.slice()
        .reverse()
        .find((item) => item.role === "tool") || null;
    if (latestToolMessage) {
      selectedToolMessage.value = latestToolMessage as DisplayMessage;
      toolDetailOpen.value = true;
      if (isToolExecutionError(latestToolMessage.toolResult)) {
        ElMessage.warning("工具已执行，但返回异常结果，请查看详情");
      } else {
        ElMessage.success("工具已确认执行");
      }
    } else {
      ElMessage.success("工具已确认执行");
    }

    await scrollToBottom("smooth");
  };

  Modal.confirm({
    title: `确认执行${toolLabel}？`,
    content: "该动作会直接向浏览器自动化客户端下发控制命令。",
    okText: "确认执行",
    cancelText: "取消",
    async onOk() {
      try {
        await runExecution();
      } catch (error: any) {
        console.error("确认执行 AI 工具失败:", error);
        ElMessage.error(error?.message || "执行失败");
        throw error;
      }
    },
  });
};

const handleDetailAction = async ({ key }: { key: string }) => {
  const current = selectedToolMessage.value;
  if (!current) {
    return;
  }

  if (key === "confirm-execute") {
    await confirmToolExecution(current);
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
  await loadCapabilityCatalog();
  preferredPersonaKey.value = selectedPersonaKey.value || defaultPersona.value?.key || "";
  await scrollToBottom();
  updateScrollFollowState();
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
    personaDialogOpen.value = false;
    expandedReasoningKeys.value = [];
    autoScrollPinned.value = true;
    showScrollToBottomButton.value = false;
    if (activeConversation.value?.persona?.key) {
      preferredPersonaKey.value = activeConversation.value.persona.key;
    }
    await nextTick();
    await scrollToBottom();
  },
);

watch(
  () => activeConversation.value?.persona?.key || "",
  (personaKey) => {
    if (personaKey) {
      preferredPersonaKey.value = personaKey;
    }
  },
);

watch(
  () => personas.value.map((item) => `${item.key}:${item.isDefault}`).join("|"),
  () => {
    if (!preferredPersonaKey.value) {
      preferredPersonaKey.value = defaultPersona.value?.key || "";
    }
  },
  {
    immediate: true,
  },
);

watch(
  () =>
    bubbleItems.value
      .map((item) => `${item.key}:${item.status}:${item.loading}:${item.content.length}`)
      .join("|"),
  async () => {
    if (autoScrollPinned.value) {
      await scrollToBottom();
      return;
    }

    await nextTick();
    updateScrollFollowState();
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
      if (autoScrollPinned.value) {
        await scrollToBottom();
      } else {
        await nextTick();
        updateScrollFollowState();
      }
      return;
    }

    if (previous?.loading && !current.loading) {
      if (autoScrollPinned.value) {
        await scrollToBottom();
      } else {
        await nextTick();
        updateScrollFollowState();
      }
    }
  },
  {
    flush: "post",
  },
);

</script>

<style lang="scss" scoped src="./AiAssistantAntdxCover.scss"></style>

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

  &__persona-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  &__persona-option {
    display: flex;
    align-items: stretch;
    width: 100%;
    min-height: 112px;
    padding: 14px;
    border: 1px solid color-mix(in srgb, var(--ai-border-color) 84%, transparent 16%);
    border-radius: 16px;
    background: color-mix(in srgb, var(--ai-panel-soft-bg) 42%, transparent 58%);
    color: var(--ai-text);
    cursor: pointer;
    text-align: left;
    transition:
      border-color 0.18s ease,
      background-color 0.18s ease,
      transform 0.18s ease;
  }

  &__persona-option:hover {
    border-color: color-mix(in srgb, var(--ai-primary) 30%, var(--ai-border-color) 70%);
    background: color-mix(in srgb, var(--ai-primary) 8%, var(--ai-panel-soft-bg) 92%);
  }

  &__persona-option.is-active {
    border-color: color-mix(in srgb, var(--ai-primary) 42%, var(--ai-border-color) 58%);
    background: color-mix(in srgb, var(--ai-primary) 10%, var(--ai-panel-soft-bg) 90%);
  }

  &__persona-option:disabled,
  &__persona-option.is-loading {
    opacity: 0.7;
    cursor: wait;
  }

  &__persona-option-main {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: 8px;
  }

  &__persona-option-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  &__persona-option-name {
    color: var(--ai-text);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
  }

  &__persona-option-desc {
    color: var(--ai-text-secondary);
    font-size: 12px;
    line-height: 1.65;
  }

  &__persona-option-badge {
    flex-shrink: 0;
    padding: 2px 7px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--ai-primary) 12%, transparent 88%);
    color: var(--ai-primary);
    font-size: 10px;
    line-height: 1.4;
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

  &__hero-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex-wrap: wrap;
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
    font-size: 12px;
    font-weight: 400;
    color: var(--ai-text-secondary);
    letter-spacing: -0.02em;
    opacity: 0.02;
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

    :deep(.el-tag) {
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
    min-width: 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--ai-text);
    white-space: pre-wrap;
    word-break: break-word;
    contain: layout style;

    :deep(.markdown-view) {
      --markdown-font-size: 12px;
      --markdown-line-height: 1.56;
      --markdown-letter-spacing: -0.01em;
      --markdown-paragraph-gap: 4px;
      --markdown-block-gap: 8px;
      --markdown-heading-gap-top: 14px;
      --markdown-heading-gap-bottom: 6px;
      --markdown-list-indent: 16px;
      --markdown-code-font-size: 11px;
      --markdown-code-line-height: 1.56;
      --markdown-image-max-width: min(220px, 100%);
      font-size: var(--markdown-font-size);
      line-height: var(--markdown-line-height);
    }

    :deep(pre) {
      max-height: 320px;
      overflow: auto;
    }

    :deep(img) {
      max-height: 220px;
      object-fit: cover;
    }
  }

  &__message-text-streaming {
    min-height: 24px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__message-attachments {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__message-attachment {
    display: inline-flex;
    flex-direction: column;
    gap: 6px;
    max-width: min(220px, 100%);
    padding: 8px 10px;
    border: 1px solid color-mix(in srgb, var(--ai-border-color) 84%, transparent 16%);
    border-radius: 14px;
    background: color-mix(in srgb, var(--ai-panel-soft-bg) 48%, transparent 52%);

    img {
      width: 100%;
      max-width: 180px;
      max-height: 140px;
      object-fit: cover;
      border-radius: 10px;
    }

    a {
      color: var(--ai-text);
      font-size: 12px;
      line-height: 1.5;
      text-decoration: none;
      word-break: break-word;
    }
  }

  &__reasoning-block {
    margin-bottom: 12px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--ai-panel-soft-bg) 78%, transparent 22%);
    border: 1px solid color-mix(in srgb, var(--ai-border-color) 84%, transparent 16%);
    overflow: hidden;
  }

  &__reasoning-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 14px;
    cursor: pointer;
    user-select: none;
    list-style: none;
  }

  &__reasoning-summary::-webkit-details-marker {
    display: none;
  }

  &__reasoning-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--ai-text-secondary);
  }

  &__reasoning-meta {
    flex-shrink: 0;
    font-size: 11px;
    color: var(--ai-text-tertiary);
  }

  &__reasoning-text {
    max-height: 180px;
    padding: 0 14px 12px;
    overflow: auto;
    font-size: 12px;
    line-height: 1.6;
    color: var(--ai-text-secondary);
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__usage-text {
    margin-top: 10px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--ai-text-tertiary);
  }

  &__event-strip {
    margin-top: 10px;
    padding: 8px 0 0;
    border-top: 1px solid color-mix(in srgb, var(--ai-border-color) 78%, transparent 22%);
  }

  &__event-strip-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 6px;
  }

  &__event-strip-title {
    font-size: 11px;
    font-weight: 500;
    color: var(--ai-text-secondary);
  }

  &__event-strip-meta {
    font-size: 10px;
    color: var(--ai-text-tertiary);
  }

  &__event-strip-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__event-strip-item {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 10px;
    line-height: 1.5;
  }

  &__event-strip-item-label {
    position: relative;
    flex-shrink: 0;
    padding-left: 10px;
    color: var(--ai-text-tertiary);
    font-weight: 500;

    &::before {
      content: "";
      position: absolute;
      top: 6px;
      left: 0;
      width: 4px;
      height: 4px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--ai-primary) 56%, var(--ai-text-tertiary) 44%);
    }
  }

  &__event-strip-item-summary {
    color: var(--ai-text-secondary);
    word-break: break-word;
  }

  &__event-trail {
    margin-top: 12px;
    border-top: 1px solid color-mix(in srgb, var(--ai-border-color) 78%, transparent 22%);
    background: transparent;
    overflow: hidden;
  }

  &__event-trail-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    padding: 8px 0 0;
    color: var(--ai-text-secondary);
    user-select: none;
    list-style: none;
  }

  &__event-trail-summary::-webkit-details-marker {
    display: none;
  }

  &__event-trail-summary-main {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  &__event-trail-summary-title {
    font-size: 11px;
    font-weight: 500;
    color: var(--ai-text-secondary);
  }

  &__event-trail-summary-meta,
  &__event-trail-summary-hint {
    font-size: 10px;
    color: var(--ai-text-tertiary);
  }

  &__event-trail[open] &__event-trail-summary-hint {
    color: var(--ai-text-secondary);
  }

  &__event-trail-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 0 0;
  }

  &__event-trail-item {
    padding-left: 10px;
    border-left: 1px solid color-mix(in srgb, var(--ai-border-color) 72%, transparent 28%);
  }

  &__event-trail-item-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 4px;
  }

  &__event-trail-item-label {
    font-size: 10px;
    font-weight: 500;
    color: var(--ai-text-secondary);
  }

  &__event-trail-item-time {
    font-size: 10px;
    color: var(--ai-text-tertiary);
  }

  &__event-trail-item-summary {
    font-size: 10px;
    line-height: 1.5;
    color: var(--ai-text-secondary);
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__event-trail-item-payload {
    margin: 8px 0 0;
    padding: 8px 10px;
    font-size: 10px;
    line-height: 1.55;
    border-radius: 8px;
    color: var(--ai-text-secondary);
    background: color-mix(in srgb, var(--ai-panel-soft-bg) 36%, transparent 64%);
    white-space: pre-wrap;
    word-break: break-word;
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

  &__scroll-to-bottom {
    position: absolute;
    right: 20px;
    bottom: calc(92px + env(safe-area-inset-bottom, 0px));
    z-index: 12;
    padding: 8px 12px;
    border: 1px solid color-mix(in srgb, var(--ai-border-color) 70%, transparent 30%);
    border-radius: 999px;
    background: color-mix(in srgb, var(--ai-panel-bg) 92%, transparent 8%);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
    color: var(--ai-text);
    font-size: 12px;
    line-height: 1;
    cursor: pointer;
    backdrop-filter: blur(10px);
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
  }

  &__composer-inner {
    width: 100%;
    margin: 0 auto;
  }

  &__composer-attachments {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__composer-attachment {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    max-width: min(240px, 100%);
    padding: 6px 10px;
    border: 1px solid color-mix(in srgb, var(--ai-border-color) 84%, transparent 16%);
    border-radius: 14px;
    background: color-mix(in srgb, var(--ai-panel-soft-bg) 52%, transparent 48%);

    img {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }

    span {
      min-width: 0;
      font-size: 12px;
      color: var(--ai-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--ai-text-tertiary);
      cursor: pointer;
    }
  }

  &__attachment-input {
    display: none;
  }

  &__sender-prefix-button,
  &__sender-submit-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    background: transparent;
    color: var(--ai-text-secondary);
    cursor: pointer;
    transition:
      color 0.18s ease,
      background-color 0.18s ease,
      opacity 0.18s ease;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }
  }

  &__spin-icon {
    animation: ai-assistant-panel-spin 0.9s linear infinite;
  }

  &__sender-prefix-button {
    width: 32px;
    min-width: 32px;
    height: 32px;
    border-radius: 12px;
    font-size: 15px;

    &:not(:disabled):hover {
      color: var(--ai-primary);
      background: color-mix(in srgb, var(--ai-primary) 8%, transparent 92%);
    }
  }

  &__sender-submit-button {
    min-width: 40px;
    height: 32px;
    padding: 0 12px;
    border: 1px solid color-mix(in srgb, var(--ai-primary) 76%, #0f172a 24%);
    border-radius: 12px;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, #ffffff 10%, transparent 90%) 0%,
        transparent 100%
      ),
      var(--ai-primary);
    color: #ffffff;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;

    &:not(:disabled):hover {
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, #ffffff 14%, transparent 86%) 0%,
          transparent 100%
        ),
        color-mix(in srgb, var(--ai-primary) 92%, #0f172a 8%);
      color: #ffffff;
    }

    &:disabled {
      border-color: color-mix(in srgb, var(--ai-border-color) 88%, transparent 12%);
      background: color-mix(in srgb, var(--ai-panel-soft-bg) 78%, var(--ai-panel-bg) 22%);
      color: var(--ai-text-tertiary);
      opacity: 1;
    }
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
    width: 100%;
  }

  &__capability-head {
    width: 100%;
    margin: 0 0 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid color-mix(in srgb, var(--ai-border-color) 88%, transparent 12%);
  }

  &__capability-title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
  }

  &__capability-title-block {
    flex: 1;
    min-width: 0;
  }

  &__capability-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--ai-text);
    letter-spacing: -0.03em;
  }

  &__capability-summary {
    margin-top: 8px;
    font-size: 13px;
    line-height: 1.75;
    color: var(--ai-text-secondary);
  }

  &__capability-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 10px 14px;
    min-width: 220px;
    padding-top: 4px;
  }

  &__capability-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--ai-text-secondary);
    font-size: 12px;
    line-height: 1.5;
    white-space: nowrap;

    strong {
      color: var(--ai-text);
      font-size: 18px;
      font-weight: 600;
      line-height: 1;
    }
  }

  &__capability-meta-item + .ai-assistant-panel__capability-meta-item {
    position: relative;
    padding-left: 14px;

    &::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 0;
      width: 4px;
      height: 4px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--ai-border-color) 70%, var(--ai-text-tertiary) 30%);
      transform: translateY(-50%);
    }
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
    gap: 24px;
    width: 100%;
  }

  &__capability-group {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 22px 24px;
    border: 1px solid color-mix(in srgb, var(--ai-border-color) 86%, transparent 14%);
    border-radius: 24px;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--ai-panel-soft-bg) 58%, transparent 42%) 0%,
        transparent 100%
      ),
      var(--ai-panel-bg);
  }

  &__capability-group + .ai-assistant-panel__capability-group {
    padding-top: 22px;
  }

  &__capability-group-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  &__capability-group-main {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
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

  &__capability-group-meta {
    flex-shrink: 0;
    padding: 4px 10px;
    border: 1px solid color-mix(in srgb, var(--ai-border-color) 82%, transparent 18%);
    border-radius: 999px;
    font-size: 11px;
    line-height: 1.5;
    color: var(--ai-text-tertiary);
    background: transparent;
  }

  &__capability-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__capability-item {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px 0 0;
    border-top: 1px solid color-mix(in srgb, var(--ai-border-color) 82%, transparent 18%);
  }

  &__capability-item:first-child {
    padding-top: 0;
    border-top: 0;
  }

  &__capability-item-head {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  &__capability-item-main {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  &__capability-item-title {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.45;
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
    font-size: 13px;
    line-height: 1.7;
    color: var(--ai-text-secondary);
  }

  &__capability-item-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: flex-start;
    justify-content: flex-start;
    max-width: none;
  }

  &__capability-item-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 14px;
    border-top: 1px dashed color-mix(in srgb, var(--ai-border-color) 74%, transparent 26%);
  }

  &__capability-item-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--ai-text);
  }

  &__capability-param-list,
  &__capability-case-list {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }

  &__capability-param-item,
  &__capability-case-item {
    padding: 16px 18px;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--ai-border-color) 84%, transparent 16%);
    background: color-mix(in srgb, var(--ai-panel-soft-bg) 42%, transparent 58%);
  }

  &__capability-param-item {
    display: grid;
    grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
    gap: 10px 22px;
    align-items: flex-start;
  }

  &__capability-param-head {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  &__capability-param-title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
    color: var(--ai-text);
    font-size: 12px;
    font-weight: 600;

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      line-height: 1.6;
      color: var(--ai-text-tertiary);
      background: transparent;
    }
  }

  &__capability-param-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: flex-start;
  }

  &__capability-param-desc,
  &__capability-case-desc {
    font-size: 12px;
    line-height: 1.7;
    color: var(--ai-text-secondary);
  }

  &__capability-param-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    font-size: 11px;
    line-height: 1.7;
    color: var(--ai-text-tertiary);
  }

  &__capability-case-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--ai-text);
  }

  &__capability-case-prompt {
    margin-top: 6px;
    padding-left: 12px;
    border-left: 2px solid color-mix(in srgb, var(--ai-border-color) 72%, var(--ai-primary) 28%);
    font-size: 13px;
    line-height: 1.7;
    color: var(--ai-text);
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__capability-case-input {
    margin: 10px 0 0;
    padding: 10px 12px;
    border: 1px solid color-mix(in srgb, var(--ai-border-color) 84%, transparent 16%);
    border-radius: 10px;
    background: color-mix(in srgb, var(--ai-panel-bg) 86%, var(--ai-panel-soft-bg) 14%);
    font-size: 11px;
    line-height: 1.7;
    color: var(--ai-text-secondary);
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__persona-modal-body {
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-height: calc(100vh - 140px);
  }

  &__persona-modal-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
    gap: 16px;
    align-items: stretch;
  }

  &__persona-modal-summary {
    color: var(--ai-text-secondary);
    font-size: 14px;
    line-height: 1.7;
    padding: 18px 20px;
    border: 1px solid color-mix(in srgb, var(--ai-border-color) 84%, transparent 16%);
    border-radius: 18px;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--ai-panel-soft-bg) 52%, transparent 48%) 0%,
        transparent 100%
      ),
      var(--ai-panel-bg);
  }

  &__persona-modal-current {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 18px 20px;
    border: 1px solid color-mix(in srgb, var(--ai-primary) 22%, var(--ai-border-color) 78%);
    border-radius: 18px;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--ai-primary) 8%, transparent 92%) 0%,
        transparent 100%
      ),
      var(--ai-panel-bg);
  }

  &__persona-modal-current-label {
    color: var(--ai-text-tertiary);
    font-size: 11px;
    line-height: 1.4;
  }

  &__persona-modal-current-name {
    color: var(--ai-text);
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
  }

  &__persona-modal-current-desc {
    color: var(--ai-text-secondary);
    font-size: 12px;
    line-height: 1.7;
  }
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

    &__capability-head {
      margin-bottom: 20px;
      padding-bottom: 14px;
    }

    &__capability-title-row,
    &__capability-group-head,
    &__capability-item-head,
    &__capability-param-head {
      flex-direction: column;
      align-items: flex-start;
    }

    &__capability-meta {
      justify-content: flex-start;
      min-width: 0;
      padding-top: 0;
    }

    &__capability-meta-item + .ai-assistant-panel__capability-meta-item {
      padding-left: 0;

      &::before {
        display: none;
      }
    }

    &__capability-param-tags {
      justify-content: flex-start;
    }

    &__capability-item-tags {
      justify-content: flex-start;
      max-width: none;
    }

    &__capability-group {
      padding: 18px 16px;
      border-radius: 18px;
    }

    &__persona-list {
      grid-template-columns: minmax(0, 1fr);
    }

    &__persona-modal-hero {
      grid-template-columns: minmax(0, 1fr);
    }

    &__capability-item {
      padding: 16px 0;
    }

    &__capability-param-item {
      grid-template-columns: minmax(0, 1fr);
      gap: 10px;
    }
  }

  .ai-assistant-panel__empty {
    min-height: 200px;
    font-size: 22px;
  }
}
</style>

<style lang="scss" scoped>
@keyframes ai-assistant-panel-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
