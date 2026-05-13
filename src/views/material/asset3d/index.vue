<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="clip-material-page asset3d-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item label="按名称搜索">
                  <el-input
                    v-model="queryParams.name"
                    size="small"
                    clearable
                    placeholder="请输入名称、描述或关键词"
                    @change="
                      (val) => {
                        if (!val) getList();
                      }
                    "
                  />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="排序">
                  <el-select
                    v-model="queryParams.sortingFields"
                    size="small"
                    placeholder="请选择排序方式"
                    @change="getList"
                  >
                    <el-option label="创建时间倒序" value="createTime DESC" />
                    <el-option label="创建时间正序" value="createTime ASC" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" :icon="Search" :loading="loading" @click="getList"
                >搜索</el-button
              >
              <el-button size="small" type="primary" @click="handleCreate">上传</el-button>
              <el-button size="small" @click="handleMultiDownload">下载 ({{ ids.length }})</el-button>
              <el-button size="small" type="danger" :disabled="!ids.length" @click="handleDelete()">
                批量删除 ({{ ids.length }})
              </el-button>
              <el-button v-if="isMobile" size="small" @click="filterDialogVisible = true">筛选</el-button>
            </div>
          </el-form>
        </div>

        <el-dialog v-model="filterDialogVisible" title="筛选" width="90%" align-center>
          <el-form :model="queryParams" label-width="80px">
            <el-form-item label="按名称搜索">
              <el-input v-model="queryParams.name" placeholder="请输入名称、描述或关键词" clearable />
            </el-form-item>
            <el-form-item label="排序">
              <el-select v-model="queryParams.sortingFields" placeholder="请选择排序方式">
                <el-option label="创建时间倒序" value="createTime DESC" />
                <el-option label="创建时间正序" value="createTime ASC" />
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="filterDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="onMobileFilterSubmit">确定</el-button>
          </template>
        </el-dialog>
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
                <template #previewDefaultSlot="{ row }">
                  <div class="table-media-cell table-file-cell p-2">
                    <img
                      v-if="row.thumbnail"
                      :src="row.thumbnail"
                      :alt="row.name || '3D素材'"
                      class="table-file-cell__image"
                      @click="openPreview(row)"
                    />
                    <div v-else class="table-file-doc-card">
                      <el-icon size="24"><Box /></el-icon>
                      <div class="table-file-doc-card__title">{{ row.name || "3D素材" }}</div>
                      <div class="table-file-doc-card__tip">{{ getModelSuffix(row.url).toUpperCase() || "MODEL" }}</div>
                    </div>
                  </div>
                </template>

                <template #operationDefaultSlot="{ row }">
                  <div class="flex items-center">
                    <el-dropdown
                      class="operation-dropdown"
                      placement="bottom-end"
                      @command="(command) => handleOperationCommand(String(command), row)"
                    >
                      <el-button type="primary" link size="small" class="operation-trigger-button"
                        >操作</el-button
                      >
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item command="edit">
                            <el-icon><Edit /></el-icon>
                            <span>编辑</span>
                          </el-dropdown-item>
                          <el-dropdown-item command="download" :disabled="!row.url">
                            <el-icon><Download /></el-icon>
                            <span>下载</span>
                          </el-dropdown-item>
                          <el-dropdown-item command="copy-url" :disabled="!row.url">
                            <el-icon><DocumentCopy /></el-icon>
                            <span>复制模型地址</span>
                          </el-dropdown-item>
                          <el-dropdown-item command="ai-generate" :disabled="!row.thumbnail">
                            <el-icon><MagicStick /></el-icon>
                            <span>AI生成内容</span>
                          </el-dropdown-item>
                          <el-dropdown-item command="delete" divided class="operation-menu-item--danger">
                            <el-icon><Delete /></el-icon>
                            <span>删除</span>
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </template>

        <template #nameSlot="{ row }">
          <div class="asset3d-name">{{ row.name || "-" }}</div>
        </template>

        <template #descriptionSlot="{ row }">
          <div class="asset3d-text">{{ row.description || "-" }}</div>
        </template>

        <template #urlSlot="{ row }">
          <el-tag v-if="row.url" size="small" type="info">{{ getModelSuffix(row.url).toUpperCase() || "MODEL" }}</el-tag>
          <span v-else>-</span>
        </template>

        <template #keywordsSlot="{ row }">
          <div class="asset3d-text">{{ row.keywords || "-" }}</div>
        </template>

        <template #createTimeSlot="{ row }">
          <span>{{ formatDateTime(row.createTime) }}</span>
        </template>

        <template #updateTimeSlot="{ row }">
          <span>{{ formatDateTime(row.updateTime) }}</span>
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

    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="760px"
      @close="dialogClose"
      align-center
      :destroy-on-close="true"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="110px">
        <el-form-item label="资源名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入资源名称"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="资源描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入资源描述"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="关键词" prop="keywords">
          <el-input
            v-model="form.keywords"
            placeholder="多个关键词可用逗号分隔"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="模型文件" prop="url">
          <div class="asset3d-upload-row">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleModelFileChange"
              accept=".glb,.gltf,.obj,.fbx,.stl,.dae,.3ds,.zip"
            >
              <el-button>选择模型文件</el-button>
            </el-upload>
            <el-input v-model="form.url" placeholder="模型文件 URL，也可手动粘贴" clearable />
          </div>
          <div v-if="modelFile" class="asset3d-file-hint">待上传：{{ modelFile.name }}</div>
        </el-form-item>
        <el-form-item label="缩略图" prop="thumbnail">
          <div class="asset3d-upload-row">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleThumbnailFileChange"
              accept="image/*"
            >
              <el-button>选择缩略图</el-button>
            </el-upload>
            <el-input v-model="form.thumbnail" placeholder="缩略图 URL，也可手动粘贴" clearable />
          </div>
          <div class="asset3d-preview-line">
            <el-image
              v-if="form.thumbnail"
              :src="form.thumbnail"
              fit="cover"
              class="asset3d-preview"
            />
            <span v-if="thumbnailFile" class="asset3d-file-hint"
              >待上传：{{ thumbnailFile.name }}</span
            >
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading"> 保存 </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="aiGenDialogVisible"
      title="AI自动生成内容"
      width="500px"
      align-center
      :destroy-on-close="true"
    >
      <div class="asset3d-ai-tip">
        请输入你希望AI分析的内容风格或角度（如：偏工业设计、简洁风格、突出材质等）
      </div>
      <el-input
        v-model="aiGenPrompt"
        type="textarea"
        :rows="6"
        placeholder="如：请从结构、材质和可用场景描述这个3D资源..."
      />
      <template #footer>
        <el-button @click="aiGenDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenDialogLoading" @click="submitAiGenDialog">
          确定
        </el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, watchEffect } from "vue";
import { useWindowSize } from "@vueuse/core";
import { ElMessage, ElMessageBox } from "element-plus";
import type { UploadFile } from "element-plus";
import { Box, Delete, DocumentCopy, Download, Edit, MagicStick, Search } from "@element-plus/icons-vue";
import {
  batchDeleteAsset3d,
  createAsset3d,
  deleteAsset3d,
  getAsset3dPage,
  updateAsset3d,
} from "@/api/asset3d";
import { uploadToCOS, initCOS } from "@/api/cos";
import { useUserStore } from "@/store/modules/user";
import { buildOperationColumn, commonGridOptions } from "@/common/table";
import request from "@/config/axios";
import { isQueuedAiTaskResult, notifyQueuedAiTask, unwrapAiTaskResult } from "@/utils/aiTask";

const userStore = useUserStore();
const { height } = useWindowSize();

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  name: "",
  sortingFields: "createTime DESC",
});

const isMobile = computed(() => window.innerWidth <= 768);
const filterDialogVisible = ref(false);

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
      title: "文件预览",
      field: "thumbnail",
      width: 400,
      slots: { default: "previewDefaultSlot" },
    },
    { title: "资源名称", field: "name", minWidth: 180, className: "font-bold", slots: { default: "nameSlot" } },
    {
      title: "描述",
      field: "description",
      minWidth: 200,
      slots: { default: "descriptionSlot" },
    },
    { title: "关键词", field: "keywords", minWidth: 160, slots: { default: "keywordsSlot" } },
    { title: "后缀", field: "url", width: 80, slots: { default: "urlSlot" } },
    {
      title: "上传者",
      field: "uploader",
      width: 140,
      formatter: ({ row }) => row?.uploader?.account || row?.uploader?.name || row?.userId || "-",
    },
    { title: "ID", field: "id", width: 80 },
    { title: "创建时间", field: "createTime", width: 150, slots: { default: "createTimeSlot" } },
    { title: "更新时间", field: "updateTime", width: 150, slots: { default: "updateTimeSlot" } },
    buildOperationColumn("operationDefaultSlot"),
  ],
});

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 260;
});

const dataSource = ref<any[]>([]);
const loading = ref(false);
const ids = ref<string[]>([]);
const total = ref(0);
const formRef = ref();
const dialogTitle = ref("");
const dialogVisible = ref(false);
const submitLoading = ref(false);
const modelFile = ref<File | null>(null);
const thumbnailFile = ref<File | null>(null);

const form = ref({
  id: "",
  name: "",
  description: "",
  keywords: "",
  url: "",
  thumbnail: "",
  meta: null as any,
});

const rules = {
  name: [{ required: true, message: "请输入资源名称", trigger: "blur" }],
  url: [
    {
      validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
        if (String(value || "").trim() || modelFile.value) {
          callback();
          return;
        }
        callback(new Error("请上传或填写模型文件地址"));
      },
      trigger: "blur",
    },
  ],
  description: [{ max: 1000, message: "描述长度不能超过 1000 个字符", trigger: "blur" }],
  keywords: [{ max: 1000, message: "关键词长度不能超过 1000 个字符", trigger: "blur" }],
};

const aiGenDialogVisible = ref(false);
const aiGenPrompt = ref("");
const aiGenDialogLoading = ref(false);
let aiGenRow: any = null;

function resetForm() {
  form.value = {
    id: "",
    name: "",
    description: "",
    keywords: "",
    url: "",
    thumbnail: "",
    meta: null,
  };
  modelFile.value = null;
  thumbnailFile.value = null;
}

function getCurrentUserUploadIdentity() {
  const user = userStore.user as any;
  return {
    userId: user?.id || (userStore as any).userInfo?.id,
    account: user?.account || user?.shortName || user?.name || "anonymous",
  };
}

function handleModelFileChange(file: UploadFile) {
  const raw = file.raw;
  if (!raw) return;
  modelFile.value = raw;
  if (!form.value.name) {
    form.value.name = raw.name.replace(/\.[^.]+$/, "");
  }
}

function handleThumbnailFileChange(file: UploadFile) {
  if (file.raw) {
    thumbnailFile.value = file.raw;
  }
}

async function uploadPendingFiles() {
  await initCOS();
  const identity = getCurrentUserUploadIdentity();

  if (modelFile.value) {
    const result = await uploadToCOS({
      file: modelFile.value,
      category: "asset-3d",
      ...identity,
    });
    form.value.url = result.url;
  }

  if (thumbnailFile.value) {
    const result = await uploadToCOS({
      file: thumbnailFile.value,
      category: "asset-3d",
      isThumbnail: true,
      ...identity,
    });
    form.value.thumbnail = result.url;
  }
}

async function getList() {
  loading.value = true;
  try {
    const res = await getAsset3dPage({ ...queryParams });
    dataSource.value = res.list || [];
    total.value = res.total || 0;
    ids.value = [];
  } catch (error) {
    console.error("获取3D资源列表失败:", error);
    ElMessage.error("获取3D资源列表失败");
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  queryParams.currentPage = 1;
  getList();
}

function resetSearch() {
  queryParams.name = "";
  queryParams.sortingFields = "createTime DESC";
  handleSearch();
}

function onMobileFilterSubmit() {
  filterDialogVisible.value = false;
  getList();
}

function handleCreate() {
  resetForm();
  dialogTitle.value = "新增3D资源";
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  resetForm();
  dialogTitle.value = "编辑3D资源";
  dialogVisible.value = true;
  form.value = {
    id: row.id,
    name: row.name || "",
    description: row.description || "",
    keywords: row.keywords || "",
    url: row.url || "",
    thumbnail: row.thumbnail || "",
    meta: row.meta ?? null,
  };
}

async function submitForm() {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;
    await uploadPendingFiles();

    const payload = {
      name: form.value.name,
      description: form.value.description,
      keywords: form.value.keywords,
      url: form.value.url,
      thumbnail: form.value.thumbnail,
      meta: form.value.meta,
    };

    if (form.value.id) {
      await updateAsset3d({ id: form.value.id, ...payload });
      ElMessage.success("更新成功");
    } else {
      await createAsset3d(payload);
      ElMessage.success("创建成功");
    }

    dialogVisible.value = false;
    await getList();
  } catch (error) {
    console.error("保存3D资源失败:", error);
    const message = error instanceof Error ? error.message : "保存失败";
    ElMessage.error(message);
  } finally {
    submitLoading.value = false;
  }
}

function handleDelete(row?: any) {
  const delIds = row ? [row.id] : [...ids.value];
  if (!delIds.length) {
    ElMessage.warning("请选择要删除的数据");
    return;
  }

  ElMessageBox.confirm(
    `确认删除选中的 ${delIds.length} 条3D资源吗？对应 COS 文件也会删除。`,
    "删除提示",
    {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "warning",
    },
  )
    .then(async () => {
      try {
        if (delIds.length === 1) {
          await deleteAsset3d(delIds[0]);
        } else {
          await batchDeleteAsset3d(delIds);
        }
        ElMessage.success("删除成功");
        await getList();
      } catch (error) {
        console.error("删除失败:", error);
        ElMessage.error("删除失败");
      }
    })
    .catch(() => {});
}

function checkboxChange(e: any) {
  const records = Array.isArray(e.records) ? e.records : [];
  const reserves = Array.isArray(e.reserves) ? e.reserves : [];
  ids.value = [...records.map((item: any) => item.id), ...reserves.map((item: any) => item.id)];
}

function checkboxAllChange(e: any) {
  const records = Array.isArray(e.records) ? e.records : [];
  const reserves = Array.isArray(e.reserves) ? e.reserves : [];
  ids.value = [...records.map((item: any) => item.id), ...reserves.map((item: any) => item.id)];
}

function dialogClose() {
  submitLoading.value = false;
  formRef.value?.resetFields();
  modelFile.value = null;
  thumbnailFile.value = null;
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

async function copyText(value: string) {
  if (!value) return;
  await navigator.clipboard.writeText(value);
  ElMessage.success("已复制");
}

function getModelSuffix(url = "") {
  const cleanUrl = String(url || "").split("?")[0];
  const suffix = cleanUrl.split(".").pop() || "";
  return suffix.length <= 8 ? suffix : "";
}

function openPreview(row: any) {
  if (row.thumbnail) {
    window.open(row.thumbnail, "_blank");
  }
}

function downloadFileByElement(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handleDownload(row: any) {
  if (!row?.url) {
    ElMessage.warning("缺少下载链接");
    return;
  }
  downloadFileByElement(row.url, row.name || `asset-3d-${row.id}.${getModelSuffix(row.url) || "glb"}`);
}

function handleMultiDownload() {
  if (!ids.value.length) {
    ElMessage.warning("请选择要下载的数据");
    return;
  }
  ids.value.forEach((id, index) => {
    const row = dataSource.value.find((item) => item.id === id);
    if (!row?.url) {
      return;
    }
    setTimeout(() => handleDownload(row), 500 * index);
  });
}

function onAiTableAutoGenerate(row: any) {
  aiGenRow = row;
  aiGenPrompt.value = "";
  aiGenDialogVisible.value = true;
}

async function submitAiGenDialog() {
  if (!aiGenRow) return;
  aiGenDialogLoading.value = true;
  try {
    const res = await request.post({
      url: "/asset-3d/ai-generate-info",
      data: {
        id: aiGenRow.id,
        prompt: aiGenPrompt.value,
      },
    });

    const resultData = unwrapAiTaskResult(res);
    if (isQueuedAiTaskResult(resultData)) {
      notifyQueuedAiTask(resultData);
      aiGenDialogVisible.value = false;
      aiGenRow = null;
      return;
    }

    ElMessage.success("AI自动生成内容成功");
    await getList();
    aiGenDialogVisible.value = false;
    aiGenRow = null;
  } catch (e) {
    ElMessage.error("AI自动生成内容失败");
  } finally {
    aiGenDialogLoading.value = false;
  }
}

function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case "edit":
      handleEdit(row);
      break;
    case "copy-url":
      copyText(row.url);
      break;
    case "download":
      handleDownload(row);
      break;
    case "ai-generate":
      onAiTableAutoGenerate(row);
      break;
    case "delete":
      handleDelete(row);
      break;
  }
}

onMounted(getList);
</script>

<style lang="less" scoped>
:deep(.clip-material-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.clip-material-page .list-page-layout__body),
:deep(.clip-material-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.clip-material-page .list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

:deep(.clip-material-page .list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}

.asset3d-name,
.asset3d-text {
  white-space: normal;
  word-break: break-all;
  line-height: 1.5;
}

.asset3d-upload-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  width: 100%;
}

.asset3d-file-hint {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.asset3d-preview-line {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.asset3d-preview {
  width: 96px;
  height: 96px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.asset3d-ai-tip {
  margin-bottom: 16px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.table-file-cell {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.table-file-cell__image {
  display: block;
  width: 180px;
  max-width: 180px;
  max-height: 120px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-light);
  object-fit: contain;
  cursor: pointer;
}

.table-file-doc-card {
  width: 180px;
  min-height: 120px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-blank);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  align-items: center;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.table-file-doc-card__title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.table-file-doc-card__tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 700px) {
  .asset3d-upload-row {
    grid-template-columns: 1fr;
  }
}

</style>
