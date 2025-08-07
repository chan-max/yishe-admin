<template>
  <div>
    <div class="pb-4 flex flex-wrap justify-end gap-4 items-center search-bar">
      <el-form-item label="按名称搜索">
        <el-input 
          v-model="queryParams.name" 
          placeholder="请输入公司名称" 
          style="width: 160px" 
          clearable 
          @change="(val) => { if (!val) getList() }" 
        />
      </el-form-item>
      <el-button type="primary" :icon="Search" @click="getList"> 搜索 </el-button>
      <el-button :icon="Refresh" @click="resetQuery"> 重置 </el-button>
      <el-button type="primary" :icon="Plus" @click="handleAdd"> 新增 </el-button>
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
        <template #operationDefaultSlot="{ row }">
          <div class="flex table-operation-column">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
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

    <!-- 新增/编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="500px" 
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
        <el-form-item label="公司名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入公司名称" />
        </el-form-item>
        <el-form-item label="邀请码" prop="inviteCode">
          <el-input v-model="formData.inviteCode" placeholder="系统自动生成" disabled />
        </el-form-item>
        <el-form-item label="公司描述" prop="description">
          <el-input 
            v-model="formData.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入公司描述" 
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
  Refresh,
  Plus,
  Edit
} from '@element-plus/icons-vue'
import { 
  getCompanyList, 
  createCompany,
  updateCompany,
  deleteCompany
} from '@/api/company'
import Pagination from '@/components/Pagination/index.vue'

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
  name: '',
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
    { title: '公司名称', field: 'name', minWidth: 180, className: 'font-bold' },
    { title: '邀请码', field: 'inviteCode', width: 150 },
    { title: '公司描述', field: 'description', minWidth: 200, showOverflow: true },
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
  gridOptions.value.maxHeight = height.value - 240
})

const dataSource = ref([])
const loading = ref(false)
const ids = ref([])
const total = ref(0)

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增公司')
const formRef = ref()
const formData = reactive({
  id: '',
  name: '',
  inviteCode: '',
  description: ''
})

const formRules = {
  name: [
    { required: true, message: '请输入公司名称', trigger: 'blur' }
  ]
}

// 获取列表
async function getList() {
  loading.value = true
  try {
    let res = await getCompanyList({
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
  queryParams.name = ''
  queryParams.search = ''
  queryParams.sortingFields = defaultSortingValue()
  getList()
}

// 新增
function handleAdd() {
  dialogTitle.value = '新增公司'
  dialogVisible.value = true
  resetForm()
}

// 编辑
function handleEdit(row) {
  dialogTitle.value = '编辑公司'
  dialogVisible.value = true
  Object.assign(formData, row)
}

// 删除公司
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
        for (const id of delIds) {
          await deleteCompany(id)
        }
        ElMessage.success('删除成功')
        getList()
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
    
    if (formData.id) {
      // 编辑
      await updateCompany(formData)
      ElMessage.success('更新成功')
    } else {
      // 新增
      await createCompany(formData)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    getList()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 重置表单
function resetForm() {
  Object.assign(formData, {
    id: '',
    name: '',
    inviteCode: '',
    description: ''
  })
  formRef.value?.clearValidate()
}

// 初始化
getList()
</script>

<style lang="less">
.table-operation-column {
  gap: 8px;
}
</style> 