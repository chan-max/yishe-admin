<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="ecom-data-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="filters" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col :xs="24" :sm="12" :md="8" :lg="8">
                <el-form-item label="任务">
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
              <el-col :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="运行状态">
                  <el-select v-model="filters.status" clearable placeholder="全部状态">
                    <el-option label="排队中" value="queued" />
                    <el-option label="已分配" value="assigned" />
                    <el-option label="运行中" value="running" />
                    <el-option label="成功" value="success" />
                    <el-option label="失败" value="failed" />
                    <el-option label="跳过" value="skipped" />
                    <el-option label="终止" value="terminated" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="类型">
                  <el-select v-model="filters.matchType" clearable placeholder="全部类型">
                    <el-option label="找同款" value="supply_match" />
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
                <template #statusSlot="{ row }">
                  <el-tag size="small" :type="getRunStatusTagType(row.status)">
                    {{ getRunStatusLabel(row.status) }}
                  </el-tag>
                </template>

                <template #summarySlot="{ row }">
                  <span class="table-meta-text">{{ getSummaryText(row) }}</span>
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
                          <el-dropdown-item command="results">
                            <el-icon><List /></el-icon>
                            <span>查看结果</span>
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
      class="supply-run-detail-dialog"
      title="找同款运行详情"
      @closed="handleDetailClosed"
    >
      <div v-loading="detailLoading" class="detail-shell">
        <template v-if="currentDetail">
          <CompactNotice
            v-if="currentDetail.status === 'failed'"
            type="danger"
            title="本次找同款执行失败"
            :description="
              currentDetail.errorMessage ||
              currentDetail.summaryData?.message ||
              '请检查客户端浏览器自动化环境后重试。'
            "
            class="detail-notice"
          />

          <div class="detail-overview-grid">
            <div class="detail-card detail-card--hero">
              <div class="detail-card__header">
                <div>
                  <div class="detail-card__title">
                    {{ currentDetail.task?.name || currentDetail.taskName || "-" }}
                  </div>
                  <div class="detail-card__subtitle">
                    {{ currentDetail.summaryData?.message || "暂无运行摘要" }}
                  </div>
                </div>
                <div class="detail-chip-row">
                  <el-tag size="small" :type="getRunStatusTagType(currentDetail.status)">
                    {{ getRunStatusLabel(currentDetail.status) }}
                  </el-tag>
                  <el-tag
                    v-for="platform in currentDetail.summaryData?.supplierPlatforms || []"
                    :key="platform"
                    size="small"
                    type="info"
                  >
                    {{ platform }}
                  </el-tag>
                </div>
              </div>

              <div class="metric-grid">
                <div class="metric-card">
                  <span>来源商品</span>
                  <strong>{{
                    currentDetail.summaryData?.sourceSummary?.sourceCount ||
                    currentDetail.sourceItemsData?.length ||
                    0
                  }}</strong>
                </div>
                <div class="metric-card">
                  <span>匹配结果</span>
                  <strong>{{
                    currentDetail.summaryData?.matchedItemsCount || currentDetail.items?.length || 0
                  }}</strong>
                </div>
                <div class="metric-card">
                  <span>命中来源</span>
                  <strong>{{ currentDetail.summaryData?.matchedSourceCount || 0 }}</strong>
                </div>
                <div class="metric-card">
                  <span>执行机器</span>
                  <strong>{{
                    currentDetail.assignedMachineCode ||
                    currentDetail.summaryData?.machineCode ||
                    "-"
                  }}</strong>
                </div>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-card__title">来源摘要</div>
              <div
                class="detail-mini-section"
                v-if="currentDetail.summaryData?.sourceSummary?.platformBreakdown?.length"
              >
                <div class="detail-mini-section__title">来源平台</div>
                <div class="chip-list">
                  <el-tag
                    v-for="item in currentDetail.summaryData?.sourceSummary?.platformBreakdown"
                    :key="item.platform"
                    size="small"
                  >
                    {{ item.platform }} · {{ item.count }}
                  </el-tag>
                </div>
              </div>
              <div class="detail-mini-section" v-if="currentDetail.summaryData?.debugMeta">
                <div class="detail-mini-section__title">调试信息</div>
                <pre class="mini-json">{{ formatJson(currentDetail.summaryData?.debugMeta) }}</pre>
              </div>
            </div>
          </div>

          <div class="detail-toolbar">
            <el-button type="primary" @click="openResultsPage(currentDetail)">
              查看全部匹配结果
            </el-button>
          </div>

          <el-tabs>
            <el-tab-pane :label="`匹配结果 (${matchedItems.length})`">
              <div v-if="matchedItems.length" class="result-list">
                <div v-for="item in matchedItems" :key="item.id" class="result-card">
                  <div class="result-card__header">
                    <div>
                      <div class="result-card__title">
                        {{ item.title || item.supplierRecordKey || "-" }}
                      </div>
                      <div class="result-card__meta">
                        <span>{{ item.supplierPlatform || "-" }}</span>
                        <span>{{ item.priceText || "-" }}</span>
                        <span>{{ item.shopName || "-" }}</span>
                      </div>
                    </div>
                    <div class="detail-chip-row">
                      <el-tag size="small" type="success">
                        分数 {{ item.matchScore ?? "-" }}
                      </el-tag>
                      <el-tag size="small" type="info"> 排名 {{ item.matchRank ?? "-" }} </el-tag>
                    </div>
                  </div>
                  <div class="result-card__compare">
                    来源：{{ item.sourceTitle || "-" }}
                    <span v-if="item.sourceQuery"> · 查询词：{{ item.sourceQuery }}</span>
                  </div>
                  <div class="result-card__actions">
                    <el-link
                      v-if="item.sourceUrl"
                      :href="item.sourceUrl"
                      target="_blank"
                      type="primary"
                    >
                      来源链接
                    </el-link>
                    <el-link
                      v-if="item.supplierUrl"
                      :href="item.supplierUrl"
                      target="_blank"
                      type="primary"
                    >
                      供货链接
                    </el-link>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无匹配结果" />
            </el-tab-pane>

            <el-tab-pane :label="`来源商品 (${sourceItems.length})`">
              <div v-if="sourceItems.length" class="source-list">
                <div
                  v-for="item in sourceItems"
                  :key="item.sourceRecordId || item.id"
                  class="source-card"
                >
                  <div class="source-card__title">
                    {{ item.sourceTitle || item.title || item.sourceRecordId || "-" }}
                  </div>
                  <div class="source-card__meta">
                    <span>{{ item.sourcePlatform || item.platform || "-" }}</span>
                    <span>{{ item.priceText || "-" }}</span>
                    <span v-if="item.recommendedRank != null"
                      >推荐位次 {{ item.recommendedRank }}</span
                    >
                  </div>
                  <div class="source-card__text">{{ item.summaryText || "-" }}</div>
                  <el-link
                    v-if="item.sourceUrl"
                    :href="item.sourceUrl"
                    target="_blank"
                    type="primary"
                  >
                    查看来源链接
                  </el-link>
                </div>
              </div>
              <el-empty v-else description="暂无来源商品" />
            </el-tab-pane>

            <el-tab-pane label="JSON">
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
import { computed, onActivated, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, List, View } from "@element-plus/icons-vue";
import type { VxeGridProps } from "vxe-table";
import {
  batchDeleteEcomSelectionSupplyMatchRun,
  deleteEcomSelectionSupplyMatchRun,
  getEcomSelectionSupplyMatchRunDetail,
  getEcomSelectionSupplyMatchRunList,
  getEcomSelectionSupplyMatchTaskList,
  type EcomSelectionSupplyMatchRun,
  type EcomSelectionSupplyMatchTask,
} from "@/api/operation/ecomSelectionSupplyMatch";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import CompactNotice from "@/components/CompactNotice/index.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import {
  formatDateTime,
  formatJson,
  getRunStatusLabel,
  getRunStatusTagType,
} from "@/views/operation/ecom-data/shared";

defineOptions({ name: "EcomSelectionSupplyMatchRunPage" });

const router = useRouter();
const loading = ref(false);
const detailLoading = ref(false);
const detailVisible = ref(false);
const total = ref(0);
const list = ref<EcomSelectionSupplyMatchRun[]>([]);
const tasks = ref<EcomSelectionSupplyMatchTask[]>([]);
const selectedIds = ref<string[]>([]);
const currentDetail = ref<EcomSelectionSupplyMatchRun | null>(null);

const filters = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: "",
  status: "",
  matchType: "",
});

const updateSelectedIds = (records: EcomSelectionSupplyMatchRun[] = []) => {
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

const matchedItems = computed(() => {
  return Array.isArray(currentDetail.value?.items) ? currentDetail.value?.items : [];
});

const sourceItems = computed(() => {
  return Array.isArray(currentDetail.value?.sourceItemsData)
    ? currentDetail.value?.sourceItemsData
    : [];
});

const detailPreviewText = computed(() => formatJson(currentDetail.value || {}));

const getSummaryText = (row: EcomSelectionSupplyMatchRun) => {
  return (
    row.summaryData?.message ||
    row.errorMessage ||
    (row.summaryData?.matchedItemsCount ? `匹配 ${row.summaryData.matchedItemsCount} 个结果` : "-")
  );
};

const gridOptions = ref<VxeGridProps<EcomSelectionSupplyMatchRun>>({
  ...(commonGridOptions as VxeGridProps<EcomSelectionSupplyMatchRun>),
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
      title: "状态",
      field: "status",
      width: 100,
      slots: { default: "statusSlot" },
    },
    {
      title: "来源数",
      field: "sourceCount",
      width: 88,
      formatter: ({ row }) => Number(row.summaryData?.sourceSummary?.sourceCount || 0),
    },
    {
      title: "匹配数",
      field: "matchedItemsCount",
      width: 88,
      formatter: ({ row }) => Number(row.summaryData?.matchedItemsCount || 0),
    },
    {
      title: "命中来源",
      field: "matchedSourceCount",
      width: 100,
      formatter: ({ row }) => Number(row.summaryData?.matchedSourceCount || 0),
    },
    {
      title: "执行机器",
      field: "assignedMachineCode",
      minWidth: 160,
      showOverflow: "tooltip",
      formatter: ({ row }) => row.assignedMachineCode || row.summaryData?.machineCode || "-",
    },
    {
      ...buildTimeColumn("开始时间", "startedAt", 180),
      formatter: ({ cellValue }) => formatDateTime(cellValue as string),
    },
    {
      ...buildTimeColumn("结束时间", "finishedAt", 180),
      formatter: ({ cellValue }) => formatDateTime(cellValue as string),
    },
    {
      title: "摘要",
      field: "summaryData",
      minWidth: 260,
      showOverflow: "tooltip",
      slots: { default: "summarySlot" },
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
    const data = await getEcomSelectionSupplyMatchRunList(filters);
    applyListData(data);
  } finally {
    loading.value = false;
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [runData, taskData] = await Promise.all([
      getEcomSelectionSupplyMatchRunList(filters),
      getEcomSelectionSupplyMatchTaskList({ pageNo: 1, pageSize: 100 }),
    ]);
    applyListData(runData);
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
  filters.status = "";
  filters.matchType = "";
  await loadList();
};

const handleCheckboxChange = ({ records }: { records: EcomSelectionSupplyMatchRun[] }) => {
  updateSelectedIds(records);
};

const handleCheckboxAll = ({ records }: { records: EcomSelectionSupplyMatchRun[] }) => {
  updateSelectedIds(records);
};

const handleOperationCommand = (command: string, row: EcomSelectionSupplyMatchRun) => {
  switch (command) {
    case "detail":
      void openDetail(row);
      break;
    case "results":
      void openResultsPage(row);
      break;
    case "delete":
      void handleDelete(row);
      break;
  }
};

const openDetail = async (row: EcomSelectionSupplyMatchRun) => {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    currentDetail.value = await getEcomSelectionSupplyMatchRunDetail(row.id);
  } finally {
    detailLoading.value = false;
  }
};

const handleDetailClosed = () => {
  currentDetail.value = null;
};

const openResultsPage = async (row: EcomSelectionSupplyMatchRun) => {
  await router.push({
    name: "EcomSelectionSupplyMatchItemPage",
    query: {
      runId: row.id,
      taskId: row.taskId,
    },
  });
};

const handleDelete = async (row: EcomSelectionSupplyMatchRun) => {
  try {
    await ElMessageBox.confirm(
      "确认删除这条找同款运行记录吗？将同步清理本次产生的匹配结果。",
      "提示",
      { type: "warning" },
    );
    await deleteEcomSelectionSupplyMatchRun(row.id);
    ElMessage.success("运行记录已删除");
    await loadList();
  } catch {}
};

const handleBatchDelete = async () => {
  if (!selectedIds.value.length) return;
  try {
    await ElMessageBox.confirm(`确认批量删除 ${selectedIds.value.length} 条运行记录吗？`, "提示", {
      type: "warning",
    });
    await batchDeleteEcomSelectionSupplyMatchRun(selectedIds.value);
    ElMessage.success("批量删除成功");
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

.table-meta-text {
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

.detail-card {
  padding: 18px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
}

.detail-card--hero {
  background: var(--el-fill-color-lighter);
}

.detail-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.detail-card__title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.detail-card__subtitle {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.detail-chip-row,
.chip-list,
.result-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.metric-card {
  padding: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.metric-card span {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.metric-card strong {
  display: block;
  margin-top: 6px;
  font-size: 18px;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.detail-mini-section {
  margin-top: 14px;
}

.detail-mini-section__title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.detail-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 14px;
}

.result-list,
.source-list {
  display: grid;
  gap: 14px;
}

.result-card,
.source-card {
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
}

.result-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.result-card__title,
.source-card__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--el-text-color-primary);
}

.result-card__meta,
.source-card__meta {
  display: flex;
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-wrap: wrap;
  gap: 12px;
}

.result-card__compare,
.source-card__text {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.result-card__actions {
  margin-top: 12px;
}

.mini-json,
.json-preview {
  padding: 14px;
  margin: 0;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  word-break: break-word;
  white-space: pre-wrap;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.json-preview {
  max-height: 560px;
}

@media (width <= 1200px) {
  .detail-overview-grid {
    grid-template-columns: 1fr;
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 768px) {
  .detail-card__header,
  .result-card__header {
    flex-direction: column;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
