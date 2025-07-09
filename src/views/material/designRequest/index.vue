<template>
  <div>
    <div class="py-4 flex justify-between gap-4 items-center">
      <div style="flex: 1"></div>
      <div class="shrink-0">
        <el-button type="primary" :icon="Plus" @click="handleAdd"> 新增 </el-button>
        <el-button type="danger" :icon="Delete" @click="handleDelete(null)">
          批量删除
        </el-button>
      </div>
    </div>
    <div class="common-table">
      <vxe-grid
        v-bind="gridOptions"
        :data="dataSource"
        :loading="loading"
        @checkbox-change="checkboxChange"
        @checkbox-all="checkboxAllChange"
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
        <template #nameSlot="{ row }">
          <div class="text-wrap" style="max-width: 200px; word-break: break-all;">
            {{ row.name }}
          </div>
        </template>
        <template #descriptionSlot="{ row }">
          <div class="text-wrap" style="max-width: 300px; word-break: break-all;">
            {{ row.description || '-' }}
          </div>
        </template>
        <template #userSlot="{ row }">
          <span>{{ row.user?.name || '-' }}</span>
        </template>
        <template #phoneNumberSlot="{ row }">
          <span>{{ row.phoneNumber || '-' }}</span>
        </template>
        <template #emailSlot="{ row }">
          <span>{{ row.email || '-' }}</span>
        </template>
        <template #createTimeSlot="{ row }">
          <span>{{ formatDateTime(row.createTime) }}</span>
        </template>
        <template #updateTimeSlot="{ row }">
          <span>{{ formatDateTime(row.updateTime) }}</span>
        </template>
      </vxe-grid>
    </div>
    <div class="py-4 flex justify-end">
      <pagination
        :total="total"
        v-model:page="queryParams.currentPage"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
      @close="dialogClose"
      align-center
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="请求名称" prop="name">
              <el-input 
                v-model="form.name" 
                placeholder="请输入设计请求名称" 
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="详细描述" prop="description">
              <el-input 
                v-model="form.description" 
                type="textarea" 
                :rows="4"
                placeholder="请输入详细描述（可选）" 
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phoneNumber">
              <el-input 
                v-model="form.phoneNumber" 
                placeholder="请输入联系电话（可选）" 
                maxlength="20"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系邮箱" prop="email">
              <el-input 
                v-model="form.email" 
                placeholder="请输入联系邮箱（可选）" 
                maxlength="100"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'
import { getDesignRequestList, createDesignRequest, updateDesignRequest, deleteDesignRequest } from '@/api/designRequest'
import { commonGridOptions } from '@/common/table'

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20
})

const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: 'checkbox', width: 50 },
    { title: 'ID', field: 'id', width: 80 },
    { title: '请求名称', field: 'name', minWidth: 200, slots: { default: 'nameSlot' } },
    { title: '详细描述', field: 'description', minWidth: 300, slots: { default: 'descriptionSlot' } },
    { title: '请求用户', field: 'user', width: 120, slots: { default: 'userSlot' } },
    { title: '联系电话', field: 'phoneNumber', width: 120, slots: { default: 'phoneNumberSlot' } },
    { title: '联系邮箱', field: 'email', width: 150, slots: { default: 'emailSlot' } },
    { title: '创建时间', field: 'createTime', width: 160, slots: { default: 'createTimeSlot' } },
    { title: '更新时间', field: 'updateTime', width: 160, slots: { default: 'updateTimeSlot' } },
    { title: '操作', fixed: 'right', width: 120, slots: { default: 'operationDefaultSlot' } }
  ]
})

const dataSource = ref([])
const loading = ref(false)
const ids = ref([])
const total = ref(0)
const formRef = ref()
const dialogTitle = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref<{
  id?: string
  name: string
  description: string
  phoneNumber: string
  email: string
}>({
  name: '',
  description: '',
  phoneNumber: '',
  email: ''
})
const submitLoading = ref(false)

// 格式化日期时间
function formatDateTime(dateStr: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

async function getList() {
  loading.value = true
  try {
    const params = { 
      page: queryParams.currentPage,
      pageSize: queryParams.pageSize
    }
    const res = await getDesignRequestList(params)
    dataSource.value = res.list || []
    total.value = res.total || 0
    ids.value = []
  } catch (error) {
    console.error('获取列表失败:', error)
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  queryParams.currentPage = 1
  getList()
}

function handleAdd() {
  isEdit.value = false
  dialogVisible.value = true
  dialogTitle.value = '新增设计请求'
  form.value = {
    name: '',
    description: '',
    phoneNumber: '',
    email: ''
  }
}

onMounted(getList)

function checkboxChange(e) {
  ids.value = e.records.map((item) => item.id)
}

function checkboxAllChange(e) {
  ids.value = e.records.map((item) => item.id)
}

function handleEdit(row) {
  isEdit.value = true
  dialogVisible.value = true
  dialogTitle.value = '编辑设计请求'
  form.value = { 
    id: row.id,
    name: row.name,
    description: row.description || '',
    phoneNumber: row.phoneNumber || '',
    email: row.email || ''
  }
}

function handleDelete(row?) {
  let delIds = null
  if (row) {
    delIds = [row.id]
  } else if (!ids.value.length) {
    return ElMessage.warning('请选择要删除的数据')
  } else {
    delIds = [...ids.value]
  }
  
  ElMessageBox.confirm(
    `确认删除选中的 ${delIds.length} 条数据吗？`, 
    '删除提示', 
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        for (const id of delIds) {
          await deleteDesignRequest(id)
        }
        ElMessage.success('删除成功')
        getList()
      } catch (error) {
        console.error('删除失败:', error)
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

const rules = {
  name: [
    { required: true, message: '请输入设计请求名称', trigger: 'blur' },
    { min: 1, max: 100, message: '请求名称长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 1000, message: '描述长度不能超过 1000 个字符', trigger: 'blur' }
  ],
  phoneNumber: [
    { max: 20, message: '联系电话长度不能超过 20 个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
    { max: 100, message: '邮箱长度不能超过 100 个字符', trigger: 'blur' }
  ]
}

const dialogClose = () => {
  dialogVisible.value = false
  submitLoading.value = false
  formRef.value?.resetFields()
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (isEdit.value) {
      await updateDesignRequest(form.value.id, {
        name: form.value.name,
        description: form.value.description,
        phoneNumber: form.value.phoneNumber,
        email: form.value.email
      })
      ElMessage.success('更新成功')
    } else {
      await createDesignRequest({
        name: form.value.name,
        description: form.value.description,
        phoneNumber: form.value.phoneNumber,
        email: form.value.email
      })
      ElMessage.success('新增成功')
    }
    
    getList()
    dialogVisible.value = false
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
.text-wrap {
  white-space: normal;
  line-height: 1.5;
}
</style> 