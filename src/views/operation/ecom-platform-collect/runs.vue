<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="ecom-collect-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="filters" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
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
              <el-col :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="运行状态">
                  <el-select v-model="filters.status" clearable placeholder="运行状态">
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
                    <span>{{ getPlatformLabel(catalog, row.platform) }}</span>
                    <span class="table-meta-text">
                      {{ getTaskTypeLabel(catalog, row.platform, row.taskType) }}
                    </span>
                  </div>
                </template>

                <template #statusSlot="{ row }">
                  <el-tag size="small" :type="getRunStatusTagType(row.status)">
                    {{ getRunStatusLabel(row.status) }}
                  </el-tag>
                </template>

                <template #summarySlot="{ row }">
                  <span class="table-meta-text">
                    {{ getRunSummaryMessage(row) }}
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
      title="运行详情"
      fullscreen
      class="collect-run-detail-dialog"
      @closed="currentDetail = null"
    >
      <div v-if="currentDetail" class="run-detail">
        <section class="run-detail__hero">
          <div class="run-detail__hero-main">
            <div class="run-detail__eyebrow">
              <span>{{ getPlatformLabel(catalog, currentDetail.platform) }}</span>
              <span class="run-detail__dot"></span>
              <span>{{ getTaskTypeLabel(catalog, currentDetail.platform, currentDetail.taskType) }}</span>
            </div>
            <div class="run-detail__title">
              {{ currentDetail.taskName || "采集运行" }}
            </div>
            <div class="run-detail__summary">
              {{ getRunSummaryMessage(currentDetail) }}
            </div>
          </div>
          <el-tag size="small" :type="getRunStatusTagType(currentDetail.status)">
            {{ getRunStatusLabel(currentDetail.status) }}
          </el-tag>
        </section>

        <section class="run-detail__metrics">
          <div class="run-detail__metric run-detail__metric--accent">
            <span class="run-detail__metric-label">采集记录</span>
            <strong class="run-detail__metric-value">{{ getRunRecordsCount(currentDetail) }}</strong>
          </div>
          <div class="run-detail__metric">
            <span class="run-detail__metric-label">截图数量</span>
            <strong class="run-detail__metric-value">{{ getRunSnapshotCount(currentDetail) }}</strong>
          </div>
          <div class="run-detail__metric">
            <span class="run-detail__metric-label">执行机器</span>
            <strong class="run-detail__metric-value run-detail__metric-value--mono">
              {{ currentDetail.assignedMachineCode || "-" }}
            </strong>
          </div>
          <div class="run-detail__metric">
            <span class="run-detail__metric-label">更新时间</span>
            <strong class="run-detail__metric-value">
              {{ formatDateTime(currentDetail.updateTime) }}
            </strong>
          </div>
        </section>

        <section class="run-detail__content">
          <div class="run-detail__section run-detail__section--main">
            <div class="run-detail__section-title">摘要</div>
            <p class="run-detail__summary-text">{{ getRunSummaryMessage(currentDetail) }}</p>

            <div v-if="currentDetail.errorMessage" class="run-detail__notice">
              <span class="run-detail__notice-label">错误信息</span>
              <div class="run-detail__notice-text">{{ currentDetail.errorMessage }}</div>
            </div>
          </div>

          <div class="run-detail__side">
            <div class="run-detail__section">
              <div class="run-detail__section-title">运行信息</div>
              <div class="run-detail__info-list">
                <div class="run-detail__info-row">
                  <span class="run-detail__info-label">运行 ID</span>
                  <span class="run-detail__info-value run-detail__info-value--mono">
                    {{ currentDetail.id || "-" }}
                  </span>
                </div>
                <div class="run-detail__info-row">
                  <span class="run-detail__info-label">任务 ID</span>
                  <span class="run-detail__info-value run-detail__info-value--mono">
                    {{ currentDetail.taskId || "-" }}
                  </span>
                </div>
                <div class="run-detail__info-row">
                  <span class="run-detail__info-label">开始时间</span>
                  <span class="run-detail__info-value">
                    {{ formatDateTime(currentDetail.startedAt) }}
                  </span>
                </div>
                <div class="run-detail__info-row">
                  <span class="run-detail__info-label">结束时间</span>
                  <span class="run-detail__info-value">
                    {{ formatDateTime(currentDetail.finishedAt) }}
                  </span>
                </div>
                <div class="run-detail__info-row">
                  <span class="run-detail__info-label">客户端 ID</span>
                  <span class="run-detail__info-value run-detail__info-value--mono">
                    {{ currentDetail.assignedClientId || "-" }}
                  </span>
                </div>
                <div class="run-detail__info-row">
                  <span class="run-detail__info-label">命令 ID</span>
                  <span class="run-detail__info-value run-detail__info-value--mono">
                    {{ currentDetail.commandId || "-" }}
                  </span>
                </div>
                <div class="run-detail__info-row">
                  <span class="run-detail__info-label">摘要更新时间</span>
                  <span class="run-detail__info-value">
                    {{ formatDateTime(currentDetail.summaryData?.updatedAt) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <el-empty v-else description="暂无运行详情" />
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, View } from "@element-plus/icons-vue";
import type { VxeGridProps } from "vxe-table";
import {
  batchDeleteEcomPlatformCollectRun,
  deleteEcomPlatformCollectRun,
  getEcomPlatformCollectRunDetail,
  getEcomPlatformCollectRunList,
  type EcomPlatformCollectRun,
} from "@/api/operation/ecomPlatformCollect";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import {
  createEmptyEcomCollectCatalog,
  formatDateTime,
  getPlatformLabel,
  getRunStatusLabel,
  getRunStatusTagType,
  getTaskTypeLabel,
  getTaskTypeSchemas,
  loadEcomCollectCatalog,
} from "./shared";

defineOptions({ name: "EcomPlatformCollectRunPage" });

const loading = ref(false);
const total = ref(0);
const list = ref<EcomPlatformCollectRun[]>([]);
const selectedIds = ref<string[]>([]);
const detailVisible = ref(false);
const currentDetail = ref<EcomPlatformCollectRun | null>(null);

const catalog = reactive(createEmptyEcomCollectCatalog());

const filters = reactive({
  pageNo: 1,
  pageSize: 10,
  platform: "",
  taskType: "",
  status: "",
});

const availableTaskTypeOptions = computed(() =>
  getTaskTypeSchemas(catalog, filters.platform),
);

const updateSelectedIds = (records: EcomPlatformCollectRun[] = []) => {
  selectedIds.value = Array.from(
    new Set(records.map((item) => String(item.id || "").trim()).filter(Boolean)),
  );
};

const getRunSummaryMessage = (run: EcomPlatformCollectRun) =>
  String(run.summaryData?.message || run.errorMessage || "-");

const getRunRecordsCount = (run: EcomPlatformCollectRun) => {
  const count = Number(run.summaryData?.recordsCount);
  return Number.isFinite(count) && count >= 0 ? count : 0;
};

const getRunSnapshotCount = (run: EcomPlatformCollectRun) => {
  const count = Number(run.summaryData?.snapshotCount);
  return Number.isFinite(count) && count >= 0 ? count : 0;
};

const tableData = computed(() => {
  if (list.value.length <= filters.pageSize) {
    return list.value;
  }
  const start = (filters.pageNo - 1) * filters.pageSize;
  return list.value.slice(start, start + filters.pageSize);
});

const gridOptions = ref<VxeGridProps<EcomPlatformCollectRun>>({
  ...(commonGridOptions as VxeGridProps<EcomPlatformCollectRun>),
  rowConfig: {
    ...(commonGridOptions as any).rowConfig,
    keyField: "id",
  },
  checkboxConfig: {
    reserve: true,
  },
  columns: [
    { type: "checkbox", width: 48 },
    { title: "任务名称", field: "taskName", minWidth: 180, showOverflow: "tooltip" },
    {
      title: "平台 / 任务类型",
      field: "platform",
      width: 160,
      slots: { default: "platformSceneSlot" },
    },
    {
      title: "状态",
      field: "status",
      width: 100,
      slots: { default: "statusSlot" },
    },
    {
      title: "执行机器",
      field: "assignedMachineCode",
      minWidth: 160,
      showOverflow: "tooltip",
      formatter: ({ row }) => row.assignedMachineCode || "-",
    },
    {
      title: "记录数",
      field: "summaryData",
      width: 90,
      formatter: ({ row }) => getRunRecordsCount(row),
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
      field: "summaryText",
      minWidth: 260,
      showOverflow: "tooltip",
      slots: { default: "summarySlot" },
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
  const data = await getEcomPlatformCollectRunList(filters);
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
      getEcomPlatformCollectRunList(filters),
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
  filters.platform = "";
  filters.taskType = "";
  filters.status = "";
  await loadList();
};

const handleCheckboxChange = ({ records }: { records: EcomPlatformCollectRun[] }) => {
  updateSelectedIds(records);
};

const handleCheckboxAll = ({ records }: { records: EcomPlatformCollectRun[] }) => {
  updateSelectedIds(records);
};

const handleOperationCommand = (command: string, row: EcomPlatformCollectRun) => {
  switch (command) {
    case "detail":
      void openDetail(row);
      break;
    case "delete":
      void handleDelete(row);
      break;
  }
};

const openDetail = async (row: EcomPlatformCollectRun) => {
  const detail = await getEcomPlatformCollectRunDetail(row.id);
  currentDetail.value = detail;
  detailVisible.value = true;
};

const handleDelete = async (row: EcomPlatformCollectRun) => {
  try {
    await ElMessageBox.confirm(
      "确认删除这条运行记录吗？将同步删除本次运行产生的原始数据和截图文件。",
      "提示",
      { type: "warning" },
    );
    await deleteEcomPlatformCollectRun(row.id);
    ElMessage.success("运行记录已删除");
    await loadList();
  } catch {}
};

const handleBatchDelete = async () => {
  if (!selectedIds.value.length) return;
  try {
    await ElMessageBox.confirm(
      `确认批量删除 ${selectedIds.value.length} 条运行记录吗？将同步删除原始数据和截图文件。`,
      "提示",
      { type: "warning" },
    );
    await batchDeleteEcomPlatformCollectRun(selectedIds.value);
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

.run-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100vh - 132px);
}

:deep(.collect-run-detail-dialog .el-dialog) {
  border-radius: 0;
}

:deep(.collect-run-detail-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 18px 24px 0;
}

:deep(.collect-run-detail-dialog .el-dialog__body) {
  padding: 18px 24px 24px;
  overflow: hidden;
}

.run-detail__hero,
.run-detail__section {
  border: 1px solid var(--el-border-color-lighter);
  padding: 18px 20px;
  border-radius: 16px;
}

.run-detail__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.run-detail__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.run-detail__metric {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.run-detail__metric--accent .run-detail__metric-value {
  color: var(--el-color-primary);
}

.run-detail__metric-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.run-detail__metric-value {
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
  word-break: break-word;
}

.run-detail__metric-value--mono,
.run-detail__info-value--mono {
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  font-size: 13px;
}

.run-detail__hero-main {
  min-width: 0;
}

.run-detail__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}

.run-detail__dot {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  border: 1px solid var(--el-text-color-placeholder);
}

.run-detail__title {
  margin-top: 6px;
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 600;
  line-height: 1.35;
  word-break: break-word;
}

.run-detail__summary {
  margin-top: 8px;
  max-width: 960px;
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1.7;
}

.run-detail__section-title {
  margin-bottom: 14px;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
}

.run-detail__content {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.9fr);
  gap: 18px;
  flex: 1;
  min-height: 0;
}

.run-detail__side {
  min-width: 0;
}

.run-detail__section--main,
.run-detail__side .run-detail__section {
  height: 100%;
  overflow: auto;
}

.run-detail__info-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.run-detail__info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.run-detail__info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.run-detail__info-label {
  flex: 0 0 88px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.run-detail__info-value {
  flex: 1;
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 1.7;
  text-align: right;
  word-break: break-word;
}

.run-detail__info-value--danger {
  color: var(--el-color-danger);
}

.run-detail__summary-text {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1.8;
  word-break: break-word;
}

.run-detail__notice {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.run-detail__notice-label {
  display: inline-block;
  color: var(--el-color-danger);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.run-detail__notice-text {
  margin-top: 8px;
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1.8;
  word-break: break-word;
}

@media (max-width: 768px) {
  :deep(.collect-run-detail-dialog .el-dialog) {
    width: 100vw !important;
  }

  :deep(.collect-run-detail-dialog .el-dialog__body) {
    padding: 16px;
    overflow: auto;
  }

  .run-detail__hero {
    flex-direction: column;
  }

  .run-detail__content,
  .run-detail__metrics {
    grid-template-columns: 1fr;
  }

  .run-detail__title {
    font-size: 22px;
  }

  .run-detail {
    min-height: auto;
  }

  .run-detail__info-row {
    flex-direction: column;
    gap: 6px;
  }

  .run-detail__info-label,
  .run-detail__info-value {
    flex: none;
    text-align: left;
  }
}
</style>
