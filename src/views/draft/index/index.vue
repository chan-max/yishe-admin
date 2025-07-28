<template>
  <div>
    <div class="pb-4 flex flex-wrap justify-end gap-4 items-center search-bar">
      <!-- 这里放所有搜索/过滤表单项和按钮，结构与crawler-material.vue一致，参数不变 -->
      <!-- 示例：
      <form-item label="按名称搜索">
        <el-input v-model="queryParams.imageName" placeholder="请输入图片名称" style="width: 160px" clearable @change="(val) => { if (!val) getList() }" />
      </form-item>
      <el-button type="primary" :icon="Search" @click="getList"> 搜索 </el-button>
      ...其它表单项和按钮... 
      -->
      <el-button
        type="danger"
        :icon="Delete"
        @click="handleDelete"
        :disabled="!ids.length"
      >
        批量删除
      </el-button>
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

        <template #modelRelationSlot="{ row }">
          <div class="model-relation-detail">
            <div v-if="row.customModelId" class="model-info">
              <div class="model-name">
                <el-icon class="mr-1 text-green-500"><Link /></el-icon>
                <span class="text-green-600 font-medium">{{ row.customModel?.name || row.customModelId }}</span>
              </div>
              <div v-if="row.customModel?.description" class="model-desc text-xs text-gray-400 mt-1 max-w-32 truncate">
                {{ row.customModel.description }}
              </div>
            </div>
            <div v-else class="no-model">
              <el-tag type="info" size="small">
                <el-icon class="mr-1"><Link /></el-icon>
                未关联模型
              </el-tag>
            </div>
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
import { ref, reactive, watchEffect, computed } from 'vue'
import { commonGridOptions } from '@/common/table'
import { formatTimestamp } from '@/common/date'
import { useWindowSize } from '@vueuse/core'
import { defaultSortingValue } from '@/common/sort'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Delete,
  Download,
  Refresh,
  Link
} from '@element-plus/icons-vue'
import { downloadFileByElement } from '@/common/download'
import { 
  getDraftList, 
  deleteDraft
} from '@/api/draft'
import Pagination from '@/components/Pagination/index.vue'

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
  imageName: '',
  search: '',
  hasModel: '', // 关联状态筛选
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
      title: '关联模型',
      field: 'customModelId',
      width: 220,
      slots: {
        default: 'modelRelationSlot'
      }
    },
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
  queryParams.hasModel = ''
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

.model-relation-detail {
  .model-info {
    .model-name {
      display: flex;
      align-items: center;
      font-size: 14px;
      line-height: 1.2;
    }
    
    .model-desc {
      line-height: 1.2;
      word-break: break-all;
    }
  }
  
  .no-model {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style> 