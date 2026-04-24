<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="ecom-data-page" sidebar-width="320px">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="resource-toolbar">
            <div class="resource-toolbar__actions">
              <el-button size="small" @click="loadData">刷新</el-button>
            </div>
          </div>

          <el-form :model="filters" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
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
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item label="运行 ID">
                  <el-input v-model="filters.runId" clearable placeholder="运行 ID" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="供货平台">
                  <el-select
                    v-model="filters.supplierPlatform"
                    clearable
                    filterable
                    placeholder="全部平台"
                  >
                    <el-option
                      v-for="item in supplierPlatformOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="7">
                <el-form-item label="关键词">
                  <el-input
                    v-model="filters.keyword"
                    clearable
                    placeholder="匹配标题 / 链接 / 查询词"
                    @keyup.enter="handleSearch"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" @click="handleSearch">查询</el-button>
              <el-button size="small" @click="handleReset">重置</el-button>
            </div>
          </el-form>
        </div>
      </template>

      <template #sidebar>
        <div class="sidebar-card">
          <div class="sidebar-card__title">运行摘要</div>

          <template v-if="activeRun">
            <div class="sidebar-metrics">
              <div class="sidebar-metric">
                <span>状态</span>
                <strong>{{ getRunStatusLabel(activeRun.status) }}</strong>
              </div>
              <div class="sidebar-metric">
                <span>来源商品</span>
                <strong>{{
                  activeRun.summaryData?.sourceSummary?.sourceCount ||
                  activeRun.sourceItemsData?.length ||
                  0
                }}</strong>
              </div>
              <div class="sidebar-metric">
                <span>匹配结果</span>
                <strong>{{
                  activeRun.summaryData?.matchedItemsCount || activeRun.items?.length || 0
                }}</strong>
              </div>
              <div class="sidebar-metric">
                <span>命中来源</span>
                <strong>{{ activeRun.summaryData?.matchedSourceCount || 0 }}</strong>
              </div>
            </div>

            <div class="sidebar-block">
              <div class="sidebar-block__label">说明</div>
              <div class="sidebar-block__text">
                {{ activeRun.summaryData?.message || "-" }}
              </div>
            </div>

            <div class="sidebar-block" v-if="activeRun.summaryData?.supplierPlatforms?.length">
              <div class="sidebar-block__label">供货平台</div>
              <div class="chip-list">
                <el-tag
                  v-for="platform in activeRun.summaryData?.supplierPlatforms"
                  :key="platform"
                  size="small"
                  type="info"
                >
                  {{ platform }}
                </el-tag>
              </div>
            </div>

            <div
              class="sidebar-block"
              v-if="activeRun.summaryData?.sourceSummary?.platformBreakdown?.length"
            >
              <div class="sidebar-block__label">来源平台</div>
              <div class="chip-list">
                <el-tag
                  v-for="item in activeRun.summaryData?.sourceSummary?.platformBreakdown"
                  :key="item.platform"
                  size="small"
                >
                  {{ item.platform }} · {{ item.count }}
                </el-tag>
              </div>
            </div>
          </template>

          <el-empty v-else description="输入运行 ID 后可查看本次结果摘要" />
        </div>
      </template>

      <template #table>
        <div
          class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat"
        >
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid v-bind="gridOptions" :data="tableData" :loading="loading">
                <template #sourceSlot="{ row }">
                  <div class="table-stack">
                    <span>{{ row.sourceTitle || "-" }}</span>
                    <span class="table-meta-text">
                      {{ row.sourcePlatform || "-" }}
                    </span>
                    <el-link
                      v-if="row.sourceUrl"
                      :href="row.sourceUrl"
                      target="_blank"
                      type="primary"
                    >
                      来源链接
                    </el-link>
                  </div>
                </template>

                <template #supplierSlot="{ row }">
                  <div class="table-stack">
                    <span>{{ row.title || "-" }}</span>
                    <span class="table-meta-text">
                      {{ row.supplierPlatform || "-" }} · {{ row.priceText || "-" }}
                    </span>
                    <span class="table-meta-text">{{ row.shopName || "-" }}</span>
                  </div>
                </template>

                <template #scoreSlot="{ row }">
                  <div class="table-stack">
                    <el-tag size="small" type="success">
                      {{ row.matchScore ?? "-" }}
                    </el-tag>
                    <span class="table-meta-text">排名 {{ row.matchRank ?? "-" }}</span>
                  </div>
                </template>

                <template #snapshotSlot="{ row }">
                  <span class="table-meta-text">
                    {{ getSnapshotCount(row.snapshotData) }}
                  </span>
                </template>

                <template #operationSlot="{ row }">
                  <div class="flex justify-start">
                    <el-button type="primary" link size="small" @click="openDetail(row)">
                      详情
                    </el-button>
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
      width="1180px"
      destroy-on-close
      class="match-item-detail-dialog"
      title="同款结果详情"
      @closed="handleDetailClosed"
    >
      <div v-loading="detailLoading" class="detail-shell">
        <template v-if="currentDetail">
          <div class="detail-overview-grid">
            <div class="detail-card">
              <div class="detail-card__title">来源商品</div>
              <div class="detail-card__subtitle">{{ currentDetail.sourceTitle || "-" }}</div>
              <div class="detail-meta-grid">
                <div class="detail-meta-item">
                  <span>平台</span>
                  <strong>{{ currentDetail.sourcePlatform || "-" }}</strong>
                </div>
                <div class="detail-meta-item">
                  <span>来源记录</span>
                  <strong>{{ currentDetail.sourceRecordId || "-" }}</strong>
                </div>
                <div class="detail-meta-item">
                  <span>查询词</span>
                  <strong>{{ currentDetail.sourceQuery || "-" }}</strong>
                </div>
                <div class="detail-meta-item">
                  <span>来源链接</span>
                  <strong>{{ getShortUrl(currentDetail.sourceUrl) }}</strong>
                </div>
              </div>
              <el-link
                v-if="currentDetail.sourceUrl"
                :href="currentDetail.sourceUrl"
                target="_blank"
                type="primary"
              >
                打开来源链接
              </el-link>
            </div>

            <div class="detail-card detail-card--hero">
              <div class="detail-card__title">供货商品</div>
              <div class="detail-card__subtitle">{{ currentDetail.title || "-" }}</div>
              <div class="detail-meta-grid">
                <div class="detail-meta-item">
                  <span>平台</span>
                  <strong>{{ currentDetail.supplierPlatform || "-" }}</strong>
                </div>
                <div class="detail-meta-item">
                  <span>价格</span>
                  <strong>{{ currentDetail.priceText || "-" }}</strong>
                </div>
                <div class="detail-meta-item">
                  <span>店铺</span>
                  <strong>{{ currentDetail.shopName || "-" }}</strong>
                </div>
                <div class="detail-meta-item">
                  <span>匹配分数</span>
                  <strong>{{ currentDetail.matchScore ?? "-" }}</strong>
                </div>
              </div>

              <div class="detail-image-row" v-if="currentDetail.imageUrl">
                <el-image
                  :src="currentDetail.imageUrl"
                  fit="cover"
                  :preview-src-list="[currentDetail.imageUrl]"
                  preview-teleported
                  class="detail-image"
                />
              </div>

              <div class="detail-link-row">
                <el-link
                  v-if="currentDetail.supplierUrl"
                  :href="currentDetail.supplierUrl"
                  target="_blank"
                  type="primary"
                >
                  打开供货链接
                </el-link>
              </div>
            </div>
          </div>

          <div class="detail-card detail-card--compare" v-if="currentDetail.comparisonData">
            <div class="detail-card__title">对比信息</div>
            <pre class="mini-json">{{ formatJson(currentDetail.comparisonData) }}</pre>
          </div>

          <el-tabs>
            <el-tab-pane label="列表信息">
              <pre class="json-preview">{{ formatJson(currentDetail.listingData) }}</pre>
            </el-tab-pane>

            <el-tab-pane label="详情信息">
              <pre class="json-preview">{{ formatJson(currentDetail.detailData) }}</pre>
            </el-tab-pane>

            <el-tab-pane :label="`截图 (${detailSnapshots.length})`">
              <div v-if="detailSnapshots.length" class="snapshot-list">
                <div
                  v-for="(item, index) in detailSnapshots"
                  :key="`${getSnapshotLabel(item, index)}-${index}`"
                  class="snapshot-card"
                >
                  <div class="snapshot-card__title">{{ getSnapshotLabel(item, index) }}</div>
                  <el-link
                    v-if="getSnapshotUrl(item)"
                    :href="getSnapshotUrl(item)"
                    target="_blank"
                    type="primary"
                  >
                    打开截图
                  </el-link>
                  <pre class="mini-json">{{ formatJson(item) }}</pre>
                </div>
              </div>
              <el-empty v-else description="暂无截图数据" />
            </el-tab-pane>

            <el-tab-pane label="原始回传">
              <pre class="json-preview">{{ formatJson(currentDetail.rawPayload) }}</pre>
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
import { useRoute } from "vue-router";
import {
  getEcomSelectionSupplyMatchItemDetail,
  getEcomSelectionSupplyMatchItemList,
  getEcomSelectionSupplyMatchRunDetail,
  getEcomSelectionSupplyMatchTaskList,
  type EcomSelectionSupplyMatchItem,
  type EcomSelectionSupplyMatchRun,
  type EcomSelectionSupplyMatchTask,
} from "@/api/operation/ecomSelectionSupplyMatch";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import type { VxeGridProps } from "vxe-table";
import {
  formatDateTime,
  formatJson,
  getRunStatusLabel,
  getShortUrl,
  getSnapshotLabel,
  getSnapshotUrl,
  normalizeSnapshotList,
} from "@/views/operation/ecom-data/shared";

defineOptions({ name: "EcomSelectionSupplyMatchItemPage" });

const route = useRoute();
const loading = ref(false);
const detailLoading = ref(false);
const detailVisible = ref(false);
const total = ref(0);
const list = ref<EcomSelectionSupplyMatchItem[]>([]);
const tasks = ref<EcomSelectionSupplyMatchTask[]>([]);
const activeRun = ref<EcomSelectionSupplyMatchRun | null>(null);
const currentDetail = ref<EcomSelectionSupplyMatchItem | null>(null);

const filters = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: "",
  runId: "",
  supplierPlatform: "",
  keyword: "",
});

const syncQueryToFilters = () => {
  filters.taskId = String(route.query.taskId || "").trim();
  filters.runId = String(route.query.runId || "").trim();
  filters.supplierPlatform = String(route.query.supplierPlatform || "").trim();
};

const taskOptions = computed(() =>
  tasks.value.map((item) => ({ value: item.id, label: item.name })),
);

const supplierPlatformOptions = computed(() => {
  const values = new Set<string>();
  if (filters.supplierPlatform) {
    values.add(filters.supplierPlatform);
  }
  list.value.forEach((item) => {
    if (item.supplierPlatform) {
      values.add(item.supplierPlatform);
    }
  });
  return Array.from(values).map((value) => ({ value, label: value }));
});

const tableData = computed(() => {
  if (list.value.length <= filters.pageSize) {
    return list.value;
  }
  const start = (filters.pageNo - 1) * filters.pageSize;
  return list.value.slice(start, start + filters.pageSize);
});

const detailSnapshots = computed(() => normalizeSnapshotList(currentDetail.value?.snapshotData));

const getSnapshotCount = (value: any) => normalizeSnapshotList(value).length;

const gridOptions = ref<VxeGridProps<EcomSelectionSupplyMatchItem>>({
  ...(commonGridOptions as VxeGridProps<EcomSelectionSupplyMatchItem>),
  rowConfig: {
    ...(commonGridOptions as any).rowConfig,
    keyField: "id",
  },
  columns: [
    {
      title: "来源商品",
      field: "sourceTitle",
      minWidth: 220,
      showOverflow: "tooltip",
      slots: { default: "sourceSlot" },
    },
    {
      title: "供货商品",
      field: "title",
      minWidth: 260,
      showOverflow: "tooltip",
      slots: { default: "supplierSlot" },
    },
    {
      title: "匹配分数",
      field: "matchScore",
      width: 110,
      slots: { default: "scoreSlot" },
    },
    {
      title: "查询词",
      field: "sourceQuery",
      minWidth: 160,
      showOverflow: "tooltip",
      formatter: ({ row }) => row.sourceQuery || "-",
    },
    {
      title: "截图数",
      field: "snapshotData",
      width: 86,
      slots: { default: "snapshotSlot" },
    },
    {
      ...buildTimeColumn("采集时间", "capturedAt", 180),
      formatter: ({ cellValue }) => formatDateTime(cellValue as string),
    },
    buildOperationColumn("operationSlot", 88),
  ],
});

const applyListData = (data: any) => {
  list.value = Array.isArray(data?.list) ? data.list : [];
  total.value = Number(data?.total || 0);
};

const syncRunSummary = async () => {
  const runId = String(filters.runId || "").trim();
  if (!runId) {
    activeRun.value = null;
    return;
  }

  try {
    activeRun.value = await getEcomSelectionSupplyMatchRunDetail(runId);
  } catch {
    activeRun.value = null;
  }
};

const loadList = async () => {
  loading.value = true;
  try {
    const data = await getEcomSelectionSupplyMatchItemList(filters);
    applyListData(data);
    await syncRunSummary();
  } finally {
    loading.value = false;
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [itemData, taskData] = await Promise.all([
      getEcomSelectionSupplyMatchItemList(filters),
      getEcomSelectionSupplyMatchTaskList({ pageNo: 1, pageSize: 100 }),
    ]);
    applyListData(itemData);
    tasks.value = Array.isArray(taskData?.list) ? taskData.list : [];
    await syncRunSummary();
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
  filters.supplierPlatform = "";
  filters.keyword = "";
  await loadList();
};

const openDetail = async (row: EcomSelectionSupplyMatchItem) => {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    currentDetail.value = await getEcomSelectionSupplyMatchItemDetail(row.id);
  } finally {
    detailLoading.value = false;
  }
};

const handleDetailClosed = () => {
  currentDetail.value = null;
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

.sidebar-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-fill-color-lighter);
}

.sidebar-card__title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
}

.sidebar-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.sidebar-metric {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.sidebar-metric span {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.sidebar-metric strong {
  display: block;
  margin-top: 4px;
  color: var(--el-text-color-primary);
  font-size: 18px;
}

.sidebar-block {
  margin-top: 14px;
}

.sidebar-block__label {
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.sidebar-block__text,
.table-meta-text {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.7;
}

.table-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-shell {
  min-height: 420px;
}

.detail-overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.detail-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
}

.detail-card--hero {
  background: var(--el-fill-color-lighter);
}

.detail-card--compare {
  margin-bottom: 14px;
}

.detail-card__title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
}

.detail-card__subtitle {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.detail-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 14px 0;
}

.detail-meta-item {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
}

.detail-meta-item span {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.detail-meta-item strong {
  display: block;
  margin-top: 4px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1.6;
}

.detail-image-row {
  margin-top: 12px;
}

.detail-image {
  width: 100px;
  height: 100px;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}

.detail-link-row {
  margin-top: 12px;
}

.snapshot-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.snapshot-card {
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.snapshot-card__title {
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.mini-json,
.json-preview {
  overflow: auto;
  margin: 10px 0 0;
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

.json-preview {
  max-height: 460px;
}

@media (max-width: 1200px) {
  .detail-overview-grid,
  .snapshot-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .sidebar-metrics,
  .detail-meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>
