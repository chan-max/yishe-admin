<template>
  <div>
    <!-- 搜索栏 -->
    <div class="pb-4 flex flex-wrap justify-end gap-4 items-center search-bar">
      <form-item label="队列名称">
        <el-input 
          v-model="queryParams.queue" 
          placeholder="请输入队列名称" 
          style="width: 160px" 
          clearable 
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
      <el-button :icon="Refresh" @click="resetQuery"> 重置 </el-button>
      <el-button type="primary" :icon="Plus" @click="handleAdd"> 新增任务 </el-button>
      <el-button
        v-if="hasProcessingTasks"
        type="success"
        @click="handleBatchAck"
        :disabled="!selectedProcessingIds.length"
      >
        批量确认完成
      </el-button>
      <el-button
        v-if="hasProcessingTasks"
        type="warning"
        @click="handleBatchNack"
        :disabled="!selectedProcessingIds.length"
      >
        批量标记失败
      </el-button>
      <el-button
        type="danger"
        :icon="Delete"
        @click="handleDelete(null)"
        :disabled="!ids.length"
      >
        批量删除
      </el-button>
      <el-button
        type="danger"
        @click="handleClearQueue"
        :disabled="!queryParams.queue"
      >
        清空队列
      </el-button>
      <el-button type="warning" :icon="Refresh" @click="refreshStats"> 刷新统计 </el-button>
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
        ref="gridRef"
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
              v-if="row.status === 'failed'" 
              type="success" 
              link 
              size="small" 
              @click="handleRequeue(row)"
            >
              重新入队
            </el-button>
            <el-button 
              v-if="row.status === 'processing'" 
              type="success" 
              link 
              size="small" 
              @click="handleAck(row)"
            >
              确认完成
            </el-button>
            <el-button 
              v-if="row.status === 'processing'" 
              type="warning" 
              link 
              size="small" 
              @click="handleNack(row)"
            >
              标记失败
            </el-button>
            <el-button 
              type="info" 
              link 
              size="small" 
              @click="handleUpdateMetadata(row)"
            >
              更新元数据
            </el-button>
            <el-button 
              type="primary" 
              link 
              size="small" 
              @click="handleEdit(row)"
            >
              编辑状态
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
        <el-form-item label="队列名称" prop="queue">
          <el-input v-model="formData.queue" placeholder="请输入队列名称" />
        </el-form-item>
        <el-form-item label="任务类型" prop="type">
          <el-input v-model="formData.type" placeholder="请输入任务类型" />
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
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, watchEffect, onMounted, computed } from 'vue'
import { commonGridOptions } from '@/common/table'
import { formatTimestamp } from '@/common/date'
import { useWindowSize } from '@vueuse/core'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Delete,
  Refresh,
  Plus,
} from '@element-plus/icons-vue'
import { 
  getTaskList,
  createTask,
  deleteTask,
  getQueueStats,
  ackTask,
  nackTask,
  requeueTask,
  clearQueue,
  updateTaskMetadata,
  type QueueMessage,
  type QueueStats,
} from '@/api/system/queue'
import Pagination from '@/components/Pagination/index.vue'
import FormItem from '@/components/Erp/formItem.vue'

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  queue: 'default',
  status: undefined as 'pending' | 'processing' | 'completed' | 'failed' | undefined,
})

const gridRef = ref()
const stats = ref<QueueStats>({
  queue: 'default',
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
    { title: '队列名称', field: 'queue', width: 120 },
    { title: '任务类型', field: 'type', width: 150 },
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

// 计算属性：选中的处理中任务
const selectedProcessingIds = computed(() => {
  return ids.value.filter(id => {
    const task = dataSource.value.find(t => t.id === id)
    return task && task.status === 'processing'
  })
})

// 计算属性：是否有处理中的任务
const hasProcessingTasks = computed(() => {
  return dataSource.value.some(task => task.status === 'processing')
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增任务')
const formRef = ref()
const formData = reactive({
  queue: 'default',
  type: '',
  dataStr: '{}',
  priority: 0,
  delay: 0,
  maxAttempts: 3,
})

const formRules = {
  queue: [
    { required: true, message: '请输入队列名称', trigger: 'blur' }
  ],
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
  queue: '',
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
  if (!queryParams.queue) {
    ElMessage.warning('请先输入队列名称')
    return
  }
  
  loading.value = true
  try {
    const res = await getTaskList({
      queue: queryParams.queue,
      status: queryParams.status,
      limit: queryParams.pageSize,
      offset: (queryParams.currentPage - 1) * queryParams.pageSize,
    })
    
    if (res.success) {
      dataSource.value = res.data || []
      total.value = res.count || 0
    } else {
      dataSource.value = []
      total.value = 0
    }
    ids.value = []
  } catch (error) {
    ElMessage.error('获取列表失败')
    dataSource.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 刷新统计信息
async function refreshStats() {
  if (!queryParams.queue) {
    return
  }
  try {
    const res = await getQueueStats(queryParams.queue)
    if (res.success && res.data) {
      stats.value = res.data
    }
  } catch (error) {
    ElMessage.error('获取统计信息失败')
  }
}

// 复选框变化
function checkboxChange(e) {
  ids.value = e.records.map((item) => item.id)
}

function checkboxAllChange(e) {
  ids.value = e.records.map((item) => item.id)
}

// 重置查询
const resetQuery = () => {
  queryParams.currentPage = 1
  queryParams.pageSize = 20
  queryParams.status = undefined
  getList()
}

// 新增
function handleAdd() {
  dialogTitle.value = '新增任务'
  dialogVisible.value = true
  resetForm()
}

// 编辑
function handleEdit(row: QueueMessage) {
  statusFormData.id = row.id
  statusFormData.queue = row.queue
  statusFormData.status = row.status
  statusFormData.newStatus = row.status
  statusDialogVisible.value = true
}

// 查看数据
function handleViewData(row: QueueMessage) {
  currentTaskData.value = row.data
  dataDialogVisible.value = true
}

// 确认完成
async function handleAck(row: QueueMessage) {
  try {
    await ElMessageBox.confirm('确认该任务已完成？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info',
    })
    
    loading.value = true
    await ackTask(row.queue, row.id)
    ElMessage.success('任务已确认完成')
    await getList()
    await refreshStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '操作失败')
    }
  } finally {
    loading.value = false
  }
}

// 标记失败
async function handleNack(row: QueueMessage) {
  try {
    const { value: error } = await ElMessageBox.prompt('请输入失败原因（可选）', '标记失败', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入失败原因',
    })
    
    loading.value = true
    await nackTask(row.queue, row.id, error || undefined, false)
    ElMessage.success('任务已标记为失败')
    await getList()
    await refreshStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '操作失败')
    }
  } finally {
    loading.value = false
  }
}

// 批量确认完成
async function handleBatchAck() {
  if (selectedProcessingIds.value.length === 0) {
    ElMessage.warning('请先选择要确认完成的任务')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确认批量完成 ${selectedProcessingIds.value.length} 个任务？`,
      '批量确认完成',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'info',
      }
    )
    
    loading.value = true
    let successCount = 0
    let failCount = 0
    
    for (const id of selectedProcessingIds.value) {
      const task = dataSource.value.find(t => t.id === id)
      if (task && task.status === 'processing') {
        try {
          await ackTask(task.queue, task.id)
          successCount++
        } catch (error) {
          failCount++
          console.error(`任务 ${task.id} 确认失败:`, error)
        }
      }
    }
    
    if (successCount > 0) {
      ElMessage.success(`成功确认完成 ${successCount} 个任务${failCount > 0 ? `，${failCount} 个失败` : ''}`)
    } else {
      ElMessage.error('批量确认失败')
    }
    
    await getList()
    await refreshStats()
    ids.value = []
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '操作失败')
    }
  } finally {
    loading.value = false
  }
}

// 批量标记失败
async function handleBatchNack() {
  if (selectedProcessingIds.value.length === 0) {
    ElMessage.warning('请先选择要标记失败的任务')
    return
  }
  
  try {
    const { value: error } = await ElMessageBox.prompt(
      `确认批量标记 ${selectedProcessingIds.value.length} 个任务为失败？`,
      '批量标记失败',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请输入失败原因（可选，将应用于所有任务）',
      }
    )
    
    loading.value = true
    let successCount = 0
    let failCount = 0
    
    for (const id of selectedProcessingIds.value) {
      const task = dataSource.value.find(t => t.id === id)
      if (task && task.status === 'processing') {
        try {
          await nackTask(task.queue, task.id, error || undefined, false)
          successCount++
        } catch (error) {
          failCount++
          console.error(`任务 ${task.id} 标记失败:`, error)
        }
      }
    }
    
    if (successCount > 0) {
      ElMessage.success(`成功标记 ${successCount} 个任务为失败${failCount > 0 ? `，${failCount} 个失败` : ''}`)
    } else {
      ElMessage.error('批量标记失败')
    }
    
    await getList()
    await refreshStats()
    ids.value = []
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '操作失败')
    }
  } finally {
    loading.value = false
  }
}

// 重新入队
async function handleRequeue(row: QueueMessage) {
  try {
    await ElMessageBox.confirm('确认重新入队该任务？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info',
    })
    
    await requeueTask(row.queue, row.id)
    ElMessage.success('任务已重新入队')
    getList()
    refreshStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
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
    
    let taskData
    try {
      taskData = JSON.parse(formData.dataStr)
    } catch (e) {
      ElMessage.error('任务数据格式错误，请输入有效的JSON')
      return
    }
    
    await createTask({
      queue: formData.queue,
      type: formData.type,
      data: taskData,
      priority: formData.priority,
      delay: formData.delay,
      maxAttempts: formData.maxAttempts,
    })
    
    ElMessage.success('任务创建成功')
    dialogVisible.value = false
    getList()
    refreshStats()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 提交状态修改
async function handleStatusSubmit() {
  try {
    await statusFormRef.value.validate()
    
    // 根据新状态执行相应操作
    if (statusFormData.newStatus === 'completed') {
      await ackTask(statusFormData.queue, statusFormData.id)
    } else if (statusFormData.newStatus === 'failed') {
      await nackTask(statusFormData.queue, statusFormData.id, '手动标记为失败', false)
    } else if (statusFormData.newStatus === 'pending' && statusFormData.status === 'failed') {
      await requeueTask(statusFormData.queue, statusFormData.id)
    } else {
      ElMessage.warning('不支持的状态转换')
      return
    }
    
    ElMessage.success('状态修改成功')
    statusDialogVisible.value = false
    getList()
    refreshStats()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 重置表单
function resetForm() {
  Object.assign(formData, {
    queue: queryParams.queue || 'default',
    type: '',
    dataStr: '{}',
    priority: 0,
    delay: 0,
    maxAttempts: 3,
  })
  formRef.value?.clearValidate()
}

// 清空队列
async function handleClearQueue() {
  if (!queryParams.queue) {
    ElMessage.warning('请先输入队列名称')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确认清空队列 "${queryParams.queue}" 的所有任务？此操作不可恢复！`,
      '清空队列',
      {
        confirmButtonText: '确认清空',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false,
      }
    )
    
    loading.value = true
    await clearQueue(queryParams.queue)
    ElMessage.success('队列已清空')
    await getList()
    await refreshStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '清空队列失败')
    }
  } finally {
    loading.value = false
  }
}

// 更新元数据
async function handleUpdateMetadata(row: QueueMessage) {
  try {
    const { value: metadataStr } = await ElMessageBox.prompt(
      '请输入要更新的元数据（JSON格式）',
      '更新元数据',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '{"key": "value"}',
        inputValue: JSON.stringify(row.metadata || {}, null, 2),
      }
    )
    
    let metadata: Record<string, any>
    try {
      metadata = JSON.parse(metadataStr)
    } catch (e) {
      ElMessage.error('请输入有效的JSON格式')
      return
    }
    
    loading.value = true
    await updateTaskMetadata(row.queue, row.id, metadata)
    ElMessage.success('元数据已更新')
    await getList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '更新元数据失败')
    }
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  if (queryParams.queue) {
    getList()
    refreshStats()
  }
})
</script>

<style lang="less">
.table-operation-column {
  gap: 8px;
}

.data-preview {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  max-height: 400px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
}
</style>

