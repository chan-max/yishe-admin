<template>
  <div>
    <!-- 搜索栏 -->
    <div class="pb-4 flex flex-wrap justify-end gap-4 items-center search-bar">
      <form-item label="任务类型">
        <el-input 
          v-model="queryParams.type" 
          placeholder="留空则查询所有类型" 
          style="width: 160px" 
          clearable 
          @keyup.enter="getList"
        />
      </form-item>
      <form-item label="任务状态">
        <el-select 
          v-model="queryParams.status" 
          placeholder="请选择状态" 
          style="width: 160px"
          clearable
        >
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已完成" value="completed" />
          <el-option label="失败" value="failed" />
        </el-select>
      </form-item>
      <el-button type="primary" :icon="Search" @click="getList"> 搜索 </el-button>
      <el-button type="primary" :icon="Plus" @click="handleAdd"> 新增任务 </el-button>
      <el-button
        type="danger"
        :icon="Delete"
        @click="handleDelete(null)"
        :disabled="!ids.length"
      >
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

        <template #dataDefaultSlot="{ row }">
          <el-button 
            type="primary" 
            link 
            size="small" 
            @click="handleViewData(row)"
          >
            查看数据
          </el-button>
        </template>

        <template #operationDefaultSlot="{ row }">
          <div class="flex table-operation-column">
            <el-button 
              type="info" 
              link 
              size="small" 
              @click="handleUpdateData(row)"
            >
              更新数据
            </el-button>
            <el-button 
              type="primary" 
              link 
              size="small" 
              @click="handleEdit(row)"
            >
              标记状态
            </el-button>
            <el-button 
              type="danger" 
              link 
              size="small" 
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </div>
        </template>
      </vxe-grid>
    </div>

    <!-- 分页 -->
    <div class="py-4 flex justify-end">
      <pagination
        :total="total"
        v-model:page="queryParams.currentPage"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <!-- 新增任务对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="700px" 
      :center="false"
      align-center
      @close="resetForm"
    >
      <el-form 
        ref="formRef" 
        :model="formData" 
        :rules="formRules" 
        label-width="100px"
      >
        <el-form-item label="任务类型" prop="type">
          <el-input v-model="formData.type" placeholder="请输入任务类型（将作为队列名称）" />
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
            placeholder="请输入JSON格式的任务数据，例如：{&quot;key&quot;: &quot;value&quot;}"
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
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
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
          <el-select v-model="statusFormData.newStatus" placeholder="请选择新状态" style="width: 100%">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
          </el-select>
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
    <el-dialog 
      v-model="dataDialogVisible" 
      title="任务数据" 
      width="600px" 
      :center="false"
      align-center
    >
      <pre class="data-preview">{{ JSON.stringify(currentTaskData, null, 2) }}</pre>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dataDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 更新数据对话框 -->
    <el-dialog 
      v-model="dataUpdateDialogVisible" 
      title="更新数据" 
      width="600px" 
      :center="false"
      align-center
      @close="resetDataUpdateForm"
    >
      <el-form 
        ref="dataUpdateFormRef" 
        :model="dataUpdateFormData" 
        label-width="100px"
      >
        <el-form-item label="数据" prop="dataStr">
          <el-input 
            v-model="dataUpdateFormData.dataStr" 
            type="textarea" 
            :rows="10"
            placeholder='请输入JSON格式的数据，例如：{"key": "value"}'
          />
        </el-form-item>
      </el-form>
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
import { ref, reactive, watchEffect, onMounted, watch } from 'vue'
import { commonGridOptions } from '@/common/table'
import { useWindowSize } from '@vueuse/core'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Delete,
  Plus,
} from '@element-plus/icons-vue'
import { 
  getTaskList,
  createTask,
  deleteTask,
  getQueueStats,
  updateTaskData,
  updateTaskStatus,
  type QueueMessage,
  type QueueStats,
} from '@/api/system/queue'
import Pagination from '@/components/Pagination/index.vue'
import FormItem from '@/components/Erp/formItem.vue'

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  status: undefined as 'pending' | 'processing' | 'completed' | 'failed' | undefined,
  type: '', // 任务类型，默认为空（留空则查询所有类型）
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
      width: 120,
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
})

const statusFormRules = {
  newStatus: [
    { required: true, message: '请选择新状态', trigger: 'change' }
  ]
}

// 查看数据对话框
const dataDialogVisible = ref(false)
const currentTaskData = ref<any>({})

// 更新数据对话框
const dataUpdateDialogVisible = ref(false)
const dataUpdateFormRef = ref()
const dataUpdateFormData = reactive({
  queue: '',
  messageId: '',
  dataStr: '',
})
const currentDataUpdateRow = ref<QueueMessage | null>(null)

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

// 获取列表
async function getList() {
  loading.value = true
  try {
    console.log('🔍 开始查询任务列表，任务类型:', queryParams.type?.trim() || '(所有类型)', '状态:', queryParams.status || '(所有状态)')
    
    const res = await getTaskList({
      status: queryParams.status, // 不传 status 则查询所有状态
      type: queryParams.type?.trim() || undefined, // 不传 type 则查询所有类型
      limit: queryParams.pageSize,
      offset: (queryParams.currentPage - 1) * queryParams.pageSize,
    })
    
    console.log('📦 获取列表完整响应:', JSON.stringify(res, null, 2))
    
    // 后端返回格式可能是：
    // 1. { data: { success: true, data: [...], count: 6 }, code: 0, status: true } (TransformInterceptor 包装)
    // 2. { success: true, data: [...], count: 6 } (直接返回)
    // axios 拦截器处理后，如果 code === 200 会返回 data，否则可能返回整个对象或 reject
    
    let responseData = res
    
    // 如果 res 有 data 字段且 data 是对象，说明是包装后的响应
    if (res && res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
      // 检查 data 中是否有 success 或 data 字段（说明是队列接口的响应）
      if (res.data.success !== undefined || res.data.data !== undefined || res.data.count !== undefined) {
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
        const messages = responseData.data || responseData.messages || []
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
  statusDialogVisible.value = true
}

// 查看数据
function handleViewData(row: QueueMessage) {
  currentTaskData.value = row.data
  dataDialogVisible.value = true
}


// 删除任务
function handleDelete(row?: QueueMessage) {
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
    .catch(() => {})
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
    await updateTaskStatus(statusFormData.type, statusFormData.id, statusFormData.newStatus)
    
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
  
  dataUpdateDialogVisible.value = true
}

// 提交数据更新
async function handleDataUpdateSubmit() {
  if (!dataUpdateFormData.dataStr || !dataUpdateFormData.dataStr.trim()) {
    ElMessage.warning('请输入数据')
    return
  }
  
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
</style>

