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
          <div class="queue-page__stats queue-stats-grid">
            <div class="queue-stat-card">
              <span class="queue-stat-card__label">待处理</span>
              <span class="queue-stat-card__value queue-stat-card__value--pending">{{
                stats.pending
              }}</span>
            </div>
            <div class="queue-stat-card">
              <span class="queue-stat-card__label">处理中</span>
              <span class="queue-stat-card__value queue-stat-card__value--processing">{{
                stats.processing
              }}</span>
            </div>
            <div class="queue-stat-card">
              <span class="queue-stat-card__label">已完成</span>
              <span class="queue-stat-card__value queue-stat-card__value--completed">{{
                stats.completed
              }}</span>
            </div>
            <div class="queue-stat-card">
              <span class="queue-stat-card__label">失败</span>
              <span class="queue-stat-card__value queue-stat-card__value--failed">{{
                stats.failed
              }}</span>
            </div>
            <div class="queue-stat-card">
              <span class="queue-stat-card__label">总计</span>
              <span class="queue-stat-card__value">{{ stats.total }}</span>
            </div>
          </div>

          <div
            v-if="showPublishDispatchPanel"
            class="queue-dispatch-panel list-page-panel list-page-panel--flat"
          >
            <div class="queue-dispatch-panel__summary">
              <div class="queue-dispatch-panel__copy">
                <div class="queue-dispatch-panel__title">发布任务调度中心</div>
                <div class="queue-dispatch-panel__desc">
                  由 admin
                  直接调度浏览器自动化节点执行发布任务，支持手动开始、节点参与控制与服务端自动执行。
                </div>
              </div>
              <div class="queue-dispatch-panel__actions">
                <div class="queue-dispatch-panel__switch">
                  <span class="queue-dispatch-panel__switch-label">
                    自动执行 {{ publishTaskAutoDispatchEnabled ? "已开启" : "已关闭" }}
                  </span>
                  <el-switch
                    :model-value="publishTaskAutoDispatchEnabled"
                    :loading="publishTaskAutoDispatchLoading"
                    inline-prompt
                    active-text="开"
                    inactive-text="关"
                    @change="handleTogglePublishAutoDispatch"
                  />
                </div>
                <el-button
                  type="primary"
                  plain
                  :loading="publishTaskAutoDispatchLoading"
                  @click="handleTriggerPublishTaskAutoDispatch"
                >
                  立即触发自动调度
                </el-button>
              </div>
            </div>

            <div class="queue-dispatch-panel__meta">
              <el-tag type="success" effect="plain"
                >在线节点 {{ onlineBrowserAutomationClients.length }}</el-tag
              >
              <el-tag type="primary" effect="plain"
                >可执行节点 {{ availableBrowserAutomationClients.length }}</el-tag
              >
              <el-tag type="warning" effect="plain"
                >执行中节点 {{ busyBrowserAutomationClients.length }}</el-tag
              >
              <el-tag type="info" effect="plain"
                >支持任务类型 {{ publishCapabilityTagMap.size }}</el-tag
              >
            </div>

            <div class="queue-dispatch-panel__client-grid">
              <div
                v-for="client in browserAutomationClients"
                :key="client.id"
                class="queue-client-card"
                :class="{
                  'is-offline': !client.isOnline,
                  'is-running': isBrowserAutomationClientBusy(client),
                  'is-ready': isBrowserAutomationClientAvailable(client),
                }"
              >
                <div class="queue-client-card__header">
                  <div>
                    <div class="queue-client-card__title">{{ formatClientNodeName(client) }}</div>
                    <div class="queue-client-card__sub">
                      {{
                        client.clientInfo?.location?.city ||
                        client.clientInfo?.location?.country ||
                        "未定位"
                      }}
                    </div>
                  </div>
                  <el-tag
                    :type="
                      client.isOnline
                        ? isBrowserAutomationClientAvailable(client)
                          ? 'success'
                          : 'warning'
                        : 'info'
                    "
                    size="small"
                    effect="plain"
                  >
                    {{
                      client.isOnline
                        ? isBrowserAutomationClientBusy(client)
                          ? "执行中"
                          : isBrowserAutomationClientAvailable(client)
                            ? "可执行"
                            : "在线"
                        : "离线"
                    }}
                  </el-tag>
                </div>

                <div class="queue-client-card__body">
                  <div class="queue-client-card__line">
                    <span>自动执行接单</span>
                    <el-switch
                      :model-value="
                        getBrowserAutomationRuntime(client)?.autoDispatchEnabled !== false
                      "
                      :loading="browserAutomationDispatchToggleClientId === client.id"
                      inline-prompt
                      active-text="开"
                      inactive-text="关"
                      @change="
                        (enabled) => handleToggleClientAutoDispatch(client, enabled === true)
                      "
                    />
                  </div>
                  <div class="queue-client-card__line">
                    <span>当前任务</span>
                    <span class="queue-client-card__value">
                      {{ getBrowserAutomationCurrentTaskText(getBrowserAutomationRuntime(client)) }}
                    </span>
                  </div>
                  <div class="queue-client-card__hint">
                    {{ getBrowserAutomationRuntimeHint(getBrowserAutomationRuntime(client)) }}
                  </div>
                  <div class="queue-client-card__capabilities">
                    <el-tag
                      v-for="taskType in extractBrowserAutomationSupportedTaskTypes(
                        getBrowserAutomationRuntime(client),
                      )"
                      :key="`${client.id}-${taskType}`"
                      size="small"
                      effect="plain"
                      type="info"
                    >
                      {{ taskTypeLabel(taskType) }}
                    </el-tag>
                    <span
                      v-if="
                        extractBrowserAutomationSupportedTaskTypes(
                          getBrowserAutomationRuntime(client),
                        ).length === 0
                      "
                      class="queue-client-card__empty"
                    >
                      暂未上报任务能力
                    </span>
                  </div>
                </div>
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
                    <el-tag
                      v-if="getExecutionStatusInfo(row).type"
                      :type="getExecutionStatusInfo(row).type"
                      size="small"
                      effect="plain"
                    >
                      {{ getExecutionStatusInfo(row).text }}
                    </el-tag>
                    <span v-else class="text-gray-400 text-sm">-</span>
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
                    <el-dropdown
                      class="operation-dropdown"
                      placement="bottom-end"
                      @command="(command) => handleOperationCommand(String(command), row)"
                    >
                      <el-button type="primary" link size="small" class="operation-trigger-button"
                        >操作</el-button
                      >
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item
                            v-if="isPublishTaskRow(row)"
                            :command="'startExecution'"
                            :disabled="row.status === 'waiting' || row.status === 'processing'"
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
          <div class="queue-runtime-toolbar__meta">
            <span>平台：{{ currentTaskRuntime?.platform || "-" }}</span>
            <span>日志数：{{ currentTaskLogs.length }}</span>
          </div>
        </div>
        <div v-if="currentTaskLogs.length" class="queue-runtime-console">
          <div
            v-for="(log, index) in currentTaskLogs"
            :key="log.id || `${log.timestamp}-${index}`"
            class="queue-runtime-console__line"
            :data-level="String(log.level || 'info').toLowerCase()"
          >
            <span class="queue-runtime-console__time">{{
              formatLogTimestamp(log.time || log.timestamp)
            }}</span>
            <span
              class="queue-runtime-console__level"
              :data-level="String(log.level || 'info').toLowerCase()"
            >
              {{ String(log.level || "info").toUpperCase() }}
            </span>
            <span class="queue-runtime-console__message">{{ log.message || "-" }}</span>
            <pre v-if="hasLogData(log)" class="queue-runtime-console__data">{{
              formatLogData(log.data)
            }}</pre>
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
      width="760px"
      :center="false"
      align-center
      class="publish-dispatch-dialog"
    >
      <div class="publish-dispatch-dialog__body">
        <div class="publish-dispatch-dialog__summary">
          <div class="publish-dispatch-dialog__title">
            {{ dispatchTargetTask?.description || taskTypeLabel(dispatchTargetTask?.type) }}
          </div>
          <div class="publish-dispatch-dialog__meta">
            <el-tag type="info" effect="plain">任务ID {{ dispatchTargetTask?.id || "-" }}</el-tag>
            <el-tag type="primary" effect="plain">{{
              taskTypeLabel(dispatchTargetTask?.type)
            }}</el-tag>
          </div>
        </div>

        <div class="publish-dispatch-dialog__client-list">
          <button
            v-for="client in browserAutomationClients"
            :key="client.id"
            type="button"
            class="publish-dispatch-client"
            :class="{
              'is-selected': selectedDispatchClientId === client.id,
              'is-disabled': !getClientTaskTypeState(client, dispatchTargetTask?.type).enabled,
            }"
            :disabled="!getClientTaskTypeState(client, dispatchTargetTask?.type).enabled"
            @click="selectedDispatchClientId = client.id"
          >
            <div class="publish-dispatch-client__header">
              <span class="publish-dispatch-client__title">{{ formatClientNodeName(client) }}</span>
              <el-tag
                :type="
                  getClientTaskTypeState(client, dispatchTargetTask?.type).enabled
                    ? 'success'
                    : 'info'
                "
                size="small"
                effect="plain"
              >
                {{
                  getClientTaskTypeState(client, dispatchTargetTask?.type).enabled
                    ? "可执行"
                    : "不可用"
                }}
              </el-tag>
            </div>
            <div class="publish-dispatch-client__desc">
              {{ getClientTaskTypeState(client, dispatchTargetTask?.type).text }}
            </div>
            <div class="publish-dispatch-client__capabilities">
              <span
                v-for="taskType in extractBrowserAutomationSupportedTaskTypes(
                  getBrowserAutomationRuntime(client),
                ).slice(0, 6)"
                :key="`${client.id}-${taskType}`"
              >
                {{ taskTypeLabel(taskType) }}
              </span>
            </div>
          </button>
        </div>
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
            :disabled="!selectedDispatchClientId"
            @click="handleConfirmPublishDispatch"
          >
            开始执行
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
  type QueueMessage,
  type QueueStats,
} from "@/api/system/queue";
import { regeneratePublishTaskApi } from "@/api/product/publishConfig";
import {
  startPublishTaskDispatch,
  toggleBrowserAutomationAutoDispatch,
  triggerPublishTaskAutoDispatch,
} from "@/api/system/websocket";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import { useUserStore } from "@/store/modules/user";
import { TASK_TYPE_OPTIONS } from "@/config/task-types";
import { usePluginClientNodes } from "@/services/clientNodeState";
import { getUserSetting, updateUserSetting } from "@/api/user";
import {
  extractBrowserAutomationSupportedTaskTypes,
  getBrowserAutomationCurrentTaskText,
  getBrowserAutomationRuntimeHint,
  isBrowserAutomationClientAvailable as isBrowserAutomationClientAvailableByRuntime,
  isBrowserAutomationRuntimeBusy as isBrowserAutomationRuntimeBusyByRuntime,
  supportsBrowserAutomationTaskType,
} from "@/services/browserAutomationRuntime";
import { websocketClient, type PublishTaskRuntimeEvent } from "@/services/websocketClient";

type QueueTagType = "success" | "warning" | "info" | "primary" | "danger";

interface ExecutionStatusInfo {
  text: string;
  type?: QueueTagType;
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

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 400;
});

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
const browserAutomationDispatchToggleClientId = ref("");
const publishDispatchDialogVisible = ref(false);
const publishDispatchSubmitting = ref(false);
const dispatchTargetTask = ref<QueueMessage | null>(null);
const selectedDispatchClientId = ref("");

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

const onlineBrowserAutomationClients = computed(() =>
  browserAutomationClients.value.filter((client) => !!client?.isOnline),
);

const availableBrowserAutomationClients = computed(() =>
  browserAutomationClients.value.filter((client) => isBrowserAutomationClientAvailable(client)),
);

const busyBrowserAutomationClients = computed(() =>
  browserAutomationClients.value.filter((client) => isBrowserAutomationClientBusy(client)),
);

const publishCapabilityTagMap = computed(() => {
  const map = new Map<string, string>();
  browserAutomationClients.value.forEach((client: any) => {
    const runtime = getBrowserAutomationRuntime(client);
    const supportedTaskTypes = extractBrowserAutomationSupportedTaskTypes(runtime);
    supportedTaskTypes.forEach((taskType) => {
      if (!map.has(taskType)) {
        map.set(taskType, taskTypeLabel(taskType));
      }
    });
  });
  return map;
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

function isBrowserAutomationClientAvailable(client: any) {
  return isBrowserAutomationClientAvailableByRuntime(client, getBrowserAutomationRuntime(client));
}

function getClientTaskTypeState(client: any, taskType?: string) {
  if (!taskType) {
    return { enabled: false, text: "任务类型未知" };
  }
  if (!client?.isOnline) {
    return { enabled: false, text: "客户端离线" };
  }
  const runtime = getBrowserAutomationRuntime(client);
  const runtimeHint = getBrowserAutomationRuntimeHint(runtime);
  if (!(runtime?.available || runtime?.connected)) {
    return {
      enabled: false,
      text: runtimeHint ? `自动化服务不可用，${runtimeHint}` : "自动化服务不可用",
    };
  }
  if (!supportsTaskType(client, taskType)) {
    return { enabled: false, text: "当前节点不支持该任务类型" };
  }
  if (isBrowserAutomationClientBusy(client)) {
    return {
      enabled: false,
      text: runtimeHint ? `节点当前忙碌中，${runtimeHint}` : "节点当前忙碌中",
    };
  }
  return { enabled: true, text: "可立即执行" };
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
  let info: ExecutionStatusInfo;

  if (!isPublishTaskRow(row)) {
    if (row.status === "waiting") {
      info = { text: "等待中", type: "warning" };
      return info;
    }
    if (row.status === "pending") {
      info = { text: "可执行", type: "success" };
      return info;
    }
    return { text: "-" };
  }

  const dispatchMeta = getPublishDispatchMeta(row);
  const assignedClientText =
    dispatchMeta.assignedMachineCode || dispatchMeta.assignedClientId || "";

  if (row.status === "waiting") {
    return { text: "准备中", type: "warning" };
  }
  if (dispatchMeta.status === "assigned") {
    return { text: assignedClientText ? `已分配 · ${assignedClientText}` : "已分配", type: "info" };
  }
  if (dispatchMeta.status === "running" || row.status === "processing") {
    const progressText =
      typeof dispatchMeta.progress === "number" ? ` ${Math.round(dispatchMeta.progress)}%` : "";
    return {
      text: `执行中${progressText}`,
      type: "warning",
    };
  }
  if (dispatchMeta.status === "completed" || row.status === "completed") {
    return { text: "已执行", type: "success" };
  }
  if (
    dispatchMeta.status === "failed" ||
    dispatchMeta.status === "timeout" ||
    row.status === "failed"
  ) {
    return { text: "失败，可重试", type: "danger" };
  }
  if (row.status === "pending") {
    return { text: "待调度", type: "success" };
  }
  return { text: "-" };
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
  dispatchTargetTask.value = row;
  const preferredClient = browserAutomationClients.value.find(
    (client) => getClientTaskTypeState(client, row.type).enabled,
  );
  selectedDispatchClientId.value = preferredClient?.id || "";
  publishDispatchDialogVisible.value = true;
}

async function handleConfirmPublishDispatch() {
  if (!dispatchTargetTask.value) {
    return;
  }
  if (!selectedDispatchClientId.value) {
    ElMessage.warning("请选择一个可执行客户端");
    return;
  }

  publishDispatchSubmitting.value = true;
  try {
    await startPublishTaskDispatch(dispatchTargetTask.value.id, {
      clientId: selectedDispatchClientId.value,
    });
    ElMessage.success("发布任务已分配到客户端执行");
    publishDispatchDialogVisible.value = false;
    await Promise.all([getList(), refreshStats(), refreshBrowserAutomationClients()]);
  } catch (error: any) {
    ElMessage.error(error?.message || "发布任务分发失败");
  } finally {
    publishDispatchSubmitting.value = false;
  }
}

async function loadPublishTaskAutoDispatchSetting() {
  try {
    const response: any = await getUserSetting({ key: "browserAutomation" });
    const data = response?.data || response || {};
    publishTaskAutoDispatchEnabled.value = !!data?.autoSchedulingEnabled;
  } catch {
    publishTaskAutoDispatchEnabled.value = false;
  }
}

async function handleTogglePublishAutoDispatch(enabled: boolean) {
  publishTaskAutoDispatchLoading.value = true;
  try {
    await updateUserSetting({
      key: "browserAutomation",
      data: {
        autoSchedulingEnabled: enabled,
      },
    });
    publishTaskAutoDispatchEnabled.value = enabled;

    if (enabled) {
      const response = await triggerPublishTaskAutoDispatch();
      ElMessage.success(response?.message || "已开启自动执行");
    } else {
      ElMessage.success("已关闭自动执行");
    }
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
    await Promise.all([getList(), refreshStats(), refreshBrowserAutomationClients()]);
  } catch (error: any) {
    ElMessage.error(error?.message || "触发自动调度失败");
  } finally {
    publishTaskAutoDispatchLoading.value = false;
  }
}

async function handleToggleClientAutoDispatch(client: any, enabled: boolean) {
  browserAutomationDispatchToggleClientId.value = client.id;
  try {
    await toggleBrowserAutomationAutoDispatch(client.id, enabled);
    ElMessage.success(enabled ? "节点已允许自动接单" : "节点已暂停自动接单");
    await refreshBrowserAutomationClients();
  } catch (error: any) {
    ElMessage.error(error?.message || "更新节点自动执行状态失败");
  } finally {
    browserAutomationDispatchToggleClientId.value = "";
  }
}

function applyPublishTaskRuntimeEvent(event: PublishTaskRuntimeEvent) {
  const taskIndex = dataSource.value.findIndex((item) => item.id === event.taskId);
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

  if (dispatchTargetTask.value?.id === event.taskId && event.status === "running") {
    publishDispatchDialogVisible.value = false;
  }

  if (currentTaskId.value === event.taskId && event.runtime) {
    currentTaskData.value = {
      ...normalizeTaskDataRecord(currentTaskData.value),
      taskLogs: event.runtime,
    };
  }

  if (event.status === "completed" || event.status === "failed" || event.status === "pending") {
    void refreshStats();
  }
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
      "将基于当前套图信息和发布配置重新生成这条任务的发布数据，是否继续？",
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

async function handleOperationCommand(command: string, row: QueueMessage) {
  switch (command) {
    case "startExecution":
      openPublishDispatchDialog(row);
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

// 初始化
onMounted(() => {
  void Promise.all([
    getList(),
    refreshStats(),
    refreshBrowserAutomationClients(),
    loadPublishTaskAutoDispatchSetting(),
  ]);
  websocketClient.events.on("publishTaskRuntime", applyPublishTaskRuntimeEvent);
});

onUnmounted(() => {
  websocketClient.events.off("publishTaskRuntime", applyPublishTaskRuntimeEvent);
});
</script>
<style lang="less">
.queue-page {
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

.queue-dispatch-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 18px;
}

.queue-dispatch-panel__summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.queue-dispatch-panel__title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
}

.queue-dispatch-panel__desc {
  margin-top: 6px;
  max-width: 760px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.queue-dispatch-panel__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.queue-dispatch-panel__switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 50%, transparent 50%);
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-fill-color-light) 72%, transparent 28%);
}

.queue-dispatch-panel__switch-label {
  font-size: 13px;
  font-weight: 600;
}

.queue-dispatch-panel__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.queue-dispatch-panel__client-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.queue-client-card {
  border: 1px solid color-mix(in srgb, var(--el-border-color) 46%, transparent 54%);
  border-radius: 16px;
  background: color-mix(in srgb, var(--el-bg-color) 92%, transparent 8%);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.queue-client-card.is-ready {
  border-color: color-mix(in srgb, var(--el-color-success) 34%, transparent 66%);
}

.queue-client-card.is-running {
  border-color: color-mix(in srgb, #14b8a6 44%, transparent 56%);
  box-shadow:
    0 10px 28px rgba(20, 184, 166, 0.12),
    inset 0 0 0 1px rgba(20, 184, 166, 0.08);
}

.queue-client-card.is-offline {
  opacity: 0.76;
}

.queue-client-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 0;
}

.queue-client-card__title {
  font-size: 14px;
  font-weight: 700;
}

.queue-client-card__sub {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.queue-client-card__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px 16px;
}

.queue-client-card__line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.queue-client-card__value {
  color: var(--el-text-color-secondary);
  text-align: right;
}

.queue-client-card__hint {
  margin-top: -2px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.queue-client-card__capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.queue-client-card__empty {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.publish-dispatch-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.publish-dispatch-dialog__client-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.publish-dispatch-client {
  width: 100%;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 54%, transparent 46%);
  border-radius: 16px;
  background: color-mix(in srgb, var(--el-bg-color) 94%, transparent 6%);
  text-align: left;
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
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.publish-dispatch-client__title {
  font-size: 14px;
  font-weight: 700;
}

.publish-dispatch-client__desc {
  margin-top: 10px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.publish-dispatch-client__capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.publish-dispatch-client__capabilities span {
  padding: 4px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-fill-color-light) 72%, transparent 28%);
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
}

.queue-runtime-toolbar__meta {
  display: flex;
  gap: 14px;
  font-size: 12px;
}

.queue-runtime-console {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.7;
}

.queue-runtime-console__line + .queue-runtime-console__line {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color-light);
}

.queue-runtime-console__line[data-level="warn"],
.queue-runtime-console__line[data-level="warning"] {
  border-left: 4px solid #c27803;
  padding-left: 10px;
}

.queue-runtime-console__line[data-level="error"] {
  border-left: 4px solid #c45656;
  padding-left: 10px;
}

.queue-runtime-console__time {
  margin-right: 10px;
  color: var(--el-text-color-secondary);
}

.queue-runtime-console__level {
  display: inline-block;
  min-width: 56px;
  margin-right: 10px;
  font-weight: 700;
}

.queue-runtime-console__level[data-level="info"] {
  color: #1d4ed8;
}

.queue-runtime-console__level[data-level="warn"],
.queue-runtime-console__level[data-level="warning"] {
  color: #b45309;
}

.queue-runtime-console__level[data-level="error"] {
  color: #b91c1c;
}

.queue-runtime-console__line[data-level="warn"] .queue-runtime-console__message,
.queue-runtime-console__line[data-level="warning"] .queue-runtime-console__message {
  color: #92400e;
}

.queue-runtime-console__line[data-level="error"] .queue-runtime-console__message {
  color: #991b1b;
}

.queue-runtime-console__message {
  white-space: pre-wrap;
  word-break: break-word;
}

.queue-runtime-console__data {
  margin: 8px 0 0 66px;
  padding: 8px 10px;
  overflow: auto;
  line-height: 1.6;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
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
  .queue-dispatch-panel {
    padding: 14px;
  }

  .queue-dispatch-panel__summary {
    flex-direction: column;
  }

  .queue-dispatch-panel__actions {
    width: 100%;
    justify-content: flex-start;
  }

  .queue-json-editor-layout {
    grid-template-columns: 1fr;
  }

  .queue-runtime-shell {
    height: calc(100vh - 132px);
  }
}

@media (min-width: 768px) and (max-width: 1180px) {
  .queue-page {
    gap: 12px;
  }

  .queue-page .queue-stats-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .queue-page .list-page-search-form__actions .el-button,
  .queue-dispatch-panel .el-button {
    min-height: 42px;
    padding: 0 18px;
  }

  .queue-dispatch-panel {
    gap: 16px;
    padding: 18px;
  }

  .queue-dispatch-panel__summary,
  .queue-dispatch-panel__actions {
    gap: 14px;
  }

  .queue-dispatch-panel__client-grid,
  .publish-dispatch-dialog__client-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .queue-client-card__line :deep(.el-switch),
  .queue-dispatch-panel__switch :deep(.el-switch) {
    --el-switch-height: 28px;
    --el-switch-width: 54px;
  }

  .publish-dispatch-client,
  .queue-client-card {
    border-radius: 18px;
  }

  .queue-client-card__header,
  .queue-client-card__body,
  .publish-dispatch-client {
    padding-left: 18px;
    padding-right: 18px;
  }

  .queue-runtime-console {
    padding: 14px 16px;
    font-size: 13px;
  }

  .publish-dispatch-dialog :deep(.el-dialog__body) {
    padding: 18px 20px;
  }
}
</style>
