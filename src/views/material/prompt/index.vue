<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="prompt-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="5">
                <el-form-item label="提示词标题">
                  <el-input
                    v-model="queryParams.search"
                    size="small"
                    placeholder="请输入提示词标题关键词"
                    clearable
                    @keyup.enter="getList"
                    @change="(val) => { if (!val) getList(); }"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" :icon="Search" :loading="loading" @click="getList">搜索</el-button>
              <el-button v-if="isAdmin" size="small" type="primary" :icon="Plus" @click="handleAdd">
                添加提示词
              </el-button>
              <el-button
                v-if="isAdmin"
                size="small"
                type="danger"
                :icon="Delete"
                :loading="deleteLoading"
                @click="handleDelete(null)"
                :disabled="!ids.length"
              >
                批量删除({{ ids.length }})
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
          v-bind="gridOptions"
          :data="dataSource"
          :loading="loading"
          @checkbox-change="checkboxChange"
          @checkbox-all="checkboxAllChange"
        >
          <template #operationDefaultSlot="{ row }">
            <div class="flex justify-start">
              <el-dropdown
                trigger="click"
                placement="bottom-end"
                @command="(command) => handleOperationCommand(command, row)"
                class="operation-dropdown"
              >
                <el-button type="primary" link size="small" class="operation-trigger-button">操作</el-button>
                <template #dropdown>
                  <el-dropdown-menu class="operation-menu-compact">
                    <el-dropdown-item v-if="isAdmin" command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item v-if="isAdmin" command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
          <template #titleSlot="{ row }">
            <div class="prompt-title">
              {{ row.title }}
            </div>
          </template>
          <template #contentSlot="{ row }">
            <div class="prompt-content">
              {{ row.content }}
            </div>
          </template>
          <template #descriptionSlot="{ row }">
            <div class="text-wrap" style="max-width: 200px; word-break: break-all">
              {{ row.description || "-" }}
            </div>
          </template>
          <template #tagsSlot="{ row }">
            <div class="tags-container">
              <el-tag
                v-for="tag in getTagsArray(row.tags)"
                :key="tag"
                size="small"
                style="margin-right: 4px; margin-bottom: 4px"
              >
                {{ tag }}
              </el-tag>
              <span v-if="!row.tags">-</span>
            </div>
          </template>
          <template #createdAtSlot="{ row }">
            <span>{{ formatDateTime(row.createdAt) }}</span>
          </template>
          <template #updatedAtSlot="{ row }">
            <span>{{ formatDateTime(row.updatedAt) }}</span>
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

  <!-- 新增/编辑对话框 -->
  <el-dialog
    :title="dialogTitle"
    v-model="dialogVisible"
    width="700px"
    @close="dialogClose"
    align-center
  >
    <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
      <el-row>
        <el-col :span="24">
          <el-form-item label="提示词标题" prop="title">
            <el-input
              v-model="form.title"
              placeholder="请输入提示词标题"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="提示词内容" prop="content">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="8"
              placeholder="请输入提示词内容"
              maxlength="5000"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="请输入描述（可选）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="标签" prop="tags">
            <el-input
              v-model="form.tags"
              placeholder="请输入标签，多个标签用逗号分隔（可选）"
              maxlength="200"
              show-word-limit
            />
            <div style="color: #999; font-size: 12px; margin-top: 4px">
              例如：AI,文本生成,内容创作
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submitForm" :loading="submitLoading">
        确定
      </el-button>
    </template>
  </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watchEffect, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Search,
  Delete,
  Plus,
  Edit,
} from "@element-plus/icons-vue";
import {
  getPromptList,
  createPrompt,
  updatePrompt,
  deletePrompt,
} from "@/api/prompt";
import { buildOperationColumn, commonGridOptions } from "@/common/table";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import Pagination from "@/components/Pagination/index.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import { useWindowSize } from "@vueuse/core";
import { useUserStore } from "@/store/modules/user";

const userStore = useUserStore();

// 判断是否为管理员
const isAdmin = computed(() => userStore.user?.isAdmin ?? false);

const { height } = useWindowSize();

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  search: "",
});

const gridOptions = ref({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: { keyField: "id" },
  checkboxConfig: { reserve: true },
  columns: [
    { type: "checkbox", width: 50, ellipsis: true, reserve: true },
    { title: "ID", field: "id", width: 80 },
    {
      title: "标题",
      field: "title",
      minWidth: 200,
      slots: { default: "titleSlot" },
    },
    {
      title: "提示词内容",
      field: "content",
      minWidth: 300,
      slots: { default: "contentSlot" },
    },
    {
      title: "描述",
      field: "description",
      minWidth: 200,
      slots: { default: "descriptionSlot" },
    },
    {
      title: "标签",
      field: "tags",
      minWidth: 150,
      slots: { default: "tagsSlot" },
    },
    {
      title: "创建时间",
      field: "createdAt",
      width: 160,
      slots: { default: "createdAtSlot" },
    },
    {
      title: "更新时间",
      field: "updatedAt",
      width: 160,
      slots: { default: "updatedAtSlot" },
    },
    buildOperationColumn("operationDefaultSlot"),
  ],
} as any);

// 监听窗口大小变化，动态调整表格高度
watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 280;
});

const dataSource = ref([]);
const loading = ref(false);
const ids = ref([]);
const total = ref(0);
const formRef = ref();
const dialogTitle = ref("");
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = ref({
  title: "",
  content: "",
  description: "",
  tags: "",
});
const submitLoading = ref(false);
const deleteLoading = ref(false);
const editId = ref<string | null>(null);

// 格式化日期时间
function formatDateTime(dateStr: string) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// 获取标签数组
function getTagsArray(tags: string) {
  if (!tags) return [];
  return tags.split(",").map((tag) => tag.trim()).filter((tag) => tag);
}

async function getList() {
  loading.value = true;
  try {
    const params = { ...queryParams };
    const res = await getPromptList(params);
    dataSource.value = res.list || [];
    total.value = res.total || 0;
    ids.value = [];
  } catch (error) {
    console.error("获取列表失败:", error);
    ElMessage.error("获取列表失败");
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  isEdit.value = false;
  dialogVisible.value = true;
  dialogTitle.value = "新增提示词";
  form.value = {
    title: "",
    content: "",
    description: "",
    tags: "",
  };
}

onMounted(getList);

function checkboxChange(e) {
  const records = Array.isArray(e.records) ? e.records : [];
  const reserves = Array.isArray(e.reserves) ? e.reserves : [];
  ids.value = [...records.map((item) => item.id), ...reserves.map((item) => item.id)];
}

function checkboxAllChange(e) {
  const records = Array.isArray(e.records) ? e.records : [];
  const reserves = Array.isArray(e.reserves) ? e.reserves : [];
  ids.value = [...records.map((item) => item.id), ...reserves.map((item) => item.id)];
}

function handleEdit(row) {
  isEdit.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "编辑提示词";
  editId.value = row.id;
  form.value = {
    title: row.title || "",
    content: row.content || "",
    description: row.description || "",
    tags: row.tags || "",
  };
}

function handleDelete(row?) {
  let delIds = null;
  if (row) {
    delIds = [row.id];
  } else if (!ids.value.length) {
    return ElMessage.warning("请选择要删除的数据");
  } else {
    delIds = [...ids.value];
  }

  ElMessageBox.confirm(`确认删除选中的 ${delIds.length} 条数据吗？`, "删除提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      try {
        deleteLoading.value = true;
        for (const id of delIds) {
          await deletePrompt(id);
        }
        ElMessage.success("删除成功");
        await getList();
      } catch (error) {
        console.error("删除失败:", error);
        ElMessage.error("删除失败");
      } finally {
        deleteLoading.value = false;
      }
    })
    .catch(() => {});
}

// 处理dropdown操作命令
function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case "edit":
      handleEdit(row);
      break;
    case "delete":
      handleDelete(row);
      break;
    default:
      console.warn("未知的操作命令:", command);
  }
}

const rules = {
  title: [
    { required: true, message: "请输入提示词标题", trigger: "blur" },
    { min: 1, max: 200, message: "标题长度在 1 到 200 个字符", trigger: "blur" },
  ],
  content: [
    { required: true, message: "请输入提示词内容", trigger: "blur" },
    { min: 1, max: 5000, message: "内容长度在 1 到 5000 个字符", trigger: "blur" },
  ],
  description: [{ max: 500, message: "描述长度不能超过 500 个字符", trigger: "blur" }],
  tags: [{ max: 200, message: "标签长度不能超过 200 个字符", trigger: "blur" }],
};

const dialogClose = () => {
  dialogVisible.value = false;
  submitLoading.value = false;
  formRef.value?.resetFields();
};

const submitForm = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    if (isEdit.value) {
      await updatePrompt(editId.value, {
        title: form.value.title,
        content: form.value.content,
        description: form.value.description,
        tags: form.value.tags,
      });
      ElMessage.success("更新成功");
    } else {
      await createPrompt({
        title: form.value.title,
        content: form.value.content,
        description: form.value.description,
        tags: form.value.tags,
      });
      ElMessage.success("新增成功");
    }

    getList();
    dialogVisible.value = false;
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error("操作失败");
  } finally {
    submitLoading.value = false;
  }
};
</script>

<style scoped>
:deep(.prompt-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.prompt-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.prompt-page .list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

:deep(.prompt-page .list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}

/* 提示词标题样式 */
.prompt-title {
  font-weight: 500;
  color: var(--el-text-color-primary);
  max-width: 200px;
  word-break: break-all;
}

/* 提示词内容样式 */
.prompt-content {
  max-width: 300px;
  word-break: break-all;
  line-height: 1.6;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

/* 标签容器 */
.tags-container {
  max-width: 200px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

@media (max-width: 600px) {
  .shrink-0 {
    width: 100%;
  }

  .shrink-0 > * {
    width: 100% !important;
    min-width: 0 !important;
    margin-bottom: 6px !important;
  }

  .el-input,
  .el-select,
  .el-button,
  .el-date-editor {
    width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box;
  }

  .prompt-content {
    max-width: 100%;
    margin: 0 4px;
  }
}

</style>
