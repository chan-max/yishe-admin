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
                      v-for="opt in TASK_TYPE_OPTIONS"
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
                v-admin-only
                size="small"
                type="danger"
                :icon="Delete"
                :disabled="!ids.length"
                @click="handleDelete(null)"
              >
                批量删除
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
          </div>

          <div
            v-if="showPublishDispatchPanel"
            class="queue-dispatch-panel list-page-panel list-page-panel--flat"
          >
            <div class="queue-dispatch-panel__summary">
              <div class="queue-dispatch-panel__main">
                <div class="queue-dispatch-panel__title">发布任务调度</div>
                <div class="queue-dispatch-panel__desc">
                  保留自动执行和手动触发。支持的任务类型请到浏览器自动化模块查看。
                </div>
                <div class="queue-dispatch-panel__binding" :class="publishTaskAutoDispatchTargetClass">
                  <span class="queue-dispatch-panel__binding-label">自动调度目标</span>
                  <span class="queue-dispatch-panel__binding-value">
                    {{ publishTaskAutoDispatchTargetText }}
                  </span>
                  <span v-if="publishTaskAutoDispatchTargetHint" class="queue-dispatch-panel__binding-meta">
                    {{ publishTaskAutoDispatchTargetHint }}
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
              </div>
              <div class="queue-dispatch-panel__side">
                <span
                  class="queue-dispatch-panel__status"
                  :class="publishTaskAutoDispatchStatusClass"
                >
                  <span class="queue-dispatch-panel__status-dot" />
                  <span>{{ publishTaskAutoDispatchStatusText }}</span>
                </span>
                <el-button
                  size="small"
                  :type="publishTaskAutoDispatchEnabled ? 'danger' : 'success'"
                  :loading="publishTaskAutoDispatchLoading"
                  @click="handleTogglePublishAutoDispatch(!publishTaskAutoDispatchEnabled)"
                >
                  {{ publishTaskAutoDispatchEnabled ? "关闭自动执行" : "开启自动执行" }}
                </el-button>
                <el-button
                  size="small"
                  plain
                  :disabled="publishTaskAutoDispatchEnabled"
                  @click="openAutoDispatchTargetDialog"
                >
                  设置目标
                </el-button>
                <el-button
                  size="small"
                  type="primary"
                  plain
                  :loading="publishTaskAutoDispatchLoading"
                  @click="handleTriggerPublishTaskAutoDispatch"
                >
                  立即触发自动调度
                </el-button>
              </div>
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
                    <div class="flex items-center gap-2">
                      <el-button type="primary" link size="small" @click="handleViewData(row)">
                        查看数据
                      </el-button>
                      <el-button
                        type="primary"
                        link
                        size="small"
                        @click="handleViewRuntimeLogs(row)"
                      >
                        运行日志
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
                            <el-dropdown-item :command="'updateData'">更新数据</el-dropdown-item>
                            <el-dropdown-item :command="'editStatus'">标记状态</el-dropdown-item>
                            <el-dropdown-item
                              v-if="isPublishTaskRow(row)"
                              :command="'markExecutable'"
                            >
                              标记可执行
                            </el-dropdown-item>
                            <el-dropdown-item
                              v-if="isPublishTaskRow(row)"
                              :command="'markBlocked'"
                            >
                              阻止执行
                            </el-dropdown-item>
                            <el-dropdown-item
                              v-if="isPublishTaskRow(row)"
                              :command="'restoreExecutionAuto'"
                            >
                              恢复自动判断
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
              v-for="opt in TASK_TYPE_OPTIONS"
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
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-input-number
                v-model="formData.priority"
                :min="0"
                :max="100"
                placeholder="数字越大优先级越高"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="延迟(秒)" prop="delay">
              <el-input-number
                v-model="formData.delay"
                :min="0"
                placeholder="延迟执行时间（秒）"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="最大重试" prop="maxAttempts">
          <el-input-number
            v-model="formData.maxAttempts"
            :min="1"
            :max="10"
            placeholder="最大重试次数"
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
      title="运行日志"
      fullscreen
      :center="false"
      align-center
      class="queue-runtime-dialog"
    >
      <div class="queue-runtime-shell">
        <div class="queue-runtime-toolbar">
          <div class="queue-runtime-toolbar__title">运行日志流</div>
          <div class="queue-runtime-toolbar__meta">
            <div class="queue-runtime-toolbar__item">
              <span class="queue-runtime-toolbar__label">平台</span>
              <span class="queue-runtime-toolbar__value">{{
                currentTaskRuntime?.platform || "-"
              }}</span>
            </div>
            <div class="queue-runtime-toolbar__item">
              <span class="queue-runtime-toolbar__label">日志数</span>
              <span class="queue-runtime-toolbar__value">{{ currentTaskLogs.length }}</span>
            </div>
          </div>
        </div>
        <div v-if="currentTaskLogs.length" class="queue-runtime-console">
          <div
            v-for="(log, index) in currentTaskLogs"
            :key="log.id || `${log.timestamp}-${index}`"
            class="queue-runtime-console__line"
            :data-level="normalizeLogLevel(log.level)"
          >
            <div class="queue-runtime-console__main">
              <div class="queue-runtime-console__meta">
                <span class="queue-runtime-console__tone-dot" />
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
          </div>
        </div>
        <el-empty v-else description="暂无匹配日志" :image-size="72" />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="runtimeLogDialogVisible = false">关闭</el-button>
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
      width="780px"
      :center="false"
      align-center
      class="publish-dispatch-dialog"
    >
      <div class="publish-dispatch-dialog__body">
        <div v-if="dispatchAvailableRows.length" class="publish-dispatch-table">
          <el-table
            :data="dispatchAvailableRows"
            border
            size="small"
            row-key="optionKey"
            :max-height="360"
            class="publish-dispatch-table__main"
            @row-click="handleDispatchOptionRowClick"
          >
            <el-table-column label="" width="54" align="center">
              <template #default="{ row }">
                <el-radio
                  :value="row.optionKey"
                  v-model="selectedDispatchOptionKey"
                  @click.stop
                />
              </template>
            </el-table-column>
            <el-table-column
              prop="clientLabel"
              label="客户端"
              min-width="150"
              show-overflow-tooltip
            />
            <el-table-column
              prop="profileLabel"
              label="可用节点"
              min-width="190"
              show-overflow-tooltip
            />
            <el-table-column
              prop="statusText"
              label="状态"
              width="88"
              show-overflow-tooltip
            />
            <el-table-column
              prop="description"
              label="说明"
              min-width="240"
              show-overflow-tooltip
            />
          </el-table>
        </div>

        <el-empty
          v-else
          description="当前没有可执行的浏览器自动化节点"
          :image-size="72"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button
            :disabled="publishDispatchSubmitting"
            @click="publishDispatchDialogVisible = false"
            >取消</el-button
          >
          <el-button
            type="primary"
            :loading="publishDispatchSubmitting"
            :disabled="!selectedDispatchClientId || !canConfirmPublishDispatch"
            @click="handleConfirmPublishDispatch"
          >
            开始执行
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="autoDispatchTargetDialogVisible"
      title="设置自动调度目标"
      width="780px"
      :center="false"
      align-center
      class="publish-dispatch-dialog"
    >
      <div class="publish-dispatch-dialog__body">
        <div v-if="autoDispatchAvailableRows.length" class="publish-dispatch-table">
          <el-table
            :data="autoDispatchAvailableRows"
            border
            size="small"
            row-key="optionKey"
            :max-height="360"
            class="publish-dispatch-table__main"
            @row-click="handleAutoDispatchOptionRowClick"
          >
            <el-table-column label="" width="54" align="center">
              <template #default="{ row }">
                <el-radio
                  :value="row.optionKey"
                  v-model="selectedAutoDispatchOptionKey"
                  @click.stop
                />
              </template>
            </el-table-column>
            <el-table-column
              prop="clientLabel"
              label="客户端"
              min-width="150"
              show-overflow-tooltip
            />
            <el-table-column
              prop="profileLabel"
              label="可用节点"
              min-width="190"
              show-overflow-tooltip
            />
            <el-table-column
              prop="statusText"
              label="状态"
              width="88"
              show-overflow-tooltip
            />
            <el-table-column
              prop="description"
              label="说明"
              min-width="240"
              show-overflow-tooltip
            />
          </el-table>
        </div>
        <el-empty v-else description="当前没有可绑定的浏览器自动化节点" :image-size="72" />
      </div>
      <template #footer>
        <div class="dialog-footer">
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
  updateTaskExecutionReadiness,
  updateTaskStatus,
  type QueueMessage,
  type QueueStats,
} from "@/api/system/queue";
import { regeneratePublishTaskApi } from "@/api/product/publishConfig";
import {
  getPublishTaskAutoDispatchRuntime,
  startPublishTaskDispatch,
  triggerPublishTaskAutoDispatch,
  type AutoDispatchSchedulerRuntime,
} from "@/api/system/websocket";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import { useUserStore } from "@/store/modules/user";
import { TASK_TYPE_OPTIONS } from "@/config/task-types";
import { usePluginClientNodes } from "@/services/clientNodeState";
import { getUserSetting, updateUserSetting } from "@/api/user";
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
  isAuto?: boolean;
}

interface AutoDispatchClientCandidate {
  client: any;
  enabled: boolean;
  description: string;
}

interface DispatchOptionRow {
  optionKey: string;
  clientId: string;
  clientLabel: string;
  profileId: string | null;
  profileLabel: string;
  statusText: string;
  description: string;
}

const userStore = useUserStore();
const {
  clients: browserAutomationClients,
  refresh: refreshBrowserAutomationClients,
  getServiceRuntime: getBrowserAutomationRuntime,
} = usePluginClientNodes("browser-automation", { includeOffline: true });

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
      title: "优先级",
      field: "priority",
      width: 80,
      formatter: (e) => {
        return e.cellValue || 0;
      },
    },
    {
      title: "重试次数",
      field: "attempts",
      width: 100,
      formatter: (e) => {
        const attempts = e.cellValue || 0;
        const maxAttempts = e.row.maxAttempts || 3;
        return `${attempts}/${maxAttempts}`;
      },
    },
    {
      title: "任务数据",
      field: "data",
      minWidth: 170,
      slots: {
        default: "dataDefaultSlot",
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
const publishTaskAutoDispatchEnabled = ref(false);
const publishTaskAutoDispatchLoading = ref(false);
const publishTaskSchedulerRuntime = ref<AutoDispatchSchedulerRuntime | null>(null);
const executionReadinessSubmittingId = ref("");
const publishDispatchDialogVisible = ref(false);
const publishDispatchSubmitting = ref(false);
const autoDispatchTargetDialogVisible = ref(false);
const autoDispatchTargetSubmitting = ref(false);
const dispatchTargetTask = ref<QueueMessage | null>(null);
const selectedDispatchClientId = ref("");
const selectedDispatchProfileId = ref("");
const autoDispatchTargetClientId = ref("");
const autoDispatchTargetProfileId = ref("");
let publishTaskSchedulerRuntimeTimer: ReturnType<typeof setInterval> | null = null;
let publishTaskRuntimeReloadTimer: ReturnType<typeof setTimeout> | null = null;

// 对话框相关
const dialogVisible = ref(false);
const dialogTitle = ref("新增任务");
const formRef = ref();
const formData = reactive({
  type: "",
  description: "",
  dataStr: "{}",
  priority: 0,
  delay: 0,
  maxAttempts: 3,
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
const runtimeLogDialogVisible = ref(false);
const runtimeLogDataDialogVisible = ref(false);
const runtimeLogDataDialogText = ref("");
const runtimeLogDataDialogMeta = reactive({
  time: "",
  level: "",
  message: "",
});

const currentTaskRuntime = computed(() => extractTaskRuntime(currentTaskData.value));
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
  () => Number(stats.value.waiting || 0) + Number(stats.value.processing || 0),
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

const selectedAutoDispatchTargetProfile = computed(
  () =>
    autoDispatchTargetProfileOptions.value.find(
      (item) => item.profileId === autoDispatchTargetProfileId.value,
    ) || null,
);

const selectedAutoDispatchTargetProfileDescription = computed(
  () =>
    selectedAutoDispatchTargetProfile.value?.description ||
    "请选择一个浏览器实例，自动调度将固定投递到这个实例。",
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

const canConfirmAutoDispatchTarget = computed(
  () => !!autoDispatchTargetClientId.value && !!autoDispatchTargetProfileId.value,
);

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
    return "当前尚未绑定自动调度目标";
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
  const targetProfile =
    resolveAutoDispatchTargetProfileOptions(client).find(
      (item) => item.profileId === autoDispatchTargetProfileId.value,
    ) || null;
  const baseText = targetProfile?.description || "目标已绑定";
  return runningCount > 0 ? `${baseText}，当前运行 ${runningCount} 条任务` : baseText;
});

const publishTaskAutoDispatchTargetClass = computed(() => ({
  "is-success":
    !!autoDispatchTargetClient.value &&
    !!autoDispatchTargetClient.value.isOnline &&
    !!autoDispatchTargetProfileId.value,
  "is-warning":
    !!autoDispatchTargetClientId.value &&
    !!autoDispatchTargetProfileId.value &&
    (!publishTaskAutoDispatchTargetClient.value ||
      !publishTaskAutoDispatchTargetClient.value.isOnline),
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
    return row.status === "processing" || row.status === "waiting";
  }),
);

const dispatchClientCandidates = computed(() => {
  const taskType = dispatchTargetTask.value?.type;
  if (!taskType) return [];

  return browserAutomationClients.value
    .map((client) => ({
      client,
      state: getClientTaskTypeState(client, taskType),
    }));
});

const dispatchSelectableClients = computed(() =>
  dispatchClientCandidates.value.filter((item) => item.state.enabled),
);
const dispatchAvailableRows = computed<DispatchOptionRow[]>(() => {
  const taskType = dispatchTargetTask.value?.type;
  return dispatchSelectableClients.value.flatMap((item) => {
    const options = resolveClientDispatchProfileOptions(item.client, taskType);
    const concreteOptions = options.filter((option) => option.enabled && !option.isAuto);
    const fallbackOptions = concreteOptions.length
      ? concreteOptions
      : options.filter((option) => option.enabled);

    return fallbackOptions.map((option) => ({
      optionKey: buildDispatchOptionKey(item.client.id, option.profileId),
      clientId: String(item.client.id || "").trim(),
      clientLabel: formatClientNodeName(item.client),
      profileId: option.profileId,
      profileLabel: option.label,
      statusText: option.connected ? "已打开" : option.isAuto ? "自动" : "待拉起",
      description: option.description,
    }));
  });
});

const autoDispatchClientCandidates = computed<AutoDispatchClientCandidate[]>(() =>
  browserAutomationClients.value.map((client) => {
    const runtime = getBrowserAutomationRuntime(client) as Record<string, any>;
    const profiles = getClientDispatchProfiles(client);
    const enabled = !!(
      client?.isOnline &&
      (runtime?.available || runtime?.connected) &&
      profiles.length
    );

    let description = "客户端离线";
    if (!client?.isOnline) {
      description = "客户端离线";
    } else if (!(runtime?.available || runtime?.connected)) {
      description = "浏览器自动化服务未就绪";
    } else if (!profiles.length) {
      description = "当前客户端还没有可绑定的浏览器实例";
    } else {
      description = `可绑定 ${profiles.length} 个实例，自动调度将固定投递到其中一个`;
    }

    return {
      client,
      enabled,
      description,
    };
  }),
);
const autoDispatchAvailableRows = computed<DispatchOptionRow[]>(() =>
  autoDispatchClientCandidates.value
    .filter((item) => item.enabled)
    .flatMap((item) =>
      resolveAutoDispatchTargetProfileOptions(item.client).map((option) => ({
        optionKey: buildDispatchOptionKey(item.client.id, option.profileId),
        clientId: String(item.client.id || "").trim(),
        clientLabel: formatClientNodeName(item.client),
        profileId: option.profileId,
        profileLabel: option.label,
        statusText: option.busy ? "忙碌" : option.connected ? "已打开" : "待拉起",
        description: option.description,
      })),
    ),
);

const selectedDispatchClient = computed(
  () =>
    browserAutomationClients.value.find((client) => client.id === selectedDispatchClientId.value) ||
    null,
);

const selectedDispatchProfileOptions = computed(() =>
  resolveClientDispatchProfileOptions(
    selectedDispatchClient.value,
    dispatchTargetTask.value?.type,
  ),
);

const selectedDispatchProfileOption = computed(
  () =>
    selectedDispatchProfileOptions.value.find(
      (item) => (item.profileId || "") === selectedDispatchProfileId.value,
    ) || null,
);

const selectedDispatchClientLabel = computed(() =>
  selectedDispatchClient.value ? formatClientNodeName(selectedDispatchClient.value) : "未选择节点",
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
  () => !!selectedDispatchClientId.value && !!selectedDispatchProfileOption.value?.enabled,
);

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - (showPublishDispatchPanel.value ? 320 : 292);
});

function isPublishTaskRow(row?: QueueMessage | null) {
  return String(row?.type || "").startsWith("publish-product-");
}

function taskTypeLabel(taskType?: string) {
  const matched = TASK_TYPE_OPTIONS.find((item) => item.value === taskType);
  return matched?.label || String(taskType || "-");
}

function getPublishDispatchMeta(row?: QueueMessage | null) {
  const meta = row?.metadata?.publishDispatch;
  return meta && typeof meta === "object" ? meta : {};
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

function handleDispatchOptionRowClick(row?: DispatchOptionRow | null) {
  if (!row?.optionKey) {
    return;
  }
  selectedDispatchOptionKey.value = row.optionKey;
}

function handleAutoDispatchOptionRowClick(row?: DispatchOptionRow | null) {
  if (!row?.optionKey) {
    return;
  }
  selectedAutoDispatchOptionKey.value = row.optionKey;
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

function resolveAutoDispatchTargetProfileOptions(
  client: any,
): Array<
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
      const pageCount =
        typeof instance?.pageCount === "number" ? Number(instance.pageCount) : null;

      let description = "浏览器未打开，自动调度执行时会拉起";
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

function resolveClientDispatchProfileOptions(
  client: any,
  taskType?: string,
): DispatchProfileOption[] {
  const runtime = getBrowserAutomationRuntime(client) as Record<string, any>;
  if (!taskType || !client?.isOnline || !runtime?.connected || !supportsTaskType(client, taskType)) {
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
    const pageCount =
      typeof instance?.pageCount === "number" ? Number(instance.pageCount) : null;

    let description = "浏览器未打开，执行时会自动拉起";
    if (busy) {
      description = instance?.currentTaskId
        ? `当前执行中，任务 ${instance.currentTaskId}`
        : "当前环境正在执行任务";
    } else if (connected) {
      description =
        pageCount !== null ? `浏览器已打开，当前 ${pageCount} 个页面` : "浏览器已打开";
    }

    return {
      profileId,
      label: formatDispatchProfileLabel(profileId, profile),
      description,
      enabled: !busy,
      connected,
      busy,
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
  const matched = selectedDispatchProfileOptions.value.find(
    (item) =>
      (item.profileId || "") === selectedDispatchProfileId.value && item.enabled,
  );
  if (matched) {
    return;
  }

  const preferredOption =
    selectedDispatchProfileOptions.value.find(
      (item) => item.enabled && !item.isAuto,
    ) || selectedDispatchProfileOptions.value.find((item) => item.enabled);

  selectedDispatchProfileId.value = preferredOption?.profileId || "";
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
  const runtime = extractTaskRuntime(normalizeTaskDataRecord(row?.data));
  const clientId =
    String(meta?.assignedClientId || runtime?.assignedClientId || "").trim() || null;
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

function extractTaskRuntime(data: any) {
  if (!data || typeof data !== "object") {
    return null;
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
async function getList() {
  loading.value = true;
  try {
    const [sortField, sortOrder] = queryParams.sortType.split("_");
    const res = await getTaskList({
      status: queryParams.status, // 不传 status 则查询所有状态
      type: queryParams.type?.trim() || undefined, // 不传 type 则查询所有类型
      id: queryParams.id?.trim() || undefined, // 不传 id 则查询所有ID
      sortField: sortField as "createdAt" | "updatedAt" | "processedAt",
      sortOrder: sortOrder as "ASC" | "DESC",
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
        total.value = totalCount;
      } else {
        dataSource.value = [];
        total.value = 0;
      }
    } else {
      dataSource.value = [];
      total.value = 0;
    }
    ids.value = [];
  } catch (error: any) {
    ElMessage.error(error?.message || "获取列表失败");
    dataSource.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function handleSortTypeChange() {
  queryParams.currentPage = 1;
  getList();
}

async function refreshStats() {
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

    if (statsData && typeof statsData === "object" && !Array.isArray(statsData)) {
      stats.value = {
        queue: statsData.queue || queryParams.type?.trim() || "*",
        pending: Number(statsData.pending) || 0,
        waiting: Number(statsData.waiting) || 0,
        processing: Number(statsData.processing) || 0,
        delayed: Number(statsData.delayed) || 0,
        completed: Number(statsData.completed) || 0,
        failed: Number(statsData.failed) || 0,
        total: Number(statsData.total) || 0,
      };
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

// 查看数据，优先拉取详情，避免列表数据被裁剪或序列化后显示为空
async function handleViewData(row: QueueMessage) {
  dataDialogVisible.value = true;
  dataDialogLoading.value = true;
  currentTaskData.value = {};
  currentTaskId.value = row.id;

  try {
    const res = await getTaskDetail(row.queue || row.type, row.id);
    const responseData = res?.data && typeof res.data === "object" ? res.data : res;
    const message = responseData?.data ?? responseData;
    const taskData = parseMaybeJson(message?.data);

    currentTaskData.value = taskData ?? parseMaybeJson(row?.data) ?? row?.data ?? {};
  } catch (error) {
    currentTaskData.value = parseMaybeJson(row?.data) ?? row?.data ?? {};
    ElMessage.warning("任务详情获取失败，已显示列表中的数据快照");
  } finally {
    dataDialogLoading.value = false;
  }
}

async function handleViewRuntimeLogs(row: QueueMessage) {
  runtimeLogDialogVisible.value = true;
  dataDialogLoading.value = true;
  currentTaskData.value = {};
  currentTaskId.value = row.id;

  try {
    const res = await getTaskDetail(row.queue || row.type, row.id);
    const responseData = res?.data && typeof res.data === "object" ? res.data : res;
    const message = responseData?.data ?? responseData;
    const taskData = parseMaybeJson(message?.data);
    currentTaskData.value = taskData ?? parseMaybeJson(row?.data) ?? row?.data ?? {};
  } catch (error) {
    currentTaskData.value = parseMaybeJson(row?.data) ?? row?.data ?? {};
    ElMessage.warning("运行日志获取失败，已显示列表中的数据快照");
  } finally {
    dataDialogLoading.value = false;
  }
}

function openPublishDispatchDialog(row: QueueMessage) {
  const executionStatus = getExecutionStatusInfo(row);
  if (!executionStatus.ready) {
    ElMessage.warning(executionStatus.reason || "当前任务尚未满足执行条件");
    return;
  }

  dispatchTargetTask.value = row;
  const preferredClient = dispatchSelectableClients.value[0]?.client;
  selectedDispatchClientId.value = preferredClient?.id || "";
  selectedDispatchProfileId.value = "";
  syncDispatchProfileSelection();
  publishDispatchDialogVisible.value = true;
}

function syncAutoDispatchTargetProfileSelection() {
  const matched = autoDispatchTargetProfileOptions.value.find(
    (item) => item.profileId === autoDispatchTargetProfileId.value,
  );
  if (matched) {
    return;
  }

  autoDispatchTargetProfileId.value =
    autoDispatchTargetProfileOptions.value[0]?.profileId || "";
}

function openAutoDispatchTargetDialog() {
  if (!autoDispatchAvailableRows.value.length) {
    ElMessage.warning("当前没有可用的浏览器自动化客户端");
    return;
  }

  const hasMatchedSelection = autoDispatchAvailableRows.value.some(
    (item) =>
      item.clientId === autoDispatchTargetClientId.value &&
      (item.profileId || "") === autoDispatchTargetProfileId.value,
  );

  if (!hasMatchedSelection) {
    const firstRow = autoDispatchAvailableRows.value[0];
    autoDispatchTargetClientId.value = firstRow?.clientId || "";
    autoDispatchTargetProfileId.value = firstRow?.profileId || "";
  }

  autoDispatchTargetDialogVisible.value = true;
}

async function handleConfirmPublishDispatch() {
  if (!dispatchTargetTask.value) {
    return;
  }
  if (!selectedDispatchClientId.value) {
    ElMessage.warning("请选择一个可执行客户端");
    return;
  }

  const profileOption = selectedDispatchProfileOption.value;
  if (!profileOption || !profileOption.enabled) {
    ElMessage.warning("请选择一个可执行环境");
    return;
  }

  const selectedClient = browserAutomationClients.value.find(
    (client) => client.id === selectedDispatchClientId.value,
  );
  if (
    !selectedClient ||
    !getClientTaskTypeState(selectedClient, dispatchTargetTask.value.type).enabled
  ) {
    ElMessage.warning("当前选中的节点已不可执行，请重新选择");
    return;
  }

  publishDispatchSubmitting.value = true;
  try {
    await startPublishTaskDispatch(dispatchTargetTask.value.id, {
      clientId: selectedDispatchClientId.value,
      ...(profileOption.profileId ? { profileId: profileOption.profileId } : {}),
    });
    ElMessage.success(
      profileOption.profileId
        ? `发布任务已分配到环境 ${profileOption.label} 执行`
        : "发布任务已分配到客户端执行",
    );
    publishDispatchDialogVisible.value = false;
    await Promise.all([getList(), refreshStats(), refreshBrowserAutomationClients()]);
  } catch (error: any) {
    ElMessage.error(error?.message || "发布任务分发失败");
  } finally {
    publishDispatchSubmitting.value = false;
  }
}

async function handleConfirmAutoDispatchTarget() {
  if (!canConfirmAutoDispatchTarget.value) {
    ElMessage.warning("请选择自动调度目标客户端和实例");
    return;
  }

  autoDispatchTargetSubmitting.value = true;
  publishTaskAutoDispatchLoading.value = true;
  try {
    await updateUserSetting({
      key: "browserAutomation",
      data: {
        autoSchedulingEnabled: true,
        autoDispatchClientId: autoDispatchTargetClientId.value,
        autoDispatchProfileId: autoDispatchTargetProfileId.value,
      },
    });
    publishTaskAutoDispatchEnabled.value = true;
    autoDispatchTargetDialogVisible.value = false;

    const response = await triggerPublishTaskAutoDispatch();
    ElMessage.success(response?.message || "已保存自动调度目标并开启自动执行");
    await Promise.all([
      getList(),
      refreshStats(),
      refreshBrowserAutomationClients(),
      loadPublishTaskAutoDispatchSetting(),
      loadPublishTaskSchedulerRuntime(),
    ]);
  } catch (error: any) {
    ElMessage.error(error?.message || "保存自动调度目标失败");
  } finally {
    autoDispatchTargetSubmitting.value = false;
    publishTaskAutoDispatchLoading.value = false;
  }
}

async function loadPublishTaskAutoDispatchSetting() {
  try {
    const response: any = await getUserSetting({ key: "browserAutomation" });
    const data = response?.data || response || {};
    publishTaskAutoDispatchEnabled.value = !!data?.autoSchedulingEnabled;
    autoDispatchTargetClientId.value = String(data?.autoDispatchClientId || "").trim();
    autoDispatchTargetProfileId.value = String(data?.autoDispatchProfileId || "").trim();
  } catch {
    publishTaskAutoDispatchEnabled.value = false;
    autoDispatchTargetClientId.value = "";
    autoDispatchTargetProfileId.value = "";
  }
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
    await updateUserSetting({
      key: "browserAutomation",
      data: {
        autoSchedulingEnabled: false,
        autoDispatchClientId: autoDispatchTargetClientId.value || undefined,
        autoDispatchProfileId: autoDispatchTargetProfileId.value || undefined,
      },
    });
    publishTaskAutoDispatchEnabled.value = false;
    ElMessage.success("已关闭自动执行");
    await loadPublishTaskSchedulerRuntime();
  } catch (error: any) {
    ElMessage.error(error?.message || "更新自动执行开关失败");
  } finally {
    publishTaskAutoDispatchLoading.value = false;
  }
}

async function handleTriggerPublishTaskAutoDispatch() {
  publishTaskAutoDispatchLoading.value = true;
  try {
    const response = await triggerPublishTaskAutoDispatch();
    ElMessage.success(response?.message || "已触发自动调度");
    await Promise.all([
      getList(),
      refreshStats(),
      refreshBrowserAutomationClients(),
      loadPublishTaskSchedulerRuntime(),
    ]);
  } catch (error: any) {
    ElMessage.error(error?.message || "触发自动调度失败");
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
    void Promise.all([getList(), refreshStats()]);
  }, 260);
}

function findQueueTaskIndexById(taskId: unknown) {
  const normalizedTaskId = String(taskId || "").trim();
  if (!normalizedTaskId) {
    return -1;
  }

  return dataSource.value.findIndex(
    (item) => String(item?.id || "").trim() === normalizedTaskId,
  );
}

function applyPublishTaskRuntimeEvent(event: PublishTaskRuntimeEvent) {
  const normalizedTaskId = String(event?.taskId || "").trim();
  if (!normalizedTaskId) {
    return;
  }

  const taskIndex = findQueueTaskIndexById(normalizedTaskId);
  if (taskIndex >= 0) {
    const row = dataSource.value[taskIndex];
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
          profileId:
            String(event.profileId || "").trim() || currentDispatchMeta.profileId || null,
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

  if (String(dispatchTargetTask.value?.id || "").trim() === normalizedTaskId && event.status === "running") {
    publishDispatchDialogVisible.value = false;
  }

  if (String(currentTaskId.value || "").trim() === normalizedTaskId && event.runtime) {
    currentTaskData.value = {
      ...normalizeTaskDataRecord(currentTaskData.value),
      taskLogs: event.runtime,
    };
  }

  if (event.status === "completed" || event.status === "failed" || event.status === "pending") {
    schedulePublishTaskListRefresh();
  }
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
      priority: formData.priority,
      delay: formData.delay,
      maxAttempts: formData.maxAttempts,
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
    priority: 0,
    delay: 0,
    maxAttempts: 3,
  });
  // 延迟清除验证，确保表单已更新
  setTimeout(() => {
    formRef.value?.clearValidate();
  }, 50);
}

// 更新数据
function handleUpdateData(row: QueueMessage) {
  currentDataUpdateRow.value = row;
  // 确保 data 存在，如果不存在则使用空对象
  const currentData = row.data || {};
  const dataStrValue =
    typeof currentData === "object" && currentData !== null
      ? JSON.stringify(currentData, null, 2)
      : String(currentData || "{}");

  dataUpdateFormData.queue = row.queue;
  dataUpdateFormData.messageId = row.id;
  dataUpdateFormData.dataStr = dataStrValue;
  try {
    dataUpdateFormData.dataObj =
      typeof row.data === "string" ? JSON.parse(row.data) : row.data || {};
  } catch (e) {
    dataUpdateFormData.dataObj = {};
  }

  dataUpdateDialogVisible.value = true;
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
      "将基于当前套图信息和任务配置重新生成这条任务的发布数据，是否继续？",
      "重新生成发布数据",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      },
    );

    loading.value = true;
    await regeneratePublishTaskApi(taskId);
    ElMessage.success("已触发重新生成");
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

async function handleUpdateExecutionReadiness(
  row: QueueMessage,
  mode: "ready" | "blocked" | "auto",
) {
  const taskType = String(row?.type || "").trim();
  const taskId = String(row?.id || "").trim();
  if (!taskType || !taskId) {
    ElMessage.warning("缺少任务标识");
    return;
  }
  if (executionReadinessSubmittingId.value === taskId) {
    return;
  }

  const actionText =
    mode === "ready"
      ? "手动标记为可执行"
      : mode === "blocked"
        ? "手动阻止执行"
        : "恢复自动判断";

  try {
    await ElMessageBox.confirm(
      mode === "ready"
        ? "确认将这条任务手动标记为可执行吗？后续自动调度会把它视为已满足执行条件。"
        : mode === "blocked"
          ? "确认手动阻止这条任务执行吗？后续自动调度和手动开始都会被拦截。"
          : "确认恢复为系统自动判断可执行状态吗？",
      actionText,
      {
        type: mode === "blocked" ? "warning" : "info",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      },
    );

    executionReadinessSubmittingId.value = taskId;
    const response = await updateTaskExecutionReadiness(
      taskType,
      taskId,
      mode,
      mode === "ready"
        ? "管理员手动标记为可执行"
        : mode === "blocked"
          ? "管理员手动阻止任务执行"
          : undefined,
    );
    ElMessage.success(response?.message || `${actionText}成功`);
    await Promise.all([getList(), refreshStats()]);
  } catch (error: any) {
    if (error === "cancel" || error === "close") {
      return;
    }
    ElMessage.error(error?.message || `${actionText}失败`);
  } finally {
    if (executionReadinessSubmittingId.value === taskId) {
      executionReadinessSubmittingId.value = "";
    }
  }
}

async function handleOperationCommand(command: string, row: QueueMessage) {
  switch (command) {
    case "startExecution":
      openPublishDispatchDialog(row);
      break;
    case "markExecutable":
      await handleUpdateExecutionReadiness(row, "ready");
      break;
    case "markBlocked":
      await handleUpdateExecutionReadiness(row, "blocked");
      break;
    case "restoreExecutionAuto":
      await handleUpdateExecutionReadiness(row, "auto");
      break;
    case "regenerate":
      await handleRegeneratePublishTask(row);
      break;
    case "updateData":
      handleUpdateData(row);
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

watch(selectedDispatchClientId, () => {
  syncDispatchProfileSelection();
});

watch(selectedDispatchProfileOptions, () => {
  syncDispatchProfileSelection();
});

watch(autoDispatchTargetClientId, () => {
  syncAutoDispatchTargetProfileSelection();
});

watch(autoDispatchTargetProfileOptions, () => {
  syncAutoDispatchTargetProfileSelection();
});

// 初始化
onMounted(() => {
  void Promise.all([
    getList(),
    refreshStats(),
    refreshBrowserAutomationClients(),
    loadPublishTaskAutoDispatchSetting(),
    loadPublishTaskSchedulerRuntime(),
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
  if (publishTaskRuntimeReloadTimer) {
    clearTimeout(publishTaskRuntimeReloadTimer);
    publishTaskRuntimeReloadTimer = null;
  }
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
  gap: 8px;
}

.queue-stats-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.queue-stats-pill__label {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.queue-stats-pill__value {
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  color: var(--el-text-color-primary);
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
  flex-direction: column;
  gap: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-fill-color-light);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.queue-dispatch-panel__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  min-height: 40px;
  width: 100%;
  padding: 10px 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 88%, transparent 12%);
  background: transparent;
}

.queue-dispatch-panel__main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.queue-dispatch-panel__title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.queue-dispatch-panel__desc {
  max-width: 420px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.queue-dispatch-panel__binding {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.queue-dispatch-panel__binding-label {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.queue-dispatch-panel__binding-value {
  font-weight: 600;
}

.queue-dispatch-panel__binding-meta {
  color: var(--el-text-color-placeholder);
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
  gap: 6px;
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.4;
  flex-wrap: wrap;
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
  color: var(--el-text-color-placeholder);
}

.queue-dispatch-panel__side {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.queue-dispatch-panel__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  background: var(--el-bg-color);
  font-size: 12px;
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
  width: 8px;
  height: 8px;
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
  gap: 16px;
}

.publish-dispatch-table {
  display: flex;
  flex-direction: column;
}

.publish-dispatch-table__main :deep(.el-table__row) {
  cursor: pointer;
}

.publish-dispatch-table__main :deep(.el-radio) {
  margin-right: 0;
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
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--el-fill-color-light) 68%, white 32%), #fff);
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

.queue-runtime-dialog :deep(.el-dialog__body) {
  padding-top: 10px;
  background:
    radial-gradient(circle at top left, rgb(59 130 246 / 8%), transparent 28%),
    linear-gradient(180deg, #f8fafc 0%, #f3f6fb 100%);
}

.queue-runtime-shell {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: calc(100vh - 150px);
  min-height: 0;
}

.queue-runtime-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 4px 2px 0;
}

.queue-runtime-toolbar__title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.queue-runtime-toolbar__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.queue-runtime-toolbar__item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid rgb(148 163 184 / 14%);
  border-radius: 999px;
  background: linear-gradient(180deg, rgb(255 255 255 / 72%) 0%, rgb(241 245 249 / 92%) 100%);
  box-shadow: 0 4px 10px rgb(15 23 42 / 4%);
}

.queue-runtime-toolbar__label {
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
}

.queue-runtime-toolbar__value {
  color: #1f2937;
  font-size: 12px;
  font-weight: 700;
  font-family:
    "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

.queue-runtime-console {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px;
  border: 1px solid rgb(15 23 42 / 12%);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgb(15 23 42 / 98%) 0%, rgb(17 24 39 / 99%) 100%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 4%),
    0 18px 48px rgb(15 23 42 / 16%);
}

.queue-runtime-console__line + .queue-runtime-console__line {
  margin-top: 8px;
}

.queue-runtime-console__line {
  position: relative;
  padding: 10px 12px;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(180deg, rgb(15 23 42 / 52%) 0%, rgb(15 23 42 / 68%) 100%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 2%),
    0 4px 10px rgb(2 6 23 / 16%);
  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.queue-runtime-console__line:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 3%),
    0 8px 16px rgb(2 6 23 / 20%);
}

.queue-runtime-console__main {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.queue-runtime-console__meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.3;
}

.queue-runtime-console__tone-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #3b82f6;
  flex: 0 0 auto;
  box-shadow: 0 0 0 3px rgb(59 130 246 / 16%);
}

.queue-runtime-console__line[data-level="success"] .queue-runtime-console__tone-dot {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgb(34 197 94 / 14%);
}

.queue-runtime-console__line[data-level="warn"] .queue-runtime-console__tone-dot,
.queue-runtime-console__line[data-level="warning"] .queue-runtime-console__tone-dot {
  background: #f59e0b;
  box-shadow: 0 0 0 3px rgb(245 158 11 / 16%);
}

.queue-runtime-console__line[data-level="error"] .queue-runtime-console__tone-dot {
  background: #ef4444;
  box-shadow: 0 0 0 3px rgb(239 68 68 / 14%);
}

.queue-runtime-console__line[data-level="debug"] .queue-runtime-console__tone-dot {
  background: #94a3b8;
  box-shadow: 0 0 0 3px rgb(148 163 184 / 14%);
}

.queue-runtime-console__time {
  color: inherit;
  font-family:
    "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12px;
  letter-spacing: 0.01em;
}

.queue-runtime-console__content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.queue-runtime-console__message {
  flex: 1;
  min-width: 0;
  color: #e5edf7;
  font-size: 13px;
  line-height: 1.55;
  font-family:
    "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  white-space: pre-wrap;
  word-break: break-word;
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
  background: rgb(255 255 255 / 3%);
  color: #a5d8ff;
  font-size: 12px;
  line-height: 1;
  border: 1px solid rgb(148 163 184 / 12%);
}

.queue-runtime-console__detail-trigger:hover {
  color: #d7ecff;
  background: rgb(59 130 246 / 8%);
  border-color: rgb(59 130 246 / 18%);
}

.queue-runtime-console__detail-trigger:focus-visible {
  outline: 2px solid rgb(59 130 246 / 30%);
  outline-offset: 1px;
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
  font-family:
    "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
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
    min-height: 32px;
    padding: 0 10px;
  }

  .queue-dispatch-panel__summary {
    width: 100%;
    align-items: flex-start;
  }

  .queue-dispatch-panel__side {
    width: 100%;
    justify-content: flex-start;
  }

  .queue-json-editor-layout {
    grid-template-columns: 1fr;
  }

  .queue-runtime-shell {
    height: calc(100vh - 132px);
  }

  .queue-runtime-toolbar {
    align-items: flex-start;
  }

  .queue-runtime-toolbar__meta {
    width: 100%;
    gap: 10px;
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

  .queue-page .list-page-search-form__actions .el-button,
  .queue-dispatch-panel .el-button {
    min-height: 42px;
    padding: 0 18px;
  }

  .queue-dispatch-panel__summary,
  .queue-dispatch-panel__side {
    gap: 14px;
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

  .queue-runtime-toolbar__item {
    min-height: 36px;
    padding: 0 12px;
  }

  .publish-dispatch-dialog :deep(.el-dialog__body) {
    padding: 18px 20px;
  }
}

@media (max-width: 767px) {
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
</style>
