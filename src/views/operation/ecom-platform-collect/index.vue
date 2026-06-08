<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="ecom-collect-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="filters" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col :xs="24" :sm="12" :md="8" :lg="8">
                <el-form-item label="任务名称 / 平台 / 任务类型">
                  <el-input
                    v-model="filters.keyword"
                    clearable
                    placeholder="搜索任务名称 / 平台 / 任务类型"
                    @keyup.enter="handleSearch"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item label="平台">
                  <el-select
                    v-model="filters.platform"
                    clearable
                    placeholder="平台"
                    @change="handlePlatformFilterChange"
                  >
                    <el-option
                      v-for="item in catalog.platforms"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item label="任务类型">
                  <el-select
                    v-model="filters.taskType"
                    clearable
                    filterable
                    placeholder="任务类型"
                  >
                    <el-option
                      v-for="item in availableTaskTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" @click="handleSearch">查询</el-button>
              <el-button size="small" @click="handleReset">重置</el-button>
              <el-button size="small" @click="loadData">刷新</el-button>
              <el-button size="small" type="primary" @click="openTaskDialog()">
                新建任务
              </el-button>
              <el-button size="small" type="warning" @click="handleResetActiveRuns">
                重置运行状态
              </el-button>
              <el-button
                size="small"
                type="danger"
                :disabled="!selectedIds.length"
                @click="handleBatchDelete"
              >
                批量删除 ({{ selectedIds.length }})
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
                :data="tableData"
                :loading="loading"
                @checkbox-change="handleCheckboxChange"
                @checkbox-all="handleCheckboxAll"
              >
                <template #taskNameSlot="{ row }">
                  <div class="primary-cell">
                    <strong class="primary-cell__title">{{ row.name || "-" }}</strong>
                    <span class="primary-cell__meta mono-text">{{ row.id }}</span>
                  </div>
                </template>

                <template #platformSceneSlot="{ row }">
                  <div class="inline-chip-list">
                    <span class="info-chip info-chip--platform">
                      {{ getPlatformLabel(catalog, row.platform) }}
                    </span>
                    <span class="info-chip info-chip--task mono-text">
                      {{ row.taskType || "-" }}
                    </span>
                  </div>
                </template>

                <template #configSlot="{ row }">
                  <div class="config-chip-list">
                    <span
                      v-for="item in getTaskConfigParts(row)"
                      :key="`${row.id}-${item.label}`"
                      class="config-chip"
                    >
                      <span class="config-chip__label">{{ item.label }}</span>
                      <span class="config-chip__value">{{ item.value }}</span>
                    </span>
                    <span v-if="!getTaskConfigParts(row).length" class="table-meta-text">
                      按表单配置执行
                    </span>
                  </div>
                </template>

                <template #operationSlot="{ row }">
                  <div class="flex justify-start">
                    <el-dropdown
                      class="operation-dropdown"
                      placement="bottom-end"
                      :disabled="!!triggeringTaskId"
                      @command="(command) => handleOperationCommand(String(command), row)"
                    >
                      <el-button
                        type="primary"
                        link
                        size="small"
                        class="operation-trigger-button"
                        :loading="triggeringTaskId === row.id"
                      >
                        操作
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item command="trigger">
                            <el-icon><VideoPlay /></el-icon>
                            <span>立即执行</span>
                          </el-dropdown-item>
                          <el-dropdown-item command="edit">
                            <el-icon><Edit /></el-icon>
                            <span>编辑</span>
                          </el-dropdown-item>
                          <el-dropdown-item
                            command="delete"
                            divided
                            class="operation-menu-item--danger"
                          >
                            <el-icon><Delete /></el-icon>
                            <span>删除</span>
                          </el-dropdown-item>
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
        <div
          class="list-page-panel list-page-panel--flat list-page-table-panel__pagination list-page-table-panel__pagination--flat"
        >
          <Pagination
            :total="total"
            v-model:page="filters.pageNo"
            v-model:limit="filters.pageSize"
            @pagination="loadList"
          />
        </div>
      </template>
    </ListPageLayout>

    <EcomCollectTaskDialog
      v-model="dialogVisible"
      :catalog="catalog"
      :task="currentTask"
      @success="handleDialogSuccess"
    />

    <TaskExecutionTriggerDialog
      v-model="triggerDialogVisible"
      :platform="triggerTaskRecord?.platform || ''"
      :task-type="triggerTaskRecord?.taskType || ''"
      :submitting="triggeringTaskId === (triggerTaskRecord?.id || '')"
      @confirm="handleTriggerConfirm"
    />
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, ElNotification } from "element-plus";
import { Delete, Edit, VideoPlay } from "@element-plus/icons-vue";
import type { VxeGridProps } from "vxe-table";
import {
  batchDeleteEcomPlatformCollectTask,
  deleteEcomPlatformCollectTask,
  getEcomPlatformCollectTaskList,
  resetActiveEcomPlatformCollectRuns,
  triggerEcomPlatformCollectTask,
  type EcomPlatformCollectTask,
} from "@/api/operation/ecomPlatformCollect";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import TaskExecutionTriggerDialog from "@/components/TaskExecutionTriggerDialog.vue";
import EcomCollectTaskDialog from "./components/EcomCollectTaskDialog.vue";
import {
  createEmptyEcomCollectCatalog,
  formatDateTime,
  getPlatformLabel,
  getTaskTypeLabel,
  getTaskTypeSchemas,
  loadEcomCollectCatalog,
} from "./shared";

defineOptions({ name: "EcomPlatformCollectTaskPage" });

const loading = ref(false);
const dialogVisible = ref(false);
const triggerDialogVisible = ref(false);
const currentTask = ref<EcomPlatformCollectTask | null>(null);
const triggerTaskRecord = ref<EcomPlatformCollectTask | null>(null);
const list = ref<EcomPlatformCollectTask[]>([]);
const total = ref(0);
const selectedIds = ref<string[]>([]);
const triggeringTaskId = ref("");

const catalog = reactive(createEmptyEcomCollectCatalog());

const filters = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: "",
  platform: "",
  taskType: "",
});

const availableTaskTypeOptions = computed(() =>
  getTaskTypeSchemas(catalog, filters.platform),
);

const updateSelectedIds = (records: EcomPlatformCollectTask[] = []) => {
  selectedIds.value = Array.from(
    new Set(records.map((item) => String(item.id || "").trim()).filter(Boolean)),
  );
};

const tableData = computed(() => {
  if (list.value.length <= filters.pageSize) {
    return list.value;
  }
  const start = (filters.pageNo - 1) * filters.pageSize;
  return list.value.slice(start, start + filters.pageSize);
});

const getTaskConfigSummary = (task: EcomPlatformCollectTask) => {
  const config = task.configData || {};
  const keywords = Array.isArray(config.keywords) ? config.keywords.filter(Boolean) : [];
  const isSearchTask = String(task.taskType || task.collectScene || "")
    .toLowerCase()
    .includes("search");
  const summaryParts = [
    config.keyword ? `关键词: ${config.keyword}` : "",
    !config.keyword && keywords.length ? `关键词: ${keywords.slice(0, 3).join(" / ")}` : "",
    config.targetUrl ? `链接: ${config.targetUrl}` : "",
    !isSearchTask && config.maxPages ? `页数: ${config.maxPages}` : "",
    !isSearchTask && config.maxItems ? `条数: ${config.maxItems}` : "",
  ].filter(Boolean);

  return summaryParts.join(" | ") || "按表单配置执行";
};

const getShortText = (value: unknown, maxLength = 54) => {
  const text = String(value || "").trim();
  if (!text || text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(8, maxLength - 18))}...${text.slice(-12)}`;
};

const getTaskConfigParts = (task: EcomPlatformCollectTask) => {
  const config = task.configData || {};
  const keywords = Array.isArray(config.keywords) ? config.keywords.filter(Boolean) : [];
  const isSearchTask = String(task.taskType || task.collectScene || "")
    .toLowerCase()
    .includes("search");
  return [
    config.keyword
      ? { label: "关键词", value: getShortText(config.keyword, 32) }
      : null,
    !config.keyword && keywords.length
      ? { label: "关键词", value: getShortText(keywords.slice(0, 3).join(" / "), 42) }
      : null,
    config.targetUrl ? { label: "链接", value: getShortText(config.targetUrl, 54) } : null,
    !isSearchTask && config.maxPages ? { label: "页数", value: String(config.maxPages) } : null,
    !isSearchTask && config.maxItems ? { label: "条数", value: String(config.maxItems) } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
};

const gridOptions = ref<VxeGridProps<EcomPlatformCollectTask>>({
  ...(commonGridOptions as VxeGridProps<EcomPlatformCollectTask>),
  rowConfig: {
    ...(commonGridOptions as any).rowConfig,
    keyField: "id",
  },
  checkboxConfig: {
    reserve: true,
  },
  columns: [
    { type: "checkbox", width: 48 },
    {
      title: "任务名称",
      field: "name",
      minWidth: 240,
      showOverflow: "tooltip",
      slots: { default: "taskNameSlot" },
    },
    {
      title: "平台 / 任务类型",
      field: "platform",
      width: 220,
      slots: { default: "platformSceneSlot" },
    },
    {
      title: "采集配置",
      field: "configData",
      minWidth: 320,
      showOverflow: "tooltip",
      slots: { default: "configSlot" },
    },
    {
      title: "创建人",
      field: "creator",
      width: 120,
      formatter: ({ row }) => row.creator || "-",
    },
    {
      ...buildTimeColumn("更新时间", "updateTime", 180),
      formatter: ({ cellValue }) => formatDateTime(cellValue as string),
    },
    buildOperationColumn("operationSlot", 120),
  ],
});

const applyCatalog = (data: any) => {
  catalog.platforms = Array.isArray(data?.platforms) ? data.platforms : [];
};

const applyListData = (data: any) => {
  list.value = Array.isArray(data?.list) ? data.list : [];
  total.value = Number(data?.total || 0);
  selectedIds.value = [];
};

const fetchListData = async () => {
  const data = await getEcomPlatformCollectTaskList(filters);
  applyListData(data);
  return data;
};

const loadList = async () => {
  loading.value = true;
  try {
    await fetchListData();
  } finally {
    loading.value = false;
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [catalogData, listData] = await Promise.all([
      loadEcomCollectCatalog(),
      getEcomPlatformCollectTaskList(filters),
    ]);
    applyCatalog(catalogData);
    applyListData(listData);
  } finally {
    loading.value = false;
  }
};

const openTaskDialog = (task?: EcomPlatformCollectTask) => {
  currentTask.value = task || null;
  dialogVisible.value = true;
};

const handleDialogSuccess = async () => {
  currentTask.value = null;
  await loadData();
};

const handleSearch = async () => {
  filters.pageNo = 1;
  await loadList();
};

const handlePlatformFilterChange = () => {
  if (
    filters.taskType &&
    !availableTaskTypeOptions.value.some((item) => item.value === filters.taskType)
  ) {
    filters.taskType = "";
  }
};

const handleReset = async () => {
  filters.pageNo = 1;
  filters.keyword = "";
  filters.platform = "";
  filters.taskType = "";
  await loadList();
};

const handleCheckboxChange = ({ records }: { records: EcomPlatformCollectTask[] }) => {
  updateSelectedIds(records);
};

const handleCheckboxAll = ({ records }: { records: EcomPlatformCollectTask[] }) => {
  updateSelectedIds(records);
};

const handleOperationCommand = (command: string, row: EcomPlatformCollectTask) => {
  switch (command) {
    case "trigger":
      triggerTaskRecord.value = row;
      triggerDialogVisible.value = true;
      break;
    case "edit":
      openTaskDialog(row);
      break;
    case "delete":
      void handleDelete(row);
      break;
  }
};

const handleTriggerConfirm = async (executionContext: Record<string, any>) => {
  const row = triggerTaskRecord.value;
  if (!row) {
    return;
  }
  if (triggeringTaskId.value) {
    return;
  }

  triggeringTaskId.value = row.id;
  const loadingMessage = ElMessage({
    type: "info",
    message: `正在提交执行：${row.name}`,
    duration: 0,
    showClose: true,
  });

  try {
    const result = await triggerEcomPlatformCollectTask(row.id, {
      executionContext,
    });
    loadingMessage.close();
    triggerDialogVisible.value = false;
    triggerTaskRecord.value = null;

    if (result?.success === false) {
      ElNotification({
        title: "执行未启动",
        type: "warning",
        duration: 4500,
        message: result?.data?.runId
          ? `${result.message || "触发失败"}，已生成运行记录：${result.data.runId}`
          : result?.message || "触发失败",
      });
      return;
    }

    ElNotification({
      title: "已开始执行",
      type: "success",
      duration: 4500,
      message: result?.data?.runId
        ? `任务已下发到客户端，运行记录：${result.data.runId}`
        : result?.message || "任务已触发",
    });
  } catch (error: any) {
    loadingMessage.close();
    ElMessage.error(error?.message || "触发失败");
  } finally {
    triggeringTaskId.value = "";
  }
};

const handleDelete = async (row: EcomPlatformCollectTask) => {
  try {
    await ElMessageBox.confirm(
      `确认删除任务「${row.name}」吗？将同步删除关联运行记录、原始数据和截图文件。`,
      "提示",
      { type: "warning" },
    );
    await deleteEcomPlatformCollectTask(row.id);
    ElMessage.success("任务已删除");
    await loadList();
  } catch {}
};

const handleBatchDelete = async () => {
  if (!selectedIds.value.length) return;
  try {
    await ElMessageBox.confirm(
      `确认批量删除 ${selectedIds.value.length} 个任务吗？将同步清理关联运行记录、原始数据和截图文件。`,
      "提示",
      { type: "warning" },
    );
    await batchDeleteEcomPlatformCollectTask(selectedIds.value);
    ElMessage.success("批量删除成功");
    await loadList();
  } catch {}
};

const handleResetActiveRuns = async () => {
  try {
    await ElMessageBox.confirm(
      "确认重置所有运行中的采集任务吗？这会把卡住的运行记录标记为失败并释放客户端，不会删除历史采集数据。",
      "重置采集运行状态",
      { type: "warning" },
    );
    const result = await resetActiveEcomPlatformCollectRuns();
    ElMessage.success(result?.message || "采集运行状态已重置");
    await loadList();
  } catch {}
};

onMounted(() => {
  void loadData();
});

onActivated(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
:deep(.ecom-collect-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.ecom-collect-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.ecom-collect-page .list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

:deep(.ecom-collect-page .list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}

.resource-toolbar__title {
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.resource-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.resource-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.resource-toolbar__desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.table-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

:deep(.ecom-collect-page .common-table__body-cell) {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}

:deep(.ecom-collect-page .vxe-body--column .vxe-cell) {
  min-height: 0 !important;
  line-height: 1.35 !important;
}

.primary-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.primary-cell__title {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.primary-cell__meta {
  overflow: hidden;
  color: var(--el-text-color-placeholder);
  font-size: 10px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mono-text {
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
}

.inline-chip-list,
.config-chip-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}

.info-chip,
.config-chip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 20px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 1.2;
  white-space: nowrap;
}

.info-chip {
  padding: 0 7px;
  border: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-fill-color-light) 72%, transparent);
}

.info-chip--platform {
  color: var(--el-color-primary);
  border-color: color-mix(in srgb, var(--el-color-primary) 34%, var(--el-border-color));
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  font-weight: 600;
}

.info-chip--task {
  overflow: hidden;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
}

.config-chip {
  overflow: hidden;
  border: 1px solid var(--el-border-color-extra-light);
  background: var(--el-bg-color-overlay);
}

.config-chip__label {
  padding: 3px 5px;
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-fill-color) 76%, transparent);
}

.config-chip__value {
  overflow: hidden;
  max-width: 220px;
  padding: 3px 6px;
  color: var(--el-text-color-primary);
  font-weight: 500;
  text-overflow: ellipsis;
}
</style>
