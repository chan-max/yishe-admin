<template>
  <ListPageLayout>
    <template #filter>
      <div class="search-bar">
        <form-item label="按账号搜索">
          <el-input 
            v-model="queryParams.account" 
            placeholder="请输入用户账号" 
            class="w-40" 
            clearable 
            @change="(val) => { if (!val) getList() }" 
          />
        </form-item>
        <form-item label="按姓名搜索">
          <el-input 
            v-model="queryParams.name" 
            placeholder="请输入用户姓名" 
            class="w-40" 
            clearable 
            @change="(val) => { if (!val) getList() }" 
          />
        </form-item>
        <el-button type="primary" :icon="Search" @click="getList"> 搜索 </el-button>
        <el-button :icon="Refresh" @click="resetQuery"> 重置 </el-button>
        <el-button type="primary" :icon="Plus" @click="handleAdd"> 新增 </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          @click="handleDelete(null)"
          :disabled="!ids.length"
        >
          批量删除
        </el-button>
      </div>
    </template>

    <template #table>
      <div class="common-table">
        <vxe-grid
          v-bind="gridOptions"
          :data="dataSource"
          :loading="loading"
          @checkbox-change="checkboxChange"
          @checkbox-all="checkboxAllChange"
          ref="gridRef"
        >
          <template #avatarDefaultSlot="{ row }">
            <el-avatar 
              :src="row.avatar" 
              :size="40"
              :icon="User"
            />
          </template>

          <template #statusDefaultSlot="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>

          <template #operationDefaultSlot="{ row }">
            <div class="table-operation-column">
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
    </template>

    <template #pagination>
      <pagination
        :total="total"
        v-model:page="queryParams.currentPage"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </template>
  </ListPageLayout>

    <!-- 新增/编辑对话框 -->
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
        <!-- 基础信息 -->
        <div class="form-section">
          <div class="form-section-title">基础信息</div>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="用户账号" prop="account">
                <el-input v-model="formData.account" placeholder="请输入用户账号" :disabled="!!formData.id" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="用户姓名" prop="name">
                <el-input v-model="formData.name" placeholder="请输入用户姓名" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="性别" prop="sex">
                <el-select v-model="formData.sex" placeholder="请选择性别" style="width: 100%">
                  <el-option label="男" :value="1" />
                  <el-option label="女" :value="0" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="出生日期" prop="birthday">
                <el-date-picker 
                  v-model="formData.birthday" 
                  type="date" 
                  placeholder="请选择出生日期"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="头像地址" prop="avatar">
            <el-input v-model="formData.avatar" placeholder="请输入头像地址" />
          </el-form-item>
        </div>

        <!-- 联系方式 -->
        <div class="form-section">
          <div class="form-section-title">联系方式</div>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="手机号码" prop="phone">
                <el-input v-model="formData.phone" placeholder="请输入手机号码" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="邮箱地址" prop="email">
                <el-input v-model="formData.email" placeholder="请输入邮箱地址" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 状态配置 -->
        <div class="form-section">
          <div class="form-section-title">状态配置</div>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="用户状态" prop="status">
                <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                  <el-option label="正常" value="active" />
                  <el-option label="禁用" value="inactive" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 登录密码 (仅新增时显示) -->
        <div v-if="!formData.id" class="form-section">
          <div class="form-section-title">安全设置</div>
          <el-form-item label="登录密码" prop="password">
            <el-input 
              v-model="formData.password" 
              type="password" 
              placeholder="请输入登录密码（至少6位）" 
              show-password
            />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>
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
  Refresh,
  Plus,
  User
} from '@element-plus/icons-vue'
import { 
  getPublicUserList, 
  createPublicUser,
  updatePublicUser,
  deletePublicUser
} from '@/api/public-user'
import Pagination from '@/components/Pagination/index.vue'
import ListPageLayout from '@/components/ListPageLayout/index.vue'

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
  account: '',
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
    {
      title: '头像',
      field: 'avatar',
      width: 80,
      slots: {
        default: 'avatarDefaultSlot'
      }
    },
    { title: '用户账号', field: 'account', minWidth: 120, className: 'font-bold' },
    { title: '用户姓名', field: 'name', minWidth: 120 },
    { title: '手机号码', field: 'phone', width: 120 },
    { title: '邮箱地址', field: 'email', minWidth: 150, showOverflow: true },
    {
      title: '性别',
      field: 'sex',
      width: 80,
      formatter: (e) => {
        return e.cellValue === 1 ? '男' : e.cellValue === 0 ? '女' : '-'
      }
    },
    {
      title: '用户状态',
      field: 'status',
      width: 100,
      slots: {
        default: 'statusDefaultSlot'
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
  gridOptions.value.maxHeight = height.value - 240
})

const dataSource = ref([])
const loading = ref(false)
const ids = ref([])
const total = ref(0)

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增开放用户')
const formRef = ref()
const formData = reactive({
  id: '',
  account: '',
  name: '',
  phone: '',
  email: '',
  sex: null,
  birthday: '',
  status: 'active',
  avatar: '',
  password: '',
})

const formRules = {
  account: [
    { required: true, message: '请输入用户账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 获取列表
async function getList() {
  loading.value = true
  try {
    let res = await getPublicUserList({
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

// 重置查询
const resetQuery = () => {
  queryParams.currentPage = 1
  queryParams.pageSize = 20
  queryParams.account = ''
  queryParams.name = ''
  queryParams.search = ''
  queryParams.sortingFields = defaultSortingValue()
  getList()
}

// 新增
function handleAdd() {
  dialogTitle.value = '新增开放用户'
  dialogVisible.value = true
  resetForm()
}

// 编辑
function handleEdit(row) {
  dialogTitle.value = '编辑开放用户'
  dialogVisible.value = true
  Object.assign(formData, row)
}

// 删除用户
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
          await deletePublicUser(id)
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
    
    const submitData = { ...formData }
    
    if (formData.id) {
      // 编辑 - 传递 id 和需要更新的字段
      const updateData = { ...submitData }
      delete updateData.createTime
      delete updateData.updateTime
      delete updateData.password // 编辑时不更新密码
      await updatePublicUser(updateData)
      ElMessage.success('更新成功')
    } else {
      // 新增 - 严格清理 ID 相关字段，避免主键冲突
      delete submitData.id
      delete submitData.createTime
      delete submitData.updateTime
      await createPublicUser(submitData)
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
    account: '',
    name: '',
    phone: '',
    email: '',
    sex: null,
    birthday: '',
    status: 'active',
    avatar: '',
    password: '',
  })
  formRef.value?.clearValidate()
}

// 初始化
getList()
</script>

<style scoped>
:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>

