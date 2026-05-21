<template>
  <section class="temu-workspace">
    <div v-if="floatingBatchProgressItems.length" class="temu-workspace__floating-progress" :class="{ 'is-collapsed': floatingProgressCollapsed }">
      <div class="temu-workspace__floating-progress-head">
        <strong>{{ floatingProgressTitle }}</strong>
        <div class="temu-workspace__floating-progress-actions">
          <span>{{ floatingProgressSummary }}</span>
          <el-button text size="small" type="danger" @click="clearFloatingBatchProgress">
            清理
          </el-button>
          <el-button text size="small" @click="floatingProgressCollapsed = !floatingProgressCollapsed">
            {{ floatingProgressCollapsed ? "展开" : "折叠" }}
          </el-button>
        </div>
      </div>
      <template v-if="!floatingProgressCollapsed">
        <div
          v-for="item in floatingBatchProgressItems"
          :key="item.key"
          class="temu-workspace__floating-progress-item"
        >
          <div class="temu-workspace__floating-progress-head temu-workspace__floating-progress-head--sub">
            <strong>{{ item.title }}</strong>
            <span>{{ item.progressText }}</span>
          </div>
          <el-progress
            :percentage="item.percent"
            :stroke-width="8"
            :show-text="false"
          />
          <div class="temu-workspace__floating-progress-meta">
            <span v-if="item.rowText">{{ item.rowText }}</span>
            <span v-if="item.stage">{{ item.stage }}</span>
          </div>
          <div class="temu-workspace__price-review-batch-stats">
            <el-tag size="small" effect="plain" type="success">成功 {{ item.successCount }}</el-tag>
            <el-tag size="small" effect="plain" type="danger">失败 {{ item.failedCount }}</el-tag>
            <el-tag size="small" effect="plain" type="warning">剩余 {{ item.remainingCount }}</el-tag>
          </div>
        </div>
      </template>
    </div>

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
                :multiple="field.multiple"
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
              v-if="selectedAction?.key === 'compliance.page-query'"
              :loading="complianceFetchingAll"
              :disabled="!canRunSelectedAction || activeActionRunning || complianceFetchingAll"
              @click="fetchAllComplianceRows"
            >
              一键获取全部
            </el-button>
            <el-button
              v-if="selectedAction?.key === 'goods.real-picture.list'"
              :loading="realPictureFetchingAll"
              :disabled="!canRunSelectedAction || activeActionRunning || realPictureFetchingAll"
              @click="fetchAllRealPictureRows"
            >
              一键获取全部
            </el-button>
            <el-button
              v-if="selectedAction?.key === 'goods.price-review.list'"
              :loading="priceReviewFetchingAll"
              :disabled="!canRunSelectedAction || activeActionRunning || priceReviewFetchingAll"
              @click="fetchAllPriceReviewRows"
            >
              一键获取全部
            </el-button>
            <el-button
              v-if="selectedAction?.key === 'jit.list'"
              :loading="jitFetchingAll"
              :disabled="!canRunSelectedAction || activeActionRunning || jitFetchingAll"
              @click="fetchAllJitRows"
            >
              一键获取全部
            </el-button>
            <el-button
              v-if="selectedAction?.key === 'goods.confirmation.list'"
              :loading="confirmationFetchingAll"
              :disabled="!canRunSelectedAction || activeActionRunning || confirmationFetchingAll"
              @click="fetchAllConfirmationRows"
            >
              一键获取全部
            </el-button>
            <el-button
              type="primary"
              :loading="activeActionRunning"
              :disabled="!canRunSelectedAction || activeActionRunning"
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
      destroy-on-close
      class="temu-workspace__task-dialog"
      :title="activeTaskRunDetail ? `记录详情 #${activeTaskRunDetail.id}` : '记录详情'"
    >
      <div v-loading="taskRunDetailLoading" class="temu-workspace__task-dialog-body">
        <div
          v-if="activeTaskRunDetail"
          class="temu-workspace__task-detail temu-workspace__task-detail--dialog"
        >
          <div class="temu-workspace__task-detail-head">
            <div class="temu-workspace__task-head-side">
              <div class="temu-workspace__task-meta-compact">
                <div>
                  <span>记录编号</span>
                  <strong>#{{ activeTaskRunDetail.id }}</strong>
                </div>
                <div>
                  <span>环境</span>
                  <strong>{{ activeTaskRunDetail.profileId || "-" }}</strong>
                </div>
                <div>
                  <span>区域</span>
                  <strong>{{ resolveRegionLabel(activeTaskRunDetail.region) }}</strong>
                </div>
                <div>
                  <span>开始时间</span>
                  <strong>{{ formatDateTime(activeTaskRunDetail.startedAt) }}</strong>
                </div>
                <div>
                  <span>结束时间</span>
                  <strong>{{ formatDateTime(activeTaskRunDetail.finishedAt) }}</strong>
                </div>
                <div>
                  <span>耗时</span>
                  <strong>{{ formatDuration(activeTaskRunDetail.durationMs) }}</strong>
                </div>
              </div>

              <div class="temu-workspace__task-tools">
                <el-popover placement="bottom-end" width="560" trigger="click" popper-class="temu-task-json-popover">
                  <template #reference>
                    <el-button text size="small">请求参数</el-button>
                  </template>
                  <div class="temu-task-log-popover__head">
                    <strong>请求参数</strong>
                    <el-button text size="small" @click="copyText('任务参数', taskRunParamsText)">
                      复制
                    </el-button>
                  </div>
                  <pre class="temu-workspace__json temu-workspace__json--compact temu-task-json-popover__content">{{
                    taskRunParamsText
                  }}</pre>
                </el-popover>
                <el-popover placement="bottom-end" width="560" trigger="click" popper-class="temu-task-json-popover">
                  <template #reference>
                    <el-button text size="small">任务结果</el-button>
                  </template>
                  <div class="temu-task-log-popover__head">
                    <strong>任务结果</strong>
                    <el-button text size="small" @click="copyText('任务结果', taskRunResultText)">
                      复制
                    </el-button>
                  </div>
                  <pre class="temu-workspace__json temu-workspace__json--compact temu-task-json-popover__content">{{
                    taskRunResultText
                  }}</pre>
                </el-popover>
                <el-popover placement="bottom-end" width="520" trigger="click" popper-class="temu-task-log-popover">
                  <template #reference>
                    <el-button text size="small">执行日志</el-button>
                  </template>
                  <div class="temu-task-log-popover__head">
                    <strong>执行日志</strong>
                    <el-button text size="small" @click="copyText('任务日志', taskRunLogsText)">
                      复制
                    </el-button>
                  </div>
                  <div v-if="taskRunLogEntries.length" class="temu-task-log-list temu-task-log-list--popover">
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
                </el-popover>
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
          </div>

          <div
            v-if="isPriceReviewTaskRunResult"
            class="temu-workspace__task-detail-section temu-workspace__task-preview-section"
          >
            <div class="temu-workspace__section-title temu-workspace__price-review-list-head">
              <div class="temu-workspace__section-title-main">
                <span>任务结果列表</span>
                <el-tag size="small" effect="plain">{{ taskRunPriceReviewPreviewRows.length }}</el-tag>
                <el-tag
                  v-if="taskRunPriceReviewTotalCount !== taskRunPriceReviewPreviewRows.length"
                  size="small"
                  effect="plain"
                  type="warning"
                >
                  全部 {{ taskRunPriceReviewTotalCount }}
                </el-tag>
                <el-tag v-if="selectedPriceReviewRows.length" size="small" effect="plain" type="success">
                  已选 {{ selectedPriceReviewRows.length }}
                </el-tag>
                <el-tag v-if="priceReviewBatchSubmitting" size="small" effect="plain" type="warning">
                  {{ priceReviewBatchProgressText }}
                </el-tag>
              </div>
              <div class="temu-workspace__price-review-toolbar">
                <div class="temu-workspace__price-review-filters">
                  <el-select
                    v-model="priceReviewRiskFilter"
                    class="temu-workspace__price-review-filter"
                    size="small"
                    placeholder="价差比"
                  >
                    <el-option label="全部价差比" value="all" />
                    <el-option label="涨价/持平：>= 0%" value="up" />
                    <el-option label="绿色：不错，降幅 0% - 10%" value="green" />
                    <el-option label="黄色：可接受，降幅 10% - 20%" value="yellow" />
                    <el-option label="橙色：偏高，降幅 20% - 30%" value="orange" />
                    <el-option label="红色：较差，降幅 30% - 50%" value="red" />
                    <el-option label="黑红：降幅 > 50%" value="critical" />
                  </el-select>
                  <el-select
                    v-model="priceReviewStatusFilter"
                    class="temu-workspace__price-review-filter"
                    size="small"
                    placeholder="处理状态"
                  >
                    <el-option label="全部状态" value="all" />
                    <el-option label="待处理" value="pending" />
                    <el-option label="已处理" value="processed" />
                  </el-select>
                  <el-select
                    v-model="priceReviewSortMode"
                    class="temu-workspace__price-review-filter"
                    size="small"
                    placeholder="排序"
                  >
                    <el-option label="默认排序" value="default" />
                    <el-option label="差价绝对值从高到低" value="difference-desc" />
                    <el-option label="差价绝对值从低到高" value="difference-asc" />
                    <el-option label="差价率绝对值从高到低" value="ratio-desc" />
                    <el-option label="差价率绝对值从低到高" value="ratio-asc" />
                  </el-select>
                  <el-input-number
                    v-model="priceReviewAmountFilterMin"
                    class="temu-workspace__price-review-filter-number"
                    size="small"
                    :precision="2"
                    :step="1"
                    controls-position="right"
                    placeholder="最小价差"
                  />
                  <el-input-number
                    v-model="priceReviewAmountFilterMax"
                    class="temu-workspace__price-review-filter-number"
                    size="small"
                    :precision="2"
                    :step="1"
                    controls-position="right"
                    placeholder="最大价差"
                  />
                  <el-button size="small" text @click="resetPriceReviewFilters">重置</el-button>
                </div>
                <div v-if="isPriceReviewBatchAvailable" class="temu-workspace__price-review-batch-actions">
                  <el-button
                    size="small"
                    type="primary"
                    :disabled="!selectedSubmittablePriceReviewRows.length || priceReviewBatchSubmitting"
                    :loading="priceReviewBatchSubmittingMode === 'confirm'"
                    @click="submitSelectedPriceReviewRows('confirm')"
                  >
                    批量确认核价
                  </el-button>
                  <el-button
                    size="small"
                    type="warning"
                    :disabled="!selectedRepriceablePriceReviewRows.length || priceReviewBatchSubmitting"
                    :loading="priceReviewBatchSubmittingMode === 'reprice'"
                    @click="submitSelectedPriceReviewRows('reprice')"
                  >
                    批量重新报价
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    :disabled="!selectedAbandonablePriceReviewRows.length || priceReviewBatchSubmitting"
                    :loading="priceReviewBatchSubmittingMode === 'abandon'"
                    @click="submitSelectedPriceReviewRows('abandon')"
                  >
                    批量不核价
                  </el-button>
                </div>
              </div>
            </div>
            <div class="common-table">
              <vxe-grid
                ref="priceReviewPreviewGridRef"
                v-bind="priceReviewPreviewGridOptions"
                :data="taskRunPriceReviewPreviewRows"
                class="temu-workspace__preview-table"
                @checkbox-change="onPriceReviewSelectionChange"
                @checkbox-all="onPriceReviewSelectionChange"
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

                <template #priceReviewIdentitySlot="{ row }">
                  <div class="temu-workspace__price-review-identity">
                    <div>
                      <span>核价单号</span>
                      <strong>{{ row.priceOrderId }}</strong>
                    </div>
                    <div>
                      <span>SPU</span>
                      <strong>{{ row.spuId }}</strong>
                    </div>
                    <div>
                      <span>SKC</span>
                      <strong>{{ row.skcId }}</strong>
                    </div>
                    <div>
                      <span>SKU</span>
                      <strong>{{ row.skuId }}</strong>
                    </div>
                  </div>
                </template>

                <template #priceReviewPricingSlot="{ row }">
                  <div
                    class="temu-workspace__price-review-pricing"
                    :class="`is-${row.priceDecisionTone}`"
                    :style="row.priceDecisionStyle"
                  >
                    <div class="temu-workspace__price-review-prices">
                      <div>
                        <span>当前价</span>
                        <strong>¥{{ row.currentPrice }}</strong>
                      </div>
                      <div>
                        <span>建议价</span>
                        <strong>¥{{ row.suggestPrice }}</strong>
                      </div>
                      <div class="temu-workspace__price-review-diff">
                        <span>差价</span>
                        <strong>{{ row.priceDifferenceDisplay }}</strong>
                      </div>
                    </div>
                    <div class="temu-workspace__price-review-meter">
                      <strong>{{ row.priceChangeRatioDisplay }}</strong>
                      <em>{{ row.priceDecisionText }}</em>
                    </div>
                  </div>
                </template>

                <template #priceReviewSubmitStatusSlot="{ row }">
                  <div v-if="row.submitStatus !== '-'" class="temu-workspace__submit-status">
                    <el-tag
                      size="small"
                      effect="plain"
                      :type="row.submitStatus === '失败' ? 'danger' : 'success'"
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
                      type="warning"
                      :loading="priceReviewSubmittingKey === `${row.rowKey}:reprice`"
                      :disabled="!canRepricePriceReviewRow(row) || row.invalid"
                      @click="submitRepricePriceReviewRow(row)"
                    >
                      重新报价
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

          <div
            v-if="isJitListTaskRunResult"
            class="temu-workspace__task-detail-section temu-workspace__task-preview-section"
          >
            <div class="temu-workspace__section-title temu-workspace__price-review-list-head">
              <div class="temu-workspace__section-title-main">
                <span>JIT 待处理列表</span>
                <el-tag size="small" effect="plain">{{ taskRunJitRows.length }}</el-tag>
                <el-tag v-if="taskRunJitTotalCount !== taskRunJitRows.length" size="small" effect="plain" type="warning">
                  全部 {{ taskRunJitTotalCount }}
                </el-tag>
                <el-tag v-if="selectedJitRows.length" size="small" effect="plain" type="success">
                  已选 {{ selectedJitRows.length }}
                </el-tag>
                <el-tag v-if="jitBatchSubmitting" size="small" effect="plain" type="warning">
                  {{ jitBatchProgressText }}
                </el-tag>
              </div>
              <div class="temu-workspace__price-review-batch-actions">
                <el-select
                  v-model="jitOpenStatusFilter"
                  size="small"
                  class="temu-workspace__jit-status-filter"
                >
                  <el-option label="全部 JIT 状态" value="all" />
                  <el-option label="未开通 JIT" value="pending" />
                  <el-option label="已开通 JIT" value="opened" />
                </el-select>
                <el-select
                  v-model="jitStockStatusFilter"
                  size="small"
                  class="temu-workspace__jit-status-filter"
                >
                  <el-option label="全部库存状态" value="all" />
                  <el-option label="未维护库存" value="pending" />
                  <el-option label="已维护库存" value="maintained" />
                </el-select>
                <label class="temu-workspace__jit-stock-field">
                  <span>目标库存</span>
                  <el-input-number
                    v-model="jitStockFinalNum"
                    size="small"
                    class="temu-workspace__jit-stock-input"
                    :min="0"
                    :step="50"
                    controls-position="right"
                  />
                </label>
                <el-button
                  size="small"
                  type="primary"
                  :disabled="!selectedOpenableJitRows.length || jitBatchSubmitting"
                  :loading="jitBatchSubmitting"
                  @click="submitSelectedJitRows"
                >
                  批量开通 JIT
                </el-button>
                <el-button
                  size="small"
                  type="success"
                  :disabled="!selectedStockMaintainableJitRows.length || jitBatchSubmitting"
                  :loading="jitBatchSubmitting"
                  @click="submitSelectedJitStockRows"
                >
                  批量维护库存
                </el-button>
                <el-button
                  size="small"
                  type="warning"
                  :disabled="!selectedJitRows.length || jitBatchSubmitting"
                  :loading="jitBatchSubmitting"
                  @click="submitSelectedJitOpenAndStockRows"
                >
                  批量开通并维护库存
                </el-button>
              </div>
            </div>
            <div class="common-table">
              <vxe-grid
                ref="jitPreviewGridRef"
                v-bind="jitPreviewGridOptions"
                :data="taskRunJitRows"
                class="temu-workspace__preview-table"
                @checkbox-change="onJitSelectionChange"
                @checkbox-all="onJitSelectionChange"
              >
                <template #jitImageSlot="{ row }">
                  <el-image
                    v-if="row.imageUrl && row.imageUrl !== '-'"
                    :src="row.imageUrl"
                    :preview-src-list="[row.imageUrl]"
                    fit="cover"
                    preview-teleported
                    class="temu-workspace__preview-image"
                  />
                  <span v-else class="temu-workspace__muted">无图</span>
                </template>
                <template #jitIdentitySlot="{ row }">
                  <div class="temu-workspace__price-review-identity">
                    <div><span>SPU</span><strong>{{ row.spuId }}</strong></div>
                    <div><span>SKC</span><strong>{{ row.skcId }}</strong></div>
                    <div><span>SKC货号</span><strong>{{ row.skcExtCode }}</strong></div>
                  </div>
                </template>
                <template #jitStatusSlot="{ row }">
                  <div class="temu-workspace__submit-status">
                    <el-tag
                      size="small"
                      effect="plain"
                      :type="row.jitOpened ? 'success' : 'warning'"
                    >
                      {{ row.jitStatusText }}
                    </el-tag>
                    <template v-if="row.submitStatus !== '-'">
                      <el-tag
                        size="small"
                        effect="plain"
                        :type="row.submitStatus === '失败' ? 'danger' : 'success'"
                      >
                        {{ row.submitStatus }}
                      </el-tag>
                      <small>{{ row.submitMessage }}</small>
                    </template>
                  </div>
                </template>
                <template #jitStockStatusSlot="{ row }">
                  <div class="temu-workspace__submit-status">
                    <el-tag
                      size="small"
                      effect="plain"
                      :type="row.stockMaintained ? 'success' : row.stockSubmitStatus === '失败' ? 'danger' : 'info'"
                    >
                      {{ row.stockStatusText }}
                    </el-tag>
                    <el-tag
                      v-if="row.stockSubmitStatus !== '-'"
                      size="small"
                      effect="plain"
                      :type="row.stockSubmitStatus === '失败' ? 'danger' : 'success'"
                    >
                      {{ row.stockSubmitStatus }}
                    </el-tag>
                    <small v-if="row.stockSubmitStatus !== '-'">
                      {{ row.stockSubmitMessage }}
                      <template v-if="row.stockFinalNum !== null"> / 目标 {{ row.stockFinalNum }}</template>
                    </small>
                  </div>
                </template>
                <template #jitOperationSlot="{ row }">
                  <div class="temu-workspace__row-actions temu-workspace__row-actions--right">
                    <el-button
                      text
                      size="small"
                      type="primary"
                      :loading="jitSubmittingKey === row.rowKey"
                      :disabled="jitBatchSubmitting || row.jitOpened"
                      @click="submitJitRows([row], false)"
                    >
                      {{ row.jitOpened ? "已开通" : "开通 JIT" }}
                    </el-button>
                    <el-button
                      text
                      size="small"
                      type="success"
                      :loading="jitStockSubmittingKey === row.rowKey"
                      :disabled="jitBatchSubmitting || !row.jitOpened || row.stockMaintained"
                      @click="submitJitStockRow(row)"
                    >
                      {{ row.stockMaintained ? "已维护" : "维护库存" }}
                    </el-button>
                  </div>
                </template>
              </vxe-grid>
            </div>
          </div>

          <div
            v-if="isRealPictureTaskRunResult"
            class="temu-workspace__task-detail-section temu-workspace__task-preview-section"
          >
            <div class="temu-workspace__section-title temu-workspace__price-review-list-head">
              <div class="temu-workspace__section-title-main">
                <span>实拍图治理列表</span>
                <el-tag size="small" effect="plain">{{ taskRunRealPictureRows.length }}</el-tag>
                <el-tag
                  v-if="taskRunRealPictureTotalCount !== taskRunRealPictureRows.length"
                  size="small"
                  effect="plain"
                  type="warning"
                >
                  全部 {{ taskRunRealPictureTotalCount }}
                </el-tag>
                <el-tag v-if="selectedRealPictureRows.length" size="small" effect="plain" type="success">
                  已选 {{ selectedRealPictureRows.length }}
                </el-tag>
                <el-tag v-if="realPictureBatchSubmitting" size="small" effect="plain" type="warning">
                  {{ realPictureBatchProgressText }}
                </el-tag>
              </div>
              <div class="temu-workspace__price-review-batch-actions">
                <el-button
                  size="small"
                  type="primary"
                  :disabled="!selectedRealPictureRows.length || realPictureBatchSubmitting"
                  @click="openRealPictureUploader(selectedRealPictureRows)"
                >
                  批量上传
                </el-button>
              </div>
            </div>
            <div class="common-table">
              <vxe-grid
                ref="realPicturePreviewGridRef"
                v-bind="realPicturePreviewGridOptions"
                :data="taskRunRealPictureRows"
                class="temu-workspace__preview-table"
                @checkbox-change="onRealPictureSelectionChange"
                @checkbox-all="onRealPictureSelectionChange"
              >
                <template #realPictureImageSlot="{ row }">
                  <el-image
                    v-if="row.imageUrl && row.imageUrl !== '-'"
                    class="temu-workspace__preview-image"
                    :src="row.imageUrl"
                    :preview-src-list="row.previewImageUrls"
                    preview-teleported
                    fit="cover"
                  />
                  <span v-else>-</span>
                </template>
                <template #realPictureIdentitySlot="{ row }">
                  <div class="temu-workspace__price-review-identity">
                    <div><span>SPU</span><strong>{{ row.spuId }}</strong></div>
                    <div><span>goodsId</span><strong>{{ row.goodsId }}</strong></div>
                    <div><span>SKU</span><strong>{{ row.skuSummary }}</strong></div>
                    <div><span>同图</span><strong>{{ row.isSameSku }}</strong></div>
                  </div>
                </template>
                <template #realPictureRulesSlot="{ row }">
                  <div class="temu-workspace__preview-product">
                    <span>{{ row.ruleSummary }}</span>
                    <small>{{ row.statusSummary }}</small>
                  </div>
                </template>
                <template #realPictureUploadMarkSlot="{ row }">
                  <div class="temu-workspace__submit-status">
                    <el-tag
                      size="small"
                      effect="plain"
                      :type="row.submitStatus === '已上传' ? 'success' : 'info'"
                    >
                      {{ row.submitStatus }}
                    </el-tag>
                    <small v-if="row.submitMessage !== '-'">{{ row.submitMessage }}</small>
                  </div>
                </template>
                <template #realPictureOperationSlot="{ row }">
                  <div class="temu-workspace__row-actions temu-workspace__row-actions--right">
                    <el-button
                      text
                      size="small"
                      type="primary"
                      :loading="realPictureSubmittingKey === row.rowKey"
                      :disabled="realPictureBatchSubmitting"
                      @click="openRealPictureUploader([row])"
                    >
                      上传
                    </el-button>
                  </div>
                </template>
              </vxe-grid>
            </div>
          </div>

          <div
            v-if="isComplianceTaskRunResult"
            class="temu-workspace__task-detail-section temu-workspace__task-preview-section"
          >
            <div class="temu-workspace__section-title temu-workspace__price-review-list-head">
              <div class="temu-workspace__section-title-main">
                <span>合规信息列表</span>
                <el-tag size="small" effect="plain">{{ visibleTaskRunComplianceRows.length }}</el-tag>
                <el-tag
                  v-if="taskRunComplianceTotalCount !== visibleTaskRunComplianceRows.length"
                  size="small"
                  effect="plain"
                  type="warning"
                >
                  全部 {{ taskRunComplianceTotalCount }}
                </el-tag>
                <el-tag
                  v-if="taskRunComplianceFilteredCount > 0"
                  size="small"
                  effect="plain"
                  type="info"
                >
                  已过滤无关数据 {{ taskRunComplianceFilteredCount }} 条
                </el-tag>
                <el-tag v-if="selectedComplianceRows.length" size="small" effect="plain" type="success">
                  已选 {{ selectedComplianceRows.length }}
                </el-tag>
                <el-tag v-if="complianceBatchSubmitting" size="small" effect="plain" type="warning">
                  {{ complianceBatchProgressText }}
                </el-tag>
              </div>
              <div class="temu-workspace__price-review-batch-actions">
                <el-checkbox v-model="complianceIgnoreUselessInfo" size="small">
                  忽略无用信息
                </el-checkbox>
                <el-button
                  size="small"
                  type="primary"
                  :disabled="!selectedComplianceRows.length || complianceBatchSubmitting"
                  :loading="complianceBatchPreparing || complianceBatchSubmitting"
                  @click="openComplianceBatchEditor"
                >
                  批量处理
                </el-button>
              </div>
            </div>
            <div class="common-table">
              <vxe-grid
                v-bind="compliancePreviewGridOptions"
                :data="visibleTaskRunComplianceRows"
                class="temu-workspace__preview-table"
                @checkbox-change="onComplianceSelectionChange"
                @checkbox-all="onComplianceSelectionChange"
              >
                <template #complianceIdentitySlot="{ row }">
                  <div class="temu-workspace__price-review-identity">
                    <div><span>SPU</span><strong>{{ row.spuId }}</strong></div>
                    <div><span>类目</span><strong>{{ row.categoryName }}</strong></div>
                    <div><span>类目ID</span><strong>{{ row.categoryId }}</strong></div>
                    <div><span>goodsId</span><strong>{{ row.goodsId }}</strong></div>
                  </div>
                </template>
                <template #complianceStatusSlot="{ row }">
                  <div class="temu-workspace__compliance-status-list">
                    <div
                      v-for="task in row.taskGroups"
                      :key="task.key"
                      class="temu-workspace__compliance-status-item"
                    >
                      <span class="temu-workspace__compliance-status-name">{{ task.name }}</span>
                      <el-tag
                        size="small"
                        effect="plain"
                        :type="task.tagType"
                      >
                        {{ task.statusText }}
                      </el-tag>
                      <small>{{ task.requiredText }}</small>
                    </div>
                  </div>
                </template>
                <template #complianceActionSlot="{ row }">
                  <div class="temu-workspace__row-actions temu-workspace__row-actions--right">
                    <el-button
                      text
                      size="small"
                      type="primary"
                      :loading="complianceDetailLoadingKey === row.rowKey"
                      :disabled="!isActionableComplianceRow(row)"
                      @click="openComplianceEditor(row)"
                    >
                      处理
                    </el-button>
                  </div>
                </template>
              </vxe-grid>
            </div>
          </div>

          <div
            v-if="isConfirmationTaskRunResult"
            class="temu-workspace__task-detail-section temu-workspace__task-preview-section"
          >
            <div class="temu-workspace__section-title temu-workspace__price-review-list-head">
              <div class="temu-workspace__section-title-main">
                <span>商品确认列表</span>
                <el-tag size="small" effect="plain">{{ taskRunConfirmationRows.length }}</el-tag>
                <el-tag
                  v-if="taskRunConfirmationTotalCount !== taskRunConfirmationRows.length"
                  size="small"
                  effect="plain"
                  type="warning"
                >
                  全部 {{ taskRunConfirmationTotalCount }}
                </el-tag>
                <el-tag v-if="unconfirmedConfirmationRows.length" size="small" effect="plain" type="info">
                  未确认 {{ unconfirmedConfirmationRows.length }}
                </el-tag>
              </div>
              <div class="temu-workspace__section-title-actions">
                <el-button
                  size="small"
                  type="primary"
                  :loading="confirmationBatchSubmitting"
                  :disabled="!selectedConfirmationRows.length"
                  @click="submitSelectedConfirmationRows"
                >
                  批量确认 ({{ selectedConfirmationRows.length }})
                </el-button>
              </div>
            </div>
            <div class="common-table">
              <vxe-grid
                ref="confirmationPreviewGridRef"
                v-bind="confirmationPreviewGridOptions"
                :data="taskRunConfirmationRows"
                class="temu-workspace__preview-table"
                @checkbox-change="onConfirmationSelectionChange"
                @checkbox-all="onConfirmationSelectionChange"
              >
                <template #confirmationImageSlot="{ row }">
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
                <template #confirmationIdentitySlot="{ row }">
                  <div class="temu-workspace__price-review-identity">
                    <div><span>SPU</span><strong>{{ row.spuId }}</strong></div>
                    <div><span>SKC</span><strong>{{ row.skcId }}</strong></div>
                    <div><span>货号</span><strong>{{ row.extCode }}</strong></div>
                  </div>
                </template>
                <template #confirmationStatusSlot="{ row }">
                  <el-tag
                    v-if="row.confirmed"
                    size="small"
                    effect="plain"
                    type="success"
                  >
                    已确认
                  </el-tag>
                  <el-tag
                    v-else-if="row.submitStatus === '失败'"
                    size="small"
                    effect="plain"
                    type="danger"
                  >
                    确认失败
                  </el-tag>
                  <el-tag v-else size="small" effect="plain" type="info">
                    待确认
                  </el-tag>
                </template>
                <template #confirmationOperationSlot="{ row }">
                  <div class="temu-workspace__row-actions temu-workspace__row-actions--right">
                    <el-button
                      text
                      size="small"
                      type="primary"
                      :loading="confirmationSubmittingKey === row.rowKey"
                      :disabled="confirmationBatchSubmitting || row.confirmed"
                      @click="submitSingleConfirmationRow(row)"
                    >
                      {{ row.confirmed ? "已确认" : "确认" }}
                    </el-button>
                  </div>
                </template>
              </vxe-grid>
            </div>
          </div>

        </div>

        <div v-else class="temu-workspace__unsupported">正在加载记录详情...</div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="priceReviewBatchRepriceVisible"
      title="批量重新报价"
      width="820px"
      append-to-body
      destroy-on-close
      class="temu-workspace__batch-reprice-dialog"
    >
      <div class="temu-workspace__batch-reprice-head">
        <span v-if="priceReviewBatchSubmittingMode === 'reprice'">
          处理中 {{ priceReviewBatchFinishedCount }}/{{ priceReviewBatchTotalCount }}
        </span>
        <span v-else>已选 {{ priceReviewBatchRepriceRows.length }} 条</span>
        <small>默认按各自当前价减 0.01，可逐行修改。</small>
      </div>
      <div class="common-table">
        <vxe-grid
          v-bind="priceReviewBatchRepriceGridOptions"
          :data="priceReviewBatchRepriceRows"
          class="temu-workspace__batch-reprice-table"
        >
          <template #batchRepriceIdentitySlot="{ row }">
            <div class="temu-workspace__batch-reprice-identity">
              <strong>{{ row.skuId }}</strong>
              <span>{{ row.skuExtCode }}</span>
            </div>
          </template>
          <template #batchRepriceInputSlot="{ row }">
            <el-input-number
              v-model="priceReviewBatchRepricePrices[row.rowKey]"
              size="small"
              :min="0"
              :precision="2"
              :step="0.01"
              controls-position="right"
              class="temu-workspace__batch-reprice-input"
            />
          </template>
        </vxe-grid>
      </div>
      <template #footer>
        <el-button :disabled="priceReviewBatchSubmittingMode === 'reprice'" @click="priceReviewBatchRepriceVisible = false">
          取消
        </el-button>
        <el-button
          type="warning"
          :loading="priceReviewBatchSubmittingMode === 'reprice'"
          :disabled="priceReviewBatchSubmittingMode === 'reprice'"
          @click="confirmBatchRepriceRows"
        >
          提交重新报价
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="realPictureUploadVisible"
      title="上传实拍图"
      width="720px"
      append-to-body
      destroy-on-close
      class="temu-workspace__real-picture-dialog"
    >
      <div class="temu-workspace__batch-reprice-head">
        <span>已选 {{ realPictureUploadRows.length }} 条</span>
        <small>填写一组 HTTP 图片，会同时上传到商品主体实拍图和商品外包装实拍图。</small>
      </div>
      <el-form label-position="top" class="temu-workspace__real-picture-form">
        <div
          v-for="(positionItem, index) in realPictureUploadForm.positionItems"
          :key="positionItem.id || index"
          class="temu-workspace__real-picture-position-item"
        >
          <el-form-item :label="index === 0 ? 'HTTP 图片地址' : 'HTTP 图片地址补充'">
            <el-input
              v-model="positionItem.imageUrlsText"
              type="textarea"
              :rows="4"
              placeholder="每行一个 HTTP 图片地址，会同时提交到商品主体实拍图和商品外包装实拍图"
              :disabled="realPictureBatchSubmitting"
            />
          </el-form-item>
          <el-button
            text
            type="danger"
            :disabled="realPictureBatchSubmitting || realPictureUploadForm.positionItems.length <= 1"
            @click="removeRealPicturePositionItem(index)"
          >
            删除
          </el-button>
        </div>
        <el-button
          plain
          size="small"
          :disabled="realPictureBatchSubmitting"
          @click="addRealPicturePositionItem"
        >
          添加图片输入框
        </el-button>
      </el-form>
      <template #footer>
        <el-button :disabled="realPictureBatchSubmitting" @click="realPictureUploadVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="realPictureBatchSubmitting"
          :disabled="realPictureBatchSubmitting"
          @click="submitRealPictureUploadRows"
        >
          上传
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="complianceEditorVisible"
      title="合规信息处理"
      width="980px"
      append-to-body
      destroy-on-close
      class="temu-workspace__compliance-dialog"
    >
      <div
        v-loading="complianceEditorLoading"
        class="temu-workspace__compliance-dialog-body"
      >
        <div v-if="activeComplianceRow" class="temu-workspace__compliance-dialog-head">
          <div class="temu-workspace__price-review-identity">
            <div><span>SPU</span><strong>{{ activeComplianceRow.spuId }}</strong></div>
            <div><span>类目</span><strong>{{ activeComplianceRow.categoryName }}</strong></div>
            <div><span>类目ID</span><strong>{{ activeComplianceRow.categoryId }}</strong></div>
            <div><span>goodsId</span><strong>{{ activeComplianceRow.goodsId }}</strong></div>
          </div>
          <el-tag size="small" effect="plain">{{ activeComplianceRow.typeText }}</el-tag>
        </div>
        <div class="temu-workspace__compliance-editor-grid">
          <div class="temu-workspace__compliance-picker">
            <button
              v-for="task in visibleComplianceEditorTaskGroups"
              :key="task.key"
              type="button"
              class="temu-workspace__compliance-picker-item"
              :class="{ 'is-active': selectedComplianceTaskKey === task.key }"
              @click="selectedComplianceTaskKey = task.key"
            >
              <span>{{ task.name }}</span>
              <el-tag size="small" effect="plain" :type="task.tagType">{{ task.statusText }}</el-tag>
              <small>{{ task.requiredText }}</small>
            </button>
          </div>

          <div class="temu-workspace__compliance-editor-panel">
            <template v-if="selectedComplianceTask">
              <div class="temu-workspace__compliance-editor-title">
                <strong>{{ selectedComplianceTask.name }}</strong>
                <el-tag size="small" effect="plain" :type="selectedComplianceTask.tagType">
                  {{ selectedComplianceTask.statusText }}
                </el-tag>
              </div>
              <el-form
                label-position="top"
                class="temu-workspace__compliance-form"
              >
                <el-form-item
                  v-for="field in selectedComplianceFields"
                  :key="field.key"
                  :label="field.label"
                >
                  <el-select
                    v-if="field.controlType !== 'input'"
                    v-model="complianceEditorForm[field.key]"
                    filterable
                    clearable
                    :disabled="field.disabled || !field.options.length"
                    :placeholder="field.options.length ? '请选择' : '暂无可选值'"
                    class="temu-workspace__compliance-control"
                  >
                    <el-option
                      v-for="option in field.options"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                  <el-input
                    v-else
                    v-model="complianceEditorForm[field.key]"
                    clearable
                    placeholder="请输入"
                    class="temu-workspace__compliance-control"
                  />
                </el-form-item>
                <el-empty
                  v-if="!selectedComplianceFields.length"
                  description="当前模板未解析到可填写字段"
                />
              </el-form>
            </template>
            <el-empty v-else description="请选择一个合规项" />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button :disabled="complianceBatchSubmitting" @click="complianceEditorVisible = false">关闭</el-button>
        <el-button
          type="primary"
          :loading="complianceSubmitting || complianceBatchSubmitting"
          :disabled="complianceEditorLoading || !activeComplianceRow"
          @click="submitComplianceEditor"
        >
          {{ complianceBatchMode ? "批量提交" : "提交" }}
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import type { VxeGridInstance, VxeGridProps } from "vxe-table";
import type { ToolkitToolItem } from "@/api/external/toolkit";
import {
  batchDeleteTemuTaskRuns,
  batchMarkTemuTaskRunJitRows,
  batchMarkTemuTaskRunPriceReviewRows,
  batchMarkTemuTaskRunRealPictureRows,
  clearTemuBatchProgress,
  createTemuTaskRun,
  deleteTemuTaskRun,
  executeTemuClientAction,
  executeTemuAction,
  getTemuBatchProgress,
  getTemuCatalog,
  getTemuTaskRun,
  getTemuTaskRunPage,
  markTemuTaskRunJitRow,
  markTemuTaskRunPriceReviewRow,
  markTemuTaskRunRealPictureRow,
  retryTemuTaskRun,
  updateTemuBatchProgress,
  type TemuBatchProgressItem,
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
  asArray,
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
  priceDifferenceDisplay: string;
  priceDifferenceValue: number | null;
  priceChangeRatioDisplay: string;
  priceChangeRatioValue: number | null;
  priceDecisionTone: "success" | "warning" | "danger" | "neutral";
  priceDecisionText: string;
  priceDecisionStyle: Record<string, string>;
  times: string;
  processed: boolean;
  invalid: boolean;
  invalidReason: string;
  submitStatus: string;
  submitMessage: string;
}

interface PriceReviewSubmitMark {
  status: "success" | "failed";
  action: "confirm" | "abandon" | "reprice";
  message: string;
  time: string;
  markInvalid?: boolean;
  completedLabel?: string;
}

interface RealPictureSubmitMark {
  status: "success" | "failed";
  message: string;
  time: string;
}

interface JitSubmitMark {
  status: "success" | "failed";
  action?: "open" | "stock";
  message: string;
  time: string;
  markOpened?: boolean;
  stockMaintained?: boolean;
  finalNum?: number;
}

interface JitPreviewRow {
  rowKey: string;
  imageUrl: string;
  spuId: string;
  skcId: string;
  rawSpuId: number;
  rawSkcId: number;
  applyJitStatus: number | null;
  jitOpened: boolean;
  jitStatusText: string;
  stockMaintained: boolean;
  stockStatusText: string;
  stockSubmitStatus: string;
  stockSubmitMessage: string;
  stockFinalNum: number | null;
  skcExtCode: string;
  productName: string;
  categoryName: string;
  submitStatus: string;
  submitMessage: string;
  raw: Record<string, any>;
}

interface ConfirmationPreviewRow {
  rowKey: string;
  imageUrl: string;
  spuId: string;
  skcId: string;
  rawSpuId: number;
  rawSkcId: number;
  rawGoodsId: number;
  siteVersion: number;
  goodsSkuIdList: number[];
  extCode: string;
  productName: string;
  categoryName: string;
  createTime: string;
  confirmed: boolean;
  submitStatus: string;
  submitMessage: string;
  raw: Record<string, any>;
}

interface ConfirmationSubmitMark {
  status: "success" | "failed";
  message: string;
  time: string;
}

interface RealPicturePreviewRow {
  rowKey: string;
  imageUrl: string;
  previewImageUrls: string[];
  spuId: string;
  goodsId: string;
  rawSpuId: number;
  rawGoodsId: number;
  rawSkuIdList: number[];
  rawIsSameSku: boolean;
  existingLabelImageList: Record<string, any>[];
  skuSummary: string;
  isSameSku: string;
  ruleSummary: string;
  statusSummary: string;
  productName: string;
  submitStatus: string;
  submitMessage: string;
  platformStatusText: string;
  platformStatusTone: "success" | "warning" | "info" | "danger";
  editStatusText: string;
  positionImageSummary: string;
  ruleStatusSummary: string;
  raw: Record<string, any>;
}

interface CompliancePreviewRow {
  rowKey: string;
  spuId: string;
  goodsId: string;
  categoryId: string;
  categoryName: string;
  statusText: string;
  typeText: string;
  productName: string;
  taskGroups: ComplianceTaskStatusGroup[];
  actionableTaskGroups: ComplianceTaskStatusGroup[];
  actionablePendingCount: number;
  raw: Record<string, any>;
}

interface ComplianceTaskStatusGroup {
  key: string;
  name: string;
  status: number | null;
  statusText: string;
  requiredText: string;
  tagType: "success" | "warning" | "info" | "danger";
  raw: Record<string, any>;
  children: ComplianceTaskStatusChild[];
}

interface ComplianceTaskStatusChild {
  key: string;
  name: string;
  taskType: string;
  status: number | null;
  statusText: string;
  requiredText: string;
  tagType: ComplianceTaskStatusGroup["tagType"];
  raw: Record<string, any>;
}

interface ComplianceEditorField {
  key: string;
  label: string;
  propertyId: string;
  taskType: string;
  controlType: "select" | "input";
  options: Array<{ label: string; value: string | number }>;
  defaultValue: string | number | null;
  disabled?: boolean;
  raw: Record<string, any>;
}

type PriceReviewRiskFilter = "all" | "up" | "green" | "yellow" | "orange" | "red" | "critical";
type PriceReviewStatusFilter = "all" | "pending" | "processed";
type PriceReviewSortMode =
  | "default"
  | "difference-desc"
  | "difference-asc"
  | "ratio-desc"
  | "ratio-asc";

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

const resetReactiveRecord = (target: Record<string, any>, nextValue: Record<string, any> = {}) => {
  Object.keys(target).forEach((key) => delete target[key]);
  Object.entries(nextValue).forEach(([key, value]) => {
    target[key] = value;
  });
};

const catalogLoading = ref(false);
const runningActionKey = ref("");
const selectedActionKey = useLocalStorage("temu-workspace:selected-action-key", "");
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
const taskRunDetailRequestSeq = ref(0);
const floatingProgressCollapsed = useLocalStorage("temu-workspace:floating-progress-collapsed", false);
const persistedFloatingBatchProgressItems = ref<TemuBatchProgressItem[]>([]);
const batchProgressSyncing = ref(false);
const batchAbortToken = ref(0);
const priceReviewSubmittingKey = ref("");
const priceReviewSubmitMarks = reactive<Record<string, PriceReviewSubmitMark>>({});
const selectedPriceReviewRowKeys = ref<string[]>([]);
const priceReviewPreviewGridRef = ref<VxeGridInstance<PriceReviewPreviewRow>>();
const priceReviewFetchingAll = ref(false);
const realPictureSubmittingKey = ref("");
const realPictureSubmitMarks = reactive<Record<string, RealPictureSubmitMark>>({});
const selectedRealPictureRowKeys = ref<string[]>([]);
const realPicturePreviewGridRef = ref<VxeGridInstance<RealPicturePreviewRow>>();
const realPictureUploadVisible = ref(false);
const realPictureUploadRows = ref<RealPicturePreviewRow[]>([]);
const realPictureUploadForm = useLocalStorage("temu-workspace:real-picture-upload-form", {
  positionItems: [
    { id: "position-1", position: 1, imageUrlsText: "" },
    { id: "position-2", position: 2, imageUrlsText: "" },
  ],
});
const createRealPicturePositionItem = (position?: number, imageUrlsText = "") => ({
  id: `position-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  position: position || Math.max(1, ...asArray<Record<string, any>>(realPictureUploadForm.value.positionItems).map((item) => Number(item.position) || 0)) + 1,
  imageUrlsText,
});
const realPictureBatchSubmitting = ref(false);
const realPictureBatchFinishedCount = ref(0);
const realPictureBatchTotalCount = ref(0);
const realPictureBatchSuccessCount = ref(0);
const realPictureBatchFailedCount = ref(0);
const realPictureFetchingAll = ref(false);
const jitSubmittingKey = ref("");
const jitStockSubmittingKey = ref("");
const jitSubmitMarks = reactive<Record<string, JitSubmitMark>>({});
const jitStockSubmitMarks = reactive<Record<string, JitSubmitMark>>({});
const selectedJitRowKeys = ref<string[]>([]);
const jitPreviewGridRef = ref<VxeGridInstance<JitPreviewRow>>();
const jitOpenStatusFilter = ref<"all" | "pending" | "opened">("all");
const jitStockStatusFilter = ref<"all" | "pending" | "maintained">("all");
const jitStockFinalNum = useLocalStorage("temu-workspace:jit-stock-final-num", 500);
const jitBatchSubmitting = ref(false);
const jitBatchModeLabel = ref("批量处理 JIT");
const jitBatchCurrentStage = ref("");
const jitBatchCurrentRowText = ref("");
const jitBatchFinishedCount = ref(0);
const jitBatchTotalCount = ref(0);
const jitBatchSuccessCount = ref(0);
const jitBatchFailedCount = ref(0);
const jitFetchingAll = ref(false);
const confirmationFetchingAll = ref(false);
const confirmationSubmitMarks = reactive<Record<string, ConfirmationSubmitMark>>({});
const confirmationSubmittingKey = ref("");
const confirmationBatchSubmitting = ref(false);
const confirmationBatchFinishedCount = ref(0);
const confirmationBatchTotalCount = ref(0);
const confirmationBatchSuccessCount = ref(0);
const confirmationBatchFailedCount = ref(0);
const selectedConfirmationRowKeys = ref<string[]>([]);
const confirmationPreviewGridRef = ref<VxeGridInstance<ConfirmationPreviewRow>>();
const priceReviewRiskFilter = ref<PriceReviewRiskFilter>("all");
const priceReviewStatusFilter = ref<PriceReviewStatusFilter>("all");
const priceReviewSortMode = ref<PriceReviewSortMode>("default");
const priceReviewAmountFilterMin = ref<number | undefined>();
const priceReviewAmountFilterMax = ref<number | undefined>();
const priceReviewBatchSubmitting = ref(false);
const priceReviewBatchSubmittingMode = ref<"" | "confirm" | "abandon" | "reprice">("");
const priceReviewBatchCurrentStage = ref("");
const priceReviewBatchCurrentRowText = ref("");
const priceReviewBatchFinishedCount = ref(0);
const priceReviewBatchTotalCount = ref(0);
const priceReviewBatchSuccessCount = ref(0);
const priceReviewBatchFailedCount = ref(0);
const priceReviewBatchRepriceVisible = ref(false);
const priceReviewBatchRepriceRows = ref<PriceReviewPreviewRow[]>([]);
const priceReviewBatchRepricePrices = reactive<Record<string, number>>({});
const PRICE_REVIEW_ROW_TIMEOUT_MS = 90_000;
const PRICE_REVIEW_MARK_CONCURRENCY = 1;
const priceReviewMarkQueue: Array<() => Promise<void>> = [];
let priceReviewMarkRunningCount = 0;
const complianceEditorVisible = ref(false);
const complianceEditorLoading = ref(false);
const complianceDetailLoadingKey = ref("");
const complianceSubmitting = ref(false);
const complianceFetchingAll = ref(false);
const complianceBatchMode = ref(false);
const complianceBatchPreparing = ref(false);
const complianceBatchSubmitting = ref(false);
const complianceBatchRows = ref<CompliancePreviewRow[]>([]);
const selectedComplianceRowKeys = ref<string[]>([]);
const complianceIgnoreUselessInfo = useLocalStorage("temu-workspace:compliance-ignore-useless-info", true);
const complianceBatchFinishedCount = ref(0);
const complianceBatchTotalCount = ref(0);
const complianceBatchSuccessCount = ref(0);
const complianceBatchFailedCount = ref(0);
const activeComplianceRow = ref<CompliancePreviewRow | null>(null);
const selectedComplianceTaskKey = ref("");
const complianceDetailResponse = ref<TemuActionResponse | null>(null);
const complianceTemplateResponse = ref<TemuActionResponse | null>(null);
const complianceEditorForm = reactive<Record<string, any>>({});
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
  rowClassName: ({ row }: { row: PriceReviewPreviewRow }) =>
    row.processed ? "temu-workspace__price-review-row--processed" : "",
  checkboxConfig: {
    ...(commonGridOptions as any).checkboxConfig,
    checkMethod: ({ row }: { row: PriceReviewPreviewRow }) => isSelectablePriceReviewRow(row),
  },
  maxHeight: 780,
  columns: [
    { type: "checkbox", width: 46, fixed: "left" },
    {
      title: "图片",
      field: "imageUrl",
      width: 112,
      align: "center",
      slots: { default: "priceReviewImageSlot" },
    },
    {
      title: "价格判断",
      field: "priceDifference",
      minWidth: 280,
      align: "left",
      headerAlign: "left",
      slots: { default: "priceReviewPricingSlot" },
    },
    {
      title: "商品",
      field: "productName",
      minWidth: 260,
      showOverflow: "tooltip",
      slots: { default: "priceReviewProductSlot" },
    },
    {
      title: "核价信息",
      field: "priceOrderId",
      minWidth: 210,
      slots: { default: "priceReviewIdentitySlot" },
    },
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
      width: 230,
      fixed: "right",
      align: "center",
      slots: { default: "priceReviewOperationSlot" },
    },
  ],
});

const priceReviewBatchRepriceGridOptions = ref<VxeGridProps<PriceReviewPreviewRow>>({
  ...(commonGridOptions as VxeGridProps<PriceReviewPreviewRow>),
  maxHeight: 520,
  columns: [
    {
      title: "SKU",
      field: "skuId",
      minWidth: 180,
      slots: { default: "batchRepriceIdentitySlot" },
    },
    {
      title: "当前价",
      field: "currentPrice",
      width: 110,
      align: "right",
      formatter: ({ row }) => `¥${row.currentPrice}`,
    },
    {
      title: "默认新价",
      field: "rowKey",
      width: 160,
      align: "right",
      slots: { default: "batchRepriceInputSlot" },
    },
    {
      title: "商品",
      field: "productName",
      minWidth: 220,
      showOverflow: "tooltip",
    },
  ],
});

const realPicturePreviewGridOptions = ref<VxeGridProps<RealPicturePreviewRow>>({
  ...(commonGridOptions as VxeGridProps<RealPicturePreviewRow>),
  rowConfig: {
    ...(commonGridOptions as any).rowConfig,
    keyField: "rowKey",
  },
  checkboxConfig: {
    ...(commonGridOptions as any).checkboxConfig,
    checkMethod: ({ row }: { row: RealPicturePreviewRow }) => isSelectableRealPictureRow(row),
  },
  maxHeight: 780,
  columns: [
    { type: "checkbox", width: 46, fixed: "left" },
    {
      title: "图片",
      field: "imageUrl",
      width: 112,
      align: "center",
      slots: { default: "realPictureImageSlot" },
    },
    {
      title: "商品信息",
      field: "spuId",
      minWidth: 240,
      slots: { default: "realPictureIdentitySlot" },
    },
    {
      title: "异常/规则",
      field: "ruleSummary",
      minWidth: 280,
      slots: { default: "realPictureRulesSlot" },
    },
    {
      title: "上传标注",
      field: "submitStatus",
      minWidth: 180,
      slots: { default: "realPictureUploadMarkSlot" },
    },
    {
      title: "商品名称",
      field: "productName",
      minWidth: 260,
      showOverflow: "tooltip",
    },
    {
      title: "操作",
      field: "operation",
      width: 96,
      fixed: "right",
      align: "right",
      slots: { default: "realPictureOperationSlot" },
    },
  ],
});

const jitPreviewGridOptions = ref<VxeGridProps<JitPreviewRow>>({
  ...(commonGridOptions as VxeGridProps<JitPreviewRow>),
  rowConfig: {
    ...(commonGridOptions as any).rowConfig,
    keyField: "rowKey",
  },
  checkboxConfig: {
    ...(commonGridOptions as any).checkboxConfig,
    checkMethod: ({ row }: { row: JitPreviewRow }) => isSelectableJitRow(row),
  },
  maxHeight: 780,
  columns: [
    { type: "checkbox", width: 46, fixed: "left" },
    {
      title: "商品图",
      field: "imageUrl",
      width: 112,
      align: "center",
      slots: { default: "jitImageSlot" },
    },
    {
      title: "商品信息",
      field: "spuId",
      minWidth: 260,
      slots: { default: "jitIdentitySlot" },
    },
    {
      title: "JIT 状态",
      field: "jitStatusText",
      width: 150,
      slots: { default: "jitStatusSlot" },
    },
    {
      title: "库存状态",
      field: "stockStatusText",
      minWidth: 220,
      slots: { default: "jitStockStatusSlot" },
    },
    {
      title: "商品名称",
      field: "productName",
      minWidth: 260,
      showOverflow: "tooltip",
    },
    {
      title: "类目",
      field: "categoryName",
      minWidth: 180,
      showOverflow: "tooltip",
    },
    {
      title: "处理状态",
      field: "submitStatus",
      minWidth: 180,
      showOverflow: "tooltip",
    },
    {
      title: "操作",
      field: "operation",
      width: 190,
      fixed: "right",
      align: "right",
      slots: { default: "jitOperationSlot" },
    },
  ],
});

const confirmationPreviewGridOptions = ref<VxeGridProps<ConfirmationPreviewRow>>({
  ...(commonGridOptions as VxeGridProps<ConfirmationPreviewRow>),
  maxHeight: 780,
  rowConfig: {
    ...(commonGridOptions as any).rowConfig,
    keyField: "rowKey",
  },
  checkboxConfig: {
    ...(commonGridOptions as any).checkboxConfig,
    checkMethod: ({ row }: { row: ConfirmationPreviewRow }) => !row.confirmed,
  },
  columns: [
    { type: "checkbox", width: 46, fixed: "left" },
    {
      title: "商品图",
      field: "imageUrl",
      width: 112,
      align: "center",
      slots: { default: "confirmationImageSlot" },
    },
    {
      title: "商品信息",
      field: "spuId",
      minWidth: 260,
      slots: { default: "confirmationIdentitySlot" },
    },
    {
      title: "商品名称",
      field: "productName",
      minWidth: 260,
      showOverflow: "tooltip",
    },
    {
      title: "类目",
      field: "categoryName",
      minWidth: 180,
      showOverflow: "tooltip",
    },
    {
      title: "确认状态",
      field: "submitStatus",
      width: 120,
      align: "center",
      slots: { default: "confirmationStatusSlot" },
    },
    {
      title: "创建时间",
      field: "createTime",
      width: 160,
      showOverflow: "tooltip",
    },
    {
      title: "操作",
      field: "operation",
      width: 120,
      fixed: "right",
      align: "right",
      slots: { default: "confirmationOperationSlot" },
    },
  ],
});

const compliancePreviewGridOptions = ref<VxeGridProps<CompliancePreviewRow>>({
  ...(commonGridOptions as VxeGridProps<CompliancePreviewRow>),
  maxHeight: 780,
  rowConfig: {
    ...(commonGridOptions as any).rowConfig,
    keyField: "rowKey",
  },
  checkboxConfig: {
    reserve: true,
  },
  columns: [
    { type: "checkbox", width: 48 },
    {
      title: "商品信息",
      field: "spuId",
      minWidth: 300,
      slots: { default: "complianceIdentitySlot" },
    },
    {
      title: "上传状态",
      field: "statusText",
      minWidth: 320,
      slots: { default: "complianceStatusSlot" },
    },
    {
      title: "商品名称",
      field: "productName",
      minWidth: 280,
      showOverflow: "tooltip",
    },
    {
      title: "操作",
      field: "rowKey",
      width: 96,
      fixed: "right",
      align: "right",
      slots: { default: "complianceActionSlot" },
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
const SIMPLIFIED_ACTION_KEYS = [
  "goods.price-review.list",
  "goods.confirmation.list",
  TEMU_PUBLISH_DETAIL_REQUEST_CAPTURE_ACTION_KEY,
  "goods.real-picture.list",
  "compliance.page-query",
  "jit.list",
];

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

const simplifiedActions = computed(() => {
  const keyword = normalizedSearchKeyword.value;
  const actionMap = new Map<string, TemuWorkspaceAction>();
  catalogGroups.value.forEach((group) => {
    group.actions.forEach((action) => actionMap.set(action.key, action));
  });

  return SIMPLIFIED_ACTION_KEYS.map((key) => actionMap.get(key))
    .filter((action): action is TemuWorkspaceAction => !!action)
    .filter((action) => {
      if (!keyword) {
        return true;
      }
      return [action.label, action.description, action.key]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(keyword));
    });
});
const selectedCategoryActions = computed(() => simplifiedActions.value);
const visibleActions = computed(() => simplifiedActions.value);
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
  } else {
    const preset = ACTION_PRESETS[normalizedKey];
    const defaultState = buildDefaultFormState(preset?.fields || []);
    (preset?.fields || []).forEach((field) => {
      const currentValue = actionWorkspaceStates[normalizedKey].formState[field.key];
      const defaultValue = defaultState[field.key];

      if (currentValue === undefined) {
        actionWorkspaceStates[normalizedKey].formState[field.key] = defaultValue;
      }
    });
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
const formatSignedCurrency = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }
  const amount = Math.abs(value / 100).toFixed(2);
  if (value > 0) {
    return `+¥${amount}`;
  }
  if (value < 0) {
    return `-¥${amount}`;
  }
  return "¥0.00";
};
const formatSignedPercent = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }
  const percent = Math.abs(value * 100).toFixed(2);
  if (value > 0) {
    return `+${percent}%`;
  }
  if (value < 0) {
    return `-${percent}%`;
  }
  return "0.00%";
};
const priceReviewDecisionRanges = [
  {
    max: 0,
    tone: "success" as const,
    text: "建议涨价，可优先核价",
    color: "#15803d",
    textColor: "#14532d",
    softColor: "rgba(22, 163, 74, 0.07)",
    badgeColor: "#ecfdf3",
    borderColor: "rgba(22, 163, 74, 0.42)",
    gradientColor: "rgba(22, 163, 74, 0.08)",
  },
  {
    max: 0.1,
    tone: "success" as const,
    text: "降幅不错，符合标准",
    color: "#16a34a",
    textColor: "#14532d",
    softColor: "rgba(34, 197, 94, 0.06)",
    badgeColor: "#f0fdf4",
    borderColor: "rgba(34, 197, 94, 0.38)",
    gradientColor: "rgba(34, 197, 94, 0.08)",
  },
  {
    max: 0.2,
    tone: "warning" as const,
    text: "降幅可接受，核算空间",
    color: "#b45309",
    textColor: "#78350f",
    softColor: "rgba(202, 138, 4, 0.07)",
    badgeColor: "#fffbeb",
    borderColor: "rgba(202, 138, 4, 0.42)",
    gradientColor: "rgba(202, 138, 4, 0.1)",
  },
  {
    max: 0.3,
    tone: "warning" as const,
    text: "降幅偏高，谨慎核价",
    color: "#c2410c",
    textColor: "#7c2d12",
    softColor: "rgba(249, 115, 22, 0.08)",
    badgeColor: "#fff7ed",
    borderColor: "rgba(249, 115, 22, 0.46)",
    gradientColor: "rgba(249, 115, 22, 0.12)",
  },
  {
    max: 0.5,
    tone: "danger" as const,
    text: "价格较差，强烈复核",
    color: "#b91c1c",
    textColor: "#7f1d1d",
    softColor: "rgba(220, 38, 38, 0.08)",
    badgeColor: "#fef2f2",
    borderColor: "rgba(220, 38, 38, 0.52)",
    gradientColor: "rgba(220, 38, 38, 0.13)",
  },
  {
    max: Infinity,
    tone: "danger" as const,
    text: "极端降价，优先排查",
    color: "#7f1d1d",
    textColor: "#450a0a",
    softColor: "rgba(127, 29, 29, 0.1)",
    badgeColor: "#fecaca",
    borderColor: "rgba(127, 29, 29, 0.62)",
    gradientColor: "rgba(127, 29, 29, 0.2)",
  },
];
const resolvePriceDecision = (changeRatio: number | null) => {
  if (changeRatio === null || !Number.isFinite(changeRatio)) {
    return {
      tone: "neutral" as const,
      text: "缺少当前价",
      style: {
        "--price-review-risk-color": "var(--el-text-color-regular)",
        "--price-review-risk-text": "var(--el-text-color-primary)",
        "--price-review-risk-soft": "rgba(15, 23, 42, 0.06)",
        "--price-review-risk-badge": "var(--el-fill-color-blank)",
        "--price-review-risk-border": "var(--el-border-color-lighter)",
        "--price-review-risk-gradient": "rgba(15, 23, 42, 0.06)",
      },
    };
  }

  const riskRatio = changeRatio >= 0 ? 0 : Math.abs(changeRatio);
  const matchedRange =
    priceReviewDecisionRanges.find((range) => riskRatio <= range.max) ||
    priceReviewDecisionRanges[priceReviewDecisionRanges.length - 1];
  return {
    tone: matchedRange.tone,
    text: matchedRange.text,
    style: {
      "--price-review-risk-color": matchedRange.color,
      "--price-review-risk-text": matchedRange.textColor,
      "--price-review-risk-soft": matchedRange.softColor,
      "--price-review-risk-badge": matchedRange.badgeColor,
      "--price-review-risk-border": matchedRange.borderColor,
      "--price-review-risk-gradient": matchedRange.gradientColor,
    },
  };
};
const firstTextFromArray = (value: any) => {
  if (!Array.isArray(value)) {
    return "";
  }
  return String(value.find((item) => String(item || "").trim()) || "").trim();
};
const firstDisplayValue = (...values: any[]) => {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) {
      return normalized;
    }
  }
  return "";
};
const collectImageUrls = (value: any): string[] => {
  const urls: string[] = [];
  const visit = (current: any) => {
    if (current === undefined || current === null) {
      return;
    }
    if (typeof current === "string") {
      const normalized = current.trim();
      if (/^https?:\/\//i.test(normalized)) {
        urls.push(normalized);
      }
      return;
    }
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (typeof current === "object") {
      ["image", "imageUrl", "image_url", "url", "thumbUrl", "thumb_url"].forEach((key) => visit(current[key]));
    }
  };
  visit(value);
  return Array.from(new Set(urls));
};
const parseImageUrlText = (value: string) =>
  String(value || "")
    .split(/[\n,，\s]+/)
    .map((item) => item.trim())
    .filter((item) => /^https?:\/\//i.test(item));
const toNumberList = (value: any): number[] => {
  const source = Array.isArray(value) ? value : [value];
  return source
    .flatMap((item) => {
      if (Array.isArray(item)) {
        return item;
      }
      if (typeof item === "string") {
        return item.split(/[\n,，\s]+/);
      }
      return [item];
    })
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
};
const resolveRealPictureUploadStatus = (status: any) => {
  const normalized = Number(status);
  if (normalized === 2) {
    return { text: "已上传", tone: "success" as const };
  }
  if (normalized === 1) {
    return { text: "待上传", tone: "warning" as const };
  }
  if (normalized === 3) {
    return { text: "审核中", tone: "info" as const };
  }
  if (normalized === 4) {
    return { text: "异常", tone: "danger" as const };
  }
  return {
    text: Number.isFinite(normalized) ? `状态 ${normalized}` : "-",
    tone: "info" as const,
  };
};
const resolveRealPictureRuleStatusText = (status: any) => {
  const normalized = Number(status);
  if (normalized === 2) {
    return "识别成功";
  }
  if (normalized === 3) {
    return "待建设";
  }
  if (normalized === 4) {
    return "异常";
  }
  return Number.isFinite(normalized) ? `状态${normalized}` : "-";
};
const buildRealPicturePositionImageSummary = (item: Record<string, any>, labelImageList: any[]) => {
  const counts: Record<string, number> = {};
  labelImageList.forEach((image: any) => {
    const position = firstDisplayValue(image?.position, image?.positionType);
    if (!position) {
      return;
    }
    counts[position] = (counts[position] || 0) + 1;
  });

  const positionDetail = asArray<Record<string, any>>(item?.positionDetail || item?.position_detail);
  positionDetail.forEach((detail) => {
    const position = firstDisplayValue(detail?.position);
    if (!position || counts[position]) {
      return;
    }
    const photoList = asArray<Record<string, any>>(detail?.skuPhotoInfoList || detail?.sku_photo_info_list);
    counts[position] = photoList.reduce((sum, photo) => {
      const imageList = asArray(photo?.imageList || photo?.image_list);
      return Math.max(sum, imageList.length);
    }, 0);
  });

  return ["1", "2"]
    .map((position) => `位置${position}:${counts[position] || 0}`)
    .join(" / ");
};
const buildRealPictureRuleStatusSummary = (ruleList: any[]) => {
  if (!ruleList.length) {
    return "-";
  }
  const failedRules = ruleList.filter((rule: any) => Number(rule?.ruleStatus ?? rule?.rule_status) !== 2);
  const source = failedRules.length ? failedRules : ruleList;
  return source
    .slice(0, 3)
    .map((rule: any) => {
      const name = firstDisplayValue(rule?.ruleName, rule?.rule_name, rule?.checkType, rule?.check_type);
      const statusText = firstDisplayValue(
        rule?.ruleStatusToast,
        rule?.rule_status_toast,
        resolveRealPictureRuleStatusText(rule?.ruleStatus ?? rule?.rule_status),
      );
      return `${name}:${statusText}`;
    })
    .join(" / ");
};
const toFiniteNumberOrNull = (value: any) => {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized || normalized === "-") {
      return null;
    }
  }
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
const resolvePriceReviewCompletedLabel = (mark?: PriceReviewSubmitMark) => {
  if (!mark?.markInvalid || mark.status !== "success") {
    return "";
  }
  if (mark.completedLabel) {
    return mark.completedLabel;
  }
  if (mark.action === "confirm") {
    return "已核价";
  }
  if (mark.action === "reprice") {
    return "已重新报价";
  }
  return "已不核价";
};
const isCompletedPriceReviewMark = (mark?: PriceReviewSubmitMark) => !!(mark?.status === "success" && mark.markInvalid);
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
  const persistedMarks = asPlainObject((response as any)?.__priceReviewMarks || result.__priceReviewMarks);
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
          if (suggestPrice === null) {
            return;
          }
          const currentPrice = toFiniteNumberOrNull(review?.supplyPrice);
          const computedPriceDifference =
            suggestPrice !== null && currentPrice !== null ? suggestPrice - currentPrice : null;
          const computedPriceChangeRatio =
            computedPriceDifference !== null && currentPrice !== null && currentPrice > 0
              ? computedPriceDifference / currentPrice
              : null;
          const priceDecision = resolvePriceDecision(computedPriceChangeRatio);
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
          const submitMark =
            priceReviewSubmitMarks[rowKey] ||
            (persistedMarks[rowKey] as PriceReviewSubmitMark);
          const processed = isCompletedPriceReviewMark(submitMark);
          const invalid = isPriceReviewSkuInvalid(sku) || processed;
          const completedLabel = resolvePriceReviewCompletedLabel(submitMark);
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
            priceDifferenceDisplay: formatSignedCurrency(computedPriceDifference),
            priceDifferenceValue: computedPriceDifference,
            priceChangeRatioDisplay: formatSignedPercent(computedPriceChangeRatio),
            priceChangeRatioValue: computedPriceChangeRatio,
            priceDecisionTone: priceDecision.tone,
            priceDecisionText: priceDecision.text,
            priceDecisionStyle: priceDecision.style,
            times: toDisplayText(review?.times),
            processed,
            invalid,
            invalidReason: invalid ? (completedLabel || "已作废") : "",
            submitStatus: submitMark
              ? submitMark.status === "success"
                ? completedLabel || "成功"
                : "失败"
              : "-",
            submitMessage: buildPriceReviewSubmitMessage(submitMark),
          });
        });
      });
    });
  });

  return rows;
};
const buildRealPicturePreviewRows = (
  response?: TemuActionResponse | Record<string, any> | null,
): RealPicturePreviewRow[] => {
  const action = String(response?.action || "").trim();
  if (action !== "goods.real-picture.list") {
    return [];
  }

  const result = asPlainObject(response?.result);
  const items = Array.isArray(result.items) ? result.items : [];
  const persistedMarks = asPlainObject((response as any)?.__realPictureUploadMarks || result.__realPictureUploadMarks);
  return items.map((item: any, index: number) => {
    const skuInfo = Array.isArray(item?.skuInfo)
      ? item.skuInfo
      : Array.isArray(item?.sku_info)
        ? item.sku_info
        : [];
    const ruleList = Array.isArray(item?.ruleCheckResultList)
      ? item.ruleCheckResultList
      : Array.isArray(item?.rule_check_result_list)
        ? item.rule_check_result_list
        : [];
    const labelImageList = Array.isArray(item?.labelImageList)
      ? item.labelImageList
      : Array.isArray(item?.label_image_list)
        ? item.label_image_list
        : [];
    const previewImageUrls = collectImageUrls([
      item?.materialImgUrl,
      item?.material_img_url,
      item?.labelImageList,
      item?.label_image_list,
      item?.skuInfo,
      item?.sku_info,
    ]);
    const ruleSummary = ruleList
      .map((rule: any) =>
        firstDisplayValue(rule?.checkTypeName, rule?.check_type_name, rule?.ruleName, rule?.rule_name, rule?.checkType),
      )
      .filter(Boolean)
      .slice(0, 3)
      .join(" / ");
    const skuSummary = skuInfo
      .map((sku: any) => firstDisplayValue(sku?.skuId, sku?.sku_id))
      .filter(Boolean)
      .slice(0, 4)
      .join(" / ");
    const rowKey = firstDisplayValue(item?.spuId, item?.spu_id, index);
    const persistedMark = asPlainObject(item?.realPictureUploadMark || persistedMarks[rowKey]);
    const mark = (realPictureSubmitMarks[rowKey] || persistedMark) as RealPictureSubmitMark | undefined;
    const rawSkuIdList = toNumberList(
      skuInfo.map((sku: any) => firstDisplayValue(sku?.skuId, sku?.sku_id)),
    );
    const uploadStatus = resolveRealPictureUploadStatus(item?.uploadStatus ?? item?.upload_status);
    const canEdit = item?.canEdit ?? item?.can_edit;
    const editStatusText = canEdit === true ? "可编辑" : canEdit === false ? "不可编辑" : "-";
    const positionImageSummary = buildRealPicturePositionImageSummary(item, labelImageList);
    const ruleStatusSummary = buildRealPictureRuleStatusSummary(ruleList);

    return {
      rowKey,
      imageUrl: previewImageUrls[0] || "-",
      previewImageUrls,
      spuId: toDisplayText(item?.spuId || item?.spu_id),
      goodsId: toDisplayText(item?.goodsId || item?.goods_id),
      rawSpuId: Number(item?.spuId || item?.spu_id || 0),
      rawGoodsId: Number(item?.goodsId || item?.goods_id || 0),
      rawSkuIdList,
      rawIsSameSku: Number(item?.isSameSku || item?.is_same_sku || 0) === 1,
      existingLabelImageList: labelImageList,
      skuSummary: toDisplayText(skuSummary || skuInfo.length),
      isSameSku: Number(item?.isSameSku || item?.is_same_sku || 0) === 1 ? "是" : "否",
      ruleSummary: toDisplayText(ruleSummary),
      statusSummary: `标签图 ${labelImageList.length} / 规则 ${ruleList.length}`,
      productName: toDisplayText(item?.productName || item?.product_name || item?.goodsName || item?.goods_name),
      submitStatus: mark?.status === "success" ? "已上传" : "未知",
      submitMessage: mark?.status === "success"
        ? `${mark.message || "上传成功"}${mark.time ? ` ${mark.time}` : ""}`
        : "-",
      platformStatusText: uploadStatus.text,
      platformStatusTone: uploadStatus.tone,
      editStatusText,
      positionImageSummary,
      ruleStatusSummary,
      raw: item,
    };
  });
};
const resolveJitCategoryName = (item: Record<string, any>) => {
  const fullCategoryName = Array.isArray(item?.fullCategoryName)
    ? item.fullCategoryName.map((name: any) => String(name || "").trim()).filter(Boolean)
    : [];
  return toDisplayText(fullCategoryName.length ? fullCategoryName.join(" / ") : item?.leafCategoryName);
};
const resolveJitImageUrl = (skc: Record<string, any>, item: Record<string, any>) => {
  const skuList = Array.isArray(skc?.skuList) ? skc.skuList : [];
  const skuImage = skuList
    .map((sku: any) => String(sku?.skuPreviewImage || "").trim())
    .find((url: string) => /^https?:\/\//i.test(url));
  return toDisplayText(
    firstTextFromArray(skc?.previewImgUrlList) ||
      skuImage ||
      firstTextFromArray(item?.carouselImageUrlList),
  );
};
const buildJitPreviewRows = (
  response?: TemuActionResponse | Record<string, any> | null,
): JitPreviewRow[] => {
  const action = String(response?.action || "").trim();
  if (action !== "jit.list" && action !== "jit.list-all") {
    return [];
  }

  const result = asPlainObject(response?.result);
  const items = Array.isArray(result.items) ? result.items : [];
  const persistedMarks = asPlainObject((response as any)?.__jitMarks || result.__jitMarks);
  const persistedStockMarks = asPlainObject((response as any)?.__jitStockMarks || result.__jitStockMarks);
  const rows: JitPreviewRow[] = [];
  const seen = new Set<string>();

  items.forEach((item: any, itemIndex: number) => {
    const spuId = Number(item?.productId || item?.spuId || 0);
    const productName = toDisplayText(item?.productName);
    const categoryName = resolveJitCategoryName(item);
    const skcList = Array.isArray(item?.skcList) ? item.skcList : [];
    skcList.forEach((skc: any, skcIndex: number) => {
      const skcId = Number(skc?.skcId || skc?.productSkcId || 0);
      if (!spuId || !skcId) {
        return;
      }
      const rowKey = `${spuId}-${skcId}`;
      if (seen.has(rowKey)) {
        return;
      }
      seen.add(rowKey);
      const persistedMark = persistedMarks[rowKey] as JitSubmitMark | undefined;
      const mark = (jitSubmitMarks[rowKey] || persistedMark) as JitSubmitMark | undefined;
      const persistedStockMark = persistedStockMarks[rowKey] as JitSubmitMark | undefined;
      const stockMark = (jitStockSubmitMarks[rowKey] || persistedStockMark) as JitSubmitMark | undefined;
      const applyJitStatus = toFiniteNumberOrNull(skc?.applyJitStatus);
      const jitOpened = Number(applyJitStatus) === 3 || !!persistedMark?.markOpened;
      const stockMaintained = !!stockMark?.stockMaintained;
      rows.push({
        rowKey,
        imageUrl: resolveJitImageUrl(skc, item),
        spuId: toDisplayText(spuId),
        skcId: toDisplayText(skcId),
        rawSpuId: spuId,
        rawSkcId: skcId,
        applyJitStatus,
        jitOpened,
        jitStatusText: jitOpened ? "已开通 JIT" : "未开通 JIT",
        stockMaintained,
        stockStatusText: stockMaintained ? "已维护库存" : "未维护库存",
        stockSubmitStatus: stockMark ? (stockMark.status === "success" ? "成功" : "失败") : "-",
        stockSubmitMessage: stockMark?.message || "-",
        stockFinalNum: Number.isFinite(Number(stockMark?.finalNum)) ? Number(stockMark?.finalNum) : null,
        skcExtCode: toDisplayText(skc?.extCode),
        productName,
        categoryName,
        submitStatus: mark ? (mark.status === "success" ? "成功" : "失败") : "-",
        submitMessage: mark?.message || "-",
        raw: {
          item,
          skc,
          itemIndex,
          skcIndex,
        },
      });
    });
  });

  return rows;
};
const buildConfirmationPreviewRows = (
  response?: TemuActionResponse | Record<string, any> | null,
): ConfirmationPreviewRow[] => {
  const action = String(response?.action || "").trim();
  if (action !== "goods.confirmation.list") {
    return [];
  }

  const result = asPlainObject(response?.result);
  const items = Array.isArray(result.items) ? result.items : [];
  const rows: ConfirmationPreviewRow[] = [];
  const seen = new Set<string>();

  items.forEach((item: any, itemIndex: number) => {
    const spuId = Number(item?.productId || item?.spuId || 0);
    const rawGoodsId = Number(item?.goodsId || spuId || 0);
    const siteVersion = Number(item?.siteVersion || 10002);
    const productName = toDisplayText(item?.productName);
    const fullCategoryName = String(item?.fullCategoryName || "").trim();
    const leafCategoryName = String(item?.leafCategoryName || "").trim();
    const categoryName = toDisplayText(
      fullCategoryName.length ? fullCategoryName : leafCategoryName,
    );
    const carouselImageUrlList = Array.isArray(item?.carouselImageUrlList) ? item.carouselImageUrlList : [];
    const imageUrl = carouselImageUrlList.length ? String(carouselImageUrlList[0]).trim() : "";
    const createTime = toDisplayText(item?.createTime);
    const skcList = Array.isArray(item?.skcList) ? item.skcList : [];

    skcList.forEach((skc: any, skcIndex: number) => {
      const skcId = Number(skc?.skcId || skc?.productSkcId || 0);
      if (!spuId || !skcId) {
        return;
      }
      const rowKey = `${spuId}-${skcId}`;
      if (seen.has(rowKey)) {
        return;
      }
      seen.add(rowKey);
      const skcImageUrl = Array.isArray(skc?.previewImgUrlList) && skc.previewImgUrlList.length
        ? String(skc.previewImgUrlList[0]).trim()
        : "";
      const goodsSkuIdList = Array.isArray(skc?.productSkuIdList)
        ? skc.productSkuIdList.map(Number).filter(Boolean)
        : [];
      const mark = confirmationSubmitMarks[rowKey];
      const confirmed = mark?.status === "success";
      rows.push({
        rowKey,
        imageUrl: skcImageUrl || imageUrl,
        spuId: toDisplayText(spuId),
        skcId: toDisplayText(skcId),
        rawSpuId: spuId,
        rawSkcId: skcId,
        rawGoodsId,
        siteVersion,
        goodsSkuIdList,
        extCode: toDisplayText(skc?.extCode),
        productName,
        categoryName,
        createTime,
        confirmed,
        submitStatus: mark ? (mark.status === "success" ? "成功" : "失败") : "-",
        submitMessage: mark?.message || "",
        raw: {
          item,
          skc,
          itemIndex,
          skcIndex,
        },
      });
    });
  });

  return rows;
};
const buildCompliancePreviewRows = (
  response?: TemuActionResponse | Record<string, any> | null,
): CompliancePreviewRow[] => {
  const action = String(response?.action || "").trim();
  if (action !== "compliance.page-query") {
    return [];
  }

  const result = asPlainObject(response?.result);
  const items = Array.isArray(result.items) ? result.items : [];
  return items.map((item: any, index: number) => {
    const row = asPlainObject(item);
    const taskGroups = buildComplianceTaskStatusGroups(row);
    const actionableTaskGroups = taskGroups.filter(isActionableComplianceTaskGroup);
    const actionablePendingCount = actionableTaskGroups.length;
    return {
      rowKey: firstDisplayValue(row?.id, row?.orderId, row?.order_id, row?.spuId, row?.spu_id, index),
      spuId: toDisplayText(row?.spuId || row?.spu_id || row?.productId || row?.product_id),
      goodsId: toDisplayText(row?.goodsId || row?.goods_id),
      categoryId: toDisplayText(row?.catId || row?.cat_id),
      categoryName: toDisplayText(row?.catName || row?.cat_name),
      statusText: `${actionablePendingCount} 个待处理`,
      typeText: `${taskGroups.length} 个合规项`,
      productName: toDisplayText(row?.spuName || row?.spu_name || row?.productName || row?.product_name || row?.goodsName || row?.goods_name),
      taskGroups,
      actionableTaskGroups,
      actionablePendingCount,
      raw: row,
    };
  }).filter((row) => row.actionablePendingCount > 0);
};
const getComplianceTaskStatusText = (status: number | null) => {
  if (status === 2) {
    return "待上传";
  }
  if (status === 3) {
    return "上传成功";
  }
  if (status === 5) {
    return "待确认";
  }
  if (status === 10) {
    return "上传中";
  }
  if (status === 11) {
    return "上传失败";
  }
  if (status === 1) {
    return "待处理";
  }
  return status === null ? "未知" : `状态 ${status}`;
};
const getComplianceTaskStatusTagType = (status: number | null): ComplianceTaskStatusGroup["tagType"] => {
  if (status === 2) {
    return "warning";
  }
  if (status === 3) {
    return "success";
  }
  if (status === 5 || status === 10) {
    return "warning";
  }
  if (status === 1) {
    return "info";
  }
  return "danger";
};
const buildComplianceTaskStatusGroups = (row: Record<string, any>): ComplianceTaskStatusGroup[] => {
  const showList = Array.isArray(row?.waitTaskShowDtoList)
    ? row.waitTaskShowDtoList
    : Array.isArray(row?.wait_task_show_dtolist)
      ? row.wait_task_show_dtolist
      : [];
  const fallbackList = Array.isArray(row?.waitTaskDtoList)
    ? row.waitTaskDtoList
    : Array.isArray(row?.wait_task_dtolist)
      ? row.wait_task_dtolist
      : [];
  const sourceList = showList.length ? showList : fallbackList;

  return sourceList.map((task: any, index: number) => {
    const taskRow = asPlainObject(task);
    const statusValue = Number(taskRow?.status);
    const status = Number.isFinite(statusValue) ? statusValue : null;
    const childTasks = Array.isArray(taskRow?.waitTaskDtoList)
      ? taskRow.waitTaskDtoList
      : Array.isArray(taskRow?.wait_task_dtolist)
        ? taskRow.wait_task_dtolist
        : [];
    const needUploadCount = childTasks.filter((child: any) => isActionableComplianceStatus(Number(child?.status))).length;
    const requiredCount = childTasks.filter((child: any) => !child?.is_not_required).length;
    const children = childTasks.map((child: any, childIndex: number) => {
      const childRow = asPlainObject(child);
      const childStatusValue = Number(childRow?.status);
      const childStatus = Number.isFinite(childStatusValue) ? childStatusValue : null;
      return {
        key: firstDisplayValue(childRow?.taskId, childRow?.task_id, childRow?.taskType, childRow?.task_type, childIndex),
        name: toDisplayText(childRow?.taskName || childRow?.task_name),
        taskType: toDisplayText(childRow?.taskType || childRow?.task_type),
        status: childStatus,
        statusText: getComplianceTaskStatusText(childStatus),
        requiredText: childRow?.is_not_required ? "非必填" : "必填",
        tagType: getComplianceTaskStatusTagType(childStatus),
        raw: childRow,
      };
    });

    return {
      key: firstDisplayValue(taskRow?.showName, taskRow?.show_name, taskRow?.taskId, taskRow?.task_id, index),
      name: toDisplayText(taskRow?.showName || taskRow?.show_name || taskRow?.taskName || taskRow?.task_name),
      status,
      statusText: getComplianceTaskStatusText(status),
      requiredText: childTasks.length
        ? `${childTasks.length} 项${needUploadCount ? ` / ${needUploadCount} 待传` : ""}${requiredCount ? ` / ${requiredCount} 必填` : ""}`
        : toDisplayText(taskRow?.taskType || taskRow?.task_type),
      tagType: getComplianceTaskStatusTagType(status),
      raw: taskRow,
      children,
    };
  });
};
const COMPLIANCE_TASK_LABELS: Record<number, string> = {
  3: "加州 65 号提案",
  4: "制造商/进口商信息",
  25: "欧盟负责人",
  33: "型号",
  42: "其他合规信息",
  49: "警告或安全信息（补充）",
  60: "制造商信息",
  61: "商品识别码",
  84: "土耳其负责人",
  121: "其他合规信息",
  181: "其他合规信息",
  186: "其他合规信息",
};
const getComplianceTaskLabel = (taskType: number | string) =>
  COMPLIANCE_TASK_LABELS[Number(taskType)] || `任务 ${toDisplayText(taskType)}`;
const ACTIONABLE_COMPLIANCE_STATUS_SET = new Set([2, 5, 10, 11]);
const isActionableComplianceStatus = (status: number | null) =>
  status !== null && ACTIONABLE_COMPLIANCE_STATUS_SET.has(status);
const isIgnoredComplianceTask = (_taskType: number, _taskName?: string) => false;
const isIgnoredComplianceTaskGroup = (_task: ComplianceTaskStatusGroup) => false;
const isUselessComplianceTaskName = (taskName?: string) =>
  /包装材料信息收集|GCC资质相关信息/.test(String(taskName || ""));
const isUselessComplianceTaskGroup = (task: ComplianceTaskStatusGroup) =>
  isUselessComplianceTaskName(task.name) ||
  task.children.some((child) => isUselessComplianceTaskName(child.name));
const isActionableComplianceTaskGroup = (task: ComplianceTaskStatusGroup) =>
  isActionableComplianceStatus(task.status) ||
  task.children.some((child) => isActionableComplianceStatus(child.status));
const isActionableComplianceRow = (row: CompliancePreviewRow) =>
  row.actionablePendingCount > 0;
const HARDCODED_COMPLIANCE_PROPERTY_VALUES: Record<string, Array<string | number>> = {
  "1000000001": [1000100066],
  "1000100091": [1000131288],
  "1000100110": [1000131288],
  "1000100120": [1000131289],
  "4094": [69448],
  "4095": [69450],
  "4096": [69452],
  "1000100023": [1000130000],
  "1000100056": [1000130368],
  "1000100057": [1000130368],
};
const HARDCODED_COMPLIANCE_TASK_DEFAULT_VALUES: Record<number, Array<string | number>> = {
  4: [1000100066],
  33: [1000131288],
  42: [1000131288],
  49: [1000131289],
  181: [1000295043],
};
const HARDCODED_SECONDARY_COMPLIANCE_TASKS = new Set([121, 181, 186]);
const isComplianceProductIdentifierField = (taskType: number | string, propertyId: number | string) =>
  Number(taskType) === 61 || String(propertyId) === "1100100115";
const DEFAULT_COMPLIANCE_PRODUCT_IDENTIFIER = "1sdesign";
const getComplianceOptionLabel = (option: Record<string, any>) =>
  toDisplayText(
    option?.name ||
      option?.show_name ||
      option?.showName ||
      option?.text ||
      option?.value_name ||
      option?.valueName ||
      option?.propertyValueName ||
      option?.property_value_name ||
      option?.templatePropertyValueName ||
      option?.template_property_value_name ||
      option?.label ||
      option?.value ||
      option?.vid ||
      option?.id,
  );
const getComplianceRepresentativeLabel = (rep: Record<string, any>) => {
  const address = asPlainObject(rep?.rep_address_info || rep?.repAddressInfo);
  return [rep?.rep_name || rep?.repName, address?.region_name || address?.regionName, rep?.rep_mail || rep?.repMail]
    .map((item) => toDisplayText(item))
    .filter((item) => item && item !== "-")
    .join(" / ") || toDisplayText(rep?.rep_id || rep?.repId);
};
const getComplianceOptionValue = (option: Record<string, any>) =>
  firstDisplayValue(
    option?.value_id,
    option?.valueId,
    option?.propertyValueId,
    option?.property_value_id,
    option?.templatePropertyValueId,
    option?.template_property_value_id,
    option?.option_id,
    option?.optionId,
    option?.vid,
    option?.id,
    option?.value,
  );
const complianceSelectableDetailList = computed(() => {
  const payload = asPlainObject(complianceDetailResponse.value?.raw || complianceDetailResponse.value?.result);
  const result = asPlainObject(payload.result || payload);
  return asArray<Record<string, any>>(result.template_list || result.templateList);
});
const extractComplianceFieldOptions = (property: Record<string, any>) => {
  const candidateLists = [
    property?.value_list,
    property?.valueList,
    property?.property_value_dtolist,
    property?.propertyValueDtoList,
    property?.template_property_value_dtolist,
    property?.templatePropertyValueDtoList,
    property?.property_values,
    property?.propertyValues,
    property?.values,
    property?.value_dtolist,
    property?.valueDtoList,
    property?.options,
  ];
  const source = candidateLists.find((list) => Array.isArray(list)) || [];
  return asArray<Record<string, any>>(source)
    .map((option) => ({
      label: getComplianceOptionLabel(asPlainObject(option)),
      value: getComplianceOptionValue(asPlainObject(option)),
    }))
    .filter((option) => option.label !== "-" && option.value !== "-");
};
const buildComplianceSelectableField = (
  task: Record<string, any>,
  taskType: number,
  selectedTaskTypes: Set<number>,
): ComplianceEditorField[] => {
  const taskName = toDisplayText(task?.task_name || task?.taskName);
  if (!selectedTaskTypes.has(taskType) || isIgnoredComplianceTask(taskType, taskName)) {
    return [];
  }

  const repList = asArray<Record<string, any>>(task?.rep_detail_list || task?.repDetailList);
  if (repList.length) {
    return [
      {
        key: `${taskType}:rep_detail`,
        label: getComplianceTaskLabel(taskType),
        propertyId: "rep_detail",
        taskType: String(taskType),
        controlType: "select",
        options: repList.map((rep) => ({
          label: getComplianceRepresentativeLabel(rep),
          value: firstDisplayValue(rep?.rep_id, rep?.repId),
        })),
        defaultValue: firstDisplayValue(repList.find((rep) => rep?.default_select || rep?.defaultSelect)?.rep_id, repList[0]?.rep_id, repList[0]?.repId),
        raw: task,
      },
    ];
  }

  const fields: ComplianceEditorField[] = [];
  const properties = asPlainObject(task?.properties);
  const inputText = asPlainObject(task?.input_text || task?.inputText);
  const propertyEntries = Object.entries(properties);
  const templatePropertyIds = getTemplatePropertyIdsByTaskType(taskType);
  const propertyIds = Array.from(new Set([
    ...propertyEntries.map(([propertyId]) => propertyId),
    ...templatePropertyIds,
  ]));

  propertyIds.forEach((propertyId) => {
    if (Object.prototype.hasOwnProperty.call(inputText, propertyId)) {
      return;
    }
    const valueList = resolveComplianceHardcodedValues(
      taskType,
      propertyId,
      asArray<string | number>(properties[propertyId]),
    );
    if (!valueList.length) {
      return;
    }
    fields.push({
      key: `${taskType}:${propertyId}`,
      label: getComplianceTaskLabel(taskType),
      propertyId,
      taskType: String(taskType),
      controlType: "select",
      options: buildComplianceValueOptions(taskType, propertyId, valueList),
      defaultValue: valueList[0] ?? null,
      disabled: OFFICIAL_SIMPLE_COMPLIANCE_TASK_TYPES.has(taskType),
      raw: task,
    });
  });

  Object.entries(inputText).forEach(([propertyId, input]) => {
    const inputObject = asPlainObject(input);
    const names = asArray<Record<string, any>>(inputObject.multi_line_inputs || inputObject.multiLineInputs)
      .map((item) => firstDisplayValue(item?.name, item?.value))
      .filter((value) => value !== "-");
    fields.push({
      key: `${taskType}:${propertyId}`,
      label: getComplianceTaskLabel(taskType),
      propertyId,
      taskType: String(taskType),
      controlType: "input",
      options: [],
      defaultValue: names[0] ?? DEFAULT_COMPLIANCE_PRODUCT_IDENTIFIER,
      raw: task,
    });
  });

  return fields.filter((field) => field.controlType === "input" || field.options.length);
};
const buildComplianceEditorField = (
  property: Record<string, any>,
  taskType: string,
  index: number,
): ComplianceEditorField | null => {
  const propertyId = firstDisplayValue(
    property?.property_id,
    property?.propertyId,
    property?.id,
    index,
  );
  if (propertyId === "-") {
    return null;
  }

  if (isComplianceProductIdentifierField(taskType, propertyId)) {
    return {
      key: `${taskType}:${propertyId}`,
      label: getComplianceTaskLabel(Number(taskType)),
      propertyId,
      taskType,
      controlType: "input",
      options: [],
      defaultValue: DEFAULT_COMPLIANCE_PRODUCT_IDENTIFIER,
      raw: property,
    };
  }

  return {
    key: `${taskType}:${propertyId}`,
    label: toDisplayText(property?.property_name || property?.propertyName || property?.name || propertyId),
    propertyId,
    taskType,
    controlType: "select",
    options: extractComplianceFieldOptions(property),
    defaultValue: null,
    raw: property,
  };
};
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
const isPriceReviewTaskRunResult = computed(
  () => String(activeTaskRunDetail.value?.result?.action || "").trim() === "goods.price-review.list",
);
const isRealPictureTaskRunResult = computed(
  () => String(activeTaskRunDetail.value?.result?.action || "").trim() === "goods.real-picture.list",
);
const isJitListTaskRunResult = computed(() =>
  ["jit.list", "jit.list-all"].includes(String(activeTaskRunDetail.value?.result?.action || "").trim()),
);
const isComplianceTaskRunResult = computed(
  () => String(activeTaskRunDetail.value?.result?.action || "").trim() === "compliance.page-query",
);
const isConfirmationTaskRunResult = computed(
  () => String(activeTaskRunDetail.value?.result?.action || "").trim() === "goods.confirmation.list",
);
const taskRunPriceReviewRawRows = computed(() =>
  buildPriceReviewPreviewRows(activeTaskRunDetail.value?.result as Record<string, any> | null),
);
const taskRunPriceReviewTotalCount = computed(() => taskRunPriceReviewRawRows.value.length);
const matchPriceReviewRiskFilter = (row: PriceReviewPreviewRow) => {
  const ratio = row.priceChangeRatioValue;
  if (priceReviewRiskFilter.value === "all") {
    return true;
  }
  if (ratio === null || !Number.isFinite(ratio)) {
    return false;
  }
  if (priceReviewRiskFilter.value === "up") {
    return ratio >= 0;
  }
  const discountRatio = Math.abs(ratio);
  if (priceReviewRiskFilter.value === "green") {
    return ratio < 0 && discountRatio <= 0.1;
  }
  if (priceReviewRiskFilter.value === "yellow") {
    return ratio < 0 && discountRatio > 0.1 && discountRatio <= 0.2;
  }
  if (priceReviewRiskFilter.value === "orange") {
    return ratio < 0 && discountRatio > 0.2 && discountRatio <= 0.3;
  }
  if (priceReviewRiskFilter.value === "red") {
    return ratio < 0 && discountRatio > 0.3 && discountRatio <= 0.5;
  }
  return ratio < 0 && discountRatio > 0.5;
};
const matchPriceReviewAmountFilter = (row: PriceReviewPreviewRow) => {
  const minAmount = Number(priceReviewAmountFilterMin.value);
  const maxAmount = Number(priceReviewAmountFilterMax.value);
  if (!Number.isFinite(minAmount) && !Number.isFinite(maxAmount)) {
    return true;
  }

  const difference = row.priceDifferenceValue;
  if (difference === null || !Number.isFinite(difference)) {
    return false;
  }

  const amount = Math.abs(difference);
  if (Number.isFinite(minAmount) && amount < minAmount * 100) {
    return false;
  }
  if (Number.isFinite(maxAmount) && amount > maxAmount * 100) {
    return false;
  }
  return true;
};
const getPriceReviewSortValue = (row: PriceReviewPreviewRow, mode: PriceReviewSortMode) => {
  if (mode === "difference-desc" || mode === "difference-asc") {
    const value = Number(row.priceDifferenceValue);
    return Number.isFinite(value) ? Math.abs(value) : null;
  }
  if (mode === "ratio-desc" || mode === "ratio-asc") {
    const value = Number(row.priceChangeRatioValue);
    return Number.isFinite(value) ? Math.abs(value) : null;
  }
  return null;
};
const sortPriceReviewRows = (rows: PriceReviewPreviewRow[]) => {
  const mode = priceReviewSortMode.value;
  if (mode === "default") {
    return rows;
  }

  const direction = mode.endsWith("-asc") ? 1 : -1;
  return [...rows].sort((left, right) => {
    const leftValue = getPriceReviewSortValue(left, mode);
    const rightValue = getPriceReviewSortValue(right, mode);
    const leftMissing = leftValue === null;
    const rightMissing = rightValue === null;
    if (leftMissing && rightMissing) {
      return 0;
    }
    if (leftMissing) {
      return 1;
    }
    if (rightMissing) {
      return -1;
    }
    return (leftValue - rightValue) * direction;
  });
};
const taskRunPriceReviewPreviewRows = computed(() => {
  const rows = taskRunPriceReviewRawRows.value.filter((row) => {
    if (!matchPriceReviewRiskFilter(row)) {
      return false;
    }
    if (!matchPriceReviewAmountFilter(row)) {
      return false;
    }
    if (priceReviewStatusFilter.value === "pending" && row.processed) {
      return false;
    }
    if (priceReviewStatusFilter.value === "processed" && !row.processed) {
      return false;
    }
    return true;
  });
  return sortPriceReviewRows(rows);
});
const taskRunRealPictureRows = computed(() =>
  buildRealPicturePreviewRows(activeTaskRunDetail.value?.result as Record<string, any> | null),
);
const taskRunRealPictureTotalCount = computed(() => {
  const result = asPlainObject(activeTaskRunDetail.value?.result?.result);
  return Number(result.total || taskRunRealPictureRows.value.length || 0) || 0;
});
const selectedRealPictureRows = computed(() => {
  const selectedKeys = new Set(selectedRealPictureRowKeys.value);
  return taskRunRealPictureRows.value.filter((row) =>
    selectedKeys.has(row.rowKey) && isSelectableRealPictureRow(row),
  );
});
const taskRunJitRawRows = computed(() =>
  buildJitPreviewRows(activeTaskRunDetail.value?.result as Record<string, any> | null),
);
const taskRunJitRows = computed(() =>
  taskRunJitRawRows.value.filter((row) => {
    if (jitOpenStatusFilter.value === "opened") {
      if (!row.jitOpened) {
        return false;
      }
    }
    if (jitOpenStatusFilter.value === "pending") {
      if (row.jitOpened) {
        return false;
      }
    }
    if (jitStockStatusFilter.value === "maintained") {
      return row.stockMaintained;
    }
    if (jitStockStatusFilter.value === "pending") {
      return !row.stockMaintained;
    }
    return true;
  }),
);
const taskRunJitTotalCount = computed(() => {
  const result = asPlainObject(activeTaskRunDetail.value?.result?.result);
  return Number(result.total || taskRunJitRawRows.value.length || 0) || 0;
});
const selectedJitRows = computed(() => {
  const selectedKeys = new Set(selectedJitRowKeys.value);
  return taskRunJitRows.value.filter((row) => selectedKeys.has(row.rowKey) && isSelectableJitRow(row));
});
const selectedOpenableJitRows = computed(() => selectedJitRows.value.filter((row) => isOpenableJitRow(row)));
const selectedStockMaintainableJitRows = computed(() =>
  selectedJitRows.value.filter((row) => isStockMaintainableJitRow(row)),
);
const taskRunConfirmationRows = computed(() =>
  buildConfirmationPreviewRows(activeTaskRunDetail.value?.result as Record<string, any> | null),
);
const taskRunConfirmationTotalCount = computed(() => {
  const result = asPlainObject(activeTaskRunDetail.value?.result?.result);
  return Number(result.total || taskRunConfirmationRows.value.length || 0) || 0;
});
const unconfirmedConfirmationRows = computed(() =>
  taskRunConfirmationRows.value.filter((row) => !row.confirmed),
);
const selectedConfirmationRows = computed(() => {
  const selectedKeys = new Set(selectedConfirmationRowKeys.value);
  return taskRunConfirmationRows.value.filter((row) => selectedKeys.has(row.rowKey) && !row.confirmed);
});
const confirmationBatchProgressText = computed(() => {
  if (!confirmationBatchSubmitting.value || confirmationBatchTotalCount.value <= 0) {
    return "";
  }
  return `处理中 ${confirmationBatchFinishedCount.value}/${confirmationBatchTotalCount.value}`;
});
const confirmationBatchProgressPercent = computed(() => {
  if (confirmationBatchTotalCount.value <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((confirmationBatchFinishedCount.value / confirmationBatchTotalCount.value) * 100));
});
const confirmationBatchRemainingCount = computed(() =>
  Math.max(0, confirmationBatchTotalCount.value - confirmationBatchFinishedCount.value),
);
const taskRunComplianceRows = computed(() =>
  buildCompliancePreviewRows(activeTaskRunDetail.value?.result as Record<string, any> | null),
);
const visibleTaskRunComplianceRows = computed(() => {
  if (!complianceIgnoreUselessInfo.value) {
    return taskRunComplianceRows.value;
  }
  return taskRunComplianceRows.value
    .map((row) => {
      const taskGroups = row.taskGroups.filter((task) => !isUselessComplianceTaskGroup(task));
      const actionableTaskGroups = taskGroups.filter(isActionableComplianceTaskGroup);
      return {
        ...row,
        taskGroups,
        actionableTaskGroups,
        actionablePendingCount: actionableTaskGroups.length,
        statusText: `${actionableTaskGroups.length} 个待处理`,
        typeText: `${taskGroups.length} 个合规项`,
      };
    })
    .filter((row) => row.actionablePendingCount > 0);
});
const taskRunComplianceTotalCount = computed(() => {
  const result = asPlainObject(activeTaskRunDetail.value?.result?.result);
  return Number(result.total || taskRunComplianceRows.value.length || 0) || 0;
});
const taskRunComplianceFilteredCount = computed(() =>
  Math.max(0, taskRunComplianceTotalCount.value - visibleTaskRunComplianceRows.value.length),
);
const selectedComplianceRows = computed(() => {
  const selectedKeys = new Set(selectedComplianceRowKeys.value);
  return visibleTaskRunComplianceRows.value.filter((row) =>
    selectedKeys.has(row.rowKey) && isActionableComplianceRow(row),
  );
});
const complianceBatchProgressText = computed(() => {
  if (!complianceBatchSubmitting.value || complianceBatchTotalCount.value <= 0) {
    return "";
  }
  return `处理中 ${complianceBatchFinishedCount.value}/${complianceBatchTotalCount.value}`;
});
const complianceBatchRemainingCount = computed(() =>
  Math.max(0, complianceBatchTotalCount.value - complianceBatchFinishedCount.value),
);
const complianceBatchProgressPercent = computed(() => {
  if (complianceBatchTotalCount.value <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((complianceBatchFinishedCount.value / complianceBatchTotalCount.value) * 100));
});
const realPictureBatchProgressText = computed(() => {
  if (!realPictureBatchSubmitting.value || realPictureBatchTotalCount.value <= 0) {
    return "";
  }
  return `处理中 ${realPictureBatchFinishedCount.value}/${realPictureBatchTotalCount.value}`;
});
const realPictureBatchRemainingCount = computed(() =>
  Math.max(0, realPictureBatchTotalCount.value - realPictureBatchFinishedCount.value),
);
const realPictureBatchProgressPercent = computed(() => {
  if (realPictureBatchTotalCount.value <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((realPictureBatchFinishedCount.value / realPictureBatchTotalCount.value) * 100));
});
const jitBatchProgressText = computed(() => {
  if (!jitBatchSubmitting.value || jitBatchTotalCount.value <= 0) {
    return "";
  }
  return `处理中 ${jitBatchFinishedCount.value}/${jitBatchTotalCount.value}`;
});
const jitBatchRemainingCount = computed(() =>
  Math.max(0, jitBatchTotalCount.value - jitBatchFinishedCount.value),
);
const jitBatchProgressPercent = computed(() => {
  if (jitBatchTotalCount.value <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((jitBatchFinishedCount.value / jitBatchTotalCount.value) * 100));
});
const complianceEditorTaskGroups = computed(() => activeComplianceRow.value?.taskGroups || []);
const visibleComplianceEditorTaskGroups = computed(() =>
  complianceEditorTaskGroups.value.filter((task) => {
    const taskTypes = [
      Number(task.raw?.task_type || task.raw?.taskType),
      ...task.children.map((child) => Number(child.raw?.task_type || child.raw?.taskType || child.taskType)),
    ].filter((taskType) => Number.isFinite(taskType));
    return !taskTypes.some((taskType) => isIgnoredComplianceTask(taskType, task.name));
  }),
);
const selectedComplianceTask = computed(() =>
  visibleComplianceEditorTaskGroups.value.find((task) => task.key === selectedComplianceTaskKey.value) ||
  visibleComplianceEditorTaskGroups.value[0] ||
  null,
);
const complianceTemplateSummary = computed(() => {
  const payload = asPlainObject(complianceTemplateResponse.value?.raw || complianceTemplateResponse.value?.result);
  const result = asPlainObject(payload.result || payload);
  const templateList = asArray(result.template_list);
  return templateList.length ? `${templateList.length} 个模板项` : "-";
});
const complianceDetailSummary = computed(() => {
  const payload = asPlainObject(complianceDetailResponse.value?.raw || complianceDetailResponse.value?.result);
  const result = asPlainObject(payload.result || payload);
  const templateList = asArray(result.template_list);
  return templateList.length ? `${templateList.length} 个已有值项` : "-";
});
const complianceTemplateList = computed(() => {
  const payload = asPlainObject(complianceTemplateResponse.value?.raw || complianceTemplateResponse.value?.result);
  const result = asPlainObject(payload.result || payload);
  return asArray<Record<string, any>>(result.template_list);
});
const findComplianceTemplateProperty = (taskType: number | string, propertyId: string) => {
  const template = complianceTemplateList.value.find(
    (item) => Number(item?.task_type || item?.taskType) === Number(taskType),
  );
  return asArray<Record<string, any>>(template?.template_property_dtolist || template?.templatePropertyDtoList)
    .find((property) =>
      String(firstDisplayValue(property?.property_id, property?.propertyId, property?.id)) === String(propertyId),
    );
};
const buildComplianceValueOptions = (
  taskType: number,
  propertyId: string,
  values: Array<string | number>,
) => {
  const templateProperty = findComplianceTemplateProperty(taskType, propertyId);
  const templateOptions = templateProperty ? extractComplianceFieldOptions(templateProperty) : [];
  return values.map((value) => {
    const matched = templateOptions.find((option) => String(option.value) === String(value));
    return {
      label: matched?.label && matched.label !== "-" ? matched.label : String(value),
      value,
    };
  });
};
const getKoreaDisclosureTaskTypes = () => {
  const row = activeComplianceRow.value?.raw || {};
  const showList = asArray<Record<string, any>>(row.wait_task_show_dtolist || row.waitTaskShowDtoList);
  const koreaGroup = showList.find((task) =>
    String(task?.show_name || task?.showName || task?.task_name || task?.taskName || "").includes("韩国公示信息"),
  );
  return new Set(
    asArray<Record<string, any>>(koreaGroup?.wait_task_dtolist || koreaGroup?.waitTaskDtoList)
      .map((task) => Number(task?.task_type || task?.taskType))
      .filter((taskType) => Number.isFinite(taskType)),
  );
};
const resolveComplianceHardcodedValues = (
  taskType: number,
  propertyId: string,
  fallbackValues: Array<string | number> = [],
) => {
  if (taskType === 3) {
    return fallbackValues;
  }
  const propertyValues = HARDCODED_COMPLIANCE_PROPERTY_VALUES[propertyId];
  if (propertyValues?.length) {
    return propertyValues;
  }
  if (getKoreaDisclosureTaskTypes().has(taskType)) {
    return HARDCODED_COMPLIANCE_TASK_DEFAULT_VALUES[taskType] || fallbackValues;
  }
  return fallbackValues;
};
const getTemplatePropertyIdsByTaskType = (taskType: number) => {
  const template = complianceTemplateList.value.find(
    (item) => Number(item?.task_type || item?.taskType) === Number(taskType),
  );
  return asArray<Record<string, any>>(template?.template_property_dtolist || template?.templatePropertyDtoList)
    .map((property) => firstDisplayValue(property?.property_id, property?.propertyId, property?.id))
    .filter((propertyId) => propertyId !== "-");
};
const mergeComplianceFields = (fields: ComplianceEditorField[]) => {
  const fieldMap = new Map<string, ComplianceEditorField>();
  fields.forEach((field) => {
    if (!fieldMap.has(field.key)) {
      fieldMap.set(field.key, field);
    }
  });
  return Array.from(fieldMap.values());
};
const selectedComplianceFields = computed<ComplianceEditorField[]>(() => {
  const taskTypes = new Set<number>(
    [
      Number(selectedComplianceTask.value?.raw?.task_type || selectedComplianceTask.value?.raw?.taskType),
      ...(selectedComplianceTask.value?.children || []).map((child) =>
        Number(child.raw?.task_type || child.raw?.taskType || child.taskType),
      ),
    ].filter((taskType) => Number.isFinite(taskType)),
  );
  const detailFields = complianceSelectableDetailList.value.flatMap((task) =>
    buildComplianceSelectableField(task, Number(task?.task_type || task?.taskType), taskTypes),
  );

  const templates = complianceTemplateList.value.filter((template) =>
    taskTypes.has(Number(template?.task_type || template?.taskType)),
  );
  const templateFields = templates.flatMap((template) => {
    const taskType = Number(template?.task_type || template?.taskType);
    return asArray<Record<string, any>>(template?.template_property_dtolist || template?.templatePropertyDtoList)
      .map((property, index) => {
        const propertyId = firstDisplayValue(property?.property_id, property?.propertyId, property?.id, index);
        if (isComplianceProductIdentifierField(taskType, propertyId)) {
          return buildComplianceEditorField(property, String(taskType), index);
        }
        if (taskType === 3) {
          const options = extractComplianceFieldOptions(property);
          return {
            key: `${taskType}:${propertyId}`,
            label: getComplianceTaskLabel(taskType),
            propertyId,
            taskType: String(taskType),
            controlType: "select" as const,
            options,
            defaultValue: options[0]?.value ?? null,
            raw: property,
          };
        }
        const hardcodedValues = resolveComplianceHardcodedValues(taskType, propertyId);
        if (hardcodedValues.length) {
          return {
            key: `${taskType}:${propertyId}`,
            label: getComplianceTaskLabel(taskType),
            propertyId,
            taskType: String(taskType),
            controlType: "select" as const,
            options: buildComplianceValueOptions(taskType, propertyId, hardcodedValues),
            defaultValue: hardcodedValues[0] ?? null,
            disabled: OFFICIAL_SIMPLE_COMPLIANCE_TASK_TYPES.has(taskType),
            raw: property,
          };
        }
        return buildComplianceEditorField(property, String(taskType), index);
      })
      .filter((field): field is ComplianceEditorField => !!field);
  });
  return mergeComplianceFields([...detailFields, ...templateFields]);
});
const selectedPriceReviewRows = computed(() => {
  const selectedKeys = new Set(selectedPriceReviewRowKeys.value);
  return taskRunPriceReviewPreviewRows.value.filter((row) => selectedKeys.has(row.rowKey));
});
const selectedSubmittablePriceReviewRows = computed(() =>
  selectedPriceReviewRows.value.filter((row) => canSubmitPriceReviewRow(row) && isSelectablePriceReviewRow(row)),
);
const selectedRepriceablePriceReviewRows = computed(() =>
  selectedPriceReviewRows.value.filter((row) => canRepricePriceReviewRow(row) && isSelectablePriceReviewRow(row)),
);
const selectedAbandonablePriceReviewRows = computed(() =>
  selectedPriceReviewRows.value.filter((row) => !!row.rawPriceOrderId && isSelectablePriceReviewRow(row)),
);
const isPriceReviewBatchAvailable = computed(() =>
  taskRunPriceReviewPreviewRows.value.some((row) => isSelectablePriceReviewRow(row)),
);
const priceReviewBatchProgressText = computed(() => {
  if (!priceReviewBatchSubmitting.value || priceReviewBatchTotalCount.value <= 0) {
    return "";
  }
  return `处理中 ${priceReviewBatchFinishedCount.value}/${priceReviewBatchTotalCount.value}`;
});
const priceReviewBatchActionText = computed(() => {
  if (priceReviewBatchSubmittingMode.value === "confirm") {
    return "批量确认核价";
  }
  if (priceReviewBatchSubmittingMode.value === "abandon") {
    return "批量不核价";
  }
  if (priceReviewBatchSubmittingMode.value === "reprice") {
    return "批量重新报价";
  }
  return "批量处理中";
});
const priceReviewBatchRemainingCount = computed(() =>
  Math.max(0, priceReviewBatchTotalCount.value - priceReviewBatchFinishedCount.value),
);
const priceReviewBatchProgressPercent = computed(() => {
  if (priceReviewBatchTotalCount.value <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((priceReviewBatchFinishedCount.value / priceReviewBatchTotalCount.value) * 100));
});
const resetPriceReviewBatchProgress = (
  mode: "confirm" | "abandon" | "reprice",
  total: number,
) => {
  priceReviewBatchSubmitting.value = true;
  priceReviewBatchSubmittingMode.value = mode;
  priceReviewBatchCurrentStage.value = "";
  priceReviewBatchCurrentRowText.value = "";
  priceReviewBatchFinishedCount.value = 0;
  priceReviewBatchTotalCount.value = total;
  priceReviewBatchSuccessCount.value = 0;
  priceReviewBatchFailedCount.value = 0;
};
const setPriceReviewBatchCurrent = (stage: string, row?: PriceReviewPreviewRow | null) => {
  priceReviewBatchCurrentStage.value = stage;
  priceReviewBatchCurrentRowText.value = row ? `SKU ${row.skuId} / SPU ${row.spuId}` : "";
};
const liveFloatingBatchProgressItems = computed<TemuBatchProgressItem[]>(() => {
  const items: TemuBatchProgressItem[] = [];

  if (priceReviewBatchSubmitting.value) {
    items.push({
      key: "price-review",
      title: priceReviewBatchActionText.value,
      progressText: priceReviewBatchProgressText.value,
      percent: priceReviewBatchProgressPercent.value,
      rowText: priceReviewBatchCurrentRowText.value,
      stage: priceReviewBatchCurrentStage.value,
      successCount: priceReviewBatchSuccessCount.value,
      failedCount: priceReviewBatchFailedCount.value,
      remainingCount: priceReviewBatchRemainingCount.value,
    });
  }

  if (jitBatchSubmitting.value) {
    items.push({
      key: "jit",
      title: jitBatchModeLabel.value,
      progressText: jitBatchProgressText.value,
      percent: jitBatchProgressPercent.value,
      rowText: jitBatchCurrentRowText.value,
      stage: jitBatchCurrentStage.value,
      successCount: jitBatchSuccessCount.value,
      failedCount: jitBatchFailedCount.value,
      remainingCount: jitBatchRemainingCount.value,
    });
  }

  if (realPictureBatchSubmitting.value) {
    items.push({
      key: "real-picture",
      title: "批量上传实拍图",
      progressText: realPictureBatchProgressText.value,
      percent: realPictureBatchProgressPercent.value,
      successCount: realPictureBatchSuccessCount.value,
      failedCount: realPictureBatchFailedCount.value,
      remainingCount: realPictureBatchRemainingCount.value,
    });
  }

  if (complianceBatchSubmitting.value) {
    items.push({
      key: "compliance",
      title: "批量处理合规",
      progressText: complianceBatchProgressText.value,
      percent: complianceBatchProgressPercent.value,
      successCount: complianceBatchSuccessCount.value,
      failedCount: complianceBatchFailedCount.value,
      remainingCount: complianceBatchRemainingCount.value,
    });
  }

  if (confirmationBatchSubmitting.value) {
    items.push({
      key: "confirmation",
      title: "批量确认商品",
      progressText: confirmationBatchProgressText.value,
      percent: confirmationBatchProgressPercent.value,
      successCount: confirmationBatchSuccessCount.value,
      failedCount: confirmationBatchFailedCount.value,
      remainingCount: confirmationBatchRemainingCount.value,
    });
  }

  return items;
});
const floatingBatchProgressItems = computed<TemuBatchProgressItem[]>(() =>
  liveFloatingBatchProgressItems.value.length
    ? liveFloatingBatchProgressItems.value
    : persistedFloatingBatchProgressItems.value,
);
const floatingProgressTitle = computed(() =>
  floatingBatchProgressItems.value.length > 1
    ? `批量任务 ${floatingBatchProgressItems.value.length} 个`
    : floatingBatchProgressItems.value[0]?.title || "批量任务",
);
const floatingProgressSummary = computed(() => {
  const items = floatingBatchProgressItems.value;
  const totalRemaining = items.reduce((sum, item) => sum + item.remainingCount, 0);
  const totalSuccess = items.reduce((sum, item) => sum + item.successCount, 0);
  const totalFailed = items.reduce((sum, item) => sum + item.failedCount, 0);
  return `成功 ${totalSuccess} / 失败 ${totalFailed} / 剩余 ${totalRemaining}`;
});
let batchProgressSyncTimer: number | null = null;
const syncFloatingBatchProgressToServer = () => {
  if (!liveFloatingBatchProgressItems.value.length || batchProgressSyncTimer !== null) {
    return;
  }
  batchProgressSyncTimer = window.setTimeout(async () => {
    batchProgressSyncTimer = null;
    batchProgressSyncing.value = true;
    try {
      const response = await updateTemuBatchProgress({
        profileId: props.profileId,
        items: liveFloatingBatchProgressItems.value,
      });
      persistedFloatingBatchProgressItems.value = response?.items || [];
    } catch (error) {
      console.warn("同步批量进度失败", error);
    } finally {
      batchProgressSyncing.value = false;
    }
  }, 250);
};
const loadFloatingBatchProgressFromServer = async () => {
  try {
    const response = await getTemuBatchProgress(props.profileId);
    persistedFloatingBatchProgressItems.value = response?.items || [];
  } catch (error) {
    console.warn("获取批量进度失败", error);
  }
};
const stopLiveBatchProgress = () => {
  priceReviewBatchSubmitting.value = false;
  priceReviewBatchSubmittingMode.value = "";
  priceReviewBatchCurrentStage.value = "";
  priceReviewBatchCurrentRowText.value = "";
  jitBatchSubmitting.value = false;
  jitBatchCurrentStage.value = "";
  jitBatchCurrentRowText.value = "";
  realPictureBatchSubmitting.value = false;
  complianceBatchSubmitting.value = false;
  complianceBatchMode.value = false;
};
const clearFloatingBatchProgress = async () => {
  batchAbortToken.value += 1;
  stopLiveBatchProgress();
  persistedFloatingBatchProgressItems.value = [];
  try {
    await clearTemuBatchProgress(props.profileId);
    ElMessage.success("已清理批量进度，并终止当前页面批量循环");
  } catch (error: any) {
    ElMessage.error(extractRequestErrorMessage(error, "清理批量进度失败"));
  }
};
const clearFloatingBatchProgressSilently = async () => {
  persistedFloatingBatchProgressItems.value = [];
  try {
    await clearTemuBatchProgress(props.profileId);
  } catch (error) {
    console.warn("清理批量进度失败", error);
  }
};
const shouldAbortBatch = (token: number) => token !== batchAbortToken.value;
const withPriceReviewRowTimeout = async <T,>(
  promise: Promise<T>,
  context: {
    row: PriceReviewPreviewRow;
    mode: "confirm" | "abandon" | "reprice";
    index?: number;
    total?: number;
    stage: string;
    timeoutMs?: number;
    ownerRunId?: number;
  },
) => {
  const timeoutMs = context.timeoutMs || PRICE_REVIEW_ROW_TIMEOUT_MS;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          const positionText =
            context.index && context.total ? `第 ${context.index}/${context.total} 条` : "当前行";
          reject(
            new Error(
              `${positionText}核价在「${context.stage}」阶段超过 ${Math.round(timeoutMs / 1000)} 秒未返回`,
            ),
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};
const drainPriceReviewMarkQueue = () => {
  while (
    priceReviewMarkRunningCount < PRICE_REVIEW_MARK_CONCURRENCY &&
    priceReviewMarkQueue.length
  ) {
    const task = priceReviewMarkQueue.shift();
    if (!task) {
      continue;
    }
    priceReviewMarkRunningCount += 1;
    void task()
      .catch((error) => {
        console.warn("核价状态持久化失败", error);
      })
      .finally(() => {
        priceReviewMarkRunningCount = Math.max(0, priceReviewMarkRunningCount - 1);
        drainPriceReviewMarkQueue();
      });
  }
};
const enqueuePriceReviewMark = (task: () => Promise<void>) => {
  priceReviewMarkQueue.push(task);
  drainPriceReviewMarkQueue();
};
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

  return !!(props.clientId && props.profileId && hasUsableSession.value && selectedAction.value.endpoint);
});
const runButtonLabel = computed(() => {
  if (!props.clientId) {
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

const unwrapTemuApiPayload = <T = any,>(value: any): T => {
  let current = value;
  for (let index = 0; index < 3; index += 1) {
    if (
      current &&
      typeof current === "object" &&
      !Array.isArray(current) &&
      "data" in current &&
      !("action" in current) &&
      !("id" in current)
    ) {
      current = current.data;
      continue;
    }
    break;
  }
  return current as T;
};

const normalizeTemuActionResponse = <TResult = Record<string, any>>(
  value: any,
): TemuActionResponse<TResult> => {
  const unwrapped = unwrapTemuApiPayload<any>(value);
  const nestedResult = unwrapTemuApiPayload<any>(unwrapped?.result);
  if (nestedResult && typeof nestedResult === "object" && "success" in nestedResult) {
    return nestedResult as TemuActionResponse<TResult>;
  }
  return unwrapped as TemuActionResponse<TResult>;
};

const normalizeTemuTaskRunDetail = (value: any): TemuTaskRunDetail | null =>
  unwrapTemuApiPayload<TemuTaskRunDetail | null>(value);

const resetTaskRunDetailDialogState = () => {
  selectedPriceReviewRowKeys.value = [];
  selectedJitRowKeys.value = [];
  selectedRealPictureRowKeys.value = [];
  selectedComplianceRowKeys.value = [];
  selectedConfirmationRowKeys.value = [];
  priceReviewPreviewGridRef.value?.clearCheckboxRow?.();
  jitPreviewGridRef.value?.clearCheckboxRow?.();
  realPicturePreviewGridRef.value?.clearCheckboxRow?.();
  confirmationPreviewGridRef.value?.clearCheckboxRow?.();
  realPictureUploadRows.value = [];
  realPictureUploadVisible.value = false;
  complianceEditorVisible.value = false;
  complianceBatchMode.value = false;
  complianceBatchRows.value = [];
  activeComplianceRow.value = null;
  selectedComplianceTaskKey.value = "";
  complianceDetailResponse.value = null;
  complianceTemplateResponse.value = null;
  Object.keys(complianceEditorForm).forEach((key) => {
    delete complianceEditorForm[key];
  });
};

const applyTaskRunDetailIfCurrent = (
  detail?: TemuTaskRunDetail | null,
  expectedId?: number | null,
  options: { preserveResult?: boolean } = {},
) => {
  const detailId = Number(detail?.id || 0) || null;
  const targetId = Number(expectedId || detailId || 0) || null;
  if (!detail || !targetId || activeTaskRunId.value !== targetId) {
    return false;
  }

  const previousDetail = activeTaskRunDetail.value;
  const nextDetail =
    options.preserveResult && previousDetail?.id === targetId
      ? {
          ...previousDetail,
          ...detail,
          params: detail.params ?? previousDetail.params,
          result: detail.result ?? previousDetail.result,
          logs: Array.isArray(detail.logs) ? detail.logs : previousDetail.logs,
        }
      : detail;

  activeTaskRunDetail.value = nextDetail;
  syncTaskRunResultToWorkspace(nextDetail);
  return true;
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

const loadTaskRunDetail = async (
  id: number,
  options: {
    silent?: boolean;
    light?: boolean;
  } = {},
) => {
  if (!id) {
    taskRunDetailRequestSeq.value += 1;
    activeTaskRunId.value = null;
    activeTaskRunDetail.value = null;
    return null;
  }

  const requestSeq = ++taskRunDetailRequestSeq.value;
  if (!options.silent) {
    taskRunDetailLoading.value = true;
  }

  try {
    const detail = normalizeTemuTaskRunDetail(
      await getTemuTaskRun(
        id,
        options.light
          ? {
              includeParams: false,
              includeResult: false,
              includeLogs: true,
            }
          : undefined,
      ),
    );
    if (requestSeq !== taskRunDetailRequestSeq.value || activeTaskRunId.value !== id) {
      return null;
    }
    activeTaskRunId.value = detail?.id ? Number(detail.id) : null;
    applyTaskRunDetailIfCurrent(detail, id, { preserveResult: options.light });
    return detail;
  } catch (error: any) {
    if (!options.silent) {
      ElMessage.error(extractRequestErrorMessage(error, "获取执行记录详情失败"));
    }
    return null;
  } finally {
    if (!options.silent && requestSeq === taskRunDetailRequestSeq.value) {
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
      const summary = taskRunList.value.find((item) => item.id === activeTaskRunId.value);
      const summaryStatus = String(summary?.status || "").trim();
      const light = ["queued", "running"].includes(summaryStatus);
      await loadTaskRunDetail(activeTaskRunId.value, { silent: true, light });
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

  resetTaskRunDetailDialogState();
  activeTaskRunId.value = id;
  activeTaskRunDetail.value = null;
  taskRunDetailVisible.value = true;
  await loadTaskRunDetail(id);
};

const refreshTaskRuns = async () => {
  await loadTaskRuns();
};

const resetPriceReviewFilters = () => {
  priceReviewRiskFilter.value = "all";
  priceReviewStatusFilter.value = "all";
  priceReviewSortMode.value = "default";
  priceReviewAmountFilterMin.value = undefined;
  priceReviewAmountFilterMax.value = undefined;
};

const parsePriceYuanToCent = (value: any) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null;
  }
  return Math.round(numericValue * 100);
};
const formatPriceCentToYuanNumber = (value: number | null) => Math.max(0, Number(value || 0) - 1) / 100;

const canSubmitPriceReviewRow = (row?: PriceReviewPreviewRow | null) =>
  !!(row?.rawPriceOrderId && row.rawSkuId && row.rawSuggestPrice !== null);
const canRepricePriceReviewRow = (row?: PriceReviewPreviewRow | null) =>
  !!(row?.rawPriceOrderId && row.rawSkuId && row.rawCurrentPrice !== null);
const isSelectablePriceReviewRow = (row?: PriceReviewPreviewRow | null) => !!row && !row.invalid && !row.processed;
const isOpenableJitRow = (row?: JitPreviewRow | null) => !!(row?.rawSkcId && row.rawSpuId && !row.jitOpened);
const isStockMaintainableJitRow = (row?: JitPreviewRow | null) =>
  !!(row?.rawSkcId && row.rawSpuId && row.jitOpened && !row.stockMaintained);
const isSelectableJitRow = (row?: JitPreviewRow | null) =>
  isOpenableJitRow(row) || isStockMaintainableJitRow(row);
const isSelectableRealPictureRow = (row?: RealPicturePreviewRow | null) =>
  !!(row?.rawSpuId && row.rawGoodsId && row.rawSkuIdList.length);

const buildJitOpenPayload = (rows: JitPreviewRow[]) => ({
  profileId: props.profileId,
  region: String(activeTaskRunDetail.value?.region || activeActionResult.value?.region || "global"),
  skcSpuList: rows.map((row) => ({
    skcId: row.rawSkcId,
    spuId: row.rawSpuId,
  })),
});

const requireTemuClientContext = () => {
  if (!props.clientId) {
    ElMessage.warning("请先选择在线客户端");
    return false;
  }
  if (!props.profileId) {
    ElMessage.warning("请先选择执行环境");
    return false;
  }
  if (!hasUsableSession.value) {
    ElMessage.warning("请先采集或选择一个已存储的 Temu 会话");
    return false;
  }
  return true;
};

const buildClientTaskPayload = (payload: Record<string, any>) => ({
  ...payload,
  clientId: props.clientId,
});

const runTemuClientAction = <TResult = Record<string, any>>(
  actionKey: string,
  payload: Record<string, any>,
  timeoutMs?: number,
) => {
  const region = String(payload?.region || activeTaskRunDetail.value?.region || activeActionResult.value?.region || "global");
  return executeTemuClientAction<TResult>({
    clientId: String(props.clientId || ""),
    actionKey,
    profileId: String(payload?.profileId || props.profileId || ""),
    region,
    timeoutMs,
    payload: {
      ...payload,
      profileId: String(payload?.profileId || props.profileId || ""),
      region,
    },
  });
};

const buildJitStockPayload = (row: JitPreviewRow) => ({
  profileId: props.profileId,
  region: String(activeTaskRunDetail.value?.region || activeActionResult.value?.region || "global"),
  skcId: row.rawSkcId,
  finalNum: Math.max(0, Number(jitStockFinalNum.value || 0) || 0),
});

const resetJitBatchProgress = (label: string, total: number) => {
  jitBatchSubmitting.value = true;
  jitBatchModeLabel.value = label;
  jitBatchCurrentStage.value = "";
  jitBatchCurrentRowText.value = "";
  jitBatchFinishedCount.value = 0;
  jitBatchTotalCount.value = total;
  jitBatchSuccessCount.value = 0;
  jitBatchFailedCount.value = 0;
};

const setJitBatchCurrent = (stage: string, row?: JitPreviewRow | null) => {
  jitBatchCurrentStage.value = stage;
  jitBatchCurrentRowText.value = row ? `SPU ${row.spuId} / SKC ${row.skcId}` : "";
};

const buildJitStockSuccessMark = (response: TemuActionResponse | null | undefined, finalNum: number): JitSubmitMark => ({
  status: response?.success ? "success" : "failed",
  action: "stock",
  message: String(response?.message || "").trim() || (response?.success ? "库存维护成功" : "库存维护失败"),
  time: formatDateTime(new Date()),
  stockMaintained: !!response?.success,
  finalNum,
});

const buildJitStockErrorMark = (error: any, finalNum: number): JitSubmitMark => ({
  status: "failed",
  action: "stock",
  message: extractRequestErrorMessage(error, "库存维护失败"),
  time: formatDateTime(new Date()),
  stockMaintained: false,
  finalNum,
});

const persistJitStockMark = async (row: JitPreviewRow, mark: JitSubmitMark, ownerRunId?: number) => {
  const runId = Number(ownerRunId || activeTaskRunDetail.value?.id || 0);
  if (!runId) {
    return;
  }
  const detail = await markTemuTaskRunJitRow({
    id: runId,
    rowKey: row.rowKey,
    action: "stock",
    status: mark.status,
    message: mark.message,
    stockMaintained: !!mark.stockMaintained,
    finalNum: mark.finalNum,
  });
  applyTaskRunDetailIfCurrent(detail, runId);
};

const persistJitMarksBatch = async (
  runId: number,
  items: Array<{
    rowKey: string;
    action: "open" | "stock";
    status: "success" | "failed";
    message?: string;
    markOpened?: boolean;
    stockMaintained?: boolean;
    finalNum?: number;
  }>,
) => {
  if (!runId || !items.length) {
    return;
  }
  const detail = await batchMarkTemuTaskRunJitRows({
    id: runId,
    items,
  });
  applyTaskRunDetailIfCurrent(detail, runId);
};

const submitJitStockRow = async (row: JitPreviewRow) => {
  if (!requireTemuClientContext()) {
    return;
  }
  if (!row?.rawSkcId || !row.jitOpened) {
    ElMessage.warning("只有已开通 JIT 的记录才能维护库存");
    return;
  }
  if (row.stockMaintained) {
    ElMessage.warning("该记录已维护库存，无需重复操作");
    return;
  }

  const finalNum = Math.max(0, Number(jitStockFinalNum.value || 0) || 0);
  const ownerRunId = Number(activeTaskRunDetail.value?.id || 0);
  jitStockSubmittingKey.value = row.rowKey;
  try {
    const response = await runTemuClientAction("jit.stock.update", buildJitStockPayload(row));
    const nextMark = buildJitStockSuccessMark(response, finalNum);
    jitStockSubmitMarks[row.rowKey] = nextMark;
    try {
      await persistJitStockMark(row, nextMark, ownerRunId);
    } catch (error: any) {
      ElMessage.warning(extractRequestErrorMessage(error, "库存维护状态持久化失败"));
    }
    response?.success ? ElMessage.success(nextMark.message) : ElMessage.error(nextMark.message);
  } catch (error: any) {
    const nextMark = buildJitStockErrorMark(error, finalNum);
    jitStockSubmitMarks[row.rowKey] = nextMark;
    if (ownerRunId) {
      markTemuTaskRunJitRow({
        id: ownerRunId,
        rowKey: row.rowKey,
        action: "stock",
        status: nextMark.status,
        message: nextMark.message,
        stockMaintained: false,
        finalNum,
      }).catch(() => undefined);
    }
    ElMessage.error(nextMark.message);
  } finally {
    jitStockSubmittingKey.value = "";
  }
};

const submitJitStockRows = async (inputRows: JitPreviewRow[], batchMode = false) => {
  if (!requireTemuClientContext()) {
    return { successCount: 0, failedCount: 0 };
  }
  const rows = (Array.isArray(inputRows) ? inputRows : []).filter((row) => isStockMaintainableJitRow(row));
  if (!rows.length) {
    ElMessage.warning("请先选择已开通且未维护库存的记录");
    return { successCount: 0, failedCount: 0 };
  }

  const finalNum = Math.max(0, Number(jitStockFinalNum.value || 0) || 0);
  let successCount = 0;
  let failedCount = 0;
  if (batchMode) {
    resetJitBatchProgress("批量维护库存", rows.length);
  }
  const batchToken = batchAbortToken.value;
  const ownerRunId = Number(activeTaskRunDetail.value?.id || 0);
  const batchMarks: Array<{
    rowKey: string;
    action: "stock";
    status: "success" | "failed";
    message?: string;
    stockMaintained?: boolean;
    finalNum?: number;
  }> = [];

  try {
    for (const row of rows) {
      if (batchMode && shouldAbortBatch(batchToken)) {
        break;
      }
      if (batchMode) {
        setJitBatchCurrent("维护库存中", row);
      } else {
        jitStockSubmittingKey.value = row.rowKey;
      }
      try {
        const response = await runTemuClientAction("jit.stock.update", buildJitStockPayload(row));
        const nextMark = buildJitStockSuccessMark(response, finalNum);
        jitStockSubmitMarks[row.rowKey] = nextMark;
        if (nextMark.status === "success") {
          successCount += 1;
        } else {
          failedCount += 1;
        }
        if (batchMode) {
          batchMarks.push({
            rowKey: row.rowKey,
            action: "stock",
            status: nextMark.status,
            message: nextMark.message,
            stockMaintained: !!nextMark.stockMaintained,
            finalNum: nextMark.finalNum,
          });
        } else {
          try {
            await persistJitStockMark(row, nextMark, ownerRunId);
          } catch (error: any) {
            ElMessage.warning(extractRequestErrorMessage(error, "库存维护状态持久化失败"));
          }
        }
      } catch (error: any) {
        failedCount += 1;
        const nextMark = buildJitStockErrorMark(error, finalNum);
        jitStockSubmitMarks[row.rowKey] = nextMark;
        if (batchMode) {
          batchMarks.push({
            rowKey: row.rowKey,
            action: "stock",
            status: nextMark.status,
            message: nextMark.message,
            stockMaintained: false,
            finalNum,
          });
        } else if (ownerRunId) {
          markTemuTaskRunJitRow({
            id: ownerRunId,
            rowKey: row.rowKey,
            action: "stock",
            status: nextMark.status,
            message: nextMark.message,
            stockMaintained: false,
            finalNum,
          }).catch(() => undefined);
        }
      } finally {
        if (batchMode) {
          jitBatchFinishedCount.value += 1;
          jitBatchSuccessCount.value = successCount;
          jitBatchFailedCount.value = failedCount;
        }
      }
    }

    if (batchMode && ownerRunId && batchMarks.length) {
      try {
        await persistJitMarksBatch(ownerRunId, batchMarks);
      } catch (error: any) {
        ElMessage.warning(extractRequestErrorMessage(error, "库存维护状态批量持久化失败"));
      }
    }

    if (batchMode) {
      selectedJitRowKeys.value = selectedJitRowKeys.value.filter((rowKey) => {
        const stockMark = jitStockSubmitMarks[rowKey];
        return !stockMark?.stockMaintained;
      });
      jitPreviewGridRef.value?.clearCheckboxRow?.();
      ElMessage.success(`库存维护完成：成功 ${successCount} 个，失败 ${failedCount} 个`);
    }
    return { successCount, failedCount };
  } finally {
    jitStockSubmittingKey.value = "";
    if (batchMode) {
      jitBatchCurrentStage.value = "";
      jitBatchCurrentRowText.value = "";
      jitBatchSubmitting.value = false;
      void clearFloatingBatchProgressSilently();
    }
  }
};

const submitJitRows = async (inputRows: JitPreviewRow[], batchMode = false) => {
  if (!requireTemuClientContext()) {
    return;
  }
  const rows = (Array.isArray(inputRows) ? inputRows : []).filter((row) => isOpenableJitRow(row));
  if (!rows.length) {
    ElMessage.warning("请先选择未开通 JIT 的记录");
    return;
  }

  if (batchMode) {
    resetJitBatchProgress("批量开通 JIT", rows.length);
    setJitBatchCurrent("批量开通请求中");
  } else {
    jitSubmittingKey.value = rows[0]?.rowKey || "";
  }
  const batchToken = batchAbortToken.value;
  const ownerRunId = Number(activeTaskRunDetail.value?.id || 0);

  try {
    const response = normalizeTemuActionResponse(await runTemuClientAction("jit.open", buildJitOpenPayload(rows)));
    if (batchMode && shouldAbortBatch(batchToken)) {
      return;
    }
    const failedItems = asArray<Record<string, any>>(response?.result?.failedSkcList);
    const failedSkcIds = new Set(
      failedItems
        .map((item) => Number(item?.productSkcId || item?.skcId || 0))
        .filter((item) => Number.isFinite(item) && item > 0),
    );
    let successCount = 0;
    let failedCount = 0;
    const persistPayloads: Array<{
      id: number | string;
      rowKey: string;
      action: "open";
      status: "success" | "failed";
      message?: string;
      markOpened?: boolean;
    }> = [];

    rows.forEach((row) => {
      const failedItem = failedItems.find(
        (item) => Number(item?.productSkcId || item?.skcId || 0) === row.rawSkcId,
      );
      const success = !!response?.success && !failedSkcIds.has(row.rawSkcId);
      if (success) {
        successCount += 1;
        row.jitOpened = true;
        row.applyJitStatus = 3;
        row.jitStatusText = "已开通 JIT";
      } else {
        failedCount += 1;
      }
      jitSubmitMarks[row.rowKey] = {
        status: success ? "success" : "failed",
        action: "open",
        message: String(failedItem?.msg || failedItem?.message || response?.message || (success ? "开通成功" : "开通失败")),
        time: formatDateTime(new Date()),
        markOpened: success,
      };
      if (ownerRunId) {
        persistPayloads.push({
          id: ownerRunId,
          rowKey: row.rowKey,
          action: "open",
          status: jitSubmitMarks[row.rowKey].status,
          message: jitSubmitMarks[row.rowKey].message,
          markOpened: success,
        });
      }
    });

    if (batchMode && ownerRunId && persistPayloads.length) {
      try {
        await persistJitMarksBatch(
          ownerRunId,
          persistPayloads.map(({ id: _id, ...item }) => item),
        );
      } catch (error: any) {
        ElMessage.warning(extractRequestErrorMessage(error, "JIT 开通状态批量持久化失败"));
      }
    } else if (persistPayloads.length) {
      let persistFailed = false;
      for (const payload of persistPayloads) {
        try {
          const detail = await markTemuTaskRunJitRow(payload);
          applyTaskRunDetailIfCurrent(detail, Number(payload.id || 0));
        } catch {
          persistFailed = true;
        }
      }
      if (persistFailed) {
        ElMessage.warning("JIT 开通状态部分持久化失败，请刷新后核对执行记录");
      }
    }

    if (batchMode) {
      jitBatchFinishedCount.value = rows.length;
      jitBatchSuccessCount.value = successCount;
      jitBatchFailedCount.value = failedCount;
      selectedJitRowKeys.value = selectedJitRowKeys.value.filter((rowKey) => {
        const mark = jitSubmitMarks[rowKey];
        return mark?.status !== "success";
      });
      jitPreviewGridRef.value?.clearCheckboxRow?.();
      ElMessage.success(`JIT 开通完成：成功 ${successCount} 个，失败 ${failedCount} 个`);
    } else {
      failedCount
        ? ElMessage.error(rows[0] ? jitSubmitMarks[rows[0].rowKey]?.message || "JIT 开通失败" : "JIT 开通失败")
        : ElMessage.success("JIT 开通完成");
    }
  } catch (error: any) {
    const failedBatchMarks: Array<{
      rowKey: string;
      action: "open";
      status: "failed";
      message?: string;
      markOpened?: boolean;
    }> = [];
    rows.forEach((row) => {
      const nextMark: JitSubmitMark = {
        status: "failed",
        action: "open",
        message: extractRequestErrorMessage(error, "JIT 开通失败"),
        time: formatDateTime(new Date()),
        markOpened: false,
      };
      jitSubmitMarks[row.rowKey] = nextMark;
      if (batchMode && ownerRunId) {
        failedBatchMarks.push({
          rowKey: row.rowKey,
          action: "open",
          status: nextMark.status,
          message: nextMark.message,
          markOpened: false,
        });
      } else if (ownerRunId) {
        markTemuTaskRunJitRow({
          id: ownerRunId,
          rowKey: row.rowKey,
          action: "open",
          status: nextMark.status,
          message: nextMark.message,
          markOpened: false,
        }).catch(() => undefined);
      }
    });
    if (batchMode) {
      jitBatchFinishedCount.value = rows.length;
      jitBatchFailedCount.value = rows.length;
      if (failedBatchMarks.length) {
        try {
          await persistJitMarksBatch(ownerRunId, failedBatchMarks);
        } catch (persistError: any) {
          ElMessage.warning(extractRequestErrorMessage(persistError, "JIT 开通失败状态批量持久化失败"));
        }
      }
    }
    ElMessage.error(extractRequestErrorMessage(error, "JIT 开通失败"));
  } finally {
    jitSubmittingKey.value = "";
    jitBatchCurrentStage.value = "";
    jitBatchCurrentRowText.value = "";
    jitBatchSubmitting.value = false;
    if (batchMode) {
      void clearFloatingBatchProgressSilently();
    }
  }
};

const submitSelectedJitRows = () => submitJitRows(selectedJitRows.value, true);
const submitSelectedJitStockRows = () => submitJitStockRows(selectedStockMaintainableJitRows.value, true);

const submitSelectedJitOpenAndStockRows = async () => {
  if (!requireTemuClientContext()) {
    return;
  }
  const rows = selectedJitRows.value.filter((row) => !row.stockMaintained);
  if (!rows.length) {
    ElMessage.warning("请先选择需要开通或维护库存的记录");
    return;
  }

  const openRows = rows.filter((row) => isOpenableJitRow(row));
  const alreadyOpenRows = rows.filter((row) => isStockMaintainableJitRow(row));
  resetJitBatchProgress("批量开通并维护库存", rows.length + openRows.length);
  const batchToken = batchAbortToken.value;
  const ownerRunId = Number(activeTaskRunDetail.value?.id || 0);
  try {
    let openSuccessCount = 0;
    let openFailedCount = 0;
    let skippedStockCount = 0;
    const openedRows: JitPreviewRow[] = [];
    const batchMarks: Array<{
      rowKey: string;
      action: "open" | "stock";
      status: "success" | "failed";
      message?: string;
      markOpened?: boolean;
      stockMaintained?: boolean;
      finalNum?: number;
    }> = [];

    if (openRows.length) {
      setJitBatchCurrent("批量开通请求中");
      const response = normalizeTemuActionResponse(await runTemuClientAction("jit.open", buildJitOpenPayload(openRows)));
      const failedItems = asArray<Record<string, any>>(response?.result?.failedSkcList);
      const failedSkcIds = new Set(
        failedItems
          .map((item) => Number(item?.productSkcId || item?.skcId || 0))
          .filter((item) => Number.isFinite(item) && item > 0),
      );

      for (const row of openRows) {
        if (shouldAbortBatch(batchToken)) {
          break;
        }
        setJitBatchCurrent("记录开通结果", row);
        const failedItem = failedItems.find(
          (item) => Number(item?.productSkcId || item?.skcId || 0) === row.rawSkcId,
        );
        const success = !!response?.success && !failedSkcIds.has(row.rawSkcId);
        if (success) {
          openSuccessCount += 1;
          row.jitOpened = true;
          row.applyJitStatus = 3;
          row.jitStatusText = "已开通 JIT";
          openedRows.push(row);
        } else {
          openFailedCount += 1;
        }
        const nextMark: JitSubmitMark = {
          status: success ? "success" : "failed",
          action: "open",
          message: String(failedItem?.msg || failedItem?.message || response?.message || (success ? "开通成功" : "开通失败")),
          time: formatDateTime(new Date()),
          markOpened: success,
        };
        jitSubmitMarks[row.rowKey] = nextMark;
        if (ownerRunId) {
          batchMarks.push({
            rowKey: row.rowKey,
            action: "open",
            status: nextMark.status,
            message: nextMark.message,
            markOpened: success,
          });
        }
        jitBatchFinishedCount.value += 1;
        jitBatchSuccessCount.value = openSuccessCount;
        jitBatchFailedCount.value = openFailedCount;
        if (!success) {
          skippedStockCount += 1;
          jitBatchFinishedCount.value += 1;
          jitBatchFailedCount.value = openFailedCount + skippedStockCount;
        }
      }
    }

    const stockRows = [...alreadyOpenRows, ...openedRows].filter((row) => !row.stockMaintained);
    let stockSuccessCount = 0;
    let stockFailedCount = 0;
    const finalNum = Math.max(0, Number(jitStockFinalNum.value || 0) || 0);
    for (const row of stockRows) {
      if (shouldAbortBatch(batchToken)) {
        break;
      }
      setJitBatchCurrent("维护库存中", row);
      try {
        const response = await runTemuClientAction("jit.stock.update", buildJitStockPayload(row));
        const nextMark = buildJitStockSuccessMark(response, finalNum);
        jitStockSubmitMarks[row.rowKey] = nextMark;
        if (nextMark.status === "success") {
          stockSuccessCount += 1;
        } else {
          stockFailedCount += 1;
        }
        if (ownerRunId) {
          batchMarks.push({
            rowKey: row.rowKey,
            action: "stock",
            status: nextMark.status,
            message: nextMark.message,
            stockMaintained: !!nextMark.stockMaintained,
            finalNum: nextMark.finalNum,
          });
        }
      } catch (error: any) {
        stockFailedCount += 1;
        const nextMark = buildJitStockErrorMark(error, finalNum);
        jitStockSubmitMarks[row.rowKey] = nextMark;
        if (ownerRunId) {
          batchMarks.push({
            rowKey: row.rowKey,
            action: "stock",
            status: nextMark.status,
            message: nextMark.message,
            stockMaintained: false,
            finalNum,
          });
        }
      } finally {
        jitBatchFinishedCount.value += 1;
        jitBatchSuccessCount.value = openSuccessCount + stockSuccessCount;
        jitBatchFailedCount.value = openFailedCount + skippedStockCount + stockFailedCount;
      }
    }

    if (ownerRunId && batchMarks.length) {
      try {
        await persistJitMarksBatch(ownerRunId, batchMarks);
      } catch (error: any) {
        ElMessage.warning(extractRequestErrorMessage(error, "JIT 批量状态持久化失败"));
      }
    }

    selectedJitRowKeys.value = selectedJitRowKeys.value.filter((rowKey) => {
      const openMark = jitSubmitMarks[rowKey];
      const stockMark = jitStockSubmitMarks[rowKey];
      return !(stockMark?.stockMaintained || (openMark?.markOpened && !stockRows.some((row) => row.rowKey === rowKey)));
    });
    jitPreviewGridRef.value?.clearCheckboxRow?.();
    ElMessage.success(
      `批量处理完成：开通成功 ${openSuccessCount} 个，开通失败 ${openFailedCount} 个；库存成功 ${stockSuccessCount} 个，库存失败 ${stockFailedCount} 个`,
    );
  } catch (error: any) {
    ElMessage.error(extractRequestErrorMessage(error, "批量开通并维护库存失败"));
  } finally {
    jitBatchCurrentStage.value = "";
    jitBatchCurrentRowText.value = "";
    jitBatchSubmitting.value = false;
    void clearFloatingBatchProgressSilently();
  }
};

const onJitSelectionChange = ({ records }: { records: JitPreviewRow[] }) => {
  selectedJitRowKeys.value = (Array.isArray(records) ? records : [])
    .filter((row) => isSelectableJitRow(row))
    .map((row) => String(row?.rowKey || "").trim())
    .filter(Boolean);
};

const submitConfirmationRows = async (rows: ConfirmationPreviewRow[], batchMode = false) => {
  if (!requireTemuClientContext()) {
    return;
  }
  const validRows = rows.filter((row) => !row.confirmed && row.rawGoodsId > 0);
  if (!validRows.length) {
    ElMessage.warning("请先选择未确认的记录");
    return;
  }
  if (batchMode) {
    confirmationBatchSubmitting.value = true;
    confirmationBatchFinishedCount.value = 0;
    confirmationBatchTotalCount.value = validRows.length;
    confirmationBatchSuccessCount.value = 0;
    confirmationBatchFailedCount.value = 0;
  }
  const ownerRunId = Number(activeTaskRunDetail.value?.id || 0);
  let successCount = 0;
  let failedCount = 0;
  for (let i = 0; i < validRows.length; i += 1) {
    const row = validRows[i];
    if (batchMode) {
      confirmationBatchFinishedCount.value = i;
    } else {
      confirmationSubmittingKey.value = row.rowKey;
    }
    try {
      const response = await runTemuClientAction("goods.confirmation.confirm", {
        profileId: props.profileId,
        region: String(activeTaskRunDetail.value?.region || activeActionResult.value?.region || "global"),
        goodsId: row.rawGoodsId,
        siteVersion: row.siteVersion,
        priceConfirmKeyStr: "1",
        goodsSkuIdList: row.goodsSkuIdList.length ? row.goodsSkuIdList : [row.rawSkcId],
      });
      const success = !!(response as any)?.success;
      if (success) {
        successCount += 1;
      } else {
        failedCount += 1;
      }
      confirmationSubmitMarks[row.rowKey] = {
        status: success ? "success" : "failed",
        message: String((response as any)?.message || (success ? "确认成功" : "确认失败")),
        time: formatDateTime(new Date()),
      };
      if (success) {
        row.confirmed = true;
        row.submitStatus = "成功";
        row.submitMessage = confirmationSubmitMarks[row.rowKey].message;
      }
    } catch (error: any) {
      failedCount += 1;
      confirmationSubmitMarks[row.rowKey] = {
        status: "failed",
        message: String(error?.message || "确认失败"),
        time: formatDateTime(new Date()),
      };
    }
  }
  if (batchMode) {
    confirmationBatchFinishedCount.value = validRows.length;
    confirmationBatchSuccessCount.value = successCount;
    confirmationBatchFailedCount.value = failedCount;
  }
  confirmationSubmittingKey.value = "";
  confirmationBatchSubmitting.value = false;
  if (ownerRunId) {
    try {
      await loadTaskRunDetail(ownerRunId, { silent: true });
    } catch {
      // ignore
    }
  }
  if (batchMode) {
    ElMessage.success(`批量确认完成：成功 ${successCount} 条，失败 ${failedCount} 条`);
  } else if (failedCount) {
    ElMessage.error("确认失败");
  } else {
    ElMessage.success("确认成功");
  }
};

const submitSelectedConfirmationRows = () =>
  submitConfirmationRows(selectedConfirmationRows.value, true);

const submitSingleConfirmationRow = (row: ConfirmationPreviewRow) =>
  submitConfirmationRows([row], false);

const onConfirmationSelectionChange = ({ records }: { records: ConfirmationPreviewRow[] }) => {
  selectedConfirmationRowKeys.value = (Array.isArray(records) ? records : [])
    .map((row) => String(row?.rowKey || "").trim())
    .filter(Boolean);
};

const buildSingleRealPicturePayload = (
  row: RealPicturePreviewRow,
  positionImageUrls: Record<string, string[]>,
  uploadedPositionImageUrls?: Record<string, string[]>,
) => ({
  profileId: props.profileId,
  region: String(activeTaskRunDetail.value?.region || activeActionResult.value?.region || "global"),
  spuId: row.rawSpuId,
  goodsId: row.rawGoodsId,
  skuIdList: row.rawSkuIdList,
  isSameSku: row.rawIsSameSku,
  ...(uploadedPositionImageUrls ? { uploadedPositionImageUrls } : { positionImageUrls }),
  appendToExisting: false,
  existingLabelImageList: row.existingLabelImageList,
  confirmType: 4,
});

const ensureRealPicturePositionItems = () => {
  const form = realPictureUploadForm.value as Record<string, any>;
  const existingItems = asArray<Record<string, any>>(form.positionItems);
  if (existingItems.length) {
    form.positionItems = existingItems.map((item, index) => ({
      id: item.id || `position-${index + 1}`,
      position: Number(item.position || index + 1) || index + 1,
      imageUrlsText: String(item.imageUrlsText || ""),
    }));
    return;
  }
  form.positionItems = [
    createRealPicturePositionItem(1, String(form.position1ImageUrlsText || "")),
    createRealPicturePositionItem(2, String(form.position2ImageUrlsText || "")),
  ];
};

const addRealPicturePositionItem = () => {
  ensureRealPicturePositionItems();
  realPictureUploadForm.value.positionItems.push(createRealPicturePositionItem());
};

const removeRealPicturePositionItem = (index: number) => {
  ensureRealPicturePositionItems();
  if (realPictureUploadForm.value.positionItems.length <= 1) {
    return;
  }
  realPictureUploadForm.value.positionItems.splice(index, 1);
};

const buildRealPicturePositionImageUrlsFromForm = () => {
  ensureRealPicturePositionItems();
  const allImageUrls = Array.from(new Set(
    realPictureUploadForm.value.positionItems.flatMap((item: any) => parseImageUrlText(item.imageUrlsText)),
  ));
  if (!allImageUrls.length) {
    return {};
  }
  return {
    1: allImageUrls,
    2: allImageUrls,
  };
};

const openRealPictureUploader = (rows: RealPicturePreviewRow[]) => {
  if (!requireTemuClientContext()) {
    return;
  }
  const usableRows = (Array.isArray(rows) ? rows : []).filter((row) => isSelectableRealPictureRow(row));
  if (!usableRows.length) {
    ElMessage.warning("请先从实拍图列表选择可上传的记录");
    return;
  }
  realPictureUploadRows.value = usableRows;
  ensureRealPicturePositionItems();
  realPictureUploadVisible.value = true;
};

const submitRealPictureRowWithoutConfirm = async (
  row: RealPicturePreviewRow,
  positionImageUrls: Record<string, string[]>,
  options: {
    showToast?: boolean;
    uploadedPositionImageUrls?: Record<string, string[]>;
    persist?: boolean;
  } = {},
) => {
  realPictureSubmittingKey.value = row.rowKey;
  const ownerRunId = Number(activeTaskRunDetail.value?.id || 0);
  const persistRealPictureMark = async (mark: RealPictureSubmitMark) => {
    const runId = ownerRunId;
    if (!runId) {
      return;
    }
    try {
      const detail = await markTemuTaskRunRealPictureRow({
        id: runId,
        rowKey: row.rowKey,
        status: mark.status,
        message: mark.message,
        spuId: row.rawSpuId,
        goodsId: row.rawGoodsId,
      });
      applyTaskRunDetailIfCurrent(detail, runId);
    } catch (error) {
      console.warn("持久化实拍图上传标注失败", error);
    }
  };
  try {
    const response = await runTemuClientAction(
      "goods.real-picture.submit",
      buildSingleRealPicturePayload(row, positionImageUrls, options.uploadedPositionImageUrls),
      10 * 60 * 1000,
    );
    const nextMark: RealPictureSubmitMark = {
      status: response?.success ? "success" : "failed",
      message: String(response?.message || "").trim() || (response?.success ? "上传成功" : "上传失败"),
      time: formatDateTime(new Date()),
    };
    realPictureSubmitMarks[row.rowKey] = nextMark;
    if (options.persist !== false) {
      await persistRealPictureMark(nextMark);
    }
    if (options.showToast) {
      response?.success ? ElMessage.success("实拍图上传成功") : ElMessage.error(nextMark.message);
    }
    return {
      success: !!response?.success,
      uploadedPositionImageUrls: response?.success ? extractUploadedRealPicturePositionMap(response) : null,
    };
  } catch (error: any) {
    const nextMark: RealPictureSubmitMark = {
      status: "failed",
      message: extractRequestErrorMessage(error, "实拍图上传失败"),
      time: formatDateTime(new Date()),
    };
    realPictureSubmitMarks[row.rowKey] = nextMark;
    if (options.persist !== false) {
      await persistRealPictureMark(nextMark);
    }
    if (options.showToast) {
      ElMessage.error(nextMark.message);
    }
    return {
      success: false,
      uploadedPositionImageUrls: null,
    };
  } finally {
    realPictureSubmittingKey.value = "";
  }
};

const extractUploadedRealPicturePositionMap = (response: any) => {
  const uploadedImages = asArray<Record<string, any>>(response?.result?.uploadedImages);
  const result: Record<string, string[]> = {};
  uploadedImages.forEach((item) => {
    const position = String(item?.position || "").trim();
    const uploadedUrl = String(item?.uploadedUrl || "").trim();
    if (!position || !/^https?:\/\//i.test(uploadedUrl)) {
      return;
    }
    if (!result[position]) {
      result[position] = [];
    }
    result[position].push(uploadedUrl);
  });
  Object.keys(result).forEach((position) => {
    result[position] = Array.from(new Set(result[position]));
  });
  return Object.keys(result).length ? result : null;
};

const submitRealPictureUploadRows = async () => {
  if (!requireTemuClientContext()) {
    return;
  }
  const rows = realPictureUploadRows.value.filter((row) => isSelectableRealPictureRow(row));
  if (!rows.length) {
    ElMessage.warning("没有可上传的实拍图记录");
    return;
  }
  const positionImageUrls = buildRealPicturePositionImageUrlsFromForm();
  if (!Object.keys(positionImageUrls).length) {
    ElMessage.warning("请至少填写一个位置的 HTTP 图片地址");
    return;
  }

  realPictureBatchSubmitting.value = true;
  realPictureBatchFinishedCount.value = 0;
  realPictureBatchTotalCount.value = rows.length;
  realPictureBatchSuccessCount.value = 0;
  realPictureBatchFailedCount.value = 0;
  let successCount = 0;
  let reusableUploadedPositionImageUrls: Record<string, string[]> | null = null;
  const batchToken = batchAbortToken.value;
  const ownerRunId = Number(activeTaskRunDetail.value?.id || 0);
  const batchMarks: Array<{
    rowKey: string;
    status: "success" | "failed";
    message?: string;
    spuId?: number;
    goodsId?: number;
  }> = [];

  for (const row of rows) {
    if (shouldAbortBatch(batchToken)) {
      break;
    }
    const result = await submitRealPictureRowWithoutConfirm(row, positionImageUrls, {
      uploadedPositionImageUrls: reusableUploadedPositionImageUrls || undefined,
      persist: false,
    });
    const mark = realPictureSubmitMarks[row.rowKey];
    if (mark) {
      batchMarks.push({
        rowKey: row.rowKey,
        status: mark.status,
        message: mark.message,
        spuId: row.rawSpuId,
        goodsId: row.rawGoodsId,
      });
    }
    if (result.success) {
      if (!reusableUploadedPositionImageUrls && result.uploadedPositionImageUrls) {
        reusableUploadedPositionImageUrls = result.uploadedPositionImageUrls;
      }
      successCount += 1;
      realPictureBatchSuccessCount.value += 1;
    } else {
      realPictureBatchFailedCount.value += 1;
    }
    realPictureBatchFinishedCount.value += 1;
  }

  if (ownerRunId && batchMarks.length) {
    try {
      const detail = await batchMarkTemuTaskRunRealPictureRows({
        id: ownerRunId,
        items: batchMarks,
      });
      applyTaskRunDetailIfCurrent(detail, ownerRunId);
    } catch (error) {
      console.warn("批量持久化实拍图上传标注失败", error);
    }
  }

  realPictureBatchSubmitting.value = false;
  void clearFloatingBatchProgressSilently();
  realPictureUploadVisible.value = false;
  selectedRealPictureRowKeys.value = selectedRealPictureRowKeys.value.filter((rowKey) => {
    const mark = realPictureSubmitMarks[rowKey];
    return mark?.status !== "success";
  });
  realPicturePreviewGridRef.value?.clearCheckboxRow?.();
  ElMessage.success(`实拍图上传完成：成功 ${successCount} 条，失败 ${rows.length - successCount} 条`);
};

const onRealPictureSelectionChange = ({ records }: { records: RealPicturePreviewRow[] }) => {
  selectedRealPictureRowKeys.value = (Array.isArray(records) ? records : [])
    .filter((row) => isSelectableRealPictureRow(row))
    .map((row) => String(row?.rowKey || "").trim())
    .filter(Boolean);
};

const buildSinglePriceReviewPayload = (
  row: PriceReviewPreviewRow,
  mode: "confirm" | "abandon" | "reprice",
  overridePrice?: number,
) => {
  const basePayload = {
    profileId: props.profileId,
    region: String(activeTaskRunDetail.value?.region || activeActionResult.value?.region || "global"),
    priceOrderId: row.rawPriceOrderId,
    traceId: `price-review-${Date.now()}-${row.rowKey}`,
    rowTrace: {
      rowKey: row.rowKey,
      priceOrderId: row.priceOrderId,
      skuId: row.skuId,
      spuId: row.spuId,
    },
  };

  if (mode === "abandon") {
    return {
      ...basePayload,
      supplierResult: 3,
    };
  }

  return {
    ...basePayload,
    supplierResult: mode === "reprice" ? 2 : 1,
    items: [
      {
        productSkuId: row.rawSkuId,
        price: mode === "reprice" ? overridePrice : row.rawSuggestPrice,
      },
    ],
    bargainReasonList: [],
  };
};

const buildComplianceDetailPayload = (row: CompliancePreviewRow) => ({
  cat_id: Number(row.raw?.cat_id || row.raw?.catId || 0),
  spu_id: Number(row.raw?.spu_id || row.raw?.spuId || 0),
  goods_id: Number(row.raw?.goods_id || row.raw?.goodsId || 0),
  wait_task_list: asArray(row.raw?.wait_task_dtolist || row.raw?.waitTaskDtoList),
});
const getComplianceDetailResult = () => {
  const payload = asPlainObject(complianceDetailResponse.value?.raw || complianceDetailResponse.value?.result);
  return asPlainObject(payload.result || payload);
};
const clonePlainObject = <T = any>(value: T): T => {
  try {
    return JSON.parse(JSON.stringify(value ?? null));
  } catch {
    return value;
  }
};
const OFFICIAL_SIMPLE_COMPLIANCE_TASK_TYPES = new Set([4, 33, 42, 49]);
const getComplianceQueryTaskList = () =>
  asArray<Record<string, any>>(activeComplianceRow.value?.raw?.wait_task_dtolist || activeComplianceRow.value?.raw?.waitTaskDtoList);
const resolveComplianceTaskIdMap = () =>
  getComplianceQueryTaskList().reduce((result, task) => {
    const taskType = Number(task?.task_type || task?.taskType);
    const taskId = task?.task_id || task?.taskId;
    if (Number.isFinite(taskType) && taskId !== undefined && taskId !== null) {
      result[taskType] = taskId;
    }
    return result;
  }, {} as Record<number, any>);
const resolveComplianceQueryTaskMap = () =>
  getComplianceQueryTaskList().reduce((result, task) => {
    const taskType = Number(task?.task_type || task?.taskType);
    if (Number.isFinite(taskType)) {
      result[taskType] = asPlainObject(task);
    }
    return result;
  }, {} as Record<number, Record<string, any>>);
const resolveComplianceFieldSelectionMap = () =>
  selectedComplianceFields.value.reduce((result, field) => {
    result[field.key] = complianceEditorForm[field.key];
    return result;
  }, {} as Record<string, any>);
const findComplianceTemplateByTaskType = (taskType: number) =>
  complianceTemplateList.value.find((template) =>
    Number(template?.task_type || template?.taskType) === Number(taskType),
  );
const getFirstTemplatePropertyId = (taskType: number) => {
  const template = findComplianceTemplateByTaskType(taskType);
  const property = asArray<Record<string, any>>(template?.template_property_dtolist || template?.templatePropertyDtoList)[0];
  return firstDisplayValue(property?.property_id, property?.propertyId, property?.id);
};
const normalizeComplianceSubmitTask = (
  sourceTask: Record<string, any>,
  selectionMap: Record<string, any>,
) => {
  const taskType = Number(sourceTask?.task_type || sourceTask?.taskType);
  const task = clonePlainObject(sourceTask);

  if (OFFICIAL_SIMPLE_COMPLIANCE_TASK_TYPES.has(taskType)) {
    const propertyId = getFirstTemplatePropertyId(taskType);
    const selectedKey = `${taskType}:${propertyId}`;
    const selectedValue = selectionMap[selectedKey] ?? resolveComplianceHardcodedValues(taskType, propertyId)[0];
    return {
      task_id: task.task_id || task.taskId,
      task_status: task.task_status ?? task.taskStatus ?? task.status ?? 2,
      task_type: taskType,
      template_id: task.template_id || task.templateId || findComplianceTemplateByTaskType(taskType)?.template_id,
      properties: propertyId && propertyId !== "-"
        ? {
            [propertyId]: selectedValue === undefined || selectedValue === null || selectedValue === ""
              ? []
              : [selectedValue],
          }
        : {},
      images: {},
      input_text: {},
    };
  }

  if (taskType === 61) {
    const field = selectedComplianceFields.value.find((item) => Number(item.taskType) === 61);
    const propertyId = field?.propertyId || "1100100115";
    return {
      task_id: task.task_id || task.taskId,
      task_status: task.task_status ?? task.taskStatus ?? task.status ?? 2,
      task_type: taskType,
      template_id: task.template_id || task.templateId || findComplianceTemplateByTaskType(taskType)?.template_id,
      properties: {},
      images: {},
      input_text: {
        [propertyId]: {
          multi_line_inputs: [
            {
              name: DEFAULT_COMPLIANCE_PRODUCT_IDENTIFIER,
            },
          ],
        },
      },
    };
  }

  if ([25, 60, 84].includes(taskType)) {
    const repSelectionKey = `${taskType}:rep_detail`;
    const selectedRepId = selectionMap[repSelectionKey];
    const repList = asArray<Record<string, any>>(task.rep_detail_list || task.repDetailList);
    const selectedRep = repList.find((rep) =>
      String(firstDisplayValue(rep?.rep_id, rep?.repId)) === String(selectedRepId),
    ) || repList[0];
    return {
      task_id: task.task_id || task.taskId,
      task_type: taskType,
      is_not_required: task.is_not_required ?? task.isNotRequired,
      task_name: task.task_name || task.taskName || getComplianceTaskLabel(taskType),
      status: task.status ?? task.task_status ?? task.taskStatus,
      punish_time: task.punish_time ?? task.punishTime ?? 0,
      task_status: task.task_status ?? task.taskStatus ?? task.status,
      rep_detail_list: selectedRep
        ? [
            {
              rep_id: selectedRep.rep_id || selectedRep.repId,
              rep_name: selectedRep.rep_name || selectedRep.repName,
            },
          ]
        : [],
    };
  }

  const hardcodedSecondaryTask = buildHardcodedSecondaryComplianceTask(taskType, task);
  if (hardcodedSecondaryTask) {
    return hardcodedSecondaryTask;
  }

  return task;
};
const applyComplianceEditorSelections = (
  task: Record<string, any>,
  selectionMap: Record<string, any>,
) => {
  const taskType = Number(task?.task_type || task?.taskType);
  const propertySelections: Record<string, any[]> = {};
  Object.entries(selectionMap).forEach(([key, selectedValue]) => {
    const [fieldTaskType, propertyId] = key.split(":");
    if (Number(fieldTaskType) !== taskType) {
      return;
    }
    if (taskType === 3) {
      return;
    }

    if (propertyId === "rep_detail") {
      const repList = asArray<Record<string, any>>(task?.rep_detail_list || task?.repDetailList);
      const selectedRep = repList.find((rep) =>
        String(firstDisplayValue(rep?.rep_id, rep?.repId)) === String(selectedValue),
      );
      task.rep_detail_list = selectedRep ? [selectedRep] : [];
      return;
    }

    const field = selectedComplianceFields.value.find((item) => item.key === key);
    if (field?.controlType === "input") {
      task.input_text = {
        ...asPlainObject(task?.input_text || task?.inputText),
        [propertyId]: {
          multi_line_inputs: [
            {
              name: String(selectedValue || ""),
            },
          ],
        },
      };
      return;
    }

    propertySelections[propertyId] = selectedValue === undefined || selectedValue === null || selectedValue === ""
      ? []
      : [selectedValue];
  });

  if (Object.keys(propertySelections).length) {
    task.properties = propertySelections;
  }
};
const buildHardcodedSecondaryComplianceTask = (
  taskType: number,
  sourceTask: Record<string, any> | undefined,
) => {
  const taskId = sourceTask?.task_id || sourceTask?.taskId;
  const taskStatus = sourceTask?.task_status ?? sourceTask?.taskStatus ?? sourceTask?.status;
  if (taskType === 121) {
    return {
      task_id: taskId,
      task_status: taskStatus ?? 2,
      task_type: 121,
      template_id: sourceTask?.template_id || sourceTask?.templateId || 262,
      properties: {},
      images: {},
      input_text: {},
    };
  }
  if (taskType === 181) {
    return {
      task_id: taskId,
      task_status: taskStatus ?? 5,
      task_type: 181,
      template_id: sourceTask?.template_id || sourceTask?.templateId || 1013,
      properties: {
        "1100100490": [1000295043],
      },
      images: {},
      input_text: {},
    };
  }
  if (taskType === 186) {
    return {
      task_id: taskId,
      task_status: taskStatus ?? 5,
      task_type: 186,
      template_id: sourceTask?.template_id || sourceTask?.templateId || 1019,
      properties: {},
      images: {},
      input_text: {
        "1100100494": {
          name: "Manager",
        },
      },
    };
  }
  return null;
};
const appendHardcodedSecondaryComplianceTasks = (
  templateEditRequestList: Record<string, any>[],
  queryTaskMap: Record<number, Record<string, any>>,
) => {
  const existingTaskTypes = new Set(
    templateEditRequestList
      .map((task) => Number(task?.task_type || task?.taskType))
      .filter((taskType) => Number.isFinite(taskType)),
  );
  HARDCODED_SECONDARY_COMPLIANCE_TASKS.forEach((taskType) => {
    if (existingTaskTypes.has(taskType) || !queryTaskMap[taskType]) {
      return;
    }
    const hardcodedTask = buildHardcodedSecondaryComplianceTask(taskType, queryTaskMap[taskType]);
    if (hardcodedTask) {
      templateEditRequestList.push(hardcodedTask);
      existingTaskTypes.add(taskType);
    }
  });
};
const buildComplianceSubmitPayloadWithSelection = (selectionMap: Record<string, any>) => {
  const row = activeComplianceRow.value;
  if (!row) {
    throw new Error("缺少当前合规行");
  }

  const detailResult = getComplianceDetailResult();
  const detailTasks = asArray<Record<string, any>>(detailResult.template_list || detailResult.templateList);
  const taskIdMap = resolveComplianceTaskIdMap();
  const queryTaskMap = resolveComplianceQueryTaskMap();

  const templateEditRequestList = detailTasks.map((sourceTask) => {
    const task = normalizeComplianceSubmitTask(sourceTask, selectionMap);
    const taskType = Number(task?.task_type || task?.taskType);
    if (taskIdMap[taskType] !== undefined) {
      task.task_id = taskIdMap[taskType];
    }
    if (!OFFICIAL_SIMPLE_COMPLIANCE_TASK_TYPES.has(taskType) && taskType !== 61) {
      applyComplianceEditorSelections(task, selectionMap);
    }
    return task;
  });
  appendHardcodedSecondaryComplianceTasks(templateEditRequestList, queryTaskMap);

  if (!templateEditRequestList.length) {
    throw new Error("当前没有可提交的合规项");
  }

  return {
    cat_id: Number(row.raw?.cat_id || row.raw?.catId || 0),
    spu_id: Number(row.raw?.spu_id || row.raw?.spuId || 0),
    goods_id: Number(row.raw?.goods_id || row.raw?.goodsId || 0),
    group_sku_by_same_info: Boolean(detailResult.group_sku_by_same_info || detailResult.groupSkuBySameInfo),
    template_edit_request_list: templateEditRequestList,
  };
};
const buildComplianceSubmitPayload = () =>
  buildComplianceSubmitPayloadWithSelection(resolveComplianceFieldSelectionMap());
const fetchComplianceResponsesForRow = async (row: CompliancePreviewRow) => {
  const payload = buildComplianceDetailPayload(row);
  if (!payload.cat_id || !payload.spu_id || !payload.goods_id || !payload.wait_task_list.length) {
    throw new Error("当前行缺少合规详情查询参数");
  }

  const basePayload = {
    profileId: props.profileId,
    region: String(activeTaskRunDetail.value?.region || activeActionResult.value?.region || "global"),
    payload,
  };
  const detailResponse = await runTemuClientAction("compliance.detail", {
    ...basePayload,
    detailType: "detail",
  });
  const templateResponse = await runTemuClientAction("compliance.detail", {
    ...basePayload,
    detailType: "template",
  });
  if (!detailResponse?.success || !templateResponse?.success) {
    throw new Error("合规详情或模板返回失败");
  }
  return { detailResponse, templateResponse };
};

const loadComplianceEditorForRow = async (row: CompliancePreviewRow) => {
  activeComplianceRow.value = row;
  const firstVisibleTask = row.taskGroups.find((task) => {
    const taskTypes = [
      Number(task.raw?.task_type || task.raw?.taskType),
      ...task.children.map((child) => Number(child.raw?.task_type || child.raw?.taskType || child.taskType)),
    ].filter((taskType) => Number.isFinite(taskType));
    return !taskTypes.some((taskType) => isIgnoredComplianceTask(taskType, task.name));
  });
  selectedComplianceTaskKey.value = firstVisibleTask?.key || "";
  complianceDetailResponse.value = null;
  complianceTemplateResponse.value = null;
  Object.keys(complianceEditorForm).forEach((key) => {
    delete complianceEditorForm[key];
  });
  complianceEditorVisible.value = true;
  complianceEditorLoading.value = true;
  complianceDetailLoadingKey.value = row.rowKey;

  try {
    const { detailResponse, templateResponse } = await fetchComplianceResponsesForRow(row);
    complianceDetailResponse.value = detailResponse;
    complianceTemplateResponse.value = templateResponse;
  } catch (error: any) {
    ElMessage.error(extractRequestErrorMessage(error, "获取合规详情失败"));
  } finally {
    complianceEditorLoading.value = false;
    complianceDetailLoadingKey.value = "";
  }
};

const openComplianceEditor = async (row: CompliancePreviewRow) => {
  if (!requireTemuClientContext()) {
    return;
  }

  complianceBatchMode.value = false;
  complianceBatchRows.value = [];
  await loadComplianceEditorForRow(row);
};

const submitComplianceEditor = async () => {
  if (!requireTemuClientContext()) {
    return;
  }

  if (complianceBatchMode.value) {
    await submitComplianceBatchRows();
    return;
  }

  let payload: Record<string, any>;
  try {
    payload = buildComplianceSubmitPayload();
  } catch (error: any) {
    ElMessage.warning(error?.message || "合规提交参数不完整");
    return;
  }

  const ownerRunId = Number(activeTaskRunId.value || 0);
  complianceSubmitting.value = true;
  try {
    const response = await runTemuClientAction("compliance.submit", {
      profileId: props.profileId,
      region: String(activeTaskRunDetail.value?.region || activeActionResult.value?.region || "global"),
      payload,
    });

    if (!response?.success) {
      ElMessage.error(response?.message || "合规信息提交失败");
      return;
    }

    ElMessage.success(response?.message || "合规信息提交成功");
    complianceEditorVisible.value = false;
    await loadTaskRunDetail(ownerRunId, { silent: true });
  } catch (error: any) {
    ElMessage.error(extractRequestErrorMessage(error, "合规信息提交失败"));
  } finally {
    complianceSubmitting.value = false;
  }
};

const onComplianceSelectionChange = ({ records }: { records: CompliancePreviewRow[] }) => {
  selectedComplianceRowKeys.value = (Array.isArray(records) ? records : [])
    .filter((row) => isActionableComplianceRow(row))
    .map((row) => String(row?.rowKey || "").trim())
    .filter(Boolean);
};

const openComplianceBatchEditor = async () => {
  if (!requireTemuClientContext()) {
    return;
  }
  const rows = selectedComplianceRows.value;
  if (!rows.length) {
    ElMessage.warning("请先选择要批量处理的合规记录");
    return;
  }

  complianceBatchMode.value = true;
  complianceBatchRows.value = rows;
  complianceBatchPreparing.value = true;
  try {
    await loadComplianceEditorForRow(rows[0]);
    complianceBatchMode.value = true;
    complianceBatchRows.value = rows;
  } finally {
    complianceBatchPreparing.value = false;
  }
};

const submitComplianceBatchRows = async () => {
  const rows = (complianceBatchRows.value.length ? complianceBatchRows.value : selectedComplianceRows.value)
    .filter((row) => isActionableComplianceRow(row));
  if (!rows.length) {
    ElMessage.warning("没有可批量处理的合规记录");
    return;
  }

  const selectionSnapshot = { ...resolveComplianceFieldSelectionMap() };
  complianceBatchSubmitting.value = true;
  complianceBatchFinishedCount.value = 0;
  complianceBatchTotalCount.value = rows.length;
  complianceBatchSuccessCount.value = 0;
  complianceBatchFailedCount.value = 0;
  const batchToken = batchAbortToken.value;
  const ownerRunId = Number(activeTaskRunId.value || 0);

  for (const row of rows) {
    if (shouldAbortBatch(batchToken)) {
      break;
    }
    try {
      activeComplianceRow.value = row;
      const { detailResponse, templateResponse } = await fetchComplianceResponsesForRow(row);
      complianceDetailResponse.value = detailResponse;
      complianceTemplateResponse.value = templateResponse;

      const payload = buildComplianceSubmitPayloadWithSelection(selectionSnapshot);
      const response = await runTemuClientAction("compliance.submit", {
        profileId: props.profileId,
        region: String(activeTaskRunDetail.value?.region || activeActionResult.value?.region || "global"),
        payload,
      });
      if (!response?.success) {
        throw new Error(response?.message || "合规信息提交失败");
      }
      complianceBatchSuccessCount.value += 1;
    } catch {
      complianceBatchFailedCount.value += 1;
    } finally {
      complianceBatchFinishedCount.value += 1;
    }
  }

  const successCount = complianceBatchSuccessCount.value;
  const failedCount = complianceBatchFailedCount.value;
  complianceBatchSubmitting.value = false;
  void clearFloatingBatchProgressSilently();
  complianceBatchMode.value = false;
  complianceEditorVisible.value = false;
  selectedComplianceRowKeys.value = [];
  await loadTaskRunDetail(ownerRunId, { silent: true });
  ElMessage.success(`批量处理完成：成功 ${successCount} 条，失败 ${failedCount} 条`);
};

const submitPriceReviewRow = async (
  row: PriceReviewPreviewRow,
  mode: "confirm" | "abandon",
) => {
  if (!requireTemuClientContext()) {
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
    await submitPriceReviewRowWithoutConfirm(row, mode, { showToast: true });
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(extractRequestErrorMessage(error, `${actionText}提交失败`));
    }
  }
};

const submitRepricePriceReviewRow = async (row: PriceReviewPreviewRow) => {
  if (!props.profileId) {
    ElMessage.warning("请先选择执行环境");
    return;
  }

  if (!hasUsableSession.value) {
    ElMessage.warning("请先采集或选择一个已存储的 Temu 会话");
    return;
  }

  if (!canRepricePriceReviewRow(row)) {
    ElMessage.warning("当前行缺少核价单号、SKU 或当前价，无法重新报价");
    return;
  }

  if (row.invalid) {
    ElMessage.warning(`当前 SKU ${row.skuId} 已作废，无需操作`);
    return;
  }

  const defaultPriceCent = Math.max(0, Number(row.rawCurrentPrice || 0) - 1);
  try {
    const { value } = await ElMessageBox.prompt(
      `请输入 SKU ${row.skuId} 的重新报价`,
      "重新报价",
      {
        inputValue: (defaultPriceCent / 100).toFixed(2),
        inputPlaceholder: "请输入价格，单位：元",
        inputPattern: /^\d+(\.\d{1,2})?$/,
        inputErrorMessage: "请输入合法价格，最多两位小数",
        confirmButtonText: "提交重新报价",
        cancelButtonText: "取消",
        type: "warning",
      },
    );
    const priceCent = parsePriceYuanToCent(value);
    if (priceCent === null) {
      ElMessage.warning("请输入合法价格");
      return;
    }

    await submitPriceReviewRowWithoutConfirm(row, "reprice", {
      showToast: true,
      overridePrice: priceCent,
    });
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(extractRequestErrorMessage(error, "重新报价提交失败"));
    }
  }
};

const submitPriceReviewRowWithoutConfirm = async (
  row: PriceReviewPreviewRow,
  mode: "confirm" | "abandon" | "reprice",
  options: {
    showToast?: boolean;
    overridePrice?: number;
    batchIndex?: number;
    batchTotal?: number;
    ownerRunId?: number;
    timeoutMs?: number;
    persist?: boolean;
  } = {},
) => {
  const actionText = mode === "confirm" ? "确认核价" : mode === "reprice" ? "重新报价" : "不核价";
  const submitKey = `${row.rowKey}:${mode}`;
  const ownerRunId = Number(options.ownerRunId || activeTaskRunDetail.value?.id || 0);
  const batchLabel =
    options.batchIndex && options.batchTotal
      ? `第 ${options.batchIndex}/${options.batchTotal} 条`
      : "单条";
  priceReviewSubmittingKey.value = submitKey;
  try {
    const payload = buildSinglePriceReviewPayload(row, mode, options.overridePrice);
    const rawResponse = await withPriceReviewRowTimeout(
      runTemuClientAction(
        "goods.modify-price",
        payload,
        Math.max(10_000, Math.min(options.timeoutMs || PRICE_REVIEW_ROW_TIMEOUT_MS, PRICE_REVIEW_ROW_TIMEOUT_MS)),
      ),
      {
        row,
        mode,
        index: options.batchIndex,
        total: options.batchTotal,
        stage: "客户端执行 goods.modify-price",
        timeoutMs: options.timeoutMs,
        ownerRunId,
      },
    );
    const response = normalizeTemuActionResponse(rawResponse);
    const nextMark: PriceReviewSubmitMark = {
      status: response?.success ? "success" : "failed",
      action: mode,
      message: String(response?.message || "").trim() || (response?.success ? "提交成功" : "提交失败"),
      time: formatDateTime(new Date()),
      markInvalid: !!response?.success,
      completedLabel: mode === "confirm" ? "已核价" : mode === "reprice" ? "已重新报价" : "已不核价",
    };
    priceReviewSubmitMarks[row.rowKey] = nextMark;

    if (ownerRunId && options.persist !== false) {
      enqueuePriceReviewMark(async () => {
        const detail = await markTemuTaskRunPriceReviewRow({
          id: ownerRunId,
          rowKey: row.rowKey,
          action: mode,
          status: nextMark.status,
          message: nextMark.message,
          markInvalid: nextMark.markInvalid,
          completedLabel: nextMark.completedLabel,
          ...(Number.isFinite(options.overridePrice) ? { price: options.overridePrice } : {}),
        });
        applyTaskRunDetailIfCurrent(normalizeTemuTaskRunDetail(detail), ownerRunId);
      });
    }

    if (options.showToast) {
      if (response?.success) {
        ElMessage.success(`${actionText}成功`);
      } else {
        ElMessage.error(String(response?.message || "").trim() || `${actionText}失败`);
      }
    }

    return !!response?.success;
  } catch (error: any) {
    const nextMark: PriceReviewSubmitMark = {
      status: "failed",
      action: mode,
      message: extractRequestErrorMessage(error, `${actionText}提交失败`),
      time: formatDateTime(new Date()),
    };
    priceReviewSubmitMarks[row.rowKey] = nextMark;
    if (ownerRunId && options.persist !== false) {
      enqueuePriceReviewMark(async () => {
        await markTemuTaskRunPriceReviewRow({
          id: ownerRunId,
          rowKey: row.rowKey,
          action: mode,
          status: nextMark.status,
          message: nextMark.message,
          markInvalid: false,
          ...(Number.isFinite(options.overridePrice) ? { price: options.overridePrice } : {}),
        });
      });
    }
    if (options.showToast) {
      ElMessage.error(extractRequestErrorMessage(error, `${actionText}提交失败`));
    }
    return false;
  } finally {
    priceReviewSubmittingKey.value = "";
  }
};

const onPriceReviewSelectionChange = ({ records }: { records: PriceReviewPreviewRow[] }) => {
  selectedPriceReviewRowKeys.value = (Array.isArray(records) ? records : [])
    .filter((row) => isSelectablePriceReviewRow(row))
    .map((row) => String(row?.rowKey || "").trim())
    .filter(Boolean);
};

const submitSelectedPriceReviewRows = async (mode: "confirm" | "abandon" | "reprice") => {
  if (!props.profileId) {
    ElMessage.warning("请先选择执行环境");
    return;
  }

  if (!hasUsableSession.value) {
    ElMessage.warning("请先采集或选择一个已存储的 Temu 会话");
    return;
  }

  const rows =
    mode === "confirm"
      ? selectedSubmittablePriceReviewRows.value
      : mode === "reprice"
        ? selectedRepriceablePriceReviewRows.value
        : selectedAbandonablePriceReviewRows.value;
  if (!rows.length) {
    ElMessage.warning(
      mode === "confirm"
        ? "没有可确认核价的已选行"
        : mode === "reprice"
          ? "没有可重新报价的已选行"
          : "没有可不核价的已选行",
    );
    return;
  }

  const actionText =
    mode === "confirm" ? "批量确认核价" : mode === "reprice" ? "批量重新报价" : "批量不核价";
  if (mode === "reprice") {
    priceReviewBatchRepriceRows.value = rows;
    Object.keys(priceReviewBatchRepricePrices).forEach((rowKey) => {
      delete priceReviewBatchRepricePrices[rowKey];
    });
    rows.forEach((row) => {
      priceReviewBatchRepricePrices[row.rowKey] = formatPriceCentToYuanNumber(row.rawCurrentPrice);
    });
    priceReviewBatchRepriceVisible.value = true;
    return;
  }

  try {
    await ElMessageBox.confirm(`确认对 ${rows.length} 条记录执行${actionText}吗？`, actionText, {
      type: mode === "confirm" ? "warning" : "error",
      confirmButtonText: actionText,
      cancelButtonText: "取消",
    });
  } catch (error) {
    return;
  }

  resetPriceReviewBatchProgress(mode, rows.length);
  let successCount = 0;
  const batchToken = batchAbortToken.value;
  const ownerRunId = Number(activeTaskRunDetail.value?.id || 0);
  const batchMarks: Array<{
    rowKey: string;
    action: "confirm" | "abandon" | "reprice";
    status: "success" | "failed";
    completedLabel?: string;
    message?: string;
    markInvalid?: boolean;
  }> = [];
  try {
    for (const [index, row] of rows.entries()) {
      if (shouldAbortBatch(batchToken)) {
        break;
      }
      setPriceReviewBatchCurrent(`提交核价中：第 ${index + 1}/${rows.length} 条`, row);
      const success = await submitPriceReviewRowWithoutConfirm(row, mode, {
        batchIndex: index + 1,
        batchTotal: rows.length,
        ownerRunId,
        persist: false,
      });
      const mark = priceReviewSubmitMarks[row.rowKey];
      if (mark) {
        batchMarks.push({
          rowKey: row.rowKey,
          action: mode,
          status: mark.status,
          message: mark.message,
          markInvalid: mark.markInvalid,
          completedLabel: mark.completedLabel,
        });
      }
      if (success) {
        successCount += 1;
        priceReviewBatchSuccessCount.value += 1;
      } else {
        priceReviewBatchFailedCount.value += 1;
      }
      priceReviewBatchFinishedCount.value += 1;
    }

    if (ownerRunId && batchMarks.length) {
      const detail = await batchMarkTemuTaskRunPriceReviewRows({
        id: ownerRunId,
        items: batchMarks,
      });
      applyTaskRunDetailIfCurrent(detail, ownerRunId);
    }

    selectedPriceReviewRowKeys.value = selectedPriceReviewRowKeys.value.filter((rowKey) => {
      const mark = priceReviewSubmitMarks[rowKey];
      return !(mark?.status === "success" && mark.markInvalid);
    });
    ElMessage.success(`${actionText}完成：成功 ${successCount} 条，失败 ${rows.length - successCount} 条`);
  } finally {
    priceReviewBatchCurrentStage.value = "";
    priceReviewBatchCurrentRowText.value = "";
    priceReviewBatchSubmitting.value = false;
    priceReviewBatchSubmittingMode.value = "";
    void clearFloatingBatchProgressSilently();
  }
};

const confirmBatchRepriceRows = async () => {
  const rows = priceReviewBatchRepriceRows.value.filter((row) => isSelectablePriceReviewRow(row));
  if (!rows.length) {
    ElMessage.warning("没有可重新报价的记录");
    return;
  }

  const priceMap = new Map<string, number>();
  for (const row of rows) {
    const priceCent = parsePriceYuanToCent(priceReviewBatchRepricePrices[row.rowKey]);
    if (priceCent === null) {
      ElMessage.warning(`SKU ${row.skuId} 的报价不合法`);
      return;
    }
    priceMap.set(row.rowKey, priceCent);
  }

  resetPriceReviewBatchProgress("reprice", rows.length);
  priceReviewBatchRepriceVisible.value = false;
  let successCount = 0;
  const batchToken = batchAbortToken.value;
  const ownerRunId = Number(activeTaskRunDetail.value?.id || 0);
  const batchMarks: Array<{
    rowKey: string;
    action: "reprice";
    status: "success" | "failed";
    completedLabel?: string;
    message?: string;
    markInvalid?: boolean;
    price?: number;
  }> = [];
  try {
    for (const [index, row] of rows.entries()) {
      if (shouldAbortBatch(batchToken)) {
        break;
      }
      setPriceReviewBatchCurrent(`重新报价中：第 ${index + 1}/${rows.length} 条`, row);
      const success = await submitPriceReviewRowWithoutConfirm(row, "reprice", {
        overridePrice: priceMap.get(row.rowKey),
        batchIndex: index + 1,
        batchTotal: rows.length,
        ownerRunId,
        persist: false,
      });
      const mark = priceReviewSubmitMarks[row.rowKey];
      if (mark) {
        batchMarks.push({
          rowKey: row.rowKey,
          action: "reprice",
          status: mark.status,
          message: mark.message,
          markInvalid: mark.markInvalid,
          completedLabel: mark.completedLabel,
          price: priceMap.get(row.rowKey),
        });
      }
      if (success) {
        successCount += 1;
        priceReviewBatchSuccessCount.value += 1;
      } else {
        priceReviewBatchFailedCount.value += 1;
      }
      priceReviewBatchFinishedCount.value += 1;
    }

    if (ownerRunId && batchMarks.length) {
      const detail = await batchMarkTemuTaskRunPriceReviewRows({
        id: ownerRunId,
        items: batchMarks,
      });
      applyTaskRunDetailIfCurrent(detail, ownerRunId);
    }

    selectedPriceReviewRowKeys.value = selectedPriceReviewRowKeys.value.filter((rowKey) => {
      const mark = priceReviewSubmitMarks[rowKey];
      return !(mark?.status === "success" && mark.markInvalid);
    });
    ElMessage.success(`批量重新报价完成：成功 ${successCount} 条，失败 ${rows.length - successCount} 条`);
  } finally {
    priceReviewBatchCurrentStage.value = "";
    priceReviewBatchCurrentRowText.value = "";
    priceReviewBatchSubmitting.value = false;
    priceReviewBatchSubmittingMode.value = "";
    void clearFloatingBatchProgressSilently();
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
    syncTaskRunResultToWorkspace(detail);
    taskRunPage.value = 1;
    await loadTaskRuns();
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
      await loadTaskRuns();
    } else {
      taskRunList.value = taskRunList.value.filter((item) => item.id !== id);
      taskRunTotal.value = Math.max(0, taskRunTotal.value - 1);
    }
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
    const deletedIds = (Array.isArray(result?.ids) ? result.ids : [])
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);
    const deletedCount = Number(result?.deletedCount || deletedIds.length || 0);
    if (!deletedIds.length || deletedCount <= 0) {
      ElMessage.warning("未删除任何执行记录，请刷新后重试");
      await loadTaskRuns();
      return;
    }
    selectedTaskRunIds.value = selectedTaskRunIds.value.filter((id) => !deletedIds.includes(id));
    if (activeTaskRunId.value && deletedIds.includes(activeTaskRunId.value)) {
      activeTaskRunId.value = null;
      activeTaskRunDetail.value = null;
      taskRunDetailVisible.value = false;
    }
    if (deletedCount >= taskRunList.value.length && taskRunPage.value > 1) {
      taskRunPage.value -= 1;
    } else {
      const deletedIdSet = new Set(deletedIds);
      taskRunList.value = taskRunList.value.filter((item) => !deletedIdSet.has(item.id));
      taskRunTotal.value = Math.max(0, taskRunTotal.value - deletedCount);
    }
    await loadTaskRuns();
    ElMessage.success(`已删除 ${deletedCount} 条执行记录`);
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
  if (!requireTemuClientContext()) {
    return;
  }

  if (activeActionRunning.value) {
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
      payload: buildClientTaskPayload(selectedActionPreset.value.buildPayload(parsed, props.profileId)),
    });
    return;
  }

  runningActionKey.value = String(action.key || "").trim();
  try {
    const payload = buildClientTaskPayload(selectedActionPreset.value.buildPayload(parsed, props.profileId));
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

const fetchAllComplianceRows = async () => {
  const state = activeActionState.value;
  const action = selectedAction.value;
  if (!action || action.key !== "compliance.page-query" || !selectedActionPreset.value) {
    ElMessage.warning("请先选择合规信息查询动作");
    return;
  }
  if (!requireTemuClientContext()) {
    return;
  }

  const { valid, parsed } = validateForm();
  if (!valid) {
    ElMessage.warning("请先完善动作参数");
    return;
  }

  const pageSize = 50;
  const payload = {
    ...selectedActionPreset.value.buildPayload(parsed, props.profileId),
    clientId: props.clientId,
    pageNum: 1,
    pageSize,
    fetchAll: true,
    allPages: true,
  };

  complianceFetchingAll.value = true;
  try {
    state.lastResult = null;
    const detail = await createTemuTaskRun({
      actionKey: action.key,
      payload,
    });
    syncTaskRunResultToWorkspace(detail);
    taskRunPage.value = 1;
    activeTaskRunId.value = null;
    activeTaskRunDetail.value = null;
    taskRunDetailVisible.value = false;
    await loadTaskRuns();
    ensureTaskRunPolling();
    ElMessage.success(`已创建一键获取全部执行记录 #${detail.id}`);
  } catch (error: any) {
    ElMessage.error(extractRequestErrorMessage(error, "创建一键获取全部执行记录失败"));
  } finally {
    complianceFetchingAll.value = false;
  }
};

const fetchAllPriceReviewRows = async () => {
  const state = activeActionState.value;
  const action = selectedAction.value;
  if (!action || action.key !== "goods.price-review.list" || !selectedActionPreset.value) {
    ElMessage.warning("请先选择待核价商品列表动作");
    return;
  }
  if (!requireTemuClientContext()) {
    return;
  }

  const { valid, parsed } = validateForm();
  if (!valid) {
    ElMessage.warning("请先完善动作参数");
    return;
  }

  const pageSize = 100;
  const payload = {
    ...selectedActionPreset.value.buildPayload(parsed, props.profileId),
    clientId: props.clientId,
    pageNum: 1,
    pageSize,
    fetchAll: true,
    allPages: true,
  };

  priceReviewFetchingAll.value = true;
  try {
    state.lastResult = null;
    const detail = await createTemuTaskRun({
      actionKey: action.key,
      payload,
    });
    syncTaskRunResultToWorkspace(detail);
    taskRunPage.value = 1;
    activeTaskRunId.value = null;
    activeTaskRunDetail.value = null;
    taskRunDetailVisible.value = false;
    await loadTaskRuns();
    ensureTaskRunPolling();
    ElMessage.success(`已创建待核价一键获取全部执行记录 #${detail.id}`);
  } catch (error: any) {
    ElMessage.error(extractRequestErrorMessage(error, "创建待核价一键获取全部执行记录失败"));
  } finally {
    priceReviewFetchingAll.value = false;
  }
};

const fetchAllRealPictureRows = async () => {
  const state = activeActionState.value;
  const action = selectedAction.value;
  if (!action || action.key !== "goods.real-picture.list" || !selectedActionPreset.value) {
    ElMessage.warning("请先选择实拍图列表动作");
    return;
  }
  if (!requireTemuClientContext()) {
    return;
  }

  const { valid, parsed } = validateForm();
  if (!valid) {
    ElMessage.warning("请先完善动作参数");
    return;
  }

  const pageSize = 50;
  const payload = {
    ...selectedActionPreset.value.buildPayload(parsed, props.profileId),
    clientId: props.clientId,
    page: 1,
    pageSize,
    fetchAll: true,
    allPages: true,
  };

  realPictureFetchingAll.value = true;
  try {
    state.lastResult = null;
    const detail = await createTemuTaskRun({
      actionKey: action.key,
      payload,
    });
    syncTaskRunResultToWorkspace(detail);
    taskRunPage.value = 1;
    activeTaskRunId.value = null;
    activeTaskRunDetail.value = null;
    taskRunDetailVisible.value = false;
    await loadTaskRuns();
    ensureTaskRunPolling();
    ElMessage.success(`已创建实拍图一键获取全部执行记录 #${detail.id}`);
  } catch (error: any) {
    ElMessage.error(extractRequestErrorMessage(error, "创建实拍图一键获取全部执行记录失败"));
  } finally {
    realPictureFetchingAll.value = false;
  }
};

const fetchAllJitRows = async () => {
  const state = activeActionState.value;
  const action = selectedAction.value;
  if (!action || action.key !== "jit.list" || !selectedActionPreset.value) {
    ElMessage.warning("请先选择 JIT 列表动作");
    return;
  }
  if (!requireTemuClientContext()) {
    return;
  }

  const { valid, parsed } = validateForm();
  if (!valid) {
    ElMessage.warning("请先完善动作参数");
    return;
  }

  const pageSize = 100;
  const payload = {
    ...selectedActionPreset.value.buildPayload(parsed, props.profileId),
    clientId: props.clientId,
    pageNum: 1,
    pageSize,
    fetchAll: true,
    allPages: true,
  };

  jitFetchingAll.value = true;
  try {
    state.lastResult = null;
    const detail = await createTemuTaskRun({
      actionKey: action.key,
      payload,
    });
    syncTaskRunResultToWorkspace(detail);
    taskRunPage.value = 1;
    activeTaskRunId.value = null;
    activeTaskRunDetail.value = null;
    taskRunDetailVisible.value = false;
    await loadTaskRuns();
    ensureTaskRunPolling();
    ElMessage.success(`已创建 JIT 一键获取全部执行记录 #${detail.id}`);
  } catch (error: any) {
    ElMessage.error(extractRequestErrorMessage(error, "创建 JIT 一键获取全部执行记录失败"));
  } finally {
    jitFetchingAll.value = false;
  }
};

const fetchAllConfirmationRows = async () => {
  const state = activeActionState.value;
  const action = selectedAction.value;
  if (!action || action.key !== "goods.confirmation.list" || !selectedActionPreset.value) {
    ElMessage.warning("请先选择商品确认列表动作");
    return;
  }
  if (!requireTemuClientContext()) {
    return;
  }

  const { valid, parsed } = validateForm();
  if (!valid) {
    ElMessage.warning("请先完善动作参数");
    return;
  }

  const pageSize = Math.min(1000, Math.max(1, Number(parsed.pageSize || 100) || 100));
  const payload = {
    ...selectedActionPreset.value.buildPayload(parsed, props.profileId),
    clientId: props.clientId,
    pageNum: 1,
    pageSize,
    fetchAll: true,
    allPages: true,
  };

  confirmationFetchingAll.value = true;
  try {
    state.lastResult = null;
    const detail = await createTemuTaskRun({
      actionKey: action.key,
      payload,
    });
    syncTaskRunResultToWorkspace(detail);
    taskRunPage.value = 1;
    activeTaskRunId.value = null;
    activeTaskRunDetail.value = null;
    taskRunDetailVisible.value = false;
    await loadTaskRuns();
    ensureTaskRunPolling();
    ElMessage.success(`已创建商品确认一键获取全部执行记录 #${detail.id}`);
  } catch (error: any) {
    ElMessage.error(extractRequestErrorMessage(error, "创建商品确认一键获取全部执行记录失败"));
  } finally {
    confirmationFetchingAll.value = false;
  }
};

watch(
  selectedCategoryActions,
  () => {
    syncSelection();
  },
  { deep: true },
);

watch(actionSearchKeyword, () => {
  syncSelection();
});

watch(activeTaskRunId, () => {
  resetTaskRunDetailDialogState();
});

watch(taskRunPriceReviewPreviewRows, (rows) => {
  const selectableKeys = new Set(rows.filter((row) => isSelectablePriceReviewRow(row)).map((row) => row.rowKey));
  selectedPriceReviewRowKeys.value = selectedPriceReviewRowKeys.value.filter((rowKey) =>
    selectableKeys.has(rowKey),
  );
  priceReviewPreviewGridRef.value?.clearCheckboxRow?.();
});

watch(taskRunJitRows, (rows) => {
  const selectableKeys = new Set(rows.filter((row) => isSelectableJitRow(row)).map((row) => row.rowKey));
  selectedJitRowKeys.value = selectedJitRowKeys.value.filter((rowKey) => selectableKeys.has(rowKey));
  jitPreviewGridRef.value?.clearCheckboxRow?.();
});

watch(taskRunRealPictureRows, (rows) => {
  const selectableKeys = new Set(rows.filter((row) => isSelectableRealPictureRow(row)).map((row) => row.rowKey));
  selectedRealPictureRowKeys.value = selectedRealPictureRowKeys.value.filter((rowKey) =>
    selectableKeys.has(rowKey),
  );
  realPicturePreviewGridRef.value?.clearCheckboxRow?.();
});

watch(visibleTaskRunComplianceRows, (rows) => {
  const visibleKeys = new Set(rows.map((row) => row.rowKey));
  selectedComplianceRowKeys.value = selectedComplianceRowKeys.value.filter((rowKey) =>
    visibleKeys.has(rowKey),
  );
});

watch(taskRunConfirmationRows, (rows) => {
  const selectableKeys = new Set(rows.filter((row) => !row.confirmed).map((row) => row.rowKey));
  selectedConfirmationRowKeys.value = selectedConfirmationRowKeys.value.filter((rowKey) =>
    selectableKeys.has(rowKey),
  );
  confirmationPreviewGridRef.value?.clearCheckboxRow?.();
});

watch(
  selectedComplianceFields,
  (fields) => {
    const validKeys = new Set(fields.map((field) => field.key));
    Object.keys(complianceEditorForm).forEach((key) => {
      if (!validKeys.has(key)) {
        delete complianceEditorForm[key];
      }
    });
    fields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(complianceEditorForm, field.key)) {
        return;
      }
      complianceEditorForm[field.key] = field.defaultValue ?? null;
    });
  },
  { immediate: true },
);

watch(
  () => `${taskRunActionKeyFilter.value}|${selectedAction.value?.key || ""}|${onlyCurrentActionRuns.value}`,
  () => {
    if (onlyCurrentActionRuns.value && selectedActionKey.value && !selectedAction.value) {
      return;
    }
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

watch(
  liveFloatingBatchProgressItems,
  () => {
    syncFloatingBatchProgressToServer();
  },
  { deep: true },
);

watch(
  () => props.profileId,
  () => {
    void loadFloatingBatchProgressFromServer();
  },
);

watch([taskRunDetailVisible, taskRunDetailLoading], ([visible, loading]) => {
  if (visible || loading) {
    return;
  }

  resetTaskRunDetailDialogState();
  activeTaskRunId.value = null;
  activeTaskRunDetail.value = null;
});

onMounted(() => {
  void loadCatalog();
  void loadFloatingBatchProgressFromServer();
});

onBeforeUnmount(() => {
  if (batchProgressSyncTimer !== null) {
    window.clearTimeout(batchProgressSyncTimer);
    batchProgressSyncTimer = null;
  }
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
  position: relative;
  gap: 10px;
}

.temu-workspace__preview-table {
  width: 100%;
}

.temu-workspace__preview-table :deep(.temu-workspace__price-review-row--processed) {
  opacity: 0.48;
}

.temu-workspace__preview-table :deep(.temu-workspace__price-review-row--processed:hover) {
  opacity: 0.72;
}

.temu-workspace__preview-image {
  width: 86px;
  height: 86px;
  overflow: hidden;
  border-radius: 8px;
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

.temu-workspace__compliance-status-list {
  display: grid;
  gap: 4px;
  align-items: start;
}

.temu-workspace__compliance-status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  line-height: 20px;
}

.temu-workspace__compliance-status-name {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.temu-workspace__compliance-status-item small {
  flex: 0 0 auto;
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.temu-workspace__row-actions--right {
  justify-content: flex-end;
}

.temu-workspace__compliance-dialog-body {
  display: grid;
  gap: 14px;
}

.temu-workspace__compliance-dialog-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.temu-workspace__compliance-editor-grid {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  gap: 14px;
  min-height: 420px;
}

.temu-workspace__compliance-picker {
  display: grid;
  align-content: start;
  gap: 8px;
}

.temu-workspace__compliance-picker-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 5px 8px;
  width: 100%;
  padding: 9px 10px;
  text-align: left;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 7px;
  background: var(--el-bg-color);
  cursor: pointer;
}

.temu-workspace__compliance-picker-item.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.temu-workspace__compliance-picker-item span,
.temu-workspace__compliance-picker-item small {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.temu-workspace__compliance-picker-item small {
  grid-column: 1 / -1;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.temu-workspace__compliance-editor-panel {
  display: grid;
  align-content: start;
  gap: 12px;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
}

.temu-workspace__compliance-editor-title,
.temu-workspace__compliance-subtask,
.temu-workspace__compliance-source-grid {
  display: flex;
  align-items: center;
  gap: 8px;
}

.temu-workspace__compliance-editor-title {
  justify-content: space-between;
}

.temu-workspace__compliance-subtasks {
  display: grid;
  gap: 8px;
}

.temu-workspace__compliance-subtask {
  justify-content: space-between;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-bg-color);
}

.temu-workspace__compliance-subtask span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.temu-workspace__compliance-subtask small {
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.temu-workspace__compliance-source-grid {
  align-items: stretch;
}

.temu-workspace__compliance-source-grid div {
  display: grid;
  gap: 4px;
  min-width: 0;
  flex: 1;
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-bg-color);
}

.temu-workspace__compliance-source-grid span {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.temu-workspace__price-review-identity {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 2px 0;
}

.temu-workspace__price-review-identity div {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.temu-workspace__price-review-identity span {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.temu-workspace__price-review-identity strong {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.temu-workspace__price-review-pricing {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 8px;
  text-align: left;
  border: 1px solid var(--price-review-risk-border, var(--el-border-color-lighter));
  border-radius: 10px;
  background:
    linear-gradient(135deg, var(--price-review-risk-gradient, transparent), transparent 72%),
    var(--price-review-risk-soft, var(--el-fill-color-extra-light));
}

.temu-workspace__price-review-prices {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.temu-workspace__price-review-prices div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.temu-workspace__price-review-prices span {
  color: var(--el-text-color-secondary);
  font-size: 10px;
  line-height: 1.2;
}

.temu-workspace__price-review-prices strong {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 750;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.temu-workspace__price-review-diff strong {
  font-size: 16px;
  color: var(--price-review-risk-color, var(--el-text-color-primary));
}

.temu-workspace__price-review-meter {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
  gap: 10px;
}

.temu-workspace__price-review-meter strong,
.temu-workspace__price-review-meter em {
  display: inline-flex;
  align-items: center;
  height: 24px;
  border-radius: 999px;
  white-space: nowrap;
}

.temu-workspace__price-review-meter strong {
  min-width: 82px;
  justify-content: center;
  padding: 0 10px;
  font-size: 15px;
  font-weight: 850;
  line-height: 24px;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.65);
  box-shadow: inset 0 0 0 1px currentColor;
}

.temu-workspace__price-review-meter em {
  overflow: hidden;
  max-width: 170px;
  padding: 0 8px;
  color: var(--price-review-risk-text, var(--el-text-color-primary));
  font-size: 11px;
  font-style: normal;
  font-weight: 650;
  line-height: 24px;
  text-overflow: ellipsis;
}

.temu-workspace__price-review-meter strong {
  background: var(--price-review-risk-badge, var(--el-fill-color-blank));
  color: var(--price-review-risk-color, var(--el-text-color-primary));
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
  padding: 10px 16px 16px;
}

.temu-workspace__task-dialog-body {
  min-height: 180px;
}

.temu-workspace__task-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
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

.temu-workspace__task-head-side {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px 10px;
  width: 100%;
  min-width: 0;
}

.temu-workspace__task-meta-compact {
  display: grid;
  grid-template-columns: repeat(6, minmax(92px, auto));
  gap: 4px 8px;
  justify-content: end;
  flex: 1 1 auto;
  padding: 4px 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
}

.temu-workspace__task-meta-compact div {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
  min-width: 0;
  white-space: nowrap;
}

.temu-workspace__task-meta-compact span {
  flex: 0 0 auto;
  color: var(--el-text-color-secondary);
  font-size: 10px;
}

.temu-workspace__task-meta-compact strong {
  overflow: hidden;
  max-width: 150px;
  color: var(--el-text-color-primary);
  font-size: 11px;
  font-weight: 650;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.temu-workspace__task-detail-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.temu-workspace__section-title-main,
.temu-workspace__price-review-batch-actions {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.temu-workspace__price-review-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.temu-workspace__price-review-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.temu-workspace__price-review-batch-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.temu-workspace__price-review-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.temu-workspace__price-review-filter {
  width: 220px;
}

.temu-workspace__price-review-filter-number {
  width: 128px;
}

.temu-workspace__jit-stock-input {
  width: 132px;
}

.temu-workspace__jit-stock-field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  white-space: nowrap;
}

.temu-workspace__jit-status-filter {
  width: 150px;
}

.temu-workspace__price-review-batch-stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.temu-workspace__floating-progress {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2200;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(380px, calc(100vw - 32px));
  max-height: min(70vh, 560px);
  overflow: auto;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
}

.temu-workspace__floating-progress.is-collapsed {
  width: min(210px, calc(100vw - 32px));
  max-height: none;
  overflow: hidden;
  padding: 6px 8px;
  border-radius: 6px;
}

.temu-workspace__floating-progress.is-collapsed .temu-workspace__floating-progress-head {
  gap: 6px;
}

.temu-workspace__floating-progress.is-collapsed .temu-workspace__floating-progress-head strong {
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.temu-workspace__floating-progress.is-collapsed .temu-workspace__floating-progress-actions {
  gap: 4px;
}

.temu-workspace__floating-progress.is-collapsed .temu-workspace__floating-progress-actions span {
  display: none;
}

.temu-workspace__floating-progress.is-collapsed .el-button {
  height: 22px;
  padding: 0 4px;
  font-size: 12px;
}

.temu-workspace__floating-progress-head,
.temu-workspace__floating-progress-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.temu-workspace__floating-progress-head strong {
  color: var(--el-text-color-primary);
  font-size: 13px;
}

.temu-workspace__floating-progress-head--sub strong {
  font-size: 12px;
}

.temu-workspace__floating-progress-actions {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 6px;
  min-width: 0;
}

.temu-workspace__floating-progress-head span,
.temu-workspace__floating-progress-meta span {
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.temu-workspace__floating-progress-actions span {
  max-width: 190px;
}

.temu-workspace__floating-progress-item {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.temu-workspace__floating-progress-item:first-of-type {
  padding-top: 0;
  border-top: 0;
}

.temu-workspace__batch-reprice-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 650;
}

.temu-workspace__batch-reprice-head small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 400;
}

.temu-workspace__batch-reprice-identity {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.temu-workspace__batch-reprice-identity strong,
.temu-workspace__batch-reprice-identity span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.temu-workspace__batch-reprice-identity strong {
  color: var(--el-text-color-primary);
  font-size: 12px;
}

.temu-workspace__batch-reprice-identity span {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.temu-workspace__batch-reprice-input {
  width: 132px;
}

.temu-task-log-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

.temu-task-log-list--popover {
  max-height: 520px;
  overflow: auto;
}

.temu-task-log-popover__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.temu-task-log-popover__head strong {
  color: var(--el-text-color-primary);
  font-size: 13px;
}

.temu-task-json-popover__content {
  max-height: 560px;
  overflow: auto;
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

  .temu-workspace__search {
    width: 100%;
  }

  .temu-workspace__toolbar-side,
  .temu-workspace__result-tools,
  .temu-workspace__task-tools,
  .temu-workspace__runner {
    width: 100%;
  }

  .temu-workspace__task-head-side {
    align-items: stretch;
    max-width: none;
    width: 100%;
  }

  .temu-workspace__task-meta-compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    justify-content: stretch;
  }

  .temu-workspace__task-meta-compact div {
    justify-content: space-between;
  }

  .temu-workspace__task-meta-compact strong {
    max-width: 68vw;
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
