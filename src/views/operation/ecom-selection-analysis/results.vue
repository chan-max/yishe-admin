<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="ecom-data-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="resource-toolbar">
            <div class="resource-toolbar__meta">
              <div class="resource-toolbar__title">选品分析结果</div>
              <div class="resource-toolbar__desc">
                展示每次分析真正落库的结果包，并保留从热门选品结果继续创建找同款任务的入口。
              </div>
            </div>
            <div class="resource-toolbar__actions">
              <el-button size="small" @click="loadData">刷新</el-button>
            </div>
          </div>

          <el-form :model="filters" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col :xs="24" :sm="12" :md="8" :lg="7">
                <el-form-item label="分析任务">
                  <el-select v-model="filters.taskId" clearable filterable placeholder="全部任务">
                    <el-option
                      v-for="item in taskOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item label="运行 ID">
                  <el-input v-model="filters.runId" clearable placeholder="运行 ID" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="分析类型">
                  <el-select v-model="filters.analysisType" clearable placeholder="全部类型">
                    <el-option label="热门选品" value="hot_selling_selection" />
                    <el-option label="POD 图案分析" value="pod_pattern_analysis" />
                    <el-option label="自定义提示词分析" value="custom_prompt_extract" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" @click="handleSearch">查询</el-button>
              <el-button size="small" @click="handleReset">重置</el-button>
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
                    {{ getAnalysisTypeLabel(row.analysisType) }}
                  </el-tag>
                </template>

                <template #statusSlot="{ row }">
                  <el-tag size="small" :type="getRunStatusTagType(row.runStatus)">
                    {{ getRunStatusLabel(row.runStatus) }}
                  </el-tag>
                </template>

                <template #summarySlot="{ row }">
                  <span class="table-meta-text">{{ getOverviewText(row) }}</span>
                </template>

                <template #operationSlot="{ row }">
                  <div class="flex justify-start">
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
                          <el-dropdown-item command="detail">
                            <el-icon><View /></el-icon>
                            <span>详情</span>
                          </el-dropdown-item>
                          <el-dropdown-item
                            v-if="row.analysisType === 'hot_selling_selection'"
                            command="supply-match"
                          >
                            <el-icon><Link /></el-icon>
                            <span>创建找同款</span>
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

    <el-dialog
      v-model="detailVisible"
      fullscreen
      destroy-on-close
      class="analysis-result-detail-dialog"
      title="分析结果详情"
      @closed="handleDetailClosed"
    >
      <div v-loading="detailLoading" class="detail-shell">
        <template v-if="currentDetail">
          <CompactNotice
            v-if="currentRunStatus === 'failed'"
            type="danger"
            title="本次分析执行失败"
            :description="currentRunErrorMessage || '请检查采集样本或 AI 模型配置后重试。'"
            class="detail-notice"
          />

          <div class="detail-overview-grid">
            <div class="detail-card detail-card--hero">
              <div class="detail-card__header">
                <div>
                  <div class="detail-card__title">
                    {{
                      currentDetail.task?.name ||
                      currentDetail.taskName ||
                      getAnalysisTypeLabel(currentDetail.analysisType)
                    }}
                  </div>
                  <div class="detail-card__subtitle">
                    {{ detailOverviewSummary }}
                  </div>
                </div>
                <div class="detail-chip-row">
                  <el-tag size="small" :type="getRunStatusTagType(currentRunStatus)">
                    {{ getRunStatusLabel(currentRunStatus) }}
                  </el-tag>
                  <el-tag size="small" type="info">
                    {{ getAnalysisTypeLabel(currentDetail.analysisType) }}
                  </el-tag>
                  <el-tag v-if="currentAiModel" size="small" type="info">
                    {{ currentAiModel }}
                  </el-tag>
                </div>
              </div>

              <div class="metric-grid">
                <div class="metric-card">
                  <span>样本数</span>
                  <strong>{{ detailSourceStats.itemCount || 0 }}</strong>
                </div>
                <div class="metric-card">
                  <span>{{ resultCountLabel }}</span>
                  <strong>{{ resultCountValue }}</strong>
                </div>
                <div class="metric-card">
                  <span>{{ supportMetricLabel }}</span>
                  <strong>{{ supportMetricValue }}</strong>
                </div>
                <div class="metric-card">
                  <span>结果时间</span>
                  <strong>{{
                    formatDateTime(currentDetail.analyzedAt || currentDetail.runFinishedAt)
                  }}</strong>
                </div>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-card__title">结果摘要</div>
              <div class="stats-list">
                <div class="stats-item">
                  <span>结果 ID</span>
                  <strong>{{ currentDetail.id || "-" }}</strong>
                </div>
                <div class="stats-item">
                  <span>运行 ID</span>
                  <strong>{{ currentDetail.runId || "-" }}</strong>
                </div>
                <div class="stats-item">
                  <span>任务数</span>
                  <strong>{{ detailSourceStats.taskCount || 0 }}</strong>
                </div>
                <div class="stats-item">
                  <span>运行数</span>
                  <strong>{{ detailSourceStats.runCount || 0 }}</strong>
                </div>
              </div>

              <div class="detail-mini-section" v-if="detailSourceStats.platformBreakdown?.length">
                <div class="detail-mini-section__title">平台分布</div>
                <div class="chip-list">
                  <el-tag
                    v-for="item in detailSourceStats.platformBreakdown"
                    :key="item.platform"
                    size="small"
                  >
                    {{ item.platform }} · {{ item.count }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-toolbar" v-if="currentDetail.analysisType === 'hot_selling_selection'">
            <el-button type="primary" @click="handleCreateSupplyMatchTask(currentDetail)">
              基于本次分析创建找同款任务
            </el-button>
          </div>

          <el-tabs>
            <el-tab-pane label="结果预览">
              <div v-if="recommendedProducts.length" class="simple-list">
                <div
                  v-for="item in recommendedProducts"
                  :key="item.rank || item.productName"
                  class="simple-card"
                >
                  <div class="simple-card__title">
                    #{{ item.rank || "-" }} {{ item.productName || "-" }}
                  </div>
                  <div class="simple-card__text">{{ item.selectionReason || "-" }}</div>
                </div>
              </div>

              <div v-else-if="customResultItems.length" class="simple-list">
                <div
                  v-for="(item, index) in customResultItems.slice(0, 12)"
                  :key="item?.id || item?.sourceUrl || index"
                  class="simple-card"
                >
                  <div class="simple-card__title">
                    {{ item?.title || item?.name || item?.label || `结果 ${index + 1}` }}
                  </div>
                  <div class="simple-card__text">{{ formatCustomResultCell(item) }}</div>
                </div>
              </div>

              <el-empty v-else description="暂无结果预览" />
            </el-tab-pane>

            <el-tab-pane label="来源样本">
              <pre class="json-preview">{{ formatJson(normalizedItems) }}</pre>
            </el-tab-pane>

            <el-tab-pane label="分析轨迹">
              <pre class="json-preview">{{ formatJson(analysisTrace) }}</pre>
            </el-tab-pane>

            <el-tab-pane label="结果 JSON">
              <pre class="json-preview">{{ formatJson(currentDetail.resultData) }}</pre>
            </el-tab-pane>

            <el-tab-pane label="完整 JSON">
              <pre class="json-preview">{{ detailPreviewText }}</pre>
            </el-tab-pane>
          </el-tabs>
        </template>

        <el-empty v-else description="暂无详情数据" />
      </div>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, Link, View } from "@element-plus/icons-vue";
import type { VxeGridProps } from "vxe-table";
import {
  batchDeleteEcomSelectionAnalysisResult,
  deleteEcomSelectionAnalysisResult,
  getEcomSelectionAnalysisResultDetail,
  getEcomSelectionAnalysisResultList,
  getEcomSelectionAnalysisTaskList,
  type EcomSelectionAnalysisResult,
  type EcomSelectionAnalysisTask,
} from "@/api/operation/ecomSelectionAnalysis";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import CompactNotice from "@/components/CompactNotice/index.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import {
  formatDateTime,
  formatJson,
  getAnalysisTypeLabel,
  getRunStatusLabel,
  getRunStatusTagType,
} from "@/views/operation/ecom-data/shared";

defineOptions({ name: "EcomSelectionAnalysisResultPage" });

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const detailLoading = ref(false);
const detailVisible = ref(false);
const total = ref(0);
const list = ref<EcomSelectionAnalysisResult[]>([]);
const tasks = ref<EcomSelectionAnalysisTask[]>([]);
const selectedIds = ref<string[]>([]);
const currentDetail = ref<EcomSelectionAnalysisResult | null>(null);

const filters = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: "",
  runId: "",
  analysisType: "",
});

const syncQueryToFilters = () => {
  filters.taskId = String(route.query.taskId || "").trim();
  filters.runId = String(route.query.runId || "").trim();
};

const updateSelectedIds = (records: EcomSelectionAnalysisResult[] = []) => {
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

const taskOptions = computed(() =>
  tasks.value.map((item) => ({ value: item.id, label: item.name })),
);

const currentRun = computed(() => currentDetail.value?.run || null);
const currentRunStatus = computed(
  () =>
    String(currentRun.value?.status || currentDetail.value?.runStatus || "").trim() || "success",
);
const currentRunErrorMessage = computed(
  () =>
    String(currentRun.value?.errorMessage || currentDetail.value?.runErrorMessage || "").trim() ||
    "",
);
const currentAiModel = computed(
  () => String(currentRun.value?.aiModel || currentDetail.value?.aiModel || "").trim() || "",
);

const detailSourceStats = computed(() => {
  return currentDetail.value?.sourceStatsData || currentDetail.value?.resultData?.sourceStats || {};
});

const recommendedProducts = computed(() => {
  return Array.isArray(currentDetail.value?.resultData?.recommendedProducts)
    ? currentDetail.value?.resultData?.recommendedProducts
    : [];
});

const customResultItems = computed(() => {
  const value = currentDetail.value?.resultData?.customResult?.items;
  return Array.isArray(value) ? value : [];
});

const normalizedItems = computed(() => {
  return Array.isArray(currentDetail.value?.normalizedItemsData)
    ? currentDetail.value?.normalizedItemsData
    : [];
});

const analysisTrace = computed(() => {
  return currentDetail.value?.resultData?.analysisTrace || {};
});

const resultCountLabel = computed(() =>
  currentDetail.value?.analysisType === "hot_selling_selection" ? "推荐商品" : "结果条数",
);
const resultCountValue = computed(() =>
  currentDetail.value?.analysisType === "hot_selling_selection"
    ? recommendedProducts.value.length
    : customResultItems.value.length,
);
const supportMetricLabel = computed(() =>
  currentDetail.value?.analysisType === "hot_selling_selection" ? "热门关键词" : "来源样本",
);
const supportMetricValue = computed(() =>
  currentDetail.value?.analysisType === "hot_selling_selection"
    ? Number(currentDetail.value?.resultData?.hotKeywords?.length || 0)
    : normalizedItems.value.length,
);

const detailOverviewSummary = computed(
  () =>
    currentDetail.value?.resultData?.overview?.summary ||
    currentRunErrorMessage.value ||
    "暂无结论摘要",
);

const detailPreviewText = computed(() => formatJson(currentDetail.value || {}));

const formatCustomResultCell = (value: unknown) => {
  if (value == null || value === "") {
    return "-";
  }
  if (typeof value === "object") {
    return formatJson(value);
  }
  return String(value);
};

const getOverviewText = (row: EcomSelectionAnalysisResult) => {
  const overviewSummary = String(row?.resultPreview?.overview?.summary || "").trim();
  if (overviewSummary) {
    return overviewSummary;
  }

  const customResultCount = Number(row?.resultPreview?.customResult?.itemCount || 0);
  if (customResultCount > 0) {
    return row.analysisType === "pod_pattern_analysis"
      ? `已输出 ${customResultCount} 条图案结果`
      : `已输出 ${customResultCount} 条自定义结果`;
  }

  const recommendedProductCount = Number(row?.resultPreview?.recommendedProductCount || 0);
  if (recommendedProductCount > 0) {
    return `已推荐 ${recommendedProductCount} 个候选方向`;
  }

  if (row?.sourceStatsData?.itemCount) {
    return `样本 ${row.sourceStatsData.itemCount} 个`;
  }

  if (row.runErrorMessage) {
    return row.runErrorMessage;
  }

  return "暂无摘要";
};

const getListResultCount = (row: EcomSelectionAnalysisResult) => {
  if (
    ["custom_prompt_extract", "pod_pattern_analysis"].includes(
      String(row.analysisType || "").trim(),
    )
  ) {
    return Number(row?.resultPreview?.customResult?.itemCount || 0);
  }

  return Number(row?.resultPreview?.recommendedProductCount || 0);
};

const gridOptions = ref<VxeGridProps<EcomSelectionAnalysisResult>>({
  ...(commonGridOptions as VxeGridProps<EcomSelectionAnalysisResult>),
  rowConfig: {
    ...(commonGridOptions as any).rowConfig,
    keyField: "id",
  },
  checkboxConfig: {
    reserve: true,
  },
  columns: [
    { type: "checkbox", width: 48 },
    { title: "任务名称", field: "taskName", minWidth: 220, showOverflow: "tooltip" },
    {
      title: "类型",
      field: "analysisType",
      width: 110,
      slots: { default: "typeSlot" },
    },
    {
      title: "运行状态",
      field: "runStatus",
      width: 100,
      slots: { default: "statusSlot" },
    },
    {
      title: "AI 模型",
      field: "aiModel",
      minWidth: 140,
      formatter: ({ row }) => row.aiModel || "-",
    },
    {
      title: "样本数",
      field: "sourceStatsData",
      width: 88,
      formatter: ({ row }) => Number(row.sourceStatsData?.itemCount || 0),
    },
    {
      title: "结果量",
      field: "resultPreview",
      width: 88,
      formatter: ({ row }) => getListResultCount(row),
    },
    {
      ...buildTimeColumn("结果时间", "analyzedAt", 180),
      formatter: ({ row }) =>
        formatDateTime((row as EcomSelectionAnalysisResult).analyzedAt || row.runFinishedAt),
    },
    {
      title: "摘要",
      field: "summaryText",
      minWidth: 220,
      showOverflow: "tooltip",
      slots: { default: "summarySlot" },
    },
    buildOperationColumn("operationSlot", 132),
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
    const data = await getEcomSelectionAnalysisResultList(filters);
    applyListData(data);
  } finally {
    loading.value = false;
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [resultData, taskData] = await Promise.all([
      getEcomSelectionAnalysisResultList(filters),
      getEcomSelectionAnalysisTaskList({ pageNo: 1, pageSize: 100 }),
    ]);
    applyListData(resultData);
    tasks.value = Array.isArray(taskData?.list) ? taskData.list : [];
  } finally {
    loading.value = false;
  }
};

const handleSearch = async () => {
  filters.pageNo = 1;
  await loadList();
};

const handleReset = async () => {
  filters.pageNo = 1;
  filters.taskId = "";
  filters.runId = "";
  filters.analysisType = "";
  await loadList();
};

const handleCheckboxChange = ({ records }: { records: EcomSelectionAnalysisResult[] }) => {
  updateSelectedIds(records);
};

const handleCheckboxAll = ({ records }: { records: EcomSelectionAnalysisResult[] }) => {
  updateSelectedIds(records);
};

const handleOperationCommand = (command: string, row: EcomSelectionAnalysisResult) => {
  switch (command) {
    case "detail":
      void openDetail(row);
      break;
    case "supply-match":
      void handleCreateSupplyMatchTask(row);
      break;
    case "delete":
      void handleDelete(row);
      break;
  }
};

const openDetail = async (row: EcomSelectionAnalysisResult) => {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    currentDetail.value = await getEcomSelectionAnalysisResultDetail(row.id);
  } finally {
    detailLoading.value = false;
  }
};

const handleDetailClosed = () => {
  currentDetail.value = null;
};

const handleCreateSupplyMatchTask = async (
  result: EcomSelectionAnalysisResult,
  sourceItemIds?: string[],
  productName?: string,
) => {
  if (result.analysisType !== "hot_selling_selection") {
    ElMessage.warning("只有“热门选品”分析结果可以继续创建找同款任务");
    return;
  }

  await router.push({
    name: "EcomSelectionSupplyMatchTaskPage",
    query: {
      analysisRunId: result.runId,
      sourceItemIds:
        Array.isArray(sourceItemIds) && sourceItemIds.length ? sourceItemIds.join(",") : "",
      productName: productName || "",
    },
  });
};

const handleDelete = async (row: EcomSelectionAnalysisResult) => {
  try {
    await ElMessageBox.confirm(
      "确认删除这条分析结果吗？删除后将无法再基于它创建找同款任务。",
      "提示",
      { type: "warning" },
    );
    await deleteEcomSelectionAnalysisResult(row.id);
    ElMessage.success("分析结果已删除");
    await loadList();
  } catch {}
};

const handleBatchDelete = async () => {
  if (!selectedIds.value.length) return;
  try {
    await ElMessageBox.confirm(`确认批量删除 ${selectedIds.value.length} 条分析结果吗？`, "提示", {
      type: "warning",
    });
    await batchDeleteEcomSelectionAnalysisResult(selectedIds.value);
    ElMessage.success("批量删除成功");
    await loadList();
  } catch {}
};

watch(
  () => route.query,
  () => {
    syncQueryToFilters();
    void loadData();
  },
);

onMounted(() => {
  syncQueryToFilters();
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

.resource-toolbar__desc,
.table-meta-text,
.detail-card__subtitle,
.simple-card__text {
  color: var(--el-text-color-secondary);
}

.detail-shell {
  min-height: calc(100vh - 180px);
}

.detail-notice {
  margin-bottom: 14px;
}

.detail-overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
  gap: 16px;
  margin-bottom: 18px;
}

.detail-card,
.simple-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
}

.detail-card--hero {
  background: var(--el-fill-color-lighter);
}

.detail-card__header,
.detail-chip-row,
.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-card__header {
  justify-content: space-between;
}

.detail-card__title,
.simple-card__title {
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.metric-grid,
.stats-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.metric-card,
.stats-item {
  padding: 12px;
  border-radius: 12px;
  background: var(--el-fill-color-light);
}

.metric-card span,
.stats-item span {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.metric-card strong,
.stats-item strong {
  display: block;
  margin-top: 4px;
  color: var(--el-text-color-primary);
  font-size: 18px;
  line-height: 1.4;
  word-break: break-word;
}

.detail-mini-section,
.detail-toolbar {
  margin-top: 14px;
}

.detail-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 14px;
}

.simple-list {
  display: grid;
  gap: 12px;
}

.json-preview {
  max-height: 520px;
  overflow: auto;
  margin: 0;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 1200px) {
  .detail-overview-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .metric-grid,
  .stats-list {
    grid-template-columns: 1fr;
  }

  .detail-card__header {
    flex-direction: column;
  }
}
</style>
