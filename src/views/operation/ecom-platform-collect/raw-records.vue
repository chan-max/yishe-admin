<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="ecom-collect-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="resource-toolbar">
            <div class="resource-toolbar__meta">
              <div class="resource-toolbar__title">电商采集原始数据</div>
              <div class="resource-toolbar__desc">
                保留平台原始返回、截图快照和回溯链接，详情展示按平台组件拆分维护。
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
              <el-col :xs="24" :sm="12" :md="8" :lg="7">
                <el-form-item label="记录标识 / 来源链接">
                  <el-input
                    v-model="filters.keyword"
                    clearable
                    placeholder="搜索 recordKey / 来源链接"
                    @keyup.enter="handleSearch"
                  />
                </el-form-item>
              </el-col>
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
                <el-form-item label="任务 ID">
                  <el-input v-model="filters.taskId" clearable placeholder="任务 ID" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="运行 ID">
                  <el-input v-model="filters.runId" clearable placeholder="运行 ID" />
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

                <template #recordKeySlot="{ row }">
                  <span class="mono">{{ row.recordKey || "-" }}</span>
                </template>

                <template #titleSlot="{ row }">
                  <span class="table-meta-text">{{ getRawTitle(row) }}</span>
                </template>

                <template #sourceUrlSlot="{ row }">
                  <el-link
                    v-if="getRawLink(row)"
                    :href="getRawLink(row)"
                    target="_blank"
                    type="primary"
                  >
                    {{ getShortUrl(getRawLink(row)) }}
                  </el-link>
                  <span v-else>-</span>
                </template>

                <template #operationSlot="{ row }">
                  <div class="flex justify-start gap-3">
                    <el-button link type="primary" size="small" @click="openDetail(row)">
                      详情
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

    <el-drawer
      v-model="detailVisible"
      size="960px"
      destroy-on-close
      :title="detailTitle"
    >
      <div v-loading="detailLoading">
        <PlatformRawRecordDetail
          v-if="currentDetail"
          :record="currentDetail"
          :catalog="catalog"
        />
        <el-empty v-else description="暂无详情数据" />
      </div>
    </el-drawer>
  </ContentWrap>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import type { VxeGridProps } from "vxe-table";
import {
  batchDeleteEcomPlatformRawRecord,
  deleteEcomPlatformRawRecord,
  getEcomPlatformCollectCatalog,
  getEcomPlatformRawRecordDetail,
  getEcomPlatformRawRecordList,
  type EcomPlatformRawRecord,
} from "@/api/operation/ecomPlatformCollect";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import PlatformRawRecordDetail from "./components/raw-detail/PlatformRawRecordDetail.vue";
import {
  createEmptyEcomCollectCatalog,
  formatDateTime,
  getPlatformLabel,
  getRawLink,
  getRawTitle,
  getSceneLabel,
  getShortUrl,
  getSnapshotCount,
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
  taskId: "",
  runId: "",
});

const syncQueryToFilters = () => {
  filters.runId = String(route.query.runId || "").trim();
  filters.taskId = String(route.query.taskId || "").trim();
  filters.platform = String(route.query.platform || "").trim();
};

const updateSelectedIds = (records: EcomPlatformRawRecord[] = []) => {
  selectedIds.value = Array.from(
    new Set(records.map((item) => String(item.id || "").trim()).filter(Boolean)),
  );
};

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
    { title: "任务名称", field: "taskName", minWidth: 160, showOverflow: "tooltip" },
    {
      title: "平台 / 场景",
      field: "platform",
      width: 160,
      slots: { default: "platformSceneSlot" },
    },
    {
      title: "记录标识",
      field: "recordKey",
      minWidth: 180,
      showOverflow: "tooltip",
      slots: { default: "recordKeySlot" },
    },
    {
      title: "原始摘要",
      field: "rawTitle",
      minWidth: 260,
      showOverflow: "tooltip",
      slots: { default: "titleSlot" },
    },
    {
      title: "来源链接",
      field: "sourceUrl",
      minWidth: 240,
      showOverflow: "tooltip",
      slots: { default: "sourceUrlSlot" },
    },
    {
      ...buildTimeColumn("采集时间", "capturedAt", 180),
      formatter: ({ cellValue }) => formatDateTime(cellValue as string),
    },
    {
      title: "截图数",
      field: "snapshotData",
      width: 80,
      formatter: ({ row }) => getSnapshotCount(row.snapshotData),
    },
    buildOperationColumn("operationSlot", 120),
  ],
});

const loadCatalog = async () => {
  const data = await getEcomPlatformCollectCatalog();
  catalog.platforms = Array.isArray(data?.platforms) ? data.platforms : [];
  catalog.scenes = Array.isArray(data?.scenes) ? data.scenes : [];
  catalog.defaults = data?.defaults || catalog.defaults;
};

const loadList = async () => {
  loading.value = true;
  try {
    const data = await getEcomPlatformRawRecordList(filters);
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
  filters.keyword = "";
  filters.platform = "";
  filters.taskId = "";
  filters.runId = "";
  await loadList();
};

const handlePageChange = (page: number) => {
  filters.pageNo = page;
  void loadList();
};

const handleCheckboxChange = ({ records }: { records: EcomPlatformRawRecord[] }) => {
  updateSelectedIds(records);
};

const handleCheckboxAll = ({ records }: { records: EcomPlatformRawRecord[] }) => {
  updateSelectedIds(records);
};

const openDetail = async (row: EcomPlatformRawRecord) => {
  detailLoading.value = true;
  detailVisible.value = true;
  detailTitle.value = `原始数据详情 · ${row.recordKey || row.id}`;
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
</script>

<style scoped lang="scss">
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

.mono {
  font-family:
    "SFMono-Regular",
    "Cascadia Code",
    "Source Code Pro",
    monospace;
}
</style>
