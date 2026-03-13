<template>
  <div class="list-page-layout">
    <div class="filter-section">
      <div class="search-bar">
        <div class="search-form-container">
          <div class="search-field search-field-wide">
            <label class="search-label">搜索</label>
            <el-input v-model="queryParams.search" placeholder="请输入提示词内容" clearable @keyup.enter="getList"
              @clear="getList" />
          </div>
          <div class="search-field search-field-actions">
            <label class="search-label"></label>
            <div class="search-actions">
              <el-button type="primary" :icon="Search" @click="getList">搜索</el-button>
              <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
              <el-button type="danger" :icon="Delete" :disabled="!selectedIds.length" @click="handleBatchDelete">
                批量删除{{ selectedIds.length ? `(${selectedIds.length})` : '' }}
              </el-button>
              <el-button type="primary" :icon="Plus" @click="handleAdd">创建生成</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="table-section">
      <div class="common-table">
        <vxe-grid v-bind="gridOptions" :data="dataSource" :loading="loading" @checkbox-change="checkboxChange"
          @checkbox-all="checkboxAllChange">
          <template #imageSlot="{ row }">
            <el-image v-if="row.url || row.resultUrl" :src="row.url || row.resultUrl"
              :preview-src-list="[row.url || row.resultUrl]" :preview-teleported="true" fit="cover"
              class="image-preview" />
            <div v-else-if="row.status === 'processing'" class="status-processing">
              <el-icon class="is-loading">
                <Loading />
              </el-icon>
              <span>生成中...</span>
            </div>
            <span v-else-if="row.status === 'failed'" class="text-red-400">失败</span>
            <span v-else class="text-gray-400">-</span>
          </template>

          <template #promptSlot="{ row }">
            <el-tooltip v-if="row.prompt" :content="row.prompt" placement="top" :show-after="500">
              <div class="prompt-text line-clamp-2">{{ row.prompt }}</div>
            </el-tooltip>
            <span v-else>-</span>
          </template>

          <template #statusSlot="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>

          <template #configParamsSlot="{ row }">
            <div v-if="row.configParams" class="config-params">
              <span v-if="row.configParams.size" class="param-item">
                <i class="mdi mdi-aspect-ratio mr-1"></i>{{ row.configParams.size }}
              </span>
            </div>
            <span v-else>-</span>
          </template>

          <template #operationSlot="{ row }">
            <div class="table-operation-column">
              <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </vxe-grid>
      </div>
    </div>

    <div class="pagination-section">
      <Pagination :total="total" v-model:page="queryParams.page" v-model:limit="queryParams.pageSize"
        @pagination="getList" />
    </div>

    <el-dialog v-model="dialogVisible" title="AI 文字生图" width="500px" :destroy-on-close="true" align-center>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" class="create-form">
        <el-form-item label="提示词" prop="prompt">
          <el-input v-model="form.prompt" type="textarea" :rows="6" placeholder="请输入图片描述，例如：一只坐在窗边的橘猫，阳光照射，治愈风格" />
        </el-form-item>

        <el-form-item label="尺寸" prop="size">
          <el-select v-model="form.size" class="w-full">
            <el-option label="正方形 (1024x1024)" value="1024*1024" />
            <el-option label="竖图 3:4 (768x1024)" value="768*1024" />
            <el-option label="横图 4:3 (1024x768)" value="1024*768" />
            <el-option label="横屏 16:9 (1664x928)" value="1664*928" />
            <el-option label="竖屏 9:16 (928x1664)" value="928*1664" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :icon="MagicStick" :loading="submitLoading" @click="submitForm">立即生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watchEffect } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Delete, Loading, MagicStick } from '@element-plus/icons-vue'
import { getTtiRecordPage, createTtiRecord, deleteTtiRecord, batchDeleteTtiRecord } from '@/api/ai/tti'
import { commonGridOptions } from '@/common/table'
import { useWindowSize } from '@vueuse/core'
import Pagination from '@/components/Pagination/index.vue'
import { formatTimestamp } from '@/common/date'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const total = ref(0)
const dataSource = ref<any[]>([])
const formRef = ref()
const selectedIds = ref<string[]>([])

const queryParams = reactive({
  page: 1,
  pageSize: 20,
  search: ''
})

const { height } = useWindowSize()
const gridOptions = reactive({
  ...commonGridOptions,
  maxHeight: null as any,
  checkboxConfig: {
    reserve: true
  },
  columns: [
    { type: 'checkbox', width: 45 },
    { type: 'seq', title: '#', width: 50 },
    { title: '成品图', field: 'url', width: 100, slots: { default: 'imageSlot' } },
    { title: '提示词', field: 'prompt', minWidth: 200, slots: { default: 'promptSlot' } },
    { title: '配置参数', field: 'configParams', width: 140, slots: { default: 'configParamsSlot' } },
    { title: '状态', field: 'status', width: 100, slots: { default: 'statusSlot' } },
    {
      title: '创建时间',
      field: 'createTime',
      width: 160,
      formatter: ({ cellValue }: any) => (cellValue ? formatTimestamp(cellValue) : '-')
    },
    { title: '操作', width: 80, slots: { default: 'operationSlot' }, fixed: 'right' }
  ] as any[]
})

watchEffect(() => {
  gridOptions.maxHeight = height.value - 200
})

const form = reactive({
  prompt: '',
  size: '1024*1024'
})

const rules = {
  prompt: [{ required: true, message: '提示词不能为空', trigger: 'blur' }]
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getTtiRecordPage(queryParams)
    dataSource.value = res.list || []
    total.value = res.total || 0
    selectedIds.value = []
  } catch (error) {
    console.error('加载记录失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryParams.page = 1
  queryParams.search = ''
  getList()
}

const checkboxChange = (event: any) => {
  selectedIds.value = event.records.map((row: any) => row.id)
}

const checkboxAllChange = (event: any) => {
  selectedIds.value = event.records.map((row: any) => row.id)
}

const handleAdd = () => {
  Object.assign(form, {
    prompt: '',
    size: '1024*1024'
  })
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    await createTtiRecord(form)
    ElMessage.success('提交成功')
    dialogVisible.value = false
    getList()
  } catch (error) {
    ElMessage.error('提交失败')
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteTtiRecord(row.id)
    ElMessage.success('删除成功')
    getList()
  } catch (error) { }
}

const handleBatchDelete = async () => {
  if (!selectedIds.value.length) {
    ElMessage.warning('请选择要删除的记录')
    return
  }

  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条记录吗？`, '批量删除', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    loading.value = true
    await batchDeleteTtiRecord(selectedIds.value)
    ElMessage.success('批量删除完成')
    getList()
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    success: 'success',
    failed: 'danger',
    processing: 'warning',
    pending: 'info'
  }
  return map[status] || 'info'
}

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    success: '已生成',
    failed: '失败',
    processing: '生成中',
    pending: '排队中'
  }
  return map[status] || status
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.list-page-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px 10px;
  background-color: var(--el-bg-color-page);
  gap: 8px;

  .filter-section {
    background-color: var(--el-bg-color);
    padding: 8px 12px;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    .search-bar {
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }

    .search-form-container {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .search-field {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 32px;
      width: 100%;
    }

    .search-field-wide {
      max-width: 640px;
      width: 100%;
    }

    .search-field-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      width: 100%;
    }

    .search-label {
      width: 96px;
      min-width: 64px;
      text-align: right;
      padding-right: 8px;
      line-height: 32px;
      flex-shrink: 0;
      color: var(--el-text-color-regular);
      font-size: 13px;
    }

    .search-field-actions .search-label {
      display: none;
    }

    .search-field> :not(.search-label) {
      flex: 1;
      min-width: 0;
      max-width: 100%;
    }

    .search-field .el-input,
    .search-field .el-select {
      width: 100%;
    }

    .search-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      column-gap: 6px;
      row-gap: 6px;
      align-items: center;
    }
  }

  .table-section {
    flex: 1;
    min-height: 0;
    background-color: var(--el-bg-color);
    padding: 10px 12px;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .pagination-section {
    padding: 8px 0 0 0;
    display: flex;
    justify-content: flex-end;
  }
}

.image-preview {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}

.status-processing {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  color: var(--el-color-warning);
  font-size: 11px;
  gap: 4px;

  .el-icon {
    font-size: 16px;
  }
}

.prompt-text {
  font-size: 12px;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  cursor: pointer;
}

.config-params {
  font-size: 11px;
  color: var(--el-text-color-secondary);

  .param-item {
    display: flex;
    align-items: center;
    background: var(--el-fill-color-light);
    padding: 2px 6px;
    border-radius: 4px;
    width: fit-content;
  }
}

.w-full {
  width: 100%;
}

.table-operation-column {
  display: flex;
  gap: 4px;
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}

:deep(.el-form-item__label) {
  font-size: 13px;
}

@media (max-width: 900px) {
  .list-page-layout .filter-section {
    .search-form-container {
      grid-template-columns: 1fr;
      grid-auto-flow: row;
      gap: 8px;
    }

    .search-label {
      width: auto;
      padding-right: 0;
      text-align: left;
    }

    .search-field-actions,
    .search-actions {
      justify-content: flex-start;
    }
  }
}
</style>
