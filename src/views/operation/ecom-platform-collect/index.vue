<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="ecom-collect-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="resource-toolbar">
            <div class="resource-toolbar__meta">
              <div class="resource-toolbar__title">电商采集任务</div>
              <div class="resource-toolbar__desc">
                这里只保留任务需求定义和手动执行入口，不再承载调度与机器绑定逻辑。
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
              <el-button size="small" type="primary" @click="openTaskDialog()">
                新建任务
              </el-button>
            </div>
          </div>

          <el-form :model="filters" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col :xs="24" :sm="12" :md="8" :lg="8">
                <el-form-item label="任务名称 / 平台">
                  <el-input
                    v-model="filters.keyword"
                    clearable
                    placeholder="搜索任务名称 / 平台"
                    @keyup.enter="handleSearch"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
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
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item label="场景">
                  <el-select v-model="filters.collectScene" clearable placeholder="场景">
                    <el-option
                      v-for="item in catalog.scenes"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
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

                <template #configSlot="{ row }">
                  <span class="table-meta-text">{{ getTaskConfigSummary(row) }}</span>
                </template>

                <template #operationSlot="{ row }">
                  <div class="flex justify-start gap-3">
                    <el-button link type="primary" size="small" @click="handleTriggerTask(row)">
                      立即执行
                    </el-button>
                    <el-button link type="primary" size="small" @click="openTaskDialog(row)">
                      编辑
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

    <EcomCollectTaskDialog
      v-model="dialogVisible"
      :catalog="catalog"
      :task="currentTask"
      @success="handleDialogSuccess"
    />
  </ContentWrap>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import type { VxeGridProps } from "vxe-table";
import {
  batchDeleteEcomPlatformCollectTask,
  deleteEcomPlatformCollectTask,
  getEcomPlatformCollectCatalog,
  getEcomPlatformCollectTaskList,
  triggerEcomPlatformCollectTask,
  type EcomPlatformCollectTask,
} from "@/api/operation/ecomPlatformCollect";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import EcomCollectTaskDialog from "./components/EcomCollectTaskDialog.vue";
import {
  createEmptyEcomCollectCatalog,
  formatDateTime,
  getPlatformLabel,
  getSceneLabel,
} from "./shared";

defineOptions({ name: "EcomPlatformCollectTaskPage" });

const router = useRouter();
const loading = ref(false);
const dialogVisible = ref(false);
const currentTask = ref<EcomPlatformCollectTask | null>(null);
const list = ref<EcomPlatformCollectTask[]>([]);
const total = ref(0);
const selectedIds = ref<string[]>([]);

const catalog = reactive(createEmptyEcomCollectCatalog());

const filters = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: "",
  platform: "",
  collectScene: "",
});

const updateSelectedIds = (records: EcomPlatformCollectTask[] = []) => {
  selectedIds.value = Array.from(
    new Set(records.map((item) => String(item.id || "").trim()).filter(Boolean)),
  );
};

const getTaskConfigSummary = (task: EcomPlatformCollectTask) => {
  const config = task.configData || {};
  const keywords = Array.isArray(config.keywords) ? config.keywords.filter(Boolean) : [];
  const summaryParts = [
    config.keyword ? `关键词: ${config.keyword}` : "",
    !config.keyword && keywords.length ? `关键词: ${keywords.slice(0, 3).join(" / ")}` : "",
    config.targetUrl ? `链接: ${config.targetUrl}` : "",
    config.maxPages ? `页数: ${config.maxPages}` : "",
    config.maxItems ? `条数: ${config.maxItems}` : "",
  ].filter(Boolean);

  return summaryParts.join(" | ") || "按表单配置执行";
};

const gridOptions = ref<VxeGridProps<EcomPlatformCollectTask>>({
  ...(commonGridOptions as VxeGridProps<EcomPlatformCollectTask>),
  rowConfig: {
    ...(commonGridOptions as any).rowConfig,
    keyField: "id",
  },
  checkboxConfig: {
    reserve: true,
  },
  columns: [
    { type: "checkbox", width: 48 },
    { title: "任务名称", field: "name", minWidth: 220, showOverflow: "tooltip" },
    {
      title: "平台 / 场景",
      field: "platform",
      width: 160,
      slots: { default: "platformSceneSlot" },
    },
    {
      title: "采集配置",
      field: "configData",
      minWidth: 320,
      showOverflow: "tooltip",
      slots: { default: "configSlot" },
    },
    {
      title: "创建人",
      field: "creator",
      width: 120,
      formatter: ({ row }) => row.creator || "-",
    },
    {
      ...buildTimeColumn("更新时间", "updateTime", 180),
      formatter: ({ cellValue }) => formatDateTime(cellValue as string),
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
    const data = await getEcomPlatformCollectTaskList(filters);
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

const openTaskDialog = (task?: EcomPlatformCollectTask) => {
  currentTask.value = task || null;
  dialogVisible.value = true;
};

const handleDialogSuccess = async () => {
  currentTask.value = null;
  await loadData();
};

const handleSearch = async () => {
  filters.pageNo = 1;
  await loadList();
};

const handleReset = async () => {
  filters.pageNo = 1;
  filters.keyword = "";
  filters.platform = "";
  filters.collectScene = "";
  await loadList();
};

const handlePageChange = (page: number) => {
  filters.pageNo = page;
  void loadList();
};

const handleCheckboxChange = ({ records }: { records: EcomPlatformCollectTask[] }) => {
  updateSelectedIds(records);
};

const handleCheckboxAll = ({ records }: { records: EcomPlatformCollectTask[] }) => {
  updateSelectedIds(records);
};

const handleTriggerTask = async (row: EcomPlatformCollectTask) => {
  const result = await triggerEcomPlatformCollectTask(row.id);
  if (result?.success === false) {
    ElMessage.warning(result.message || "触发失败");
    if (result?.data?.runId) {
      await router.push("/ecom-platform-collect/runs");
    }
    return;
  }
  ElMessage.success(result?.message || "任务已触发");
  await router.push("/ecom-platform-collect/runs");
};

const handleDelete = async (row: EcomPlatformCollectTask) => {
  try {
    await ElMessageBox.confirm(
      `确认删除任务「${row.name}」吗？将同步删除关联运行记录、原始数据和截图文件。`,
      "提示",
      { type: "warning" },
    );
    await deleteEcomPlatformCollectTask(row.id);
    ElMessage.success("任务已删除");
    await loadList();
  } catch {}
};

const handleBatchDelete = async () => {
  if (!selectedIds.value.length) return;
  try {
    await ElMessageBox.confirm(
      `确认批量删除 ${selectedIds.value.length} 个任务吗？将同步清理关联运行记录、原始数据和截图文件。`,
      "提示",
      { type: "warning" },
    );
    await batchDeleteEcomPlatformCollectTask(selectedIds.value);
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
</style>
