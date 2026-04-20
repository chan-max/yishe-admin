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
                <template #platformSceneSlot="{ row }">
                  <div class="table-stack">
                    <span>{{ getPlatformLabel(catalog, getRawPlatform(row)) }}</span>
                    <span class="table-meta-text">
                      {{ getTaskTypeLabel(catalog, getRawPlatform(row), getRawTaskType(row)) }}
                    </span>
                  </div>
                </template>

                <template #summarySlot="{ row }">
                  <span class="table-meta-text">{{ getRawSummaryMessage(row) }}</span>
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
                          <el-dropdown-item command="detail">
                            <el-icon><View /></el-icon>
                            <span>详情</span>
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
      :title="detailTitle"
      class="ecom-raw-detail-dialog"
      @closed="handleDetailClosed"
    >
      <div v-loading="detailLoading" class="ecom-raw-detail-dialog__body">
        <PlatformRawRecordDetail
          v-if="currentDetail"
          :record="currentDetail"
          :catalog="catalog"
        />
        <el-empty v-else description="暂无详情数据" />
      </div>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, View } from "@element-plus/icons-vue";
import type { VxeGridProps } from "vxe-table";
import {
  batchDeleteEcomPlatformRawRecord,
  deleteEcomPlatformRawRecord,
  getEcomPlatformRawRecordDetail,
  getEcomPlatformRawRecordList,
  type EcomPlatformRawRecord,
} from "@/api/operation/ecomPlatformCollect";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import PlatformRawRecordDetail from "./components/raw-detail/PlatformRawRecordDetail.vue";
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

defineOptions({ name: "EcomPlatformCollectRawPage" });

const route = useRoute();
const loading = ref(false);
const detailLoading = ref(false);
const detailVisible = ref(false);
const detailTitle = ref("原始数据详情");
const total = ref(0);
const list = ref<EcomPlatformRawRecord[]>([]);
const currentDetail = ref<EcomPlatformRawRecord | null>(null);
const selectedIds = ref<string[]>([]);

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
      formatter: ({ row }) => row.runId || "-",
    },
    {
      title: "平台 / 任务类型",
      field: "collectData",
      width: 160,
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
      formatter: ({ row }) => getRawRecordsCount(row),
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
      formatter: ({ row }) => getSnapshotCount(row.snapshotData || row.collectData),
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
    case "detail":
      void openDetail(row);
      break;
    case "delete":
      void handleDelete(row);
      break;
  }
};

const openDetail = async (row: EcomPlatformRawRecord) => {
  detailLoading.value = true;
  detailVisible.value = true;
  detailTitle.value = `原始数据详情 · ${row.runId || row.id}`;
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
};

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

.mono {
  font-family:
    "SFMono-Regular",
    "Cascadia Code",
    "Source Code Pro",
    monospace;
}

:deep(.ecom-raw-detail-dialog.el-dialog.is-fullscreen) {
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
}

:deep(.ecom-raw-detail-dialog .el-dialog__header) {
  padding: 14px 18px 10px;
}

:deep(.ecom-raw-detail-dialog .el-dialog__body) {
  height: calc(100vh - 52px);
  padding: 0 18px 18px;
  overflow: hidden;
}

.ecom-raw-detail-dialog__body {
  height: 100%;
  overflow: auto;
}
</style>
