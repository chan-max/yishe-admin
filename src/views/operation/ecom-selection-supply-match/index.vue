<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="ecom-data-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="filters" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col :xs="24" :sm="12" :md="8" :lg="8">
                <el-form-item label="任务名称 / 创建人">
                  <el-input
                    v-model="filters.keyword"
                    clearable
                    placeholder="搜索任务名称 / 创建人"
                    @keyup.enter="handleSearch"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item label="任务类型">
                  <el-select v-model="filters.matchType" clearable placeholder="全部类型">
                    <el-option label="找同款" value="supply_match" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" @click="handleSearch">查询</el-button>
              <el-button size="small" @click="handleReset">重置</el-button>
              <el-button size="small" type="primary" @click="openTaskDialog()">
                新建任务
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
        <div
          class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat"
        >
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid
                v-bind="gridOptions"
                :data="tableData"
                :loading="loading"
                @checkbox-change="handleCheckboxChange"
                @checkbox-all="handleCheckboxAll"
              >
                <template #typeSlot="{ row }">
                  <el-tag size="small" type="info">
                    {{ getSupplyMatchTypeLabel(row.matchType) }}
                  </el-tag>
                </template>

                <template #sourceSlot="{ row }">
                  <span class="table-meta-text">{{ getSourceSummary(row) }}</span>
                </template>

                <template #optionsSlot="{ row }">
                  <div class="table-stack">
                    <span>{{ getOptionsSummary(row) }}</span>
                    <span class="table-meta-text">
                      截图：{{ row.optionsData?.captureSnapshots ? "开启" : "关闭" }}
                    </span>
                  </div>
                </template>

                <template #lastRunSlot="{ row }">
                  <div class="table-stack">
                    <el-tag
                      v-if="row.lastRunStatus"
                      size="small"
                      :type="getRunStatusTagType(row.lastRunStatus)"
                    >
                      {{ getRunStatusLabel(row.lastRunStatus) }}
                    </el-tag>
                    <span v-else class="table-meta-text">未执行</span>
                    <span class="table-meta-text">
                      {{ formatDateTime(row.lastRunAt) }}
                    </span>
                  </div>
                </template>

                <template #summarySlot="{ row }">
                  <span class="table-meta-text">{{ getResultSummary(row) }}</span>
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

    <SupplyMatchTaskDialog
      v-model="dialogVisible"
      :task="currentTask"
      :analysis-runs="analysisRuns"
      :preset-analysis-run-id="presetAnalysisRunId"
      :preset-source-item-ids="presetSourceItemIds"
      @success="handleDialogSuccess"
    />

    <TaskExecutionTriggerDialog
      v-model="triggerDialogVisible"
      :platform="triggerTaskRecord?.optionsData?.supplierPlatforms?.[0] || ''"
      task-type="supply_match"
      :submitting="triggeringTaskId === (triggerTaskRecord?.id || '')"
      @confirm="handleTriggerConfirm"
    />
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox, ElNotification } from "element-plus";
import { Delete, Edit, VideoPlay } from "@element-plus/icons-vue";
import type { VxeGridProps } from "vxe-table";
import {
  batchDeleteEcomSelectionSupplyMatchTask,
  deleteEcomSelectionSupplyMatchTask,
  getEcomSelectionSupplyMatchTaskList,
  triggerEcomSelectionSupplyMatchTask,
  type EcomSelectionSupplyMatchTask,
} from "@/api/operation/ecomSelectionSupplyMatch";
import {
  getEcomSelectionAnalysisRunList,
  type EcomSelectionAnalysisRun,
} from "@/api/operation/ecomSelectionAnalysis";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import TaskExecutionTriggerDialog from "@/components/TaskExecutionTriggerDialog.vue";
import SupplyMatchTaskDialog from "./components/SupplyMatchTaskDialog.vue";
import {
  formatDateTime,
  formatListPreview,
  getRunStatusLabel,
  getRunStatusTagType,
  getSupplyMatchTypeLabel,
  parseTextareaList,
} from "@/views/operation/ecom-data/shared";

defineOptions({ name: "EcomSelectionSupplyMatchTaskPage" });

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const dialogVisible = ref(false);
const currentTask = ref<EcomSelectionSupplyMatchTask | null>(null);
const list = ref<EcomSelectionSupplyMatchTask[]>([]);
const total = ref(0);
const selectedIds = ref<string[]>([]);
const analysisRuns = ref<EcomSelectionAnalysisRun[]>([]);
const triggeringTaskId = ref("");
const triggerDialogVisible = ref(false);
const triggerTaskRecord = ref<EcomSelectionSupplyMatchTask | null>(null);
const presetAnalysisRunId = ref("");
const presetSourceItemIds = ref<string[]>([]);

const filters = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: "",
  matchType: "",
});

const updateSelectedIds = (records: EcomSelectionSupplyMatchTask[] = []) => {
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

const getSourceSummary = (task: EcomSelectionSupplyMatchTask) => {
  const sourceConfig = task.sourceConfig || {};
  const parts = [
    sourceConfig.analysisRunId ? "来源：分析运行" : "",
    Array.isArray(sourceConfig.sourceItemIds) && sourceConfig.sourceItemIds.length
      ? `来源商品 ${sourceConfig.sourceItemIds.length} 个`
      : "",
    Array.isArray(sourceConfig.rawRecordIds) && sourceConfig.rawRecordIds.length
      ? `原始记录 ${sourceConfig.rawRecordIds.length} 个`
      : "",
    Array.isArray(sourceConfig.keywordSeeds) && sourceConfig.keywordSeeds.length
      ? `关键词种子 ${sourceConfig.keywordSeeds.length} 个`
      : "",
  ].filter(Boolean);

  return parts.join(" | ") || "未配置来源";
};

const getOptionsSummary = (task: EcomSelectionSupplyMatchTask) => {
  const options = task.optionsData || {};
  const parts = [
    Array.isArray(options.supplierPlatforms) && options.supplierPlatforms.length
      ? `供货平台 ${formatListPreview(options.supplierPlatforms, 2)}`
      : "",
    options.maxSourceItems ? `来源 ${options.maxSourceItems}` : "",
    options.maxMatchesPerSource ? `每源匹配 ${options.maxMatchesPerSource}` : "",
    options.maxDetailPerSource != null ? `详情 ${options.maxDetailPerSource}` : "",
    options.queryCount ? `查询词 ${options.queryCount}` : "",
  ].filter(Boolean);

  return parts.join(" | ") || "使用默认找同款参数";
};

const getResultSummary = (task: EcomSelectionSupplyMatchTask) => {
  const summaryData = task.lastResultSummary?.summaryData || {};
  return (
    summaryData?.message ||
    task.lastResultSummary?.errorMessage ||
    (summaryData?.matchedItemsCount ? `已匹配 ${summaryData.matchedItemsCount} 个结果` : "-")
  );
};

const gridOptions = ref<VxeGridProps<EcomSelectionSupplyMatchTask>>({
  ...(commonGridOptions as VxeGridProps<EcomSelectionSupplyMatchTask>),
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
      field: "matchType",
      width: 110,
      slots: { default: "typeSlot" },
    },
    {
      title: "来源范围",
      field: "sourceConfig",
      minWidth: 240,
      showOverflow: "tooltip",
      slots: { default: "sourceSlot" },
    },
    {
      title: "执行参数",
      field: "optionsData",
      minWidth: 280,
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
      minWidth: 240,
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

const applyListData = (data: any) => {
  list.value = Array.isArray(data?.list) ? data.list : [];
  total.value = Number(data?.total || 0);
  selectedIds.value = [];
};

const loadList = async () => {
  loading.value = true;
  try {
    const data = await getEcomSelectionSupplyMatchTaskList(filters);
    applyListData(data);
  } finally {
    loading.value = false;
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [taskData, analysisRunData] = await Promise.all([
      getEcomSelectionSupplyMatchTaskList(filters),
      getEcomSelectionAnalysisRunList({ pageNo: 1, pageSize: 100 }),
    ]);
    applyListData(taskData);
    analysisRuns.value = Array.isArray(analysisRunData?.list) ? analysisRunData.list : [];
  } finally {
    loading.value = false;
  }
};

const consumeRoutePreset = async () => {
  const analysisRunId = String(route.query.analysisRunId || "").trim();
  if (!analysisRunId) {
    return;
  }

  presetAnalysisRunId.value = analysisRunId;
  presetSourceItemIds.value = parseTextareaList(String(route.query.sourceItemIds || "").trim());
  currentTask.value = null;
  dialogVisible.value = true;

  const nextQuery = { ...route.query };
  delete nextQuery.analysisRunId;
  delete nextQuery.sourceItemIds;
  delete nextQuery.productName;
  await router.replace({ query: nextQuery });
};

const openTaskDialog = (task?: EcomSelectionSupplyMatchTask) => {
  currentTask.value = task || null;
  if (task) {
    presetAnalysisRunId.value = "";
    presetSourceItemIds.value = [];
  }
  dialogVisible.value = true;
};

const handleDialogSuccess = async () => {
  currentTask.value = null;
  presetAnalysisRunId.value = "";
  presetSourceItemIds.value = [];
  await loadData();
};

const handleSearch = async () => {
  filters.pageNo = 1;
  await loadList();
};

const handleReset = async () => {
  filters.pageNo = 1;
  filters.keyword = "";
  filters.matchType = "";
  await loadList();
};

const handleCheckboxChange = ({ records }: { records: EcomSelectionSupplyMatchTask[] }) => {
  updateSelectedIds(records);
};

const handleCheckboxAll = ({ records }: { records: EcomSelectionSupplyMatchTask[] }) => {
  updateSelectedIds(records);
};

const handleOperationCommand = (command: string, row: EcomSelectionSupplyMatchTask) => {
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
    message: `正在提交找同款任务：${row.name}`,
    duration: 0,
    showClose: true,
  });

  try {
    const result = await triggerEcomSelectionSupplyMatchTask(row.id, {
      executionContext,
    });
    loadingMessage.close();
    triggerDialogVisible.value = false;
    triggerTaskRecord.value = null;
    ElNotification({
      title: result?.status === "failed" ? "任务启动失败" : "已提交执行",
      type: result?.status === "failed" ? "warning" : "success",
      duration: 5000,
      message: result?.id
        ? `运行记录：${result.id}${result.summaryData?.message ? `，${result.summaryData.message}` : ""}`
        : "任务已触发，请前往运行记录查看执行状态",
    });
    await loadList();
  } catch (error: any) {
    loadingMessage.close();
    ElMessage.error(error?.message || "触发失败");
  } finally {
    triggeringTaskId.value = "";
  }
};

const handleDelete = async (row: EcomSelectionSupplyMatchTask) => {
  try {
    await ElMessageBox.confirm(
      `确认删除找同款任务「${row.name}」吗？将同步清理运行记录与匹配结果。`,
      "提示",
      { type: "warning" },
    );
    await deleteEcomSelectionSupplyMatchTask(row.id);
    ElMessage.success("找同款任务已删除");
    await loadList();
  } catch {}
};

const handleBatchDelete = async () => {
  if (!selectedIds.value.length) return;
  try {
    await ElMessageBox.confirm(
      `确认批量删除 ${selectedIds.value.length} 个找同款任务吗？将同步清理关联运行与结果。`,
      "提示",
      { type: "warning" },
    );
    await batchDeleteEcomSelectionSupplyMatchTask(selectedIds.value);
    ElMessage.success("批量删除成功");
    await loadList();
  } catch {}
};

watch(
  () => route.query.analysisRunId,
  () => {
    void consumeRoutePreset();
  },
);

onMounted(async () => {
  await loadData();
  await consumeRoutePreset();
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

.table-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-meta-text {
  color: var(--el-text-color-secondary);
}
</style>
