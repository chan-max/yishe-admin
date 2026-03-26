<template>
  <div>
    <!-- 搜索栏 -->
    <div class="pb-4 flex flex-wrap justify-end gap-4 items-center search-bar">
      <form-item label="任务ID">
        <el-input v-model="queryParams.id" placeholder="留空则查询所有ID" style="width: 200px" clearable
          @keyup.enter="getList" />
      </form-item>
      <form-item label="任务类型">
        <el-select v-model="queryParams.type" placeholder="请选择任务类型" style="width: 200px" clearable
          @keyup.enter="getList">
          <el-option v-for="opt in TASK_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </form-item>
      <form-item label="任务状态">
        <el-select v-model="queryParams.status" placeholder="请选择状态" style="width: 160px" clearable>
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已完成" value="completed" />
          <el-option label="失败" value="failed" />
        </el-select>
      </form-item>
      <form-item label="时间排序">
        <el-select v-model="queryParams.sortType" style="width: 180px" @change="handleSortTypeChange">
          <el-option label="创建时间倒序" value="createdAt_DESC" />
          <el-option label="创建时间正序" value="createdAt_ASC" />
          <el-option label="更新时间倒序" value="updatedAt_DESC" />
          <el-option label="更新时间正序" value="updatedAt_ASC" />
          <el-option label="完成时间倒序" value="processedAt_DESC" />
          <el-option label="完成时间正序" value="processedAt_ASC" />
        </el-select>
      </form-item>
      <el-button type="primary" :icon="Search" @click="getList"> 搜索 </el-button>
      <el-button type="primary" :icon="Plus" @click="handleAdd"> 新增任务 </el-button>
      <el-button v-admin-only type="danger" :icon="Delete" @click="handleDelete(null)" :disabled="!ids.length">
        批量删除
      </el-button>
    </div>

    <!-- 统计信息卡片 -->
    <div class="mb-4 grid grid-cols-5 gap-4">
      <el-card shadow="hover">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ stats.pending }}</div>
          <div class="text-sm text-gray-500 mt-1">待处理</div>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="text-center">
          <div class="text-2xl font-bold text-orange-600">{{ stats.processing }}</div>
          <div class="text-sm text-gray-500 mt-1">处理中</div>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ stats.completed }}</div>
          <div class="text-sm text-gray-500 mt-1">已完成</div>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="text-center">
          <div class="text-2xl font-bold text-red-600">{{ stats.failed }}</div>
          <div class="text-sm text-gray-500 mt-1">失败</div>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-600">{{ stats.total }}</div>
          <div class="text-sm text-gray-500 mt-1">总计</div>
        </div>
      </el-card>
    </div>

    <!-- 表格展示 -->
    <div class="common-table">
      <vxe-grid v-bind="gridOptions" :data="dataSource" :loading="loading" @checkbox-change="checkboxChange"
        @checkbox-all="checkboxAllChange">
        <template #statusDefaultSlot="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>

        <template #executionStatusDefaultSlot="{ row }">
          <el-tag v-if="row.status === 'waiting'" type="warning" size="small">
            等待中
          </el-tag>
          <el-tag v-else-if="row.status === 'pending'" type="success" size="small">
            可执行
          </el-tag>
          <span v-else class="text-gray-400 text-sm">-</span>
        </template>

        <template #dataDefaultSlot="{ row }">
          <div class="flex items-center gap-2">
            <el-button type="primary" link size="small" @click="handleViewData(row)">
              查看数据
            </el-button>
            <el-button type="primary" link size="small" @click="handleViewRuntimeLogs(row)">
              运行日志
            </el-button>
          </div>
        </template>

        <template #operationDefaultSlot="{ row }">
          <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, row)">
            <el-button type="primary" link size="small">
              操作
              <el-icon class="el-icon--right">
                <ArrowDown />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="String(row.type || '').startsWith('publish-product-')" :command="'regenerate'"
                  :disabled="row.status === 'processing'">
                  重新生成
                </el-dropdown-item>
                <el-dropdown-item :command="'updateData'">更新数据</el-dropdown-item>
                <el-dropdown-item :command="'editStatus'">标记状态</el-dropdown-item>
                <el-dropdown-item v-if="userStore.user?.isAdmin" :command="'delete'" divided>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </vxe-grid>
    </div>

    <!-- 分页 -->
    <div class="py-4 flex justify-end">
      <pagination :total="total" v-model:page="queryParams.currentPage" v-model:limit="queryParams.pageSize"
        @pagination="getList" />
    </div>

    <!-- 新增任务对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" :center="false" align-center
      @close="resetForm">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="任务类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择任务类型" style="width: 100%" clearable>
            <el-option v-for="opt in TASK_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="请输入任务描述（可选）" />
        </el-form-item>
        <el-form-item label="任务数据" prop="data">
          <el-input v-model="formData.dataStr" type="textarea" :rows="6"
            placeholder="请输入JSON格式的任务数据，例如：{&quot;key&quot;: &quot;value&quot;}" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-input-number v-model="formData.priority" :min="0" :max="100" placeholder="数字越大优先级越高"
                style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="延迟(秒)" prop="delay">
              <el-input-number v-model="formData.delay" :min="0" placeholder="延迟执行时间（秒）" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="最大重试" prop="maxAttempts">
          <el-input-number v-model="formData.maxAttempts" :min="1" :max="10" placeholder="最大重试次数" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑状态对话框 -->
    <el-dialog v-model="statusDialogVisible" title="修改任务状态" width="500px" :center="false" align-center>
      <el-form ref="statusFormRef" :model="statusFormData" :rules="statusFormRules" label-width="100px">
        <el-form-item label="任务ID">
          <el-input v-model="statusFormData.id" disabled />
        </el-form-item>
        <el-form-item label="当前状态">
          <el-tag :type="getStatusType(statusFormData.status)">
            {{ getStatusText(statusFormData.status) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="新状态" prop="newStatus">
          <el-select v-model="statusFormData.newStatus" placeholder="请选择新状态" style="width: 100%">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="错误信息" prop="error" v-if="statusFormData.newStatus === 'failed'">
          <el-input v-model="statusFormData.error" type="textarea" :rows="3" placeholder="请输入错误信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="statusDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleStatusSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看数据对话框 -->
    <el-dialog v-model="dataDialogVisible" title="任务数据" fullscreen :center="false" align-center class="queue-json-dialog">
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

    <el-dialog v-model="runtimeLogDialogVisible" title="运行日志" fullscreen :center="false" align-center class="queue-runtime-dialog">
      <div class="queue-runtime-shell">
        <div class="queue-runtime-toolbar">
          <div class="queue-runtime-toolbar__meta">
            <span>平台：{{ currentTaskRuntime?.platform || '-' }}</span>
            <span>日志数：{{ currentTaskLogs.length }}</span>
          </div>
        </div>
        <div v-if="currentTaskLogs.length" class="queue-runtime-console">
          <div v-for="(log, index) in currentTaskLogs" :key="log.id || `${log.timestamp}-${index}`" class="queue-runtime-console__line" :data-level="String(log.level || 'info').toLowerCase()">
            <span class="queue-runtime-console__time">{{ formatLogTimestamp(log.time || log.timestamp) }}</span>
            <span class="queue-runtime-console__level" :data-level="String(log.level || 'info').toLowerCase()">
              {{ String(log.level || 'info').toUpperCase() }}
            </span>
            <span class="queue-runtime-console__message">{{ log.message || '-' }}</span>
            <pre v-if="hasLogData(log)" class="queue-runtime-console__data">{{ formatLogData(log.data) }}</pre>
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
    <el-dialog v-model="dataUpdateDialogVisible" title="更新数据" fullscreen :center="false" align-center
      @close="resetDataUpdateForm">
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
            <el-input v-model="dataUpdateFormData.dataStr" type="textarea" class="queue-json-textarea"
              :input-style="{ height: '100%', resize: 'none', fontFamily: 'Monaco, Menlo, Consolas, monospace' }"
              placeholder='请输入完整的 JSON 字符串格式的数据' />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dataUpdateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleDataUpdateSubmit">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, watchEffect, onMounted, watch, computed } from 'vue'
import { commonGridOptions } from '@/common/table'
import { useWindowSize } from '@vueuse/core'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Delete,
  Plus,
  ArrowDown,
} from '@element-plus/icons-vue'
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
} from '@/api/system/queue'
import { regeneratePublishTaskApi } from '@/api/product/publishConfig'
import Pagination from '@/components/Pagination/index.vue'
import { useUserStore } from '@/store/modules/user'
import FormItem from '@/components/Erp/formItem.vue'
import { TASK_TYPE_OPTIONS } from '@/config/task-types'

const userStore = useUserStore()

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  status: undefined as 'pending' | 'processing' | 'completed' | 'failed' | undefined,
  type: '', // 任务类型，默认为空（留空则查询所有类型）
  id: '', // 任务ID，默认为空（留空则查询所有ID）
  sortType: 'createdAt_DESC',
})

const stats = ref<QueueStats>({
  queue: '',
  pending: 0,
  processing: 0,
  delayed: 0,
  completed: 0,
  failed: 0,
  total: 0,
})

const gridOptions = ref({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: {
    keyField: 'id'
  },
  checkboxConfig: {
    reserve: true
  },
  columns: [
    { type: 'checkbox', width: 50, ellipsis: true, reserve: true },
    { title: '任务ID', field: 'id', minWidth: 200, showOverflow: true },
    { title: '任务类型', field: 'type', width: 240 },
    {
      title: '任务描述',
      field: 'description',
      minWidth: 200,
      showOverflow: true,
      formatter: (e) => {
        return e.cellValue || '-'
      }
    },
    {
      title: '状态',
      field: 'status',
      width: 100,
      slots: {
        default: 'statusDefaultSlot'
      }
    },
    {
      title: '可执行状态',
      field: 'executionStatus',
      width: 120,
      slots: {
        default: 'executionStatusDefaultSlot'
      }
    },
    {
      title: '优先级',
      field: 'priority',
      width: 80,
      formatter: (e) => {
        return e.cellValue || 0
      }
    },
    {
      title: '重试次数',
      field: 'attempts',
      width: 100,
      formatter: (e) => {
        const attempts = e.cellValue || 0
        const maxAttempts = e.row.maxAttempts || 3
        return `${attempts}/${maxAttempts}`
      }
    },
    {
      title: '任务数据',
      field: 'data',
      minWidth: 170,
      slots: {
        default: 'dataDefaultSlot'
      }
    },
    {
      title: '创建时间',
      field: 'createdAt',
      width: 180,
      showOverflow: true,
      formatter: (e) => {
        return e.cellValue ? new Date(e.cellValue).toLocaleString() : '-'
      },
    },
    {
      title: '更新时间',
      field: 'updatedAt',
      width: 180,
      showOverflow: true,
      formatter: (e) => {
        return e.cellValue ? new Date(e.cellValue).toLocaleString() : '-'
      },
    },
    {
      title: '错误信息',
      field: 'error',
      minWidth: 200,
      showOverflow: true,
      formatter: (e) => {
        return e.cellValue || '-'
      },
    },
    {
      title: '操作',
      fixed: 'right',
      width: 'auto',
      field: 'operation',
      slots: {
        default: 'operationDefaultSlot'
      }
    }
  ]
})

const { height } = useWindowSize()

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 400
})

const dataSource = ref<QueueMessage[]>([])
const loading = ref(false)
const ids = ref<string[]>([])
const total = ref(0)


// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增任务')
const formRef = ref()
const formData = reactive({
  type: '',
  description: '',
  dataStr: '{}',
  priority: 0,
  delay: 0,
  maxAttempts: 3,
})

const formRules = {
  type: [
    { required: true, message: '请输入任务类型', trigger: 'blur' }
  ],
  dataStr: [
    { required: true, message: '请输入任务数据', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        try {
          JSON.parse(value)
          callback()
        } catch (e) {
          callback(new Error('请输入有效的JSON格式'))
        }
      },
      trigger: 'blur'
    }
  ]
}

// 状态编辑对话框
const statusDialogVisible = ref(false)
const statusFormRef = ref()
const statusFormData = reactive({
  id: '',
  type: '',
  status: '' as QueueMessage['status'],
  newStatus: '' as QueueMessage['status'],
  error: '',
})

const statusFormRules = {
  newStatus: [
    { required: true, message: '请选择新状态', trigger: 'change' }
  ],
  error: [
    { required: true, message: '请输入错误信息', trigger: 'blur' }
  ]
}

// 查看数据对话框
const dataDialogVisible = ref(false)
const dataDialogLoading = ref(false)
const currentTaskData = ref<any>({})
const runtimeLogDialogVisible = ref(false)

const currentTaskRuntime = computed(() => extractTaskRuntime(currentTaskData.value))
const currentTaskLogs = computed(() => {
  const logs = currentTaskRuntime.value?.logs
  return Array.isArray(logs) ? logs : []
})

// 更新数据对话框
const dataUpdateDialogVisible = ref(false)
const dataUpdateFormRef = ref()
const dataUpdateFormData = reactive({
  queue: '',
  messageId: '',
  dataStr: '',
  dataObj: {} as any,
})
const currentDataUpdateRow = ref<QueueMessage | null>(null)

const parsedUpdateData = computed(() => {
  if (!dataUpdateFormData.dataStr.trim()) return {}
  try {
    return JSON.parse(dataUpdateFormData.dataStr)
  } catch (e) {
    return { error: 'Invalid JSON format (解析异常...)' }
  }
})

// 获取状态类型
function getStatusType(status: QueueMessage['status']) {
  const map = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'danger',
  }
  return map[status] || 'info'
}

// 获取状态文本
function getStatusText(status: QueueMessage['status']) {
  const map = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
  }
  return map[status] || status
}

function parseMaybeJson(value: any) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'object') {
    return value
  }

  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch (error) {
    return value
  }
}

function extractTaskRuntime(data: any) {
  if (!data || typeof data !== 'object') {
    return null
  }

  if (data.taskLogs && typeof data.taskLogs === 'object') {
    return data.taskLogs
  }

  if (data.taskRuntime && typeof data.taskRuntime === 'object') {
    return data.taskRuntime
  }

  const legacyRuntime = data.executionRuntime
  if (!legacyRuntime || typeof legacyRuntime !== 'object') {
    return null
  }

  if (Array.isArray(legacyRuntime.logs)) {
    return legacyRuntime
  }

  const firstPlatformKey = Object.keys(legacyRuntime)[0]
  if (!firstPlatformKey) {
    return null
  }

  const firstPlatformRuntime = legacyRuntime[firstPlatformKey]
  if (!firstPlatformRuntime || typeof firstPlatformRuntime !== 'object') {
    return null
  }

  return {
    platform: firstPlatformRuntime.platform || firstPlatformKey,
    logs: Array.isArray(firstPlatformRuntime.logs) ? firstPlatformRuntime.logs : [],
  }
}

function getLogLevelTagType(level?: string) {
  const normalizedLevel = String(level || 'info').toLowerCase()
  if (normalizedLevel === 'error') return 'danger'
  if (normalizedLevel === 'warn' || normalizedLevel === 'warning') return 'warning'
  return 'info'
}

function formatLogTimestamp(value: any) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }
  return date.toLocaleString()
}

function hasLogData(log: any) {
  return log?.data !== undefined && log?.data !== null && !(Array.isArray(log.data) && log.data.length === 0)
}

function formatLogData(value: any) {
  try {
    return JSON.stringify(value, null, 2)
  } catch (error) {
    return String(value)
  }
}

function formatRawJson(value: any) {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch (error) {
    return String(value ?? '')
  }
}

// 获取列表
async function getList() {
  loading.value = true
  try {
    console.log('🔍 开始查询任务列表，任务ID:', queryParams.id?.trim() || '(所有ID)', '任务类型:', queryParams.type?.trim() || '(所有类型)', '状态:', queryParams.status || '(所有状态)')

    const [sortField, sortOrder] = queryParams.sortType.split('_')
    const res = await getTaskList({
      status: queryParams.status, // 不传 status 则查询所有状态
      type: queryParams.type?.trim() || undefined, // 不传 type 则查询所有类型
      id: queryParams.id?.trim() || undefined, // 不传 id 则查询所有ID
      sortField: sortField as 'createdAt' | 'updatedAt' | 'processedAt',
      sortOrder: sortOrder as 'ASC' | 'DESC',
      limit: queryParams.pageSize,
      offset: (queryParams.currentPage - 1) * queryParams.pageSize,
    })

    console.log('📦 获取列表完整响应:', JSON.stringify(res, null, 2))

    // 后端返回格式可能是：
    // 1. { data: { success: true, list: [...], total: 6 }, code: 0, status: true } (TransformInterceptor 包装)
    // 2. { success: true, list: [...], total: 6 } (直接返回)
    // axios 拦截器处理后，如果 code === 200 会返回 data，否则可能返回整个对象或 reject

    let responseData = res

    // 如果 res 有 data 字段且 data 是对象，说明是包装后的响应
    if (res && res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
      // 检查 data 中是否有 success 或 list 字段（说明是队列接口的响应）
      if (res.data.success !== undefined || res.data.list !== undefined || res.data.total !== undefined) {
        responseData = res.data
      }
    }

    // 处理响应数据
    console.log('📊 解析响应数据，responseData:', responseData)

    if (responseData) {
      // 检查是否是成功响应
      const isSuccess = responseData.success !== false && responseData.success !== undefined ? responseData.success : true
      console.log('✅ 响应成功状态:', isSuccess)

      if (isSuccess) {
        const messages = responseData.list || responseData.messages || []
        // 后端已去掉 count 字段，仅返回 total；前端如需当前页数量，使用 messages.length
        const totalCount = responseData.total !== undefined
          ? Number(responseData.total) || 0
          : (Array.isArray(messages) ? messages.length : 0)

        console.log('📋 解析后的数据:', {
          messagesCount: Array.isArray(messages) ? messages.length : 0,
          messagesType: Array.isArray(messages) ? 'array' : typeof messages,
          total: totalCount,
          messages: messages
        })

        dataSource.value = Array.isArray(messages) ? messages : []
        total.value = totalCount

        console.log(`✅ 最终显示 ${dataSource.value.length} 条任务，总数: ${total.value}`)
      } else {
        console.warn('❌ 响应显示失败:', responseData)
        dataSource.value = []
        total.value = 0
      }
    } else {
      console.warn('⚠️ 响应数据为空:', res)
      dataSource.value = []
      total.value = 0
    }
    ids.value = []
  } catch (error: any) {
    console.error('获取列表失败:', error)
    ElMessage.error(error?.message || '获取列表失败')
    dataSource.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSortTypeChange() {
  queryParams.currentPage = 1
  getList()
}

// 刷新统计信息
async function refreshStats() {
  // 如果指定了任务类型，使用任务类型作为队列名称查询统计
  try {
    const queueName = queryParams.type?.trim() || ''
    const res = await getQueueStats(queueName)
    console.log('获取统计信息完整响应:', JSON.stringify(res, null, 2))

    // 后端返回格式可能是：
    // 1. { data: { queue: 'xxx', pending: 0, ... }, code: 0, status: true } (TransformInterceptor 包装)
    // 2. { queue: 'xxx', pending: 0, ... } (直接返回)
    // axios 拦截器处理后，如果 code === 200 会返回 data，否则可能返回整个对象

    let statsData = res

    // 如果 res 有 data 字段且 data 是对象，说明是包装后的响应
    if (res && res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
      // 检查 data 中是否有 queue 或 pending 字段（说明是统计数据的响应）
      if (res.data.queue !== undefined || res.data.pending !== undefined || res.data.processing !== undefined) {
        statsData = res.data
      } else if (res.data.data && typeof res.data.data === 'object') {
        // 可能是双重嵌套
        statsData = res.data.data
      }
    }

    // 处理统计数据
    if (statsData && typeof statsData === 'object' && !Array.isArray(statsData)) {
      stats.value = {
        queue: statsData.queue || queryParams.type?.trim() || '*',
        pending: Number(statsData.pending) || 0,
        processing: Number(statsData.processing) || 0,
        delayed: Number(statsData.delayed) || 0,
        completed: Number(statsData.completed) || 0,
        failed: Number(statsData.failed) || 0,
        total: Number(statsData.total) || 0,
      }
      console.log('✅ 统计数据已更新:', stats.value)
    } else {
      console.warn('⚠️ 统计数据格式异常:', statsData, '原始响应:', res)
    }
  } catch (error: any) {
    console.error('获取统计信息失败:', error)
    // 不显示错误提示，静默失败
  }
}

// 复选框变化
function checkboxChange(e) {
  ids.value = e.records.map((item) => item.id)
}

function checkboxAllChange(e) {
  ids.value = e.records.map((item) => item.id)
}

// 任务类型清空处理
function handleTypeClear() {
  dataSource.value = []
  total.value = 0
  stats.value = {
    queue: '',
    pending: 0,
    processing: 0,
    delayed: 0,
    completed: 0,
    failed: 0,
    total: 0,
  }
  localStorage.removeItem('queue_last_type')
}

// 新增
function handleAdd() {
  dialogTitle.value = '新增任务'
  dialogVisible.value = true
  // 延迟重置表单，确保 dialogVisible 已更新
  setTimeout(() => {
    resetForm()
  }, 50)
}

// 编辑
function handleEdit(row: QueueMessage) {
  statusFormData.id = row.id
  statusFormData.type = row.type
  statusFormData.status = row.status
  statusFormData.newStatus = row.status
  statusFormData.error = row.error || ''
  statusDialogVisible.value = true
}

// 查看数据，优先拉取详情，避免列表数据被裁剪或序列化后显示为空
async function handleViewData(row: QueueMessage) {
  dataDialogVisible.value = true
  dataDialogLoading.value = true
  currentTaskData.value = {}

  try {
    const res = await getTaskDetail(row.queue || row.type, row.id)
    const responseData = res?.data && typeof res.data === 'object' ? res.data : res
    const message = responseData?.data ?? responseData
    const taskData = parseMaybeJson(message?.data)

    currentTaskData.value = taskData ?? parseMaybeJson(row?.data) ?? row?.data ?? {}
  } catch (error) {
    currentTaskData.value = parseMaybeJson(row?.data) ?? row?.data ?? {}
    ElMessage.warning('任务详情获取失败，已显示列表中的数据快照')
  } finally {
    dataDialogLoading.value = false
  }
}

async function handleViewRuntimeLogs(row: QueueMessage) {
  runtimeLogDialogVisible.value = true
  dataDialogLoading.value = true
  currentTaskData.value = {}

  try {
    const res = await getTaskDetail(row.queue || row.type, row.id)
    const responseData = res?.data && typeof res.data === 'object' ? res.data : res
    const message = responseData?.data ?? responseData
    const taskData = parseMaybeJson(message?.data)
    currentTaskData.value = taskData ?? parseMaybeJson(row?.data) ?? row?.data ?? {}
  } catch (error) {
    currentTaskData.value = parseMaybeJson(row?.data) ?? row?.data ?? {}
    ElMessage.warning('运行日志获取失败，已显示列表中的数据快照')
  } finally {
    dataDialogLoading.value = false
  }
}


// 删除任务
function handleDelete(row?: QueueMessage) {
  if (!userStore.user?.isAdmin) {
    return ElMessage.warning('无权限：仅管理员可执行删除操作')
  }
  let delIds: string[] = []
  if (row) {
    delIds = [row.id]
  } else if (!ids.value.length) {
    return ElMessage.warning('请选择要删除的数据')
  } else {
    delIds = [...ids.value]
  }

  ElMessageBox.confirm(`确认删除选中的${delIds.length}条数据吗`, '删除提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'error',
  })
    .then(async () => {
      try {
        for (const id of delIds) {
          const task = dataSource.value.find(t => t.id === id)
          if (task) {
            await deleteTask(task.queue, id)
          }
        }
        ElMessage.success('删除成功')
        getList()
        refreshStats()
      } catch (error) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => { })
}

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value.validate()

    // 检查任务类型
    if (!formData.type || !formData.type.trim()) {
      ElMessage.warning('请输入任务类型')
      return
    }

    let taskData
    try {
      taskData = JSON.parse(formData.dataStr)
    } catch (e) {
      ElMessage.error('任务数据格式错误，请输入有效的JSON')
      return
    }

    loading.value = true

    // 只传递任务类型，后端会自动使用 type 作为 queue
    const createRes = await createTask({
      type: formData.type.trim(),
      description: formData.description?.trim() || undefined,
      data: taskData,
      priority: formData.priority,
      delay: formData.delay,
      maxAttempts: formData.maxAttempts,
    })

    console.log('创建任务响应:', createRes)

    ElMessage.success('任务创建成功')
    dialogVisible.value = false

    // 创建成功后，自动设置查询条件并刷新列表和统计
    const createdType = formData.type.trim()
    const currentType = queryParams.type?.trim() || ''

    // 如果当前没有查询条件，或者查询的就是创建的任务类型，则刷新
    if (!currentType || currentType === createdType) {
      queryParams.type = createdType
      queryParams.currentPage = 1 // 重置到第一页
      console.log('准备刷新列表和统计，任务类型:', createdType)

      // 等待一小段时间，确保后端数据已写入
      await new Promise(resolve => setTimeout(resolve, 300))

      await getList()
      await refreshStats()
    } else {
      // 如果查询的是其他任务类型，只刷新统计（如果统计的是创建的任务类型）
      if (stats.value.queue === createdType) {
        await refreshStats()
      }
    }
  } catch (error: any) {
    console.error('创建任务失败:', error)
    ElMessage.error(error?.message || '创建任务失败')
  } finally {
    loading.value = false
  }
}

// 提交状态修改
async function handleStatusSubmit() {
  try {
    await statusFormRef.value.validate()

    // 如果新状态和当前状态相同，直接返回
    if (statusFormData.newStatus === statusFormData.status) {
      ElMessage.info('状态未发生变化')
      statusDialogVisible.value = false
      return
    }

    // 直接更新状态
    console.log('📝 提交状态更新:', statusFormData.id, statusFormData.type, statusFormData.newStatus, statusFormData.error)
    await updateTaskStatus(
      statusFormData.type,
      statusFormData.id,
      statusFormData.newStatus,
      statusFormData.newStatus === 'failed' ? statusFormData.error : undefined
    )

    ElMessage.success('状态修改成功')
    statusDialogVisible.value = false
    getList()
    refreshStats()
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  }
}

// 重置表单
function resetForm() {
  // 使用当前查询的任务类型，确保使用最新的值
  const currentType = queryParams.type?.trim() || ''
  Object.assign(formData, {
    type: currentType, // 使用当前查询的任务类型，如果没有则为空
    description: '',
    dataStr: '{}',
    priority: 0,
    delay: 0,
    maxAttempts: 3,
  })
  // 延迟清除验证，确保表单已更新
  setTimeout(() => {
    formRef.value?.clearValidate()
  }, 50)
}

// 更新数据
function handleUpdateData(row: QueueMessage) {
  currentDataUpdateRow.value = row
  // 确保 data 存在，如果不存在则使用空对象
  const currentData = row.data || {}
  const dataStrValue = typeof currentData === 'object' && currentData !== null
    ? JSON.stringify(currentData, null, 2)
    : String(currentData || '{}')

  dataUpdateFormData.queue = row.queue
  dataUpdateFormData.messageId = row.id
  dataUpdateFormData.dataStr = dataStrValue
  try {
    dataUpdateFormData.dataObj = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {})
  } catch (e) {
    dataUpdateFormData.dataObj = {}
  }

  dataUpdateDialogVisible.value = true
}

// 提交数据更新
async function handleDataUpdateSubmit() {
  let data: any
  try {
    data = JSON.parse(dataUpdateFormData.dataStr)
  } catch (e) {
    ElMessage.error('请输入有效的JSON格式')
    return
  }

  try {
    loading.value = true
    await updateTaskData(dataUpdateFormData.queue, dataUpdateFormData.messageId, data)
    ElMessage.success('数据已更新')
    dataUpdateDialogVisible.value = false
    await getList()
  } catch (error: any) {
    ElMessage.error(error?.message || '更新数据失败')
  } finally {
    loading.value = false
  }
}

async function handleRegeneratePublishTask(row: QueueMessage) {
  const taskId = String(row?.id || '').trim()
  if (!taskId) {
    ElMessage.warning('缺少任务ID')
    return
  }

  try {
    await ElMessageBox.confirm(
      '将基于当前套图信息和发布配置重新生成这条任务的发布数据，是否继续？',
      '重新生成发布数据',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )

    loading.value = true
    await regeneratePublishTaskApi(taskId)
    ElMessage.success('已触发重新生成')
    await getList()
    await refreshStats()
  } catch (error: any) {
    if (error === 'cancel') {
      return
    }
    ElMessage.error(error?.message || '重新生成发布数据失败')
  } finally {
    loading.value = false
  }
}

async function handleOperationCommand(command: string, row: QueueMessage) {
  switch (command) {
    case 'regenerate':
      await handleRegeneratePublishTask(row)
      break
    case 'updateData':
      handleUpdateData(row)
      break
    case 'editStatus':
      handleEdit(row)
      break
    case 'delete':
      handleDelete(row)
      break
    default:
      break
  }
}

// 重置数据更新表单
function resetDataUpdateForm() {
  dataUpdateFormData.queue = ''
  dataUpdateFormData.messageId = ''
  dataUpdateFormData.dataStr = ''
  currentDataUpdateRow.value = null
  setTimeout(() => {
    dataUpdateFormRef.value?.clearValidate()
  }, 50)
}

// 监听任务类型变化，保存到 localStorage
watch(() => queryParams.type, (newType) => {
  if (newType && newType.trim()) {
    localStorage.setItem('queue_last_type', newType.trim())
  } else {
    localStorage.removeItem('queue_last_type')
  }
})

// 初始化
onMounted(() => {
  getList()
  refreshStats()
})
</script>
<style lang="less">
.table-operation-column {
  gap: 8px;
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
  font-family: Consolas, Monaco, 'Courier New', monospace;
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
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.7;
}

.queue-runtime-console__line + .queue-runtime-console__line {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color-light);
}

.queue-runtime-console__line[data-level='warn'],
.queue-runtime-console__line[data-level='warning'] {
  border-left: 4px solid #c27803;
  padding-left: 10px;
}

.queue-runtime-console__line[data-level='error'] {
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

.queue-runtime-console__level[data-level='info'] {
  color: #1d4ed8;
}

.queue-runtime-console__level[data-level='warn'],
.queue-runtime-console__level[data-level='warning'] {
  color: #b45309;
}

.queue-runtime-console__level[data-level='error'] {
  color: #b91c1c;
}

.queue-runtime-console__line[data-level='warn'] .queue-runtime-console__message,
.queue-runtime-console__line[data-level='warning'] .queue-runtime-console__message {
  color: #92400e;
}

.queue-runtime-console__line[data-level='error'] .queue-runtime-console__message {
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
  .queue-json-editor-layout {
    grid-template-columns: 1fr;
  }

  .queue-runtime-shell {
    height: calc(100vh - 132px);
  }
}
</style>
