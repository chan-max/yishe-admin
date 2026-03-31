<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="user-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="5" :xl="4">
                <el-form-item label="用户账号">
                  <el-input
                    v-model="queryParams.account"
                    size="small"
                    placeholder="请输入用户账号"
                    clearable
                    @change="(val) => { if (!val) getList(); }"
                  />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="5" :xl="4">
                <el-form-item label="用户姓名">
                  <el-input
                    v-model="queryParams.name"
                    size="small"
                    placeholder="请输入用户姓名"
                    clearable
                    @change="(val) => { if (!val) getList(); }"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" :icon="Search" :loading="loading" @click="handleSearch">搜索</el-button>
              <el-button size="small" :icon="Refresh" :disabled="loading" @click="resetQuery">重置</el-button>
              <el-button size="small" type="primary" :icon="Plus" @click="handleAdd">新增</el-button>
              <el-button
                size="small"
                v-admin-only
                type="danger"
                :icon="Delete"
                @click="handleDelete(null)"
                :disabled="!ids.length"
              >
                批量删除
              </el-button>
            </div>
          </el-form>
        </div>
      </template>

      <template #table>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat">
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid
                ref="gridRef"
                v-bind="gridOptions"
                :data="dataSource"
                :loading="loading"
                @checkbox-change="checkboxChange"
                @checkbox-all="checkboxAllChange"
              >
                <template #avatarDefaultSlot="{ row }">
                  <el-avatar :src="row.avatar" :size="36" :icon="User" />
                </template>

                <template #statusDefaultSlot="{ row }">
                  <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                    {{ row.status === "active" ? "正常" : "禁用" }}
                  </el-tag>
                </template>

                <template #isAdminDefaultSlot="{ row }">
                  <el-tag :type="row.isAdmin ? 'warning' : 'info'">
                    {{ row.isAdmin ? "管理员" : "普通用户" }}
                  </el-tag>
                </template>

                <template #operationDefaultSlot="{ row }">
                  <div class="flex justify-start">
                    <el-dropdown
                      class="operation-dropdown"
                      placement="bottom-end"
                      @command="(command) => handleOperationCommand(command, row)"
                    >
                      <el-button type="primary" link size="small" class="operation-trigger-button">操作</el-button>
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item command="edit">
                            <span>编辑</span>
                          </el-dropdown-item>
                          <el-dropdown-item command="access">
                            <span>分配权限</span>
                          </el-dropdown-item>
                          <el-dropdown-item command="resetPassword" class="operation-menu-item--danger">
                            <span>重置密码</span>
                          </el-dropdown-item>
                          <template v-if="userStore.user?.isAdmin">
                            <el-dropdown-item command="delete" divided class="operation-menu-item--danger">
                              <span>删除</span>
                            </el-dropdown-item>
                          </template>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </template>
              </vxe-grid>
            </div>
          </div>
        </div>
      </template>

      <template #pagination>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel__pagination list-page-table-panel__pagination--flat">
          <pagination
            :total="total"
            v-model:page="queryParams.currentPage"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </template>
    </ListPageLayout>
  </ContentWrap>

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
      class="space-y-4"
    >
      <!-- 基础信息 -->
      <div class="list-page-dialog-section">
        <div class="list-page-dialog-section__title">基础信息</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="用户账号" prop="account">
              <el-input v-model="formData.account" placeholder="请输入用户账号" />
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
              <el-select v-model="formData.sex" placeholder="请选择性别" class="!w-full">
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
                class="!w-full"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="头像地址" prop="avatar">
          <el-input v-model="formData.avatar" placeholder="请输入头像地址" />
        </el-form-item>
      </div>

      <!-- 联系方式 -->
      <div class="list-page-dialog-section">
        <div class="list-page-dialog-section__title">联系方式</div>
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

      <!-- 权限配置 -->
      <div class="list-page-dialog-section">
        <div class="list-page-dialog-section__title">权限配置</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="用户类型" prop="isAdmin">
              <el-select v-model="formData.isAdmin" placeholder="请选择用户类型" class="!w-full">
                <el-option label="普通用户" :value="false" />
                <el-option label="管理员" :value="true" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择状态" class="!w-full">
                <el-option label="正常" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 组织信息 -->
      <div class="list-page-dialog-section">
        <div class="list-page-dialog-section__title">组织信息</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="所属公司" prop="companyId">
              <el-select
                v-model="formData.companyId"
                placeholder="请选择所属公司"
                class="!w-full"
                @change="handleCompanyChange"
              >
                <el-option
                  v-for="company in companyList"
                  :key="company.id"
                  :label="company.name"
                  :value="company.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="过期时间" prop="expireTime">
              <el-date-picker
                v-model="formData.expireTime"
                type="datetime"
                placeholder="请选择过期时间"
                class="!w-full"
                :disabled-date="(date) => date.getTime() < Date.now() - 86400000"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 登录密码 (仅新增时显示) -->
      <div v-if="!formData.id" class="list-page-dialog-section">
        <div class="list-page-dialog-section__title">安全设置</div>
        <el-form-item label="登录密码" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入登录密码"
            show-password
          />
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <div
        class="flex justify-end gap-3 border-t border-solid border-[var(--el-border-color-lighter)] pt-4"
      >
        <el-button :disabled="submitLoading" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 重置密码对话框 -->
  <el-dialog
    v-model="passwordDialogVisible"
    title="重置密码"
    width="400px"
    :center="false"
    align-center
  >
    <el-form
      ref="passwordFormRef"
      :model="passwordFormData"
      :rules="passwordFormRules"
      label-width="100px"
    >
      <div class="list-page-dialog-section">
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
      </div>
    </el-form>
    <template #footer>
      <div
        class="flex justify-end gap-3 border-t border-solid border-[var(--el-border-color-lighter)] pt-4"
      >
        <el-button :disabled="passwordSubmitLoading" @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordSubmitLoading" @click="handleResetPasswordSubmit">确定</el-button>
      </div>
    </template>
  </el-dialog>

  <UserAccessDialog
    v-model="accessDialogVisible"
    :user-id="accessTarget.id"
    :user-name="accessTarget.name"
    @success="handleAccessSaved"
  />
</template>

<script setup lang="tsx">
import { ref, reactive, watchEffect } from "vue";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { useWindowSize } from "@vueuse/core";
import { defaultSortingValue } from "@/common/sort";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Delete, Refresh, Plus, User } from "@element-plus/icons-vue";
import { getUserList, createUser, updateUser, deleteUser, updateUserPassword } from "@/api/user";
import { useUserStore } from "@/store/modules/user";
import { getCompanyList } from "@/api/company";
import Pagination from "@/components/Pagination/index.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import UserAccessDialog from "./UserAccessDialog.vue";

function getErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.msg ||
    error?.message ||
    fallback
  );
}

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
  account: "",
  name: "",
  search: "",
});

const userStore = useUserStore();

const gridRef = ref();
const companyList = ref([]); // 公司列表

// 获取公司列表
async function getCompanyListData() {
  try {
    const res = await getCompanyList({
      currentPage: 1,
      pageSize: 1000, // 获取所有公司
    });
    companyList.value = res.list || [];
  } catch (error) {
    console.error("获取公司列表失败:", error);
    companyList.value = [];
  }
}

const gridOptions = ref({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: {
    keyField: "id",
  },
  checkboxConfig: {
    reserve: true,
  },
  columns: [
    { type: "checkbox", width: 50, ellipsis: true, reserve: true },
    {
      title: "头像",
      field: "avatar",
      width: 80,
      slots: {
        default: "avatarDefaultSlot",
      },
    },
    { title: "用户账号", field: "account", minWidth: 120, className: "font-bold" },
    { title: "用户姓名", field: "name", minWidth: 120 },
    { title: "手机号码", field: "phone", width: 120 },
    { title: "邮箱地址", field: "email", minWidth: 150, showOverflow: true },
    {
      title: "性别",
      field: "sex",
      width: 80,
      formatter: (e) => {
        return e.cellValue === 1 ? "男" : e.cellValue === 0 ? "女" : "-";
      },
    },
    {
      title: "所属公司",
      field: "company.name",
      width: 150,
      showOverflow: true,
      formatter: (e) => {
        return e.cellValue || "-";
      },
    },
    {
      title: "过期时间",
      field: "expireTime",
      width: 180,
      showOverflow: true,
      formatter: (e) => {
        return e.cellValue ? formatTimestamp(e.cellValue) : "-";
      },
    },
    {
      title: "用户状态",
      field: "status",
      width: 100,
      slots: {
        default: "statusDefaultSlot",
      },
    },
    {
      title: "用户类型",
      field: "isAdmin",
      width: 100,
      slots: {
        default: "isAdminDefaultSlot",
      },
    },
    buildTimeColumn("创建时间", "createTime", 150),
    buildTimeColumn("修改时间", "updateTime", 150),
    buildOperationColumn("operationDefaultSlot"),
  ],
});

const { height } = useWindowSize();

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 240;
});

const dataSource = ref([]);
const loading = ref(false);
const ids = ref([]);
const total = ref(0);
const submitLoading = ref(false);
const deleteLoading = ref(false);

// 对话框相关
const dialogVisible = ref(false);
const dialogTitle = ref("新增用户");
const formRef = ref();
const formData = reactive<Record<string, any>>({
  id: "",
  account: "",
  name: "",
  phone: "",
  email: "",
  sex: null,
  birthday: "",
  status: "active",
  isAdmin: false,
  avatar: "",
  password: "",
  companyId: "", // 新增公司ID字段
  expireTime: "", // 过期时间
});

const formRules = {
  account: [{ required: true, message: "请输入用户账号", trigger: "blur" }],
  name: [{ required: true, message: "请输入用户姓名", trigger: "blur" }],
  password: [{ required: true, message: "请输入登录密码", trigger: "blur" }],
};

// 重置密码对话框
const passwordDialogVisible = ref(false);
const passwordFormRef = ref();
const currentUserId = ref("");
const passwordSubmitLoading = ref(false);
const accessDialogVisible = ref(false);
const accessTarget = reactive({
  id: "",
  name: "",
});
const passwordFormData = reactive({
  newPassword: "",
  confirmPassword: "",
});

const passwordFormRules = {
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于6位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        if (value !== passwordFormData.newPassword) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

// 获取列表
async function getList() {
  loading.value = true;
  try {
    let res = await getUserList({
      ...queryParams,
    });
    dataSource.value = res.list || [];
    total.value = res.total || 0;
    ids.value = [];
  } catch (error) {
    ElMessage.error("获取列表失败");
    dataSource.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

// 复选框变化
function checkboxChange(e) {
  ids.value = e.records.map((item) => item.id);
}

function checkboxAllChange(e) {
  ids.value = e.records.map((item) => item.id);
}

// 搜索
const handleSearch = () => {
  queryParams.currentPage = 1;
  getList();
};

// 重置查询
const resetQuery = () => {
  queryParams.currentPage = 1;
  queryParams.pageSize = 20;
  queryParams.account = "";
  queryParams.name = "";
  queryParams.search = "";
  queryParams.sortingFields = defaultSortingValue();
  getList();
};

// 新增
function handleAdd() {
  dialogTitle.value = "新增用户";
  dialogVisible.value = true;
  resetForm();
}

// 编辑
function handleEdit(row) {
  dialogTitle.value = "编辑用户";
  dialogVisible.value = true;
  Object.assign(formData, row);
}

// 重置密码
function handleResetPassword(row) {
  currentUserId.value = row.id;
  passwordDialogVisible.value = true;
  passwordFormData.newPassword = "";
  passwordFormData.confirmPassword = "";
}

function handleOperationCommand(command, row) {
  switch (command) {
    case "edit":
      handleEdit(row);
      break;
    case "resetPassword":
      handleResetPassword(row);
      break;
    case "access":
      handleAssignAccess(row);
      break;
    case "delete":
      handleDelete(row);
      break;
  }
}

function handleAssignAccess(row) {
  if (!userStore.user?.isAdmin) {
    ElMessage.warning("仅管理员可分配权限");
    return;
  }
  accessTarget.id = String(row.id || "");
  accessTarget.name = row.name || row.account || "";
  accessDialogVisible.value = true;
}

function handleAccessSaved() {
  getList();
}

// 删除用户
function handleDelete(row?) {
  if (deleteLoading.value) return
  const userStore = useUserStore();
  if (!userStore.user?.isAdmin) {
    return ElMessage.warning("无权限：仅管理员可执行删除操作");
  }
  let delIds: string[] = [];
  if (row) {
    delIds = [row.id];
  } else if (!ids.value.length) {
    return ElMessage.warning("请选择要删除的数据");
  } else {
    delIds = [...ids.value];
  }

  ElMessageBox.confirm(`确认删除选中的${delIds.length}条数据吗`, "删除提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "error",
  })
    .then(async () => {
      try {
        deleteLoading.value = true
        for (const id of delIds) {
          await deleteUser(id);
        }
        ElMessage.success("删除成功");
        await getList();
      } catch (error) {
        ElMessage.error("删除失败");
      } finally {
        deleteLoading.value = false
      }
    })
    .catch(() => {});
}

// 提交表单
async function handleSubmit() {
  if (submitLoading.value) return
  try {
    submitLoading.value = true
    await formRef.value.validate();

    const submitData = { ...formData };

    if (formData.id) {
      // 编辑 - 传递 id 和需要更新的字段
      const updateData = { ...submitData };
      delete updateData.createTime;
      delete updateData.updateTime;
      await updateUser(updateData);
      ElMessage.success("更新成功");
    } else {
      // 新增 - 严格清理 ID 相关字段，避免主键冲突
      delete submitData.id;
      delete submitData.createTime;
      delete submitData.updateTime;
      await createUser(submitData);
      ElMessage.success("创建成功");
    }

    dialogVisible.value = false;
    await getList();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, "操作失败"));
  } finally {
    submitLoading.value = false
  }
}

// 重置密码提交
async function handleResetPasswordSubmit() {
  if (passwordSubmitLoading.value) return
  try {
    passwordSubmitLoading.value = true
    await passwordFormRef.value.validate();

    await updateUserPassword({
      id: currentUserId.value,
      newPassword: passwordFormData.newPassword,
    });

    ElMessage.success("密码重置成功");
    passwordDialogVisible.value = false;
  } catch (error) {
    ElMessage.error("密码重置失败");
  } finally {
    passwordSubmitLoading.value = false
  }
}

// 处理公司变化，继承公司过期时间
function handleCompanyChange(companyId) {
  if (companyId && !formData.id) {
    // 只有新增用户时才自动继承
    const selectedCompany = companyList.value.find((c) => c.id === companyId);
    if (selectedCompany && selectedCompany.expireTime) {
      formData.expireTime = selectedCompany.expireTime;
    }
  }
}

// 重置表单
function resetForm() {
  Object.assign(formData, {
    id: "",
    account: "",
    name: "",
    phone: "",
    email: "",
    sex: null,
    birthday: "",
    status: "active",
    isAdmin: false,
    avatar: "",
    password: "",
    companyId: "", // 重置公司ID
    expireTime: "", // 重置过期时间
  });
  formRef.value?.clearValidate();
}

// 初始化
getList();
getCompanyListData();
</script>

<style scoped>
:deep(.user-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.user-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.user-page .list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

:deep(.user-page .list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}
</style>
