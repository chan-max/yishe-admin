<template>
  <div class="asset3d-page">
    <div class="asset3d-toolbar">
      <div class="asset3d-toolbar__filters">
        <el-input
          v-model="queryParams.name"
          clearable
          placeholder="搜索资源名称"
          class="asset3d-search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button @click="handleSearch">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>
      <div class="asset3d-toolbar__actions">
        <el-button type="danger" :disabled="!ids.length" @click="handleDelete()">
          批量删除
        </el-button>
        <el-button type="primary" @click="handleCreate">新增3D资源</el-button>
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
          <el-dropdown
            class="operation-dropdown"
            placement="bottom-end"
            @command="(command) => handleOperationCommand(String(command), row)"
          >
            <el-button type="primary" link size="small" class="operation-trigger-button">
              操作
            </el-button>
            <template #dropdown>
              <el-dropdown-menu class="operation-menu-compact">
                <el-dropdown-item command="edit">
                  <el-icon><Edit /></el-icon>
                  <span>编辑</span>
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
        </template>

        <template #thumbnailSlot="{ row }">
          <el-image
            v-if="row.thumbnail"
            :src="row.thumbnail"
            :lazy="true"
            class="asset3d-thumb"
            fit="cover"
            :preview-src-list="[row.thumbnail]"
            :preview-teleported="true"
          />
          <div v-else class="asset3d-thumb asset3d-thumb--empty">无预览</div>
        </template>

        <template #nameSlot="{ row }">
          <div class="asset3d-name">{{ row.name || "-" }}</div>
        </template>

        <template #descriptionSlot="{ row }">
          <div class="asset3d-text">{{ row.description || "-" }}</div>
        </template>

        <template #urlSlot="{ row }">
          <el-link v-if="row.url" type="primary" :href="row.url" target="_blank">
            打开模型文件
          </el-link>
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
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { UploadFile } from "element-plus";
import { Delete, DocumentCopy, Edit, MagicStick } from "@element-plus/icons-vue";
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

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  name: "",
});

const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: "checkbox", width: 50 },
    { title: "缩略图", field: "thumbnail", width: 120, slots: { default: "thumbnailSlot" } },
    { title: "资源名称", field: "name", minWidth: 180, slots: { default: "nameSlot" } },
    { title: "模型文件", field: "url", width: 130, slots: { default: "urlSlot" } },
    {
      title: "资源描述",
      field: "description",
      minWidth: 260,
      slots: { default: "descriptionSlot" },
    },
    { title: "关键词", field: "keywords", minWidth: 180, slots: { default: "keywordsSlot" } },
    {
      title: "上传者",
      field: "uploader",
      width: 140,
      formatter: ({ row }) => row?.uploader?.account || row?.uploader?.name || row?.userId || "-",
    },
    { title: "创建时间", field: "createTime", width: 160, slots: { default: "createTimeSlot" } },
    { title: "更新时间", field: "updateTime", width: 160, slots: { default: "updateTimeSlot" } },
    buildOperationColumn("operationDefaultSlot"),
  ],
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
  handleSearch();
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
  ids.value = e.records.map((item: any) => item.id);
}

function checkboxAllChange(e: any) {
  ids.value = e.records.map((item: any) => item.id);
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

<style scoped>
.asset3d-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.asset3d-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.asset3d-toolbar__filters,
.asset3d-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.asset3d-search {
  width: 240px;
}

.asset3d-thumb {
  width: 84px;
  height: 84px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.asset3d-thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
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

@media (max-width: 700px) {
  .asset3d-toolbar,
  .asset3d-toolbar__filters,
  .asset3d-toolbar__actions,
  .asset3d-search {
    width: 100%;
  }

  .asset3d-upload-row {
    grid-template-columns: 1fr;
  }
}
</style>
