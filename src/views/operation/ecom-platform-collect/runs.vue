<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="ecom-collect-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="resource-toolbar">
            <div class="resource-toolbar__meta">
              <div class="resource-toolbar__title">电商采集运行记录</div>
              <div class="resource-toolbar__desc">
                跟踪每次手动执行的状态、执行客户端和采集摘要，并支持批量清理历史运行。
              </div>
            </div>
            <div class="resource-toolbar__actions">
              <el-button size="small" @click="loadData">刷新</el-button>
              <el-button
                size="small"
                type="danger"
                plain
                :disabled="!selectedIds.length"
                @click="handleBatchDelete"
              >
                批量删除 ({{ selectedIds.length }})
              </el-button>
            </div>
          </div>

          <el-form :model="filters" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="平台">
                  <el-select v-model="filters.platform" clearable placeholder="平台">
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
                :data="list"
                :loading="loading"
                @checkbox-change="handleCheckboxChange"
                @checkbox-all="handleCheckboxAll"
              >
                <template #platformSceneSlot="{ row }">
                  <div class="table-stack">
                    <span>{{ getPlatformLabel(catalog, row.platform) }}</span>
                    <span class="table-meta-text">
                      {{ getSceneLabel(catalog, row.collectScene) }}
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
                    {{ row.summaryData?.message || row.errorMessage || "-" }}
                  </span>
                </template>

                <template #operationSlot="{ row }">
                  <div class="flex justify-start gap-3">
                    <el-button link type="primary" size="small" @click="openDetail(row)">
                      详情
                    </el-button>
                    <el-button link type="primary" size="small" @click="viewRawRecords(row)">
                      原始数据
                    </el-button>
                    <el-button link type="danger" size="small" @click="handleDelete(row)">
                      删除
                    </el-button>
                  </div>
                </template>
              </vxe-grid>
            </div>
          </div>

          <div class="list-page-table-panel__pagination--flat">
            <el-pagination
              background
              layout="total, prev, pager, next"
              :total="total"
              :page-size="filters.pageSize"
              :current-page="filters.pageNo"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </template>
    </ListPageLayout>

    <el-dialog v-model="detailVisible" title="运行详情" width="760px">
      <pre class="json-preview">{{ detailContent }}</pre>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
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
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import {
  createEmptyEcomCollectCatalog,
  formatDateTime,
  formatJson,
  getPlatformLabel,
  getRunStatusLabel,
  getRunStatusTagType,
  getSceneLabel,
} from "./shared";

defineOptions({ name: "EcomPlatformCollectRunPage" });

const router = useRouter();
const loading = ref(false);
const total = ref(0);
const list = ref<EcomPlatformCollectRun[]>([]);
const selectedIds = ref<string[]>([]);
const detailVisible = ref(false);
const detailContent = ref("");

const catalog = reactive(createEmptyEcomCollectCatalog());

const filters = reactive({
  pageNo: 1,
  pageSize: 10,
  platform: "",
  status: "",
});

const updateSelectedIds = (records: EcomPlatformCollectRun[] = []) => {
  selectedIds.value = Array.from(
    new Set(records.map((item) => String(item.id || "").trim()).filter(Boolean)),
  );
};

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
      title: "平台 / 场景",
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
      formatter: ({ row }) => Number(row.summaryData?.recordsCount || 0),
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
    buildOperationColumn("operationSlot", 180),
  ],
});

const loadCatalog = async () => {
  const data = await getEcomPlatformCollectCatalog();
  catalog.platforms = Array.isArray(data?.platforms) ? data.platforms : [];
  catalog.scenes = Array.isArray(data?.scenes) ? data.scenes : [];
};

const loadList = async () => {
  loading.value = true;
  try {
    const data = await getEcomPlatformCollectRunList(filters);
    list.value = Array.isArray(data?.list) ? data.list : [];
    total.value = Number(data?.total || 0);
    selectedIds.value = [];
  } finally {
    loading.value = false;
  }
};

const loadData = async () => {
  await loadCatalog();
  await loadList();
};

const handleSearch = async () => {
  filters.pageNo = 1;
  await loadList();
};

const handleReset = async () => {
  filters.pageNo = 1;
  filters.platform = "";
  filters.status = "";
  await loadList();
};

const handlePageChange = (page: number) => {
  filters.pageNo = page;
  void loadList();
};

const handleCheckboxChange = ({ records }: { records: EcomPlatformCollectRun[] }) => {
  updateSelectedIds(records);
};

const handleCheckboxAll = ({ records }: { records: EcomPlatformCollectRun[] }) => {
  updateSelectedIds(records);
};

const openDetail = async (row: EcomPlatformCollectRun) => {
  const detail = await getEcomPlatformCollectRunDetail(row.id);
  detailContent.value = formatJson(detail);
  detailVisible.value = true;
};

const viewRawRecords = async (row: EcomPlatformCollectRun) => {
  await router.push({
    path: "/ecom-platform-collect/raw-records",
    query: {
      runId: row.id,
    },
  });
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

.json-preview {
  max-height: 560px;
  overflow: auto;
  margin: 0;
  padding: 16px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
