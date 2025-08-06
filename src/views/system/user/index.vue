<template>
  <div>
    <div class="pb-4 flex flex-wrap justify-end gap-4 items-center search-bar">
      <el-form-item label="按账号搜索">
        <el-input 
          v-model="queryParams.account" 
          placeholder="请输入用户账号" 
          style="width: 160px" 
          clearable 
          @change="(val) => { if (!val) getList() }" 
        />
      </el-form-item>
      <el-form-item label="按姓名搜索">
        <el-input 
          v-model="queryParams.name" 
          placeholder="请输入用户姓名" 
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

        <template #isAdminDefaultSlot="{ row }">
          <el-tag :type="row.isAdmin ? 'warning' : 'info'">
            {{ row.isAdmin ? '管理员' : '普通用户' }}
          </el-tag>
        </template>

        <template #operationDefaultSlot="{ row }">
          <div class="flex table-operation-column">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="warning" link size="small" @click="handleResetPassword(row)">
              重置密码
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
      width="600px" 
      :center="true"
      @close="resetForm"
    >
      <el-form 
        ref="formRef" 
        :model="formData" 
        :rules="formRules" 
        label-width="100px"
      >
        <el-row :gutter="20">
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
        
        <el-row :gutter="20">
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

        <el-row :gutter="20">
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

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="正常" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户类型" prop="isAdmin">
              <el-select v-model="formData.isAdmin" placeholder="请选择用户类型" style="width: 100%">
                <el-option label="普通用户" :value="false" />
                <el-option label="管理员" :value="true" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="头像地址" prop="avatar">
          <el-input v-model="formData.avatar" placeholder="请输入头像地址" />
        </el-form-item>

        <el-form-item v-if="!formData.id" label="登录密码" prop="password">
          <el-input 
            v-model="formData.password" 
            type="password" 
            placeholder="请输入登录密码" 
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog 
      v-model="passwordDialogVisible" 
      title="重置密码" 
      width="400px" 
      :center="true"
    >
      <el-form 
        ref="passwordFormRef" 
        :model="passwordFormData" 
        :rules="passwordFormRules" 
        label-width="100px"
      >
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="passwordFormData.newPassword" 
            type="password" 
            placeholder="请输入新密码" 
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="passwordFormData.confirmPassword" 
            type="password" 
            placeholder="请再次输入新密码" 
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleResetPasswordSubmit">确定</el-button>
        </span>
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
  Edit,
  User
} from '@element-plus/icons-vue'
import { 
  getUserList, 
  createUser,
  updateUser,
  deleteUser,
  updateUserPassword
} from '@/api/user'
import Pagination from '@/components/Pagination/index.vue'

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
      title: '用户类型',
      field: 'isAdmin',
      width: 100,
      slots: {
        default: 'isAdminDefaultSlot'
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
const dialogTitle = ref('新增用户')
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
  isAdmin: false,
  avatar: '',
  password: ''
})

const formRules = {
  account: [
    { required: true, message: '请输入用户账号', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入用户姓名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' }
  ]
}

// 重置密码对话框
const passwordDialogVisible = ref(false)
const passwordFormRef = ref()
const currentUserId = ref('')
const passwordFormData = reactive({
  newPassword: '',
  confirmPassword: ''
})

const passwordFormRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordFormData.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 获取列表
async function getList() {
  loading.value = true
  try {
    let res = await getUserList({
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
  queryParams.account = ''
  queryParams.name = ''
  queryParams.search = ''
  queryParams.sortingFields = defaultSortingValue()
  getList()
}

// 新增
function handleAdd() {
  dialogTitle.value = '新增用户'
  dialogVisible.value = true
  resetForm()
}

// 编辑
function handleEdit(row) {
  dialogTitle.value = '编辑用户'
  dialogVisible.value = true
  Object.assign(formData, row)
}

// 重置密码
function handleResetPassword(row) {
  currentUserId.value = row.id
  passwordDialogVisible.value = true
  passwordFormData.newPassword = ''
  passwordFormData.confirmPassword = ''
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
          await deleteUser(id)
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
      await updateUser(formData)
      ElMessage.success('更新成功')
    } else {
      // 新增
      await createUser(formData)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    getList()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 重置密码提交
async function handleResetPasswordSubmit() {
  try {
    await passwordFormRef.value.validate()
    
    await updateUserPassword({
      id: currentUserId.value,
      newPassword: passwordFormData.newPassword
    })
    
    ElMessage.success('密码重置成功')
    passwordDialogVisible.value = false
  } catch (error) {
    ElMessage.error('密码重置失败')
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
    isAdmin: false,
    avatar: '',
    password: ''
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
