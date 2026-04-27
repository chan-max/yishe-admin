<template>
  <section class="temu-workspace">
    <section class="temu-workspace__action-shell">
      <div class="temu-workspace__toolbar">
        <div class="temu-workspace__toolbar-main">
          <div class="temu-workspace__section-title">业务动作</div>
        </div>

        <div class="temu-workspace__toolbar-side">
          <el-input
            v-model="actionSearchKeyword"
            clearable
            class="temu-workspace__search"
            placeholder="搜索动作"
          />
          <el-button
            text
            size="small"
            :loading="catalogLoading || !!toolsLoading"
            @click="refreshWorkspaceActions"
          >
            刷新目录
          </el-button>
        </div>
      </div>

      <div v-if="actionCategoryTabs.length" class="temu-workspace__category-bar">
        <div class="temu-workspace__category-tabs">
          <button
            v-for="group in actionCategoryTabs"
            :key="group.key"
            type="button"
            class="temu-category-tab"
            :class="{ 'is-active': selectedCategoryKey === group.key }"
            @click="selectedCategoryKey = group.key"
          >
            <span>{{ group.label }}</span>
            <em>{{ group.actions.length }}</em>
          </button>
        </div>
      </div>

      <div v-if="selectedCategoryActions.length" class="temu-workspace__action-grid">
        <button
          v-for="action in selectedCategoryActions"
          :key="action.key"
          type="button"
          class="temu-function-button"
          :class="{
            'is-active': selectedActionKey === action.key,
            'is-disabled': !isRunnableAction(action),
          }"
          :disabled="!isRunnableAction(action)"
          @click="focusActionByKey(action.key)"
        >
          <span class="temu-function-button__head">
            <span class="temu-function-button__label">{{ action.label }}</span>
            <span class="temu-function-button__badges">
              <span v-if="isToolAction(action)" class="temu-function-button__runtime">
                需浏览器
              </span>
              <span class="temu-function-button__status">
                {{ action.status === "available" ? "可用" : "规划中" }}
              </span>
            </span>
          </span>
          <span class="temu-function-button__desc">
            {{ action.description || "当前动作暂无额外说明" }}
          </span>
        </button>
      </div>

      <div v-else-if="actionSearchKeyword" class="temu-workspace__filter-empty">
        当前筛选条件下没有可展示的动作，换个关键词试试。
      </div>

      <div v-else-if="!catalogLoading" class="temu-workspace__filter-empty">
        当前暂无可展示的动作。
      </div>

      <div v-if="selectedAction" class="temu-workspace__editor">
        <div class="temu-workspace__editor-head">
          <div>
            <div class="temu-workspace__editor-title">{{ selectedAction.label }}</div>
            <div class="temu-workspace__editor-desc">{{ selectedAction.description }}</div>
            <div v-if="isToolAction(selectedAction)" class="temu-workspace__editor-runtime-hint">
              该动作需要客户端浏览器参与执行。
            </div>
          </div>

          <div class="temu-workspace__editor-tags">
            <el-tag size="small" effect="plain">
              {{ selectedAction.key }}
            </el-tag>
            <el-tag v-if="isToolAction(selectedAction)" size="small" effect="plain" type="warning">
              需浏览器
            </el-tag>
            <el-tag
              size="small"
              effect="plain"
              :type="selectedAction.status === 'available' ? 'success' : 'info'"
            >
              {{ selectedAction.status === "available" ? "可用" : "规划中" }}
            </el-tag>
          </div>
        </div>

        <div v-if="selectedActionPreset" class="temu-workspace__form-wrap">
          <div v-if="actionFeedbackNotices.length" class="temu-workspace__feedback-list">
            <el-alert
              v-for="notice in actionFeedbackNotices"
              :key="notice.key"
              :title="notice.title"
              :description="notice.message"
              :type="notice.type"
              :closable="false"
              show-icon
            />
          </div>

          <div v-if="formSeedActions.length" class="temu-workspace__helper-panel">
            <div class="temu-workspace__helper-label">快捷填充</div>
            <div class="temu-workspace__helper-actions">
              <button
                v-for="seed in formSeedActions"
                :key="seed.key"
                type="button"
                class="temu-helper-chip"
                @click="applyFormSeed(seed)"
              >
                <span class="temu-helper-chip__title">{{ seed.label }}</span>
                <span class="temu-helper-chip__desc">{{ seed.description }}</span>
              </button>
            </div>
          </div>

          <div class="temu-workspace__form">
            <div
              v-for="field in selectedActionPreset.fields"
              :key="field.key"
              class="temu-field"
              :class="{ 'is-wide': field.type === 'json' || field.type === 'textarea' }"
            >
              <div class="temu-field__label">
                {{ field.label }}
                <span v-if="field.required" class="temu-field__required">*</span>
              </div>

              <el-select
                v-if="field.type === 'select'"
                v-model="activeActionState.formState[field.key]"
                clearable
                class="temu-field__control"
                :placeholder="field.placeholder || `请选择${field.label}`"
              >
                <el-option
                  v-for="option in resolveFieldOptions(field)"
                  :key="String(option.value)"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>

              <el-input-number
                v-else-if="field.type === 'number'"
                v-model="activeActionState.formState[field.key]"
                class="temu-field__control"
                :controls="false"
                :min="field.min"
                :max="field.max"
              />

              <el-input
                v-else
                v-model="activeActionState.formState[field.key]"
                :type="
                  field.type === 'json' ||
                  field.type === 'textarea' ||
                  field.type.startsWith('array')
                    ? 'textarea'
                    : 'text'
                "
                class="temu-field__control"
                :autosize="
                  field.type === 'json' ||
                  field.type === 'textarea' ||
                  field.type.startsWith('array')
                    ? { minRows: field.rows || 3, maxRows: field.type === 'json' ? 14 : 8 }
                    : undefined
                "
                :placeholder="field.placeholder || `请输入${field.label}`"
              />

              <div v-if="field.hint" class="temu-field__hint">{{ field.hint }}</div>
              <div v-if="activeActionState.formErrors[field.key]" class="temu-field__error">
                {{ activeActionState.formErrors[field.key] }}
              </div>
            </div>
          </div>

          <div v-if="selectedActionPreset.note" class="temu-workspace__note">
            {{ selectedActionPreset.note }}
          </div>

          <div class="temu-workspace__runner">
            <el-button @click="resetFormState">重置参数</el-button>
            <el-button
              type="primary"
              :loading="activeActionRunning"
              :disabled="!canRunSelectedAction || (isAnyActionRunning && !activeActionRunning)"
              @click="runAction"
            >
              {{ canRunSelectedAction ? "执行动作" : runButtonLabel }}
            </el-button>
          </div>
        </div>

        <div v-else class="temu-workspace__unsupported">
          当前动作已经接到目录里了，但前端还没有配置专用表单。后续可以继续把它可视化。
        </div>

        <div v-if="showInlineActionResult" class="temu-workspace__result">
          <div class="temu-workspace__result-head">
            <div class="temu-workspace__result-title">
              <span>原始结果</span>
              <el-tag
                size="small"
                effect="plain"
                :type="activeActionResult.success ? 'success' : 'danger'"
              >
                {{ activeActionResult.success ? "成功" : "失败" }}
              </el-tag>
            </div>

            <div class="temu-workspace__result-tools">
              <el-button
                v-if="canCopyPublishTemplate"
                text
                size="small"
                @click="copyText('商品模板', publishTemplateText)"
              >
                复制商品模板
              </el-button>
              <el-button text size="small" @click="copyText('原始结果', actionResultText)">
                复制结果
              </el-button>
            </div>
          </div>

          <pre class="temu-workspace__json">{{ actionResultText }}</pre>
        </div>

        <div v-if="activePriceReviewPreviewRows.length" class="temu-workspace__result-preview">
          <div class="temu-workspace__result-head">
            <div class="temu-workspace__result-title">
              <span>待核价列表预览</span>
              <el-tag size="small" effect="plain">{{ activePriceReviewPreviewRows.length }}</el-tag>
            </div>
            <div class="temu-workspace__editor-desc">
              仅展示核价提交会用到的关键字段；完整接口返回仍可在执行记录详情里查看。
            </div>
          </div>

          <div class="common-table">
            <vxe-grid
              v-bind="priceReviewPreviewGridOptions"
              :data="activePriceReviewPreviewRows"
              class="temu-workspace__preview-table"
            >
              <template #priceReviewImageSlot="{ row }">
                <el-image
                  v-if="row.imageUrl && row.imageUrl !== '-'"
                  class="temu-workspace__preview-image"
                  :src="row.imageUrl"
                  :preview-src-list="[row.imageUrl]"
                  preview-teleported
                  fit="cover"
                />
                <span v-else>-</span>
              </template>

              <template #priceReviewProductSlot="{ row }">
                <div class="temu-workspace__preview-product">
                  <span>{{ row.productName }}</span>
                  <small>{{ row.categoryName }}</small>
                </div>
              </template>

              <template #priceReviewSubmitStatusSlot="{ row }">
                <div v-if="row.submitStatus !== '-'" class="temu-workspace__submit-status">
                  <el-tag
                    size="small"
                    effect="plain"
                    :type="row.submitStatus === '成功' ? 'success' : 'danger'"
                  >
                    {{ row.submitStatus }}
                  </el-tag>
                  <small>{{ row.submitMessage }}</small>
                </div>
                <span v-else>-</span>
              </template>

              <template #priceReviewValiditySlot="{ row }">
                <el-tag
                  size="small"
                  effect="plain"
                  :type="row.invalid ? 'info' : 'success'"
                >
                  {{ row.invalid ? row.invalidReason : "可操作" }}
                </el-tag>
              </template>

              <template #priceReviewOperationSlot="{ row }">
                <div class="temu-workspace__preview-actions">
                  <el-button
                    text
                    size="small"
                    type="primary"
                    :loading="priceReviewSubmittingKey === `${row.rowKey}:confirm`"
                    :disabled="!canSubmitPriceReviewRow(row) || row.invalid"
                    @click="submitPriceReviewRow(row, 'confirm')"
                  >
                    确认核价
                  </el-button>
                  <el-button
                    text
                    size="small"
                    type="danger"
                    :loading="priceReviewSubmittingKey === `${row.rowKey}:abandon`"
                    :disabled="!row.rawPriceOrderId || row.invalid"
                    @click="submitPriceReviewRow(row, 'abandon')"
                  >
                    不核价
                  </el-button>
                </div>
              </template>
            </vxe-grid>
          </div>
        </div>

        <div class="temu-workspace__task-panel">
          <div class="temu-workspace__task-head">
            <div>
              <div class="temu-workspace__result-title">
                <span>执行记录</span>
                <el-tag size="small" effect="plain">{{ taskRunTotal }}</el-tag>
              </div>
              <div class="temu-workspace__editor-desc">
                Temu 服务端动作会先创建执行记录，再异步执行；运行中的记录会自动刷新。
              </div>
            </div>

            <div class="temu-workspace__task-tools">
              <el-checkbox v-model="onlyCurrentActionRuns">仅当前动作</el-checkbox>
              <el-button
                text
                size="small"
                type="danger"
                :disabled="!hasSelectedTaskRuns"
                :loading="batchDeletingTaskRuns"
                @click="deleteSelectedTaskRuns"
              >
                批量删除
              </el-button>
              <el-button
                text
                size="small"
                :loading="taskRunLoading || taskRunDetailLoading"
                @click="refreshTaskRuns"
              >
                刷新记录
              </el-button>
            </div>
          </div>

          <div class="common-table">
            <vxe-grid
              v-bind="taskRunGridOptions"
              :data="taskRunList"
              :loading="taskRunLoading"
              class="temu-workspace__task-table"
              @checkbox-change="onTaskRunSelectionChange"
              @checkbox-all="onTaskRunSelectionChange"
            >
              <template #taskRunActionSlot="{ row }">
                <div class="temu-workspace__task-action-cell">
                  <span>{{ row.actionLabel }}</span>
                  <small>{{ row.actionKey }}</small>
                </div>
              </template>

              <template #taskRunStatusSlot="{ row }">
                <el-tag size="small" effect="plain" :type="resolveTaskRunStatusTagType(row.status)">
                  {{ resolveTaskRunStatusLabel(row.status) }}
                </el-tag>
              </template>

              <template #taskRunProfileSlot="{ row }">
                {{ row.profileId || "-" }}
              </template>

              <template #taskRunRegionSlot="{ row }">
                {{ resolveRegionLabel(row.region) }}
              </template>

              <template #taskRunDurationSlot="{ row }">
                {{ formatDuration(row.durationMs) }}
              </template>

              <template #taskRunCreatedAtSlot="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>

              <template #taskRunErrorSlot="{ row }">
                {{ row.errorText || "-" }}
              </template>

              <template #taskRunOperationSlot="{ row }">
                <el-button text size="small" @click.stop="openTaskRunDetail(row.id)">详情</el-button>
                <el-button
                  text
                  size="small"
                  :loading="retryingTaskRunId === row.id"
                  @click.stop="retryTaskRunById(row.id)"
                >
                  重跑
                </el-button>
                <el-button
                  text
                  size="small"
                  type="danger"
                  :loading="deletingTaskRunId === row.id"
                  @click.stop="deleteTaskRunById(row.id)"
                >
                  删除
                </el-button>
              </template>
            </vxe-grid>
          </div>

          <div v-if="!taskRunList.length && !taskRunLoading" class="temu-workspace__filter-empty">
            当前条件下还没有 Temu 执行记录。
          </div>

          <div v-if="taskRunTotal > taskRunPageSize" class="temu-workspace__task-pagination">
            <el-pagination
              v-model:current-page="taskRunPage"
              v-model:page-size="taskRunPageSize"
              background
              layout="total, prev, pager, next"
              :page-sizes="[10, 20, 30]"
              :total="taskRunTotal"
            />
          </div>
        </div>
      </div>
    </section>

    <el-dialog
      v-model="taskRunDetailVisible"
      fullscreen
      append-to-body
      class="temu-workspace__task-dialog"
      :title="activeTaskRunDetail ? `记录详情 #${activeTaskRunDetail.id}` : '记录详情'"
    >
      <div v-loading="taskRunDetailLoading" class="temu-workspace__task-dialog-body">
        <div
          v-if="activeTaskRunDetail"
          class="temu-workspace__task-detail temu-workspace__task-detail--dialog"
        >
          <div class="temu-workspace__task-detail-head">
            <div>
              <div class="temu-workspace__result-title">
                <span>{{ activeTaskRunDetail.actionLabel }}</span>
                <el-tag
                  size="small"
                  effect="plain"
                  :type="resolveTaskRunStatusTagType(activeTaskRunDetail.status)"
                >
                  {{ resolveTaskRunStatusLabel(activeTaskRunDetail.status) }}
                </el-tag>
              </div>
              <div class="temu-workspace__editor-desc">
                {{ activeTaskRunDetail.message || "当前记录暂无附加说明。" }}
              </div>
            </div>

            <div class="temu-workspace__task-tools">
              <el-button text size="small" @click="copyText('任务参数', taskRunParamsText)">
                复制参数
              </el-button>
              <el-button text size="small" @click="copyText('任务日志', taskRunLogsText)">
                复制日志
              </el-button>
              <el-button text size="small" @click="copyText('任务结果', taskRunResultText)">
                复制结果
              </el-button>
              <el-button
                text
                size="small"
                :loading="retryingTaskRunId === activeTaskRunDetail.id"
                @click="retryTaskRunById(activeTaskRunDetail.id)"
              >
                重跑
              </el-button>
              <el-button
                text
                size="small"
                type="danger"
                :loading="deletingTaskRunId === activeTaskRunDetail.id"
                @click="deleteTaskRunById(activeTaskRunDetail.id)"
              >
                删除
              </el-button>
            </div>
          </div>

          <div class="temu-workspace__task-meta-list">
            <div class="temu-task-meta-row">
              <span>记录编号</span>
              <strong>#{{ activeTaskRunDetail.id }}</strong>
            </div>
            <div class="temu-task-meta-row">
              <span>环境</span>
              <strong>{{ activeTaskRunDetail.profileId || "-" }}</strong>
            </div>
            <div class="temu-task-meta-row">
              <span>区域</span>
              <strong>{{ resolveRegionLabel(activeTaskRunDetail.region) }}</strong>
            </div>
            <div class="temu-task-meta-row">
              <span>开始时间</span>
              <strong>{{ formatDateTime(activeTaskRunDetail.startedAt) }}</strong>
            </div>
            <div class="temu-task-meta-row">
              <span>结束时间</span>
              <strong>{{ formatDateTime(activeTaskRunDetail.finishedAt) }}</strong>
            </div>
            <div class="temu-task-meta-row">
              <span>耗时</span>
              <strong>{{ formatDuration(activeTaskRunDetail.durationMs) }}</strong>
            </div>
          </div>

          <div
            v-if="taskRunPriceReviewPreviewRows.length"
            class="temu-workspace__task-detail-section temu-workspace__task-preview-section"
          >
            <div class="temu-workspace__section-title">
              任务结果列表
              <el-tag size="small" effect="plain">{{ taskRunPriceReviewPreviewRows.length }}</el-tag>
            </div>
            <div class="common-table">
              <vxe-grid
                v-bind="priceReviewPreviewGridOptions"
                :data="taskRunPriceReviewPreviewRows"
                class="temu-workspace__preview-table"
              >
                <template #priceReviewImageSlot="{ row }">
                  <el-image
                    v-if="row.imageUrl && row.imageUrl !== '-'"
                    class="temu-workspace__preview-image"
                    :src="row.imageUrl"
                    :preview-src-list="[row.imageUrl]"
                    preview-teleported
                    fit="cover"
                  />
                  <span v-else>-</span>
                </template>

                <template #priceReviewProductSlot="{ row }">
                  <div class="temu-workspace__preview-product">
                    <span>{{ row.productName }}</span>
                    <small>{{ row.categoryName }}</small>
                  </div>
                </template>

                <template #priceReviewSubmitStatusSlot="{ row }">
                  <div v-if="row.submitStatus !== '-'" class="temu-workspace__submit-status">
                    <el-tag
                      size="small"
                      effect="plain"
                      :type="row.submitStatus === '成功' ? 'success' : 'danger'"
                    >
                      {{ row.submitStatus }}
                    </el-tag>
                    <small>{{ row.submitMessage }}</small>
                  </div>
                  <span v-else>-</span>
                </template>

                <template #priceReviewValiditySlot="{ row }">
                  <el-tag
                    size="small"
                    effect="plain"
                    :type="row.invalid ? 'info' : 'success'"
                  >
                    {{ row.invalid ? row.invalidReason : "可操作" }}
                  </el-tag>
                </template>

                <template #priceReviewOperationSlot="{ row }">
                  <div class="temu-workspace__preview-actions">
                    <el-button
                      text
                      size="small"
                      type="primary"
                      :loading="priceReviewSubmittingKey === `${row.rowKey}:confirm`"
                      :disabled="!canSubmitPriceReviewRow(row) || row.invalid"
                      @click="submitPriceReviewRow(row, 'confirm')"
                    >
                      确认核价
                    </el-button>
                    <el-button
                      text
                      size="small"
                      type="danger"
                      :loading="priceReviewSubmittingKey === `${row.rowKey}:abandon`"
                      :disabled="!row.rawPriceOrderId || row.invalid"
                      @click="submitPriceReviewRow(row, 'abandon')"
                    >
                      不核价
                    </el-button>
                  </div>
                </template>
              </vxe-grid>
            </div>
          </div>

          <div class="temu-workspace__task-detail-section">
            <div class="temu-workspace__section-title">执行日志</div>
            <div v-if="taskRunLogEntries.length" class="temu-task-log-list">
              <div
                v-for="(entry, index) in taskRunLogEntries"
                :key="`${activeTaskRunDetail.id}-${index}-${entry.time}`"
                class="temu-task-log-item"
              >
                <div class="temu-task-log-item__head">
                  <span class="temu-task-log-item__time">{{ formatDateTime(entry.time) }}</span>
                  <el-tag size="small" effect="plain" :type="resolveTaskRunLogTagType(entry.level)">
                    {{ resolveTaskRunLogLabel(entry.level) }}
                  </el-tag>
                </div>
                <div class="temu-task-log-item__message">{{ entry.message }}</div>
                <pre
                  v-if="entry.detail !== undefined"
                  class="temu-workspace__json temu-workspace__json--compact"
                  >{{ jsonText(entry.detail) }}</pre
                >
              </div>
            </div>
            <div v-else class="temu-workspace__unsupported">当前记录暂无执行日志。</div>
          </div>

          <div class="temu-workspace__task-json-grid">
            <div class="temu-workspace__task-detail-section">
              <div class="temu-workspace__section-title">请求参数</div>
              <pre class="temu-workspace__json temu-workspace__json--compact">{{
                taskRunParamsText
              }}</pre>
            </div>

            <div class="temu-workspace__task-detail-section">
              <div class="temu-workspace__section-title">任务结果</div>
              <pre class="temu-workspace__json temu-workspace__json--compact">{{
                taskRunResultText
              }}</pre>
            </div>
          </div>
        </div>

        <div v-else class="temu-workspace__unsupported">正在加载记录详情...</div>
      </div>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import type { VxeGridProps } from "vxe-table";
import type { ToolkitToolItem } from "@/api/external/toolkit";
import {
  batchDeleteTemuTaskRuns,
  createTemuTaskRun,
  deleteTemuTaskRun,
  executeTemuAction,
  getTemuCatalog,
  getTemuTaskRun,
  getTemuTaskRunPage,
  retryTemuTaskRun,
  type TemuActionResponse,
  type TemuCatalogAction,
  type TemuCatalogGroup,
  type TemuRegionKey,
  type TemuTaskRunDetail,
  type TemuTaskRunLogEntry,
  type TemuTaskRunSummary,
} from "@/api/external/toolkit/temu";
import { commonGridOptions } from "@/common/table";
import {
  ACTION_PRESETS,
  REGION_LABELS,
  TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY,
  type TemuActionField,
  type TemuFormSeedAction,
  type TemuIndexedCatalogAction,
} from "./temuWorkspace.shared";
import {
  asPlainObject,
  buildActionFeedbackNotices,
  buildDefaultFormState,
  buildFormPatchState,
  buildFormSeedActions,
  countObjectKeys,
  extractRequestErrorMessage,
  stringifyJson,
  validateAndNormalizeField,
} from "./temuWorkspace.helpers";

defineOptions({ name: "ToolkitTemuWorkspace" });

interface TemuActionWorkspaceState {
  formState: Record<string, any>;
  formErrors: Record<string, string>;
  lastResult: TemuActionResponse | null;
}

interface TemuWorkspaceAction extends TemuCatalogAction {
  executionType?: "api" | "tool";
  featureKey?: string;
}

interface TemuWorkspaceActionGroup extends Omit<TemuCatalogGroup, "actions"> {
  actions: TemuWorkspaceAction[];
}

interface PriceReviewPreviewRow {
  rowKey: string;
  imageUrl: string;
  productName: string;
  categoryName: string;
  priceOrderId: string;
  rawPriceOrderId: number;
  spuId: string;
  skcId: string;
  skuId: string;
  rawSkuId: number;
  skcExtCode: string;
  skuExtCode: string;
  skuProperties: string;
  currentPrice: string;
  rawCurrentPrice: number | null;
  suggestPrice: string;
  rawSuggestPrice: number | null;
  priceDifference: string;
  priceDifferenceRatio: string;
  times: string;
  invalid: boolean;
  invalidReason: string;
  submitStatus: string;
  submitMessage: string;
}

interface PriceReviewSubmitMark {
  status: "success" | "failed";
  action: "confirm" | "abandon";
  message: string;
  time: string;
  markInvalid?: boolean;
}

const props = defineProps<{
  clientId?: string;
  profileId?: string;
  sessionRecord?: Record<string, any> | null;
  toolItems?: ToolkitToolItem[];
  toolsLoading?: boolean;
  runningFeatureKey?: string;
  toolBusy?: boolean;
  toolResults?: Record<string, any> | null;
}>();

const emit = defineEmits<{
  (e: "refresh-tools"): void;
  (e: "run-tool", payload: { featureKey: string; payload: Record<string, any> }): void;
}>();

const flattenCatalogActions = (groups: Array<{ actions: TemuCatalogAction[] }> = []) =>
  groups.flatMap((group) => group.actions);

const resetReactiveRecord = (target: Record<string, any>, nextValue: Record<string, any> = {}) => {
  Object.keys(target).forEach((key) => delete target[key]);
  Object.entries(nextValue).forEach(([key, value]) => {
    target[key] = value;
  });
};

const catalogLoading = ref(false);
const runningActionKey = ref("");
const selectedCategoryKey = ref("");
const selectedActionKey = ref("");
const actionSearchKeyword = ref("");
const catalog = ref<TemuCatalogGroup[]>([]);
const actionWorkspaceStates = reactive<Record<string, TemuActionWorkspaceState>>({});
const taskRunLoading = ref(false);
const taskRunDetailLoading = ref(false);
const taskRunPage = ref(1);
const taskRunPageSize = ref(10);
const taskRunTotal = ref(0);
const onlyCurrentActionRuns = ref(true);
const taskRunList = ref<TemuTaskRunSummary[]>([]);
const selectedTaskRunIds = ref<number[]>([]);
const taskRunDetailVisible = ref(false);
const activeTaskRunId = ref<number | null>(null);
const activeTaskRunDetail = ref<TemuTaskRunDetail | null>(null);
const retryingTaskRunId = ref<number | null>(null);
const deletingTaskRunId = ref<number | null>(null);
const batchDeletingTaskRuns = ref(false);
const taskRunPollingBusy = ref(false);
const priceReviewSubmittingKey = ref("");
const priceReviewSubmitMarks = reactive<Record<string, PriceReviewSubmitMark>>({});
let taskRunPollTimer: number | null = null;

const taskRunGridOptions = ref<VxeGridProps<TemuTaskRunSummary>>({
  ...(commonGridOptions as VxeGridProps<TemuTaskRunSummary>),
  rowConfig: {
    ...(commonGridOptions as any).rowConfig,
    keyField: "id",
  },
  checkboxConfig: {
    reserve: true,
  },
  columns: [
    { type: "checkbox", width: 48 },
    { title: "#", field: "id", width: 76 },
    {
      title: "动作",
      field: "actionLabel",
      minWidth: 180,
      slots: { default: "taskRunActionSlot" },
    },
    {
      title: "状态",
      field: "status",
      width: 112,
      align: "center",
      slots: { default: "taskRunStatusSlot" },
    },
    {
      title: "环境",
      field: "profileId",
      minWidth: 140,
      showOverflow: "tooltip",
      slots: { default: "taskRunProfileSlot" },
    },
    {
      title: "区域",
      field: "region",
      width: 110,
      align: "center",
      slots: { default: "taskRunRegionSlot" },
    },
    {
      title: "耗时",
      field: "durationMs",
      width: 110,
      align: "center",
      slots: { default: "taskRunDurationSlot" },
    },
    {
      title: "创建时间",
      field: "createdAt",
      width: 176,
      align: "center",
      slots: { default: "taskRunCreatedAtSlot" },
    },
    {
      title: "失败原因",
      field: "errorText",
      minWidth: 220,
      showOverflow: "tooltip",
      slots: { default: "taskRunErrorSlot" },
    },
    {
      title: "操作",
      field: "operation",
      width: 210,
      fixed: "right",
      align: "center",
      slots: { default: "taskRunOperationSlot" },
    },
  ],
});

const priceReviewPreviewGridOptions = ref<VxeGridProps<PriceReviewPreviewRow>>({
  ...(commonGridOptions as VxeGridProps<PriceReviewPreviewRow>),
  rowConfig: {
    ...(commonGridOptions as any).rowConfig,
    keyField: "rowKey",
  },
  maxHeight: 640,
  columns: [
    {
      title: "图片",
      field: "imageUrl",
      width: 76,
      align: "center",
      slots: { default: "priceReviewImageSlot" },
    },
    {
      title: "商品",
      field: "productName",
      minWidth: 260,
      showOverflow: "tooltip",
      slots: { default: "priceReviewProductSlot" },
    },
    {
      title: "核价单号",
      field: "priceOrderId",
      minWidth: 150,
      showOverflow: "tooltip",
    },
    { title: "SPU", field: "spuId", minWidth: 130, showOverflow: "tooltip" },
    { title: "SKC", field: "skcId", minWidth: 130, showOverflow: "tooltip" },
    { title: "SKU", field: "skuId", minWidth: 130, showOverflow: "tooltip" },
    {
      title: "SKC货号",
      field: "skcExtCode",
      minWidth: 140,
      showOverflow: "tooltip",
    },
    {
      title: "SKU货号",
      field: "skuExtCode",
      minWidth: 150,
      showOverflow: "tooltip",
    },
    {
      title: "SKU属性",
      field: "skuProperties",
      minWidth: 180,
      showOverflow: "tooltip",
    },
    { title: "当前价", field: "currentPrice", width: 100, align: "right" },
    { title: "建议价", field: "suggestPrice", width: 100, align: "right" },
    { title: "差价", field: "priceDifference", width: 100, align: "right" },
    { title: "降幅", field: "priceDifferenceRatio", width: 92, align: "right" },
    { title: "次数", field: "times", width: 80, align: "center" },
    {
      title: "有效性",
      field: "invalidReason",
      width: 96,
      align: "center",
      slots: { default: "priceReviewValiditySlot" },
    },
    {
      title: "处理状态",
      field: "submitStatus",
      minWidth: 170,
      showOverflow: "tooltip",
      slots: { default: "priceReviewSubmitStatusSlot" },
    },
    {
      title: "操作",
      field: "operation",
      width: 168,
      fixed: "right",
      align: "center",
      slots: { default: "priceReviewOperationSlot" },
    },
  ],
});

const sessionRecord = computed(() => asPlainObject(props.sessionRecord));
const sessionData = computed(() => asPlainObject(sessionRecord.value?.session));
const regionCookieCounts = computed(() => ({
  global: countObjectKeys(sessionData.value?.global?.cookies),
  us: countObjectKeys(sessionData.value?.us?.cookies),
  eu: countObjectKeys(sessionData.value?.eu?.cookies),
}));
const hasUsableSession = computed(() => regionCookieCounts.value.global > 0);

const normalizedSearchKeyword = computed(() => actionSearchKeyword.value.trim().toLowerCase());

const publishDetailToolItem = computed<ToolkitToolItem | null>(() => {
  const matched = (Array.isArray(props.toolItems) ? props.toolItems : []).find(
    (item) => String(item?.key || "").trim() === TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY,
  );
  return matched || null;
});

const publishDetailToolAction = computed<TemuWorkspaceAction>(() => {
  const item = publishDetailToolItem.value;
  const rawName = String(item?.name || "").trim();
  const label = rawName.replace(/^temu\s*/i, "").trim() || "根据商品spuId 获取 商品发布模板";
  return {
    key: TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY,
    label,
    description:
      String(item?.description || "").trim() ||
      "输入商品 spuId 后打开商品发布详情页，自动点击“提交”，并返回商品发布模板请求里的 POST 参数。",
    endpoint: "__tool__",
    method: "POST",
    regionHints: ["global"],
    status: "available",
    executionType: "tool",
    featureKey: TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY,
  };
});

const mergedCatalog = computed<TemuWorkspaceActionGroup[]>(() => {
  const groups = catalog.value.map((group) => ({
    ...group,
    actions: Array.isArray(group.actions) ? [...group.actions] : [],
  }));

  const targetGroup =
    groups.find((group) => group.key === "goods") ||
    (() => {
      const nextGroup: TemuWorkspaceActionGroup = {
        key: "goods",
        label: "商品与上新",
        description: "商品相关动作。",
        actions: [],
      };
      groups.unshift(nextGroup);
      return nextGroup;
    })();

  if (
    !targetGroup.actions.some(
      (action) => action.key === TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY,
    )
  ) {
    const goodsDetailIndex = targetGroup.actions.findIndex(
      (action) => action.key === "goods.detail",
    );
    if (goodsDetailIndex >= 0) {
      targetGroup.actions.splice(goodsDetailIndex + 1, 0, publishDetailToolAction.value);
    } else {
      targetGroup.actions.push(publishDetailToolAction.value);
    }
  }

  return groups;
});

const isToolAction = (action?: Pick<TemuWorkspaceAction, "key" | "executionType"> | null) =>
  !!action &&
  (action.executionType === "tool" ||
    String(action.key || "").trim() === TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY);

const catalogActionIndex = computed(() => {
  const actionMap = new Map<string, TemuIndexedCatalogAction>();
  mergedCatalog.value.forEach((group) => {
    group.actions.forEach((action) => {
      actionMap.set(action.key, {
        ...action,
        groupKey: group.key,
        groupLabel: group.label,
      });
    });
  });
  return actionMap;
});

const catalogGroups = computed(() => {
  const keyword = normalizedSearchKeyword.value;
  if (!keyword) {
    return mergedCatalog.value;
  }

  return mergedCatalog.value.reduce((result, group) => {
    const groupMatched = [group.label, group.description, group.key]
      .filter(Boolean)
      .some((item) => String(item).toLowerCase().includes(keyword));

    const actions = group.actions.filter((action) => {
      if (groupMatched) {
        return true;
      }

      return [action.label, action.description, action.key]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(keyword));
    });

    if (actions.length) {
      result.push({
        ...group,
        actions,
      });
    }
    return result;
  }, [] as TemuWorkspaceActionGroup[]);
});

const actionCategoryTabs = computed(() =>
  catalogGroups.value.filter((group) => Array.isArray(group.actions) && group.actions.length > 0),
);
const selectedCategory = computed(
  () => actionCategoryTabs.value.find((group) => group.key === selectedCategoryKey.value) || null,
);
const selectedCategoryActions = computed(() =>
  Array.isArray(selectedCategory.value?.actions) ? selectedCategory.value.actions : [],
);
const visibleActions = computed(() => flattenCatalogActions(actionCategoryTabs.value));
const selectedAction = computed<TemuWorkspaceAction | null>(
  () =>
    selectedCategoryActions.value.find((item) => item.key === selectedActionKey.value) ||
    visibleActions.value.find((item) => item.key === selectedActionKey.value) ||
    null,
);
const selectedActionPreset = computed(() =>
  selectedAction.value ? ACTION_PRESETS[selectedAction.value.key] || null : null,
);
const createActionWorkspaceState = (actionKey?: string | null): TemuActionWorkspaceState => {
  const preset = ACTION_PRESETS[String(actionKey || "").trim()];
  return {
    formState: buildDefaultFormState(preset?.fields || []),
    formErrors: {},
    lastResult: null,
  };
};

const ensureActionWorkspaceState = (actionKey?: string | null) => {
  const normalizedKey = String(actionKey || "").trim();
  if (!normalizedKey) {
    return null;
  }

  if (!actionWorkspaceStates[normalizedKey]) {
    actionWorkspaceStates[normalizedKey] = createActionWorkspaceState(normalizedKey);
  }

  return actionWorkspaceStates[normalizedKey];
};

const emptyActionWorkspaceState: TemuActionWorkspaceState = {
  formState: {},
  formErrors: {},
  lastResult: null,
};

const activeActionState = computed(
  () => ensureActionWorkspaceState(selectedAction.value?.key) || emptyActionWorkspaceState,
);

const formSeedActions = computed<TemuFormSeedAction[]>(() =>
  buildFormSeedActions(selectedAction.value?.key, activeActionState.value.lastResult),
);
const actionFeedbackNotices = computed(() =>
  buildActionFeedbackNotices({
    action: selectedAction.value,
    sessionRecord: sessionRecord.value,
    jsonFieldCount: (selectedActionPreset.value?.fields || []).filter(
      (field) => field.type === "json",
    ).length,
    hasFormSeeds: formSeedActions.value.length > 0,
  }),
);
const activeToolRecord = computed(() => {
  if (!selectedAction.value || !isToolAction(selectedAction.value)) {
    return null;
  }

  const toolResults = asPlainObject(props.toolResults);
  const record = asPlainObject(toolResults[selectedAction.value.key]);
  return Object.keys(record).length ? record : null;
});
const activeActionResult = computed<TemuActionResponse | null>(() => {
  if (isToolAction(selectedAction.value)) {
    const record = activeToolRecord.value;
    if (!record) {
      return null;
    }

    return {
      success: record.success !== false,
      action: selectedAction.value?.key,
      message: String(record.message || "").trim(),
      profileId: props.profileId,
      result:
        record.output !== undefined
          ? record.output
          : record.result !== undefined
            ? record.result
            : null,
      raw:
        record.result && typeof record.result === "object"
          ? record.result
          : record.output && typeof record.output === "object"
            ? record.output
            : null,
    };
  }

  return activeActionState.value.lastResult;
});
const toDisplayText = (value: any) => {
  const normalized = String(value ?? "").trim();
  return normalized || "-";
};
const formatCentPrice = (value: any) => {
  if (value === undefined || value === null || value === "") {
    return "-";
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return toDisplayText(value);
  }
  return (numericValue / 100).toFixed(2);
};
const formatPercent = (value: any) => {
  if (value === undefined || value === null || value === "") {
    return "-";
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return toDisplayText(value);
  }
  return `${(numericValue * 100).toFixed(2)}%`;
};
const firstTextFromArray = (value: any) => {
  if (!Array.isArray(value)) {
    return "";
  }
  return String(value.find((item) => String(item || "").trim()) || "").trim();
};
const toFiniteNumberOrNull = (value: any) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};
const extractSkuProperties = (sku: Record<string, any>) => {
  const propertyList = Array.isArray(sku?.productPropertyList) ? sku.productPropertyList : [];
  const values = propertyList
    .map((item: any) => String(item?.value || "").trim())
    .filter(Boolean);
  return values.length ? values.join(" / ") : "-";
};
const resolvePriceReviewImageUrl = (
  sku: Record<string, any>,
  skc: Record<string, any>,
  item: Record<string, any>,
) =>
  toDisplayText(
    sku?.skuPreviewImage ||
      firstTextFromArray(skc?.previewImgUrlList) ||
      firstTextFromArray(item?.carouselImageUrlList),
  );
const resolvePriceReviewCategoryName = (item: Record<string, any>) => {
  const fullCategoryName = Array.isArray(item?.fullCategoryName)
    ? item.fullCategoryName.map((name: any) => String(name || "").trim()).filter(Boolean)
    : [];
  return toDisplayText(fullCategoryName.length ? fullCategoryName.join(" / ") : item?.leafCategoryName);
};
const buildPriceReviewSubmitMessage = (mark?: PriceReviewSubmitMark) => {
  if (!mark) {
    return "-";
  }
  const actionText = mark.action === "confirm" ? "确认核价" : "不核价";
  return `${actionText} · ${mark.message || mark.time}`;
};
const isPriceReviewSkuInvalid = (sku: Record<string, any>) => {
  return sku?.priceReviewStatus !== 1;
};
const buildPriceReviewPreviewRows = (
  response?: TemuActionResponse | Record<string, any> | null,
): PriceReviewPreviewRow[] => {
  const action = String(response?.action || "").trim();
  if (action !== "goods.price-review.list") {
    return [];
  }

  const result = asPlainObject(response?.result);
  const items = Array.isArray(result.items) ? result.items : [];
  const rows: PriceReviewPreviewRow[] = [];

  items.forEach((item: any, itemIndex: number) => {
    const spuId = item?.productId;
    const productName = item?.productName;
    const categoryName = resolvePriceReviewCategoryName(item);
    const skcList = Array.isArray(item?.skcList) ? item.skcList : [];
    skcList.forEach((skc: any, skcIndex: number) => {
      const skcId = skc?.skcId;
      const extCode = skc?.extCode;
      const reviewList = Array.isArray(skc?.supplierPriceReviewInfoList)
        ? skc.supplierPriceReviewInfoList
        : [];
      reviewList.forEach((review: any, reviewIndex: number) => {
        const skuList = Array.isArray(review?.productSkuList) ? review.productSkuList : [];
        skuList.forEach((sku: any, skuIndex: number) => {
          const skuId = sku?.skuId;
          const priceOrderId = toFiniteNumberOrNull(review?.priceOrderId);
          const suggestPrice = toFiniteNumberOrNull(review?.suggestSupplyPrice);
          const currentPrice = toFiniteNumberOrNull(review?.supplyPrice);
          const rowKey = [
              review?.priceOrderId,
              spuId,
              skcId,
              skuId,
              itemIndex,
              skcIndex,
              reviewIndex,
              skuIndex,
            ].join("-");
          const submitMark = priceReviewSubmitMarks[rowKey];
          const invalid = isPriceReviewSkuInvalid(sku) || !!submitMark?.markInvalid;
          rows.push({
            rowKey,
            imageUrl: resolvePriceReviewImageUrl(sku, skc, item),
            productName: toDisplayText(productName),
            categoryName,
            priceOrderId: toDisplayText(review?.priceOrderId),
            rawPriceOrderId: priceOrderId || 0,
            spuId: toDisplayText(spuId),
            skcId: toDisplayText(skcId),
            skuId: toDisplayText(skuId),
            rawSkuId: toFiniteNumberOrNull(skuId) || 0,
            skcExtCode: toDisplayText(extCode),
            skuExtCode: toDisplayText(sku?.extCode),
            skuProperties: extractSkuProperties(sku),
            currentPrice: formatCentPrice(review?.supplyPrice),
            rawCurrentPrice: currentPrice,
            suggestPrice: formatCentPrice(review?.suggestSupplyPrice),
            rawSuggestPrice: suggestPrice,
            priceDifference: formatCentPrice(review?.priceDifference),
            priceDifferenceRatio: formatPercent(review?.priceDifferenceRatio),
            times: toDisplayText(review?.times),
            invalid,
            invalidReason: invalid ? (submitMark?.markInvalid ? "已处理" : "已作废") : "",
            submitStatus: submitMark ? (submitMark.status === "success" ? "成功" : "失败") : "-",
            submitMessage: buildPriceReviewSubmitMessage(submitMark),
          });
        });
      });
    });
  });

  return rows;
};
const activePriceReviewPreviewRows = computed(() =>
  buildPriceReviewPreviewRows(activeActionResult.value),
);
const activeActionRunning = computed(() => {
  if (!selectedAction.value?.key) {
    return false;
  }

  if (isToolAction(selectedAction.value)) {
    return props.runningFeatureKey === selectedAction.value.key;
  }

  return runningActionKey.value === selectedAction.value.key;
});
const isAnyActionRunning = computed(() => !!runningActionKey.value || !!props.toolBusy);
const showInlineActionResult = computed(
  () => !!activeActionResult.value && isToolAction(selectedAction.value),
);
const actionResultText = computed(() => jsonText(activeActionResult.value ?? null));
const resolvePublishTemplateValue = (result: TemuActionResponse | null) => {
  if (
    !result ||
    String(result.action || "").trim() !== TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY
  ) {
    return null;
  }

  const resultValue = asPlainObject(result.result);
  const rawValue = asPlainObject(result.raw);
  const candidateContainers = [
    resultValue,
    asPlainObject(resultValue.data),
    rawValue,
    asPlainObject(rawValue.data),
  ];

  for (const container of candidateContainers) {
    if (Object.prototype.hasOwnProperty.call(container, "postDataJson")) {
      const postDataJson = container.postDataJson;
      if (postDataJson !== undefined && postDataJson !== null) {
        return postDataJson;
      }
    }
  }

  return null;
};
const publishTemplateText = computed(() => {
  const value = resolvePublishTemplateValue(activeActionResult.value);
  return value === null ? "" : jsonText(value);
});
const canCopyPublishTemplate = computed(() => !!publishTemplateText.value.trim());
const taskRunActionKeyFilter = computed(() =>
  onlyCurrentActionRuns.value ? String(selectedAction.value?.key || "").trim() : "",
);
const taskRunLogEntries = computed<TemuTaskRunLogEntry[]>(() =>
  Array.isArray(activeTaskRunDetail.value?.logs) ? activeTaskRunDetail.value.logs : [],
);
const taskRunParamsText = computed(() => jsonText(activeTaskRunDetail.value?.params ?? null));
const taskRunResultText = computed(() => jsonText(activeTaskRunDetail.value?.result ?? null));
const taskRunLogsText = computed(() => jsonText(taskRunLogEntries.value));
const taskRunPriceReviewPreviewRows = computed(() =>
  buildPriceReviewPreviewRows(activeTaskRunDetail.value?.result as Record<string, any> | null),
);
const hasSelectedTaskRuns = computed(() => selectedTaskRunIds.value.length > 0);
const hasRunningTaskRuns = computed(() => {
  const listHasRunning = taskRunList.value.some((item) =>
    ["queued", "running"].includes(String(item.status || "").trim()),
  );
  const detailStatus = String(activeTaskRunDetail.value?.status || "").trim();
  return listHasRunning || ["queued", "running"].includes(detailStatus);
});
const canRunSelectedAction = computed(() => {
  if (!selectedAction.value || !selectedActionPreset.value) {
    return false;
  }

  if (isToolAction(selectedAction.value)) {
    return !!(props.clientId && props.profileId && hasUsableSession.value);
  }

  return !!(props.profileId && hasUsableSession.value && selectedAction.value.endpoint);
});
const runButtonLabel = computed(() => {
  if (isAnyActionRunning.value && !activeActionRunning.value) {
    return "动作执行中";
  }
  if (isToolAction(selectedAction.value) && !props.clientId) {
    return "先选择客户端";
  }
  if (!props.profileId) {
    return "先选择环境";
  }
  if (!hasUsableSession.value) {
    return "先准备会话";
  }
  return "执行动作";
});

const hasPresetForAction = (actionKey?: string | null) =>
  !!(actionKey && ACTION_PRESETS[actionKey]);

const isRunnableAction = (action?: Pick<TemuWorkspaceAction, "key" | "status"> | null) =>
  !!(action && action.status === "available" && hasPresetForAction(action.key));

const buildRegionOptions = (regionHints: TemuRegionKey[] = []) => {
  const preferredRegions = regionHints.length ? regionHints : ["global", "us", "eu", "seller"];

  return preferredRegions.map((region) => {
    const cookieCount =
      region === "seller"
        ? regionCookieCounts.value.global
        : regionCookieCounts.value[region as "global" | "us" | "eu"];

    return {
      value: region,
      label:
        region === "seller"
          ? `${REGION_LABELS[region]} · 复用主会话`
          : `${REGION_LABELS[region]} · Cookie ${cookieCount}`,
    };
  });
};

const resolveFieldOptions = (field: TemuActionField) => {
  if (field.key === "region") {
    return buildRegionOptions(selectedAction.value?.regionHints || []);
  }
  return field.options || [];
};

const syncSelection = () => {
  if (!actionCategoryTabs.value.length) {
    selectedCategoryKey.value = "";
    selectedActionKey.value = "";
    return;
  }

  if (!actionCategoryTabs.value.some((group) => group.key === selectedCategoryKey.value)) {
    selectedCategoryKey.value = actionCategoryTabs.value[0]?.key || "";
  }

  const actions = selectedCategoryActions.value;
  if (!actions.length) {
    selectedActionKey.value = "";
    return;
  }

  if (!actions.some((item) => item.key === selectedActionKey.value)) {
    const preferredAction = actions.find(
      (item) => item.status === "available" && hasPresetForAction(item.key),
    );
    const fallbackAction = actions.find((item) => hasPresetForAction(item.key));
    selectedActionKey.value = preferredAction?.key || fallbackAction?.key || actions[0]?.key || "";
  }
};

const resetFormState = () => {
  const state = activeActionState.value;
  resetReactiveRecord(
    state.formState,
    buildDefaultFormState(selectedActionPreset.value?.fields || []),
  );
  resetReactiveRecord(state.formErrors, {});
};

const jsonText = (value: any) => stringifyJson(value ?? null);
const resolveRegionLabel = (region?: string | null) => {
  const normalizedRegion = String(region || "").trim() as TemuRegionKey;
  return REGION_LABELS[normalizedRegion] || region || "-";
};

const resolveTaskRunStatusLabel = (status?: string | null) => {
  const normalizedStatus = String(status || "").trim();
  if (normalizedStatus === "completed") return "已完成";
  if (normalizedStatus === "failed") return "失败";
  if (normalizedStatus === "running") return "执行中";
  return "待执行";
};

const resolveTaskRunStatusTagType = (status?: string | null) => {
  const normalizedStatus = String(status || "").trim();
  if (normalizedStatus === "completed") return "success";
  if (normalizedStatus === "failed") return "danger";
  if (normalizedStatus === "running") return "warning";
  return "info";
};

const resolveTaskRunLogLabel = (level?: string | null) => {
  const normalizedLevel = String(level || "").trim();
  if (normalizedLevel === "success") return "成功";
  if (normalizedLevel === "warning") return "提醒";
  if (normalizedLevel === "error") return "错误";
  return "信息";
};

const resolveTaskRunLogTagType = (level?: string | null) => {
  const normalizedLevel = String(level || "").trim();
  if (normalizedLevel === "success") return "success";
  if (normalizedLevel === "warning") return "warning";
  if (normalizedLevel === "error") return "danger";
  return "info";
};

const formatDateTime = (value?: string | Date | null) => {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const formatDuration = (durationMs?: number | null) => {
  const normalizedDuration = Number(durationMs);
  if (!Number.isFinite(normalizedDuration) || normalizedDuration < 0) {
    return "-";
  }

  if (normalizedDuration < 1000) {
    return `${normalizedDuration}ms`;
  }

  return `${(normalizedDuration / 1000).toFixed(normalizedDuration >= 10000 ? 0 : 1)}s`;
};

const syncTaskRunResultToWorkspace = (detail?: TemuTaskRunDetail | null) => {
  const actionKey = String(detail?.actionKey || "").trim();
  if (!actionKey || actionKey === TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY) {
    return;
  }

  const state = ensureActionWorkspaceState(actionKey);
  const result = asPlainObject(detail?.result);
  if (!state || typeof result.success !== "boolean") {
    return;
  }

  state.lastResult = result as TemuActionResponse;
};

const validateForm = () => {
  const state = activeActionState.value;
  const parsed: Record<string, any> = {};
  let valid = true;

  resetReactiveRecord(state.formErrors, {});
  (selectedActionPreset.value?.fields || []).forEach((field) => {
    try {
      const normalizedValue = validateAndNormalizeField(field, state.formState[field.key]);
      if (normalizedValue !== undefined) {
        parsed[field.key] = normalizedValue;
      }
    } catch (error: any) {
      state.formErrors[field.key] = error?.message || `请检查${field.label}`;
      valid = false;
    }
  });

  return {
    valid,
    parsed,
  };
};

const focusActionByKey = (actionKey?: string | null, clearSearch = false) => {
  const matched = catalogActionIndex.value.get(String(actionKey || "").trim());
  if (!matched) {
    return;
  }

  if (clearSearch) {
    actionSearchKeyword.value = "";
  }

  selectedCategoryKey.value = matched.groupKey;
  selectedActionKey.value = matched.key;
};

const applyFormSeed = (seed: TemuFormSeedAction) => {
  const state = activeActionState.value;
  const nextState = buildFormPatchState(selectedActionPreset.value?.fields || [], seed.patch);
  Object.entries(nextState).forEach(([key, value]) => {
    state.formState[key] = value;
    state.formErrors[key] = "";
  });
  ElMessage.success(`${seed.label} 已带入`);
};

const copyText = async (label: string, text: string) => {
  const normalized = String(text || "").trim();
  if (!normalized) {
    ElMessage.warning(`${label} 暂无可复制内容`);
    return;
  }

  try {
    if (!navigator?.clipboard?.writeText) {
      throw new Error("clipboard_unsupported");
    }
    await navigator.clipboard.writeText(normalized);
    ElMessage.success(`${label} 已复制`);
  } catch {
    ElMessage.warning(`当前环境不支持自动复制，请手动复制${label}`);
  }
};

const stopTaskRunPolling = () => {
  if (taskRunPollTimer !== null) {
    window.clearInterval(taskRunPollTimer);
    taskRunPollTimer = null;
  }
};

const ensureTaskRunPolling = () => {
  if (!hasRunningTaskRuns.value) {
    stopTaskRunPolling();
    return;
  }

  if (taskRunPollTimer !== null) {
    return;
  }

  taskRunPollTimer = window.setInterval(() => {
    void pollTaskRuns();
  }, 2500);
};

const loadTaskRunDetail = async (id: number, options: { silent?: boolean } = {}) => {
  if (!id) {
    activeTaskRunId.value = null;
    activeTaskRunDetail.value = null;
    return null;
  }

  if (!options.silent) {
    taskRunDetailLoading.value = true;
  }

  try {
    const detail = await getTemuTaskRun(id);
    activeTaskRunId.value = detail?.id ? Number(detail.id) : null;
    activeTaskRunDetail.value = detail || null;
    syncTaskRunResultToWorkspace(detail);
    return detail;
  } catch (error: any) {
    if (!options.silent) {
      ElMessage.error(extractRequestErrorMessage(error, "获取执行记录详情失败"));
    }
    return null;
  } finally {
    if (!options.silent) {
      taskRunDetailLoading.value = false;
    }
  }
};

const loadTaskRuns = async (options: { silent?: boolean } = {}) => {
  if (!options.silent) {
    taskRunLoading.value = true;
  }

  try {
    const response = await getTemuTaskRunPage({
      currentPage: taskRunPage.value,
      pageSize: taskRunPageSize.value,
      ...(taskRunActionKeyFilter.value ? { actionKey: taskRunActionKeyFilter.value } : {}),
    });

    taskRunList.value = Array.isArray(response?.list) ? response.list : [];
    taskRunTotal.value = Number(response?.total || 0);
    selectedTaskRunIds.value = selectedTaskRunIds.value.filter((id) =>
      taskRunList.value.some((item) => item.id === id),
    );

    if (!taskRunList.value.length) {
      activeTaskRunId.value = null;
      activeTaskRunDetail.value = null;
      taskRunDetailVisible.value = false;
      return;
    }

    if (!activeTaskRunId.value) {
      return;
    }

    const hasActiveTaskRun = taskRunList.value.some((item) => item.id === activeTaskRunId.value);
    if (!hasActiveTaskRun) {
      activeTaskRunId.value = null;
      activeTaskRunDetail.value = null;
      taskRunDetailVisible.value = false;
      return;
    }

    if (!taskRunDetailVisible.value) {
      return;
    }

    const shouldRefreshDetail =
      !activeTaskRunDetail.value ||
      activeTaskRunDetail.value.id !== activeTaskRunId.value ||
      (activeTaskRunDetail.value.status &&
        ["queued", "running"].includes(String(activeTaskRunDetail.value.status).trim()));

    if (shouldRefreshDetail) {
      await loadTaskRunDetail(activeTaskRunId.value, { silent: true });
    }
  } catch (error: any) {
    if (!options.silent) {
      ElMessage.error(extractRequestErrorMessage(error, "获取 Temu 执行记录失败"));
    }
  } finally {
    if (!options.silent) {
      taskRunLoading.value = false;
    }
  }
};

const pollTaskRuns = async () => {
  if (taskRunPollingBusy.value) {
    return;
  }

  taskRunPollingBusy.value = true;
  try {
    await loadTaskRuns({ silent: true });
  } finally {
    taskRunPollingBusy.value = false;
    ensureTaskRunPolling();
  }
};

const openTaskRunDetail = async (id: number) => {
  if (!id) {
    return;
  }

  activeTaskRunId.value = id;
  if (!activeTaskRunDetail.value || activeTaskRunDetail.value.id !== id) {
    activeTaskRunDetail.value = null;
  }
  taskRunDetailVisible.value = true;
  await loadTaskRunDetail(id);
};

const refreshTaskRuns = async () => {
  await loadTaskRuns();
};

const canSubmitPriceReviewRow = (row?: PriceReviewPreviewRow | null) =>
  !!(row?.rawPriceOrderId && row.rawSkuId && row.rawSuggestPrice !== null);

const buildSinglePriceReviewPayload = (
  row: PriceReviewPreviewRow,
  mode: "confirm" | "abandon",
) => {
  const basePayload = {
    profileId: props.profileId,
    region: String(activeTaskRunDetail.value?.region || activeActionResult.value?.region || "global"),
    priceOrderId: row.rawPriceOrderId,
  };

  if (mode === "abandon") {
    return {
      ...basePayload,
      supplierResult: 3,
    };
  }

  return {
    ...basePayload,
    supplierResult: 1,
    items: [
      {
        productSkuId: row.rawSkuId,
        price: row.rawSuggestPrice,
      },
    ],
    bargainReasonList: [],
  };
};

const submitPriceReviewRow = async (
  row: PriceReviewPreviewRow,
  mode: "confirm" | "abandon",
) => {
  if (!props.profileId) {
    ElMessage.warning("请先选择执行环境");
    return;
  }

  if (!hasUsableSession.value) {
    ElMessage.warning("请先采集或选择一个已存储的 Temu 会话");
    return;
  }

  if (mode === "confirm" && !canSubmitPriceReviewRow(row)) {
    ElMessage.warning("当前行缺少核价单号、SKU 或建议价，无法确认核价");
    return;
  }

  if (row.invalid) {
    ElMessage.warning(`当前 SKU ${row.skuId} 已作废，无需操作`);
    return;
  }

  if (mode === "abandon" && !row.rawPriceOrderId) {
    ElMessage.warning("当前行缺少核价单号，无法不核价");
    return;
  }

  const actionText = mode === "confirm" ? "确认核价" : "不核价";
  const submitKey = `${row.rowKey}:${mode}`;
  priceReviewSubmittingKey.value = submitKey;
  try {
    await ElMessageBox.confirm(
      `确认对 SKU ${row.skuId} 执行${actionText}吗？`,
      actionText,
      {
        type: mode === "confirm" ? "warning" : "error",
        confirmButtonText: actionText,
        cancelButtonText: "取消",
      },
    );

    const response = await executeTemuAction(
      "/temu/goods/modify-price",
      buildSinglePriceReviewPayload(row, mode),
    );
    priceReviewSubmitMarks[row.rowKey] = {
      status: response?.success ? "success" : "failed",
      action: mode,
      message: String(response?.message || "").trim() || (response?.success ? "提交成功" : "提交失败"),
      time: formatDateTime(new Date()),
      markInvalid: !!response?.success,
    };

    if (response?.success) {
      ElMessage.success(`${actionText}成功`);
    } else {
      ElMessage.error(String(response?.message || "").trim() || `${actionText}失败`);
    }
  } catch (error: any) {
    if (error !== "cancel") {
      priceReviewSubmitMarks[row.rowKey] = {
        status: "failed",
        action: mode,
        message: extractRequestErrorMessage(error, `${actionText}提交失败`),
        time: formatDateTime(new Date()),
      };
      ElMessage.error(extractRequestErrorMessage(error, `${actionText}提交失败`));
    }
  } finally {
    priceReviewSubmittingKey.value = "";
  }
};

const onTaskRunSelectionChange = ({ records }: { records: TemuTaskRunSummary[] }) => {
  selectedTaskRunIds.value = (Array.isArray(records) ? records : [])
    .map((item) => Number(item?.id || 0))
    .filter((id) => Number.isInteger(id) && id > 0);
};

const retryTaskRunById = async (id: number) => {
  if (!id) {
    return;
  }

  retryingTaskRunId.value = id;
  try {
    const detail = await retryTemuTaskRun(id);
    const keepDetailVisible = taskRunDetailVisible.value;
    activeTaskRunId.value = keepDetailVisible ? Number(detail?.id || 0) || null : null;
    activeTaskRunDetail.value = keepDetailVisible ? detail || null : null;
    syncTaskRunResultToWorkspace(detail);
    taskRunPage.value = 1;
    await loadTaskRuns();
    if (keepDetailVisible && detail?.id) {
      taskRunDetailVisible.value = true;
    }
    ensureTaskRunPolling();
    ElMessage.success(`已创建重跑记录 #${detail.id}`);
  } catch (error: any) {
    ElMessage.error(extractRequestErrorMessage(error, "重跑 Temu 任务失败"));
  } finally {
    retryingTaskRunId.value = null;
  }
};

const deleteTaskRunById = async (id: number) => {
  if (!id) {
    return;
  }

  await ElMessageBox.confirm(`确认删除执行记录 #${id} 吗？`, "删除记录", {
    type: "warning",
    confirmButtonText: "删除",
    cancelButtonText: "取消",
  });

  deletingTaskRunId.value = id;
  try {
    await deleteTemuTaskRun(id);
    selectedTaskRunIds.value = selectedTaskRunIds.value.filter((item) => item !== id);
    if (activeTaskRunId.value === id) {
      activeTaskRunId.value = null;
      activeTaskRunDetail.value = null;
      taskRunDetailVisible.value = false;
    }
    if (taskRunList.value.length === 1 && taskRunPage.value > 1) {
      taskRunPage.value -= 1;
    }
    await loadTaskRuns();
    ElMessage.success(`执行记录 #${id} 已删除`);
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(extractRequestErrorMessage(error, "删除 Temu 执行记录失败"));
    }
  } finally {
    deletingTaskRunId.value = null;
  }
};

const deleteSelectedTaskRuns = async () => {
  const deleteIds = selectedTaskRunIds.value.filter((id) => Number.isInteger(id) && id > 0);
  if (!deleteIds.length) {
    ElMessage.warning("请先选择要删除的执行记录");
    return;
  }

  await ElMessageBox.confirm(`确认删除选中的 ${deleteIds.length} 条执行记录吗？`, "批量删除", {
    type: "warning",
    confirmButtonText: "删除",
    cancelButtonText: "取消",
  });

  batchDeletingTaskRuns.value = true;
  try {
    const result = await batchDeleteTemuTaskRuns(deleteIds);
    const deletedIds = Array.isArray(result?.ids) ? result.ids : deleteIds;
    selectedTaskRunIds.value = selectedTaskRunIds.value.filter((id) => !deletedIds.includes(id));
    if (activeTaskRunId.value && deletedIds.includes(activeTaskRunId.value)) {
      activeTaskRunId.value = null;
      activeTaskRunDetail.value = null;
      taskRunDetailVisible.value = false;
    }
    if (deleteIds.length >= taskRunList.value.length && taskRunPage.value > 1) {
      taskRunPage.value -= 1;
    }
    await loadTaskRuns();
    ElMessage.success(`已删除 ${Number(result?.deletedCount || deletedIds.length)} 条执行记录`);
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(extractRequestErrorMessage(error, "批量删除 Temu 执行记录失败"));
    }
  } finally {
    batchDeletingTaskRuns.value = false;
  }
};

const loadCatalog = async () => {
  catalogLoading.value = true;
  try {
    const response = await getTemuCatalog();
    catalog.value = Array.isArray(response?.groups) ? response.groups : [];
    syncSelection();
  } catch (error: any) {
    ElMessage.error(extractRequestErrorMessage(error, "获取 Temu 目录失败"));
  } finally {
    catalogLoading.value = false;
  }
};

const refreshWorkspaceActions = async () => {
  emit("refresh-tools");
  await loadCatalog();
  await refreshTaskRuns();
};

const runAction = async () => {
  const state = activeActionState.value;
  const action = selectedAction.value;
  if (!action || !selectedActionPreset.value) {
    ElMessage.warning("当前动作暂未配置可执行表单");
    return;
  }
  if (isToolAction(action) && !props.clientId) {
    ElMessage.warning("请先选择在线客户端");
    return;
  }
  if (!props.profileId) {
    ElMessage.warning("请先选择在线客户端和执行环境");
    return;
  }
  if (!hasUsableSession.value) {
    ElMessage.warning("请先采集或选择一个已存储的 Temu 会话");
    return;
  }

  if (runningActionKey.value || props.toolBusy) {
    ElMessage.warning("当前动作正在提交，请稍候");
    return;
  }

  const { valid, parsed } = validateForm();
  if (!valid) {
    ElMessage.warning("请先完善动作参数");
    return;
  }

  if (isToolAction(action)) {
    emit("run-tool", {
      featureKey: action.featureKey || action.key,
      payload: selectedActionPreset.value.buildPayload(parsed, props.profileId),
    });
    return;
  }

  runningActionKey.value = String(action.key || "").trim();
  try {
    const payload = selectedActionPreset.value.buildPayload(parsed, props.profileId);
    state.lastResult = null;
    const detail = await createTemuTaskRun({
      actionKey: action.key,
      payload,
    });
    activeTaskRunId.value = null;
    activeTaskRunDetail.value = null;
    syncTaskRunResultToWorkspace(detail);
    taskRunPage.value = 1;
    await loadTaskRuns();
    ensureTaskRunPolling();
    ElMessage.success(`已创建 ${action.label} 执行记录 #${detail.id}`);
  } catch (error: any) {
    ElMessage.error(extractRequestErrorMessage(error, "创建 Temu 执行记录失败"));
  } finally {
    runningActionKey.value = "";
  }
};

watch(
  actionCategoryTabs,
  () => {
    syncSelection();
  },
  { deep: true },
);

watch(selectedCategoryKey, () => {
  syncSelection();
});

watch(
  () => `${selectedActionKey.value}|${onlyCurrentActionRuns.value}`,
  () => {
    taskRunPage.value = 1;
    taskRunDetailVisible.value = false;
    activeTaskRunId.value = null;
    activeTaskRunDetail.value = null;
    void loadTaskRuns();
  },
  { immediate: true },
);

watch(taskRunPage, (currentPage, previousPage) => {
  if (currentPage === previousPage) {
    return;
  }
  void loadTaskRuns();
});

watch(taskRunPageSize, (pageSize, previousPageSize) => {
  if (pageSize === previousPageSize) {
    return;
  }

  if (taskRunPage.value !== 1) {
    taskRunPage.value = 1;
    return;
  }

  void loadTaskRuns();
});

watch(
  () => props.profileId,
  () => {
    Object.values(actionWorkspaceStates).forEach((state) => {
      state.lastResult = null;
    });
  },
);

watch(
  hasRunningTaskRuns,
  () => {
    ensureTaskRunPolling();
  },
  { immediate: true },
);

watch([taskRunDetailVisible, taskRunDetailLoading], ([visible, loading]) => {
  if (visible || loading) {
    return;
  }

  activeTaskRunId.value = null;
  activeTaskRunDetail.value = null;
});

onMounted(() => {
  void loadCatalog();
});

onBeforeUnmount(() => {
  stopTaskRunPolling();
});
</script>

<style scoped lang="scss">
.temu-workspace {
  display: flex;
  flex-direction: column;
  gap: 14px;
  --temu-runtime-badge-bg: var(--el-color-warning-light-9);
  --temu-runtime-badge-border: var(--el-color-warning-light-5);
  --temu-runtime-badge-text: var(--el-color-warning-dark-2);
  --temu-runtime-badge-active-bg: var(--el-color-warning-light-8);
  --temu-runtime-badge-active-border: var(--el-color-warning-light-4);
  --temu-runtime-badge-active-text: var(--el-color-warning-dark-2);
  --temu-runtime-hint-bg: var(--el-color-warning-light-9);
  --temu-runtime-hint-border: var(--el-color-warning-light-7);
  --temu-runtime-hint-text: var(--el-color-warning-dark-2);
}

:global(html.dark) .temu-workspace {
  --temu-runtime-badge-bg: color-mix(in srgb, var(--el-color-warning) 18%, var(--el-bg-color));
  --temu-runtime-badge-border: color-mix(in srgb, var(--el-color-warning) 44%, transparent);
  --temu-runtime-badge-text: color-mix(in srgb, var(--el-color-warning) 82%, white);
  --temu-runtime-badge-active-bg: color-mix(
    in srgb,
    var(--el-color-warning) 24%,
    var(--el-bg-color)
  );
  --temu-runtime-badge-active-border: color-mix(in srgb, var(--el-color-warning) 58%, transparent);
  --temu-runtime-badge-active-text: color-mix(in srgb, var(--el-color-warning) 92%, white);
  --temu-runtime-hint-bg: color-mix(
    in srgb,
    var(--el-color-warning) 12%,
    var(--el-fill-color-extra-light)
  );
  --temu-runtime-hint-border: color-mix(in srgb, var(--el-color-warning) 36%, transparent);
  --temu-runtime-hint-text: color-mix(in srgb, var(--el-color-warning) 86%, white);
}

.temu-workspace__toolbar,
.temu-workspace__editor-head,
.temu-workspace__result-head,
.temu-workspace__task-head,
.temu-workspace__task-detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.temu-workspace__editor-desc,
.temu-workspace__note,
.temu-field__hint {
  margin-top: 4px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.65;
}

.temu-workspace__editor-tags,
.temu-workspace__result-tools,
.temu-workspace__toolbar-side,
.temu-workspace__task-tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.temu-workspace__task-tools :deep(.el-checkbox) {
  margin-right: 0;
}

.temu-workspace__action-shell {
  padding: 10px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.temu-workspace__result {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.temu-workspace__result-preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.temu-workspace__task-preview-section {
  gap: 10px;
}

.temu-workspace__preview-table {
  width: 100%;
}

.temu-workspace__preview-image {
  width: 48px;
  height: 48px;
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.temu-workspace__preview-product {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  line-height: 1.35;
}

.temu-workspace__preview-product span,
.temu-workspace__preview-product small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.temu-workspace__preview-product span {
  color: var(--el-text-color-primary);
}

.temu-workspace__preview-product small {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.temu-workspace__preview-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.temu-workspace__submit-status {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 6px;
}

.temu-workspace__submit-status small {
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.temu-workspace__task-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.temu-workspace__section-title,
.temu-workspace__helper-label,
.temu-workspace__editor-title {
  color: var(--el-text-color-primary);
  font-size: 11px;
  font-weight: 700;
}

.temu-workspace__toolbar-main {
  display: flex;
  align-items: center;
  gap: 4px 8px;
}

.temu-workspace__action-shell {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.temu-workspace__search {
  width: 168px;
}

.temu-workspace__feedback-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.temu-workspace__form-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.temu-workspace__helper-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.temu-workspace__category-bar {
  overflow: hidden;
}

.temu-workspace__category-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 1px;
  scrollbar-width: thin;
}

.temu-category-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: max-content;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;
}

.temu-category-tab span {
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.temu-category-tab em {
  padding: 0 4px;
  border-radius: 999px;
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-regular);
  font-size: 9px;
  font-style: normal;
  line-height: 1.3;
}

.temu-category-tab:hover {
  border-color: var(--el-border-color-dark);
  color: var(--el-text-color-primary);
}

.temu-category-tab.is-active {
  border-color: color-mix(in srgb, var(--el-color-primary) 35%, white);
  background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color));
  color: var(--el-color-primary);
}

.temu-category-tab.is-active em {
  background: color-mix(in srgb, var(--el-color-primary) 16%, white);
  color: var(--el-color-primary);
}

.temu-function-button,
.temu-helper-chip {
  appearance: none;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.temu-function-button:hover,
.temu-helper-chip:hover {
  border-color: var(--el-border-color-dark);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.temu-function-button__label,
.temu-helper-chip__title {
  color: var(--el-text-color-primary);
  font-size: 11px;
  font-weight: 700;
}

.temu-function-button__meta,
.temu-helper-chip__desc {
  color: var(--el-text-color-regular);
  font-size: 11px;
  line-height: 1.55;
}

.temu-function-button.is-active .temu-function-button__label {
  color: var(--el-color-primary);
}

.temu-function-button.is-active .temu-function-button__status {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
}

.temu-function-button.is-active .temu-function-button__runtime {
  border-color: var(--temu-runtime-badge-active-border);
  background: var(--temu-runtime-badge-active-bg);
  color: var(--temu-runtime-badge-active-text);
}

.temu-workspace__action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 6px;
}

.temu-function-button {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 72px;
  padding: 8px;
  border-radius: 10px;
  text-align: left;
  background: var(--el-fill-color-blank);
}

.temu-function-button__label {
  display: -webkit-box;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.temu-function-button__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}

.temu-function-button__badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 3px;
}

.temu-function-button__runtime,
.temu-function-button__status {
  flex-shrink: 0;
  padding: 0 5px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 9px;
  line-height: 16px;
}

.temu-function-button__status {
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-regular);
}

.temu-function-button__runtime {
  border-color: var(--temu-runtime-badge-border);
  background: var(--temu-runtime-badge-bg);
  color: var(--temu-runtime-badge-text);
  font-weight: 600;
}

.temu-function-button__desc {
  display: -webkit-box;
  margin-top: 4px;
  overflow: hidden;
  color: var(--el-text-color-regular);
  font-size: 10px;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.temu-function-button.is-active {
  border-color: color-mix(in srgb, var(--el-color-primary) 36%, white);
  background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-bg-color));
}

.temu-function-button.is-active .temu-function-button__desc,
.temu-function-button.is-active .temu-function-button__meta {
  color: var(--el-text-color-primary);
}

.temu-function-button.is-disabled {
  cursor: not-allowed;
  opacity: 0.66;
}

.temu-workspace__editor,
.temu-workspace__filter-empty {
  padding: 0;
  border: 0;
  background: transparent;
}

.temu-workspace__editor::before,
.temu-workspace__filter-empty::before {
  content: "";
  display: block;
  margin-bottom: 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.temu-workspace__editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.temu-workspace__editor-runtime-hint {
  display: inline-flex;
  align-self: flex-start;
  margin-top: 8px;
  padding: 4px 10px;
  border: 1px solid var(--temu-runtime-hint-border);
  border-radius: 999px;
  background: var(--temu-runtime-hint-bg);
  color: var(--temu-runtime-hint-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
}

.temu-workspace__helper-panel {
  padding: 0;
  border: 0;
  background: transparent;
}

.temu-helper-chip {
  padding: 9px 10px;
  border-radius: 10px;
  max-width: 320px;
  text-align: left;
  background: var(--el-fill-color-extra-light);
}

.temu-workspace__form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.temu-field.is-wide {
  grid-column: 1 / -1;
}

.temu-field__label {
  margin-bottom: 6px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-weight: 600;
}

.temu-field__required {
  color: var(--el-color-danger);
}

.temu-field__control {
  width: 100%;
}

.temu-field__error {
  margin-top: 6px;
  color: var(--el-color-danger);
  font-size: 12px;
}

.temu-workspace__note {
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color);
  border-radius: 0;
  border-right: 0;
  border-bottom: 0;
  border-left: 0;
  background: transparent;
}

.temu-workspace__runner {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.temu-workspace__unsupported,
.temu-workspace__filter-empty {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.75;
}

.temu-workspace__result-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 700;
}

.temu-workspace__json {
  margin: 0;
  padding: 12px;
  border-radius: 10px;
  border: 0;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 12px;
  line-height: 1.7;
  overflow: auto;
  max-height: 720px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family:
    "SFMono-Regular", "JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, monospace;
}

.temu-workspace__json--compact {
  max-height: 360px;
  padding: 10px;
  font-size: 11px;
}

.temu-workspace__task-action-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.temu-workspace__task-action-cell small {
  color: var(--el-text-color-placeholder);
  font-size: 10px;
  line-height: 1.4;
  word-break: break-all;
}

.temu-workspace__task-pagination {
  display: flex;
  justify-content: flex-end;
}

.temu-workspace__task-dialog :deep(.el-dialog__header) {
  padding: 18px 24px 0;
}

.temu-workspace__task-dialog :deep(.el-dialog__body) {
  padding: 18px 24px 24px;
}

.temu-workspace__task-dialog-body {
  min-height: 180px;
}

.temu-workspace__task-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.temu-workspace__task-detail--dialog {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.temu-workspace__task-meta-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px 24px;
  padding: 14px 0 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

.temu-task-meta-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.temu-task-meta-row span {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.temu-task-meta-row strong {
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.temu-workspace__task-detail-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.temu-workspace__task-json-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.temu-task-log-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

.temu-task-log-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: transparent;
}

.temu-task-log-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.temu-task-log-item__time {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.5;
}

.temu-task-log-item__message {
  color: var(--el-text-color-primary);
  font-size: 12px;
  line-height: 1.7;
  word-break: break-word;
}

@media (max-width: 1280px) {
  .temu-workspace__action-grid {
    grid-template-columns: repeat(auto-fill, minmax(144px, 1fr));
  }
}

@media (max-width: 768px) {
  .temu-workspace__toolbar,
  .temu-workspace__editor-head,
  .temu-workspace__result-head,
  .temu-workspace__task-head,
  .temu-workspace__task-detail-head {
    flex-direction: column;
    align-items: stretch;
  }

  .temu-workspace__action-grid,
  .temu-workspace__form {
    grid-template-columns: minmax(0, 1fr);
  }

  .temu-workspace__task-json-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .temu-workspace__search {
    width: 100%;
  }

  .temu-workspace__toolbar-side,
  .temu-workspace__result-tools,
  .temu-workspace__task-tools,
  .temu-workspace__runner {
    width: 100%;
  }

  .temu-workspace__runner {
    justify-content: stretch;
    flex-direction: column;
  }

  .temu-workspace__task-dialog :deep(.el-dialog__header),
  .temu-workspace__task-dialog :deep(.el-dialog__body) {
    padding-right: 16px;
    padding-left: 16px;
  }
}
</style>
