<script setup lang="ts">
import { ref, reactive, onMounted, computed, watchEffect, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useUserStore } from "@/store/modules/user";
import {
  getPublishConfigListApi,
  createPublishConfigApi,
  updatePublishConfigApi,
  deletePublishConfigApi,
} from "@/api/product/publishConfig";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import { formatTime } from "@/utils";
import { buildOperationColumn, commonGridOptions } from "@/common/table";
import { useDebounceFn, useWindowSize } from "@vueuse/core";
import {
  getAllTaskTypes,
  getTaskTypeConfig,
  getTaskTypeDefaultData,
  resolveTaskTypePlatform,
  type TaskTypeConfig,
} from "./task-types";
import {
  validateTaskTypeConfig,
  formatTaskTypeConfigForSubmit,
  formatTaskTypeConfigForEdit,
  executeTaskTypeBeforeSubmit,
} from "./task-types";
import { getVendorList, type Vendor } from "@/api/vendor";
import { derivePublishTaskTypeByPlatform, getTaskTypeLabel } from "@/config/task-types";
import { psdTemplateApi } from "@/api/psdTemplate";

const userStore = useUserStore();
const loading = ref(false);
const deleteLoading = ref(false);
const tableData = ref([]);
const total = ref(0);
const selectedIds = ref<(string | number)[]>([]);

const queryParams = reactive({
  page: 1,
  pageSize: 20,
});

const { height } = useWindowSize();
const gridMaxHeight = ref<number>(0);

watchEffect(() => {
  gridMaxHeight.value = height.value - 220;
});

const gridOptions = computed(() => ({
  ...commonGridOptions,
  maxHeight: gridMaxHeight.value,
  columns: [
    { type: "checkbox", width: 50, fixed: "left" as const },
    { field: "name", title: "配置名称", minWidth: 150 },
    {
      field: "taskType",
      title: "任务类型",
      minWidth: 180,
      formatter: ({ row }) =>
        getTaskTypeLabel(
          row?.taskType || derivePublishTaskTypeByPlatform(row?.platform),
          row?.platform,
        ),
    },
    { field: "description", title: "描述", minWidth: 200, showOverflow: true },
    {
      field: "uploader",
      title: "创建者",
      minWidth: 120,
      formatter: ({ row }) =>
        row?.uploader?.account || row?.uploader?.name || row?.creator || row?.userId || "-",
    },
    {
      field: "createTime",
      title: "创建时间",
      width: 160,
      formatter: ({ cellValue }) => formatTime(cellValue, "yyyy-MM-dd HH:mm"),
    },
    buildOperationColumn("action"),
  ],
}));

const getList = async () => {
  loading.value = true;
  try {
    const res = await getPublishConfigListApi();
    if (Array.isArray(res)) {
      tableData.value = res;
      total.value = res.length;
    } else if (res && res.list) {
      tableData.value = res.list;
      total.value = res.total;
    } else {
      tableData.value = res as any;
      total.value = (res as any).length;
    }

    selectedIds.value = [];
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const loadVendorOptions = async () => {
  try {
    const res = await getVendorList();
    const list = Array.isArray(res)
      ? res
      : Array.isArray((res as any)?.list)
        ? (res as any).list
        : [];
    vendorOptions.value = list
      .map((item: Vendor) => ({
        label: `${item.name}${item.code ? ` (${item.code})` : ""}`,
        value: Number(item.id),
      }))
      .filter((item) => Number.isFinite(item.value));
  } catch (err) {
    console.error(err);
    vendorOptions.value = [];
  }
};

const handleSearch = () => {
  queryParams.page = 1;
  getList();
};

const handleSelectionChange = (e: any) => {
  selectedIds.value = (e?.records || []).map((item: any) => item.id);
};

const handleBatchDelete = () => {
  if (!userStore.user?.isAdmin) {
    return ElMessage.warning("无权限：仅管理员可执行删除操作");
  }
  if (!selectedIds.value.length) {
    ElMessage.warning("请先选择要删除的任务配置");
    return;
  }

  ElMessageBox.confirm(`确认删除选中的 ${selectedIds.value.length} 个任务配置吗？`, "批量删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(async () => {
    try {
      deleteLoading.value = true;
      // 并发删除所有选中的配置
      await Promise.all(selectedIds.value.map((id) => deletePublishConfigApi(String(id))));
      ElMessage.success(`成功删除 ${selectedIds.value.length} 个任务配置`);
      selectedIds.value = [];
      await getList();
    } catch (err) {
      console.error(err);
      ElMessage.error("批量删除失败");
    } finally {
      deleteLoading.value = false;
    }
  });
};

// Dialog
const dialogVisible = ref(false);
const dialogTitle = ref("");
const formRef = ref();
const submitLoading = ref(false);
const templateBindingDialogVisible = ref(false);
const templateBindingLoading = ref(false);
const templateBindingHydrating = ref(false);
const templateBindingSearchText = ref("");
const templateBindingOptions = ref<any[]>([]);
const templateBindingPageParams = reactive({
  currentPage: 1,
  pageSize: 18,
  total: 0,
});
const selectedTemplateBinding = ref<any | null>(null);

// 动态平台配置
const currentPlatformConfig = ref<TaskTypeConfig | null>(null);
const platformConfigData = ref<Record<string, any>>({});
const vendorOptions = ref<Array<{ label: string; value: number }>>([]);
const fixedTitleSupportedPlatforms = new Set(["doudian", "kuaishou_shop", "temu"]);

const form = reactive({
  id: undefined,
  name: "",
  taskType: "",
  description: "",
  isActive: true,
});

const currentTemplateBindingId = computed(() =>
  String(selectedTemplateBinding.value?.id || "").trim(),
);

const titleConfigForm = reactive({
  mode: "ai" as "ai" | "fixed",
  fixedTitle: "",
  templateContent: "",
  maxLength: undefined as number | undefined,
  style: "",
  tone: "",
  includeEmoji: null as boolean | null,
  requiredKeywords: [] as string[],
  avoidWords: [] as string[],
});

const supportsFixedTitle = computed(() =>
  fixedTitleSupportedPlatforms.has(resolveTaskTypePlatform(form.taskType)),
);

const isFixedTitleMode = computed(
  () => supportsFixedTitle.value && titleConfigForm.mode === "fixed",
);

const titleConfigPanelTitle = computed(() =>
  supportsFixedTitle.value ? "标题配置" : "AI 标题生成配置",
);

const titleConfigPanelDesc = computed(() => {
  if (!supportsFixedTitle.value) {
    return "标题模板与规则。";
  }
  return isFixedTitleMode.value ? "固定标题优先，不走 AI 生成。" : "支持切换为 AI 生成标题。";
});

const appendImageUrlValidation = computed(() => {
  if (resolveTaskTypePlatform(form.taskType) !== "doudian") {
    return {
      hasError: false,
      invalidUrls: [] as Array<{ index: number; value: string }>,
    };
  }

  const rawValue = platformConfigData.value?.appendImageUrls;
  const lines = Array.isArray(rawValue)
    ? rawValue
    : typeof rawValue === "string"
      ? rawValue.split(/\r?\n/)
      : [];

  const invalidUrls = lines
    .map((item: any, index: number) => ({
      index,
      value: String(item || "").trim(),
    }))
    .filter((item) => item.value)
    .filter((item) => !/^https?:\/\//i.test(item.value));

  return {
    hasError: invalidUrls.length > 0,
    invalidUrls,
  };
});

const platformImageLimitTip = computed(() => {
  const platform = resolveTaskTypePlatform(form.taskType);

  if (platform === "doudian") {
    return "抖店商品图最多 5 个";
  }

  if (platform === "kuaishou_shop") {
    return "快手小店商品图最多 9 个";
  }

  return "";
});

function normalizePublishConfigData(taskType: string, value: Record<string, any> = {}) {
  const normalized = {
    ...getTaskTypeDefaultData(taskType),
    ...(value || {}),
  };

  const platformConfig = getTaskTypeConfig(taskType);
  if (platformConfig?.fields?.length) {
    platformConfig.fields.forEach((field) => {
      if (field.type === "url-list" && !Array.isArray(normalized[field.key])) {
        normalized[field.key] = normalized[field.key] ? [String(normalized[field.key])] : [];
      }
    });
  }

  return normalized;
}

function ensureUrlListField(fieldKey: string) {
  const currentValue = platformConfigData.value?.[fieldKey];
  if (!Array.isArray(currentValue)) {
    platformConfigData.value[fieldKey] = currentValue ? [String(currentValue)] : [];
  }
}

function addUrlListItem(fieldKey: string) {
  ensureUrlListField(fieldKey);
  platformConfigData.value[fieldKey].push("");
}

function removeUrlListItem(fieldKey: string, index: number) {
  ensureUrlListField(fieldKey);
  const nextList = [...platformConfigData.value[fieldKey]];
  nextList.splice(index, 1);
  platformConfigData.value[fieldKey] = nextList;
}

function getUrlListItemError(fieldKey: string, index: number) {
  if (fieldKey !== "appendImageUrls") {
    return "";
  }
  const invalidItem = appendImageUrlValidation.value.invalidUrls.find(
    (item) => item.index === index,
  );
  return invalidItem ? "仅支持 http/https URL" : "";
}

// 监听任务类型变化，更新配置字段
watch(
  () => form.taskType,
  (newTaskType) => {
    if (newTaskType) {
      currentPlatformConfig.value = getTaskTypeConfig(newTaskType);
      platformConfigData.value = normalizePublishConfigData(newTaskType, platformConfigData.value);
    } else {
      currentPlatformConfig.value = null;
      platformConfigData.value = {};
    }
  },
  { immediate: true },
);

watch(templateBindingSearchText, () => {
  debouncedLoadTemplateBindingTemplates();
});

const baseTaskTypeOptions = getAllTaskTypes();

const taskTypeOptions = computed(() => {
  const currentTaskType = String(form.taskType || "").trim();
  if (!currentTaskType || baseTaskTypeOptions.some((item) => item.value === currentTaskType)) {
    return baseTaskTypeOptions;
  }

  const currentPlatform = resolveTaskTypePlatform(currentTaskType);
  const currentTaskConfig = getTaskTypeConfig(currentTaskType);
  if (!currentPlatform || !currentTaskConfig) {
    return baseTaskTypeOptions;
  }

  return [
    {
      label: `${getTaskTypeLabel(currentTaskType, currentPlatform)}（历史配置）`,
      value: currentTaskType,
      platform: currentPlatform,
      taskKind: currentTaskConfig.taskKind,
    },
    ...baseTaskTypeOptions,
  ];
});

const rules = {
  name: [{ required: true, message: "请输入配置名称", trigger: "blur" }],
  taskType: [{ required: true, message: "请选择任务类型", trigger: "change" }],
};

function resetTemplateBindingState() {
  selectedTemplateBinding.value = null;
  templateBindingSearchText.value = "";
  templateBindingOptions.value = [];
  templateBindingPageParams.currentPage = 1;
  templateBindingPageParams.total = 0;
}

function normalizeTemplateBindingTemplate(template: any) {
  if (!template?.id) {
    return null;
  }

  return {
    id: String(template.id),
    name: String(template.name || "").trim(),
    thumbnail: String(template.thumbnail || template.preview || template.image || "").trim(),
    description: String(template.description || "").trim(),
    enabled: template.enabled !== false,
    missing: false,
  };
}

async function hydrateTemplateBinding(psdTemplateId?: string | null) {
  const normalizedId = String(psdTemplateId || "").trim();
  if (!normalizedId) {
    selectedTemplateBinding.value = null;
    return;
  }

  templateBindingHydrating.value = true;
  try {
    const detail = await psdTemplateApi.getPsdTemplateDetail(normalizedId);
    selectedTemplateBinding.value = normalizeTemplateBindingTemplate(detail) || {
      id: normalizedId,
      name: "模板信息加载失败",
      thumbnail: "",
      description: "",
      enabled: false,
      missing: true,
    };
  } catch (error) {
    console.error("加载绑定模板详情失败:", error);
    selectedTemplateBinding.value = {
      id: normalizedId,
      name: "模板不存在或无权访问",
      thumbnail: "",
      description: "",
      enabled: false,
      missing: true,
    };
  } finally {
    templateBindingHydrating.value = false;
  }
}

async function loadTemplateBindingTemplates() {
  templateBindingLoading.value = true;
  try {
    const res: any = await psdTemplateApi.getPsdTemplatePage({
      currentPage: templateBindingPageParams.currentPage,
      pageSize: templateBindingPageParams.pageSize,
      searchKeyword: templateBindingSearchText.value.trim() || undefined,
      enabled: true,
    });
    templateBindingOptions.value = Array.isArray(res?.list) ? res.list : [];
    templateBindingPageParams.total = Number(res?.total || 0);
  } catch (error) {
    console.error("加载套图模板失败:", error);
    ElMessage.error("加载套图模板失败");
  } finally {
    templateBindingLoading.value = false;
  }
}

function openTemplateBindingDialog() {
  templateBindingDialogVisible.value = true;
  if (!templateBindingOptions.value.length) {
    loadTemplateBindingTemplates();
  }
}

function selectTemplateBinding(template: any) {
  selectedTemplateBinding.value = normalizeTemplateBindingTemplate(template);
  templateBindingDialogVisible.value = false;
}

function clearTemplateBinding() {
  selectedTemplateBinding.value = null;
}

const debouncedLoadTemplateBindingTemplates = useDebounceFn(() => {
  if (!templateBindingDialogVisible.value) {
    return;
  }
  templateBindingPageParams.currentPage = 1;
  loadTemplateBindingTemplates();
}, 300);

const handleAdd = () => {
  dialogTitle.value = "新增任务配置";
  form.id = undefined;
  form.name = "";
  form.taskType = "";
  form.description = "";
  form.isActive = true;
  titleConfigForm.mode = "ai";
  titleConfigForm.fixedTitle = "";
  titleConfigForm.templateContent = "";
  titleConfigForm.maxLength = undefined;
  titleConfigForm.style = "";
  titleConfigForm.tone = "";
  titleConfigForm.includeEmoji = null;
  titleConfigForm.requiredKeywords = [];
  titleConfigForm.avoidWords = [];
  platformConfigData.value = {};
  currentPlatformConfig.value = null;
  resetTemplateBindingState();
  dialogVisible.value = true;
};

const handleEdit = async (row: any) => {
  dialogTitle.value = "编辑任务配置";
  form.id = row.id;
  form.name = row.name;
  form.taskType = row.taskType || derivePublishTaskTypeByPlatform(row.platform);
  form.description = row.description;
  form.isActive = row.isActive;

  titleConfigForm.mode =
    row.titleConfig?.mode === "fixed" || row.titleConfig?.fixedTitle ? "fixed" : "ai";
  titleConfigForm.fixedTitle = row.titleConfig?.fixedTitle || "";
  titleConfigForm.templateContent = row.titleTemplate || "";
  titleConfigForm.maxLength =
    typeof row.titleConfig?.maxLength === "number" ? row.titleConfig.maxLength : undefined;
  titleConfigForm.style = row.titleConfig?.style || "";
  titleConfigForm.tone = row.titleConfig?.tone || "";
  titleConfigForm.includeEmoji =
    typeof row.titleConfig?.includeEmoji === "boolean" ? row.titleConfig.includeEmoji : null;
  titleConfigForm.requiredKeywords = Array.isArray(row.titleConfig?.requiredKeywords)
    ? row.titleConfig.requiredKeywords
    : Array.isArray(row.titleConfig?.keywords)
      ? row.titleConfig.keywords
      : [];
  titleConfigForm.avoidWords = Array.isArray(row.titleConfig?.avoidWords)
    ? row.titleConfig.avoidWords
    : [];

  // 加载任务类型配置数据
  currentPlatformConfig.value = getTaskTypeConfig(form.taskType);
  platformConfigData.value = normalizePublishConfigData(
    form.taskType,
    formatTaskTypeConfigForEdit(form.taskType, row.configData || {}),
  );
  resetTemplateBindingState();
  await hydrateTemplateBinding(row?.templateBinding?.psdTemplateId);
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!formRef.value || submitLoading.value) return;

  submitLoading.value = true;
  try {
    await formRef.value.validate();

    // 校验任务类型配置
    const validation = validateTaskTypeConfig(form.taskType, platformConfigData.value);
    if (!validation.valid) {
      ElMessage.error(validation.errors.join("；"));
      return;
    }

    if (appendImageUrlValidation.value.hasError) {
      ElMessage.error("附加图片地址校验未通过，请检查 http/https URL");
      return;
    }

    // 格式化任务类型配置
    const formattedConfigData = formatTaskTypeConfigForSubmit(
      form.taskType,
      platformConfigData.value,
    );
    const resolvedPlatform = resolveTaskTypePlatform(form.taskType);

    if (!resolvedPlatform) {
      ElMessage.error("当前任务类型尚未绑定可执行平台");
      return;
    }

    if (supportsFixedTitle.value && titleConfigForm.mode === "fixed") {
      const fixedTitle = titleConfigForm.fixedTitle?.trim() || "";
      if (!fixedTitle) {
        ElMessage.error("固定标题模式下必须填写固定标题");
        return;
      }
      const titleLimit = Number(currentPlatformConfig.value?.titleMaxLength || 0);
      if (titleLimit > 0 && Array.from(fixedTitle).length > titleLimit) {
        ElMessage.error(`固定标题不能超过 ${titleLimit} 个字符`);
        return;
      }
    }

    if (selectedTemplateBinding.value?.missing) {
      ElMessage.error("当前绑定的套图模板不可用，请重新选择或清空");
      return;
    }

    const parsedTitleConfig = {
      mode: supportsFixedTitle.value ? titleConfigForm.mode : undefined,
      fixedTitle: isFixedTitleMode.value
        ? titleConfigForm.fixedTitle?.trim() || undefined
        : undefined,
      maxLength:
        !isFixedTitleMode.value && typeof titleConfigForm.maxLength === "number"
          ? titleConfigForm.maxLength
          : undefined,
      style: !isFixedTitleMode.value ? titleConfigForm.style?.trim() || undefined : undefined,
      tone: !isFixedTitleMode.value ? titleConfigForm.tone?.trim() || undefined : undefined,
      includeEmoji:
        !isFixedTitleMode.value && typeof titleConfigForm.includeEmoji === "boolean"
          ? titleConfigForm.includeEmoji
          : undefined,
      requiredKeywords:
        !isFixedTitleMode.value && Array.isArray(titleConfigForm.requiredKeywords)
          ? titleConfigForm.requiredKeywords
          : undefined,
      avoidWords:
        !isFixedTitleMode.value && Array.isArray(titleConfigForm.avoidWords)
          ? titleConfigForm.avoidWords
          : undefined,
    };

    let data = {
      name: form.name,
      taskType: form.taskType,
      platform: resolvedPlatform,
      description: form.description,
      isActive: form.isActive,
      titleTemplate: titleConfigForm.templateContent?.trim() || undefined,
      titleConfig: parsedTitleConfig,
      configData: formattedConfigData,
      templateBinding: currentTemplateBindingId.value
        ? { psdTemplateId: currentTemplateBindingId.value }
        : undefined,
    };

    // 执行任务类型特定的提交前钩子
    data = executeTaskTypeBeforeSubmit(form.taskType, data);

    if (form.id) {
      await updatePublishConfigApi(form.id, data);
      ElMessage.success("更新成功");
    } else {
      await createPublishConfigApi(data);
      ElMessage.success("创建成功");
    }
    dialogVisible.value = false;
    getList();
  } catch (err: any) {
    console.error(err);
    const message = String(err?.message || "");
    if (message && !message.toLowerCase().includes("validation")) {
      ElMessage.error(err.message || "操作失败");
    }
  } finally {
    submitLoading.value = false;
  }
};

const handleDelete = (row: any) => {
  if (!userStore.user?.isAdmin) {
    return ElMessage.warning("无权限：仅管理员可执行删除操作");
  }
  ElMessageBox.confirm("确认删除该任务配置吗?", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(async () => {
    try {
      deleteLoading.value = true;
      await deletePublishConfigApi(row.id);
      ElMessage.success("删除成功");
      await getList();
    } catch (err) {
      console.error(err);
    } finally {
      deleteLoading.value = false;
    }
  });
};

onMounted(() => {
  getList();
  loadVendorOptions();
});
</script>

<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="publish-config-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="list-page-search-form__actions">
            <el-button size="small" type="primary" :loading="loading" @click="handleSearch"
              >刷新</el-button
            >
            <el-button
              size="small"
              type="primary"
              :disabled="loading || deleteLoading"
              @click="handleAdd"
              >新增任务配置</el-button
            >
            <el-button
              v-if="userStore.user?.isAdmin"
              size="small"
              type="danger"
              :loading="deleteLoading"
              :disabled="selectedIds.length === 0"
              @click="handleBatchDelete"
            >
              批量删除 <span v-if="selectedIds.length > 0">({{ selectedIds.length }})</span>
            </el-button>
          </div>
        </div>
      </template>

      <template #table>
        <div
          class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat"
        >
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid
                v-bind="gridOptions"
                :data="tableData"
                :loading="loading"
                @checkbox-change="handleSelectionChange"
                @checkbox-all="handleSelectionChange"
              >
                <template #action="{ row }">
                  <el-dropdown class="operation-dropdown" placement="bottom-end">
                    <el-button type="primary" link size="small" class="operation-trigger-button"
                      >操作</el-button
                    >
                    <template #dropdown>
                      <el-dropdown-menu class="operation-menu-compact">
                        <el-dropdown-item @click="handleEdit(row)">编辑</el-dropdown-item>
                        <template v-if="userStore.user?.isAdmin">
                          <el-dropdown-item
                            divided
                            @click="handleDelete(row)"
                            class="operation-menu-item--danger"
                            >删除</el-dropdown-item
                          >
                        </template>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </template>
              </vxe-grid>
            </div>
          </div>
        </div>
      </template>
    </ListPageLayout>

    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      :fullscreen="true"
      class="publish-config-dialog"
    >
      <div class="publish-config-dialog__body">
        <div class="publish-config-form-shell">
          <el-form
            :model="form"
            :rules="rules"
            ref="formRef"
            label-width="104px"
            class="publish-config-form"
          >
            <section class="publish-config-panel publish-config-panel--basic">
              <div class="publish-config-panel__header">
                <div>
                  <div class="publish-config-panel__title">基础信息</div>
                  <div class="publish-config-panel__desc">配置名称、任务类型、启用状态与描述。</div>
                </div>
              </div>
              <el-row :gutter="10" class="publish-config-basic-row">
                <el-col :span="10" class="publish-config-basic-col">
                  <el-form-item label="配置名称" prop="name">
                    <el-input v-model="form.name" placeholder="例如：抖店商品发布 / Temu商品发布" />
                  </el-form-item>
                </el-col>
                <el-col :span="8" class="publish-config-basic-col">
                  <el-form-item label="任务类型" prop="taskType">
                    <el-select v-model="form.taskType" placeholder="请选择任务类型">
                      <el-option
                        v-for="item in taskTypeOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6" class="publish-config-basic-col publish-config-basic-col--switch">
                  <el-form-item label="启用状态" prop="isActive">
                    <div class="publish-config-switch">
                      <el-switch v-model="form.isActive" />
                      <span class="publish-config-switch__text">{{
                        form.isActive ? "启用中" : "已停用"
                      }}</span>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="24" class="publish-config-basic-col publish-config-basic-col--full">
                  <el-form-item label="描述" prop="description">
                    <el-input
                      v-model="form.description"
                      type="textarea"
                      :autosize="{ minRows: 2, maxRows: 4 }"
                      placeholder="简要说明这条任务配置的适用场景"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </section>

            <section class="publish-config-panel publish-config-panel--template">
              <div class="publish-config-panel__header">
                <div>
                  <div class="publish-config-panel__title">套图模板绑定</div>
                  <div class="publish-config-panel__desc">
                    可选。图片素材页按发布配置生成时，会读取这里绑定的套图模板。
                  </div>
                </div>
              </div>

              <div v-loading="templateBindingHydrating" class="publish-config-template-binding">
                <div v-if="selectedTemplateBinding" class="publish-config-template-binding__card">
                  <div class="publish-config-template-binding__preview">
                    <el-image
                      v-if="selectedTemplateBinding.thumbnail"
                      :src="selectedTemplateBinding.thumbnail"
                      fit="cover"
                    />
                    <div v-else class="publish-config-template-binding__placeholder">
                      暂无缩略图
                    </div>
                  </div>
                  <div class="publish-config-template-binding__meta">
                    <div class="publish-config-template-binding__title">
                      {{ selectedTemplateBinding.name || "未命名模板" }}
                    </div>
                    <div class="publish-config-template-binding__id">
                      {{ selectedTemplateBinding.id }}
                    </div>
                    <div class="publish-config-template-binding__desc">
                      {{
                        selectedTemplateBinding.missing
                          ? "当前模板不存在或无权访问，请重新选择。"
                          : selectedTemplateBinding.description || "已绑定套图模板。"
                      }}
                    </div>
                  </div>
                  <div class="publish-config-template-binding__actions">
                    <el-tag
                      :type="
                        selectedTemplateBinding.missing
                          ? 'danger'
                          : selectedTemplateBinding.enabled
                            ? 'success'
                            : 'warning'
                      "
                      effect="plain"
                    >
                      {{
                        selectedTemplateBinding.missing
                          ? "不可用"
                          : selectedTemplateBinding.enabled
                            ? "已绑定"
                            : "已停用"
                      }}
                    </el-tag>
                    <div class="publish-config-template-binding__action-row">
                      <el-button type="primary" plain @click="openTemplateBindingDialog">
                        重新选择
                      </el-button>
                      <el-button @click="clearTemplateBinding">清空</el-button>
                    </div>
                  </div>
                </div>

                <div v-else class="publish-config-template-binding__empty">
                  <div class="publish-config-template-binding__empty-title">当前未绑定套图模板</div>
                  <div class="publish-config-template-binding__empty-desc">
                    可以先不绑定；需要从图片素材一键生成套图和发布任务时，再选择模板。
                  </div>
                  <el-button type="primary" @click="openTemplateBindingDialog">
                    选择套图模板
                  </el-button>
                </div>
              </div>
            </section>

            <div class="publish-config-workspace">
              <section class="publish-config-panel publish-config-panel--platform">
                <div class="publish-config-panel__header">
                  <div>
                    <div class="publish-config-panel__title">任务类型配置</div>
                    <div class="publish-config-panel__desc">当前任务类型专属字段。</div>
                  </div>
                  <el-tag v-if="currentPlatformConfig" type="info" effect="plain" round>
                    {{ currentPlatformConfig.label }}
                  </el-tag>
                </div>

                <template v-if="currentPlatformConfig && form.taskType">
                  <div class="publish-config-platform__summary">
                    <span>{{ currentPlatformConfig.description }}</span>
                    <span>目标平台：{{ currentPlatformConfig.platformLabel }}</span>
                    <span>图片：{{ currentPlatformConfig.supportImage ? "支持" : "不支持" }}</span>
                    <span>视频：{{ currentPlatformConfig.supportVideo ? "支持" : "不支持" }}</span>
                  </div>
                  <div
                    v-if="platformImageLimitTip"
                    class="publish-config-field-note publish-config-platform__notice"
                  >
                    {{ platformImageLimitTip }}
                  </div>

                  <el-row
                    v-if="currentPlatformConfig.fields.length > 0"
                    :gutter="10"
                    class="publish-config-fields-row"
                  >
                    <el-col
                      v-for="field in currentPlatformConfig.fields"
                      :key="field.key"
                      :span="field.span || 24"
                      :class="[
                        'publish-config-field-col',
                        { 'publish-config-field-col--full': (field.span || 24) >= 24 },
                      ]"
                    >
                      <el-form-item :label="field.label" :required="field.required">
                        <el-input
                          v-if="field.type === 'input'"
                          v-model="platformConfigData[field.key]"
                          :type="field.inputType || 'text'"
                          :placeholder="field.placeholder"
                        />

                        <el-input
                          v-else-if="field.type === 'textarea'"
                          v-model="platformConfigData[field.key]"
                          type="textarea"
                          :rows="field.rows || 3"
                          :placeholder="field.placeholder"
                        />

                        <div v-else-if="field.type === 'url-list'">
                          <div class="publish-config-url-list">
                            <div
                              v-for="(_, index) in Array.isArray(platformConfigData[field.key])
                                ? platformConfigData[field.key]
                                : []"
                              :key="`${field.key}-${index}`"
                              class="publish-config-url-list__item"
                            >
                              <div>
                                <el-input
                                  v-model="platformConfigData[field.key][index]"
                                  :placeholder="field.placeholder"
                                />
                                <div
                                  v-if="getUrlListItemError(String(field.key), Number(index))"
                                  class="publish-config-field-error"
                                >
                                  {{ getUrlListItemError(String(field.key), Number(index)) }}
                                </div>
                              </div>
                              <el-button
                                text
                                type="danger"
                                @click="removeUrlListItem(String(field.key), Number(index))"
                              >
                                删除
                              </el-button>
                            </div>
                          </div>
                          <el-button text type="primary" @click="addUrlListItem(String(field.key))"
                            >新增地址</el-button
                          >
                          <div v-if="field.tooltip" class="publish-config-field-tip">
                            {{ field.tooltip }}
                          </div>
                          <div
                            v-if="field.key === 'appendImageUrls'"
                            class="publish-config-field-note"
                          >
                            一个输入框对应一个地址，生成发布任务时会追加到套图图片后面。
                          </div>
                        </div>

                        <el-input-number
                          v-else-if="field.type === 'number'"
                          v-model="platformConfigData[field.key]"
                          :placeholder="field.placeholder"
                        />

                        <template v-else-if="field.type === 'select'">
                          <el-select
                            v-model="platformConfigData[field.key]"
                            :placeholder="field.placeholder || '请选择'"
                            :clearable="field.key === 'vendorId'"
                          >
                            <el-option
                              v-for="option in field.key === 'vendorId'
                                ? vendorOptions
                                : field.options"
                              :key="option.value"
                              :label="option.label"
                              :value="option.value"
                            />
                          </el-select>
                          <div
                            v-if="field.key === 'vendorId' && field.tooltip"
                            class="publish-config-field-tip"
                          >
                            {{ field.tooltip }}
                          </div>
                        </template>

                        <div v-else-if="field.type === 'switch'" class="publish-config-switch">
                          <el-switch v-model="platformConfigData[field.key]" />
                          <span v-if="field.tooltip" class="publish-config-switch__hint">{{
                            field.tooltip
                          }}</span>
                        </div>
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <el-empty
                    v-else
                    description="该任务类型暂未定义专属字段，后续确认执行流程后再补充"
                    :image-size="88"
                  />
                </template>

                <el-empty v-else description="请选择任务类型后再配置专属字段" :image-size="92" />
              </section>

              <section class="publish-config-panel publish-config-panel--ai">
                <div class="publish-config-panel__header">
                  <div>
                    <div class="publish-config-panel__title">{{ titleConfigPanelTitle }}</div>
                    <div class="publish-config-panel__desc">{{ titleConfigPanelDesc }}</div>
                  </div>
                </div>

                <div class="publish-config-ai-grid">
                  <div class="publish-config-ai-grid__main">
                    <el-form-item v-if="supportsFixedTitle" label="标题模式">
                      <el-radio-group v-model="titleConfigForm.mode">
                        <el-radio label="fixed">固定标题</el-radio>
                        <el-radio label="ai">AI 生成</el-radio>
                      </el-radio-group>
                    </el-form-item>

                    <el-form-item
                      v-if="isFixedTitleMode"
                      label="固定标题"
                      class="publish-config-ai-grid__editor"
                    >
                      <el-input
                        v-model="titleConfigForm.fixedTitle"
                        type="textarea"
                        :autosize="{ minRows: 4, maxRows: 6 }"
                        placeholder="请输入固定标题，发布时将直接使用，不走 AI 生成"
                      />
                      <div class="publish-config-field-tip">
                        当前模式会直接使用这里的标题。
                        {{
                          currentPlatformConfig
                            ? `当前任务类型标题限制：${currentPlatformConfig.titleMaxLength || "无"} 字符。`
                            : ""
                        }}
                      </div>
                    </el-form-item>

                    <el-form-item v-else label="标题模板" class="publish-config-ai-grid__editor">
                      <el-input
                        v-model="titleConfigForm.templateContent"
                        type="textarea"
                        :autosize="{ minRows: 10, maxRows: 16 }"
                        placeholder="直接填写发布任务标题生成模板。发布任务生成标题时只使用这里的内容。"
                      />
                      <div class="publish-config-field-tip">
                        当前配置不再保存或依赖 `promptId`。发布任务生成标题时只读取这里的
                        `titleTemplate` 内容。
                        {{
                          currentPlatformConfig
                            ? `当前任务类型标题限制：${currentPlatformConfig.titleMaxLength || "无"} 字符。`
                            : ""
                        }}
                      </div>
                    </el-form-item>
                  </div>

                  <div v-if="!isFixedTitleMode" class="publish-config-ai-grid__side">
                    <el-form-item label="最大字数">
                      <el-input-number
                        v-model="titleConfigForm.maxLength"
                        :min="1"
                        :max="200"
                        placeholder="例如：30"
                      />
                    </el-form-item>
                    <el-form-item label="风格">
                      <el-input
                        v-model="titleConfigForm.style"
                        placeholder="如 marketing / formal / cute"
                      />
                    </el-form-item>
                    <el-form-item label="语气">
                      <el-input
                        v-model="titleConfigForm.tone"
                        placeholder="如 enthusiastic / neutral"
                      />
                    </el-form-item>
                    <el-form-item label="包含 Emoji">
                      <el-radio-group v-model="titleConfigForm.includeEmoji">
                        <el-radio :label="true">允许</el-radio>
                        <el-radio :label="false">禁止</el-radio>
                        <el-radio :label="null">不限</el-radio>
                      </el-radio-group>
                    </el-form-item>
                    <el-form-item label="必含关键词">
                      <el-select
                        v-model="titleConfigForm.requiredKeywords"
                        multiple
                        filterable
                        allow-create
                        default-first-option
                        placeholder="输入后回车添加"
                      />
                    </el-form-item>
                    <el-form-item label="禁用词">
                      <el-select
                        v-model="titleConfigForm.avoidWords"
                        multiple
                        filterable
                        allow-create
                        default-first-option
                        placeholder="输入后回车添加"
                      />
                    </el-form-item>
                  </div>
                </div>
              </section>
            </div>
          </el-form>
        </div>
      </div>
      <template #footer>
        <div class="publish-config-dialog__footer">
          <div class="publish-config-dialog__footer-actions">
            <el-button :disabled="submitLoading" @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="submitLoading" @click="submitForm"
              >保存任务配置</el-button
            >
          </div>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="templateBindingDialogVisible"
      title="选择套图模板"
      fullscreen
      class="publish-config-template-dialog"
    >
      <div class="publish-config-template-dialog__body">
        <div class="publish-config-template-dialog__toolbar">
          <div class="publish-config-template-dialog__summary">
            <div class="publish-config-template-dialog__stat">
              已选模板：{{ selectedTemplateBinding?.name || "未选择" }}
            </div>
            <div class="publish-config-template-dialog__stat">
              当前页：{{ templateBindingOptions.length }} 条
            </div>
            <div class="publish-config-template-dialog__stat">
              总数：{{ templateBindingPageParams.total }}
            </div>
          </div>
          <div class="publish-config-template-dialog__search">
            <el-input
              v-model="templateBindingSearchText"
              clearable
              placeholder="搜索模板名称或描述"
            />
          </div>
        </div>

        <div v-loading="templateBindingLoading" class="publish-config-template-dialog__list">
          <div
            v-for="template in templateBindingOptions"
            :key="template.id"
            class="publish-config-template-option"
            :class="{ 'is-active': currentTemplateBindingId === String(template.id) }"
            @click="selectTemplateBinding(template)"
          >
            <div class="publish-config-template-option__preview">
              <el-image v-if="template.thumbnail" :src="template.thumbnail" fit="cover" />
              <div v-else class="publish-config-template-option__placeholder">暂无缩略图</div>
            </div>
            <div class="publish-config-template-option__meta">
              <div class="publish-config-template-option__name">
                {{ template.name || "未命名模板" }}
              </div>
              <div class="publish-config-template-option__desc">
                {{ template.description || "暂无描述" }}
              </div>
              <div class="publish-config-template-option__id">{{ template.id }}</div>
            </div>
            <el-tag
              v-if="currentTemplateBindingId === String(template.id)"
              type="success"
              effect="plain"
            >
              当前已选
            </el-tag>
          </div>

          <el-empty
            v-if="!templateBindingLoading && templateBindingOptions.length === 0"
            description="暂无可选套图模板"
          />
        </div>

        <div
          v-if="templateBindingPageParams.total > 0"
          class="publish-config-template-dialog__pagination"
        >
          <pagination
            v-model:page="templateBindingPageParams.currentPage"
            v-model:limit="templateBindingPageParams.pageSize"
            :total="templateBindingPageParams.total"
            @pagination="loadTemplateBindingTemplates"
          />
        </div>
      </div>
      <template #footer>
        <div class="publish-config-template-dialog__footer">
          <el-button @click="templateBindingDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<style scoped lang="less">
:deep(.publish-config-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.publish-config-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.publish-config-page .list-page-filter--flat) {
  padding-bottom: 10px;
}

.publish-config-dialog {
  :deep(.el-dialog) {
    height: 100vh;
    margin: 0;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-dialog__header) {
    flex-shrink: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
  }

  :deep(.el-dialog__body) {
    flex: 1;
    padding: 0;
    background: var(--el-fill-color-light);
    overflow: hidden;
  }

  :deep(.el-dialog__footer) {
    flex-shrink: 0;
    padding: 14px 24px 18px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
  }
}

.publish-config-dialog__body {
  height: 100%;
  padding: 0;
  box-sizing: border-box;
  overflow-y: auto;
}

.publish-config-form-shell {
  width: 100%;
  min-height: 100%;
}

.publish-config-form {
  min-height: 100%;
  width: 100%;

  :deep(.el-form-item__content) {
    min-width: 0;
    justify-content: flex-start;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  :deep(.el-form-item__label) {
    color: var(--el-text-color-primary);
    font-weight: 500;
  }

  :deep(.el-form-item__content > .el-input),
  :deep(.el-form-item__content > .el-select),
  :deep(.el-form-item__content > .el-input-number) {
    flex: 0 0 auto;
    width: min(100%, 280px);
  }

  :deep(.el-form-item__content > .el-textarea) {
    flex: 0 0 auto;
    width: min(100%, 440px);
  }

  :deep(.el-form-item__content > .el-radio-group) {
    flex: 0 0 auto;
    max-width: 420px;
  }
}

.publish-config-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 14px 14px 2px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);

  :deep(.el-form-item) {
    margin-bottom: 14px;
  }
}

.publish-config-panel--basic {
  margin-bottom: 10px;
}

.publish-config-panel--template {
  margin-bottom: 10px;
}

.publish-config-basic-row,
.publish-config-fields-row {
  justify-content: flex-start;
  align-items: flex-start;
}

.publish-config-basic-row :deep(.publish-config-basic-col),
.publish-config-fields-row :deep(.publish-config-field-col) {
  flex: 0 0 auto;
  width: auto;
  max-width: none;
}

.publish-config-basic-row :deep(.publish-config-basic-col .el-form-item),
.publish-config-fields-row :deep(.publish-config-field-col .el-form-item) {
  margin-right: 0;
}

.publish-config-basic-row :deep(.publish-config-basic-col) {
  width: min(100%, 430px) !important;
}

.publish-config-basic-row :deep(.publish-config-basic-col--switch) {
  width: min(100%, 260px) !important;
}

.publish-config-basic-row :deep(.publish-config-basic-col--full),
.publish-config-fields-row :deep(.publish-config-field-col--full) {
  flex-basis: 100% !important;
  width: 100% !important;
}

.publish-config-fields-row :deep(.publish-config-field-col) {
  width: min(100%, 430px) !important;
}

.publish-config-workspace {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.publish-config-template-binding {
  min-height: 132px;
}

.publish-config-template-binding__card {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
}

.publish-config-template-binding__preview {
  width: 120px;
  height: 120px;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #f8fafc;
}

.publish-config-template-binding__preview :deep(img),
.publish-config-template-option__preview :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.publish-config-template-binding__placeholder,
.publish-config-template-option__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #94a3b8;
  font-size: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
}

.publish-config-template-binding__meta {
  min-width: 0;
}

.publish-config-template-binding__title,
.publish-config-template-option__name {
  color: #111827;
  font-size: 15px;
  font-weight: 600;
}

.publish-config-template-binding__id,
.publish-config-template-option__id {
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
  word-break: break-all;
}

.publish-config-template-binding__desc,
.publish-config-template-option__desc {
  margin-top: 8px;
  color: #475569;
  font-size: 13px;
  line-height: 1.6;
}

.publish-config-template-binding__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.publish-config-template-binding__action-row {
  display: flex;
  gap: 8px;
}

.publish-config-template-binding__empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 10px;
  min-height: 132px;
  padding: 6px 4px;
}

.publish-config-template-binding__empty-title {
  color: #111827;
  font-size: 16px;
  font-weight: 600;
}

.publish-config-template-binding__empty-desc {
  max-width: 720px;
  color: #64748b;
  line-height: 1.7;
}

.publish-config-template-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100vh - 180px);
}

.publish-config-template-dialog__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.publish-config-template-dialog__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.publish-config-template-dialog__stat {
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #f8fafc;
  color: #334155;
  font-size: 13px;
}

.publish-config-template-dialog__search {
  width: min(360px, 100%);
}

.publish-config-template-dialog__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
  align-content: start;
  min-height: 320px;
}

.publish-config-template-option {
  display: flex;
  gap: 14px;
  padding: 14px;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.publish-config-template-option:hover,
.publish-config-template-option.is-active {
  border-color: rgba(59, 130, 246, 0.35);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.publish-config-template-option__preview {
  width: 88px;
  height: 88px;
  flex: 0 0 88px;
  overflow: hidden;
  border-radius: 16px;
  background: #f8fafc;
}

.publish-config-template-option__meta {
  flex: 1;
  min-width: 0;
}

.publish-config-template-dialog__pagination,
.publish-config-template-dialog__footer {
  display: flex;
  justify-content: flex-end;
}

.publish-config-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.publish-config-panel__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.3;
}

.publish-config-panel__desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.publish-config-platform__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
  border: 1px dashed var(--el-border-color);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.publish-config-platform__notice {
  margin-bottom: 12px;
}

.publish-config-ai-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.publish-config-panel--ai {
  padding-bottom: 12px;
}

.publish-config-panel--ai .publish-config-ai-grid__main {
  :deep(.el-form-item__content > .el-textarea) {
    flex: 0 0 auto;
    width: min(100%, 680px);
  }
}

.publish-config-ai-grid__side {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 320px));
  justify-content: flex-start;
  gap: 0 12px;
}

.publish-config-ai-grid__editor {
  :deep(.el-form-item__content) {
    display: block;
  }
}

.publish-config-field-tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.publish-config-field-note {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 12px;
  line-height: 1.5;
}

.publish-config-url-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 560px;
}

.publish-config-url-list__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.publish-config-field-error {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-color-danger);
  word-break: break-all;
}

.publish-config-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
  justify-content: flex-start;
}

.publish-config-switch__text,
.publish-config-switch__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.publish-config-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.publish-config-dialog__footer-actions {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

@media (max-width: 1200px) {
  .publish-config-ai-grid__side {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .publish-config-template-binding__card {
    grid-template-columns: 1fr;
  }

  .publish-config-template-binding__actions {
    align-items: flex-start;
  }

  .publish-config-template-dialog__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .publish-config-ai-grid__side {
    grid-template-columns: 1fr;
  }

  .publish-config-dialog__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .publish-config-dialog__footer-actions {
    justify-content: flex-end;
  }
}
</style>
