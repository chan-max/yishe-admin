<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="ecom-collect-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="filters" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col :xs="24" :sm="12" :md="8" :lg="7">
                <el-form-item label="运行 ID / 任务名称">
                  <el-input
                    v-model="filters.keyword"
                    clearable
                    placeholder="搜索运行 ID / 任务名称"
                    @keyup.enter="handleSearch"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="5">
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
              <el-col :xs="24" :sm="12" :md="8" :lg="5">
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
              <el-col :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="任务 ID">
                  <el-input v-model="filters.taskId" clearable placeholder="任务 ID" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="运行 ID">
                  <el-input v-model="filters.runId" clearable placeholder="运行 ID" />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" @click="handleSearch">查询</el-button>
              <el-button size="small" @click="handleReset">重置</el-button>
              <el-button size="small" @click="loadData">刷新</el-button>
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
                <template #runIdSlot="{ row }">
                  <div class="primary-cell">
                    <strong class="primary-cell__title mono-text">{{ row.runId || "-" }}</strong>
                    <span class="primary-cell__meta mono-text">task {{ row.taskId || "-" }}</span>
                  </div>
                </template>

                <template #platformSceneSlot="{ row }">
                  <div class="inline-chip-list">
                    <span class="info-chip info-chip--platform">
                      {{ getPlatformLabel(catalog, getRawPlatform(row)) }}
                    </span>
                    <span class="info-chip info-chip--task mono-text">
                      {{ getRawTaskType(row) || "-" }}
                    </span>
                  </div>
                </template>

                <template #summarySlot="{ row }">
                  <span class="summary-line">{{ getRawSummaryMessage(row) }}</span>
                </template>

                <template #recordsSlot="{ row }">
                  <span
                    class="metric-badge"
                    :class="{ 'metric-badge--success': getRawRecordsCount(row) > 0 }"
                  >
                    {{ getRawRecordsCount(row) }}
                  </span>
                </template>

                <template #snapshotsSlot="{ row }">
                  <span
                    class="metric-badge metric-badge--muted"
                    :class="{ 'metric-badge--success': getSnapshotCount(row.snapshotData || row.collectData) > 0 }"
                  >
                    {{ getSnapshotCount(row.snapshotData || row.collectData) }}
                  </span>
                </template>

                <template #operationSlot="{ row }">
                  <div class="flex justify-start">
                    <el-dropdown
                      class="operation-dropdown"
                      placement="bottom-end"
                      @command="(command) => handleOperationCommand(String(command), row)"
                    >
                      <el-button
                        type="primary"
                        link
                        size="small"
                        class="operation-trigger-button"
                      >
                        操作
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item command="json">
                            <el-icon><View /></el-icon>
                            <span>查看 JSON</span>
                          </el-dropdown-item>
                          <el-dropdown-item command="snapshots">
                            <el-icon><Picture /></el-icon>
                            <span>查看截图</span>
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
      v-model="jsonDialogVisible"
      title="完整 JSON"
      fullscreen
      append-to-body
      destroy-on-close
      class="ecom-raw-detail-dialog ecom-raw-detail-dialog--fullscreen"
      @closed="handleDetailClosed"
    >
      <div v-loading="detailLoading" class="ecom-raw-detail-dialog__body">
        <JsonPrettyViewer
          v-if="currentDetail"
          :value="currentDetail.collectData || {}"
          :deep="8"
          :show-double-quotes="false"
          :show-length="true"
        />
        <el-empty v-else description="暂无详情数据" />
      </div>
    </el-dialog>

    <el-dialog
      v-model="snapshotDialogVisible"
      title="执行截图"
      fullscreen
      append-to-body
      destroy-on-close
      class="ecom-raw-detail-dialog ecom-raw-detail-dialog--fullscreen"
      @closed="handleDetailClosed"
    >
      <div v-loading="detailLoading" class="ecom-raw-detail-dialog__body">
        <div v-if="snapshotItems.length" class="raw-detail-snapshot-grid">
          <div
            v-for="snapshot in snapshotItems"
            :key="`${snapshot.url || snapshot.path || snapshot.key || ''}`"
            class="raw-detail-snapshot-card"
          >
            <el-image
              v-if="snapshot.url"
              :src="snapshot.url"
              fit="cover"
              preview-teleported
              :preview-src-list="snapshotUrls"
              class="raw-detail-snapshot-image"
            />
            <div v-else class="raw-detail-snapshot-placeholder">本地截图未上传</div>
            <div class="raw-detail-snapshot-meta">
              <div>{{ formatDateTime(snapshot.createdAt) }}</div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无执行截图" />
      </div>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, Picture, View } from "@element-plus/icons-vue";
import type { VxeGridProps } from "vxe-table";
import {
  batchDeleteEcomPlatformRawRecord,
  deleteEcomPlatformRawRecord,
  getEcomPlatformRawRecordDetail,
  getEcomPlatformRawRecordList,
  type EcomPlatformRawRecord,
} from "@/api/operation/ecomPlatformCollect";
import JsonPrettyViewer from "@/components/JsonPrettyViewer.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import {
  createEmptyEcomCollectCatalog,
  formatDateTime,
  getPlatformLabel,
  getRawFinishedAt,
  getRawPlatform,
  getRawRecordsCount,
  getRawSummaryMessage,
  getRawTaskType,
  getSnapshotCount,
  getTaskTypeLabel,
  getTaskTypeSchemas,
  loadEcomCollectCatalog,
} from "./shared";
import { normalizeSnapshotItems } from "./components/raw-detail/helpers";

defineOptions({ name: "EcomPlatformCollectRawPage" });

const route = useRoute();
const loading = ref(false);
const detailLoading = ref(false);
const total = ref(0);
const list = ref<EcomPlatformRawRecord[]>([]);
const currentDetail = ref<EcomPlatformRawRecord | null>(null);
const selectedIds = ref<string[]>([]);
const jsonDialogVisible = ref(false);
const snapshotDialogVisible = ref(false);

const catalog = reactive(createEmptyEcomCollectCatalog());

const filters = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: "",
  platform: "",
  taskType: "",
  taskId: "",
  runId: "",
});

const availableTaskTypeOptions = computed(() =>
  getTaskTypeSchemas(catalog, filters.platform),
);

const syncQueryToFilters = () => {
  filters.runId = String(route.query.runId || "").trim();
  filters.taskId = String(route.query.taskId || "").trim();
  filters.platform = String(route.query.platform || "").trim();
  filters.taskType = String(route.query.taskType || "").trim();
};

const updateSelectedIds = (records: EcomPlatformRawRecord[] = []) => {
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

const gridOptions = ref<VxeGridProps<EcomPlatformRawRecord>>({
  ...(commonGridOptions as VxeGridProps<EcomPlatformRawRecord>),
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
      title: "运行 ID",
      field: "runId",
      minWidth: 220,
      showOverflow: "tooltip",
      slots: { default: "runIdSlot" },
    },
    {
      title: "平台 / 任务类型",
      field: "collectData",
      width: 300,
      slots: { default: "platformSceneSlot" },
    },
    {
      title: "执行摘要",
      field: "collectData",
      minWidth: 240,
      showOverflow: "tooltip",
      slots: { default: "summarySlot" },
    },
    {
      title: "记录数",
      field: "recordsCount",
      width: 90,
      align: "center",
      slots: { default: "recordsSlot" },
    },
    {
      ...buildTimeColumn("采集时间", "capturedAt", 180),
      formatter: ({ cellValue }) => formatDateTime(cellValue as string),
    },
    {
      ...buildTimeColumn("完成时间", "finishedAt", 180),
      formatter: ({ row }) => formatDateTime(getRawFinishedAt(row)),
    },
    {
      title: "截图数",
      field: "snapshotData",
      width: 80,
      align: "center",
      slots: { default: "snapshotsSlot" },
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
  const data = await getEcomPlatformRawRecordList(filters);
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
      getEcomPlatformRawRecordList(filters),
    ]);
    applyCatalog(catalogData);
    applyListData(listData);
  } finally {
    loading.value = false;
  }
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
  filters.taskId = "";
  filters.runId = "";
  await loadList();
};

const handleCheckboxChange = ({ records }: { records: EcomPlatformRawRecord[] }) => {
  updateSelectedIds(records);
};

const handleCheckboxAll = ({ records }: { records: EcomPlatformRawRecord[] }) => {
  updateSelectedIds(records);
};

const handleOperationCommand = (command: string, row: EcomPlatformRawRecord) => {
  switch (command) {
    case "json":
      void openDetail(row, "json");
      break;
    case "snapshots":
      void openDetail(row, "snapshots");
      break;
    case "delete":
      void handleDelete(row);
      break;
  }
};

const openDetail = async (row: EcomPlatformRawRecord, mode: "json" | "snapshots") => {
  detailLoading.value = true;
  jsonDialogVisible.value = mode === "json";
  snapshotDialogVisible.value = mode === "snapshots";
  try {
    const detail = await getEcomPlatformRawRecordDetail(row.id);
    currentDetail.value = {
      ...row,
      ...detail,
    };
  } finally {
    detailLoading.value = false;
  }
};

const handleDetailClosed = () => {
  currentDetail.value = null;
  detailLoading.value = false;
  jsonDialogVisible.value = false;
  snapshotDialogVisible.value = false;
};

const snapshotItems = computed(() =>
  currentDetail.value
    ? normalizeSnapshotItems(currentDetail.value.snapshotData || currentDetail.value.collectData)
    : [],
);

const snapshotUrls = computed(() =>
  snapshotItems.value.map((item) => String(item.url || "").trim()).filter(Boolean),
);

const handleDelete = async (row: EcomPlatformRawRecord) => {
  try {
    await ElMessageBox.confirm(
      "确认删除这条原始数据吗？将同步删除关联截图文件。",
      "提示",
      { type: "warning" },
    );
    await deleteEcomPlatformRawRecord(row.id);
    ElMessage.success("原始数据已删除");
    await loadList();
  } catch {}
};

const handleBatchDelete = async () => {
  if (!selectedIds.value.length) return;
  try {
    await ElMessageBox.confirm(
      `确认批量删除 ${selectedIds.value.length} 条原始数据吗？将同步删除关联截图文件。`,
      "提示",
      { type: "warning" },
    );
    await batchDeleteEcomPlatformRawRecord(selectedIds.value);
    ElMessage.success("批量删除成功");
    await loadList();
  } catch {}
};

watch(
  () => route.query,
  () => {
    syncQueryToFilters();
    void loadList();
  },
);

onMounted(() => {
  syncQueryToFilters();
  void loadData();
});

onActivated(() => {
  syncQueryToFilters();
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

.mono {
  font-family:
    "SFMono-Regular",
    "Cascadia Code",
    "Source Code Pro",
    monospace;
}

.mono-text {
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
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

.inline-chip-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}

.info-chip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 20px;
  padding: 0 7px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-fill-color-light) 72%, transparent);
  font-size: 11px;
  line-height: 1.2;
  white-space: nowrap;
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

.metric-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-fill-color) 76%, transparent);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.metric-badge--success {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}

.metric-badge--muted {
  color: var(--el-text-color-secondary);
}

.summary-line {
  overflow: hidden;
  display: inline-block;
  max-width: 100%;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.35;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
}

:deep(.ecom-raw-detail-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 16px 20px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.ecom-raw-detail-dialog .el-dialog__body) {
  padding: 16px 20px 20px;
}

:deep(.ecom-raw-detail-dialog--fullscreen.el-dialog.is-fullscreen) {
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
}

:deep(.ecom-raw-detail-dialog--fullscreen .el-dialog__body) {
  height: calc(100vh - 58px);
  overflow: auto;
}

.ecom-raw-detail-dialog__body {
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.raw-detail-snapshot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.raw-detail-snapshot-card {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.raw-detail-snapshot-image {
  width: 100%;
  height: 160px;
}

.raw-detail-snapshot-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 160px;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

.raw-detail-snapshot-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.6;
  word-break: break-word;
}

@media (max-width: 768px) {
  :deep(.ecom-raw-detail-dialog .el-dialog__header) {
    padding: 14px 16px 10px;
  }

  :deep(.ecom-raw-detail-dialog .el-dialog__body) {
    padding: 12px 16px 16px;
  }
}
</style>
