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
                <template #taskNameSlot="{ row }">
                  <div class="primary-cell">
                    <strong class="primary-cell__title">{{ row.taskName || "采集运行" }}</strong>
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

                <template #statusSlot="{ row }">
                  <el-tag
                    size="small"
                    effect="plain"
                    class="status-pill"
                    :type="getRunStatusTagType(row.status)"
                  >
                    {{ getRunStatusLabel(row.status) }}
                  </el-tag>
                </template>

                <template #machineSlot="{ row }">
                  <span class="mono-inline">{{ row.assignedMachineCode || "-" }}</span>
                </template>

                <template #recordsSlot="{ row }">
                  <span
                    class="metric-badge"
                    :class="{ 'metric-badge--success': getRunRecordsCount(row) > 0 }"
                  >
                    {{ getRunRecordsCount(row) }}
                  </span>
                </template>

                <template #summarySlot="{ row }">
                  <span class="summary-line" :class="{ 'summary-line--error': row.errorMessage }">
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
      width="720px"
      align-center
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
            <div v-if="getRunSummaryMessage(currentDetail) !== '-'" class="run-detail__summary">
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
        </section>

        <section class="run-detail__section">
          <div class="run-detail__info-list">
            <div class="run-detail__info-row">
              <span class="run-detail__info-label">运行 ID</span>
              <span class="run-detail__info-value run-detail__info-value--mono">
                {{ currentDetail.id || "-" }}
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
          </div>
        </section>

        <section v-if="currentDetail.errorMessage" class="run-detail__notice">
          <span class="run-detail__notice-label">错误信息</span>
          <div class="run-detail__notice-text">{{ currentDetail.errorMessage }}</div>
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
    {
      title: "任务名称",
      field: "taskName",
      minWidth: 240,
      showOverflow: "tooltip",
      slots: { default: "taskNameSlot" },
    },
    {
      title: "平台 / 任务类型",
      field: "platform",
      width: 300,
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
      slots: { default: "machineSlot" },
    },
    {
      title: "记录数",
      field: "summaryData",
      width: 90,
      align: "center",
      slots: { default: "recordsSlot" },
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
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
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
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
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
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.primary-cell__meta {
  overflow: hidden;
  font-size: 10px;
  line-height: 1.2;
  color: var(--el-text-color-placeholder);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mono-text,
.mono-inline {
  font-family: "JetBrains Mono", SFMono-Regular, Consolas, monospace;
}

.mono-inline {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  font-size: 11px;
  line-height: 1.35;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  vertical-align: middle;
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
  max-width: 100%;
  min-height: 20px;
  padding: 0 7px;
  font-size: 11px;
  line-height: 1.2;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  background: color-mix(in srgb, var(--el-fill-color-light) 72%, transparent);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  align-items: center;
}

.info-chip--platform {
  font-weight: 600;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border-color: color-mix(in srgb, var(--el-color-primary) 34%, var(--el-border-color));
}

.info-chip--task {
  overflow: hidden;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
}

.status-pill {
  font-weight: 600;
}

.metric-badge {
  display: inline-flex;
  height: 22px;
  min-width: 28px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-fill-color) 76%, transparent);
  border-radius: 999px;
  align-items: center;
  justify-content: center;
}

.metric-badge--success {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}

.summary-line {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.35;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.summary-line--error {
  color: var(--el-color-danger);
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
  padding: 18px 24px 0;
  margin-right: 0;
}

:deep(.collect-run-detail-dialog .el-dialog__body) {
  padding: 18px 24px 24px;
  overflow: hidden;
}

.run-detail__hero,
.run-detail__section {
  padding: 18px 20px;
  border: 1px solid var(--el-border-color-lighter);
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
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.run-detail__metric-value {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.run-detail__metric-value--mono,
.run-detail__info-value--mono {
  font-family: "JetBrains Mono", SFMono-Regular, Consolas, monospace;
  font-size: 13px;
}

.run-detail__hero-main {
  min-width: 0;
}

.run-detail__eyebrow {
  display: inline-flex;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  align-items: center;
  gap: 8px;
}

.run-detail__dot {
  width: 4px;
  height: 4px;
  border: 1px solid var(--el-text-color-placeholder);
  border-radius: 999px;
}

.run-detail__title {
  margin-top: 6px;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.run-detail__summary {
  max-width: 960px;
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.run-detail__section-title {
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
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
  padding-bottom: 0;
  border-bottom: none;
}

.run-detail__info-label {
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
  flex: 0 0 88px;
}

.run-detail__info-value {
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  text-align: right;
  word-break: break-word;
  flex: 1;
}

.run-detail__info-value--danger {
  color: var(--el-color-danger);
}

.run-detail__summary-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
  word-break: break-word;
}

.run-detail__notice {
  padding-top: 18px;
  margin-top: 22px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.run-detail__notice-label {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-color-danger);
}

.run-detail__notice-text {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
  word-break: break-word;
}

@media (width <= 768px) {
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
