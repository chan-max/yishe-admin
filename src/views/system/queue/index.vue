<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="queue-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col
                class="list-page-search-form__col--base"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="6"
                :xl="6"
              >
                <el-form-item label="任务 ID">
                  <el-input
                    v-model="queryParams.id"
                    size="small"
                    clearable
                    placeholder="留空则查询全部"
                    @keyup.enter="getList"
                  />
                </el-form-item>
              </el-col>
              <el-col
                class="list-page-search-form__col--base"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="6"
                :xl="6"
              >
                <el-form-item label="任务类型">
                  <el-select
                    v-model="queryParams.type"
                    size="small"
                    clearable
                    placeholder="全部类型"
                    @change="getList"
                    @clear="handleTypeClear"
                  >
                    <el-option
                      v-for="opt in publishTaskTypeOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col
                class="list-page-search-form__col--narrow"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="5"
                :xl="4"
              >
                <el-form-item label="任务状态">
                  <el-select
                    v-model="queryParams.status"
                    size="small"
                    clearable
                    placeholder="全部状态"
                    @change="getList"
                  >
                    <el-option label="待处理" value="pending" />
                    <el-option label="等待中" value="waiting" />
                    <el-option label="处理中" value="processing" />
                    <el-option label="已完成" value="completed" />
                    <el-option label="失败" value="failed" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col
                class="list-page-search-form__col--wide"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="7"
                :xl="8"
              >
                <el-form-item label="时间排序">
                  <el-select
                    v-model="queryParams.sortType"
                    size="small"
                    placeholder="请选择排序"
                    @change="handleSortTypeChange"
                  >
                    <el-option label="创建时间倒序" value="createdAt_DESC" />
                    <el-option label="创建时间正序" value="createdAt_ASC" />
                    <el-option label="更新时间倒序" value="updatedAt_DESC" />
                    <el-option label="更新时间正序" value="updatedAt_ASC" />
                    <el-option label="完成时间倒序" value="processedAt_DESC" />
                    <el-option label="完成时间正序" value="processedAt_ASC" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button
                size="small"
                type="primary"
                :icon="Search"
                :loading="loading"
                @click="getList"
                >搜索</el-button
              >
              <el-button size="small" type="primary" :icon="Plus" @click="handleAdd"
                >新增任务</el-button
              >
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                :disabled="!ids.length"
                @click="handleDelete(null)"
              >
                批量删除
              </el-button>
              <el-button
                size="small"
                type="warning"
                :disabled="!ids.length"
                :loading="batchResetPendingLoading"
                @click="handleBatchResetPublishTasksToPending"
              >
                批量重置为未运行
              </el-button>
            </div>
          </el-form>
        </div>
      </template>

      <template #table>
        <div class="queue-page__main">
          <div class="queue-page__stats-bar">
            <div class="queue-stats-pill queue-stats-pill--pending">
              <span class="queue-stats-pill__label">待处理</span>
              <span class="queue-stats-pill__value">{{ stats.pending }}</span>
            </div>
            <div class="queue-stats-pill queue-stats-pill--processing">
              <span class="queue-stats-pill__label">处理中</span>
              <span class="queue-stats-pill__value">{{ stats.processing }}</span>
            </div>
            <div class="queue-stats-pill queue-stats-pill--completed">
              <span class="queue-stats-pill__label">已完成</span>
              <span class="queue-stats-pill__value">{{ stats.completed }}</span>
            </div>
            <div class="queue-stats-pill queue-stats-pill--failed">
              <span class="queue-stats-pill__label">失败</span>
              <span class="queue-stats-pill__value">{{ stats.failed }}</span>
            </div>
            <div class="queue-stats-pill">
              <span class="queue-stats-pill__label">总计</span>
              <span class="queue-stats-pill__value">{{ stats.total }}</span>
            </div>

            <div v-if="showPublishDispatchPanel" class="queue-dispatch-panel">
              <div class="queue-dispatch-panel__main">
                <span class="queue-dispatch-panel__title">自动制作</span>
                <span
                  class="queue-dispatch-panel__status"
                  :class="publishTaskAutoDispatchStatusClass"
                >
                  <span class="queue-dispatch-panel__status-dot" />
                  <span>{{ publishTaskAutoDispatchStatusText }}</span>
                </span>
                <div
                  class="queue-dispatch-panel__binding"
                  :class="publishTaskAutoDispatchTargetClass"
                >
                  <span class="queue-dispatch-panel__binding-label">目标</span>
                  <span class="queue-dispatch-panel__binding-value">
                    {{ publishTaskAutoDispatchTargetText }}
                  </span>
                </div>
                <div
                  class="queue-dispatch-panel__runtime"
                  :class="`is-${publishTaskSchedulerIndicator.tone}`"
                >
                  <span class="queue-dispatch-panel__runtime-dot" />
                  <span>{{ publishTaskSchedulerIndicator.text }}</span>
                  <span v-if="publishTaskSchedulerMeta" class="queue-dispatch-panel__runtime-meta">
                    {{ publishTaskSchedulerMeta }}
                  </span>
                </div>
                <span
                  v-if="publishTaskAutoDispatchTargetHint"
                  class="queue-dispatch-panel__binding-meta"
                >
                  {{ publishTaskAutoDispatchTargetHint }}
                </span>
                <span class="queue-dispatch-panel__filter-wrap">
                  <span class="queue-dispatch-panel__filter">
                    {{ publishTaskAutoDispatchFilterSummary }}
                  </span>
                  <span class="queue-dispatch-panel__filter-popover">
                    {{ publishTaskAutoDispatchFilterDetail }}
                  </span>
                </span>
              </div>
              <el-button
                size="small"
                plain
                :type="publishTaskAutoDispatchEnabled ? 'danger' : 'success'"
                :loading="publishTaskAutoDispatchLoading"
                @click="handleTogglePublishAutoDispatch(!publishTaskAutoDispatchEnabled)"
              >
                {{ publishTaskAutoDispatchEnabled ? "关闭" : "开启" }}
              </el-button>
            </div>
          </div>

          <div
            class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat"
          >
            <div class="list-page-table-panel__body">
              <div class="common-table">
                <vxe-grid
                  v-bind="gridOptions"
                  :data="dataSource"
                  :loading="loading"
                  @checkbox-change="checkboxChange"
                  @checkbox-all="checkboxAllChange"
                >
                  <template #statusDefaultSlot="{ row }">
                    <el-tag :type="getStatusType(row.status)">
                      {{ getStatusText(row.status) }}
                    </el-tag>
                  </template>

                  <template #executionStatusDefaultSlot="{ row }">
                    <el-tooltip
                      :disabled="!getExecutionStatusInfo(row).reason"
                      :content="getExecutionStatusInfo(row).reason || ''"
                      placement="top"
                    >
                      <el-tag
                        v-if="getExecutionStatusInfo(row).type"
                        :type="getExecutionStatusInfo(row).type"
                        size="small"
                        effect="plain"
                      >
                        {{ getExecutionStatusInfo(row).text }}
                      </el-tag>
                      <span v-else class="text-gray-400 text-sm">-</span>
                    </el-tooltip>
                  </template>

                  <template #dispatchTargetDefaultSlot="{ row }">
                    <div class="queue-dispatch-target-cell">
                      <div class="queue-dispatch-target-cell__main">
                        {{ getQueueTaskDispatchTargetText(row) }}
                      </div>
                      <div
                        v-if="getQueueTaskDispatchTargetHint(row)"
                        class="queue-dispatch-target-cell__hint"
                      >
                        {{ getQueueTaskDispatchTargetHint(row) }}
                      </div>
                    </div>
                  </template>

                  <template #dataDefaultSlot="{ row }">
                    <el-button type="primary" link size="small" @click="handleViewData(row)">
                      查看数据
                    </el-button>
                  </template>

                  <template #runtimeLogsDefaultSlot="{ row }">
                    <div class="queue-runtime-log-cell">
                      <el-button
                        type="primary"
                        link
                        size="small"
                        class="queue-runtime-log-cell__trigger"
                        @click="handleViewRuntimeLogs(row)"
                      >
                        查看日志
                      </el-button>
                    </div>
                  </template>

                  <template #operationDefaultSlot="{ row }">
                    <div class="queue-operation-cell">
                      <el-dropdown
                        class="operation-dropdown"
                        placement="bottom-end"
                        @command="(command) => handleOperationCommand(String(command), row)"
                      >
                        <el-button
                          type="primary"
                          link
                          size="small"
                          class="operation-trigger-button"
                        >
                          操作
                        </el-button>
                        <template #dropdown>
                          <el-dropdown-menu class="operation-menu-compact">
                            <el-dropdown-item
                              v-if="isPublishTaskRow(row)"
                              :command="'startExecution'"
                              :disabled="!canStartPublishExecution(row)"
                            >
                              开始执行
                            </el-dropdown-item>
                            <el-dropdown-item
                              v-if="String(row.type || '').startsWith('publish-product-')"
                              :command="'regenerate'"
                              :disabled="row.status === 'processing'"
                            >
                              重新生成
                            </el-dropdown-item>
                            <el-dropdown-item
                              v-if="isPublishTaskRow(row)"
                              :command="'stopExecution'"
                              :disabled="!canStopPublishExecution(row)"
                            >
                              停止任务
                            </el-dropdown-item>
                            <el-dropdown-item
                              v-if="isPublishTaskRow(row)"
                              :command="'resetExecutionState'"
                              :disabled="!canResetPublishExecution(row)"
                            >
                              重置为未运行
                            </el-dropdown-item>
                            <el-dropdown-item :command="'updateData'">更新数据</el-dropdown-item>
                            <el-dropdown-item v-if="!isPublishTaskRow(row)" :command="'editStatus'">
                              标记状态
                            </el-dropdown-item>
                            <el-dropdown-item
                              v-if="userStore.user?.isAdmin"
                              :command="'delete'"
                              divided
                              class="operation-menu-item--danger"
                            >
                              删除
                            </el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>
                  </template>
                </vxe-grid>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #pagination>
        <div
          class="list-page-panel list-page-panel--flat list-page-table-panel__pagination list-page-table-panel__pagination--flat"
        >
          <Pagination
            :total="total"
            v-model:page="queryParams.currentPage"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </template>
    </ListPageLayout>

    <!-- 新增任务对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :center="false"
      align-center
      @close="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="任务类型" prop="type">
          <el-select
            v-model="formData.type"
            placeholder="请选择任务类型"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="opt in publishTaskTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="2"
            placeholder="请输入任务描述（可选）"
          />
        </el-form-item>
        <el-form-item label="任务数据" prop="data">
          <el-input
            v-model="formData.dataStr"
            type="textarea"
            :rows="6"
            placeholder='请输入JSON格式的任务数据，例如：{"key": "value"}'
          />
        </el-form-item>
        <el-form-item label="延迟(秒)" prop="delay">
          <el-input-number
            v-model="formData.delay"
            :min="0"
            placeholder="延迟执行时间（秒）"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :disabled="submitLoading" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑状态对话框 -->
    <el-dialog
      v-model="statusDialogVisible"
      title="修改任务状态"
      width="500px"
      :center="false"
      align-center
    >
      <el-form
        ref="statusFormRef"
        :model="statusFormData"
        :rules="statusFormRules"
        label-width="100px"
      >
        <el-form-item label="任务ID">
          <el-input v-model="statusFormData.id" disabled />
        </el-form-item>
        <el-form-item label="当前状态">
          <el-tag :type="getStatusType(statusFormData.status)">
            {{ getStatusText(statusFormData.status) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="新状态" prop="newStatus">
          <el-select
            v-model="statusFormData.newStatus"
            placeholder="请选择新状态"
            style="width: 100%"
          >
            <el-option label="待处理" value="pending" />
            <el-option label="等待中" value="waiting" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="错误信息" prop="error" v-if="statusFormData.newStatus === 'failed'">
          <el-input
            v-model="statusFormData.error"
            type="textarea"
            :rows="3"
            placeholder="请输入错误信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :disabled="statusSubmitLoading" @click="statusDialogVisible = false"
            >取消</el-button
          >
          <el-button type="primary" :loading="statusSubmitLoading" @click="handleStatusSubmit"
            >确定</el-button
          >
        </div>
      </template>
    </el-dialog>

    <!-- 查看数据对话框 -->
    <el-dialog
      v-model="dataDialogVisible"
      title="任务数据"
      fullscreen
      :center="false"
      align-center
      class="queue-json-dialog"
    >
      <div v-loading="dataDialogLoading" class="queue-json-viewer-shell">
        <div class="queue-json-panel queue-json-panel--preview">
          <div class="queue-json-panel__header">
            <span class="queue-json-panel__title">JSON 预览</span>
          </div>
          <div class="queue-json-panel__body queue-json-panel__body--viewer">
            <pre class="queue-json-raw">{{ formatRawJson(currentTaskData) }}</pre>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dataDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="runtimeLogDialogVisible"
      fullscreen
      :center="false"
      align-center
      class="queue-runtime-dialog"
    >
      <div v-loading="runtimeLogDialogLoading" class="queue-runtime-window">
        <div class="queue-runtime-window__summary">
          <div class="queue-runtime-window__summary-item">
            <span class="queue-runtime-window__summary-label">任务 ID</span>
            <span class="queue-runtime-window__summary-value">{{ currentTaskId || "-" }}</span>
          </div>
          <div class="queue-runtime-window__summary-item">
            <span class="queue-runtime-window__summary-label">平台</span>
            <span class="queue-runtime-window__summary-value">{{
              currentTaskRuntime?.platform || "-"
            }}</span>
          </div>
          <div class="queue-runtime-window__summary-item">
            <span class="queue-runtime-window__summary-label">日志数</span>
            <span class="queue-runtime-window__summary-value">{{
              currentTaskRuntime?.logCount ?? currentTaskLogs.length
            }}</span>
          </div>
          <div class="queue-runtime-window__summary-item">
            <span class="queue-runtime-window__summary-label">最后更新</span>
            <span class="queue-runtime-window__summary-value">{{
              formatLogTimestamp(currentTaskRuntime?.updatedAt || currentTaskRuntime?.lastLogTime)
            }}</span>
          </div>
        </div>

        <div class="queue-runtime-window__body">
          <div v-if="currentTaskLogs.length" class="queue-runtime-console">
            <div
              v-for="(log, index) in currentTaskLogs"
              :key="log.id || `${log.timestamp}-${index}`"
              class="queue-runtime-console__line"
              :data-level="normalizeLogLevel(log.level)"
            >
              <div class="queue-runtime-console__prompt">
                <span class="queue-runtime-console__user">yishe@admin:</span>
                <span class="queue-runtime-console__location">~</span>
                <span class="queue-runtime-console__time">{{
                  formatLogTimestamp(log.time || log.timestamp)
                }}</span>
              </div>
              <div class="queue-runtime-console__content">
                <div class="queue-runtime-console__message">{{ log.message || "-" }}</div>
                <div v-if="hasLogData(log)" class="queue-runtime-console__actions">
                  <el-button
                    type="primary"
                    link
                    size="small"
                    class="queue-runtime-console__detail-trigger"
                    @click="openRuntimeLogData(log, index)"
                  >
                    查看详细数据
                  </el-button>
                </div>
              </div>
            </div>
            <div class="queue-runtime-console__cursor-row">
              <span class="queue-runtime-console__user">yishe@admin:</span>
              <span class="queue-runtime-console__location">~</span>
              <span class="queue-runtime-console__cursor" />
            </div>
          </div>
          <div v-else class="queue-runtime-console queue-runtime-console--empty">
            <div class="queue-runtime-console__empty">
              <span class="queue-runtime-console__user">yishe@admin:</span>
              <span class="queue-runtime-console__location">~</span>
              <span class="queue-runtime-console__message">暂无匹配日志</span>
              <span class="queue-runtime-console__cursor" />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="queue-runtime-dialog__footer">
          <div class="queue-runtime-dialog__footer-meta">
            <span>运行日志窗口</span>
            <span>{{ currentTaskRuntime?.logCount ?? currentTaskLogs.length }} 条记录</span>
          </div>
          <div class="queue-runtime-dialog__footer-actions">
            <el-button @click="refreshRuntimeLogDialogDetail()">刷新日志</el-button>
            <el-button @click="runtimeLogDialogVisible = false">关闭</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="runtimeLogDataDialogVisible"
      width="860px"
      :center="false"
      align-center
      class="queue-runtime-data-dialog"
    >
      <template #header>
        <div class="queue-runtime-data-dialog__header">
          <div class="queue-runtime-data-dialog__title">日志详细数据</div>
          <div class="queue-runtime-data-dialog__meta">
            <span>{{ runtimeLogDataDialogMeta.time || "-" }}</span>
            <span>{{ runtimeLogDataDialogMeta.level }}</span>
          </div>
          <div class="queue-runtime-data-dialog__message">
            {{ runtimeLogDataDialogMeta.message || "-" }}
          </div>
        </div>
      </template>
      <div class="queue-runtime-data-dialog__body">
        <pre class="queue-runtime-data-dialog__raw">{{ runtimeLogDataDialogText }}</pre>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="runtimeLogDataDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 更新数据对话框 -->
    <el-dialog
      v-model="dataUpdateDialogVisible"
      title="更新数据"
      fullscreen
      :center="false"
      align-center
      @close="resetDataUpdateForm"
    >
      <div class="queue-json-editor-layout">
        <div class="queue-json-panel queue-json-panel--preview">
          <div class="queue-json-panel__header">
            <span class="queue-json-panel__title">实时预览</span>
            <span class="queue-json-panel__desc">左侧只读，随右侧输入同步变化</span>
          </div>
          <div class="queue-json-panel__body queue-json-panel__body--viewer">
            <pre class="queue-json-raw">{{ formatRawJson(parsedUpdateData) }}</pre>
          </div>
        </div>
        <div class="queue-json-panel queue-json-panel--editor">
          <div class="queue-json-panel__header">
            <span class="queue-json-panel__title">JSON 编辑</span>
            <span class="queue-json-panel__desc">请输入完整 JSON 字符串</span>
          </div>
          <div class="queue-json-panel__body queue-json-panel__body--editor">
            <el-input
              v-model="dataUpdateFormData.dataStr"
              type="textarea"
              class="queue-json-textarea"
              :input-style="{
                height: '100%',
                resize: 'none',
                fontFamily: 'Monaco, Menlo, Consolas, monospace',
              }"
              placeholder="请输入完整的 JSON 字符串格式的数据"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button :disabled="dataUpdateSubmitting" @click="dataUpdateDialogVisible = false"
            >取消</el-button
          >
          <el-button type="primary" :loading="dataUpdateSubmitting" @click="handleDataUpdateSubmit"
            >确认</el-button
          >
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="publishDispatchDialogVisible"
      title="开始执行发布任务"
      width="1220px"
      :center="false"
      align-center
      class="publish-dispatch-dialog"
      @open="handleOpenPublishDispatchDialog"
    >
      <div class="publish-dispatch-dialog__body">
        <div
          v-loading="publishDispatchDialogLoading"
          :element-loading-text="DISPATCH_DIALOG_LOADING_TEXT"
          class="publish-dispatch-dialog__panel"
        >
          <div class="publish-dispatch-dialog__panel-title">浏览器自动化节点</div>
          <div
            v-if="!publishDispatchDialogLoading && dispatchAvailableRows.length"
            class="publish-dispatch-dialog__table"
          >
            <el-table
              :data="dispatchAvailableRows"
              border
              size="small"
              row-key="optionKey"
              class="publish-dispatch-dialog__table-main"
              :row-class-name="getDispatchOptionRowClassName"
              @row-click="handleDispatchOptionRowClick"
            >
              <el-table-column label="选择" width="56" align="center">
                <template #default="{ row }">
                  <el-radio
                    :value="row.optionKey"
                    v-model="selectedDispatchOptionKey"
                    :disabled="!row.selectable"
                    @click.stop
                  />
                </template>
              </el-table-column>
              <el-table-column label="客户端节点" min-width="124" show-overflow-tooltip>
                <template #default="{ row }">
                  <div class="publish-dispatch-dialog__primary">{{ row.clientLabel }}</div>
                </template>
              </el-table-column>
              <el-table-column label="在线" width="76" align="center">
                <template #default="{ row }">
                  <span
                    class="publish-dispatch-dialog__state-text"
                    :class="resolveDispatchStatusTextClass(row.onlineTag.type)"
                  >
                    {{ row.onlineTag.text }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="服务" width="82" align="center">
                <template #default="{ row }">
                  <span
                    class="publish-dispatch-dialog__state-text"
                    :class="resolveDispatchStatusTextClass(row.serviceTag.type)"
                  >
                    {{ row.serviceTag.text }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="模式" width="76" align="center">
                <template #default="{ row }">
                  <span
                    class="publish-dispatch-dialog__state-text"
                    :class="resolveDispatchStatusTextClass(row.runtimeModeTag.type)"
                  >
                    {{ row.runtimeModeTag.text }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column
                prop="profileLabel"
                label="支持环境"
                min-width="120"
                show-overflow-tooltip
              />
              <el-table-column label="执行" width="76" align="center">
                <template #default="{ row }">
                  <span
                    class="publish-dispatch-dialog__state-text"
                    :class="resolveDispatchStatusTextClass(row.profileTag.type)"
                  >
                    {{ row.profileTag.text }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column
                prop="description"
                label="说明"
                min-width="180"
                show-overflow-tooltip
              />
            </el-table>
          </div>
          <div v-else class="publish-dispatch-dialog__empty">
            当前没有可执行的浏览器自动化节点。
          </div>
        </div>
      </div>
      <template #footer>
        <div class="publish-dispatch-dialog__footer">
          <el-button
            :disabled="publishDispatchSubmitting"
            @click="publishDispatchDialogVisible = false"
            >取消</el-button
          >
          <el-button
            type="primary"
            :loading="publishDispatchSubmitting"
            :disabled="!canConfirmPublishDispatch"
            @click="handleConfirmPublishDispatch"
          >
            开始执行
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="autoDispatchTargetDialogVisible"
      title="自动执行设置"
      width="1220px"
      :center="false"
      align-center
      class="publish-dispatch-dialog"
      @open="handleOpenAutoDispatchTargetDialog"
    >
      <div class="publish-dispatch-dialog__body">
        <div class="publish-dispatch-dialog__panel publish-dispatch-filter-panel">
          <div class="publish-dispatch-dialog__panel-title">任务过滤</div>
          <el-form
            label-width="72px"
            size="small"
            class="publish-dispatch-filter-form"
          >
            <el-form-item label="任务类型">
              <el-select
                v-model="autoDispatchFilterForm.taskTypes"
                multiple
                collapse-tags
                collapse-tags-tooltip
                clearable
                filterable
                placeholder="全部发布任务类型"
              >
                <el-option
                  v-for="opt in publishTaskTypeOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="创建时间">
              <el-date-picker
                v-model="autoDispatchFilterDateRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                clearable
                class="publish-dispatch-filter-form__date"
              />
            </el-form-item>
            <el-form-item label="包含词">
              <el-input
                v-model="autoDispatchFilterForm.includeKeywordsText"
                clearable
                placeholder="多个关键词用逗号或换行分隔"
              />
            </el-form-item>
            <el-form-item label="排除词">
              <el-input
                v-model="autoDispatchFilterForm.excludeKeywordsText"
                clearable
                placeholder="命中这些关键词的任务不自动执行"
              />
            </el-form-item>
          </el-form>
        </div>
        <div
          v-loading="autoDispatchTargetDialogLoading"
          :element-loading-text="DISPATCH_DIALOG_LOADING_TEXT"
          class="publish-dispatch-dialog__panel"
        >
          <div class="publish-dispatch-dialog__panel-title">执行环境</div>
          <div
            v-if="!autoDispatchTargetDialogLoading && autoDispatchRows.length"
            class="publish-dispatch-dialog__table"
          >
            <el-table
              :data="autoDispatchRows"
              border
              size="small"
              row-key="optionKey"
              class="publish-dispatch-dialog__table-main"
              :row-class-name="getDispatchOptionRowClassName"
              @row-click="handleAutoDispatchOptionRowClick"
            >
              <el-table-column label="选择" width="56" align="center">
                <template #default="{ row }">
                  <el-radio
                    :value="row.optionKey"
                    v-model="selectedAutoDispatchOptionKey"
                    :disabled="!row.selectable"
                    @click.stop
                  />
                </template>
              </el-table-column>
              <el-table-column label="客户端节点" min-width="124" show-overflow-tooltip>
                <template #default="{ row }">
                  <div class="publish-dispatch-dialog__primary">{{ row.clientLabel }}</div>
                </template>
              </el-table-column>
              <el-table-column label="在线" width="76" align="center">
                <template #default="{ row }">
                  <span
                    class="publish-dispatch-dialog__state-text"
                    :class="resolveDispatchStatusTextClass(row.onlineTag.type)"
                  >
                    {{ row.onlineTag.text }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="服务" width="82" align="center">
                <template #default="{ row }">
                  <span
                    class="publish-dispatch-dialog__state-text"
                    :class="resolveDispatchStatusTextClass(row.serviceTag.type)"
                  >
                    {{ row.serviceTag.text }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="模式" width="76" align="center">
                <template #default="{ row }">
                  <span
                    class="publish-dispatch-dialog__state-text"
                    :class="resolveDispatchStatusTextClass(row.runtimeModeTag.type)"
                  >
                    {{ row.runtimeModeTag.text }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column
                prop="profileLabel"
                label="执行环境"
                min-width="156"
                show-overflow-tooltip
              />
              <el-table-column label="环境" width="76" align="center">
                <template #default="{ row }">
                  <span
                    class="publish-dispatch-dialog__state-text"
                    :class="resolveDispatchStatusTextClass(row.profileTag.type)"
                  >
                    {{ row.profileTag.text }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column
                prop="description"
                label="说明"
                min-width="180"
                show-overflow-tooltip
              />
            </el-table>
          </div>
          <div v-else class="publish-dispatch-dialog__empty">
            当前没有可绑定的浏览器自动化节点。
          </div>
        </div>
      </div>
      <template #footer>
        <div class="publish-dispatch-dialog__footer">
          <el-button
            :disabled="autoDispatchTargetSubmitting"
            @click="autoDispatchTargetDialogVisible = false"
          >
            取消
          </el-button>
          <el-button
            type="primary"
            :loading="autoDispatchTargetSubmitting"
            :disabled="!canConfirmAutoDispatchTarget"
            @click="handleConfirmAutoDispatchTarget"
          >
            保存并开启
          </el-button>
        </div>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="tsx">
import { ref, reactive, watchEffect, onMounted, onUnmounted, watch, computed } from "vue";
import { buildOperationColumn, commonGridOptions } from "@/common/table";
import { useWindowSize } from "@vueuse/core";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Delete, Plus } from "@element-plus/icons-vue";
import {
  getTaskList,
  createTask,
  deleteTask,
  getTaskDetail,
  getQueueStats,
  updateTaskData,
  updateTaskStatus,
  batchResetPublishTasksToPending,
  type QueueMessage,
  type QueueStats,
} from "@/api/system/queue";
import { regeneratePublishTaskApi } from "@/api/product/publishConfig";
import {
  getPublishTaskAutoDispatchRuntime,
  resetPublishTaskDispatch,
  startPublishTaskDispatch,
  stopPublishTaskDispatch,
  type AutoDispatchSchedulerRuntime,
} from "@/api/system/websocket";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import { useUserStore } from "@/store/modules/user";
import {
  publishTaskTypeOptions,
  refreshPublishTaskTypeOptions,
} from "@/services/publishTaskCapabilityOptions";
import { useClientNodeState } from "@/services/clientNodeState";
import {
  getBrowserAutomationRuntimeHint,
  isBrowserAutomationRuntimeBusy as isBrowserAutomationRuntimeBusyByRuntime,
  supportsBrowserAutomationTaskType,
} from "@/services/browserAutomationRuntime";
import {
  normalizeAutoDispatchSchedulerRuntime,
  resolveAutoDispatchSchedulerIndicator,
  resolveAutoDispatchSchedulerMeta,
} from "@/services/autoDispatchSchedulerRuntime";
import { resolveTaskExecutionReadinessIndicator } from "@/services/taskExecutionReadiness";
import {
  websocketClient,
  type PublishTaskRuntimeEvent,
  type ServiceCommandResultEvent,
} from "@/services/websocketClient";
import { usePublishTaskRuntimeState } from "@/services/publishTaskRuntimeState";
import {
  disablePublishTaskAutoDispatch,
  enablePublishTaskAutoDispatch,
  loadPublishTaskAutoDispatchSetting as fetchPublishTaskAutoDispatchSetting,
  type PublishTaskAutoDispatchFilter,
  type PublishTaskAutoDispatchSetting,
} from "@/services/publishTaskAutoDispatch";
import { getClientServiceRuntime } from "@/store/modules/clientNode";

type QueueTagType = "success" | "warning" | "info" | "primary" | "danger";

interface ExecutionStatusInfo {
  text: string;
  type?: QueueTagType;
  reason?: string | null;
  ready?: boolean;
}

interface DispatchClientState {
  enabled: boolean;
  text: string;
  tagType: QueueTagType;
  tagText: string;
}

interface DispatchProfileOption {
  profileId: string | null;
  label: string;
  description: string;
  enabled: boolean;
  connected: boolean;
  busy: boolean;
  runtimeModeTag?: DispatchStatusTag;
  isAuto?: boolean;
}

interface DispatchStatusTag {
  text: string;
  type: QueueTagType;
}

interface ManualDispatchOptionRow {
  optionKey: string;
  clientId: string;
  clientLabel: string;
  onlineTag: DispatchStatusTag;
  serviceTag: DispatchStatusTag;
  profileId: string | null;
  profileLabel: string;
  runtimeModeTag: DispatchStatusTag;
  profileTag: DispatchStatusTag;
  description: string;
  selectable: boolean;
}

interface DispatchOptionRow {
  optionKey: string;
  clientId: string;
  clientLabel: string;
  onlineTag: DispatchStatusTag;
  serviceTag: DispatchStatusTag;
  profileId: string | null;
  profileLabel: string;
  runtimeModeTag: DispatchStatusTag;
  profileTag: DispatchStatusTag;
  description: string;
  selectable: boolean;
}

const userStore = useUserStore();
const { clients: clientNodes, refresh: refreshClientNodes } = useClientNodeState();
const getBrowserAutomationRuntime = (client?: Record<string, any> | null) =>
  getClientServiceRuntime(client, "browser-automation");
const browserAutomationClients = computed(() =>
  clientNodes.value.filter((client) => !!getBrowserAutomationRuntime(client)),
);
const DISPATCH_DIALOG_LOADING_TEXT = "正在同步可用节点...";
const {
  refresh: refreshPublishTaskRuntime,
  setAutoSchedulingEnabled: setPublishTaskAutoSchedulingEnabled,
} = usePublishTaskRuntimeState();

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  status: undefined as "pending" | "waiting" | "processing" | "completed" | "failed" | undefined,
  type: "", // 任务类型，默认为空（留空则查询所有类型）
  id: "", // 任务ID，默认为空（留空则查询所有ID）
  sortType: "createdAt_DESC",
});

const stats = ref<QueueStats>({
  queue: "",
  pending: 0,
  waiting: 0,
  processing: 0,
  delayed: 0,
  completed: 0,
  failed: 0,
  total: 0,
});

const gridOptions = ref({
  ...commonGridOptions,
  maxHeight: null,
  rowClassName: ({ row }) => getQueueRowClassName(row),
  rowConfig: {
    keyField: "id",
  },
  checkboxConfig: {
    reserve: true,
  },
  columns: [
    { type: "checkbox", width: 50, ellipsis: true, reserve: true },
    { title: "任务ID", field: "id", minWidth: 200, showOverflow: true },
    { title: "任务类型", field: "type", width: 240 },
    {
      title: "创建人",
      field: "uploader",
      width: 140,
      showOverflow: true,
      formatter: ({ row }) => row?.uploader?.account || row?.uploader?.name || row?.userId || "-",
    },
    {
      title: "任务描述",
      field: "description",
      minWidth: 200,
      showOverflow: true,
      formatter: (e) => {
        return e.cellValue || "-";
      },
    },
    {
      title: "状态",
      field: "status",
      width: 100,
      slots: {
        default: "statusDefaultSlot",
      },
    },
    {
      title: "可执行状态",
      field: "executionStatus",
      width: 120,
      slots: {
        default: "executionStatusDefaultSlot",
      },
    },
    {
      title: "执行节点",
      field: "dispatchTarget",
      minWidth: 220,
      slots: {
        default: "dispatchTargetDefaultSlot",
      },
    },
    {
      title: "状态说明",
      field: "statusMessage",
      minWidth: 280,
      showOverflow: true,
      formatter: ({ row }) => resolveQueueTaskStatusMessage(row),
    },
    {
      title: "任务数据",
      field: "data",
      minWidth: 110,
      slots: {
        default: "dataDefaultSlot",
      },
    },
    {
      title: "运行日志",
      field: "runtimeLogs",
      width: 130,
      slots: {
        default: "runtimeLogsDefaultSlot",
      },
    },
    {
      title: "创建时间",
      field: "createdAt",
      width: 180,
      showOverflow: true,
      formatter: (e) => {
        return e.cellValue ? new Date(e.cellValue).toLocaleString() : "-";
      },
    },
    {
      title: "更新时间",
      field: "updatedAt",
      width: 180,
      showOverflow: true,
      formatter: (e) => {
        return e.cellValue ? new Date(e.cellValue).toLocaleString() : "-";
      },
    },
    {
      title: "错误信息",
      field: "error",
      minWidth: 200,
      showOverflow: true,
      formatter: (e) => {
        return e.cellValue || "-";
      },
    },
    buildOperationColumn("operationDefaultSlot"),
  ],
});

const { height } = useWindowSize();

const dataSource = ref<QueueMessage[]>([]);
const loading = ref(false);
const ids = ref<string[]>([]);
const total = ref(0);
const submitLoading = ref(false);
const statusSubmitLoading = ref(false);
const dataUpdateSubmitting = ref(false);
const deleteLoading = ref(false);
const batchResetPendingLoading = ref(false);
const publishTaskAutoDispatchEnabled = ref(false);
const publishTaskAutoDispatchLoading = ref(false);
const publishTaskSchedulerRuntime = ref<AutoDispatchSchedulerRuntime | null>(null);
const publishDispatchDialogVisible = ref(false);
const publishDispatchDialogLoading = ref(false);
const publishDispatchSubmitting = ref(false);
const autoDispatchTargetDialogVisible = ref(false);
const autoDispatchTargetDialogLoading = ref(false);
const autoDispatchTargetSubmitting = ref(false);
const dispatchTargetTask = ref<QueueMessage | null>(null);
const selectedDispatchClientId = ref("");
const selectedDispatchProfileId = ref("");
const autoDispatchTargetClientId = ref("");
const autoDispatchTargetProfileId = ref("");
const autoDispatchFilterForm = reactive({
  taskTypes: [] as string[],
  includeKeywordsText: "",
  excludeKeywordsText: "",
});
const autoDispatchFilterDateRange = ref<[string, string] | []>([]);
let publishTaskSchedulerRuntimeTimer: ReturnType<typeof setInterval> | null = null;
let publishTaskRuntimeReloadTimer: ReturnType<typeof setTimeout> | null = null;
let publishTaskCountersRefreshTimer: ReturnType<typeof setTimeout> | null = null;
let publishTaskMenuRuntimeSyncTimer: ReturnType<typeof setTimeout> | null = null;
let runtimeLogDialogRefreshTimer: ReturnType<typeof setInterval> | null = null;
let runtimeLogDialogRefreshing = false;
let queueListRequestSeq = 0;
let queueListSilentRequestSeq = 0;
let queueListVisibleLoadingCount = 0;
let queueStatsRequestSeq = 0;

// 对话框相关
const dialogVisible = ref(false);
const dialogTitle = ref("新增任务");
const formRef = ref();
const formData = reactive({
  type: "",
  description: "",
  dataStr: "{}",
  delay: 0,
});

const formRules = {
  type: [{ required: true, message: "请输入任务类型", trigger: "blur" }],
  dataStr: [
    { required: true, message: "请输入任务数据", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        try {
          JSON.parse(value);
          callback();
        } catch {
          callback(new Error("请输入有效的JSON格式"));
        }
      },
      trigger: "blur",
    },
  ],
};

// 状态编辑对话框
const statusDialogVisible = ref(false);
const statusFormRef = ref();
const statusFormData = reactive({
  id: "",
  type: "",
  status: "" as QueueMessage["status"],
  newStatus: "" as QueueMessage["status"],
  error: "",
});

const statusFormRules = {
  newStatus: [{ required: true, message: "请选择新状态", trigger: "change" }],
  error: [{ required: true, message: "请输入错误信息", trigger: "blur" }],
};

// 查看数据对话框
const dataDialogVisible = ref(false);
const dataDialogLoading = ref(false);
const currentTaskData = ref<any>({});
const currentTaskId = ref<string>("");
const currentTaskQueue = ref<string>("");
const currentTaskRuntimeLog = ref<any>(null);
const runtimeLogDialogVisible = ref(false);
const runtimeLogDialogLoading = ref(false);
const runtimeLogDataDialogVisible = ref(false);
const runtimeLogDataDialogText = ref("");
const runtimeLogDataDialogMeta = reactive({
  time: "",
  level: "",
  message: "",
});

const currentTaskRuntime = computed(() =>
  extractTaskRuntime(currentTaskData.value, currentTaskRuntimeLog.value),
);
const currentTaskLogs = computed(() => {
  const logs = currentTaskRuntime.value?.logs;
  return Array.isArray(logs) ? logs : [];
});

// 更新数据对话框
const dataUpdateDialogVisible = ref(false);
const dataUpdateFormRef = ref();
const dataUpdateFormData = reactive({
  queue: "",
  messageId: "",
  dataStr: "",
  dataObj: {} as any,
});
const currentDataUpdateRow = ref<QueueMessage | null>(null);

const parsedUpdateData = computed(() => {
  if (!dataUpdateFormData.dataStr.trim()) return {};
  try {
    return JSON.parse(dataUpdateFormData.dataStr);
  } catch (e) {
    return { error: "Invalid JSON format (解析异常...)" };
  }
});

const showPublishDispatchPanel = computed(() => {
  return (
    !queryParams.type ||
    queryParams.type.startsWith("publish-product-") ||
    dataSource.value.some((row) => isPublishTaskRow(row))
  );
});

const publishTaskRunningCount = computed(
  () => Number(stats.value.processing || 0),
);

const publishTaskAutoDispatchStatusText = computed(() => {
  if (publishTaskRunningCount.value > 0) {
    return `执行中 ${publishTaskRunningCount.value} 条`;
  }

  return publishTaskAutoDispatchEnabled.value ? "已开启" : "已关闭";
});

const publishTaskAutoDispatchStatusClass = computed(() => ({
  "is-success": publishTaskAutoDispatchEnabled.value && publishTaskRunningCount.value === 0,
  "is-warning": publishTaskRunningCount.value > 0,
  "is-info": !publishTaskAutoDispatchEnabled.value && publishTaskRunningCount.value === 0,
}));

const publishTaskSchedulerIndicator = computed(() =>
  resolveAutoDispatchSchedulerIndicator(publishTaskSchedulerRuntime.value),
);

const publishTaskSchedulerMeta = computed(() =>
  resolveAutoDispatchSchedulerMeta(publishTaskSchedulerRuntime.value),
);

const autoDispatchTargetClient = computed(
  () =>
    browserAutomationClients.value.find(
      (client) => client.id === autoDispatchTargetClientId.value,
    ) || null,
);

const autoDispatchTargetProfileOptions = computed(() =>
  resolveAutoDispatchTargetProfileOptions(autoDispatchTargetClient.value),
);

const selectedAutoDispatchOptionKey = computed({
  get: () =>
    buildDispatchOptionKey(
      autoDispatchTargetClientId.value,
      normalizeDispatchProfileId(autoDispatchTargetProfileId.value),
    ),
  set: (value: string) => {
    const selection = parseDispatchOptionKey(value);
    autoDispatchTargetClientId.value = selection.clientId;
    autoDispatchTargetProfileId.value = selection.profileId || "";
  },
});

const publishTaskAutoDispatchTargetClient = computed(
  () =>
    browserAutomationClients.value.find(
      (client) => client.id === autoDispatchTargetClientId.value,
    ) || null,
);

const publishTaskAutoDispatchTargetProfile = computed(
  () =>
    autoDispatchTargetProfileOptions.value.find(
      (item) => item.profileId === autoDispatchTargetProfileId.value,
    ) || null,
);

const publishTaskAutoDispatchTargetText = computed(() => {
  const clientLabel = publishTaskAutoDispatchTargetClient.value
    ? formatClientNodeName(publishTaskAutoDispatchTargetClient.value)
    : autoDispatchTargetClientId.value || "未设置客户端";
  const profileLabel =
    publishTaskAutoDispatchTargetProfile.value?.label ||
    (autoDispatchTargetProfileId.value
      ? `实例 ${autoDispatchTargetProfileId.value}`
      : "未设置实例");
  return `${clientLabel} / ${profileLabel}`;
});

const publishTaskAutoDispatchTargetHint = computed(() => {
  const runningCount = currentAutoDispatchRunningRows.value.length;
  const client = publishTaskAutoDispatchTargetClient.value;
  if (!autoDispatchTargetClientId.value || !autoDispatchTargetProfileId.value) {
    return "当前尚未绑定自动执行目标";
  }
  if (!client) {
    return "目标客户端当前不在已连接列表中";
  }
  if (!client.isOnline) {
    return "目标客户端当前离线";
  }
  const runtime = getBrowserAutomationRuntime(client) as Record<string, any>;
  if (!(runtime?.available || runtime?.connected)) {
    return "浏览器自动化服务未就绪";
  }
  const matchedRow =
    autoDispatchRows.value.find(
      (item) =>
        item.clientId === autoDispatchTargetClientId.value &&
        (item.profileId || "") === autoDispatchTargetProfileId.value,
    ) || null;
  const targetProfile =
    resolveAutoDispatchTargetProfileOptions(client).find(
      (item) => item.profileId === autoDispatchTargetProfileId.value,
    ) || null;
  const baseText = matchedRow?.description || targetProfile?.description || "目标已绑定";
  return runningCount > 0 ? `${baseText}，当前运行 ${runningCount} 条任务` : baseText;
});

const publishTaskAutoDispatchFilterSummary = computed(() =>
  getAutoDispatchFilterSummary(buildAutoDispatchFilterFromForm()),
);

const publishTaskAutoDispatchFilterDetail = computed(() =>
  getAutoDispatchFilterDetail(buildAutoDispatchFilterFromForm()),
);

const publishTaskAutoDispatchTargetClass = computed(() => ({
  "is-success":
    !!autoDispatchTargetClient.value &&
    !!autoDispatchTargetClient.value.isOnline &&
    !!(
      getBrowserAutomationRuntime(autoDispatchTargetClient.value)?.available ||
      getBrowserAutomationRuntime(autoDispatchTargetClient.value)?.connected
    ) &&
    !!autoDispatchTargetProfileId.value,
  "is-warning":
    !!autoDispatchTargetClientId.value &&
    !!autoDispatchTargetProfileId.value &&
    (!publishTaskAutoDispatchTargetClient.value ||
      !publishTaskAutoDispatchTargetClient.value.isOnline ||
      !(
        getBrowserAutomationRuntime(publishTaskAutoDispatchTargetClient.value)?.available ||
        getBrowserAutomationRuntime(publishTaskAutoDispatchTargetClient.value)?.connected
      )),
  "is-info": !autoDispatchTargetClientId.value || !autoDispatchTargetProfileId.value,
}));

const currentAutoDispatchRunningRows = computed(() =>
  dataSource.value.filter((row) => {
    const target = getQueueTaskDispatchTarget(row);
    if (!target.clientId || !target.profileId) {
      return false;
    }
    if (target.clientId !== autoDispatchTargetClientId.value) {
      return false;
    }
    if (target.profileId !== autoDispatchTargetProfileId.value) {
      return false;
    }
    return row.status === "processing";
  }),
);

const dispatchClientCandidates = computed(() =>
  clientNodes.value.filter((client) => {
    if (!client?.isOnline) {
      return false;
    }
    return !!getBrowserAutomationRuntime(client);
  }),
);

const dispatchAvailableRows = computed<ManualDispatchOptionRow[]>(() => {
  const taskType = dispatchTargetTask.value?.type;
  return dispatchClientCandidates.value
    .flatMap((client) => {
      const onlineTag = getDispatchClientOnlineTag(client);
      const serviceTag = getDispatchClientServiceTag(client);
      const taskState = getClientTaskTypeState(client, taskType);
      const profileOptions = resolveClientDispatchProfileOptions(client, taskType);
      const concreteOptions = profileOptions.filter((item) => !item.isAuto);
      const effectiveOptions = concreteOptions.length
        ? concreteOptions
        : profileOptions.length
          ? profileOptions
          : [
              {
                profileId: null,
                label: "无可用环境",
                description: taskState.text,
                enabled: false,
                connected: !!getBrowserAutomationRuntime(client)?.available,
                busy: isBrowserAutomationClientBusy(client),
              } satisfies DispatchProfileOption,
            ];

      return effectiveOptions.map((option) => ({
        optionKey: buildDispatchOptionKey(client.id, option.profileId),
        clientId: String(client.id || "").trim(),
        clientLabel: formatClientNodeName(client),
        onlineTag,
        serviceTag,
        profileId: option.profileId,
        profileLabel: option.label,
        runtimeModeTag: option.runtimeModeTag || getDispatchProfileRuntimeModeTag(null, {
          isAuto: option.isAuto === true,
        }),
        profileTag: getDispatchProfileTag(client, option, taskType),
        description: taskState.enabled ? option.description : taskState.text,
        selectable: taskState.enabled && option.enabled,
      }));
    })
    .sort((a, b) => {
      if (a.selectable !== b.selectable) {
        return a.selectable ? -1 : 1;
      }
      const clientCompare = a.clientLabel.localeCompare(b.clientLabel, "zh-CN");
      if (clientCompare !== 0) {
        return clientCompare;
      }
      return a.profileLabel.localeCompare(b.profileLabel, "zh-CN");
    });
});
const dispatchSelectableRows = computed(() =>
  dispatchAvailableRows.value.filter((item) => item.selectable),
);

const autoDispatchRows = computed<DispatchOptionRow[]>(() =>
  dispatchClientCandidates.value
    .flatMap((client) => {
      const runtime = getBrowserAutomationRuntime(client) as Record<string, any>;
      const onlineTag = getDispatchClientOnlineTag(client);
      const serviceTag = getDispatchClientServiceTag(client);
      const profileOptions = resolveAutoDispatchTargetProfileOptions(client);
      const clientReady = !!(client?.isOnline && (runtime?.available || runtime?.connected));

      if (!profileOptions.length) {
        return [
          {
            optionKey: `${String(client?.id || "").trim()}::__unavailable__`,
            clientId: String(client?.id || "").trim(),
            clientLabel: formatClientNodeName(client),
            onlineTag,
            serviceTag,
            profileId: null,
            profileLabel: "无可绑定环境",
            runtimeModeTag: getDispatchProfileRuntimeModeTag(null),
            profileTag: getAutoDispatchUnavailableTag(client),
            description: resolveAutoDispatchUnavailableReason(client),
            selectable: false,
          },
        ];
      }

      return profileOptions.map((option) => ({
        optionKey: buildDispatchOptionKey(client.id, option.profileId),
        clientId: String(client.id || "").trim(),
        clientLabel: formatClientNodeName(client),
        onlineTag,
        serviceTag,
        profileId: option.profileId,
        profileLabel: option.label,
        runtimeModeTag: option.runtimeModeTag || getDispatchProfileRuntimeModeTag(null),
        profileTag: getAutoDispatchProfileTag(client, option),
        description: clientReady ? option.description : resolveAutoDispatchUnavailableReason(client),
        selectable: clientReady && !!option.profileId,
      }));
    })
    .sort((a, b) => {
      if (a.selectable !== b.selectable) {
        return a.selectable ? -1 : 1;
      }
      return a.clientLabel.localeCompare(b.clientLabel, "zh-CN");
    }),
);
const autoDispatchSelectableRows = computed(() =>
  autoDispatchRows.value.filter((item) => item.selectable),
);
const selectedAutoDispatchRow = computed(
  () =>
    autoDispatchRows.value.find((item) => item.optionKey === selectedAutoDispatchOptionKey.value) ||
    null,
);
const canConfirmAutoDispatchTarget = computed(
  () => !autoDispatchTargetDialogLoading.value && !!selectedAutoDispatchRow.value?.selectable,
);

const selectedDispatchRow = computed(
  () =>
    dispatchAvailableRows.value.find(
      (item) => item.optionKey === selectedDispatchOptionKey.value,
    ) || null,
);
const selectedDispatchOptionKey = computed({
  get: () =>
    buildDispatchOptionKey(
      selectedDispatchClientId.value,
      normalizeDispatchProfileId(selectedDispatchProfileId.value),
    ),
  set: (value: string) => {
    const selection = parseDispatchOptionKey(value);
    selectedDispatchClientId.value = selection.clientId;
    selectedDispatchProfileId.value = selection.profileId || "";
  },
});

const canConfirmPublishDispatch = computed(
  () => !publishDispatchDialogLoading.value && !!selectedDispatchRow.value?.selectable,
);

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - (showPublishDispatchPanel.value ? 320 : 292);
});

function isPublishTaskRow(row?: QueueMessage | null) {
  return String(row?.type || "").startsWith("publish-product-");
}

const PUBLISH_DISPATCH_STALE_MS = 45_000;

function getPublishDispatchMeta(row?: QueueMessage | null) {
  const meta = row?.metadata?.publishDispatch;
  const normalizedMeta = meta && typeof meta === "object" ? meta : {};
  const heartbeat = String(
    normalizedMeta.lastHeartbeatAt || normalizedMeta.assignedAt || normalizedMeta.startedAt || "",
  ).trim();
  const status = String(normalizedMeta.status || "").trim();

  if (
    heartbeat &&
    (status === "assigned" || status === "running") &&
    Date.now() - new Date(heartbeat).getTime() >= PUBLISH_DISPATCH_STALE_MS
  ) {
    return {
      ...normalizedMeta,
      status: "timeout",
      currentStep: normalizedMeta.currentStep || "执行心跳超时",
      lastError: normalizedMeta.lastError || "长时间未收到任务心跳，任务可能已中断",
    };
  }

  return normalizedMeta;
}

function supportsTaskType(client: any, taskType?: string) {
  const runtime = getBrowserAutomationRuntime(client);
  return supportsBrowserAutomationTaskType(runtime, taskType);
}

function normalizeDispatchProfileId(value: any) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function buildDispatchOptionKey(clientId: any, profileId?: string | null) {
  const normalizedClientId = String(clientId || "").trim();
  if (!normalizedClientId) {
    return "";
  }
  return `${normalizedClientId}::${normalizeDispatchProfileId(profileId) || "__auto__"}`;
}

function parseDispatchOptionKey(value: any) {
  const normalizedValue = String(value || "").trim();
  const [rawClientId, rawProfileId = ""] = normalizedValue.split("::");
  const clientId = String(rawClientId || "").trim();
  const profileId =
    rawProfileId && rawProfileId !== "__auto__" ? normalizeDispatchProfileId(rawProfileId) : null;

  return {
    clientId,
    profileId,
  };
}

function handleDispatchOptionRowClick(row?: ManualDispatchOptionRow | null) {
  if (!row?.optionKey || !row.selectable) {
    return;
  }
  selectedDispatchOptionKey.value = row.optionKey;
}

function handleAutoDispatchOptionRowClick(row?: DispatchOptionRow | null) {
  if (!row?.optionKey || !row.selectable) {
    return;
  }
  selectedAutoDispatchOptionKey.value = row.optionKey;
}

function resolveDispatchStatusTextClass(type?: QueueTagType) {
  if (type === "success") {
    return "is-success";
  }
  if (type === "warning") {
    return "is-warning";
  }
  if (type === "danger") {
    return "is-danger";
  }
  if (type === "info" || type === "primary") {
    return "is-info";
  }
  return "is-muted";
}

function getClientDispatchProfileInstances(client: any) {
  const runtime = getBrowserAutomationRuntime(client) as Record<string, any>;
  const instances = runtime?.details?.instances;
  return Array.isArray(instances) ? instances : [];
}

function getClientDispatchProfiles(client: any) {
  const runtime = getBrowserAutomationRuntime(client) as Record<string, any>;
  const profiles = runtime?.details?.profiles;
  return Array.isArray(profiles) ? profiles : [];
}

function getDispatchProfileRuntimeModeTag(
  instance?: Record<string, any> | null,
  options: { isAuto?: boolean } = {},
): DispatchStatusTag {
  if (options.isAuto) {
    return { text: "自动", type: "info" };
  }
  const started = !!(
    instance?.hasInstance ||
    instance?.connected ||
    instance?.isConnected ||
    instance?.connecting
  );
  if (!started) {
    return { text: "未启动", type: "info" };
  }
  if (instance?.headless === true) {
    return { text: "无头", type: "warning" };
  }
  if (instance?.headless === false) {
    return { text: "普通", type: "success" };
  }
  return { text: "未知", type: "info" };
}

function getDispatchClientOnlineTag(client: any): DispatchStatusTag {
  return client?.isOnline ? { text: "在线", type: "success" } : { text: "离线", type: "info" };
}

function getDispatchClientServiceTag(client: any): DispatchStatusTag {
  const runtime = getBrowserAutomationRuntime(client) as Record<string, any>;
  const status = String(runtime?.status || "").trim();

  if (!client?.isOnline) {
    return { text: "离线", type: "info" };
  }
  if (status === "error") {
    return { text: "异常", type: "danger" };
  }
  if (runtime?.available || runtime?.connected) {
    return { text: "已开启", type: "success" };
  }

  return { text: "未开启", type: "warning" };
}

function getDispatchProfileTag(
  client: any,
  option: DispatchProfileOption,
  taskType?: string,
): DispatchStatusTag {
  const runtime = getBrowserAutomationRuntime(client) as Record<string, any>;
  const normalizedTaskType = String(taskType || "").trim();

  if (!client?.isOnline) {
    return { text: "不可用", type: "info" };
  }
  if (!(runtime?.available || runtime?.connected)) {
    return { text: "不可用", type: "warning" };
  }
  if (!normalizedTaskType || !supportsTaskType(client, normalizedTaskType)) {
    return { text: "不支持", type: "warning" };
  }
  if (option.busy) {
    return { text: "繁忙", type: "warning" };
  }

  return { text: "空闲", type: "success" };
}

function resolveAutoDispatchUnavailableReason(client: any) {
  const runtime = getBrowserAutomationRuntime(client) as Record<string, any>;
  if (!client?.isOnline) {
    return "客户端离线";
  }
  if (!(runtime?.available || runtime?.connected)) {
    return "浏览器自动化服务未就绪";
  }
  return "当前客户端还没有可绑定的浏览器实例";
}

function getAutoDispatchUnavailableTag(client: any): DispatchStatusTag {
  const runtime = getBrowserAutomationRuntime(client) as Record<string, any>;
  if (!client?.isOnline) {
    return { text: "不可用", type: "info" };
  }
  if (!(runtime?.available || runtime?.connected)) {
    return { text: "不可用", type: "warning" };
  }
  return { text: "缺失", type: "warning" };
}

function getAutoDispatchProfileTag(client: any, option: DispatchProfileOption): DispatchStatusTag {
  const runtime = getBrowserAutomationRuntime(client) as Record<string, any>;
  if (!client?.isOnline) {
    return { text: "不可用", type: "info" };
  }
  if (!(runtime?.available || runtime?.connected)) {
    return { text: "不可用", type: "warning" };
  }
  if (option.busy) {
    return { text: "繁忙", type: "warning" };
  }
  return { text: "空闲", type: "success" };
}

function resolveAutoDispatchTargetProfileOptions(client: any): Array<
  DispatchProfileOption & {
    profileId: string;
  }
> {
  const runtime = getBrowserAutomationRuntime(client) as Record<string, any>;
  const profiles = getClientDispatchProfiles(client);
  const instances = getClientDispatchProfileInstances(client);
  const instanceMap = new Map(
    instances
      .map((item: any) => [normalizeDispatchProfileId(item?.profileId), item] as const)
      .filter(([profileId]) => !!profileId),
  );

  return profiles
    .map((profile: any) => {
      const profileId = normalizeDispatchProfileId(profile?.id);
      if (!profileId) {
        return null;
      }
      const instance = instanceMap.get(profileId) || null;
      const connected = instance?.connected === true || instance?.hasInstance === true;
      const busy = instance?.busy === true;
      const pageCount = typeof instance?.pageCount === "number" ? Number(instance.pageCount) : null;

      let description = "浏览器未打开，自动执行时会拉起";
      if (busy) {
        description = instance?.currentTaskId
          ? `当前实例忙碌中，任务 ${instance.currentTaskId} 正在执行`
          : "当前实例忙碌中，后续任务会排队等待";
      } else if (connected) {
        description =
          pageCount !== null ? `浏览器已打开，当前 ${pageCount} 个页面` : "浏览器已打开";
      } else if (!(runtime?.available || runtime?.connected)) {
        description = "自动化服务未就绪，当前不建议绑定";
      }

      return {
        profileId,
        label: formatDispatchProfileLabel(profileId, profile),
        description,
        enabled: true,
        connected,
        busy,
        runtimeModeTag: getDispatchProfileRuntimeModeTag(instance),
      };
    })
    .filter(Boolean) as Array<
    DispatchProfileOption & {
      profileId: string;
    }
  >;
}

function formatDispatchProfileLabel(profileId: string, profile?: Record<string, any> | null) {
  const profileName =
    String(profile?.name || profile?.profileName || profileId).trim() || profileId;
  return `${profileName}${profileId ? ` (${profileId})` : ""}`;
}

function extractRequestErrorMessage(error: any, fallback = "操作失败") {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function resolveClientDispatchProfileOptions(
  client: any,
  taskType?: string,
): DispatchProfileOption[] {
  const runtime = getBrowserAutomationRuntime(client) as Record<string, any>;
  if (
    !taskType ||
    !client?.isOnline ||
    !runtime?.connected ||
    !supportsTaskType(client, taskType)
  ) {
    return [];
  }

  const profileInstances = getClientDispatchProfileInstances(client);
  const profiles = getClientDispatchProfiles(client);
  const profileMap = new Map(
    profiles
      .map((item: any) => [normalizeDispatchProfileId(item?.id), item] as const)
      .filter(([profileId]) => !!profileId),
  );
  const instanceMap = new Map(
    profileInstances
      .map((item: any) => [normalizeDispatchProfileId(item?.profileId), item] as const)
      .filter(([profileId]) => !!profileId),
  );
  const orderedProfileIds = Array.from(
    new Set(
      [...profileInstances, ...profiles]
        .map((item: any) => normalizeDispatchProfileId(item?.profileId || item?.id))
        .filter(Boolean),
    ),
  ) as string[];

  const concreteOptions = orderedProfileIds.map((profileId) => {
    const profile = profileMap.get(profileId) || instanceMap.get(profileId) || null;
    const instance = instanceMap.get(profileId) || null;
    const busy = instance?.busy === true;
    const connected = instance?.connected === true || instance?.hasInstance === true;
    const pageCount = typeof instance?.pageCount === "number" ? Number(instance.pageCount) : null;

    let description = "浏览器未打开，执行时会自动拉起";
    if (busy) {
      description = instance?.currentTaskId
        ? `当前执行中，任务 ${instance.currentTaskId}`
        : "当前环境正在执行任务";
    } else if (connected) {
      description = pageCount !== null ? `浏览器已打开，当前 ${pageCount} 个页面` : "浏览器已打开";
    }

    return {
      profileId,
      label: formatDispatchProfileLabel(profileId, profile),
      description,
      enabled: !busy,
      connected,
      busy,
      runtimeModeTag: getDispatchProfileRuntimeModeTag(instance),
    } satisfies DispatchProfileOption;
  });

  const enabledConcreteOptions = concreteOptions.filter((item) => item.enabled);
  const autoEnabled = orderedProfileIds.length
    ? enabledConcreteOptions.length > 0
    : !isBrowserAutomationRuntimeBusyByRuntime(runtime);

  return [
    {
      profileId: null,
      label: orderedProfileIds.length ? "自动选择可用环境" : "使用默认环境",
      description: orderedProfileIds.length
        ? autoEnabled
          ? `由服务端在 ${enabledConcreteOptions.length} 个空闲环境中自动选择`
          : "当前没有空闲环境可供自动选择"
        : "当前客户端未上报环境列表，将按默认环境执行",
      enabled: autoEnabled,
      connected: !!runtime?.available,
      busy: !autoEnabled,
      runtimeModeTag: getDispatchProfileRuntimeModeTag(null, { isAuto: true }),
      isAuto: true,
    },
    ...concreteOptions,
  ];
}

function formatClientNodeName(client: any) {
  return (
    client?.clientInfo?.machine?.code ||
    client?.machine?.code ||
    client?.location?.city ||
    client?.clientId ||
    client?.id ||
    "-"
  );
}

function isBrowserAutomationClientBusy(client: any) {
  return isBrowserAutomationRuntimeBusyByRuntime(getBrowserAutomationRuntime(client));
}

function getDispatchOptionRowClassName({ row }: { row?: { selectable?: boolean } | null }) {
  return row?.selectable ? "" : "is-disabled";
}

function getClientTaskTypeState(client: any, taskType?: string) {
  if (!taskType) {
    return {
      enabled: false,
      text: "任务类型未知",
      tagType: "info" as QueueTagType,
      tagText: "未知",
    } satisfies DispatchClientState;
  }
  if (!client?.isOnline) {
    return {
      enabled: false,
      text: "客户端离线",
      tagType: "info" as QueueTagType,
      tagText: "离线",
    } satisfies DispatchClientState;
  }
  const runtime = getBrowserAutomationRuntime(client);
  const runtimeHint = getBrowserAutomationRuntimeHint(runtime);
  if (!(runtime?.available || runtime?.connected)) {
    return {
      enabled: false,
      text: runtimeHint ? `自动化服务不可用，${runtimeHint}` : "自动化服务不可用",
      tagType: "warning" as QueueTagType,
      tagText: "未就绪",
    } satisfies DispatchClientState;
  }
  if (!supportsTaskType(client, taskType)) {
    return {
      enabled: false,
      text: "当前节点不支持该任务类型",
      tagType: "warning" as QueueTagType,
      tagText: "不支持",
    } satisfies DispatchClientState;
  }
  const profileOptions = resolveClientDispatchProfileOptions(client, taskType).filter(
    (item) => !item.isAuto,
  );
  if (profileOptions.length > 0) {
    const enabledProfiles = profileOptions.filter((item) => item.enabled);
    if (!enabledProfiles.length) {
      return {
        enabled: false,
        text: "当前节点环境都在忙碌中，请稍后再试",
        tagType: "warning" as QueueTagType,
        tagText: "忙碌",
      } satisfies DispatchClientState;
    }
    const connectedCount = enabledProfiles.filter((item) => item.connected).length;
    return {
      enabled: true,
      text:
        connectedCount > 0
          ? `可执行环境 ${enabledProfiles.length} 个，其中已打开 ${connectedCount} 个`
          : `可执行环境 ${enabledProfiles.length} 个，任务执行时会自动拉起浏览器`,
      tagType: "success" as QueueTagType,
      tagText: "可执行",
    } satisfies DispatchClientState;
  }
  if (isBrowserAutomationClientBusy(client)) {
    return {
      enabled: false,
      text: runtimeHint ? `节点当前忙碌中，${runtimeHint}` : "节点当前忙碌中",
      tagType: "warning" as QueueTagType,
      tagText: "忙碌",
    } satisfies DispatchClientState;
  }
  return {
    enabled: true,
    text: "可立即执行",
    tagType: "success" as QueueTagType,
    tagText: "可执行",
  } satisfies DispatchClientState;
}

function syncDispatchProfileSelection() {
  const matched = dispatchAvailableRows.value.find(
    (item) => item.optionKey === selectedDispatchOptionKey.value,
  );
  if (matched?.selectable) {
    return;
  }

  const preferredRow = dispatchSelectableRows.value[0] || matched || dispatchAvailableRows.value[0];
  selectedDispatchClientId.value = preferredRow?.clientId || "";
  selectedDispatchProfileId.value = preferredRow?.profileId || "";
}

// 获取状态类型
function getStatusType(status: QueueMessage["status"]) {
  const map: Record<QueueMessage["status"], QueueTagType> = {
    pending: "info",
    waiting: "warning",
    processing: "warning",
    completed: "success",
    failed: "danger",
  };
  return map[status] || "info";
}

// 获取状态文本
function getStatusText(status: QueueMessage["status"]) {
  const map = {
    pending: "待处理",
    waiting: "等待中",
    processing: "处理中",
    completed: "已完成",
    failed: "失败",
  };
  return map[status] || status;
}

function getExecutionStatusInfo(row: QueueMessage): ExecutionStatusInfo {
  const indicator = resolveTaskExecutionReadinessIndicator(row);
  return {
    text: indicator.text,
    type: indicator.type,
    reason: indicator.reason || null,
    ready: indicator.ready,
  };
}

function getQueueTaskDispatchTarget(row?: QueueMessage | null) {
  const meta = getPublishDispatchMeta(row);
  const runtime = extractTaskRuntime(
    normalizeTaskDataRecord(row?.data),
    row?.taskRuntimeLog,
  );
  const clientId = String(meta?.assignedClientId || runtime?.assignedClientId || "").trim() || null;
  const machineCode =
    String(meta?.assignedMachineCode || runtime?.assignedMachineCode || "").trim() || null;
  const profileId =
    String(
      meta?.profileId ||
        row?.metadata?.profileId ||
        row?.metadata?.browserAutomationProfileId ||
        runtime?.assignedProfileId ||
        "",
    ).trim() || null;

  return {
    clientId,
    machineCode,
    profileId,
  };
}

function getQueueTaskDispatchTargetText(row?: QueueMessage | null) {
  const target = getQueueTaskDispatchTarget(row);
  if (!target.clientId && !target.profileId) {
    return "-";
  }

  const clientLabel = target.machineCode || target.clientId || "未知客户端";
  const profileLabel = target.profileId ? `实例 ${target.profileId}` : "默认实例";
  return `${clientLabel} / ${profileLabel}`;
}

function getQueueTaskDispatchTargetHint(row?: QueueMessage | null) {
  const meta = getPublishDispatchMeta(row);
  const hints = [
    meta?.status ? `调度状态: ${meta.status}` : "",
    meta?.currentStep ? String(meta.currentStep) : "",
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return hints.join(" · ");
}

function resolveQueueTaskStatusMessage(row?: QueueMessage | null) {
  const normalizedStatus = String(row?.status || "")
    .trim()
    .toLowerCase();
  const meta = getPublishDispatchMeta(row);
  const currentStep = String(meta?.currentStep || "").trim();
  const lastError = String(meta?.lastError || row?.error || "").trim();
  const dispatchStatus = String(meta?.status || "")
    .trim()
    .toLowerCase();

  if (
    currentStep &&
    (normalizedStatus === "processing" ||
      dispatchStatus === "assigned" ||
      dispatchStatus === "running")
  ) {
    return currentStep;
  }

  if (lastError && (normalizedStatus === "failed" || dispatchStatus === "failed")) {
    return lastError;
  }

  if (dispatchStatus === "timeout") {
    return lastError || currentStep || "执行超时";
  }

  if (currentStep) {
    return currentStep;
  }

  switch (normalizedStatus) {
    case "completed":
      return "执行完成";
    case "failed":
      return lastError || "执行失败";
    case "processing":
      return "执行中";
    case "waiting":
      return "等待服务端准备";
    case "pending":
      return getExecutionStatusInfo(row as QueueMessage).reason || "待处理";
    default:
      return lastError || "-";
  }
}

function canStartPublishExecution(row: QueueMessage) {
  const executionStatus = getExecutionStatusInfo(row);
  if (!isPublishTaskRow(row)) {
    return false;
  }
  if (row.status === "waiting" || row.status === "processing") {
    return false;
  }
  return !!executionStatus.ready;
}

function canStopPublishExecution(row: QueueMessage) {
  if (!isPublishTaskRow(row)) {
    return false;
  }

  const dispatchMeta = getPublishDispatchMeta(row);
  return (
    row.status === "processing" ||
    dispatchMeta.status === "assigned" ||
    dispatchMeta.status === "running"
  );
}

function canResetPublishExecution(row: QueueMessage) {
  if (!isPublishTaskRow(row)) {
    return false;
  }

  return !canStopPublishExecution(row);
}

function parseMaybeJson(value: any) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "object") {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
}

function normalizeTaskRuntimeLogRecord(value: any) {
  const parsed = parseMaybeJson(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
}

function extractTaskRuntime(data: any, runtimeLog?: any) {
  if (!data || typeof data !== "object") {
    const runtimeLogRecord = normalizeTaskRuntimeLogRecord(runtimeLog);
    if (!runtimeLogRecord) {
      return null;
    }
    return {
      ...runtimeLogRecord,
      logs: Array.isArray(runtimeLogRecord.logs) ? runtimeLogRecord.logs : [],
    };
  }

  const runtimeLogRecord = normalizeTaskRuntimeLogRecord(runtimeLog);
  if (runtimeLogRecord) {
    const summary =
      data.taskLogs && typeof data.taskLogs === "object" && !Array.isArray(data.taskLogs)
        ? data.taskLogs
        : {};
    return {
      source: runtimeLogRecord.source || summary.source || "uploader",
      sourceId: runtimeLogRecord.sourceId || summary.sourceId || null,
      platform: runtimeLogRecord.platform || summary.platform || null,
      status: summary.status || runtimeLogRecord.status || null,
      step: summary.step || summary.currentStep || runtimeLogRecord.step || null,
      logCount:
        typeof runtimeLogRecord.logCount === "number"
          ? runtimeLogRecord.logCount
          : Array.isArray(runtimeLogRecord.logs)
            ? runtimeLogRecord.logs.length
            : Number(summary.logCount) || 0,
      lastLogId: runtimeLogRecord.lastLogId || summary.lastLogId || null,
      lastLogTime: runtimeLogRecord.lastLogTime || summary.lastLogTime || null,
      lastLogLevel: runtimeLogRecord.lastLogLevel || summary.lastLogLevel || null,
      lastLogMessage: runtimeLogRecord.lastLogMessage || summary.lastLogMessage || null,
      updatedAt: runtimeLogRecord.updatedAt || summary.updatedAt || null,
      logs: Array.isArray(runtimeLogRecord.logs) ? runtimeLogRecord.logs : [],
    };
  }

  if (data.taskLogs && typeof data.taskLogs === "object") {
    return data.taskLogs;
  }

  if (data.taskRuntime && typeof data.taskRuntime === "object") {
    return data.taskRuntime;
  }

  const legacyRuntime = data.executionRuntime;
  if (!legacyRuntime || typeof legacyRuntime !== "object") {
    return null;
  }

  if (Array.isArray(legacyRuntime.logs)) {
    return legacyRuntime;
  }

  const firstPlatformKey = Object.keys(legacyRuntime)[0];
  if (!firstPlatformKey) {
    return null;
  }

  const firstPlatformRuntime = legacyRuntime[firstPlatformKey];
  if (!firstPlatformRuntime || typeof firstPlatformRuntime !== "object") {
    return null;
  }

  return {
    platform: firstPlatformRuntime.platform || firstPlatformKey,
    logs: Array.isArray(firstPlatformRuntime.logs) ? firstPlatformRuntime.logs : [],
  };
}

function formatLogTimestamp(value: any) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}

function normalizeLogLevel(level: any) {
  const normalized = String(level || "info")
    .trim()
    .toLowerCase();

  if (["error", "danger"].includes(normalized)) return "error";
  if (["warn", "warning"].includes(normalized)) return "warning";
  if (["success", "ok", "done", "completed"].includes(normalized)) return "success";
  if (["debug", "trace"].includes(normalized)) return "debug";
  return "info";
}

function hasLogData(log: any) {
  return (
    log?.data !== undefined &&
    log?.data !== null &&
    !(Array.isArray(log.data) && log.data.length === 0)
  );
}

function formatLogData(value: any) {
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
}

function openRuntimeLogData(log: any, index: number) {
  runtimeLogDataDialogMeta.time = formatLogTimestamp(log?.time || log?.timestamp);
  runtimeLogDataDialogMeta.level = String(log?.level || "info").toUpperCase();
  runtimeLogDataDialogMeta.message = String(log?.message || `日志 #${index + 1}`);
  runtimeLogDataDialogText.value = formatLogData(log?.data);
  runtimeLogDataDialogVisible.value = true;
}

function formatRawJson(value: any) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch (error) {
    return String(value ?? "");
  }
}

function getQueueRowClassName(row: QueueMessage) {
  if (!isPublishTaskRow(row)) {
    return "";
  }

  const dispatchMeta = getPublishDispatchMeta(row);
  if (
    row.status === "processing" ||
    dispatchMeta.status === "assigned" ||
    dispatchMeta.status === "running"
  ) {
    return "queue-row queue-row--running";
  }

  if (
    dispatchMeta.status === "failed" ||
    dispatchMeta.status === "timeout" ||
    row.status === "failed"
  ) {
    return "queue-row queue-row--failed";
  }

  return "queue-row";
}

function normalizeTaskDataRecord(value: any) {
  const parsed = parseMaybeJson(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

// 获取列表
async function getList(options?: unknown) {
  const silent =
    !!options &&
    typeof options === "object" &&
    "silent" in options &&
    !!(options as { silent?: boolean }).silent;
  const requestSeq = silent ? queueListRequestSeq : ++queueListRequestSeq;
  const silentRequestSeq = silent ? ++queueListSilentRequestSeq : 0;
  if (!silent) {
    queueListSilentRequestSeq += 1;
    queueListVisibleLoadingCount += 1;
    loading.value = true;
  }
  try {
    const [sortField, sortOrder] = queryParams.sortType.split("_");
    const res = await getTaskList({
      status: queryParams.status, // 不传 status 则查询所有状态
      type: queryParams.type?.trim() || undefined, // 不传 type 则查询所有类型
      id: queryParams.id?.trim() || undefined, // 不传 id 则查询所有ID
      sortField: sortField as "createdAt" | "updatedAt" | "processedAt",
      sortOrder: sortOrder as "ASC" | "DESC",
      includeTotal: true,
      limit: queryParams.pageSize,
      offset: (queryParams.currentPage - 1) * queryParams.pageSize,
    });

    let responseData = res;

    if (res && res.data && typeof res.data === "object" && !Array.isArray(res.data)) {
      if (
        res.data.success !== undefined ||
        res.data.list !== undefined ||
        res.data.total !== undefined
      ) {
        responseData = res.data;
      }
    }

    if (
      requestSeq !== queueListRequestSeq ||
      (silent && silentRequestSeq !== queueListSilentRequestSeq)
    ) {
      return;
    }

    if (responseData) {
      const isSuccess =
        responseData.success !== false && responseData.success !== undefined
          ? responseData.success
          : true;

      if (isSuccess) {
        const messages = responseData.list || responseData.messages || [];
        const totalCount =
          responseData.total !== undefined
            ? Number(responseData.total) || 0
            : Array.isArray(messages)
              ? messages.length
              : 0;

        dataSource.value = Array.isArray(messages) ? messages : [];
        if (!silent || responseData.total !== undefined) {
          total.value = totalCount;
        }
      } else {
        if (!silent) {
          dataSource.value = [];
          total.value = 0;
        }
      }
    } else {
      if (!silent) {
        dataSource.value = [];
        total.value = 0;
      }
    }
    if (!silent) {
      ids.value = [];
    }
  } catch (error: any) {
    if (requestSeq === queueListRequestSeq) {
      if (!silent) {
        ElMessage.error(error?.message || "获取列表失败");
        dataSource.value = [];
        total.value = 0;
      }
    }
  } finally {
    if (!silent) {
      queueListVisibleLoadingCount = Math.max(0, queueListVisibleLoadingCount - 1);
      if (queueListVisibleLoadingCount === 0) {
        loading.value = false;
      }
    }
  }
}

function handleSortTypeChange() {
  queryParams.currentPage = 1;
  getList();
}

async function refreshStats() {
  const requestSeq = ++queueStatsRequestSeq;
  try {
    const queueName = queryParams.type?.trim() || "";
    const res = await getQueueStats(queueName);

    let statsData = res;

    if (res && res.data && typeof res.data === "object" && !Array.isArray(res.data)) {
      if (
        res.data.queue !== undefined ||
        res.data.pending !== undefined ||
        res.data.processing !== undefined
      ) {
        statsData = res.data;
      } else if (res.data.data && typeof res.data.data === "object") {
        statsData = res.data.data;
      }
    }

    if (requestSeq !== queueStatsRequestSeq) {
      return;
    }

    if (statsData && typeof statsData === "object" && !Array.isArray(statsData)) {
      const nextStats = {
        queue: statsData.queue || queryParams.type?.trim() || "*",
        pending: Number(statsData.pending) || 0,
        waiting: Number(statsData.waiting) || 0,
        processing: Number(statsData.processing) || 0,
        delayed: Number(statsData.delayed) || 0,
        completed: Number(statsData.completed) || 0,
        failed: Number(statsData.failed) || 0,
        total: Number(statsData.total) || 0,
      };
      stats.value = nextStats;
      if (!queryParams.id?.trim()) {
        const statusTotal =
          queryParams.status && queryParams.status in nextStats
            ? Number(nextStats[queryParams.status]) || 0
            : nextStats.total;
        total.value = statusTotal;
      }
    }
  } catch {
    // 不显示错误提示，静默失败
  }
}

// 复选框变化
function checkboxChange(e) {
  ids.value = e.records.map((item) => item.id);
}

function checkboxAllChange(e) {
  ids.value = e.records.map((item) => item.id);
}

function getSelectedQueueRows() {
  const selectedIdSet = new Set(ids.value.map((id) => String(id || "").trim()).filter(Boolean));
  return dataSource.value.filter((row) => selectedIdSet.has(String(row.id || "").trim()));
}

// 任务类型清空处理
function handleTypeClear() {
  dataSource.value = [];
  total.value = 0;
  stats.value = {
    queue: "",
    pending: 0,
    waiting: 0,
    processing: 0,
    delayed: 0,
    completed: 0,
    failed: 0,
    total: 0,
  };
  localStorage.removeItem("queue_last_type");
}

// 新增
function handleAdd() {
  dialogTitle.value = "新增任务";
  dialogVisible.value = true;
  // 延迟重置表单，确保 dialogVisible 已更新
  setTimeout(() => {
    resetForm();
  }, 50);
}

// 编辑
function handleEdit(row: QueueMessage) {
  statusFormData.id = row.id;
  statusFormData.type = row.type;
  statusFormData.status = row.status;
  statusFormData.newStatus = row.status;
  statusFormData.error = row.error || "";
  statusDialogVisible.value = true;
}

function normalizeTaskDetailMessageResponse(payload: any) {
  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload)
  ) {
    if ("success" in payload) {
      if (payload.success === false) {
        throw new Error(String(payload.message || "获取任务详情失败"));
      }
      return payload.data;
    }

    if ("data" in payload && !("id" in payload)) {
      return payload.data;
    }
  }
  return payload;
}

function applyTaskDetailPayload(message: any, fallbackRow?: QueueMessage | null) {
  const fallbackData = parseMaybeJson(fallbackRow?.data) ?? fallbackRow?.data ?? {};
  const fallbackRuntimeLog = normalizeTaskRuntimeLogRecord(fallbackRow?.taskRuntimeLog) ?? null;
  const taskData = parseMaybeJson(message?.data);
  const taskRuntimeLog = normalizeTaskRuntimeLogRecord(message?.taskRuntimeLog);

  currentTaskData.value = taskData ?? fallbackData;
  currentTaskRuntimeLog.value = taskRuntimeLog ?? fallbackRuntimeLog;
}

async function fetchTaskDetailPayload(
  queue: string,
  messageId: string,
  options: {
    fallbackRow?: QueueMessage | null;
    silent?: boolean;
  } = {},
) {
  const res = await getTaskDetail(queue, messageId);
  const message = normalizeTaskDetailMessageResponse(res?.data ?? res);
  applyTaskDetailPayload(message, options.fallbackRow);
  return message;
}

function stopRuntimeLogDialogAutoRefresh() {
  if (runtimeLogDialogRefreshTimer) {
    clearInterval(runtimeLogDialogRefreshTimer);
    runtimeLogDialogRefreshTimer = null;
  }
  runtimeLogDialogRefreshing = false;
}

async function refreshRuntimeLogDialogDetail(options: { silent?: boolean } = {}) {
  if (!runtimeLogDialogVisible.value) {
    return;
  }
  if (runtimeLogDialogRefreshing) {
    return;
  }

  const queue = currentTaskQueue.value.trim();
  const messageId = currentTaskId.value.trim();
  if (!queue || !messageId) {
    return;
  }

  runtimeLogDialogRefreshing = true;
  if (!options.silent) {
    runtimeLogDialogLoading.value = true;
  }

  try {
    await fetchTaskDetailPayload(queue, messageId, { silent: options.silent });
  } catch (error) {
    if (!options.silent) {
      ElMessage.warning("运行日志获取失败，已显示最近一次日志快照");
    }
  } finally {
    if (!options.silent) {
      runtimeLogDialogLoading.value = false;
    }
    runtimeLogDialogRefreshing = false;
  }
}

function startRuntimeLogDialogAutoRefresh() {
  stopRuntimeLogDialogAutoRefresh();
  runtimeLogDialogRefreshTimer = setInterval(() => {
    void refreshRuntimeLogDialogDetail({ silent: true });
  }, 2000);
}

// 查看数据，优先拉取详情，避免列表数据被裁剪或序列化后显示为空
async function handleViewData(row: QueueMessage) {
  dataDialogVisible.value = true;
  dataDialogLoading.value = true;
  currentTaskData.value = {};
  currentTaskRuntimeLog.value = null;
  currentTaskId.value = row.id;
  currentTaskQueue.value = row.queue || row.type;

  try {
    await fetchTaskDetailPayload(row.queue || row.type, row.id, {
      fallbackRow: row,
    });
  } catch (error) {
    currentTaskData.value = parseMaybeJson(row?.data) ?? row?.data ?? {};
    currentTaskRuntimeLog.value = normalizeTaskRuntimeLogRecord(row?.taskRuntimeLog) ?? null;
    ElMessage.warning("任务详情获取失败，已显示列表中的数据快照");
  } finally {
    dataDialogLoading.value = false;
  }
}

async function handleViewRuntimeLogs(row: QueueMessage) {
  runtimeLogDialogVisible.value = true;
  runtimeLogDialogLoading.value = true;
  currentTaskData.value = {};
  currentTaskRuntimeLog.value = normalizeTaskRuntimeLogRecord(row?.taskRuntimeLog) ?? null;
  currentTaskId.value = row.id;
  currentTaskQueue.value = row.queue || row.type;

  try {
    await fetchTaskDetailPayload(row.queue || row.type, row.id, {
      fallbackRow: row,
    });
  } catch (error) {
    currentTaskData.value = parseMaybeJson(row?.data) ?? row?.data ?? {};
    currentTaskRuntimeLog.value = normalizeTaskRuntimeLogRecord(row?.taskRuntimeLog) ?? null;
    ElMessage.warning("运行日志获取失败，已显示列表中的数据快照");
  } finally {
    runtimeLogDialogLoading.value = false;
  }
}

function openPublishDispatchDialog(row: QueueMessage) {
  const executionStatus = getExecutionStatusInfo(row);
  if (!executionStatus.ready) {
    ElMessage.warning(executionStatus.reason || "当前任务尚未满足执行条件");
    return;
  }

  dispatchTargetTask.value = row;
  selectedDispatchClientId.value = "";
  selectedDispatchProfileId.value = "";
  publishDispatchDialogVisible.value = true;
}

function syncAutoDispatchTargetSelection() {
  const matched = autoDispatchRows.value.find(
    (item) => item.optionKey === selectedAutoDispatchOptionKey.value,
  );
  if (matched) {
    return;
  }

  const preferredRow = autoDispatchSelectableRows.value[0] || autoDispatchRows.value[0];
  autoDispatchTargetClientId.value = preferredRow?.selectable ? preferredRow.clientId : "";
  autoDispatchTargetProfileId.value =
    preferredRow?.selectable && preferredRow.profileId ? preferredRow.profileId : "";
}

function openAutoDispatchTargetDialog() {
  syncAutoDispatchTargetSelection();
  autoDispatchTargetDialogVisible.value = true;
}

function splitAutoDispatchKeywordText(value: string) {
  return String(value || "")
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinAutoDispatchKeywords(value?: string[] | null) {
  return (Array.isArray(value) ? value : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join("，");
}

function buildAutoDispatchFilterFromForm(): PublishTaskAutoDispatchFilter {
  const [createdAfter = "", createdBefore = ""] = Array.isArray(
    autoDispatchFilterDateRange.value,
  )
    ? autoDispatchFilterDateRange.value
    : [];

  return {
    taskTypes: autoDispatchFilterForm.taskTypes
      .map((item) => String(item || "").trim())
      .filter(Boolean),
    includeKeywords: splitAutoDispatchKeywordText(
      autoDispatchFilterForm.includeKeywordsText,
    ),
    excludeKeywords: splitAutoDispatchKeywordText(
      autoDispatchFilterForm.excludeKeywordsText,
    ),
    createdAfter: String(createdAfter || "").trim(),
    createdBefore: String(createdBefore || "").trim(),
  };
}

function applyAutoDispatchFilterToForm(filter?: Partial<PublishTaskAutoDispatchFilter> | null) {
  autoDispatchFilterForm.taskTypes = Array.isArray(filter?.taskTypes)
    ? filter.taskTypes.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  autoDispatchFilterForm.includeKeywordsText = joinAutoDispatchKeywords(
    filter?.includeKeywords,
  );
  autoDispatchFilterForm.excludeKeywordsText = joinAutoDispatchKeywords(
    filter?.excludeKeywords,
  );
  const createdAfter = String(filter?.createdAfter || "").trim();
  const createdBefore = String(filter?.createdBefore || "").trim();
  autoDispatchFilterDateRange.value =
    createdAfter || createdBefore ? [createdAfter, createdBefore] : [];
}

function getAutoDispatchFilterSummary(filter?: Partial<PublishTaskAutoDispatchFilter> | null) {
  const parts: string[] = [];
  const taskTypeCount = Array.isArray(filter?.taskTypes) ? filter.taskTypes.length : 0;
  const includeCount = Array.isArray(filter?.includeKeywords)
    ? filter.includeKeywords.length
    : 0;
  const excludeCount = Array.isArray(filter?.excludeKeywords)
    ? filter.excludeKeywords.length
    : 0;

  if (taskTypeCount > 0) {
    parts.push(`${taskTypeCount} 类任务`);
  }
  if (includeCount > 0) {
    parts.push(`包含 ${includeCount}`);
  }
  if (excludeCount > 0) {
    parts.push(`排除 ${excludeCount}`);
  }
  if (filter?.createdAfter || filter?.createdBefore) {
    parts.push("限定时间");
  }

  return parts.length ? `过滤：${parts.join(" / ")}` : "过滤：全部待处理";
}

function getAutoDispatchTaskTypeLabel(type: string) {
  const normalizedType = String(type || "").trim();
  const matched = publishTaskTypeOptions.value.find((item) => item.value === normalizedType);
  return matched?.label ? `${matched.label}（${normalizedType}）` : normalizedType;
}

function getAutoDispatchFilterDetail(filter?: Partial<PublishTaskAutoDispatchFilter> | null) {
  const taskTypes = Array.isArray(filter?.taskTypes)
    ? filter.taskTypes.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const includeKeywords = Array.isArray(filter?.includeKeywords)
    ? filter.includeKeywords.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const excludeKeywords = Array.isArray(filter?.excludeKeywords)
    ? filter.excludeKeywords.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const createdAfter = String(filter?.createdAfter || "").trim();
  const createdBefore = String(filter?.createdBefore || "").trim();

  return [
    `任务类型：${
      taskTypes.length ? taskTypes.map(getAutoDispatchTaskTypeLabel).join("、") : "全部"
    }`,
    `创建时间：${createdAfter || "不限"} 至 ${createdBefore || "不限"}`,
    `包含词：${includeKeywords.length ? includeKeywords.join("、") : "无"}`,
    `排除词：${excludeKeywords.length ? excludeKeywords.join("、") : "无"}`,
  ].join("\n");
}

function applyPublishTaskAutoDispatchSettingState(setting: PublishTaskAutoDispatchSetting) {
  publishTaskAutoDispatchEnabled.value = !!setting.autoSchedulingEnabled;
  setPublishTaskAutoSchedulingEnabled(!!setting.autoSchedulingEnabled);
  autoDispatchTargetClientId.value = String(setting.autoDispatchClientId || "").trim();
  autoDispatchTargetProfileId.value = String(setting.autoDispatchProfileId || "").trim();
  applyAutoDispatchFilterToForm(setting.autoDispatchFilter);
}

async function refreshPublishDispatchPageState(
  options: {
    includeBrowserClients?: boolean;
    includeAutoDispatchSetting?: boolean;
    includeSchedulerRuntime?: boolean;
  } = {},
) {
  const tasks: Promise<any>[] = [getList(), refreshStats(), refreshPublishTaskRuntime()];
  if (options.includeBrowserClients !== false) {
    tasks.push(refreshClientNodes());
  }
  if (options.includeAutoDispatchSetting) {
    tasks.push(loadPublishTaskAutoDispatchSettingState());
  }
  if (options.includeSchedulerRuntime) {
    tasks.push(loadPublishTaskSchedulerRuntime());
  }
  await Promise.all(tasks);
}

async function handleOpenPublishDispatchDialog() {
  publishDispatchDialogLoading.value = true;
  try {
    await Promise.all([refreshClientNodes(), refreshPublishTaskRuntime()]);
    syncDispatchProfileSelection();
  } finally {
    publishDispatchDialogLoading.value = false;
  }
}

async function handleOpenAutoDispatchTargetDialog() {
  autoDispatchTargetDialogLoading.value = true;
  try {
    await Promise.all([refreshClientNodes(), loadPublishTaskAutoDispatchSettingState()]);
    syncAutoDispatchTargetSelection();
  } finally {
    autoDispatchTargetDialogLoading.value = false;
  }
}

async function handleConfirmPublishDispatch() {
  if (!dispatchTargetTask.value) {
    return;
  }
  const selectedRow = selectedDispatchRow.value;
  if (!selectedRow) {
    ElMessage.warning("请选择一个客户端节点");
    return;
  }
  if (!selectedRow.selectable) {
    ElMessage.warning("请选择一个可执行节点");
    return;
  }

  const selectedClient = dispatchClientCandidates.value.find(
    (client) => client.id === selectedRow.clientId,
  );
  if (
    !selectedClient ||
    !getClientTaskTypeState(selectedClient, dispatchTargetTask.value.type).enabled
  ) {
    ElMessage.warning("当前选中的节点已不可执行，请重新选择");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确认由客户端 ${formatClientNodeName(selectedClient)} 开始执行该发布任务吗？`,
      "开始执行确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "info",
      },
    );
  } catch {
    return;
  }

  publishDispatchSubmitting.value = true;
  try {
    await startPublishTaskDispatch(dispatchTargetTask.value.id, {
      clientId: selectedRow.clientId,
      profileId: selectedRow.profileId || undefined,
    });
    schedulePublishTaskMenuRuntimeSync();
    ElMessage.success("发布任务已分配到客户端执行");
    publishDispatchDialogVisible.value = false;
    await refreshPublishDispatchPageState();
  } catch (error: any) {
    ElMessage.error(extractRequestErrorMessage(error, "发布任务分发失败"));
  } finally {
    publishDispatchSubmitting.value = false;
  }
}

async function handleConfirmAutoDispatchTarget() {
  const selectedRow = selectedAutoDispatchRow.value;
  if (!selectedRow?.selectable || !selectedRow.profileId) {
    ElMessage.warning("请选择一个可绑定的执行环境");
    return;
  }

  autoDispatchTargetSubmitting.value = true;
  publishTaskAutoDispatchLoading.value = true;
  try {
    const { setting, triggerResult } = await enablePublishTaskAutoDispatch({
      clientId: selectedRow.clientId,
      profileId: selectedRow.profileId,
      filter: buildAutoDispatchFilterFromForm(),
    });
    applyPublishTaskAutoDispatchSettingState(setting);
    autoDispatchTargetDialogVisible.value = false;

    schedulePublishTaskMenuRuntimeSync();
    if (triggerResult?.success === false) {
      ElMessage.warning(triggerResult?.message || "已保存自动执行设置，但立即触发失败");
    } else {
      ElMessage.success(triggerResult?.message || "已保存自动执行设置并开启");
    }
    await refreshPublishDispatchPageState({
      includeAutoDispatchSetting: true,
      includeSchedulerRuntime: true,
    });
  } catch (error: any) {
    ElMessage.error(error?.message || "保存自动执行设置失败");
  } finally {
    autoDispatchTargetSubmitting.value = false;
    publishTaskAutoDispatchLoading.value = false;
  }
}

async function loadPublishTaskAutoDispatchSettingState() {
  const setting = await fetchPublishTaskAutoDispatchSetting();
  applyPublishTaskAutoDispatchSettingState(setting);
}

async function loadPublishTaskSchedulerRuntime() {
  try {
    const response = await getPublishTaskAutoDispatchRuntime();
    publishTaskSchedulerRuntime.value = normalizeAutoDispatchSchedulerRuntime(response);
  } catch {
    publishTaskSchedulerRuntime.value = null;
  }
}

async function handleTogglePublishAutoDispatch(enabled: boolean) {
  if (enabled) {
    openAutoDispatchTargetDialog();
    return;
  }

  publishTaskAutoDispatchLoading.value = true;
  try {
    const setting = await disablePublishTaskAutoDispatch({
      clientId: autoDispatchTargetClientId.value || undefined,
      profileId: autoDispatchTargetProfileId.value || undefined,
      filter: buildAutoDispatchFilterFromForm(),
    });
    applyPublishTaskAutoDispatchSettingState(setting);
    ElMessage.success("已关闭自动执行");
    await refreshPublishDispatchPageState({
      includeAutoDispatchSetting: true,
      includeSchedulerRuntime: true,
    });
  } catch (error: any) {
    ElMessage.error(error?.message || "更新自动执行开关失败");
  } finally {
    publishTaskAutoDispatchLoading.value = false;
  }
}

function schedulePublishTaskListRefresh() {
  if (publishTaskRuntimeReloadTimer) {
    clearTimeout(publishTaskRuntimeReloadTimer);
  }

  publishTaskRuntimeReloadTimer = setTimeout(() => {
    publishTaskRuntimeReloadTimer = null;
    void Promise.all([getList({ silent: true }), refreshStats()]);
  }, 1800);
}

function schedulePublishTaskCountersRefresh() {
  if (publishTaskCountersRefreshTimer) {
    clearTimeout(publishTaskCountersRefreshTimer);
  }

  publishTaskCountersRefreshTimer = setTimeout(() => {
    publishTaskCountersRefreshTimer = null;
    void refreshStats();
  }, 1200);
}

function schedulePublishTaskMenuRuntimeSync() {
  void refreshPublishTaskRuntime();
  if (publishTaskMenuRuntimeSyncTimer) {
    clearTimeout(publishTaskMenuRuntimeSyncTimer);
  }
  publishTaskMenuRuntimeSyncTimer = setTimeout(() => {
    publishTaskMenuRuntimeSyncTimer = null;
    void refreshPublishTaskRuntime();
  }, 1500);
}

function findQueueTaskIndexById(taskId: unknown) {
  const normalizedTaskId = String(taskId || "").trim();
  if (!normalizedTaskId) {
    return -1;
  }

  return dataSource.value.findIndex((item) => String(item?.id || "").trim() === normalizedTaskId);
}

function shouldIgnorePublishTaskRuntimeRegression(row: QueueMessage, nextStatus?: string) {
  const normalizedNextStatus = String(nextStatus || "")
    .trim()
    .toLowerCase();
  if (!normalizedNextStatus) {
    return false;
  }

  const currentDispatchMeta: any = getPublishDispatchMeta(row);
  const currentStatus = String(row?.status || "")
    .trim()
    .toLowerCase();
  const currentDispatchStatus = String(currentDispatchMeta?.status || "")
    .trim()
    .toLowerCase();

  if (currentStatus === "completed" || currentDispatchStatus === "completed") {
    return normalizedNextStatus !== "completed";
  }

  if (
    currentStatus === "failed" ||
    currentDispatchStatus === "failed" ||
    currentDispatchStatus === "timeout"
  ) {
    return normalizedNextStatus !== "failed" && normalizedNextStatus !== "completed";
  }

  return false;
}

function applyPublishTaskRuntimeEvent(event: PublishTaskRuntimeEvent) {
  const normalizedTaskId = String(event?.taskId || "").trim();
  if (!normalizedTaskId) {
    return;
  }

  const taskIndex = findQueueTaskIndexById(normalizedTaskId);
  if (taskIndex >= 0) {
    const row = dataSource.value[taskIndex];
    if (shouldIgnorePublishTaskRuntimeRegression(row, event.status)) {
      return;
    }
    const currentDispatchMeta: any = getPublishDispatchMeta(row);
    const nextRow: QueueMessage = {
      ...row,
      status:
        event.status === "completed"
          ? "completed"
          : event.status === "failed"
            ? "failed"
            : event.status === "pending"
              ? "pending"
              : "processing",
      error: event.status === "failed" ? event.error || event.message || row.error : undefined,
      updatedAt: event.reportedAt || row.updatedAt,
      metadata: {
        ...(row.metadata || {}),
        publishDispatch: {
          ...currentDispatchMeta,
          status: event.status === "pending" ? "pending" : event.status || "running",
          assignedClientId: event.clientId || currentDispatchMeta.assignedClientId || null,
          assignedMachineCode: event.machineCode || currentDispatchMeta.assignedMachineCode || null,
          profileId: String(event.profileId || "").trim() || currentDispatchMeta.profileId || null,
          currentStep:
            event.currentStep || event.message || currentDispatchMeta.currentStep || null,
          progress:
            typeof event.progress === "number"
              ? event.progress
              : (currentDispatchMeta.progress ?? null),
          lastHeartbeatAt: event.reportedAt || new Date().toISOString(),
          startedAt:
            event.status === "running" || event.status === "assigned"
              ? currentDispatchMeta.startedAt || new Date().toISOString()
              : currentDispatchMeta.startedAt || null,
          finishedAt:
            event.status === "completed" || event.status === "failed" || event.status === "pending"
              ? event.reportedAt || new Date().toISOString()
              : null,
          lastError: event.error || null,
        },
      },
      data: {
        ...normalizeTaskDataRecord(row.data),
        ...(event.runtime
          ? {
              taskLogs: event.runtime,
            }
          : {}),
      },
    };

    dataSource.value.splice(taskIndex, 1, nextRow);
  }

  if (
    String(dispatchTargetTask.value?.id || "").trim() === normalizedTaskId &&
    event.status === "running"
  ) {
    publishDispatchDialogVisible.value = false;
  }

  if (String(currentTaskId.value || "").trim() === normalizedTaskId && event.runtime) {
    currentTaskData.value = {
      ...normalizeTaskDataRecord(currentTaskData.value),
      taskLogs: event.runtime,
    };
    currentTaskRuntimeLog.value = {
      ...(normalizeTaskRuntimeLogRecord(currentTaskRuntimeLog.value) || {}),
      source: event.runtime.source || currentTaskRuntimeLog.value?.source || "uploader",
      sourceId: event.runtime.sourceId || currentTaskRuntimeLog.value?.sourceId || null,
      platform: event.runtime.platform || currentTaskRuntimeLog.value?.platform || null,
      logCount:
        typeof event.runtime.logCount === "number"
          ? event.runtime.logCount
          : (currentTaskRuntimeLog.value?.logCount ?? 0),
      lastLogId: event.runtime.lastLogId || currentTaskRuntimeLog.value?.lastLogId || null,
      lastLogTime: event.runtime.lastLogTime || currentTaskRuntimeLog.value?.lastLogTime || null,
      lastLogLevel: event.runtime.lastLogLevel || currentTaskRuntimeLog.value?.lastLogLevel || null,
      lastLogMessage:
        event.runtime.lastLogMessage || currentTaskRuntimeLog.value?.lastLogMessage || null,
      updatedAt: event.runtime.updatedAt || currentTaskRuntimeLog.value?.updatedAt || null,
      logs: Array.isArray(currentTaskRuntimeLog.value?.logs)
        ? currentTaskRuntimeLog.value.logs
        : [],
    };
  }

  if (event.status === "completed" || event.status === "failed" || event.status === "pending") {
    schedulePublishTaskListRefresh();
    return;
  }

  schedulePublishTaskCountersRefresh();
}

function applyPublishTaskCommandResultEvent(event: ServiceCommandResultEvent) {
  if (String(event?.action || "").trim() !== "executePublishTask") {
    return;
  }

  const taskId = String(event?.data?.taskId || "").trim();
  if (!taskId) {
    return;
  }

  if (event.success) {
    const taskIndex = findQueueTaskIndexById(taskId);
    if (taskIndex >= 0) {
      const row = dataSource.value[taskIndex];
      const currentDispatchMeta: any = getPublishDispatchMeta(row);
      dataSource.value.splice(taskIndex, 1, {
        ...row,
        status: "completed",
        error: undefined,
        updatedAt: event.finishedAt || row.updatedAt,
        metadata: {
          ...(row.metadata || {}),
          publishDispatch: {
            ...currentDispatchMeta,
            status: "completed",
            assignedClientId: event.clientId || currentDispatchMeta.assignedClientId || null,
            currentStep: event.message || "执行完成",
            progress: 100,
            lastHeartbeatAt: event.finishedAt || new Date().toISOString(),
            finishedAt: event.finishedAt || new Date().toISOString(),
            lastError: null,
          },
        },
      });
    }
  }

  schedulePublishTaskListRefresh();
}

// 删除任务
function handleDelete(row?: QueueMessage) {
  if (deleteLoading.value) return;
  if (!userStore.user?.isAdmin) {
    return ElMessage.warning("无权限：仅管理员可执行删除操作");
  }
  let delIds: string[] = [];
  if (row) {
    delIds = [row.id];
  } else if (!ids.value.length) {
    return ElMessage.warning("请选择要删除的数据");
  } else {
    delIds = [...ids.value];
  }

  ElMessageBox.confirm(`确认删除选中的${delIds.length}条数据吗`, "删除提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "error",
  })
    .then(async () => {
      try {
        deleteLoading.value = true;
        for (const id of delIds) {
          const task = dataSource.value.find((t) => t.id === id);
          if (task) {
            await deleteTask(task.queue, id);
          }
        }
        ElMessage.success("删除成功");
        await getList();
        await refreshStats();
      } catch (error) {
        ElMessage.error("删除失败");
      } finally {
        deleteLoading.value = false;
      }
    })
    .catch(() => {});
}

async function handleBatchResetPublishTasksToPending() {
  if (batchResetPendingLoading.value) return;
  const selectedRows = getSelectedQueueRows();
  if (!selectedRows.length) {
    return ElMessage.warning("请选择要重置的平台任务");
  }

  const publishRows = selectedRows.filter((row) => isPublishTaskRow(row));
  const ignoredNonPublishCount = selectedRows.length - publishRows.length;
  if (!publishRows.length) {
    return ElMessage.warning("选中的数据里没有平台发布任务");
  }

  try {
    await ElMessageBox.confirm(
      `确认将选中的 ${publishRows.length} 条平台任务重置为未运行吗？执行中的任务会自动跳过。`,
      "批量重置为未运行",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      },
    );

    batchResetPendingLoading.value = true;
    const response: any = await batchResetPublishTasksToPending(publishRows.map((row) => row.id));
    const payload = response?.data?.data ?? response?.data ?? response;
    const updated = Number(payload?.updated) || 0;
    const skipped = Array.isArray(payload?.skipped) ? payload.skipped : [];
    const skippedCount = skipped.length + ignoredNonPublishCount;

    if (updated > 0 && skippedCount > 0) {
      ElMessage.warning(`已重置 ${updated} 条，跳过 ${skippedCount} 条`);
    } else if (updated > 0) {
      ElMessage.success(`已重置 ${updated} 条平台任务`);
    } else {
      ElMessage.warning(skipped[0]?.reason || "没有可重置的平台任务");
    }

    schedulePublishTaskMenuRuntimeSync();
    await refreshPublishDispatchPageState();
  } catch (error: any) {
    if (error === "cancel" || error === "close") {
      return;
    }
    ElMessage.error(error?.message || "批量重置失败");
  } finally {
    batchResetPendingLoading.value = false;
  }
}

// 提交表单
async function handleSubmit() {
  if (submitLoading.value) return;
  try {
    submitLoading.value = true;
    await formRef.value.validate();

    // 检查任务类型
    if (!formData.type || !formData.type.trim()) {
      ElMessage.warning("请输入任务类型");
      return;
    }

    let taskData;
    try {
      taskData = JSON.parse(formData.dataStr);
    } catch (e) {
      ElMessage.error("任务数据格式错误，请输入有效的JSON");
      return;
    }

    // 只传递任务类型，后端会自动使用 type 作为 queue
    await createTask({
      type: formData.type.trim(),
      description: formData.description?.trim() || undefined,
      data: taskData,
      delay: formData.delay,
    });

    ElMessage.success("任务创建成功");
    dialogVisible.value = false;

    // 创建成功后，自动设置查询条件并刷新列表和统计
    const createdType = formData.type.trim();
    const currentType = queryParams.type?.trim() || "";

    // 如果当前没有查询条件，或者查询的就是创建的任务类型，则刷新
    if (!currentType || currentType === createdType) {
      queryParams.type = createdType;
      queryParams.currentPage = 1; // 重置到第一页

      // 等待一小段时间，确保后端数据已写入
      await new Promise((resolve) => setTimeout(resolve, 300));

      await getList();
      await refreshStats();
    } else {
      // 如果查询的是其他任务类型，只刷新统计（如果统计的是创建的任务类型）
      if (stats.value.queue === createdType) {
        await refreshStats();
      }
    }
  } catch (error: any) {
    ElMessage.error(error?.message || "创建任务失败");
  } finally {
    submitLoading.value = false;
  }
}

// 提交状态修改
async function handleStatusSubmit() {
  if (statusSubmitLoading.value) return;
  try {
    statusSubmitLoading.value = true;
    await statusFormRef.value.validate();

    // 如果新状态和当前状态相同，直接返回
    if (statusFormData.newStatus === statusFormData.status) {
      ElMessage.info("状态未发生变化");
      statusDialogVisible.value = false;
      return;
    }

    await updateTaskStatus(
      statusFormData.type,
      statusFormData.id,
      statusFormData.newStatus,
      statusFormData.newStatus === "failed" ? statusFormData.error : undefined,
    );

    ElMessage.success("状态修改成功");
    statusDialogVisible.value = false;
    await getList();
    await refreshStats();
  } catch (error: any) {
    ElMessage.error(error?.message || "操作失败");
  } finally {
    statusSubmitLoading.value = false;
  }
}

// 重置表单
function resetForm() {
  // 使用当前查询的任务类型，确保使用最新的值
  const currentType = queryParams.type?.trim() || "";
  Object.assign(formData, {
    type: currentType, // 使用当前查询的任务类型，如果没有则为空
    description: "",
    dataStr: "{}",
    delay: 0,
  });
  // 延迟清除验证，确保表单已更新
  setTimeout(() => {
    formRef.value?.clearValidate();
  }, 50);
}

// 更新数据
async function handleUpdateData(row: QueueMessage) {
  try {
    currentDataUpdateRow.value = row;
    const detailQueue = row.queue || row.type;
    const detailResponse = await getTaskDetail(detailQueue, row.id);
    const detailMessage = normalizeTaskDetailMessageResponse(
      detailResponse?.data ?? detailResponse,
    );
    const currentData = parseMaybeJson(detailMessage?.data) ?? detailMessage?.data ?? {};
    const dataStrValue =
      typeof currentData === "object" && currentData !== null
        ? JSON.stringify(currentData, null, 2)
        : String(currentData || "{}");

    dataUpdateFormData.queue = detailQueue;
    dataUpdateFormData.messageId = row.id;
    dataUpdateFormData.dataStr = dataStrValue;
    dataUpdateFormData.dataObj =
      typeof currentData === "string" ? JSON.parse(currentData) : currentData || {};
    dataUpdateDialogVisible.value = true;
  } catch (e) {
    ElMessage.error((e as Error)?.message || "获取任务详情失败");
  }
}

// 提交数据更新
async function handleDataUpdateSubmit() {
  if (dataUpdateSubmitting.value) return;
  let data: any;
  try {
    data = JSON.parse(dataUpdateFormData.dataStr);
  } catch (e) {
    ElMessage.error("请输入有效的JSON格式");
    return;
  }

  try {
    dataUpdateSubmitting.value = true;
    await updateTaskData(dataUpdateFormData.queue, dataUpdateFormData.messageId, data);
    ElMessage.success("数据已更新");
    dataUpdateDialogVisible.value = false;
    await getList();
  } catch (error: any) {
    ElMessage.error(error?.message || "更新数据失败");
  } finally {
    dataUpdateSubmitting.value = false;
  }
}

async function handleRegeneratePublishTask(row: QueueMessage) {
  const taskId = String(row?.id || "").trim();
  if (!taskId) {
    ElMessage.warning("缺少任务ID");
    return;
  }

  try {
    await ElMessageBox.confirm(
      "将基于当前套图信息和任务配置重新生成这条任务的发布数据，不会重新执行任务，是否继续？",
      "重新生成发布数据",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      },
    );

    loading.value = true;
    await regeneratePublishTaskApi(taskId);
    ElMessage.success("发布数据已重新生成");
    await getList();
    await refreshStats();
  } catch (error: any) {
    if (error === "cancel") {
      return;
    }
    ElMessage.error(error?.message || "重新生成发布数据失败");
  } finally {
    loading.value = false;
  }
}

async function handleStopPublishTask(row: QueueMessage) {
  const taskId = String(row?.id || "").trim();
  if (!taskId) {
    ElMessage.warning("缺少任务标识");
    return;
  }

  if (!canStopPublishExecution(row)) {
    ElMessage.warning("当前任务不在执行中");
    return;
  }

  try {
    await ElMessageBox.confirm(
      "停止后当前运行会立即中断，并标记为失败，后续可以再重置为未运行状态重新执行，是否继续？",
      "停止任务",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      },
    );

    loading.value = true;
    await stopPublishTaskDispatch(taskId, {
      reason: "管理员手动停止任务",
    });
    ElMessage.success("停止指令已发送");
    schedulePublishTaskMenuRuntimeSync();
    await refreshPublishDispatchPageState();
  } catch (error: any) {
    if (error === "cancel" || error === "close") {
      return;
    }
    ElMessage.error(error?.message || "停止任务失败");
  } finally {
    loading.value = false;
  }
}

async function handleResetPublishTask(row: QueueMessage) {
  const taskId = String(row?.id || "").trim();
  if (!taskId) {
    ElMessage.warning("缺少任务标识");
    return;
  }

  if (!canResetPublishExecution(row)) {
    ElMessage.warning("任务执行中，请先停止任务");
    return;
  }

  try {
    await ElMessageBox.confirm(
      "这会清空当前任务的执行状态、错误信息和运行日志，并恢复为未运行的初始状态，是否继续？",
      "重置为未运行",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      },
    );

    loading.value = true;
    await resetPublishTaskDispatch(taskId, {
      reason: "管理员重置为未运行状态",
    });
    ElMessage.success("任务已重置为未运行状态");
    schedulePublishTaskMenuRuntimeSync();
    await refreshPublishDispatchPageState();
  } catch (error: any) {
    if (error === "cancel" || error === "close") {
      return;
    }
    ElMessage.error(error?.message || "重置任务失败");
  } finally {
    loading.value = false;
  }
}

async function handleOperationCommand(command: string, row: QueueMessage) {
  switch (command) {
    case "startExecution":
      openPublishDispatchDialog(row);
      break;
    case "stopExecution":
      await handleStopPublishTask(row);
      break;
    case "resetExecutionState":
      await handleResetPublishTask(row);
      break;
    case "regenerate":
      await handleRegeneratePublishTask(row);
      break;
    case "updateData":
      await handleUpdateData(row);
      break;
    case "editStatus":
      handleEdit(row);
      break;
    case "delete":
      handleDelete(row);
      break;
    default:
      break;
  }
}

// 重置数据更新表单
function resetDataUpdateForm() {
  dataUpdateFormData.queue = "";
  dataUpdateFormData.messageId = "";
  dataUpdateFormData.dataStr = "";
  currentDataUpdateRow.value = null;
  setTimeout(() => {
    dataUpdateFormRef.value?.clearValidate();
  }, 50);
}

// 监听任务类型变化，保存到 localStorage
watch(
  () => queryParams.type,
  (newType) => {
    if (newType && newType.trim()) {
      localStorage.setItem("queue_last_type", newType.trim());
    } else {
      localStorage.removeItem("queue_last_type");
    }
  },
);

watch(dispatchAvailableRows, () => {
  syncDispatchProfileSelection();
});

watch(autoDispatchRows, () => {
  syncAutoDispatchTargetSelection();
});

watch(runtimeLogDialogVisible, (visible) => {
  if (visible) {
    startRuntimeLogDialogAutoRefresh();
    return;
  }

  stopRuntimeLogDialogAutoRefresh();
  runtimeLogDialogLoading.value = false;
});

// 初始化
onMounted(() => {
  void Promise.all([
    getList(),
    refreshStats(),
    refreshClientNodes(),
    refreshPublishTaskTypeOptions(),
    loadPublishTaskAutoDispatchSettingState(),
    loadPublishTaskSchedulerRuntime(),
    refreshPublishTaskRuntime(),
  ]);
  publishTaskSchedulerRuntimeTimer = setInterval(() => {
    void loadPublishTaskSchedulerRuntime();
  }, 10000);
  websocketClient.events.on("publishTaskRuntime", applyPublishTaskRuntimeEvent);
  websocketClient.events.on("serviceCommandResult", applyPublishTaskCommandResultEvent);
});

onUnmounted(() => {
  if (publishTaskSchedulerRuntimeTimer) {
    clearInterval(publishTaskSchedulerRuntimeTimer);
    publishTaskSchedulerRuntimeTimer = null;
  }
  if (publishTaskMenuRuntimeSyncTimer) {
    clearTimeout(publishTaskMenuRuntimeSyncTimer);
    publishTaskMenuRuntimeSyncTimer = null;
  }
  if (publishTaskRuntimeReloadTimer) {
    clearTimeout(publishTaskRuntimeReloadTimer);
    publishTaskRuntimeReloadTimer = null;
  }
  if (publishTaskCountersRefreshTimer) {
    clearTimeout(publishTaskCountersRefreshTimer);
    publishTaskCountersRefreshTimer = null;
  }
  stopRuntimeLogDialogAutoRefresh();
  websocketClient.events.off("publishTaskRuntime", applyPublishTaskRuntimeEvent);
  websocketClient.events.off("serviceCommandResult", applyPublishTaskCommandResultEvent);
});
</script>
<style lang="less">
.queue-page.list-page-layout {
  gap: 10px;
  padding: 8px 0 0;
}

.queue-page .list-page-layout__main {
  gap: 10px;
}

.queue-page .list-page-filter--flat {
  gap: 10px;
  padding-bottom: 10px;
}

.queue-page .list-page-table-panel__pagination--flat {
  padding-top: 10px;
}

.queue-page__main {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.queue-page__stats-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-height: 32px;
  padding: 4px 0;
}

.queue-stats-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 24px;
  padding: 0 4px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--el-text-color-secondary);
}

.queue-stats-pill__label {
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}

.queue-stats-pill__value {
  min-width: 20px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.queue-stats-pill + .queue-stats-pill::before {
  content: "";
  width: 1px;
  height: 12px;
  margin-right: 2px;
  background: var(--el-border-color-lighter);
}

.queue-stats-pill--pending .queue-stats-pill__value {
  color: var(--el-color-info);
}

.queue-stats-pill--processing .queue-stats-pill__value {
  color: var(--el-color-warning);
}

.queue-stats-pill--completed .queue-stats-pill__value {
  color: var(--el-color-success);
}

.queue-stats-pill--failed .queue-stats-pill__value {
  color: var(--el-color-danger);
}

.queue-dispatch-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex: 1 1 520px;
  min-width: min(100%, 380px);
  min-height: 28px;
  padding: 0 0 0 8px;
  border: 0;
  border-left: 1px solid var(--el-border-color-lighter);
  border-radius: 0;
  background: transparent;
}

.queue-dispatch-panel__main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 0;
  overflow: visible;
}

.queue-dispatch-panel__title {
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.queue-dispatch-panel__binding {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 1 1 180px;
  min-width: 120px;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1;
}

.queue-dispatch-panel__binding-label {
  flex: 0 0 auto;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.queue-dispatch-panel__binding-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.queue-dispatch-panel__binding-meta {
  flex: 1 1 140px;
  min-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.queue-dispatch-panel__filter-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex: 0 1 150px;
  min-width: 86px;
  max-width: 180px;
}

.queue-dispatch-panel__filter {
  display: inline-block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1;
}

.queue-dispatch-panel__filter-popover {
  position: absolute;
  right: 0;
  bottom: calc(100% + 8px);
  z-index: 20;
  width: max-content;
  max-width: 520px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
  color: var(--el-text-color-regular);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform: none;
  transition:
    opacity 0.12s ease,
    visibility 0.12s ease;
  white-space: pre-line;
  line-height: 1.6;
  font-size: 12px;
}

.queue-dispatch-panel__filter-wrap:hover .queue-dispatch-panel__filter-popover {
  opacity: 1;
  visibility: visible;
}

.queue-dispatch-panel__binding.is-success .queue-dispatch-panel__binding-value {
  color: #67c23a;
}

.queue-dispatch-panel__binding.is-warning .queue-dispatch-panel__binding-value {
  color: #f97316;
}

.queue-dispatch-panel__binding.is-info .queue-dispatch-panel__binding-value {
  color: #909399;
}

.queue-dispatch-panel__runtime {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 210px;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
}

.queue-dispatch-panel__runtime.is-success {
  color: #67c23a;
}

.queue-dispatch-panel__runtime.is-warning {
  color: #f97316;
}

.queue-dispatch-panel__runtime.is-danger {
  color: #f56c6c;
}

.queue-dispatch-panel__runtime.is-info {
  color: #909399;
}

.queue-dispatch-panel__runtime-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
  flex: 0 0 auto;
}

.queue-dispatch-panel__runtime.is-success .queue-dispatch-panel__runtime-dot {
  box-shadow: 0 0 0 0 rgb(103 194 58 / 24%);
  animation: queue-status-breath-success 1.8s infinite ease-in-out;
}

.queue-dispatch-panel__runtime.is-warning .queue-dispatch-panel__runtime-dot {
  box-shadow: 0 0 0 0 rgb(249 115 22 / 22%);
  animation: queue-status-breath-warning 1.8s infinite ease-in-out;
}

.queue-dispatch-panel__runtime-meta {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-placeholder);
}

.queue-dispatch-panel__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 0 0 auto;
  height: 22px;
  padding: 0 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background: var(--el-fill-color-light);
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.queue-dispatch-panel__status.is-success {
  border-color: rgb(103 194 58 / 24%);
  color: #67c23a;
}

.queue-dispatch-panel__status.is-info {
  border-color: rgb(144 147 153 / 24%);
  color: #909399;
}

.queue-dispatch-panel__status.is-warning {
  border-color: rgb(249 115 22 / 24%);
  color: #f97316;
}

.queue-dispatch-panel__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
}

.queue-dispatch-panel__status.is-success .queue-dispatch-panel__status-dot {
  box-shadow: 0 0 0 0 rgb(103 194 58 / 32%);
  animation: queue-status-breath-success 1.8s infinite ease-in-out;
}

.queue-dispatch-panel__status.is-warning .queue-dispatch-panel__status-dot {
  box-shadow: 0 0 0 0 rgb(249 115 22 / 28%);
  animation: queue-status-breath-warning 1.8s infinite ease-in-out;
}

.queue-operation-cell {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
}

.queue-runtime-log-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.queue-runtime-log-cell__count {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.queue-dispatch-target-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.queue-dispatch-target-cell__main {
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}

.queue-dispatch-target-cell__hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.queue-page :deep(.table-operation-cell .vxe-cell),
.queue-page :deep(.table-operation-cell .vxe-cell--wrapper),
.queue-page :deep(.table-operation-cell .vxe-cell--label) {
  min-height: 100%;
}

.queue-page :deep(.table-operation-cell .queue-operation-cell),
.queue-page :deep(.table-operation-cell .operation-dropdown),
.queue-page :deep(.table-operation-cell .operation-trigger-button) {
  display: inline-flex;
  align-items: center;
}

.queue-page :deep(.table-operation-cell .operation-trigger-button) {
  min-height: 28px;
}

.publish-dispatch-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 204px;
}

.publish-dispatch-dialog__panel {
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 62%, transparent 38%);
  border-radius: 6px;
  background: var(--el-bg-color);
  min-height: 206px;
}

.publish-dispatch-dialog__panel-title {
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 700;
}

.publish-dispatch-dialog__empty {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.publish-dispatch-dialog__table {
  overflow: hidden;
}

.publish-dispatch-filter-panel {
  min-height: 0;
}

.publish-dispatch-filter-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  column-gap: 16px;
  row-gap: 2px;
}

.publish-dispatch-filter-form .el-form-item {
  margin-bottom: 8px;
}

.publish-dispatch-filter-form .el-select,
.publish-dispatch-filter-form .el-input,
.publish-dispatch-filter-form__date {
  width: 100%;
}

.publish-dispatch-dialog__table :deep(.el-table) {
  --el-table-row-hover-bg-color: transparent;
  --el-table-current-row-bg-color: transparent;
  font-size: 12px;
}

.publish-dispatch-dialog__table :deep(.el-table td),
.publish-dispatch-dialog__table :deep(.el-table th) {
  padding-top: 7px;
  padding-bottom: 7px;
}

.publish-dispatch-dialog__table :deep(.el-table .cell) {
  padding-left: 8px;
  padding-right: 8px;
  line-height: 1.35;
}

.publish-dispatch-dialog__table :deep(.el-table__row) {
  cursor: pointer;
}

.publish-dispatch-dialog__table :deep(.el-table__row.is-disabled) {
  cursor: not-allowed;
}

.publish-dispatch-dialog__table :deep(.el-table__row.is-disabled td) {
  color: var(--el-text-color-placeholder);
}

.publish-dispatch-dialog__table :deep(.el-radio) {
  pointer-events: none;
  margin-right: 0;
}

.publish-dispatch-dialog__primary {
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 12px;
  line-height: 1.35;
}

.publish-dispatch-dialog__state-text {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
}

.publish-dispatch-dialog__state-text.is-success {
  color: #1f8f46;
}

.publish-dispatch-dialog__state-text.is-warning {
  color: #b26a00;
}

.publish-dispatch-dialog__state-text.is-danger {
  color: #d5485a;
}

.publish-dispatch-dialog__state-text.is-info {
  color: #356dd1;
}

.publish-dispatch-dialog__state-text.is-muted {
  color: var(--el-text-color-secondary);
}

.publish-dispatch-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
}

.publish-dispatch-dialog__summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.publish-dispatch-dialog__title {
  font-size: 15px;
  font-weight: 700;
}

.publish-dispatch-dialog__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.publish-dispatch-dialog__hint {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.55;
}

.publish-dispatch-dialog__hint--section {
  margin-top: -6px;
}

.publish-dispatch-dialog__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.publish-dispatch-dialog__section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.publish-dispatch-dialog__section-head--compact {
  gap: 12px;
}

.publish-dispatch-dialog__section-title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
}

.publish-dispatch-dialog__section-desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.55;
}

.publish-dispatch-dialog__section-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.publish-dispatch-dialog__meta-pill {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent 30%);
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-fill-color-light) 64%, white 36%);
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.publish-dispatch-dialog__meta-pill.is-muted {
  color: var(--el-text-color-secondary);
}

.publish-dispatch-dialog__meta-pill.is-warning {
  border-color: rgb(249 115 22 / 24%);
  color: #f97316;
}

.publish-dispatch-dialog__profile-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 58%, transparent 42%);
  border-radius: 14px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--el-fill-color-light) 68%, white 32%),
    #fff
  );
}

.publish-dispatch-dialog__profile-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.publish-dispatch-dialog__client-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.publish-dispatch-dialog__profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.publish-dispatch-client {
  display: flex;
  min-height: 108px;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 54%, transparent 46%);
  border-radius: 16px;
  background: color-mix(in srgb, var(--el-bg-color) 94%, transparent 6%);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.publish-dispatch-client:not(:disabled):hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--el-color-primary) 34%, transparent 66%);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.1);
}

.publish-dispatch-client.is-selected {
  border-color: color-mix(in srgb, var(--el-color-primary) 56%, transparent 44%);
  box-shadow:
    0 12px 26px rgba(37, 99, 235, 0.12),
    inset 0 0 0 1px rgba(37, 99, 235, 0.16);
}

.publish-dispatch-client.is-disabled {
  opacity: 0.62;
}

.publish-dispatch-client__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.publish-dispatch-client__title {
  min-width: 0;
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  word-break: break-word;
}

.publish-dispatch-client__desc {
  margin-top: 10px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.publish-dispatch-profile {
  display: flex;
  min-height: 120px;
  width: 100%;
  flex-direction: column;
  gap: 12px;
  padding: 14px 15px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 56%, transparent 44%);
  border-radius: 14px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, transparent 4%);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.publish-dispatch-profile:not(:disabled):hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--el-color-primary) 34%, transparent 66%);
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.08);
}

.publish-dispatch-profile.is-selected {
  border-color: color-mix(in srgb, var(--el-color-primary) 56%, transparent 44%);
  background: color-mix(in srgb, var(--el-color-primary-light-9) 62%, white 38%);
  box-shadow:
    0 12px 24px rgba(37, 99, 235, 0.1),
    inset 0 0 0 1px rgba(37, 99, 235, 0.14);
}

.publish-dispatch-profile.is-disabled {
  opacity: 0.62;
}

.publish-dispatch-profile__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.publish-dispatch-profile__title-wrap {
  min-width: 0;
  flex: 1;
}

.publish-dispatch-profile__title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  word-break: break-word;
}

.publish-dispatch-profile__caption {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.4;
}

.publish-dispatch-profile__badges {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.publish-dispatch-profile__selected {
  display: inline-flex;
  min-height: 22px;
  align-items: center;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.publish-dispatch-profile__desc {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.publish-dispatch-dialog__profile-empty {
  padding: 14px 16px;
  border: 1px dashed color-mix(in srgb, var(--el-border-color) 74%, transparent 26%);
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-fill-color-light) 56%, white 44%);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.queue-page :deep(.queue-row--running) {
  background:
    linear-gradient(90deg, rgba(20, 184, 166, 0.08), transparent 36%),
    linear-gradient(0deg, transparent, transparent);
}

.queue-page :deep(.queue-row--running .vxe-body--column) {
  background-color: transparent !important;
}

.queue-page :deep(.queue-row--failed) {
  background:
    linear-gradient(90deg, rgba(239, 68, 68, 0.06), transparent 32%),
    linear-gradient(0deg, transparent, transparent);
}

.data-preview {
  padding: 16px;
  border-radius: 4px;
  max-height: 400px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
}

.queue-json-viewer-shell,
.queue-json-editor-layout {
  height: 100%;
  min-height: 0;
}

.queue-json-viewer-shell {
  padding: 6px;
}

.queue-json-editor-layout {
  padding: 6px;
}

.queue-json-editor-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 42%);
  gap: 20px;
}

.queue-json-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.queue-json-panel__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.queue-json-panel__title {
  font-size: 14px;
  font-weight: 700;
}

.queue-json-panel__desc {
  font-size: 12px;
}

.queue-json-panel__body {
  flex: 1;
  min-height: 0;
}

.queue-json-panel__body--viewer {
  min-height: 0;
  overflow: auto;
  padding: 14px;
}

.queue-json-raw {
  margin: 0;
  min-height: 100%;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.queue-json-panel__body--editor {
  padding: 14px;
}

.queue-runtime-dialog :deep(.el-dialog) {
  height: 100vh;
  margin: 0;
  display: flex;
  flex-direction: column;
  border-radius: 0;
  overflow: hidden;
  background: rgba(33, 33, 33, 0.78);
  backdrop-filter: blur(8px);
}

.queue-runtime-dialog :deep(.el-dialog__header) {
  flex-shrink: 0;
  padding: 0;
  margin: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.queue-runtime-dialog :deep(.el-dialog__headerbtn) {
  top: 10px;
  right: 12px;
  z-index: 3;
}

.queue-runtime-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: rgba(255, 255, 255, 0.72);
}

.queue-runtime-dialog :deep(.el-dialog__body) {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(61, 157, 246, 0.08), transparent 28%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.46) 0%, rgba(8, 8, 8, 0.72) 100%);
}

.queue-runtime-dialog :deep(.el-dialog__footer) {
  flex-shrink: 0;
  padding: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(145deg, #1d1d1d, #121212);
}

.queue-runtime-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-family:
    "Fira Code", "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

.queue-runtime-window__chrome-btn--red {
  background: radial-gradient(circle at 30% 30%, #ff5f56, #bf2e2e);
}

.queue-runtime-window__chrome-btn--yellow {
  background: radial-gradient(circle at 30% 30%, #ffbd2e, #b4820e);
}

.queue-runtime-window__chrome-btn--green {
  background: radial-gradient(circle at 30% 30%, #27c93f, #199f2c);
}

.queue-runtime-window__toolbar-user {
  flex: 1;
  min-width: 0;
  color: #d5d0ce;
  font-size: 14px;
  line-height: 1.4;
  text-align: center;
}

.queue-runtime-window__toolbar-tab {
  padding: 0 8px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  color: #fff;
  background-color: rgba(255, 255, 255, 0.05);
  font-size: 13px;
  line-height: 1.4;
}

.queue-runtime-window__summary {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 14px 18px 8px;
}

.queue-runtime-window__summary-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.queue-runtime-window__summary-label {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
}

.queue-runtime-window__summary-value {
  color: #f8fafc;
  font-size: 12px;
  font-weight: 700;
}

.queue-runtime-window__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px 18px 18px;
}

.queue-runtime-console {
  min-height: 100%;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(17, 24, 39, 0.99) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 48px rgba(15, 23, 42, 0.16);
}

.queue-runtime-console--empty {
  display: flex;
  align-items: center;
}

.queue-runtime-console__line + .queue-runtime-console__line {
  margin-top: 8px;
}

.queue-runtime-console__line {
  padding: 10px 12px;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.52) 0%, rgba(15, 23, 42, 0.68) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.02),
    0 4px 10px rgba(2, 6, 23, 0.16);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.queue-runtime-console__line:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 8px 16px rgba(2, 6, 23, 0.2);
}

.queue-runtime-console__prompt,
.queue-runtime-console__empty {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 12px;
  line-height: 1.35;
}

.queue-runtime-console__user {
  color: #00ffae;
  text-shadow: 0 0 4px rgba(0, 255, 174, 0.45);
}

.queue-runtime-console__location {
  color: #3d9df6;
  text-shadow: 0 0 4px rgba(61, 157, 246, 0.42);
}

.queue-runtime-console__time {
  color: #94a3b8;
  font-size: 12px;
  letter-spacing: 0.01em;
}

.queue-runtime-console__content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
}

.queue-runtime-console__message {
  flex: 1;
  min-width: 0;
  color: #e5edf7;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  text-shadow: 0 0 3px rgba(255, 255, 255, 0.12);
}

.queue-runtime-console__line[data-level="warn"] .queue-runtime-console__message,
.queue-runtime-console__line[data-level="warning"] .queue-runtime-console__message {
  color: #fde68a;
}

.queue-runtime-console__line[data-level="error"] .queue-runtime-console__message {
  color: #fecaca;
}

.queue-runtime-console__line[data-level="success"] .queue-runtime-console__message {
  color: #dcfce7;
}

.queue-runtime-console__actions {
  flex: 0 0 auto;
  padding-top: 1px;
}

.queue-runtime-console__detail-trigger {
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  color: #a5d8ff;
  font-size: 12px;
  line-height: 1;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.queue-runtime-console__detail-trigger:hover {
  color: #d7ecff;
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.18);
}

.queue-runtime-console__detail-trigger:focus-visible {
  outline: 2px solid rgba(59, 130, 246, 0.3);
  outline-offset: 1px;
}

.queue-runtime-console__cursor-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.queue-runtime-console__cursor {
  display: inline-block;
  width: 6px;
  height: 14px;
  border-radius: 2px;
  background: #ffffff;
  animation: queue-runtime-cursor-blink 800ms steps(2) infinite;
}

.queue-runtime-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  color: #cbd5e1;
}

.queue-runtime-dialog__footer-meta {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  font-size: 12px;
}

.queue-runtime-dialog__footer-actions {
  margin-left: auto;
}

.queue-runtime-data-dialog__header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.queue-runtime-data-dialog__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.queue-runtime-data-dialog__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.queue-runtime-data-dialog__message {
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1.6;
}

.queue-runtime-data-dialog__body {
  max-height: min(60vh, 720px);
  overflow: auto;
  padding: 6px 2px 2px;
}

.queue-runtime-data-dialog__raw {
  margin: 0;
  padding: 14px 16px;
  overflow: auto;
  border: 1px solid rgb(15 23 42 / 12%);
  border-radius: 12px;
  background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
  color: #e5edf7;
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 3%),
    0 12px 26px rgb(15 23 42 / 10%);
}

.queue-json-textarea {
  height: 100%;
}

.queue-json-textarea :deep(.el-textarea) {
  height: 100%;
}

.queue-json-textarea :deep(.el-textarea__wrapper) {
  height: 100%;
  padding: 0;
}

.queue-json-textarea :deep(.el-textarea__inner) {
  height: 100%;
  border: 0;
  box-shadow: none;
  font-size: 13px;
  line-height: 1.7;
}

.queue-json-textarea :deep(.el-textarea__inner::placeholder) {
  color: inherit;
}

.queue-json-dialog :deep(.el-dialog__body) {
  height: calc(100vh - 120px);
  min-height: 0;
  overflow: hidden;
}

.queue-json-dialog :deep(.el-dialog__footer) {
  flex-shrink: 0;
}

@media (max-width: 960px) {
  .queue-page__stats-bar {
    gap: 6px;
  }

  .queue-stats-pill {
    min-height: 24px;
    padding: 0 3px;
  }

  .queue-dispatch-panel {
    width: 100%;
    flex: 1 1 100%;
    padding-top: 6px;
    border-top: 1px solid var(--el-border-color-lighter);
    border-left: 0;
  }

  .queue-dispatch-panel__main {
    flex-wrap: wrap;
    row-gap: 6px;
  }

  .queue-json-editor-layout {
    grid-template-columns: 1fr;
  }

  .queue-runtime-window__toolbar {
    padding-right: 44px;
  }

  .queue-runtime-window__toolbar-user {
    text-align: left;
  }

  .queue-runtime-window__summary,
  .queue-runtime-window__body,
  .queue-runtime-dialog__footer {
    padding-left: 14px;
    padding-right: 14px;
  }

  .queue-runtime-console__content {
    flex-direction: column;
    gap: 8px;
  }

  .queue-runtime-console__actions {
    padding-top: 0;
  }
}

@media (min-width: 768px) and (max-width: 1180px) {
  .queue-page {
    gap: 12px;
  }

  .queue-page__stats-bar {
    gap: 10px;
  }

  .queue-page .list-page-search-form__actions .el-button {
    min-height: 42px;
    padding: 0 18px;
  }

  .publish-dispatch-dialog__client-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .publish-dispatch-client {
    border-radius: 18px;
  }

  .publish-dispatch-client {
    padding-left: 18px;
    padding-right: 18px;
  }

  .publish-dispatch-dialog__profile-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .queue-runtime-console {
    padding: 14px 16px;
  }

  .publish-dispatch-dialog :deep(.el-dialog__body) {
    padding: 18px 20px;
  }
}

@media (max-width: 767px) {
  .publish-dispatch-dialog__table :deep(.el-table) {
    font-size: 12px;
  }

  .publish-dispatch-dialog__client-list,
  .publish-dispatch-dialog__profile-grid {
    grid-template-columns: 1fr;
  }

  .publish-dispatch-dialog__section-meta {
    width: 100%;
  }
}

@keyframes queue-status-breath-success {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgb(103 194 58 / 16%);
    transform: scale(1);
  }

  50% {
    box-shadow: 0 0 0 6px rgb(103 194 58 / 0%);
    transform: scale(1.04);
  }
}

@keyframes queue-status-breath-warning {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgb(249 115 22 / 16%);
    transform: scale(1);
  }

  50% {
    box-shadow: 0 0 0 6px rgb(249 115 22 / 0%);
    transform: scale(1.04);
  }
}

@keyframes queue-runtime-cursor-blink {
  0%,
  49% {
    opacity: 1;
  }

  50%,
  99% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}
</style>
