<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="ecom-data-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="resource-toolbar">
            <div class="resource-toolbar__meta">
              <div class="resource-toolbar__title">热门选品分析任务</div>
              <div class="resource-toolbar__desc">
                采集模块负责提供数据源，这里只负责定义分析范围、AI
                参数与手动触发入口，保持和采集执行链路解耦。
              </div>
            </div>
            <div class="resource-toolbar__actions">
              <el-button size="small" @click="loadData">刷新</el-button>
              <el-button size="small" type="primary" @click="openTaskDialog()">
                新建任务
              </el-button>
            </div>
          </div>

          <el-form :model="filters" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col :xs="24" :sm="12" :md="8" :lg="8">
                <el-form-item label="任务名称 / 创建人">
                  <el-input v-model="filters.keyword" clearable placeholder="搜索任务名称 / 创建人"
                    @keyup.enter="handleSearch" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item label="分析类型">
                  <el-select v-model="filters.analysisType" clearable placeholder="全部类型">
                    <el-option label="热门选品" value="hot_selling_selection" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" @click="handleSearch">查询</el-button>
              <el-button size="small" @click="handleReset">重置</el-button>
              <el-button size="small" type="danger" :disabled="!selectedIds.length" @click="handleBatchDelete">
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
              <vxe-grid v-bind="gridOptions" :data="tableData" :loading="loading"
                @checkbox-change="handleCheckboxChange" @checkbox-all="handleCheckboxAll">
                <template #typeSlot="{ row }">
                  <el-tag size="small" type="info">
                    {{ getAnalysisTypeLabel(row.analysisType) }}
                  </el-tag>
                </template>

                <template #sourceSlot="{ row }">
                  <span class="table-meta-text">{{ getSourceSummary(row) }}</span>
                </template>

                <template #optionsSlot="{ row }">
                  <div class="table-stack">
                    <span>{{ getOptionsSummary(row) }}</span>
                    <span class="table-meta-text">
                      模型：{{ row.optionsData?.aiModel }}
                    </span>
                  </div>
                </template>

                <template #lastRunSlot="{ row }">
                  <div class="table-stack">
                    <el-tag v-if="row.lastRunStatus" size="small" :type="getRunStatusTagType(row.lastRunStatus)">
                      {{ getRunStatusLabel(row.lastRunStatus) }}
                    </el-tag>
                    <span v-else class="table-meta-text">未执行</span>
                    <span class="table-meta-text">
                      {{ formatDateTime(row.lastRunAt) }}
                    </span>
                  </div>
                </template>

                <template #summarySlot="{ row }">
                  <span class="table-meta-text">
                    {{ getResultSummary(row) }}
                  </span>
                </template>

                <template #operationSlot="{ row }">
                  <div class="flex justify-start">
                    <el-dropdown class="operation-dropdown" placement="bottom-end" :disabled="!!triggeringTaskId"
                      @command="(command) => handleOperationCommand(String(command), row)">
                      <el-button type="primary" link size="small" class="operation-trigger-button"
                        :loading="triggeringTaskId === row.id">
                        操作
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item command="trigger">
                            <el-icon>
                              <VideoPlay />
                            </el-icon>
                            <span>立即分析</span>
                          </el-dropdown-item>
                          <el-dropdown-item command="edit">
                            <el-icon>
                              <Edit />
                            </el-icon>
                            <span>编辑</span>
                          </el-dropdown-item>
                          <el-dropdown-item command="delete" divided class="operation-menu-item--danger">
                            <el-icon>
                              <Delete />
                            </el-icon>
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
          class="list-page-panel list-page-panel--flat list-page-table-panel__pagination list-page-table-panel__pagination--flat">
          <Pagination :total="total" v-model:page="filters.pageNo" v-model:limit="filters.pageSize"
            @pagination="loadList" />
        </div>
      </template>
    </ListPageLayout>

    <SelectionAnalysisTaskDialog v-model="dialogVisible" :task="currentTask" :collect-catalog="catalog"
      :collect-tasks="collectTasks" :collect-runs="collectRuns" @success="handleDialogSuccess" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, ElNotification } from "element-plus";
import { Delete, Edit, VideoPlay } from "@element-plus/icons-vue";
import type { VxeGridProps } from "vxe-table";
import {
  getEcomPlatformCollectCatalog,
  getEcomPlatformCollectRunList,
  getEcomPlatformCollectTaskList,
  type EcomPlatformCollectRun,
  type EcomPlatformCollectTask,
} from "@/api/operation/ecomPlatformCollect";
import {
  batchDeleteEcomSelectionAnalysisTask,
  deleteEcomSelectionAnalysisTask,
  getEcomSelectionAnalysisTaskList,
  triggerEcomSelectionAnalysisTask,
  type EcomSelectionAnalysisTask,
} from "@/api/operation/ecomSelectionAnalysis";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import SelectionAnalysisTaskDialog from "./components/SelectionAnalysisTaskDialog.vue";
import {
  createEmptyEcomCollectCatalog,
  formatDateTime,
  formatListPreview,
  getAnalysisTypeLabel,
  getPlatformLabel,
  getRunStatusLabel,
  getRunStatusTagType,
} from "@/views/operation/ecom-data/shared";

defineOptions({ name: "EcomSelectionAnalysisTaskPage" });

const loading = ref(false);
const dialogVisible = ref(false);
const currentTask = ref<EcomSelectionAnalysisTask | null>(null);
const list = ref<EcomSelectionAnalysisTask[]>([]);
const total = ref(0);
const selectedIds = ref<string[]>([]);
const collectTasks = ref<EcomPlatformCollectTask[]>([]);
const collectRuns = ref<EcomPlatformCollectRun[]>([]);
const triggeringTaskId = ref("");

const catalog = reactive(createEmptyEcomCollectCatalog());

const filters = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: "",
  analysisType: "",
});

const updateSelectedIds = (records: EcomSelectionAnalysisTask[] = []) => {
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

const getSourceSummary = (task: EcomSelectionAnalysisTask) => {
  const sourceConfig = task.sourceConfig || {};
  const parts = [
    Array.isArray(sourceConfig.taskIds) && sourceConfig.taskIds.length
      ? `任务 ${sourceConfig.taskIds.length} 个`
      : "",
    Array.isArray(sourceConfig.runIds) && sourceConfig.runIds.length
      ? `运行 ${sourceConfig.runIds.length} 次`
      : "",
    Array.isArray(sourceConfig.rawRecordIds) && sourceConfig.rawRecordIds.length
      ? `原始记录 ${sourceConfig.rawRecordIds.length} 条`
      : "",
    Array.isArray(sourceConfig.platforms) && sourceConfig.platforms.length
      ? `平台 ${formatListPreview(
        sourceConfig.platforms.map((item: string) => getPlatformLabel(catalog, item)),
        2,
      )}`
      : "",
    sourceConfig.keyword ? `关键词 ${sourceConfig.keyword}` : "",
    sourceConfig.requireDetail ? "仅详情数据" : "",
    sourceConfig.limit ? `样本 ${sourceConfig.limit}` : "",
  ].filter(Boolean);

  return parts.join(" | ") || "当前账号下全部采集原始数据";
};

const getOptionsSummary = (task: EcomSelectionAnalysisTask) => {
  const options = task.optionsData || {};
  const parts = [
    options.topN ? `Top ${options.topN}` : "",
    options.targetMarket ? options.targetMarket : "",
    Array.isArray(options.preferredPlatforms) && options.preferredPlatforms.length
      ? `优先 ${formatListPreview(
        options.preferredPlatforms.map((item: string) => getPlatformLabel(catalog, item)),
        2,
      )}`
      : "",
    options.targetPriceRange?.min != null || options.targetPriceRange?.max != null
      ? `价格 ${options.targetPriceRange?.min ?? "-"} ~ ${options.targetPriceRange?.max ?? "-"}`
      : "",
  ].filter(Boolean);

  return parts.join(" | ") || "使用默认热门选品参数";
};

const getResultSummary = (task: EcomSelectionAnalysisTask) => {
  const summary = task.lastResultSummary || {};
  return (
    summary?.overview?.summary ||
    summary?.errorMessage ||
    (Array.isArray(summary?.recommendedProducts) && summary.recommendedProducts.length
      ? `已推荐 ${summary.recommendedProducts.length} 个候选方向`
      : "-")
  );
};

const gridOptions = ref<VxeGridProps<EcomSelectionAnalysisTask>>({
  ...(commonGridOptions as VxeGridProps<EcomSelectionAnalysisTask>),
  rowConfig: {
    ...(commonGridOptions as any).rowConfig,
    keyField: "id",
  },
  checkboxConfig: {
    reserve: true,
  },
  columns: [
    { type: "checkbox", width: 48 },
    { title: "任务名称", field: "name", minWidth: 220, showOverflow: "tooltip" },
    {
      title: "类型",
      field: "analysisType",
      width: 110,
      slots: { default: "typeSlot" },
    },
    {
      title: "数据源范围",
      field: "sourceConfig",
      minWidth: 280,
      showOverflow: "tooltip",
      slots: { default: "sourceSlot" },
    },
    {
      title: "分析配置",
      field: "optionsData",
      minWidth: 260,
      showOverflow: "tooltip",
      slots: { default: "optionsSlot" },
    },
    {
      title: "最近运行",
      field: "lastRunStatus",
      width: 120,
      slots: { default: "lastRunSlot" },
    },
    {
      title: "结果摘要",
      field: "lastResultSummary",
      minWidth: 260,
      showOverflow: "tooltip",
      slots: { default: "summarySlot" },
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

const loadList = async () => {
  loading.value = true;
  try {
    const data = await getEcomSelectionAnalysisTaskList(filters);
    applyListData(data);
  } finally {
    loading.value = false;
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [catalogData, taskListData, collectTaskData, collectRunData] = await Promise.all([
      getEcomPlatformCollectCatalog(),
      getEcomSelectionAnalysisTaskList(filters),
      getEcomPlatformCollectTaskList({ pageNo: 1, pageSize: 100 }),
      getEcomPlatformCollectRunList({ pageNo: 1, pageSize: 100 }),
    ]);
    applyCatalog(catalogData);
    applyListData(taskListData);
    collectTasks.value = Array.isArray(collectTaskData?.list) ? collectTaskData.list : [];
    collectRuns.value = Array.isArray(collectRunData?.list) ? collectRunData.list : [];
  } finally {
    loading.value = false;
  }
};

const openTaskDialog = (task?: EcomSelectionAnalysisTask) => {
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

const handleReset = async () => {
  filters.pageNo = 1;
  filters.keyword = "";
  filters.analysisType = "";
  await loadList();
};

const handleCheckboxChange = ({ records }: { records: EcomSelectionAnalysisTask[] }) => {
  updateSelectedIds(records);
};

const handleCheckboxAll = ({ records }: { records: EcomSelectionAnalysisTask[] }) => {
  updateSelectedIds(records);
};

const handleOperationCommand = (command: string, row: EcomSelectionAnalysisTask) => {
  switch (command) {
    case "trigger":
      void handleTriggerTask(row);
      break;
    case "edit":
      openTaskDialog(row);
      break;
    case "delete":
      void handleDelete(row);
      break;
  }
};

const handleTriggerTask = async (row: EcomSelectionAnalysisTask) => {
  if (triggeringTaskId.value) {
    return;
  }

  triggeringTaskId.value = row.id;
  const loadingMessage = ElMessage({
    type: "info",
    message: `正在提交分析：${row.name}`,
    duration: 0,
    showClose: true,
  });

  try {
    const result = await triggerEcomSelectionAnalysisTask(row.id);
    loadingMessage.close();
    ElNotification({
      title: result?.status === "failed" ? "分析失败" : "分析已开始",
      type: result?.status === "failed" ? "warning" : "success",
      duration: 5000,
      message: result?.id
        ? `结果记录：${result.id}${result.errorMessage ? `，${result.errorMessage}` : ""}`
        : "任务已触发，请前往分析结果查看",
    });
    await loadList();
  } catch (error: any) {
    loadingMessage.close();
    ElMessage.error(error?.message || "触发失败");
  } finally {
    triggeringTaskId.value = "";
  }
};

const handleDelete = async (row: EcomSelectionAnalysisTask) => {
  try {
    await ElMessageBox.confirm(
      `确认删除分析任务「${row.name}」吗？将同步清理关联分析结果记录。`,
      "提示",
      { type: "warning" },
    );
    await deleteEcomSelectionAnalysisTask(row.id);
    ElMessage.success("分析任务已删除");
    await loadList();
  } catch { }
};

const handleBatchDelete = async () => {
  if (!selectedIds.value.length) return;
  try {
    await ElMessageBox.confirm(
      `确认批量删除 ${selectedIds.value.length} 个分析任务吗？将同步清理关联分析结果记录。`,
      "提示",
      { type: "warning" },
    );
    await batchDeleteEcomSelectionAnalysisTask(selectedIds.value);
    ElMessage.success("批量删除成功");
    await loadList();
  } catch { }
};

onMounted(() => {
  void loadData();
});

onActivated(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
:deep(.ecom-data-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.ecom-data-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.ecom-data-page .list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

:deep(.ecom-data-page .list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}

.resource-toolbar__title {
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
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

.table-meta-text {
  color: var(--el-text-color-secondary);
}
</style>
