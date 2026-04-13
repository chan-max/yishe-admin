<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="ecom-collect-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="resource-toolbar">
            <div class="resource-toolbar__actions">
              <el-button size="small" @click="loadData">刷新</el-button>
            </div>
          </div>

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

    <el-dialog v-model="detailVisible" title="运行详情" width="760px" @closed="currentDetail = null">
      <div v-if="currentDetail" class="run-detail">
        <div class="run-detail__hero">
          <div class="run-detail__hero-main">
            <div class="run-detail__eyebrow">
              {{ getPlatformLabel(catalog, currentDetail.platform) }} /
              {{ getTaskTypeLabel(catalog, currentDetail.platform, currentDetail.taskType) }}
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
        </div>

        <div class="run-detail__section">
          <div class="run-detail__section-title">运行信息</div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="运行 ID">
              <span class="mono">{{ currentDetail.id || "-" }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="任务 ID">
              <span class="mono">{{ currentDetail.taskId || "-" }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="开始时间">
              {{ formatDateTime(currentDetail.startedAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="结束时间">
              {{ formatDateTime(currentDetail.finishedAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="执行机器">
              <span class="mono">{{ currentDetail.assignedMachineCode || "-" }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="客户端 ID">
              <span class="mono">{{ currentDetail.assignedClientId || "-" }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="命令 ID">
              <span class="mono">{{ currentDetail.commandId || "-" }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">
              {{ formatDateTime(currentDetail.updateTime) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="run-detail__section">
          <div class="run-detail__section-title">运行摘要</div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="摘要消息">
              {{ getRunSummaryMessage(currentDetail) }}
            </el-descriptions-item>
            <el-descriptions-item label="记录数">
              {{ getRunRecordsCount(currentDetail) }}
            </el-descriptions-item>
            <el-descriptions-item label="截图数">
              {{ getRunSnapshotCount(currentDetail) }}
            </el-descriptions-item>
            <el-descriptions-item label="摘要更新时间">
              {{ formatDateTime(currentDetail.summaryData?.updatedAt) }}
            </el-descriptions-item>
            <el-descriptions-item v-if="currentDetail.errorMessage" label="错误信息">
              {{ currentDetail.errorMessage }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
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
  getEcomPlatformCollectCatalog,
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
      getEcomPlatformCollectCatalog(),
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
}

.run-detail__hero,
.run-detail__section {
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
}

.run-detail__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.run-detail__hero-main {
  min-width: 0;
}

.run-detail__eyebrow {
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}

.run-detail__title {
  margin-top: 6px;
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 600;
  line-height: 1.5;
  word-break: break-word;
}

.run-detail__summary {
  margin-top: 8px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.7;
}

.run-detail__section-title {
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}
</style>
