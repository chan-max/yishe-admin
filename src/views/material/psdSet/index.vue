<template>
  <div class="psd-set-page">
    <div class="flex pb-4 flex-wrap justify-end gap-4 items-center search-bar">
      <div style="flex:1;"></div>
      <form-item label="关键词">
        <el-input
          v-model="queryParams.keyword"
          placeholder="名称/描述/关键词"
          style="width: 200px"
          clearable
          @change="handleKeywordChange"
        />
      </form-item>
      <form-item label="状态">
        <el-select v-model="queryParams.status" placeholder="全部状态" style="width: 160px" clearable @change="getList">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </form-item>
      <el-button type="primary" :icon="Search" @click="getList">搜索</el-button>
      <el-button type="default" :icon="Refresh" @click="resetFilters">重置</el-button>
      <div class="flex items-center" style="margin-left: auto">
        <el-button
          type="danger"
          plain
          @click="handleBatchDelete"
          :disabled="!selectedIds.length"
        >
          批量删除 ({{ selectedIds.length }})
        </el-button>
      </div>
    </div>

    <div class="common-table">
      <vxe-grid
        v-bind="gridOptions"
        :data="dataSource"
        :loading="loading"
        @checkbox-change="onSelectionChange"
        @checkbox-all="onSelectionChange"
      >
        <template #statusSlot="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">
            {{ statusLabel(row.status) }}
          </el-tag>
          <div v-if="row.statusMessage" class="status-message">{{ row.statusMessage }}</div>
        </template>
        <template #operationSlot="{ row }">
          <el-dropdown trigger="click">
            <el-button type="primary" link size="small">
              操作
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="() => updateRowStatus(row, 'processing')">标记制作中</el-dropdown-item>
                <el-dropdown-item @click="() => updateRowStatus(row, 'completed')">标记完成</el-dropdown-item>
                <el-dropdown-item @click="() => updateRowStatus(row, 'failed')">标记失败</el-dropdown-item>
                <el-dropdown-item divided class="text-red-500" @click="() => handleDelete(row)">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </vxe-grid>
    </div>

    <div class="pagination-container">
      <pagination
        :total="total"
        v-model:page="queryParams.currentPage"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Search, Refresh, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { commonGridOptions } from '@/common/table'
import { formatTimestamp } from '@/common/date'
import { stickerPsdSetApi } from '@/api/stickerPsdSet'

const loading = ref(false)
const dataSource = ref<any[]>([])
const total = ref(0)
const selectedIds = ref<string[]>([])

const statusOptions = [
  { label: '待制作', value: 'pending' },
  { label: '制作中', value: 'processing' },
  { label: '已完成', value: 'completed' },
  { label: '失败', value: 'failed' }
]

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  keyword: '',
  status: ''
})

const gridOptions = ref({
  ...commonGridOptions,
  rowConfig: {
    keyField: 'id'
  },
  checkboxConfig: {
    reserve: true
  },
  columns: [
    { type: 'checkbox', width: 50, fixed: 'left' as const },
    { title: '套图名称', field: 'name', minWidth: 180 },
    { title: '描述', field: 'description', minWidth: 200 },
    { title: '关键词', field: 'keywords', minWidth: 180 },
    { title: '状态', field: 'status', width: 120, slots: { default: 'statusSlot' } },
    {
      title: '创建时间',
      field: 'createTime',
      width: 160,
      formatter: ({ cellValue }) => formatTimestamp(cellValue)
    },
    {
      title: '更新时间',
      field: 'updateTime',
      width: 160,
      formatter: ({ cellValue }) => formatTimestamp(cellValue)
    },
    { title: '操作', width: 140, fixed: 'right' as const, slots: { default: 'operationSlot' } }
  ]
})

async function getList() {
  loading.value = true
  try {
    const res = await stickerPsdSetApi.page({
      ...queryParams,
      status: queryParams.status || undefined,
      keyword: queryParams.keyword?.trim() || undefined
    })
    dataSource.value = res.list || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function handleKeywordChange(val: string) {
  if (!val) {
    getList()
  }
}

function resetFilters() {
  queryParams.keyword = ''
  queryParams.status = ''
  queryParams.currentPage = 1
  getList()
}

function statusLabel(status: string) {
  const item = statusOptions.find((s) => s.value === status)
  return item ? item.label : status || '-'
}

function statusTagType(status: string) {
  switch (status) {
    case 'completed':
      return 'success'
    case 'processing':
      return 'warning'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

function onSelectionChange({ records, reserves }) {
  const current = Array.isArray(records) ? records : []
  const reserveList = Array.isArray(reserves) ? reserves : []
  selectedIds.value = [...current, ...reserveList].map((item) => item.id)
}

async function updateRowStatus(row, status: string) {
  try {
    await stickerPsdSetApi.updateStatus(row.id, { status })
    row.status = status
    ElMessage.success('状态已更新')
    getList()
  } catch (error: any) {
    ElMessage.error(error?.message || '状态更新失败')
  }
}

function handleDelete(row) {
  ElMessageBox.confirm('确定删除该套图记录吗？', '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await stickerPsdSetApi.remove(row.id)
      ElMessage.success('删除成功')
      getList()
    })
    .catch(() => {})
}

function handleBatchDelete() {
  if (!selectedIds.value.length) {
    return ElMessage.warning('请至少选择一条记录')
  }
  ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条记录吗？`, '批量删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await stickerPsdSetApi.removeBatch(selectedIds.value)
      ElMessage.success('批量删除成功')
      selectedIds.value = []
      getList()
    })
    .catch(() => {})
}

getList()
</script>

<style scoped>
.search-bar :deep(.el-form-item) {
  margin-bottom: 0;
}
.status-message {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}
.pagination-container :deep(.el-pagination) {
  font-size: 14px;
}
</style>

