<template>
  <div>
    <div class="py-4 flex justify-between gap-4 items-center">
      <!-- 左侧操作按钮 -->
      <div class="flex gap-2">
        <el-button type="success" :icon="Download" @click="handleMultiDownload" :disabled="!ids.length">
          批量下载
        </el-button>
        <el-button type="danger" :icon="Delete" @click="handleDelete(null)" :disabled="!ids.length">
          批量删除
        </el-button>
      </div>

      <!-- 右侧搜索区域 -->
      <div class="flex gap-2 items-center">
        <form-item label="按名称搜索">
          <el-input
            v-model="queryParams.imageName"
            clearable
            placeholder="请输入草稿名称"
            style="width: 160px"
          />
        </form-item>
        <el-button type="primary" @click="handleSearch" :icon="Search">
          搜索
        </el-button>
        <el-button @click="resetQuery" :icon="Refresh">
          重置
        </el-button>
      </div>
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
        <template #previewDefaultSlot="{ row }">
          <el-image 
            :src="row.url" 
            fit="cover" 
            class="w-16 h-16 rounded cursor-pointer"
            :preview-src-list="[row.url]"
          />
        </template>

        <template #operationDefaultSlot="{ row }">
          <div class="flex table-operation-column">
            <el-button type="success" link size="small" @click="handleDownload(row)">
              下载
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
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
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, watchEffect } from 'vue'
import { commonGridOptions } from '@/common/table'
import { formatTimestamp } from '@/common/date'
import { useWindowSize } from '@vueuse/core'
import { defaultSortingValue } from '@/common/sort'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Delete,
  Download,
  Refresh
} from '@element-plus/icons-vue'
import { downloadFileByElement } from '@/common/download'
import { 
  getDraftList, 
  deleteDraft
} from '@/api/draft'

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
  imageName: '',
  search: '',
})

const gridRef = ref()

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
    {
      title: '图片预览',
      field: 'url',
      width: 'auto',
      slots: {
        default: 'previewDefaultSlot'
      }
    },
    { title: '草稿名称', field: 'name', minWidth: 180, className: 'font-bold' },
    { title: '草稿描述', field: 'description', minWidth: 200, showOverflow: true },
    { title: '文件大小', field: 'size', width: 100, showOverflow: true },
    { title: '创建人', field: 'creatorName', minWidth: 100, showOverflow: true },
    {
      title: '创建时间',
      field: 'createTime',
      width: 150,
      showOverflow: true,
      formatter: (e) => {
        return formatTimestamp(e.cellValue)
      },
    },
    {
      title: '修改时间',
      field: 'updateTime',
      width: 150,
      showOverflow: true,
      formatter: (e) => {
        return formatTimestamp(e.cellValue)
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
  gridOptions.value.maxHeight = height.value - 280
})

const dataSource = ref([])
const loading = ref(false)
const ids = ref([])
const total = ref(0)

// 获取列表
async function getList() {
  loading.value = true
  try {
    let res = await getDraftList({
      ...queryParams
    })
    dataSource.value = res.list || []
    total.value = res.total || 0
    ids.value = []
  } catch (error) {
    ElMessage.error('获取列表失败')
    dataSource.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 复选框变化
function checkboxChange(e) {
  ids.value = e.records.map((item) => item.id)
}

function checkboxAllChange(e) {
  ids.value = e.records.map((item) => item.id)
}

// 搜索
const handleSearch = () => {
  queryParams.currentPage = 1
  getList()
}

// 重置查询
const resetQuery = () => {
  queryParams.currentPage = 1
  queryParams.pageSize = 20
  queryParams.imageName = ''
  queryParams.search = ''
  queryParams.sortingFields = defaultSortingValue()
  getList()
}

// 删除草稿
function handleDelete(row?) {
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
        await deleteDraft(delIds)
        ElMessage.success('删除成功')
        getList()
      } catch (error) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

// 下载草稿
function handleDownload(row) {
  downloadFileByElement(row.url, row.name)
}

// 批量下载
function handleMultiDownload() {
  if (!ids.value.length) {
    return ElMessage.warning('请选择要下载的数据')
  }
  
  try {
    ids.value.forEach((id, index) => {
      let row = dataSource.value.find((item) => item.id === id)
      if (!row) return
      
      setTimeout(() => {
        downloadFileByElement(row.url, row.name)
      }, 500 * index)
    })
  } catch (e) {
    ElMessage.error('下载失败')
  }
}

// 初始化
getList()
</script>

<style lang="less">
.table-operation-column {
  gap: 8px;
}
</style> 