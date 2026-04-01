<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="sentence-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="8" :lg="6" :xl="5">
                <el-form-item label="句子内容">
                  <el-input
                    v-model="queryParams.search"
                    size="small"
                    placeholder="请输入句子内容关键词"
                    clearable
                    @change="(val) => { if (!val) getList(); }"
                  />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="4" :xl="3">
                <el-form-item label="发布状态">
                  <el-select
                    v-model="queryParams.isPublish"
                    size="small"
                    placeholder="请选择状态"
                    clearable
                    @change="getList"
                  >
                    <el-option label="全部" :value="null" />
                    <el-option label="已发布" :value="true" />
                    <el-option label="未发布" :value="false" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" :icon="Search" :loading="loading" @click="getList">搜索</el-button>
              <el-button v-if="isAdmin" size="small" type="primary" :icon="Plus" @click="handleAdd">
                添加句子
              </el-button>
              <el-button v-if="isAdmin" size="small" type="warning" :loading="batchActionLoading" @click="handleBatchPublish" :disabled="!ids.length">
                批量发布({{ ids.length }})
              </el-button>
              <el-button v-if="isAdmin" size="small" type="info" :loading="batchActionLoading" @click="handleBatchUnpublish" :disabled="!ids.length">
                批量下架({{ ids.length }})
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
        v-bind="gridOptions"
        :data="dataSource"
        :loading="loading"
        @checkbox-change="checkboxChange"
        @checkbox-all="checkboxAllChange"
      >
        <template #operationDefaultSlot="{ row }">
          <div class="flex items-center">
            <el-dropdown
              trigger="click"
              @command="(command) => handleOperationCommand(command, row)"
              class="operation-dropdown"
            >
              <el-button type="primary" link size="small" class="operation-trigger-button">操作</el-button>
              <template #dropdown>
                <el-dropdown-menu class="operation-menu-compact">
                  <el-dropdown-item v-if="isAdmin" command="edit">
                    <el-icon><Edit /></el-icon>
                    <span>编辑</span>
                  </el-dropdown-item>
                  <el-dropdown-item v-if="isAdmin" command="ai-analyze" :disabled="aiTableLoading?.[row?.id]">
                    <el-icon><MagicStick /></el-icon>
                    <span>AI分析</span>
                    <el-icon v-if="aiTableLoading?.[row?.id]" class="is-loading ml-1"><Loading /></el-icon>
                  </el-dropdown-item>
                  <template v-if="isAdmin && !row.isPublish">
                    <el-dropdown-item command="publish">
                      <el-icon><Upload /></el-icon>
                      <span>发布</span>
                    </el-dropdown-item>
                  </template>
                  <template v-if="isAdmin && row.isPublish">
                    <el-dropdown-item command="unpublish">
                      <el-icon><Download /></el-icon>
                      <span>下架</span>
                    </el-dropdown-item>
                  </template>
                  <el-dropdown-item v-if="isAdmin" command="delete" divided class="operation-menu-item--danger">
                    <el-icon><Delete /></el-icon>
                    <span>删除</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-icon
              v-if="aiTableLoading?.[row?.id]"
              class="is-loading ml-2"
              style="color: #409eff; font-size: 18px"
            />
          </div>
        </template>
        <template #contentSlot="{ row }">
          <div class="sentence-content">
            {{ row.content }}
          </div>
        </template>
        <template #descriptionSlot="{ row }">
          <div class="text-wrap" style="max-width: 200px; word-break: break-all">
            {{ row.description || "-" }}
          </div>
        </template>
        <template #keywordsSlot="{ row }">
          <div class="text-wrap" style="max-width: 200px; word-break: break-all">
            {{ row.keywords || "-" }}
          </div>
        </template>
        <template #isPublishSlot="{ row }">
          <el-tag :type="row.isPublish ? 'success' : 'info'" size="small">
            {{ row.isPublish ? "已发布" : "未发布" }}
          </el-tag>
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

    <!-- AI分析句子弹窗 -->
    <el-dialog
      v-model="aiAnalyzeDialogVisible"
      title="AI分析句子"
      width="500px"
      align-center
      :destroy-on-close="true"
    >
      <div style="margin-bottom: 16px; color: #888; font-size: 15px">
        请输入你希望AI分析的角度或要求（可选，留空则使用默认分析标准）
      </div>
      <el-input
        v-model="aiAnalyzePrompt"
        type="textarea"
        :rows="4"
        placeholder="如：请重点关注句子的情感色彩和主题..."
        style="font-size: 16px; min-height: 100px; width: 100%; resize: vertical"
      />
      <template #footer>
        <el-button @click="aiAnalyzeDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="aiAnalyzeLoading"
          @click="submitAiAnalyzeDialog"
          >确定</el-button
        >
      </template>
    </el-dialog>

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
            <el-form-item label="句子内容" prop="content">
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="4"
                placeholder="请输入句子内容"
                maxlength="1000"
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
            <el-form-item label="关键词" prop="keywords">
              <el-input
                v-model="form.keywords"
                type="textarea"
                :rows="2"
                placeholder="请输入关键词，多个关键词用逗号分隔（可选）"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="发布状态">
              <el-select
                v-model="form.isPublish"
                placeholder="请选择发布状态"
                style="width: 100%"
              >
                <el-option label="未发布" :value="false" />
                <el-option label="已发布" :value="true" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading"
          >确定</el-button
        >
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watchEffect } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Search,
  Delete,
  Plus,
  MagicStick,
  Edit,
  Upload,
  Download,
  Loading,
} from "@element-plus/icons-vue";
import {
  getSentenceList,
  createSentence,
  updateSentence,
  deleteSentence,
  aiAnalyzeSentence,
} from "@/api/sentence";
import { buildOperationColumn, commonGridOptions } from "@/common/table";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import Pagination from "@/components/Pagination/index.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import { useWindowSize } from "@vueuse/core";
import { useUserStore } from "@/store/modules/user";
import { computed } from "vue";

const userStore = useUserStore();

// 判断是否为管理员
const isAdmin = computed(() => userStore.user?.isAdmin ?? false);

const { height } = useWindowSize();

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  search: "",
  isPublish: null,
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
      title: "句子内容",
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
      title: "关键词",
      field: "keywords",
      minWidth: 150,
      slots: { default: "keywordsSlot" },
    },
    {
      title: "发布状态",
      field: "isPublish",
      width: 100,
      slots: { default: "isPublishSlot" },
    },
    {
      title: "上传者",
      field: "uploader",
      width: 140,
      formatter: ({ row }) => row?.uploader?.account || row?.uploader?.name || row?.userId || "-",
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
  // 计算表格最大高度：窗口高度 - 头部区域(p-4上下32px + py-4上下32px + 内容高度约80px) - 分页区域(约80px) - 其他边距(约40px)
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
  content: "",
  description: "",
  keywords: "",
  isPublish: false,
});
const submitLoading = ref(false);
const deleteLoading = ref(false);
const batchActionLoading = ref(false);
const editId = ref<string | null>(null);

// AI分析相关
const aiAnalyzeDialogVisible = ref(false);
const aiAnalyzePrompt = ref("");
const aiAnalyzeLoading = ref(false);
const aiTableLoading = ref<Record<string, boolean>>({});
let aiAnalyzeRow = null;

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

async function getList() {
  loading.value = true;
  try {
    const params = { ...queryParams };
    const res = await getSentenceList(params);
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
  dialogTitle.value = "新增句子";
  form.value = {
    content: "",
    description: "",
    keywords: "",
    isPublish: false,
  };
}

onMounted(getList);

function checkboxChange(e) {
  const records = Array.isArray(e.records) ? e.records : [];
  const reserves = Array.isArray(e.reserves) ? e.reserves : [];
  ids.value = [...records.map((item) => item.id), ...reserves.map((item) => item.id)];
  console.log("checkboxChange - ids:", ids.value); // 添加调试信息
}

function checkboxAllChange(e) {
  const records = Array.isArray(e.records) ? e.records : [];
  const reserves = Array.isArray(e.reserves) ? e.reserves : [];
  ids.value = [...records.map((item) => item.id), ...reserves.map((item) => item.id)];
  console.log("checkboxAllChange - ids:", ids.value); // 添加调试信息
}

function handleEdit(row) {
  isEdit.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "编辑句子";
  editId.value = row.id;
  form.value = {
    content: row.content,
    description: row.description || "",
    keywords: row.keywords || "",
    isPublish: row.isPublish || false,
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
          await deleteSentence(id);
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

// AI分析句子
function handleAiAnalyze(row) {
  if (aiTableLoading.value[row.id]) return;
  aiAnalyzeRow = row;
  aiAnalyzePrompt.value = "";
  aiAnalyzeDialogVisible.value = true;
}

async function submitAiAnalyzeDialog() {
  if (!aiAnalyzeRow) return;
  aiAnalyzeLoading.value = true;
  aiTableLoading.value = { ...aiTableLoading.value, [aiAnalyzeRow.id]: true };
  try {
    await handleAiAnalyzeSentence(
      aiAnalyzeRow,
      () => {
        aiTableLoading.value = { ...aiTableLoading.value, [aiAnalyzeRow.id]: false };
        aiAnalyzeLoading.value = false;
        aiAnalyzeDialogVisible.value = false;
        aiAnalyzeRow = null;
      },
      aiAnalyzePrompt.value
    );
  } catch (e) {
    aiTableLoading.value = { ...aiTableLoading.value, [aiAnalyzeRow.id]: false };
    aiAnalyzeLoading.value = false;
    aiAnalyzeDialogVisible.value = false;
    aiAnalyzeRow = null;
  }
}

async function handleAiAnalyzeSentence(row, cb, prompt) {
  try {
    const res = await aiAnalyzeSentence(row.id, prompt || "");
    // 更新行数据
    if (res) {
      row.description = res.description;
      row.keywords = res.keywords;
    }
    ElMessage.success("AI分析完成");
    if (typeof cb === "function") cb();
    getList();
  } catch (e) {
    ElMessage.error(`AI分析失败：${e.message || "未知错误"}`);
    if (typeof cb === "function") cb();
  }
}

// 发布句子
async function handlePublish(row) {
  try {
    await updateSentence(row.id, {
      isPublish: true,
    });
    row.isPublish = true;
    ElMessage.success("发布成功");
    getList();
  } catch (e) {
    ElMessage.error("发布失败");
  }
}

// 下架句子
async function handleUnpublish(row) {
  try {
    await updateSentence(row.id, {
      isPublish: false,
    });
    row.isPublish = false;
    ElMessage.success("下架成功");
    getList();
  } catch (e) {
    ElMessage.error("下架失败");
  }
}

// 批量发布
async function handleBatchPublish() {
  if (!ids.value.length) {
    return ElMessage.warning("请选择要发布的句子");
  }

  try {
    batchActionLoading.value = true;
    const promises = ids.value.map((id) => updateSentence(id, { isPublish: true }));
    await Promise.all(promises);
    ElMessage.success(`成功发布 ${ids.value.length} 个句子`);
    ids.value = [];
    await getList();
  } catch (e) {
    ElMessage.error("批量发布失败");
  } finally {
    batchActionLoading.value = false;
  }
}

// 批量下架
async function handleBatchUnpublish() {
  if (!ids.value.length) {
    return ElMessage.warning("请选择要下架的句子");
  }

  try {
    batchActionLoading.value = true;
    const promises = ids.value.map((id) => updateSentence(id, { isPublish: false }));
    await Promise.all(promises);
    ElMessage.success(`成功下架 ${ids.value.length} 个句子`);
    ids.value = [];
    await getList();
  } catch (e) {
    ElMessage.error("批量下架失败");
  } finally {
    batchActionLoading.value = false;
  }
}

// 处理dropdown操作命令
function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case "edit":
      handleEdit(row);
      break;
    case "ai-analyze":
      handleAiAnalyze(row);
      break;
    case "publish":
      handlePublish(row);
      break;
    case "unpublish":
      handleUnpublish(row);
      break;
    case "delete":
      handleDelete(row);
      break;
    default:
      console.warn("未知的操作命令:", command);
  }
}

const rules = {
  content: [
    { required: true, message: "请输入句子内容", trigger: "blur" },
    { min: 1, max: 1000, message: "句子内容长度在 1 到 1000 个字符", trigger: "blur" },
  ],
  description: [{ max: 500, message: "描述长度不能超过 500 个字符", trigger: "blur" }],
  keywords: [{ max: 200, message: "关键词长度不能超过 200 个字符", trigger: "blur" }],
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
      await updateSentence(editId.value, {
        content: form.value.content,
        description: form.value.description,
        keywords: form.value.keywords,
        isPublish: form.value.isPublish,
      });
      ElMessage.success("更新成功");
    } else {
      await createSentence({
        content: form.value.content,
        description: form.value.description,
        keywords: form.value.keywords,
        isPublish: form.value.isPublish,
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
:deep(.sentence-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.sentence-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.sentence-page .list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

:deep(.sentence-page .list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}

/* 句子内容样式优化 */
.sentence-content {
  max-width: 300px;
  word-break: break-all;
  line-height: 1.6;
  font-size: 16px;
  font-weight: 500;
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

  .sentence-content {
    max-width: 100%;
    margin: 0 4px;
  }
}

/* 操作列样式优化 */
</style>
